
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';

const livestockSchema = z.object({
  entryDate: z.string().min(1, "تاريخ الإدخال مطلوب"),
  cost: z.coerce.number().min(0, "التكلفة التقديرية يجب أن تكون رقمًا موجبًا أو صفر"),
  
  isBatch: z.boolean(),
  tagId: z.string().nullish().transform(val => val ?? ''),
  quantity: z.coerce.number().positive("الكمية يجب أن تكون رقمًا موجبًا").optional(),
  livestockTypeId: z.string().min(1, "يجب تحديد نوع الحيوان"),
  breed: z.string().nullish().transform(val => val ?? ''),
  weight: z.coerce.number().positive("الوزن يجب أن يكون رقمًا موجبًا"),
  age: z.coerce.number().positive("العمر يجب أن يكون رقمًا موجبًا"),
  barnId: z.string().min(1, "يجب تحديد العنبر"),
}).refine(data => {
    if (data.isBatch) {
        return !!data.quantity && data.quantity > 0;
    }
    return true;
}, {
    message: "الكمية مطلوبة عند تسجيل دفعة",
    path: ["quantity"],
});

export type LivestockState = {
  errors?: z.ZodError<typeof livestockSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function updateLivestock(livestockId: string, prevState: LivestockState, formData: FormData): Promise<LivestockState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.id) {
    redirect('/login');
  }

  if (!session.user.permissions?.livestock?.edit) {
    return { message: 'ليس لديك الصلاحية لتعديل المواشي.', success: false };
  }

  const isBatch = formData.get('registrationType') === 'batch';
  
  const validatedFields = livestockSchema.safeParse({
    entryDate: formData.get('entryDate'),
    cost: formData.get('cost'),
    isBatch,
    tagId: formData.get('tagId'),
    quantity: formData.get('quantity'),
    livestockTypeId: formData.get('livestockTypeId'),
    breed: formData.get('breed'),
    weight: formData.get('weight'),
    age: formData.get('age'),
    barnId: formData.get('barnId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة. يرجى مراجعة الحقول.',
      success: false,
    };
  }

  const { entryDate, barnId, ...livestockData } = validatedFields.data;

  try {
    const originalLivestock = await prisma.livestock.findUnique({ where: { id: livestockId } });
    if (!originalLivestock) {
        return { message: 'الحيوان غير موجود.', success: false };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Revert barn occupancy if barn or quantity changes
      const occupancyNeeded = livestockData.quantity || 1;
      const originalOccupancy = originalLivestock.quantity || 1;

      if (originalLivestock.barnId !== barnId || originalOccupancy !== occupancyNeeded) {
        // Decrement from old barn
        await tx.barn.update({
          where: { id: originalLivestock.barnId },
          data: { currentOccupancy: { decrement: originalOccupancy } }
        });

        // Check new barn capacity and increment
        const newBarn = await tx.barn.findUnique({ where: { id: barnId } });
        if (!newBarn || newBarn.capacity - newBarn.currentOccupancy < occupancyNeeded) {
          throw new Error('سعة العنبر الجديد غير كافية.');
        }
        await tx.barn.update({
          where: { id: barnId },
          data: { currentOccupancy: { increment: occupancyNeeded } }
        });
      }

      // 2. Update Livestock record
      const updatedLivestock = await tx.livestock.update({
        where: { id: livestockId },
        data: {
          ...livestockData,
          barnId,
          createdAt: new Date(entryDate),
        }
      });

      // 3. Create Log entry
      await tx.log.create({
        data: {
          userId: session.user!.id,
          action: 'UPDATE',
          entityType: 'LIVESTOCK',
          entityId: updatedLivestock.id,
          details: `تعديل بيانات الماشية: ${updatedLivestock.tagId || `دفعة (${updatedLivestock.quantity})`}`
        }
      });
    });

    revalidatePath('/livestock');
    revalidatePath('/dashboard');
    revalidatePath('/barns');
    return { message: 'تم تعديل بيانات الماشية بنجاح!', success: true };

  } catch (error: any) {
    console.error('Error updating livestock:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { message: `فشل في التعديل: الرقم التعريفي '${validatedFields.data.tagId}' مستخدم بالفعل.`, success: false };
    }
    return { message: error.message || 'فشل في تعديل بيانات الماشية. حدث خطأ غير متوقع.', success: false };
  }
}


export async function deleteLivestock(livestockId: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.id) {
        return { message: 'جلسة غير صالحة.', success: false };
    }
    if (!session.user.permissions?.livestock?.delete) {
        return { message: 'ليس لديك الصلاحية لحذف المواشي.', success: false };
    }

    try {
        const livestockToDelete = await prisma.livestock.findUnique({
            where: { id: livestockId },
            include: { sales: true }
        });
        if (!livestockToDelete) {
            return { message: 'الماشية غير موجودة.', success: false };
        }
        
        // This action is only for opening balance livestock, which should have no purchase or vow.
        if (livestockToDelete.purchaseId || livestockToDelete.vowId) {
            return { message: 'لا يمكن حذف الماشية من هنا، يجب حذفها من سجل الشراء أو النذر الأصلي.', success: false };
        }

        // Check if it's involved in any sale (even draft)
        if (livestockToDelete.sales && livestockToDelete.sales.length > 0) {
            return { message: 'لا يمكن الحذف. هذا الحيوان مرتبط بعملية بيع. يرجى إلغاء البيع أولاً.', success: false };
        }
        

        await prisma.$transaction(async (tx) => {
            // 1. Decrement barn occupancy
            const occupancyToDecrement = livestockToDelete.quantity || 1;
            await tx.barn.update({
                where: { id: livestockToDelete.barnId },
                data: { currentOccupancy: { decrement: occupancyToDecrement } }
            });

            // 2. Delete livestock record
            await tx.livestock.delete({ where: { id: livestockId } });

            // 3. Log deletion
             await tx.log.create({
                data: {
                    userId: session.user!.id,
                    action: 'DELETE',
                    entityType: 'LIVESTOCK',
                    entityId: livestockToDelete.id,
                    details: `حذف الماشية (رصيد افتتاحي): ${livestockToDelete.tagId || `دفعة (${livestockToDelete.quantity})`}`
                }
            });
        });

        revalidatePath('/livestock');
        revalidatePath('/dashboard');
        revalidatePath('/barns');
        return { message: 'تم حذف الماشية بنجاح.', success: true };
    } catch (error: any) {
        console.error('Error deleting livestock:', error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
             return { message: 'فشل الحذف. هذا الحيوان مرتبط بسجلات أخرى (مثل المبيعات).', success: false };
        }
        return { message: error.message || 'فشل في حذف الماشية.', success: false };
    }
}

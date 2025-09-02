
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';

const openingBalanceSchema = z.object({
  entryDate: z.string().min(1, "تاريخ الإدخال مطلوب"),
  estimatedCost: z.coerce.number().min(0, "التكلفة التقديرية يجب أن تكون رقمًا موجبًا أو صفر"),
  notes: z.string().nullish().transform(val => val ?? ''),
  
  // Livestock fields
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


type OpeningBalanceState = {
  errors?: z.ZodError<typeof openingBalanceSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function createOpeningBalanceLivestock(prevState: OpeningBalanceState, formData: FormData): Promise<OpeningBalanceState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user) {
    redirect('/login');
  }
  
  // Opening balance is part of livestock management
  if (!session.user.permissions?.livestock?.add) {
    return { message: 'ليس لديك الصلاحية لإضافة أرصدة افتتاحية.', success: false };
  }

  const isBatch = formData.get('registrationType') === 'batch';
  
  const validatedFields = openingBalanceSchema.safeParse({
    entryDate: formData.get('entryDate'),
    estimatedCost: formData.get('estimatedCost'),
    notes: formData.get('notes'),
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

  const { entryDate, estimatedCost, notes, barnId, ...livestockData } = validatedFields.data;

  try {
    const occupancyNeeded = livestockData.quantity || 1;
    const barn = await prisma.barn.findUnique({ where: { id: barnId } });
    if (!barn || barn.capacity - barn.currentOccupancy < occupancyNeeded) {
        return { message: 'سعة العنبر المحددة غير كافية.', success: false };
    }
      
    await prisma.$transaction(async (tx) => {
      // 1. Create Livestock record
      const livestock = await tx.livestock.create({
        data: {
          ...livestockData,
          barnId,
          status: 'Available', // Set as available immediately
          cost: estimatedCost,
          createdAt: new Date(entryDate),
          // No purchase or vow link
        }
      });

      // 2. Update barn occupancy
      await tx.barn.update({
        where: { id: barnId },
        data: { currentOccupancy: { increment: occupancyNeeded } },
      });

      // 3. Create Log entry
      await tx.log.create({
        data: {
          userId: session.user!.id,
          action: 'CREATE',
          entityType: 'LIVESTOCK',
          entityId: livestock.id,
          details: `إدخال رصيد افتتاحي: ${livestock.tagId || `دفعة (${livestock.quantity})`}. ملاحظات: ${notes || 'لا يوجد'}`
        }
      });
    });

    revalidatePath('/dashboard');
    revalidatePath('/barns');
    revalidatePath('/livestock');
    return { message: 'تم إدخال الرصيد الافتتاحي بنجاح!', success: true };

  } catch (error) {
    console.error('Error creating opening balance livestock:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('tagId')) {
             return { message: `فشل في الإدخال: الرقم التعريفي '${validatedFields.data.tagId}' مستخدم بالفعل.`, success: false };
        }
        return { message: `فشل في الإدخال: ${error.message}`, success: false };
    }
     if (error instanceof Prisma.PrismaClientValidationError) {
        return { message: `فشل في التحقق من صحة البيانات: ${error.message}`, success: false };
    }
    return { message: 'فشل في إدخال الرصيد الافتتاحي. حدث خطأ غير متوقع.', success: false };
  }
}

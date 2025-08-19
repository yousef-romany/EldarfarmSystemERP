
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';

const vowSchema = z.object({
  donorName: z.string().min(1, "اسم الناذر مطلوب"),
  receiptId: z.string().optional(),
  date: z.string().min(1, "تاريخ الاستلام مطلوب"),
  notes: z.string().optional(),
  
  // Livestock fields
  isBatch: z.boolean(),
  tagId: z.string().optional(),
  quantity: z.coerce.number().optional(),
  livestockTypeId: z.string().min(1, "يجب تحديد نوع الحيوان"),
  breed: z.string().min(1, "السلالة مطلوبة"),
  weight: z.coerce.number().positive("الوزن يجب أن يكون رقمًا موجبًا"),
  age: z.coerce.number().positive("العمر يجب أن يكون رقمًا موجبًا"),
  barnId: z.string().min(1, "يجب تحديد العنبر"),
});

type VowState = {
  errors?: z.ZodError<typeof vowSchema>['formErrors']['fieldErrors'];
  message?: string | null;
  success?: boolean;
}

export async function createVow(prevState: VowState, formData: FormData): Promise<VowState> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect('/');
  }

  if (!session.permissions?.vows?.add) {
    return { message: 'ليس لديك الصلاحية لتسجيل النذور.', success: false };
  }

  const isBatch = formData.get('registrationType') === 'batch';
  
  const validatedFields = vowSchema.safeParse({
    donorName: formData.get('donorName'),
    receiptId: formData.get('receiptId'),
    date: formData.get('vowDate'),
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

  const { donorName, receiptId, date, notes, barnId, ...livestockData } = validatedFields.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Livestock record
      const livestock = await tx.livestock.create({
        data: {
          ...livestockData,
          status: 'Vowed', // Set status for vowed animals
        }
      });

      // 2. Create Vow record
      const vow = await tx.vow.create({
        data: {
          donorName,
          receiptId,
          date: new Date(date),
          notes,
          livestockId: livestock.id,
        }
      });

      // 3. Update barn occupancy
      await tx.barn.update({
        where: { id: barnId },
        data: { currentOccupancy: { increment: livestockData.quantity || 1 } },
      });

      // 4. Create Log entry
      await tx.log.create({
        data: {
          userId: session.userId!,
          action: 'CREATE',
          entityType: 'VOW',
          entityId: vow.id,
          details: `تسجيل نذر جديد من ${donorName} للحيوان/الدفعة ${livestock.tagId || livestock.id}.`
        }
      });
    });

    revalidatePath('/vows');
    revalidatePath('/dashboard');
    return { message: 'تم تسجيل النذر بنجاح!', success: true };

  } catch (error) {
    console.error('Error creating vow:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('tagId')) {
             return { message: `فشل في تسجيل النذر: الرقم التعريفي '${validatedFields.data.tagId}' مستخدم بالفعل.`, success: false };
        }
        return { message: `فشل في تسجيل النذر: ${error.message}`, success: false };
    }
    return { message: 'فشل في تسجيل النذر. حدث خطأ غير متوقع.', success: false };
  }
}

export async function getVowById(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn) {
        redirect('/');
    }

    try {
        const vow = await prisma.vow.findUnique({
            where: { id },
            include: {
                livestock: {
                    include: {
                        livestockType: true,
                        barn: true,
                    }
                }
            }
        });
        return vow;
    } catch (error) {
        console.error("Failed to get vow by ID:", error);
        return null;
    }
}


export async function deleteVow(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.permissions?.vows?.delete) {
        return { message: 'ليس لديك الصلاحية لحذف النذور.', success: false };
    }

    try {
        const vow = await prisma.vow.findUnique({
            where: { id },
            include: { livestock: true }
        });

        if (!vow) {
            return { message: 'النذر غير موجود.', success: false };
        }

        // A vowed animal cannot be part of a sale, so we don't need to check for that.
        // We just need to delete the vow and the associated livestock record.

        await prisma.$transaction(async (tx) => {
            // 1. Delete the Vow record
            await tx.vow.delete({ where: { id } });

            // 2. Delete the associated Livestock record
            await tx.livestock.delete({ where: { id: vow.livestockId } });

            // 3. Update barn occupancy
            await tx.barn.update({
                where: { id: vow.livestock.barnId },
                data: { currentOccupancy: { decrement: vow.livestock.quantity || 1 } }
            });

            // 4. Log the deletion
            await tx.log.create({
                data: {
                    userId: session.userId!,
                    action: 'DELETE',
                    entityType: 'VOW',
                    entityId: id,
                    details: `قام بحذف النذر من ${vow.donorName} مع الحيوان المرتبط به.`
                }
            });
        });

        revalidatePath('/vows');
        revalidatePath('/dashboard');
        revalidatePath('/barns');
        return { message: 'تم حذف النذر والحيوان المرتبط به بنجاح.', success: true };

    } catch (error) {
        console.error('Error deleting vow:', error);
        return { message: 'فشل في حذف النذر.', success: false };
    }
}

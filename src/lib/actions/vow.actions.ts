
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
  breed: z.string().optional(),
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
  if (!session.isLoggedIn || !session.user) {
    redirect('/login');
  }

  if (!session.user.permissions?.vows?.add) {
    return { message: 'ليس لديك الصلاحية لتسجيل النذور.', success: false };
  }

  const isBatch = formData.get('registrationType') === 'batch';
  
  const validatedFields = vowSchema.safeParse({
    donorName: formData.get('donorName'),
    receiptId: formData.get('receiptId'),
    date: formData.get('date'),
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
          barnId,
          status: 'Vowed',
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
          userId: session.user.id,
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
     if (error instanceof Prisma.PrismaClientValidationError) {
        return { message: `فشل في التحقق من صحة البيانات: ${error.message}`, success: false };
    }
    return { message: 'فشل في تسجيل النذر. حدث خطأ غير متوقع.', success: false };
  }
}

export async function updateVow(vowId: string, prevState: VowState, formData: FormData): Promise<VowState> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      redirect('/login');
    }
    if (!session.user.permissions?.vows?.edit) {
        return { message: 'ليس لديك الصلاحية لتعديل النذور.', success: false };
    }
    
    const isBatch = formData.get('registrationType') === 'batch';
    const validatedFields = vowSchema.safeParse({
        donorName: formData.get('donorName'),
        receiptId: formData.get('receiptId'),
        date: formData.get('date'),
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
        return { errors: validatedFields.error.flatten().fieldErrors, message: 'بيانات غير صالحة.', success: false };
    }

    const { donorName, receiptId, date, notes, barnId, ...livestockData } = validatedFields.data;

    try {
        await prisma.$transaction(async (tx) => {
            const originalVow = await tx.vow.findUnique({
                where: { id: vowId },
                include: { livestock: true }
            });

            if (!originalVow) throw new Error("Vow not found");

            const originalLivestock = originalVow.livestock;

            // Revert barn occupancy change if barn is different
            if (originalLivestock.barnId !== barnId) {
                 await tx.barn.update({
                    where: { id: originalLivestock.barnId },
                    data: { currentOccupancy: { decrement: originalLivestock.quantity || 1 } }
                });
                 await tx.barn.update({
                    where: { id: barnId },
                    data: { currentOccupancy: { increment: livestockData.quantity || 1 } }
                });
            }

            // Update livestock record
            const updatedLivestock = await tx.livestock.update({
                where: { id: originalLivestock.id },
                data: {
                    ...livestockData,
                    barnId,
                    status: 'Vowed'
                }
            });

            // Update vow record
            await tx.vow.update({
                where: { id: vowId },
                data: {
                    donorName,
                    receiptId,
                    date: new Date(date),
                    notes,
                }
            });

            // Log the update
            await tx.log.create({
                data: {
                    userId: session.user.id,
                    action: 'UPDATE',
                    entityType: 'VOW',
                    entityId: vowId,
                    details: `تعديل بيانات النذر من ${donorName}.`
                }
            });
        });

        revalidatePath('/vows');
        revalidatePath(`/vows/edit/${vowId}`);
        revalidatePath('/dashboard');
        return { message: "تم تحديث النذر بنجاح!", success: true };
    } catch (error) {
        console.error("Error updating vow:", error);
        return { message: "فشل في تحديث النذر.", success: false };
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

        if (!vow) return null;

        // Serialize Decimal fields
        return {
          ...vow,
          livestock: {
            ...vow.livestock,
            weight: vow.livestock.weight.toNumber(),
            cost: vow.livestock.cost.toNumber()
          }
        }
    } catch (error) {
        console.error("Failed to get vow by ID:", error);
        return null;
    }
}


export async function deleteVow(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
        redirect('/login');
    }
    if (!session.user.permissions?.vows?.delete) {
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
                    userId: session.user.id,
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

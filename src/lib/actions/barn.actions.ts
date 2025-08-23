
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const barnSchema = z.object({
  name: z.string().min(1, 'اسم العنبر مطلوب'),
  capacity: z.coerce.number().int().positive('السعة يجب أن تكون رقمًا موجبًا'),
});

type BarnState = {
  errors?: {
    name?: string[];
    capacity?: string[];
  };
  message?: string | null;
  success?: boolean;
}

export async function createBarn(prevState: BarnState, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.permissions?.barns?.add) {
    redirect('/');
  }

  const validatedFields = barnSchema.safeParse({
    name: formData.get('name'),
    capacity: formData.get('capacity'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة.',
      success: false,
    };
  }

  const { name, capacity } = validatedFields.data;

  try {
    const barn = await prisma.barn.create({
      data: {
        name,
        capacity,
        currentOccupancy: 0,
      },
    });

    await prisma.log.create({
        data: {
            userId: session.user.id,
            action: 'CREATE',
            entityType: 'BARN',
            entityId: barn.id,
            details: `أنشأ عنبر جديد باسم: ${name}`
        }
    });

    revalidatePath('/barns');
    return { message: 'تم إضافة العنبر بنجاح!', success: true };
  } catch (error) {
    console.error('Error creating barn:', error);
    return { message: 'فشل في إضافة العنبر.', success: false };
  }
}


export async function updateBarn(id: string, prevState: BarnState, formData: FormData) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.permissions?.barns?.edit) {
        redirect('/');
    }

    const validatedFields = barnSchema.safeParse({
        name: formData.get('name'),
        capacity: formData.get('capacity'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'بيانات غير صالحة.',
            success: false,
        };
    }
    
    const { name, capacity } = validatedFields.data;

    try {
        const barn = await prisma.barn.update({
            where: { id },
            data: {
                name,
                capacity,
            },
        });

         await prisma.log.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE',
                entityType: 'BARN',
                entityId: barn.id,
                details: `قام بتعديل بيانات العنبر: ${name}`
            }
        });


        revalidatePath('/barns');
        return { message: 'تم تعديل العنبر بنجاح!', success: true };
    } catch (error) {
        console.error('Error updating barn:', error);
        return { message: 'فشل في تعديل العنبر.', success: false };
    }
}


export async function deleteBarn(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.permissions?.barns?.delete) {
        redirect('/');
    }
    
    try {
        // First, check if the barn has any livestock.
        const barn = await prisma.barn.findUnique({
            where: { id },
            include: { livestock: true }
        });

        if (barn?.livestock && barn.livestock.length > 0) {
            return {
                message: 'لا يمكن حذف العنبر لأنه يحتوي على مواشٍ. يرجى نقل المواشي أولاً.',
                success: false,
            };
        }

        await prisma.barn.delete({
            where: { id },
        });

        await prisma.log.create({
            data: {
                userId: session.user.id,
                action: 'DELETE',
                entityType: 'BARN',
                entityId: id,
                details: `قام بحذف العنبر: ${barn?.name}`
            }
        });

        revalidatePath('/barns');
        return { message: 'تم حذف العنبر بنجاح!', success: true };
    } catch (error) {
        console.error('Error deleting barn:', error);
        return { message: 'فشل في حذف العنبر.', success: false };
    }
}

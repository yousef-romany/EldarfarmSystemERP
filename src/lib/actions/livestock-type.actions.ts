
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const livestockTypeSchema = z.object({
  name: z.string().min(1, 'اسم النوع مطلوب'),
});

type LivestockTypeState = {
  errors?: {
    name?: string[];
  };
  message?: string | null;
  success?: boolean;
}

export async function createLivestockType(prevState: LivestockTypeState, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user) {
    redirect('/login');
  }

  if (!session.user.permissions?.livestockTypes?.add) {
    return { message: 'ليس لديك الصلاحية لإضافة أنواع المواشي.', success: false };
  }

  const validatedFields = livestockTypeSchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة.',
      success: false,
    };
  }

  const { name } = validatedFields.data;

  try {
    const livestockType = await prisma.livestockType.create({
      data: {
        name,
      },
    });

    await prisma.log.create({
        data: {
            userId: session.user.id,
            action: 'CREATE',
            entityType: 'LIVESTOCK_TYPE',
            entityId: livestockType.id,
            details: `أنشأ نوع مواشٍ جديد باسم: ${name}`
        }
    });

    revalidatePath('/livestock-types');
    return { message: 'تم إضافة النوع بنجاح!', success: true };
  } catch (error) {
    console.error('Error creating livestock type:', error);
    return { message: 'فشل في إضافة النوع.', success: false };
  }
}


export async function updateLivestockType(id: string, prevState: LivestockTypeState, formData: FormData) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
        redirect('/login');
    }

    if (!session.user.permissions?.livestockTypes?.edit) {
      return { message: 'ليس لديك الصلاحية لتعديل أنواع المواشي.', success: false };
    }

    const validatedFields = livestockTypeSchema.safeParse({
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'بيانات غير صالحة.',
            success: false,
        };
    }
    
    const { name } = validatedFields.data;

    try {
        const livestockType = await prisma.livestockType.update({
            where: { id },
            data: {
                name,
            },
        });

         await prisma.log.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE',
                entityType: 'LIVESTOCK_TYPE',
                entityId: livestockType.id,
                details: `قام بتعديل بيانات نوع المواشي: ${name}`
            }
        });

        revalidatePath('/livestock-types');
        return { message: 'تم تعديل النوع بنجاح!', success: true };
    } catch (error) {
        console.error('Error updating livestock type:', error);
        return { message: 'فشل في تعديل النوع.', success: false };
    }
}


export async function deleteLivestockType(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
        redirect('/login');
    }
    
    if (!session.user.permissions?.livestockTypes?.delete) {
      return { message: 'ليس لديك الصلاحية لحذف أنواع المواشي.', success: false };
    }
    
    try {
        const type = await prisma.livestockType.findUnique({
            where: { id },
            include: { livestock: true }
        });

        if (type?.livestock && type.livestock.length > 0) {
            return {
                message: 'لا يمكن حذف هذا النوع لأنه مستخدم في سجلات المواشي.',
                success: false,
            };
        }

        await prisma.livestockType.delete({
            where: { id },
        });

        await prisma.log.create({
            data: {
                userId: session.user.id,
                action: 'DELETE',
                entityType: 'LIVESTOCK_TYPE',
                entityId: id,
                details: `قام بحذف نوع المواشي: ${type?.name}`
            }
        });

        revalidatePath('/livestock-types');
        return { message: 'تم حذف النوع بنجاح!', success: true };
    } catch (error) {
        console.error('Error deleting type:', error);
        return { message: 'فشل في حذف النوع.', success: false };
    }
}

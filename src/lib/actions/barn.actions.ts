
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

export async function createBarn(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect('/');
  }

  if (!session.permissions?.barns?.add) {
    return {
      message: 'ليس لديك الصلاحية لإضافة عنبر جديد.',
      success: false,
    };
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
            userId: session.userId!,
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

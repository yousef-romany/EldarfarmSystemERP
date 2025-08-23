
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const walletSchema = z.object({
  name: z.string().min(1, 'اسم المحفظة مطلوب'),
  balance: z.coerce.number().optional().default(0),
  icon: z.string().min(1, 'يجب اختيار نوع المحفظة'),
});

const updateWalletSchema = walletSchema.omit({ balance: true }); // Cannot update balance directly from edit form

type WalletState = {
  errors?: {
    name?: string[];
    balance?: string[];
    icon?: string[];
  };
  message?: string | null;
  success?: boolean;
}

export async function createWallet(prevState: WalletState, formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    redirect('/');
  }

  if (!session.permissions?.wallets?.add) {
    return {
      message: 'ليس لديك الصلاحية لإضافة محافظ جديدة.',
      success: false,
    };
  }

  const validatedFields = walletSchema.safeParse({
    name: formData.get('name'),
    balance: formData.get('balance'),
    icon: formData.get('icon'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'بيانات غير صالحة.',
      success: false,
    };
  }

  const { name, balance, icon } = validatedFields.data;

  try {
    const wallet = await prisma.wallet.create({
      data: {
        name,
        balance,
        icon,
      },
    });

    await prisma.log.create({
        data: {
            userId: session.userId,
            action: 'CREATE',
            entityType: 'WALLET',
            entityId: wallet.id,
            details: `أنشأ محفظة جديدة باسم: ${name} برصيد افتتاحي: ${balance}`
        }
    });

    revalidatePath('/wallets');
    revalidatePath('/daily-report');
    return { message: 'تم إضافة المحفظة بنجاح!', success: true };
  } catch (error) {
    console.error('Error creating wallet:', error);
    return { message: 'فشل في إضافة المحفظة.', success: false };
  }
}


export async function updateWallet(id: string, prevState: WalletState, formData: FormData) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
        redirect('/');
    }

    if (!session.permissions?.wallets?.edit) {
        return {
            message: 'ليس لديك الصلاحية لتعديل المحافظ.',
            success: false,
        };
    }

    const validatedFields = updateWalletSchema.safeParse({
        name: formData.get('name'),
        icon: formData.get('icon'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'بيانات غير صالحة.',
            success: false,
        };
    }
    
    const { name, icon } = validatedFields.data;

    try {
        const wallet = await prisma.wallet.update({
            where: { id },
            data: {
                name,
                icon,
            },
        });

         await prisma.log.create({
            data: {
                userId: session.userId,
                action: 'UPDATE',
                entityType: 'WALLET',
                entityId: wallet.id,
                details: `قام بتعديل بيانات المحفظة: ${name}`
            }
        });


        revalidatePath('/wallets');
        revalidatePath('/daily-report');
        return { message: 'تم تعديل المحفظة بنجاح!', success: true };
    } catch (error) {
        console.error('Error updating wallet:', error);
        return { message: 'فشل في تعديل المحفظة.', success: false };
    }
}


export async function deleteWallet(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
        redirect('/');
    }
    
    if (!session.permissions?.wallets?.delete) {
        return {
            message: 'ليس لديك الصلاحية لحذف المحافظ.',
            success: false,
        };
    }
    
    try {
        const wallet = await prisma.wallet.findUnique({
            where: { id },
            include: { payments: true }
        });

        if (wallet?.payments && wallet.payments.length > 0) {
            return {
                message: 'لا يمكن حذف المحفظة لأنها تحتوي على معاملات مالية مسجلة.',
                success: false,
            };
        }

        await prisma.wallet.delete({
            where: { id },
        });

        await prisma.log.create({
            data: {
                userId: session.userId,
                action: 'DELETE',
                entityType: 'WALLET',
                entityId: id,
                details: `قام بحذف المحفظة: ${wallet?.name}`
            }
        });

        revalidatePath('/wallets');
        revalidatePath('/daily-report');
        return { message: 'تم حذف المحفظة بنجاح!', success: true };
    } catch (error) {
        console.error('Error deleting wallet:', error);
        return { message: 'فشل في حذف المحفظة.', success: false };
    }
}

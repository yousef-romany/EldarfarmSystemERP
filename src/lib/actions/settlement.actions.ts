
'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

type SettlementState = {
  message: string;
  success: boolean;
};

export async function settleDay(): Promise<SettlementState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.id) {
    return {
      message: 'غير مصرح لك بالقيام بهذه العملية.',
      success: false,
    };
  }
  
  // This is a highly sensitive action, restrict it to ADMINs or a specific role if needed
  if (!session.user.permissions?.reports?.confirm) {
      return {
          message: 'ليس لديك الصلاحية اللازمة لتنفيذ عملية التسوية.',
          success: false,
      };
  }

  try {
    const totalSettled = await prisma.$transaction(async (tx) => {
      // 1. Get all current wallets and their balances
      const wallets = await tx.wallet.findMany();
      if (wallets.length === 0) {
        throw new Error("لا توجد محافظ لتسويتها.");
      }
      
      const totalToSettle = wallets.reduce((sum, wallet) => sum + wallet.balance.toNumber(), 0);

      if (totalToSettle === 0) {
        throw new Error("لا توجد أرصدة لتسويتها.");
      }

      // 2. Create a settlement record
      const settlement = await tx.settlement.create({
        data: {
          settledById: session.user.id,
          amount: totalToSettle,
          details: wallets.map(w => ({ name: w.name, balance: w.balance.toNumber() })),
        },
      });

      // 3. Reset all wallet balances to zero
      await tx.wallet.updateMany({
        data: {
          balance: 0,
        },
      });

      // 4. Log the settlement action
      await tx.log.create({
        data: {
          userId: session.user.id,
          action: 'CREATE',
          entityType: 'SETTLEMENT',
          entityId: settlement.id,
          details: `قام بتسوية اليومية بمبلغ إجمالي قدره: ${totalToSettle.toLocaleString()}`,
        },
      });

      return totalToSettle;
    });

    revalidatePath('/settlement');
    revalidatePath('/wallets');
    revalidatePath('/daily-report');

    return {
      message: `تمت تسوية اليومية بنجاح! تم تصفير جميع الأرصدة بمبلغ إجمالي قدره ${totalSettled.toLocaleString()} ج.م.`,
      success: true,
    };
  } catch (error: any) {
    console.error("Failed to settle day:", error);
    return {
      message: `فشلت عملية التسوية: ${error.message}`,
      success: false,
    };
  }
}

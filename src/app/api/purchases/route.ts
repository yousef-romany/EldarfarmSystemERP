
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const purchasesData = await prisma.purchase.findMany({ 
      orderBy: { purchaseDate: 'desc' },
      include: { 
        livestock: { 
          include: { 
            livestockType: true, 
            barn: true 
          } 
        },
        payments: {
          include: {
            wallet: true
          }
        }
      }
    });

    // Values are already numbers, no need to convert
    const purchases = purchasesData.map(p => ({
      ...p,
      totalCost: p.totalCost,
      amountPaid: p.amountPaid,
      remainingAmount: p.remainingAmount,
      livestock: {
        ...p.livestock,
        weight: p.livestock.weight,
        cost: p.livestock.cost,
      },
      payments: p.payments.map(payment => ({
        ...payment,
        amount: payment.amount,
        wallet: {
          ...payment.wallet,
          balance: payment.wallet.balance,
        }
      }))
    }));

    return NextResponse.json(purchases);

  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

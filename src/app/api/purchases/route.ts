
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

    // Serialize Decimal fields
    const purchases = purchasesData.map(p => ({
      ...p,
      totalCost: p.totalCost.toNumber(),
      amountPaid: p.amountPaid.toNumber(),
      remainingAmount: p.remainingAmount.toNumber(),
      livestock: {
        ...p.livestock,
        weight: p.livestock.weight.toNumber(),
        cost: p.livestock.cost.toNumber(),
      },
      payments: p.payments.map(payment => ({
        ...payment,
        amount: payment.amount.toNumber(),
        wallet: {
          ...payment.wallet,
          balance: payment.wallet.balance.toNumber(),
        }
      }))
    }));

    return NextResponse.json(purchases);

  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

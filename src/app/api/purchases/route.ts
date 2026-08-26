
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { PerformanceMonitor } from '@/lib/performance';

export async function GET(request: Request) {
  const endTimer = PerformanceMonitor.startTimer('api:purchases:list');
  
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const purchasesData = await prisma.purchase.findMany({
      orderBy: { purchaseDate: 'desc' },
      include: {
        livestock: {
          select: {
            id: true,
            tagId: true,
            isBatch: true,
            quantity: true,
            weight: true,
            cost: true,
            livestockType: {
              select: {
                id: true,
                name: true,
              }
            },
            barn: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            date: true,
            wallet: {
              select: {
                id: true,
                name: true,
                balance: true,
              }
            }
          }
        }
      },
      take: 100, // Limit results for better performance
    });

    const purchases = purchasesData.map(p => ({
      ...p,
      totalCost: p.totalCost,
      amountPaid: p.amountPaid,
      remainingAmount: p.remainingAmount,
      livestock: p.livestock ? { // Check if livestock exists
        ...p.livestock,
        weight: p.livestock.weight,
        cost: p.livestock.cost,
      } : { // Provide a fallback structure if it doesn't
          ...(p.livestockData as any),
          id: p.id, // use purchase id as a key fallback
          livestockType: { name: (p.livestockData as any)?.breed || 'N/A' },
          barn: { name: 'N/A' },
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

    endTimer();
    return NextResponse.json(purchases, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });

  } catch (error) {
    endTimer();
    console.error('Failed to fetch purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { PerformanceMonitor } from '@/lib/performance';

export async function GET(request: Request) {
  const endTimer = PerformanceMonitor.startTimer('api:sales:list');
  
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const salesData = await prisma.sale.findMany({
      orderBy: { saleDate: 'desc' },
      include: {
        livestock: {
          select: {
            tagId: true,
            isBatch: true,
            quantity: true,
            id: true,
          }
        }
      },
      take: 100, // Limit results for better performance
    });

    // Values are already numbers, no need to convert
    const sales = salesData.map(s => ({
      ...s,
      pricePerKg: s.pricePerKg,
      totalPrice: s.totalPrice,
      amountPaid: s.amountPaid,
      remainingAmount: s.remainingAmount,
      initialWeight: s.initialWeight ?? 0,
      finalWeight: s.finalWeight ?? null,
    }));

    endTimer();
    return NextResponse.json(sales, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });

  } catch (error) {
    endTimer();
    console.error('Failed to fetch sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

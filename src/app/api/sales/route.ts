
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const salesData = await prisma.sale.findMany({
      orderBy: { saleDate: 'desc' },
      include: {
        livestock: {
          select: { tagId: true, isBatch: true, quantity: true }
        }
      }
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

    return NextResponse.json(sales);

  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

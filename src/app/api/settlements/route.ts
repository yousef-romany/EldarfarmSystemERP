
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.id || !session.user.permissions?.reports?.view) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settlements = await prisma.settlement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        settledBy: {
          select: { username: true },
        },
      },
    });

    const serializedSettlements = settlements.map(s => ({
      ...s,
      amount: s.amount.toNumber(),
      details: s.details, // Prisma JSON field is already serialized
    }));

    return NextResponse.json(serializedSettlements);
  } catch (error) {
    console.error('Failed to fetch settlements:', error);
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}

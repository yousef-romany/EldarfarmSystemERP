
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

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
      amount: s.amount,
      details: s.details, 
    }));

    return NextResponse.json(serializedSettlements);
  } catch (error: any) {
    console.error('Failed to fetch settlements:', error);
    return NextResponse.json({ error: 'Failed to fetch settlements: ' + error.message }, { status: 500 });
  }
}

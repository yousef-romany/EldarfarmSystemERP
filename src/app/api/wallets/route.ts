
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const wallets = await prisma.wallet.findMany({
      orderBy: { name: 'asc' },
    });

    // Values are already numbers, no need for serialization
    const serializedWallets = wallets.map(w => ({
        ...w,
        balance: w.balance
    }));

    return NextResponse.json(serializedWallets);
  } catch (error) {
    console.error('Failed to fetch wallets:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}

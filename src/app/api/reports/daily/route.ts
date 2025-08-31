
'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const targetDate = new Date(dateParam);
    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);
    
    // Find the cash wallet dynamically
    const cashWallet = await prisma.wallet.findFirst({
        where: { icon: 'cash' }
    });

    // Fetch all wallets' current balances
    const wallets = await prisma.wallet.findMany();
    
    // Fetch COMPLETED payments for the given day
    const payments = await prisma.payment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { sale: { status: 'Completed' } },
          { purchase: { status: 'Completed' } },
          { expenseId: { not: null } },
          { contributionId: { not: null } },
        ]
      },
      include: {
        expense: true,
        sale: true,
        contribution: true,
        purchase: true
      }
    });

    const cashPayments = cashWallet ? payments.filter(p => p.walletId === cashWallet.id) : [];

    const inflows = cashPayments.filter(p => p.type === 'Income');
    const outflows = cashPayments.filter(p => p.type === 'Expense');

    const totalIn = inflows.reduce((sum, p) => sum + p.amount, 0);
    const totalOut = outflows.reduce((sum, p) => sum + p.amount, 0);
    const netChange = totalIn - totalOut;

    const formattedInflows = inflows.map(p => {
        let type = 'غير معروف';
        if (p.saleId) type = 'بيع';
        if (p.contributionId) type = 'نذر حى نقدى';
        return { type, description: p.description || '', amount: p.amount };
    });

    const formattedOutflows = outflows.map(p => {
        let type = 'غير معروف';
        if (p.expenseId) type = 'مصروف';
        if (p.purchaseId) type = 'شراء';
        return { type, description: p.description || '', amount: p.amount };
    });

    const responseData = {
      wallets: wallets.map(w => ({ ...w, balance: w.balance })),
      cashWalletId: cashWallet?.id || null,
      cashFlow: {
        totalIn,
        totalOut,
        netChange,
      },
      transactions: {
        inflows: formattedInflows,
        outflows: formattedOutflows,
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to generate daily report:', error);
    return NextResponse.json({ error: 'Failed to generate daily report' }, { status: 500 });
  }
}


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
    const cashWalletId = "w5"; // Define your cash wallet ID here, ideally from config

    // Fetch all wallets' current balances
    const wallets = await prisma.wallet.findMany();
    
    // Fetch payments for the given day
    const payments = await prisma.payment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        expense: true,
        sale: true,
        contribution: true,
        purchase: true
      }
    });

    const cashPayments = payments.filter(p => p.walletId === cashWalletId);

    const inflows = cashPayments.filter(p => p.type === 'Income');
    const outflows = cashPayments.filter(p => p.type === 'Expense');

    const totalIn = inflows.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const totalOut = outflows.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const netChange = totalIn - totalOut;

    const formattedInflows = inflows.map(p => {
        let type = 'غير معروف';
        if (p.saleId) type = 'بيع';
        if (p.contributionId) type = 'مساهمة';
        return { type, description: p.description || '', amount: p.amount.toNumber() };
    });

    const formattedOutflows = outflows.map(p => {
        let type = 'غير معروف';
        if (p.expenseId) type = 'مصروف';
        if (p.purchaseId) type = 'شراء';
        return { type, description: p.description || '', amount: p.amount.toNumber() };
    });

    const responseData = {
      wallets: wallets.map(w => ({ ...w, balance: w.balance.toNumber() })),
      cashWalletId,
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

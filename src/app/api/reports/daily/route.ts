
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
    
    // Fetch ALL payments for the given day, regardless of the related record's status.
    // The payment record itself is the source of truth for when money moved.
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

    // Handle case where there is no cash wallet defined
    if (!cashWallet) {
        // Still return a valid report structure, but with zeroed cash flow
        const responseData = {
            wallets: wallets.map(w => ({ ...w, balance: w.balance })),
            cashWalletId: null,
            cashFlow: { totalIn: 0, totalOut: 0, netChange: 0 },
            transactions: { inflows: [], outflows: [] }
        };
        return NextResponse.json(responseData);
    }

    const cashPayments = payments.filter(p => p.walletId === cashWallet.id);

    const inflows = cashPayments.filter(p => p.type === 'Income');
    const outflows = cashPayments.filter(p => p.type === 'Expense');

    const totalIn = inflows.reduce((sum, p) => sum + p.amount, 0);
    const totalOut = outflows.reduce((sum, p) => sum + p.amount, 0);
    const netChange = totalIn - totalOut;

    const formattedInflows = inflows.map(p => {
        let type = 'غير معروف';
        let description = p.description || '';
        if (p.saleId && p.sale) {
          type = 'بيع';
          description = `بيع لـ ${p.sale.customerName}`;
        }
        if (p.contributionId && p.contribution) {
          type = 'نذر نقدى';
          description = `نذر من ${p.contribution.donorName}`;
        }
        return { type, description, amount: p.amount };
    });

    const formattedOutflows = outflows.map(p => {
        let type = 'غير معروف';
        let description = p.description || '';
         if (p.expenseId && p.expense) {
            type = 'مصروف';
            description = p.expense.description;
        }
        if (p.purchaseId && p.purchase) {
          type = 'شراء';
          description = `شراء من ${p.purchase.supplier || 'مورد غير محدد'}`;
        }
        return { type, description, amount: p.amount };
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

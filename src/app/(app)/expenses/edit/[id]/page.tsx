
import { prisma } from '@/lib/prisma';
import EditExpensePageClient from './page.client';
import { notFound } from 'next/navigation';
import { getExpenseById } from '@/lib/actions/expense.actions';
import EditExpenseForm from './page.client';

export default async function EditExpensePage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [expenseData, walletsData] = await Promise.all([
    getExpenseById(id),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!expenseData) {
    notFound();
  }

  // Fully serialize the expense object to ensure it's a plain object
  const expense = {
      ...expenseData,
      amount: expenseData.amount, 
      payments: expenseData.payments.map(p => ({
          ...p,
          amount: p.amount, 
          wallet: {
              ...p.wallet,
              balance: p.wallet.balance 
          }
      }))
  };

  // Serialize Decimal fields for wallets before passing to the client component
  const wallets = walletsData.map(w => ({
    ...w,
    balance: w.balance,
  }));


  return <EditExpenseForm expense={expense} wallets={wallets} />;
}

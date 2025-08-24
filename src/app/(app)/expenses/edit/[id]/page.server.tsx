
import { prisma } from '@/lib/prisma';
import EditExpensePage from './page';
import { notFound } from 'next/navigation';
import { getExpenseById } from '@/lib/actions/expense.actions';

export default async function EditExpensePageContainer({ params }: { params: { id: string } }) {
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
      amount: expenseData.amount, // Already a number from getExpenseById
      payments: expenseData.payments.map(p => ({
          ...p,
          amount: p.amount, // Already a number
          wallet: {
              ...p.wallet,
              balance: p.wallet.balance // Already a number
          }
      }))
  };

  // Serialize Decimal fields for wallets before passing to the client component
  const wallets = walletsData.map(w => ({
    ...w,
    balance: w.balance.toNumber(),
  }));


  return <EditExpensePage expense={expense} wallets={wallets} />;
}

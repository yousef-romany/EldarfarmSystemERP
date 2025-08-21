
import { prisma } from '@/lib/prisma';
import EditExpensePage from './page';
import { notFound } from 'next/navigation';
import { getExpenseById } from '@/lib/actions/expense.actions';

export default async function EditExpensePageContainer({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [expense, wallets] = await Promise.all([
    getExpenseById(id),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!expense) {
    notFound();
  }

  return <EditExpensePage expense={expense} wallets={wallets} />;
}

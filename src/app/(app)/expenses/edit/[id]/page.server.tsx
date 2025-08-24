
import { prisma } from '@/lib/prisma';
import EditExpensePage from './page';
import { notFound } from 'next/navigation';
import { getExpenseById } from '@/lib/actions/expense.actions';

export default async function EditExpensePageContainer({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [expense, walletsData] = await Promise.all([
    getExpenseById(id),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!expense) {
    notFound();
  }

  // Serialize Decimal fields for wallets before passing to the client component
  const wallets = walletsData.map(w => ({
    ...w,
    balance: w.balance.toNumber(),
  }));


  return <EditExpensePage expense={expense} wallets={wallets} />;
}

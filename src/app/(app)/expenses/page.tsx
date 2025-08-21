
import { prisma } from '@/lib/prisma';
import ExpensesClientPage from './client-page';


export default async function ExpensesPage() {
    const expenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' },
        include: {
            payments: {
                include: {
                    wallet: true
                }
            }
        }
    });
    const wallets = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });
    const totalExpenses = await prisma.expense.aggregate({
        _sum: {
            amount: true
        }
    });

    return (
        <ExpensesClientPage 
            expenses={expenses} 
            wallets={wallets}
            totalExpenses={totalExpenses._sum.amount?.toNumber() || 0}
        />
    );
}


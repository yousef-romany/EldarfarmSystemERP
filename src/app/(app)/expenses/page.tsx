
import { prisma } from '@/lib/prisma';
import ExpensesClientPage from './client-page';
import { PageHeader } from '@/components/page-header';
import { getFullSession } from '@/lib/session';

export default async function ExpensesPage() {
    const session = await getFullSession();
    const user = session.user;

    const expensesData = await prisma.expense.findMany({
        orderBy: { date: 'desc' },
        include: {
            payments: {
                include: {
                    wallet: true
                }
            }
        }
    });

    const expenses = expensesData.map(expense => ({
        ...expense,
        amount: expense.amount,
        payments: expense.payments.map(payment => ({
            ...payment,
            amount: payment.amount,
            wallet: {
                ...payment.wallet,
                balance: payment.wallet.balance
            }
        }))
    }));

    const walletsData = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });
    const wallets = walletsData.map(wallet => ({
        ...wallet,
        balance: wallet.balance
    }));

    const totalExpensesResult = await prisma.expense.aggregate({
        _sum: {
            amount: true
        }
    });

    const totalExpenses = totalExpensesResult._sum.amount ?? 0;

    return (
        <>
            <ExpensesClientPage 
                expenses={expenses} 
                wallets={wallets}
                totalExpenses={totalExpenses}
            />
        </>
    );
}

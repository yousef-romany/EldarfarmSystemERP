
import { prisma } from '@/lib/prisma';
import ExpensesClientPage from './client-page';
import { PageHeader } from '@/components/page-header';
import { getSessionData } from '@/lib/session';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';


export default async function ExpensesPage() {
    const session = await getSessionData();
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

    // Serialize Decimal fields to numbers
    const expenses = expensesData.map(expense => ({
        ...expense,
        amount: expense.amount.toNumber(),
        payments: expense.payments.map(payment => ({
            ...payment,
            amount: payment.amount.toNumber(),
            wallet: {
                ...payment.wallet,
                balance: payment.wallet.balance.toNumber()
            }
        }))
    }));

    const walletsData = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });
    // Serialize Decimal fields for wallets
    const wallets = walletsData.map(wallet => ({
        ...wallet,
        balance: wallet.balance.toNumber()
    }));

    const totalExpenses = await prisma.expense.aggregate({
        _sum: {
            amount: true
        }
    });

    return (
        <>
            <PageHeader
                title="إدارة المصروفات"
                action={
                user?.permissions.expenses.add && (
                    <Button asChild>
                        <Link href="/expenses/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            إضافة مصروف
                        </Link>
                    </Button>
                )
                }
            />
            <ExpensesClientPage 
                expenses={expenses} 
                wallets={wallets}
                totalExpenses={totalExpenses._sum.amount?.toNumber() || 0}
            />
        </>
    );
}



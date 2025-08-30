
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ContributionsClientPage from './client-page';
import { getSessionData } from '@/lib/session';

export default async function ContributionsPage() {
    const session = await getSessionData();
    const user = session.user;

    const contributions = await prisma.contribution.findMany({
        orderBy: { date: 'desc' },
    });

    return (
        <>
            <PageHeader
                title="سجل النذور النقدية"
                action={user?.permissions.contributions.add && (
                    <Button asChild>
                        <Link href="/contributions/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        إضافة نذر نقدي
                        </Link>
                    </Button>
                )}
            />
            <ContributionsClientPage contributions={contributions} />
        </>
    );
}

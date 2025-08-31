
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/page-header';
import LivestockClientPage from './client-page';
import { getFullSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default async function LivestockPage() {
    const session = await getFullSession();
    const user = session.user;

    const livestock = await prisma.livestock.findMany({
        where: {
            status: {
                not: 'Sold'
            }
        },
        include: {
            livestockType: true,
            barn: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return (
        <>
            <PageHeader
                title="إدارة المواشي"
                action={user?.permissions.livestock.add && (
                    <Button asChild>
                        <Link href="/opening-balance">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        إضافة رصيد افتتاحي
                        </Link>
                    </Button>
                )}
            />
            <LivestockClientPage initialLivestock={livestock} />
        </>
    );
}

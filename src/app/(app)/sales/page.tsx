
import { prisma } from '@/lib/prisma';
import SalesPageClient from './client-page';
import { PageHeader } from '@/components/page-header';
import { getFullSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default async function SalesPage() {
  const session = await getFullSession();
  const user = session.user;

  const walletsData = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });
  
  const wallets = walletsData.map(w => ({
    ...w,
    balance: w.balance
  }));

  return (
    <>
       <PageHeader
        title="سجل المبيعات"
        action={
          <div className="flex items-center gap-2">
            {user?.permissions.pos?.add && (
               <Button asChild>
                <Link href="/sales/pos">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  إضافة بيع فوري
                </Link>
              </Button>
            )}
            {user?.permissions.deferredSales?.add && (
              <Button asChild variant="secondary">
                <Link href="/sales/deferred">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  إضافة بيع آجل
                </Link>
              </Button>
            )}
          </div>
        }
      />
      <SalesPageClient wallets={wallets} />
    </>
  );
}

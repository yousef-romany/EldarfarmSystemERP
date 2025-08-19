
import { prisma } from '@/lib/prisma';
import PurchasesPageClient from './client-page';
import { PageHeader } from '@/components/page-header';

export default async function PurchasesPage() {
  const barns = await prisma.barn.findMany({ orderBy: { name: 'asc' } });
  const livestockTypes = await prisma.livestockType.findMany({ orderBy: { name: 'asc' } });
  const wallets = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });
  const purchases = await prisma.purchase.findMany({ 
    orderBy: { purchaseDate: 'desc' },
    include: { livestock: { include: { livestockType: true, barn: true } } }
  });

  return (
    <>
        <PageHeader 
            title="إدارة المشتريات" 
        />
        <PurchasesPageClient 
            barns={barns} 
            livestockTypes={livestockTypes} 
            wallets={wallets} 
            purchases={purchases}
        />
    </>
    );
}

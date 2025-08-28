

import { prisma } from '@/lib/prisma';
import PurchasesPageClient from './client-page';
import { PageHeader } from '@/components/page-header';

export default async function PurchasesPage() {
  const [barnsData, livestockTypesData, walletsData] = await Promise.all([
    prisma.barn.findMany({ orderBy: { name: 'asc' } }),
    prisma.livestockType.findMany({ orderBy: { name: 'asc' } }),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } }),
  ]);

  // Serialize Decimal fields
  const wallets = walletsData.map(w => ({ ...w, balance: w.balance.toNumber() }));
  
  return (
    <>
        <PageHeader 
            title="إدارة المشتريات" 
        />
        <PurchasesPageClient 
            barns={barnsData} 
            livestockTypes={livestockTypesData} 
            wallets={wallets} 
        />
    </>
    );
}


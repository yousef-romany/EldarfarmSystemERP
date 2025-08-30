
import { prisma } from '@/lib/prisma';
import EditPurchasePageClient from './page.client';
import { notFound } from 'next/navigation';
import { getPurchaseById } from '@/lib/actions/purchase.actions';

export default async function EditPurchasePageContainer({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [purchase, barns, livestockTypes, wallets] = await Promise.all([
    getPurchaseById(id),
    prisma.barn.findMany({ orderBy: { name: 'asc' } }),
    prisma.livestockType.findMany({ orderBy: { name: 'asc' } }),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!purchase || purchase.status !== 'Draft') {
    notFound();
  }
  
  const serializedWallets = wallets.map(w => ({...w, balance: w.balance.toNumber()}));

  return (
    <EditPurchasePageClient 
      purchase={purchase} 
      barns={barns} 
      livestockTypes={livestockTypes} 
      wallets={serializedWallets} 
    />
  );
}

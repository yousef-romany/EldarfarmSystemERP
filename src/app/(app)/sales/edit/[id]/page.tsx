
import { prisma } from '@/lib/prisma';
import EditSalePageClient from './page.client';
import { notFound } from 'next/navigation';
import { getSaleById } from '@/lib/actions/sale.actions';

export default async function EditSalePageContainer({ params: { id } }: { params: { id: string } }) {
  
  const [sale, wallets] = await Promise.all([
    getSaleById(id),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!sale) {
    notFound();
  }
  
  // Wallets are already serialized by Prisma, but let's ensure it for safety
  const serializedWallets = wallets.map(w => ({...w, balance: w.balance}));

  return (
    <EditSalePageClient 
      sale={sale} 
      wallets={serializedWallets} 
    />
  );
}

    
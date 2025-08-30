
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getSaleById } from '@/lib/actions/sale.actions';
import EditSalePageClient from './page.client';


export default async function EditSalePage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [sale, walletsData] = await Promise.all([
    getSaleById(id),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!sale) {
    notFound();
  }

  const wallets = walletsData.map(w => ({
    ...w,
    balance: w.balance.toNumber(),
  }));

  return <EditSalePageClient sale={sale} wallets={wallets} />;
}

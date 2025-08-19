
import { prisma } from '@/lib/prisma';
import EditSalePage from './page';
import { notFound } from 'next/navigation';
import { getSaleById } from '@/lib/actions/sale.actions';

export default async function EditSalePageContainer({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [sale, wallets] = await Promise.all([
    getSaleById(id),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!sale) {
    notFound();
  }

  return <EditSalePage sale={sale} wallets={wallets} />;
}

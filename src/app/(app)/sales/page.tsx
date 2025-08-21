

import { prisma } from '@/lib/prisma';
import SalesPageClient from './client-page';


export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { saleDate: 'desc' },
    include: {
      livestock: {
        select: { tagId: true, isBatch: true, quantity: true }
      }
    }
  });
  const livestock = await prisma.livestock.findMany({
    where: { status: 'Available' },
    orderBy: { tagId: 'asc' },
  });
  const wallets = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });

  return <SalesPageClient sales={sales} availableLivestock={livestock} wallets={wallets} />;
}


import { prisma } from '@/lib/prisma';
import DeferredSaleClientPage from './client-page';

export default async function DeferredSalePage() {
  const [availableLivestockData, walletsData] = await Promise.all([
    prisma.livestock.findMany({
      where: {
        status: { in: ['Available', 'Vowed'] },
        isBatch: false,
      },
      orderBy: { tagId: 'asc' },
    }),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const availableLivestock = availableLivestockData.map(l => ({
    ...l,
    weight: l.weight,
    cost: l.cost,
  }));
  
  const wallets = walletsData.map(w => ({
    ...w,
    balance: w.balance
  }));

  return <DeferredSaleClientPage availableLivestock={availableLivestock} wallets={wallets} />;
}

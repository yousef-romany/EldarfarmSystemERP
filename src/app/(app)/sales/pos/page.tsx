
import { prisma } from '@/lib/prisma';
import POSClientPage from './client-page';

export default async function POSPage() {
  const [availableLivestockData, walletsData] = await Promise.all([
    prisma.livestock.findMany({
      where: {
        status: { in: ['Available', 'Vowed'] },
        isBatch: false, // POS is usually for individual animals
      },
      orderBy: { tagId: 'asc' },
    }),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const availableLivestock = availableLivestockData.map(l => ({
    ...l,
    weight: l.weight.toNumber(),
    cost: l.cost.toNumber(),
  }));
  
  const wallets = walletsData.map(w => ({
    ...w,
    balance: w.balance.toNumber()
  }));

  return <POSClientPage availableLivestock={availableLivestock} wallets={wallets} />;
}

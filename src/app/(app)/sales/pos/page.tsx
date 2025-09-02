
import { prisma } from '@/lib/prisma';
import POSClientPage from './client-page';

export default async function POSPage() {
  const [availableLivestockData, walletsData] = await Promise.all([
    prisma.livestock.findMany({
      where: {
        status: { in: ['Available', 'Vowed'] },
        OR: [
          { isBatch: false },
          { quantity: { gt: 0 } }
        ]
      },
      orderBy: { createdAt: 'desc' },
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

  return <POSClientPage availableLivestock={availableLivestock} wallets={wallets} />;
}


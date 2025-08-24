

import { prisma } from '@/lib/prisma';
import SalesPageClient from './client-page';


export default async function SalesPage() {
  const salesData = await prisma.sale.findMany({
    orderBy: { saleDate: 'desc' },
    include: {
      livestock: {
        select: { tagId: true, isBatch: true, quantity: true }
      }
    }
  });
  const livestockData = await prisma.livestock.findMany({
    where: { 
      status: { 
        in: ['Available', 'Vowed'] 
      } 
    },
    orderBy: { tagId: 'asc' },
  });
  const walletsData = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });

  // Serialize decimal fields
  const sales = salesData.map(s => ({
    ...s,
    pricePerKg: s.pricePerKg.toNumber(),
    totalPrice: s.totalPrice.toNumber(),
    amountPaid: s.amountPaid.toNumber(),
    remainingAmount: s.remainingAmount.toNumber(),
    initialWeight: s.initialWeight?.toNumber() ?? null,
    finalWeight: s.finalWeight?.toNumber() ?? null,
  }));

  const livestock = livestockData.map(l => ({
    ...l,
    weight: l.weight.toNumber(),
    cost: l.cost.toNumber(),
  }));
  
  const wallets = walletsData.map(w => ({
    ...w,
    balance: w.balance.toNumber()
  }));


  return <SalesPageClient sales={sales} availableLivestock={livestock} wallets={wallets} />;
}



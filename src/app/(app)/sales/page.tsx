
import { prisma } from '@/lib/prisma';
import SalesPageClient from './client-page';
import { PageHeader } from '@/components/page-header';

export default async function SalesPage() {
  const salesData = await prisma.sale.findMany({
    orderBy: { saleDate: 'desc' },
    include: {
      livestock: {
        select: { tagId: true, isBatch: true, quantity: true }
      }
    }
  });

  const walletsData = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });

  // Serialize decimal fields
  const sales = salesData.map(s => ({
    ...s,
    pricePerKg: s.pricePerKg.toNumber(),
    totalPrice: s.totalPrice.toNumber(),
    amountPaid: s.amountPaid.toNumber(),
    remainingAmount: s.remainingAmount.toNumber(),
    initialWeight: s.initialWeight?.toNumber() ?? 0,
    finalWeight: s.finalWeight?.toNumber() ?? null,
  }));
  
  const wallets = walletsData.map(w => ({
    ...w,
    balance: w.balance.toNumber()
  }));

  return <SalesPageClient sales={sales} wallets={wallets} />;
}

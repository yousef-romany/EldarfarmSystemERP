

import { prisma } from '@/lib/prisma';
import PurchasesPageClient from './client-page';
import { PageHeader } from '@/components/page-header';

export default async function PurchasesPage() {
  const barnsData = await prisma.barn.findMany({ orderBy: { name: 'asc' } });
  const livestockTypesData = await prisma.livestockType.findMany({ orderBy: { name: 'asc' } });
  const walletsData = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });
  const purchasesData = await prisma.purchase.findMany({ 
    orderBy: { purchaseDate: 'desc' },
    include: { 
      livestock: { 
        include: { 
          livestockType: true, 
          barn: true 
        } 
      },
      payments: {
        include: {
          wallet: true
        }
      }
    }
  });

  // Serialize Decimal fields
  const wallets = walletsData.map(w => ({ ...w, balance: w.balance.toNumber() }));
  const purchases = purchasesData.map(p => ({
    ...p,
    totalCost: p.totalCost.toNumber(),
    amountPaid: p.amountPaid.toNumber(),
    remainingAmount: p.remainingAmount.toNumber(),
    livestock: {
      ...p.livestock,
      weight: p.livestock.weight.toNumber(),
      cost: p.livestock.cost.toNumber(),
    },
    payments: p.payments.map(payment => ({
      ...payment,
      amount: payment.amount.toNumber(),
    }))
  }));


  return (
    <>
        <PageHeader 
            title="إدارة المشتريات" 
        />
        <PurchasesPageClient 
            barns={barnsData} 
            livestockTypes={livestockTypesData} 
            wallets={wallets} 
            purchases={purchases}
        />
    </>
    );
}


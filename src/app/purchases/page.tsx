
import { prisma } from '@/lib/prisma';
import PurchasesPageClient from './client-page';


export default async function PurchasesPage() {
  const barns = await prisma.barn.findMany({ orderBy: { name: 'asc' } });
  const livestockTypes = await prisma.livestockType.findMany({ orderBy: { name: 'asc' } });
  const wallets = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });

  return <PurchasesPageClient barns={barns} livestockTypes={livestockTypes} wallets={wallets} />;
}


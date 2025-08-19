
import { prisma } from '@/lib/prisma';
import NewDeferredSalePage from './page';

export default async function DeferredSalePageContainer() {
  const availableLivestock = await prisma.livestock.findMany({
    where: { status: 'Available' },
    orderBy: { tagId: 'asc' },
  });
  const wallets = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });

  return <NewDeferredSalePage availableLivestock={availableLivestock} wallets={wallets} />;
}

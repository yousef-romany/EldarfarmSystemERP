
import { prisma } from '@/lib/prisma';
import WalletsClientPage from './client-page';


export default async function WalletsPage() {
    const walletsData = await prisma.wallet.findMany({
        orderBy: { name: 'asc' },
    });

    // Serialize Decimal fields
    const wallets = walletsData.map(w => ({
      ...w,
      balance: w.balance.toNumber()
    }));

  return (
    <WalletsClientPage wallets={wallets} />
  );
}

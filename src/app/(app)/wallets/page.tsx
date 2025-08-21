
import { prisma } from '@/lib/prisma';
import WalletsClientPage from './client-page';


export default async function WalletsPage() {
    const wallets = await prisma.wallet.findMany({
        orderBy: { name: 'asc' },
    });

  return (
    <WalletsClientPage wallets={wallets} />
  );
}


// This is the main Server Component that fetches data and renders the client component.
import { prisma } from '@/lib/prisma';
import NewContributionForm from './client-page';

export default async function NewContributionPageContainer() {
  const wallets = await prisma.wallet.findMany({ 
    orderBy: { name: 'asc' },
  });

  // Serialize Decimal fields before passing to the client component
  const serializedWallets = wallets.map(wallet => ({
      ...wallet,
      balance: wallet.balance,
  }));

  return <NewContributionForm wallets={serializedWallets} />;
}


import { prisma } from '@/lib/prisma';
import NewContributionPage from './page';

export default async function NewContributionPageContainer() {
  const wallets = await prisma.wallet.findMany({ orderBy: { name: 'asc' } });
  return <NewContributionPage wallets={wallets} />;
}

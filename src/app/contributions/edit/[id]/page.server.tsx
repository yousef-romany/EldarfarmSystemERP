
import { prisma } from '@/lib/prisma';
import EditContributionPage from './page';
import { notFound } from 'next/navigation';
import { getContributionById } from '@/lib/actions/contribution.actions';

export default async function EditContributionPageContainer({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [contribution, wallets] = await Promise.all([
    getContributionById(id),
    prisma.wallet.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!contribution) {
    notFound();
  }

  return <EditContributionPage contribution={contribution} wallets={wallets} />;
}

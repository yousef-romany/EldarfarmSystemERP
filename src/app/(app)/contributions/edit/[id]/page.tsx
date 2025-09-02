
import { prisma } from '@/lib/prisma';
import EditContributionForm from './page.client';
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

  // The data from getContributionById is already serialized, so just pass it
  const serializedWallets = wallets.map(w => ({ ...w, balance: w.balance }));

  return <EditContributionForm contribution={contribution} wallets={serializedWallets} />;
}

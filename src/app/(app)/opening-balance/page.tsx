
import { prisma } from '@/lib/prisma';
import OpeningBalanceClientPage from './client-page';

export default async function OpeningBalancePage() {
  const barns = await prisma.barn.findMany({ orderBy: { name: 'asc' } });
  const livestockTypes = await prisma.livestockType.findMany({ orderBy: { name: 'asc' }});

  return <OpeningBalanceClientPage barns={barns} livestockTypes={livestockTypes} />;
}

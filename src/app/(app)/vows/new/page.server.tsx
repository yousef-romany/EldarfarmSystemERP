
import { prisma } from '@/lib/prisma';
import NewVowPage from './page';

export default async function NewVowPageContainer() {
  const barns = await prisma.barn.findMany({ orderBy: { name: 'asc' } });
  const livestockTypes = await prisma.livestockType.findMany({ orderBy: { name: 'asc' }});

  return <NewVowPage barns={barns} livestockTypes={livestockTypes} />;
}

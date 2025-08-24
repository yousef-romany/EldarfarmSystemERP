
import { prisma } from '@/lib/prisma';
import NewVowPageClient from './page.client';

export default async function NewVowPageContainer() {
  const barns = await prisma.barn.findMany({ orderBy: { name: 'asc' } });
  const livestockTypes = await prisma.livestockType.findMany({ orderBy: { name: 'asc' }});

  return <NewVowPageClient barns={barns} livestockTypes={livestockTypes} />;
}


import { prisma } from '@/lib/prisma';
import EditVowPage from './page';
import { notFound } from 'next/navigation';
import { getVowById } from '@/lib/actions/vow.actions';

export default async function EditVowPageContainer({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [vow, barns, livestockTypes] = await Promise.all([
    getVowById(id),
    prisma.barn.findMany({ orderBy: { name: 'asc' } }),
    prisma.livestockType.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!vow) {
    notFound();
  }

  return <EditVowPage vow={vow} barns={barns} livestockTypes={livestockTypes} />;
}

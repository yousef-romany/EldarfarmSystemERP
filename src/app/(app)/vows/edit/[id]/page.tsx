
import { prisma } from '@/lib/prisma';
import EditVowPageClient from './page.client';
import { notFound } from 'next/navigation';
import { getVowById } from '@/lib/actions/vow.actions';

export default async function EditVowPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const [vowData, barnsData, livestockTypesData] = await Promise.all([
    getVowById(id),
    prisma.barn.findMany({ orderBy: { name: 'asc' } }),
    prisma.livestockType.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!vowData) {
    notFound();
  }

  // The data from getVowById is already serialized, so we just pass it down
  const vow = vowData;
  const barns = barnsData;
  const livestockTypes = livestockTypesData;

  return <EditVowPageClient vow={vow} barns={barns} livestockTypes={livestockTypes} />;
}

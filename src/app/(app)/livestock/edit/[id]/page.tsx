
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditLivestockClientPage from './client-page';
import { getFullSession } from '@/lib/session';

export default async function EditLivestockPage({ params }: { params: { id: string } }) {
  const session = await getFullSession();
  if (!session.user?.permissions.livestock.edit) {
      notFound();
  }

  const { id } = params;
  
  const [livestock, barns, livestockTypes] = await Promise.all([
    prisma.livestock.findUnique({ where: { id } }),
    prisma.barn.findMany({ orderBy: { name: 'asc' } }),
    prisma.livestockType.findMany({ orderBy: { name: 'asc' }})
  ]);

  if (!livestock) {
    notFound();
  }

  return (
    <EditLivestockClientPage 
      livestock={livestock} 
      barns={barns} 
      livestockTypes={livestockTypes} 
    />
  );
}

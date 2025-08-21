
import { prisma } from '@/lib/prisma';
import { LivestockTypesClient } from './client-page';

export default async function LivestockTypesPage() {
  const types = await prisma.livestockType.findMany({
    orderBy: { name: 'asc' },
  });

  return <LivestockTypesClient types={types} />;
}

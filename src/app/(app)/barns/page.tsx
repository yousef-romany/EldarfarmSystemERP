
import { prisma } from '@/lib/prisma';
import { BarnsClient } from './client-page';


export default async function BarnsPage() {
  const barns = await prisma.barn.findMany({
    orderBy: { name: 'asc' },
  });

  return <BarnsClient barns={barns} />;
}

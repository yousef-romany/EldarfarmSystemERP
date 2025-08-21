
import { prisma } from '@/lib/prisma';
import type { Barn } from '@prisma/client';
import { BarnsClient } from './client-page';


export default async function BarnsPage() {
  const barns = await prisma.barn.findMany({
    orderBy: { name: 'asc' },
  });

  return <BarnsClient barns={barns} />;
}

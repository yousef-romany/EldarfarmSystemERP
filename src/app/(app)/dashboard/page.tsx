

import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { prisma } from '@/lib/prisma';
import DashboardClientPage from './client-page';
import type { LivestockStatus } from '@prisma/client';

export default async function DashboardPage() {
  
  const [
    livestockCount,
    barnCount,
    totalValueResult,
    statusCountsResult,
    typeCountsResult,
  ] = await Promise.all([
    prisma.livestock.count({ where: { status: { not: 'Sold' } } }),
    prisma.barn.count(),
    prisma.livestock.aggregate({
      _sum: { cost: true },
      where: { status: { not: 'Sold' } }
    }),
    prisma.livestock.groupBy({
      by: ['status'],
      _count: { id: true },
       where: { status: { not: 'Sold' } }
    }),
    prisma.livestock.groupBy({
        by: ['livestockTypeId'],
        _count: { id: true },
        where: { status: { not: 'Sold' } }
    })
  ]);

  const typeIds = typeCountsResult.map(item => item.livestockTypeId);
  const types = await prisma.livestockType.findMany({
      where: { id: { in: typeIds } },
      select: { id: true, name: true }
  });
  const typeMap = new Map(types.map(t => [t.id, t.name]));

  const formattedTypeCounts = typeCountsResult.map(item => ({
    name: typeMap.get(item.livestockTypeId) || 'غير معروف',
    count: item._count.id
  }));

  const formattedStatusCounts = statusCountsResult.reduce((acc, { status, _count }) => {
    acc[status] = _count.id;
    return acc;
  }, {} as Record<LivestockStatus, number>);

  const stats = {
    livestockCount,
    barnCount,
    totalValue: totalValueResult._sum.cost ?? 0,
    statusCounts: formattedStatusCounts,
    typeCounts: formattedTypeCounts
  };

  return (
    <>
      <PageHeader title="لوحة التحكم الرئيسية" />
      <Suspense fallback={<div>Loading...</div>}>
         <DashboardClientPage stats={stats} />
      </Suspense>
    </>
  );
}

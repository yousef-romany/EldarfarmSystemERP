import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { prisma } from '@/lib/prisma';
import DashboardClientPage from './client-page';
import type { LivestockStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  // Calculate livestock value
  const livestockForValue = await prisma.livestock.findMany({
    where: { status: { not: 'Sold' } },
    select: { cost: true, isBatch: true, quantity: true }
  });

  const totalValue = livestockForValue.reduce((acc, item) => {
    const itemCost = item.cost;
    if (item.isBatch) {
      return acc + (itemCost * (item.quantity || 1));
    }
    return acc + itemCost;
  }, 0);

  // Get basic counts
  const [
    livestockCount,
    barnCount,
    statusCountsResult,
    typeCountsResult,
  ] = await Promise.all([
    prisma.livestock.count({ where: { status: { not: 'Sold' } } }),
    prisma.barn.count(),
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

  // Sales statistics
  const salesAllTime = await prisma.sale.aggregate({
    _sum: { totalPrice: true, amountPaid: true, remainingAmount: true },
    _count: { id: true }
  });

  const salesThisMonth = await prisma.sale.aggregate({
    where: { saleDate: { gte: startOfMonth } },
    _sum: { totalPrice: true, amountPaid: true, remainingAmount: true },
    _count: { id: true }
  });

  const salesToday = await prisma.sale.aggregate({
    where: { saleDate: { gte: startOfToday } },
    _sum: { totalPrice: true, amountPaid: true, remainingAmount: true },
    _count: { id: true }
  });

  const salesYesterday = await prisma.sale.aggregate({
    where: { 
      saleDate: { 
        gte: startOfYesterday,
        lt: startOfToday
      }
    },
    _sum: { totalPrice: true },
    _count: { id: true }
  });

  // Expenses statistics
  const expensesAllTime = await prisma.expense.aggregate({
    _sum: { amount: true },
    _count: { id: true }
  });

  const expensesThisMonth = await prisma.expense.aggregate({
    where: { date: { gte: startOfMonth } },
    _sum: { amount: true },
    _count: { id: true }
  });

  const expensesToday = await prisma.expense.aggregate({
    where: { date: { gte: startOfToday } },
    _sum: { amount: true },
    _count: { id: true }
  });

  const expensesYesterday = await prisma.expense.aggregate({
    where: { 
      date: { 
        gte: startOfYesterday,
        lt: startOfToday
      }
    },
    _sum: { amount: true },
    _count: { id: true }
  });

  // Purchases statistics
  const purchasesAllTime = await prisma.purchase.aggregate({
    _sum: { totalCost: true },
    _count: { id: true }
  });

  const purchasesThisMonth = await prisma.purchase.aggregate({
    where: { purchaseDate: { gte: startOfMonth } },
    _sum: { totalCost: true },
    _count: { id: true }
  });

  // Contributions statistics
  const contributionsAllTime = await prisma.contribution.aggregate({
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  const contributionsThisMonth = await prisma.contribution.aggregate({
    where: { date: { gte: startOfMonth } },
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  // Vows statistics (count only, since Vow model doesn't have an amount field)
  const vowsAllTime = await prisma.vow.count();
  const vowsThisMonth = await prisma.vow.count({
    where: { date: { gte: startOfMonth } }
  });

  // Calculate profits
  const profitAllTime = (salesAllTime._sum.totalPrice || 0) - (expensesAllTime._sum.amount || 0);
  const profitThisMonth = (salesThisMonth._sum.totalPrice || 0) - (expensesThisMonth._sum.amount || 0);
  const profitToday = (salesToday._sum.totalPrice || 0) - (expensesToday._sum.amount || 0);

  // Daily sales and expenses for the last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const dailySales = await prisma.sale.groupBy({
    by: ['saleDate'],
    where: { saleDate: { gte: thirtyDaysAgo } },
    _sum: { totalPrice: true },
    orderBy: { saleDate: 'asc' }
  });

  const dailyExpenses = await prisma.expense.groupBy({
    by: ['date'],
    where: { date: { gte: thirtyDaysAgo } },
    _sum: { amount: true },
    orderBy: { date: 'asc' }
  });

  // Create a map for daily data
  const dailyDataMap = new Map<string, { sales: number; expenses: number; profit: number }>();
  
  // Initialize all days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    dailyDataMap.set(dateStr, { sales: 0, expenses: 0, profit: 0 });
  }

  // Fill in sales data
  dailySales.forEach(item => {
    const dateStr = item.saleDate.toISOString().split('T')[0];
    if (dailyDataMap.has(dateStr)) {
      dailyDataMap.get(dateStr)!.sales = item._sum.totalPrice || 0;
    }
  });

  // Fill in expenses data
  dailyExpenses.forEach(item => {
    const dateStr = item.date.toISOString().split('T')[0];
    if (dailyDataMap.has(dateStr)) {
      dailyDataMap.get(dateStr)!.expenses = item._sum.amount || 0;
    }
  });

  // Calculate profit for each day
  dailyDataMap.forEach((data, dateStr) => {
    data.profit = data.sales - data.expenses;
  });

  // Convert map to array
  const dailyData = Array.from(dailyDataMap.entries()).map(([date, data]) => ({
    date,
    ...data
  }));

  const stats = {
    livestockCount,
    barnCount,
    totalValue,
    statusCounts: formattedStatusCounts,
    typeCounts: formattedTypeCounts,
    sales: {
      allTime: {
        total: salesAllTime._sum.totalPrice || 0,
        paid: salesAllTime._sum.amountPaid || 0,
        remaining: salesAllTime._sum.remainingAmount || 0,
        count: salesAllTime._count.id
      },
      thisMonth: {
        total: salesThisMonth._sum.totalPrice || 0,
        paid: salesThisMonth._sum.amountPaid || 0,
        remaining: salesThisMonth._sum.remainingAmount || 0,
        count: salesThisMonth._count.id
      },
      today: {
        total: salesToday._sum.totalPrice || 0,
        paid: salesToday._sum.amountPaid || 0,
        remaining: salesToday._sum.remainingAmount || 0,
        count: salesToday._count.id
      },
      yesterday: {
        total: salesYesterday._sum.totalPrice || 0,
        count: salesYesterday._count.id
      }
    },
    expenses: {
      allTime: {
        total: expensesAllTime._sum.amount || 0,
        count: expensesAllTime._count.id
      },
      thisMonth: {
        total: expensesThisMonth._sum.amount || 0,
        count: expensesThisMonth._count.id
      },
      today: {
        total: expensesToday._sum.amount || 0,
        count: expensesToday._count.id
      },
      yesterday: {
        total: expensesYesterday._sum.amount || 0,
        count: expensesYesterday._count.id
      }
    },
    purchases: {
      allTime: {
        total: purchasesAllTime._sum.totalCost || 0,
        count: purchasesAllTime._count.id
      },
      thisMonth: {
        total: purchasesThisMonth._sum.totalCost || 0,
        count: purchasesThisMonth._count.id
      }
    },
    contributions: {
      allTime: {
        total: contributionsAllTime._sum.totalAmount || 0,
        count: contributionsAllTime._count.id
      },
      thisMonth: {
        total: contributionsThisMonth._sum.totalAmount || 0,
        count: contributionsThisMonth._count.id
      }
    },
    vows: {
      allTime: {
        count: vowsAllTime
      },
      thisMonth: {
        count: vowsThisMonth
      }
    },
    profit: {
      allTime: profitAllTime,
      thisMonth: profitThisMonth,
      today: profitToday
    },
    dailyData
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

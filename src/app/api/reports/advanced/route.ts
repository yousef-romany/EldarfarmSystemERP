import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.permissions?.reports?.view) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'profit-loss';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Parse dates if provided
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    let reportData: any = {};

    switch (reportType) {
      case 'profit-loss':
        // Profit and Loss Report
        const salesData = await prisma.sale.findMany({
          where: {
            saleDate: {
              gte: start,
              lte: end,
            },
          },
          select: {
            totalPrice: true,
            amountPaid: true,
            remainingAmount: true,
          },
        });

        const expensesData = await prisma.expense.findMany({
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          select: {
            amount: true,
            category: true,
          },
        });

        const purchasesData = await prisma.purchase.findMany({
          where: {
            purchaseDate: {
              gte: start,
              lte: end,
            },
          },
          select: {
            totalCost: true,
          },
        });

        const totalSales = salesData.reduce((sum, sale) => sum + sale.totalPrice, 0);
        const totalPaidSales = salesData.reduce((sum, sale) => sum + sale.amountPaid, 0);
        const totalRemainingSales = salesData.reduce((sum, sale) => sum + sale.remainingAmount, 0);
        const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
        const totalPurchases = purchasesData.reduce((sum, purchase) => sum + purchase.totalCost, 0);

        const grossProfit = totalSales - totalPurchases;
        const netProfit = grossProfit - totalExpenses;

        // Group expenses by category
        const expensesByCategory = expensesData.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {} as Record<string, number>);

        reportData = {
          type: 'profit-loss',
          period: { start, end },
          summary: {
            totalSales,
            totalPaidSales,
            totalRemainingSales,
            totalPurchases,
            totalExpenses,
            grossProfit,
            netProfit,
          },
          expensesByCategory,
        };
        break;

      case 'inventory':
        // Inventory Report
        const livestockData = await prisma.livestock.findMany({
          where: {
            status: { not: 'Sold' },
          },
          include: {
            barn: true,
            livestockType: true,
          },
        });

        const totalLivestockValue = livestockData.reduce((sum, animal) => {
          return sum + (animal.isBatch ? (animal.cost * (animal.quantity || 1)) : animal.cost);
        }, 0);

        const totalLivestockCount = livestockData.reduce((sum, animal) => {
          return sum + (animal.isBatch ? (animal.quantity || 1) : 1);
        }, 0);

        // Group by barn
        const livestockByBarn = livestockData.reduce((acc, animal) => {
          const barnName = animal.barn.name;
          if (!acc[barnName]) {
            acc[barnName] = {
              count: 0,
              value: 0,
              types: {} as Record<string, number>,
            };
          }
          acc[barnName].count += animal.isBatch ? (animal.quantity || 1) : 1;
          acc[barnName].value += animal.isBatch ? (animal.cost * (animal.quantity || 1)) : animal.cost;
          
          const typeName = animal.livestockType.name;
          acc[barnName].types[typeName] = (acc[barnName].types[typeName] || 0) + (animal.isBatch ? (animal.quantity || 1) : 1);
          
          return acc;
        }, {} as Record<string, any>);

        // Group by type
        const livestockByType = livestockData.reduce((acc, animal) => {
          const typeName = animal.livestockType.name;
          if (!acc[typeName]) {
            acc[typeName] = {
              count: 0,
              value: 0,
            };
          }
          acc[typeName].count += animal.isBatch ? (animal.quantity || 1) : 1;
          acc[typeName].value += animal.isBatch ? (animal.cost * (animal.quantity || 1)) : animal.cost;
          
          return acc;
        }, {} as Record<string, any>);

        // Group by status
        const livestockByStatus = livestockData.reduce((acc, animal) => {
          const status = animal.status;
          acc[status] = (acc[status] || 0) + (animal.isBatch ? (animal.quantity || 1) : 1);
          return acc;
        }, {} as Record<string, number>);

        reportData = {
          type: 'inventory',
          summary: {
            totalLivestockCount,
            totalLivestockValue,
          },
          byBarn: livestockByBarn,
          byType: livestockByType,
          byStatus: livestockByStatus,
        };
        break;

      case 'movement':
        // Livestock Movement Report
        const movements = await prisma.livestock.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          include: {
            barn: true,
            livestockType: true,
            purchase: true,
            sales: true,
            vows: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Calculate movement statistics
        const movementStats = {
          added: 0,
          sold: 0,
          vowed: 0,
          pendingSale: 0,
        };

        movements.forEach((animal) => {
          if (animal.purchase) {
            movementStats.added += animal.isBatch ? (animal.quantity || 1) : 1;
          }
          if (animal.status === 'Sold') {
            movementStats.sold += animal.isBatch ? (animal.quantity || 1) : 1;
          }
          if (animal.status === 'Vowed') {
            movementStats.vowed += animal.isBatch ? (animal.quantity || 1) : 1;
          }
          if (animal.status === 'PendingSale') {
            movementStats.pendingSale += animal.isBatch ? (animal.quantity || 1) : 1;
          }
        });

        reportData = {
          type: 'movement',
          period: { start, end },
          summary: movementStats,
          movements: movements.map((animal) => ({
            id: animal.id,
            tagId: animal.tagId,
            type: animal.livestockType.name,
            breed: animal.breed,
            barn: animal.barn.name,
            quantity: animal.isBatch ? animal.quantity : 1,
            status: animal.status,
            action: animal.purchase ? 'Added' : 
                   animal.status === 'Sold' ? 'Sold' :
                   animal.status === 'Vowed' ? 'Vowed' : 'Pending',
            date: animal.createdAt,
          })),
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error('Advanced report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

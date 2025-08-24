
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const targetDate = new Date(dateParam);
    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    // Get livestock entries (Purchases and Vows)
    const purchases = await prisma.purchase.findMany({
        where: { purchaseDate: { gte: startDate, lte: endDate } },
        include: { livestock: { include: { livestockType: true } } }
    });

    const vows = await prisma.vow.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        include: { livestock: { include: { livestockType: true } } }
    });

    const entries = [
        ...purchases.map(p => ({
            source: 'شراء',
            tagId: p.livestock.tagId,
            isBatch: p.livestock.isBatch,
            quantity: p.livestock.quantity,
            type: p.livestock.livestockType.name,
            details: p.supplier || 'غير محدد'
        })),
        ...vows.map(v => ({
            source: 'نذر',
            tagId: v.livestock.tagId,
            isBatch: v.livestock.isBatch,
            quantity: v.livestock.quantity,
            type: v.livestock.livestockType.name,
            details: v.donorName
        }))
    ];


    // Get livestock exits (Completed Sales)
    const sales = await prisma.sale.findMany({
        where: { 
            status: 'Completed',
            settlementDate: { gte: startDate, lte: endDate }
        },
        include: { livestock: { include: { livestockType: true } } }
    });

    const exits = sales.map(s => ({
        source: 'بيع',
        tagId: s.livestock.tagId,
        isBatch: s.livestock.isBatch,
        quantity: s.livestock.quantity,
        type: s.livestock.livestockType.name,
        details: s.customerName
    }));


    return NextResponse.json({ entries, exits });

  } catch (error) {
    console.error('Failed to generate livestock movement report:', error);
    return NextResponse.json({ error: 'Failed to generate livestock movement report' }, { status: 500 });
  }
}

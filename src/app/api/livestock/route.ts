
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PerformanceMonitor } from '@/lib/performance';

export async function GET(request: Request) {
  const endTimer = PerformanceMonitor.startTimer('api:livestock:list');
  
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search');
  const typeFilter = searchParams.get('type');
  const barnFilter = searchParams.get('barn');

  const where: any = {
    status: { not: 'Sold' } // Always exclude sold animals from the main list
  };

  if (searchTerm) {
    where.tagId = {
      contains: searchTerm,
      // mode: 'insensitive', // This might not be supported on all DBs
    };
  }

  if (typeFilter && typeFilter !== 'all') {
    where.livestockTypeId = typeFilter;
  }

  if (barnFilter && barnFilter !== 'all') {
    where.barnId = barnFilter;
  }

  try {
    const livestockData = await prisma.livestock.findMany({
      where,
      include: {
        barn: {
          select: {
            id: true,
            name: true,
          },
        },
        livestockType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit results for better performance
    });

    // Values are already numbers from Prisma, no need to convert
    const livestock = livestockData.map(animal => ({
      ...animal,
      weight: animal.weight,
      cost: animal.cost,
    }));

    endTimer();
    // Add caching headers
    return NextResponse.json(livestock, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    endTimer();
    console.error('Failed to fetch livestock:', error);
    return NextResponse.json({ error: 'Failed to fetch livestock' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
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
        barn: true,
        livestockType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Values are already numbers from Prisma, no need to convert
    const livestock = livestockData.map(animal => ({
      ...animal,
      weight: animal.weight,
      cost: animal.cost,
    }));

    return NextResponse.json(livestock);
  } catch (error) {
    console.error('Failed to fetch livestock:', error);
    return NextResponse.json({ error: 'Failed to fetch livestock' }, { status: 500 });
  }
}

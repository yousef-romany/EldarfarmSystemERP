
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search');
  const typeFilter = searchParams.get('type');
  const barnFilter = searchParams.get('barn');

  const where: any = {};

  if (searchTerm) {
    where.tagId = {
      contains: searchTerm,
      mode: 'insensitive',
    };
  }

  if (typeFilter && typeFilter !== 'all') {
    where.livestockTypeId = typeFilter;
  }

  if (barnFilter && barnFilter !== 'all') {
    where.barnId = barnFilter;
  }

  try {
    const livestock = await prisma.livestock.findMany({
      where,
      include: {
        barn: true,
        livestockType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(livestock);
  } catch (error) {
    console.error('Failed to fetch livestock:', error);
    return NextResponse.json({ error: 'Failed to fetch livestock' }, { status: 500 });
  }
}

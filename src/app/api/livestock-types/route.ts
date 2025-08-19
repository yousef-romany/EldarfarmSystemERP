
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const types = await prisma.livestockType.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(types);
  } catch (error) {
    console.error('Failed to fetch livestock types:', error);
    return NextResponse.json({ error: 'Failed to fetch livestock types' }, { status: 500 });
  }
}

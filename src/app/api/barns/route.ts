
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const barns = await prisma.barn.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(barns);
  } catch (error) {
    console.error('Failed to fetch barns:', error);
    return NextResponse.json({ error: 'Failed to fetch barns' }, { status: 500 });
  }
}

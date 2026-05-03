import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const levels = await prisma.distributorLevel.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error('Get levels error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch levels' },
      { status: 500 }
    );
  }
}

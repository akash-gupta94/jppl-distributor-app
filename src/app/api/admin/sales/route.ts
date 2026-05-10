import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get('distributorId');
    const where: any = {};
    if (distributorId) where.distributorId = distributorId;
    const sales = await prisma.salesEntry.findMany({
      where,
      include: { distributor: true },
      orderBy: { entryDate: 'desc' },
      take: 200,
    });
    return NextResponse.json({ sales });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');
    const data = await request.json();
    if (!data.distributorId || !data.entryDate || data.amount === undefined) {
      return NextResponse.json(
        { error: 'distributor, entryDate and amount are required' },
        { status: 400 },
      );
    }
    const created = await prisma.salesEntry.create({
      data: {
        distributorId: String(data.distributorId),
        entryDate: new Date(data.entryDate),
        amount: Number(data.amount),
        remarks: data.remarks ?? null,
      },
      include: { distributor: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create sales entry' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

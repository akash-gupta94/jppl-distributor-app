import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function GET() {
  try {
    await requireAuth('admin');
    const categories = await prisma.itemCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { invoiceItems: true } } },
    });
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load categories' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');
    const data = await request.json();
    if (!data.name || !data.code) {
      return NextResponse.json({ error: 'name and code are required' }, { status: 400 });
    }
    const created = await prisma.itemCategory.create({
      data: {
        name: String(data.name),
        code: String(data.code),
        description: data.description ?? null,
        weightage: data.weightage !== undefined ? Number(data.weightage) : 1.0,
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

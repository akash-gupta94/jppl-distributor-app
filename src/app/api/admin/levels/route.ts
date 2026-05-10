import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function GET() {
  try {
    await requireAuth('admin');
    const levels = await prisma.distributorLevel.findMany({
      orderBy: { priority: 'asc' },
      include: { _count: { select: { distributors: true } } },
    });
    return NextResponse.json({ levels });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load levels' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');
    const data = await request.json();
    if (!data.name || !data.code || data.priority === undefined) {
      return NextResponse.json(
        { error: 'name, code and priority are required' },
        { status: 400 },
      );
    }
    const created = await prisma.distributorLevel.create({
      data: {
        name: String(data.name),
        code: String(data.code),
        priority: Number(data.priority),
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create level' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

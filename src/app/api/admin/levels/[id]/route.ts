import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    const data = await request.json();
    const updated = await prisma.distributorLevel.update({
      where: { id: params.id },
      data: {
        name: data.name,
        code: data.code,
        priority: data.priority !== undefined ? Number(data.priority) : undefined,
        description: data.description,
        isActive: data.isActive,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update level' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    const inUse = await prisma.distributor.count({ where: { distributorLevelId: params.id } });
    if (inUse > 0) {
      // Soft-deactivate instead of failing — keeps existing distributors valid.
      const updated = await prisma.distributorLevel.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({ deactivated: true, level: updated });
    }
    await prisma.distributorLevel.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete level' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    const data = await request.json();
    const updated = await prisma.itemCategory.update({
      where: { id: params.id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        weightage: data.weightage !== undefined ? Number(data.weightage) : undefined,
        isActive: data.isActive,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    const inUse = await prisma.invoiceItem.count({ where: { itemCategoryId: params.id } });
    if (inUse > 0) {
      const updated = await prisma.itemCategory.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({ deactivated: true, category: updated });
    }
    await prisma.itemCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

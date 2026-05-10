import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    const data = await request.json();
    const updated = await prisma.salesEntry.update({
      where: { id: params.id },
      data: {
        entryDate: data.entryDate ? new Date(data.entryDate) : undefined,
        amount: data.amount !== undefined ? Number(data.amount) : undefined,
        remarks: data.remarks,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update sales entry' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    await prisma.salesEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete sales entry' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

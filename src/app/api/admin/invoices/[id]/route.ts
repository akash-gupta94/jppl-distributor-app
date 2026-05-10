import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        distributor: { include: { distributorLevel: true } },
        items: { include: { itemCategory: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load invoice' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return NextResponse.json({ deactivated: true, invoice: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete invoice' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    const payment = await prisma.payment.findUnique({ where: { id: params.id } });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id: params.id } });
      const remaining = await tx.payment.findMany({ where: { invoiceId: payment.invoiceId } });
      const inv = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
      if (inv) {
        const paid = remaining.reduce((s, p) => s + p.amount, 0);
        const balance = inv.totalAmount - paid;
        await tx.invoice.update({
          where: { id: inv.id },
          data: {
            paidAmount: paid,
            balanceAmount: balance,
            paymentStatus: balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID',
          },
        });
      }
    });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete payment' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

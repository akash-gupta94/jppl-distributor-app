import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function GET() {
  try {
    await requireAuth('admin');
    const [
      distributors,
      activeDistributors,
      activeSchemes,
      invoiceAgg,
      paymentAgg,
      salesAgg,
    ] = await Promise.all([
      prisma.distributor.count(),
      prisma.distributor.count({ where: { isActive: true } }),
      prisma.scheme.count({ where: { isActive: true } }),
      prisma.invoice.aggregate({
        where: { isActive: true },
        _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
        _count: true,
      }),
      prisma.payment.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.salesEntry.aggregate({ _sum: { amount: true }, _count: true }),
    ]);
    return NextResponse.json({
      distributors,
      activeDistributors,
      activeSchemes,
      invoices: {
        count: invoiceAgg._count,
        totalAmount: invoiceAgg._sum.totalAmount ?? 0,
        paidAmount: invoiceAgg._sum.paidAmount ?? 0,
        balanceAmount: invoiceAgg._sum.balanceAmount ?? 0,
      },
      payments: {
        count: paymentAgg._count,
        totalAmount: paymentAgg._sum.amount ?? 0,
      },
      directSales: {
        count: salesAgg._count,
        totalAmount: salesAgg._sum.amount ?? 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load stats' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

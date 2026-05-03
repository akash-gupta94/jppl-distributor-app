import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { calculateCreditDays } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');

    const data = await request.json();

    if (!data.invoiceId || !data.amount || !data.paymentDate) {
      return NextResponse.json(
        { error: 'Invoice, amount, and payment date are required' },
        { status: 400 }
      );
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        paymentDate: new Date(data.paymentDate),
        amount: parseFloat(data.amount),
        paymentMode: data.paymentMode || 'CASH',
        referenceNo: data.referenceNo,
        remarks: data.remarks,
      },
    });

    // Update invoice payment status
    const newPaidAmount = invoice.paidAmount + parseFloat(data.amount);
    const newBalanceAmount = invoice.totalAmount - newPaidAmount;
    const creditDays = calculateCreditDays(invoice.invoiceDate, new Date(data.paymentDate));

    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus: newBalanceAmount <= 0 ? 'PAID' : newPaidAmount > 0 ? 'PARTIAL' : 'UNPAID',
        creditDays: newBalanceAmount <= 0 ? creditDays : invoice.creditDays,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

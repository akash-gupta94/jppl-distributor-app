import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET all invoices
export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const distributorId = searchParams.get('distributorId');

    const skip = (page - 1) * limit;
    const where: any = { isActive: true };

    if (distributorId) {
      where.distributorId = distributorId;
    }
    const includeInactive = searchParams.get('includeInactive');
    if (includeInactive === 'true') {
      delete where.isActive;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          distributor: {
            include: {
              distributorLevel: true,
            },
          },
          items: {
            include: {
              itemCategory: true,
            },
          },
          payments: true,
        },
        orderBy: {
          invoiceDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// POST create invoice
export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');

    const data = await request.json();

    if (!data.invoiceNumber || !data.distributorId || !data.invoiceDate) {
      return NextResponse.json(
        { error: 'Invoice number, distributor, and date are required' },
        { status: 400 }
      );
    }

    // Check if invoice number exists
    const existing = await prisma.invoice.findUnique({
      where: { invoiceNumber: data.invoiceNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 409 }
      );
    }

    // Calculate total from items
    const totalAmount = data.items?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        distributorId: data.distributorId,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate || data.invoiceDate),
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        paymentStatus: 'UNPAID',
        items: {
          create: data.items || [],
        },
      },
      include: {
        distributor: true,
        items: {
          include: {
            itemCategory: true,
          },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET single distributor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('admin');

    const distributor = await prisma.distributor.findUnique({
      where: { id: params.id },
      include: {
        distributorLevel: true,
        invoices: {
          take: 10,
          orderBy: { invoiceDate: 'desc' },
        },
        sales: {
          take: 10,
          orderBy: { entryDate: 'desc' },
        },
      },
    });

    if (!distributor) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(distributor);
  } catch (error: any) {
    console.error('Get distributor error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch distributor' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// PUT update distributor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('admin');

    const data = await request.json();

    // Check if distributor exists
    const existing = await prisma.distributor.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    // If phone is being updated, normalize and check for duplicates
    let formattedPhone = existing.phone;
    if (data.phone && data.phone !== existing.phone) {
      const normalizedPhone = data.phone.replace(/\D/g, '');
      formattedPhone = normalizedPhone.length === 10
        ? `+91${normalizedPhone}`
        : `+${normalizedPhone}`;

      const phoneExists = await prisma.distributor.findUnique({
        where: { phone: formattedPhone },
      });

      if (phoneExists && phoneExists.id !== params.id) {
        return NextResponse.json(
          { error: 'Phone number already in use by another distributor' },
          { status: 409 }
        );
      }
    }

    // Update distributor
    const distributor = await prisma.distributor.update({
      where: { id: params.id },
      data: {
        phone: formattedPhone,
        name: data.name,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gstNumber: data.gstNumber,
        distributorLevelId: data.distributorLevelId,
        isActive: data.isActive,
      },
      include: {
        distributorLevel: true,
      },
    });

    return NextResponse.json(distributor);
  } catch (error: any) {
    console.error('Update distributor error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update distributor' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// DELETE distributor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('admin');

    // Check if distributor exists
    const existing = await prisma.distributor.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    // Instead of deleting, mark as inactive (soft delete)
    await prisma.distributor.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete distributor error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete distributor' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

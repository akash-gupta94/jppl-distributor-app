import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET all distributors
export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const levelId = searchParams.get('levelId') || '';
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (levelId) {
      where.distributorLevelId = levelId;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [distributors, total] = await Promise.all([
      prisma.distributor.findMany({
        where,
        include: {
          distributorLevel: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.distributor.count({ where }),
    ]);

    return NextResponse.json({
      distributors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get distributors error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch distributors' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// POST create distributor
export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');

    const data = await request.json();

    // Validate required fields
    if (!data.phone || !data.name || !data.distributorLevelId) {
      return NextResponse.json(
        { error: 'Phone, name, and distributor level are required' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = data.phone.replace(/\D/g, '');
    const formattedPhone = normalizedPhone.length === 10
      ? `+91${normalizedPhone}`
      : `+${normalizedPhone}`;

    // Check if phone already exists
    const existing = await prisma.distributor.findUnique({
      where: { phone: formattedPhone },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Distributor with this phone number already exists' },
        { status: 409 }
      );
    }

    // Create distributor
    const distributor = await prisma.distributor.create({
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
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        distributorLevel: true,
      },
    });

    return NextResponse.json(distributor, { status: 201 });
  } catch (error: any) {
    console.error('Create distributor error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create distributor' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

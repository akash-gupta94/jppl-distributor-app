import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET all schemes
export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const schemes = await prisma.scheme.findMany({
      where,
      include: {
        schemeLevels: {
          include: {
            distributorLevel: true,
          },
        },
        _count: {
          select: {
            achievements: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json({ schemes });
  } catch (error: any) {
    console.error('Get schemes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schemes' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// POST create scheme
export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.startDate || !data.endDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Check if scheme with same name exists
    const existing = await prisma.scheme.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Scheme with this name already exists' },
        { status: 409 }
      );
    }

    // Create scheme with levels
    const scheme = await prisma.scheme.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive !== undefined ? data.isActive : true,
        schemeLevels: {
          create: data.levels || [],
        },
      },
      include: {
        schemeLevels: {
          include: {
            distributorLevel: true,
          },
        },
      },
    });

    return NextResponse.json(scheme, { status: 201 });
  } catch (error: any) {
    console.error('Create scheme error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create scheme' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { computeSchemeProgress } from '@/lib/achievement';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('distributor');
    const { searchParams } = new URL(request.url);
    const requestedSchemeId = searchParams.get('schemeId');

    const distributor = await prisma.distributor.findUnique({
      where: { id: session.userId },
      include: { distributorLevel: true },
    });
    if (!distributor) return NextResponse.json({ error: 'Distributor not found' }, { status: 404 });

    const today = new Date();
    const eligibleSchemes = await prisma.scheme.findMany({
      where: {
        isActive: true,
        schemeLevels: { some: { distributorLevelId: distributor.distributorLevelId } },
      },
      orderBy: { startDate: 'desc' },
    });

    let scheme = null;
    if (requestedSchemeId) {
      scheme = eligibleSchemes.find((s) => s.id === requestedSchemeId) ?? null;
    }
    if (!scheme) {
      scheme =
        eligibleSchemes.find((s) => s.startDate <= today && s.endDate >= today) ??
        eligibleSchemes[0] ??
        null;
    }

    const progress = scheme ? await computeSchemeProgress(distributor.id, scheme.id) : null;

    return NextResponse.json({
      distributor: {
        id: distributor.id,
        name: distributor.name,
        phone: distributor.phone,
        email: distributor.email,
        address: distributor.address,
        city: distributor.city,
        state: distributor.state,
        pincode: distributor.pincode,
        gstNumber: distributor.gstNumber,
        levelName: distributor.distributorLevel.name,
        levelCode: distributor.distributorLevel.code,
      },
      eligibleSchemes: eligibleSchemes.map((s) => ({
        id: s.id,
        name: s.name,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      })),
      progress,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load dashboard' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

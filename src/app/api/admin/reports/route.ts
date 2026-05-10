import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { computeSchemeProgress, getActiveSchemeForDistributor } from '@/lib/achievement';

export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');
    const { searchParams } = new URL(request.url);
    const schemeId = searchParams.get('schemeId');

    const distributors = await prisma.distributor.findMany({
      where: { isActive: true },
      include: { distributorLevel: true },
      orderBy: { name: 'asc' },
    });

    const rows = await Promise.all(
      distributors.map(async (d) => {
        let scheme;
        if (schemeId) {
          scheme = await prisma.scheme.findUnique({ where: { id: schemeId } });
          // Only count if distributor's level is in this scheme
          const sl = await prisma.schemeLevel.findFirst({
            where: { schemeId, distributorLevelId: d.distributorLevelId },
          });
          if (!sl) {
            return {
              distributor: { id: d.id, name: d.name, phone: d.phone, levelName: d.distributorLevel.name },
              schemeName: null,
              progress: null,
            };
          }
        } else {
          scheme = await getActiveSchemeForDistributor(d.id);
        }
        if (!scheme) {
          return {
            distributor: { id: d.id, name: d.name, phone: d.phone, levelName: d.distributorLevel.name },
            schemeName: null,
            progress: null,
          };
        }
        const progress = await computeSchemeProgress(d.id, scheme.id);
        return {
          distributor: { id: d.id, name: d.name, phone: d.phone, levelName: d.distributorLevel.name },
          schemeName: scheme.name,
          progress: progress
            ? {
                yearlyPct: progress.yearly.pct,
                yearlyTarget: progress.yearly.target,
                weightedSales: progress.yearly.weightedSales,
                rawSales: progress.yearly.rawSales,
                currentQuarter: progress.currentQuarter,
                currentQuarterPct: progress.quarters[progress.currentQuarter - 1].pct,
                currentQuarterTimely: progress.quarters[progress.currentQuarter - 1].timelyPaidValue,
                currentQuarterTarget: progress.quarters[progress.currentQuarter - 1].target,
                yearlyRewardNext: progress.yearly.reward.next?.reward ?? null,
              }
            : null,
        };
      }),
    );

    return NextResponse.json({ rows });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load reports' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

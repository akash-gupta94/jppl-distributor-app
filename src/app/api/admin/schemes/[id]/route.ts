import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { findOverlappingSchemes } from '@/lib/achievement';

function sanitizeTiers(input: unknown): { at: number; reward: string }[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((t) => ({
      at: Number((t as any)?.at),
      reward: String((t as any)?.reward ?? ''),
    }))
    .filter((t) => Number.isFinite(t.at) && t.at > 0)
    .sort((a, b) => a.at - b.at);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    const scheme = await prisma.scheme.findUnique({
      where: { id: params.id },
      include: {
        schemeLevels: { include: { distributorLevel: true } },
        schemeCategories: { include: { itemCategory: true } },
      },
    });
    if (!scheme) return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
    return NextResponse.json(scheme);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load scheme' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    const data = await request.json();
    const existing = await prisma.scheme.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });

    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const allowOverlap = data.allowOverlap !== undefined ? !!data.allowOverlap : existing.allowOverlap;
    const levels: Array<any> = Array.isArray(data.levels) ? data.levels : [];
    const categories: Array<any> = Array.isArray(data.categories) ? data.categories : [];

    if (!allowOverlap && levels.length) {
      const conflicts = await findOverlappingSchemes({
        startDate,
        endDate,
        distributorLevelIds: levels.map((l) => l.distributorLevelId),
        ignoreSchemeId: params.id,
      });
      if (conflicts.length) {
        return NextResponse.json(
          {
            error: `Overlaps with existing scheme(s): ${conflicts.map((c) => c.name).join(', ')}. Enable "Allow overlap" to create dual schemes.`,
            conflicts,
          },
          { status: 409 },
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.scheme.update({
        where: { id: params.id },
        data: {
          name: data.name ?? existing.name,
          description: data.description !== undefined ? data.description : existing.description,
          startDate,
          endDate,
          isActive: data.isActive !== undefined ? !!data.isActive : existing.isActive,
          allowOverlap,
        },
      });
      if (Array.isArray(data.levels)) {
        await tx.schemeLevel.deleteMany({ where: { schemeId: params.id } });
        if (levels.length) {
          await tx.schemeLevel.createMany({
            data: levels.map((l) => ({
              schemeId: params.id,
              distributorLevelId: l.distributorLevelId,
              name: l.name || '',
              q1Target: Number(l.q1Target ?? 0),
              q2Target: Number(l.q2Target ?? 0),
              q3Target: Number(l.q3Target ?? 0),
              q4Target: Number(l.q4Target ?? 0),
              yearlyTarget: Number(l.yearlyTarget ?? 0),
              q1Reward: Number(l.q1Reward ?? 0),
              q2Reward: Number(l.q2Reward ?? 0),
              q3Reward: Number(l.q3Reward ?? 0),
              q4Reward: Number(l.q4Reward ?? 0),
              yearlyReward: Number(l.yearlyReward ?? 0),
              quarterlyRewardTiers: sanitizeTiers(l.quarterlyRewardTiers),
              yearlyRewardTiers: sanitizeTiers(l.yearlyRewardTiers),
              maxCreditDays: Number(l.maxCreditDays ?? 30),
              timelyPaymentRequired: l.timelyPaymentRequired !== undefined ? !!l.timelyPaymentRequired : true,
            })),
          });
        }
      }
      if (Array.isArray(data.categories)) {
        await tx.schemeCategory.deleteMany({ where: { schemeId: params.id } });
        if (categories.length) {
          await tx.schemeCategory.createMany({
            data: categories.map((c) => ({
              schemeId: params.id,
              itemCategoryId: c.itemCategoryId,
              weight: Number(c.weight ?? 100),
              minMix: Number(c.minMix ?? 0),
              reward: c.reward ?? null,
            })),
          });
        }
      }
      return tx.scheme.findUnique({
        where: { id: params.id },
        include: {
          schemeLevels: { include: { distributorLevel: true } },
          schemeCategories: { include: { itemCategory: true } },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update scheme' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    // Soft-deactivate; preserves achievement history
    const updated = await prisma.scheme.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return NextResponse.json({ deactivated: true, scheme: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to close scheme' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

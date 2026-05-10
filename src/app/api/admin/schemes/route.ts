import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { findOverlappingSchemes } from '@/lib/achievement';

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
        schemeLevels: { include: { distributorLevel: true } },
        schemeCategories: { include: { itemCategory: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json({ schemes });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schemes' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

interface LevelInput {
  distributorLevelId: string;
  name?: string;
  q1Target?: number;
  q2Target?: number;
  q3Target?: number;
  q4Target?: number;
  yearlyTarget?: number;
  q1Reward?: number;
  q2Reward?: number;
  q3Reward?: number;
  q4Reward?: number;
  yearlyReward?: number;
  quarterlyRewardTiers?: Array<{ at: number; reward: string }>;
  yearlyRewardTiers?: Array<{ at: number; reward: string }>;
  maxCreditDays?: number;
  timelyPaymentRequired?: boolean;
}

interface CategoryInput {
  itemCategoryId: string;
  weight: number;
  minMix: number;
  reward?: string | null;
}

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

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');
    const data = await request.json();
    if (!data.name || !data.startDate || !data.endDate) {
      return NextResponse.json(
        { error: 'Name, start date and end date are required' },
        { status: 400 },
      );
    }
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const levels: LevelInput[] = Array.isArray(data.levels) ? data.levels : [];
    if (!levels.length) {
      return NextResponse.json(
        { error: 'Add at least one eligible distributor level' },
        { status: 400 },
      );
    }
    const categories: CategoryInput[] = Array.isArray(data.categories) ? data.categories : [];

    const allowOverlap = !!data.allowOverlap;
    if (!allowOverlap) {
      const conflicts = await findOverlappingSchemes({
        startDate,
        endDate,
        distributorLevelIds: levels.map((l) => l.distributorLevelId),
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

    const existing = await prisma.scheme.findUnique({ where: { name: data.name } });
    if (existing) {
      return NextResponse.json({ error: 'Scheme with this name already exists' }, { status: 409 });
    }

    const scheme = await prisma.scheme.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        startDate,
        endDate,
        isActive: data.isActive !== undefined ? !!data.isActive : true,
        allowOverlap,
        schemeLevels: {
          create: levels.map((l) => ({
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
        },
        schemeCategories: {
          create: categories.map((c) => ({
            itemCategoryId: c.itemCategoryId,
            weight: Number(c.weight ?? 100),
            minMix: Number(c.minMix ?? 0),
            reward: c.reward ?? null,
          })),
        },
      },
      include: {
        schemeLevels: { include: { distributorLevel: true } },
        schemeCategories: { include: { itemCategory: true } },
      },
    });

    return NextResponse.json(scheme, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create scheme' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

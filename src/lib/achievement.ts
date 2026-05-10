import prisma from '@/lib/prisma';

/**
 * The achievement engine. Computes a distributor's progress against a scheme:
 *  - quarterly progress = invoices issued in that quarter and paid in full within
 *    the configured credit-days window (timely-payment gate)
 *  - yearly progress = sum over invoice items in the scheme window of
 *    quantity * rate * categoryWeight, plus any direct sales entries (weight 1.0)
 *
 * Quarter boundaries are derived from the scheme's startDate. A scheme runs in
 * 4 equal 3-month quarters from its start date. So "Q1" of an Apr 1 - Mar 31
 * scheme is Apr-Jun, "Q1" of a Jul 1 - Jun 30 scheme is Jul-Sep, etc.
 */

export interface RewardTier {
  at: number;
  reward: string;
}

export interface RewardState {
  achieved: RewardTier | null;
  next: RewardTier | null;
  tiers: RewardTier[];
}

export interface CategoryProgress {
  itemCategoryId: string;
  name: string;
  code: string;
  weight: number; // percent
  minMix: number; // percent
  reward: string | null;
  raw: number; // raw sales value in this category, in scheme window
  weighted: number; // weighted contribution to yearly target
  share: number; // raw / total raw, as a percent
  unlocked: boolean; // share >= minMix (or raw > 0 if minMix is 0)
}

export interface QuarterProgress {
  quarter: 1 | 2 | 3 | 4;
  startDate: string; // ISO date
  endDate: string; // ISO date
  target: number;
  // Sum of invoice values for invoices issued in this quarter that are paid in
  // full on or before the due date.
  timelyPaidValue: number;
  // Sum of all invoice values for invoices issued in this quarter (regardless of payment).
  totalInvoiceValue: number;
  pct: number; // timelyPaidValue / target * 100
  reward: RewardState;
  flatReward: number; // legacy single reward amount
}

export interface SchemeProgress {
  scheme: {
    id: string;
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  distributor: {
    id: string;
    name: string;
    phone: string;
    levelId: string;
    levelName: string;
  };
  schemeLevel: {
    id: string;
    name: string;
    yearlyTarget: number;
    yearlyReward: number;
    maxCreditDays: number;
  } | null;
  currentQuarter: 1 | 2 | 3 | 4;
  quarters: QuarterProgress[];
  yearly: {
    target: number;
    rawSales: number;
    weightedSales: number;
    pct: number;
    reward: RewardState;
    flatReward: number;
  };
  categories: CategoryProgress[];
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    paymentStatus: string;
    onTime: boolean;
    lastPaymentDate: string | null;
    quarter: 1 | 2 | 3 | 4 | null;
  }>;
  sales: Array<{
    id: string;
    entryDate: string;
    amount: number;
    remarks: string | null;
  }>;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  const out = new Date(date);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}

function quarterRanges(schemeStart: Date): Array<{ start: Date; end: Date }> {
  const ranges: Array<{ start: Date; end: Date }> = [];
  for (let q = 0; q < 4; q++) {
    const start = addMonths(schemeStart, q * 3);
    const next = addMonths(schemeStart, (q + 1) * 3);
    const end = new Date(next.getTime() - 1);
    ranges.push({ start, end });
  }
  return ranges;
}

function quarterFor(date: Date, ranges: ReturnType<typeof quarterRanges>): 1 | 2 | 3 | 4 | null {
  for (let i = 0; i < ranges.length; i++) {
    if (date >= ranges[i].start && date <= ranges[i].end) {
      return (i + 1) as 1 | 2 | 3 | 4;
    }
  }
  return null;
}

function rewardState(rawTiers: unknown, pct: number): RewardState {
  let tiers: RewardTier[] = [];
  if (Array.isArray(rawTiers)) {
    tiers = rawTiers
      .filter((t): t is { at: number; reward: string } => typeof t === 'object' && t !== null && 'at' in t)
      .map((t) => ({ at: Number((t as any).at), reward: String((t as any).reward ?? '') }))
      .filter((t) => Number.isFinite(t.at) && t.at > 0)
      .sort((a, b) => a.at - b.at);
  }
  const achieved = tiers.filter((t) => pct >= t.at).at(-1) ?? null;
  const next = tiers.find((t) => pct < t.at) ?? null;
  return { achieved, next, tiers };
}

/**
 * Returns the most relevant scheme for a distributor today:
 *  - active schemes that include the distributor's level
 *  - prefer schemes whose date range covers today; otherwise the most recent
 */
export async function getActiveSchemeForDistributor(distributorId: string) {
  const dist = await prisma.distributor.findUnique({
    where: { id: distributorId },
    select: { id: true, distributorLevelId: true },
  });
  if (!dist) return null;

  const today = new Date();
  const matching = await prisma.scheme.findMany({
    where: {
      isActive: true,
      schemeLevels: { some: { distributorLevelId: dist.distributorLevelId } },
    },
    orderBy: { startDate: 'desc' },
  });
  if (!matching.length) return null;
  const current = matching.find((s) => s.startDate <= today && s.endDate >= today);
  return current ?? matching[0];
}

/**
 * Compute the full progress object for a (distributor, scheme) pair.
 * Returns null if the distributor has no SchemeLevel row in this scheme
 * (i.e. is not eligible for it).
 */
export async function computeSchemeProgress(
  distributorId: string,
  schemeId: string,
): Promise<SchemeProgress | null> {
  const [distributor, scheme] = await Promise.all([
    prisma.distributor.findUnique({
      where: { id: distributorId },
      include: { distributorLevel: true },
    }),
    prisma.scheme.findUnique({
      where: { id: schemeId },
      include: {
        schemeLevels: { include: { distributorLevel: true } },
        schemeCategories: { include: { itemCategory: true } },
      },
    }),
  ]);
  if (!distributor || !scheme) return null;

  const schemeLevel = scheme.schemeLevels.find(
    (sl) => sl.distributorLevelId === distributor.distributorLevelId,
  );

  // Pull every invoice + items + payments and every direct sales entry within window.
  const invoiceRows = await prisma.invoice.findMany({
    where: {
      distributorId,
      isActive: true,
      invoiceDate: { gte: scheme.startDate, lte: scheme.endDate },
    },
    include: {
      items: { include: { itemCategory: true } },
      payments: { orderBy: { paymentDate: 'desc' } },
    },
    orderBy: { invoiceDate: 'desc' },
  });

  const salesRows = await prisma.salesEntry.findMany({
    where: {
      distributorId,
      entryDate: { gte: scheme.startDate, lte: scheme.endDate },
    },
    orderBy: { entryDate: 'desc' },
  });

  // Build per-scheme category weight overrides; fall back to ItemCategory.weightage * 100.
  const overrides = new Map(
    scheme.schemeCategories.map((sc) => [
      sc.itemCategoryId,
      { weight: sc.weight, minMix: sc.minMix, reward: sc.reward },
    ]),
  );

  const categoryAgg = new Map<
    string,
    { name: string; code: string; weight: number; minMix: number; reward: string | null; raw: number; weighted: number }
  >();

  let totalRawFromInvoices = 0;
  for (const inv of invoiceRows) {
    for (const item of inv.items) {
      const cat = item.itemCategory;
      const ov = overrides.get(cat.id);
      const weightPct = ov ? ov.weight : cat.weightage * 100;
      const minMix = ov ? ov.minMix : 0;
      const reward = ov ? ov.reward : null;
      const cur = categoryAgg.get(cat.id) ?? {
        name: cat.name,
        code: cat.code,
        weight: weightPct,
        minMix,
        reward,
        raw: 0,
        weighted: 0,
      };
      cur.raw += item.amount;
      cur.weighted += item.amount * (weightPct / 100);
      categoryAgg.set(cat.id, cur);
      totalRawFromInvoices += item.amount;
    }
  }

  // Direct sales entries contribute at weight 1.0 with no category attribution.
  const directSalesTotal = salesRows.reduce((s, r) => s + r.amount, 0);

  // Make sure we list every category configured in the scheme, even if zero sales.
  for (const sc of scheme.schemeCategories) {
    if (!categoryAgg.has(sc.itemCategoryId)) {
      categoryAgg.set(sc.itemCategoryId, {
        name: sc.itemCategory.name,
        code: sc.itemCategory.code,
        weight: sc.weight,
        minMix: sc.minMix,
        reward: sc.reward,
        raw: 0,
        weighted: 0,
      });
    }
  }

  const totalRaw = totalRawFromInvoices + directSalesTotal;
  const categories: CategoryProgress[] = Array.from(categoryAgg.entries()).map(([id, c]) => ({
    itemCategoryId: id,
    name: c.name,
    code: c.code,
    weight: c.weight,
    minMix: c.minMix,
    reward: c.reward,
    raw: c.raw,
    weighted: c.weighted,
    share: totalRaw ? (c.raw / totalRaw) * 100 : 0,
    unlocked: c.minMix ? (totalRaw ? (c.raw / totalRaw) * 100 >= c.minMix : false) : c.raw > 0,
  }));

  const ranges = quarterRanges(scheme.startDate);
  const today = new Date();
  const currentQuarter = quarterFor(today, ranges) ?? 1;

  const maxCreditDays = schemeLevel?.maxCreditDays ?? 30;

  const enrichedInvoices = invoiceRows.map((inv) => {
    const lastPayment = inv.payments[0]?.paymentDate ?? null;
    const fullyPaid = inv.paidAmount >= inv.totalAmount && inv.totalAmount > 0;
    const allowedDueDate = new Date(inv.invoiceDate.getTime() + maxCreditDays * MS_PER_DAY);
    const onTime = !!(fullyPaid && lastPayment && lastPayment <= (inv.dueDate ?? allowedDueDate) && lastPayment <= allowedDueDate);
    const q = quarterFor(inv.invoiceDate, ranges);
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: isoDate(inv.invoiceDate),
      dueDate: isoDate(inv.dueDate),
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      balanceAmount: inv.balanceAmount,
      paymentStatus: inv.paymentStatus,
      onTime,
      lastPaymentDate: lastPayment ? isoDate(lastPayment) : null,
      quarter: q,
    };
  });

  const quarters: QuarterProgress[] = ranges.map((range, i) => {
    const q = (i + 1) as 1 | 2 | 3 | 4;
    const invsInQ = enrichedInvoices.filter((iv) => iv.quarter === q);
    const timely = invsInQ.filter((iv) => iv.onTime).reduce((s, iv) => s + iv.totalAmount, 0);
    const total = invsInQ.reduce((s, iv) => s + iv.totalAmount, 0);
    const target =
      schemeLevel
        ? q === 1
          ? schemeLevel.q1Target
          : q === 2
          ? schemeLevel.q2Target
          : q === 3
          ? schemeLevel.q3Target
          : schemeLevel.q4Target
        : 0;
    const flatReward =
      schemeLevel
        ? q === 1
          ? schemeLevel.q1Reward
          : q === 2
          ? schemeLevel.q2Reward
          : q === 3
          ? schemeLevel.q3Reward
          : schemeLevel.q4Reward
        : 0;
    const pct = target ? (timely / target) * 100 : 0;
    return {
      quarter: q,
      startDate: isoDate(range.start),
      endDate: isoDate(range.end),
      target,
      timelyPaidValue: timely,
      totalInvoiceValue: total,
      pct,
      reward: rewardState(schemeLevel?.quarterlyRewardTiers, pct),
      flatReward,
    };
  });

  const weightedSales =
    Array.from(categoryAgg.values()).reduce((s, c) => s + c.weighted, 0) + directSalesTotal;
  const yearlyTarget = schemeLevel?.yearlyTarget ?? 0;
  const yearlyPct = yearlyTarget ? (weightedSales / yearlyTarget) * 100 : 0;

  return {
    scheme: {
      id: scheme.id,
      name: scheme.name,
      description: scheme.description,
      startDate: isoDate(scheme.startDate),
      endDate: isoDate(scheme.endDate),
      isActive: scheme.isActive,
    },
    distributor: {
      id: distributor.id,
      name: distributor.name,
      phone: distributor.phone,
      levelId: distributor.distributorLevelId,
      levelName: distributor.distributorLevel.name,
    },
    schemeLevel: schemeLevel
      ? {
          id: schemeLevel.id,
          name: schemeLevel.name,
          yearlyTarget: schemeLevel.yearlyTarget,
          yearlyReward: schemeLevel.yearlyReward,
          maxCreditDays: schemeLevel.maxCreditDays,
        }
      : null,
    currentQuarter,
    quarters,
    yearly: {
      target: yearlyTarget,
      rawSales: totalRaw,
      weightedSales,
      pct: yearlyPct,
      reward: rewardState(schemeLevel?.yearlyRewardTiers, yearlyPct),
      flatReward: schemeLevel?.yearlyReward ?? 0,
    },
    categories,
    invoices: enrichedInvoices,
    sales: salesRows.map((s) => ({
      id: s.id,
      entryDate: isoDate(s.entryDate),
      amount: s.amount,
      remarks: s.remarks,
    })),
  };
}

/**
 * Validates that a new or updated scheme does not overlap an existing active
 * scheme for any of the same distributor levels (unless allowOverlap is true
 * on either scheme).
 */
export async function findOverlappingSchemes(params: {
  startDate: Date;
  endDate: Date;
  distributorLevelIds: string[];
  ignoreSchemeId?: string;
}): Promise<Array<{ id: string; name: string; conflictingLevelIds: string[] }>> {
  const { startDate, endDate, distributorLevelIds, ignoreSchemeId } = params;
  if (!distributorLevelIds.length) return [];
  const others = await prisma.scheme.findMany({
    where: {
      isActive: true,
      allowOverlap: false,
      ...(ignoreSchemeId ? { id: { not: ignoreSchemeId } } : {}),
      AND: [
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } },
      ],
      schemeLevels: { some: { distributorLevelId: { in: distributorLevelIds } } },
    },
    include: { schemeLevels: true },
  });
  return others.map((s) => ({
    id: s.id,
    name: s.name,
    conflictingLevelIds: s.schemeLevels
      .map((sl) => sl.distributorLevelId)
      .filter((id) => distributorLevelIds.includes(id)),
  }));
}

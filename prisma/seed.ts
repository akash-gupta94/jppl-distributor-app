import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed produces a fully-functional demo:
 *  - Admin
 *  - 8 distributor levels
 *  - 5 item categories
 *  - 1 active scheme covering "today" with per-level targets, tiered rewards,
 *    and per-scheme category configs (weight + min mix %)
 *  - 1 sample distributor at "Gold Plus"
 *  - A handful of invoices with multi-category line items, plus payments
 *    (some on time, some late), and a few direct sales entries — so the
 *    distributor's mobile dashboard shows real progress.
 */

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function nextDay(d: Date, days: number) {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

async function main() {
  console.log('🌱 Starting database seed…');

  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@jppl.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@jppl.com',
      password: adminPassword,
      name: 'System Administrator',
    },
  });
  console.log('✅ Admin:', admin.email);

  const distributorLevels = [
    { name: 'Platinum Plus', code: 'L1', description: 'Top tier distributor', priority: 1 },
    { name: 'Platinum', code: 'L2', description: 'Premium distributor', priority: 2 },
    { name: 'Gold Plus', code: 'L3', description: 'High value distributor', priority: 3 },
    { name: 'Gold', code: 'L4', description: 'Mid-high value distributor', priority: 4 },
    { name: 'Silver Plus', code: 'L5', description: 'Mid value distributor', priority: 5 },
    { name: 'Silver', code: 'L6', description: 'Standard distributor', priority: 6 },
    { name: 'Bronze', code: 'L7', description: 'Entry level distributor', priority: 7 },
    { name: 'Starter', code: 'L8', description: 'New distributor', priority: 8 },
  ];
  for (const level of distributorLevels) {
    await prisma.distributorLevel.upsert({
      where: { code: level.code },
      update: {},
      create: level,
    });
  }
  console.log('✅ Distributor levels (8)');

  const itemCategories = [
    { name: 'Premium Products', code: 'CAT1', description: 'High margin premium items', weightage: 1.35 },
    { name: 'Standard Products', code: 'CAT2', description: 'Regular product line', weightage: 1.0 },
    { name: 'Value Products', code: 'CAT3', description: 'Economy product line', weightage: 0.8 },
    { name: 'Seasonal Products', code: 'CAT4', description: 'Seasonal special items', weightage: 1.2 },
    { name: 'New Launch', code: 'CAT5', description: 'Newly launched products', weightage: 1.25 },
  ];
  for (const category of itemCategories) {
    await prisma.itemCategory.upsert({
      where: { code: category.code },
      update: {},
      create: category,
    });
  }
  console.log('✅ Item categories (5)');

  // Build a scheme that covers today with 4 quarters worth of room.
  // We pick April 1 of last year if today is in Apr-Mar, otherwise the previous April.
  const today = new Date();
  const month = today.getUTCMonth(); // 0-11
  const year = today.getUTCFullYear();
  const fyStartYear = month >= 3 ? year : year - 1; // Apr-Mar financial year
  const startDate = new Date(Date.UTC(fyStartYear, 3, 1)); // Apr 1
  const endDate = new Date(Date.UTC(fyStartYear + 1, 2, 31, 23, 59, 59)); // Mar 31
  const schemeName = `Annual Scheme ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;

  const allLevels = await prisma.distributorLevel.findMany({ orderBy: { priority: 'asc' } });
  const topLevels = allLevels.slice(0, 5); // top 5 levels are eligible
  const allCategories = await prisma.itemCategory.findMany({ orderBy: { name: 'asc' } });

  // Wipe existing scheme with same name to keep seed idempotent
  await prisma.scheme.deleteMany({ where: { name: schemeName } });

  const scheme = await prisma.scheme.create({
    data: {
      name: schemeName,
      description: 'Annual performance scheme — quarterly rewards for timely payment, yearly rewards for category-weighted sales.',
      startDate,
      endDate,
      isActive: true,
      allowOverlap: false,
      schemeCategories: {
        create: allCategories.map((c) => ({
          itemCategoryId: c.id,
          weight: Math.round(c.weightage * 100), // convert to percent
          minMix: c.code === 'CAT1' ? 20 : c.code === 'CAT2' ? 30 : c.code === 'CAT3' ? 12 : c.code === 'CAT4' ? 12 : 10,
          reward: c.code === 'CAT1' ? 'Premium category bonus' : c.code === 'CAT5' ? 'New launch growth reward' : null,
        })),
      },
    },
  });

  // Per-level targets and tiered rewards
  const levelConfigs = [
    {
      level: topLevels[0], // Platinum Plus
      qTarget: 2600000,
      yearlyTarget: 11000000,
      yearlyReward: 500000,
      qReward: 100000,
      qTiers: [
        { at: 80, reward: 'Dealer meet sponsorship' },
        { at: 100, reward: '₹90,000 travel voucher' },
        { at: 120, reward: 'International trip upgrade' },
      ],
      yTiers: [
        { at: 85, reward: 'Priority rebate slab' },
        { at: 100, reward: '₹4,00,000 business development fund' },
        { at: 125, reward: 'Executive car support' },
      ],
    },
    {
      level: topLevels[1], // Platinum
      qTarget: 1700000,
      yearlyTarget: 7800000,
      yearlyReward: 300000,
      qReward: 60000,
      qTiers: [
        { at: 80, reward: '₹18,000 gift voucher' },
        { at: 100, reward: '₹55,000 travel voucher' },
        { at: 120, reward: 'Family holiday upgrade' },
      ],
      yTiers: [
        { at: 85, reward: 'Priority rebate slab' },
        { at: 100, reward: '₹2,25,000 business development fund' },
        { at: 125, reward: 'Car down-payment support' },
      ],
    },
    {
      level: topLevels[2], // Gold Plus
      qTarget: 950000,
      yearlyTarget: 4300000,
      yearlyReward: 180000,
      qReward: 40000,
      qTiers: [
        { at: 80, reward: '₹10,000 gift voucher' },
        { at: 100, reward: '₹28,000 electronics reward' },
        { at: 120, reward: 'Premium appliance upgrade' },
      ],
      yTiers: [
        { at: 85, reward: 'Priority rebate slab' },
        { at: 100, reward: '₹1,10,000 store upgrade support' },
        { at: 125, reward: 'Premium branding package' },
      ],
    },
    {
      level: topLevels[3], // Gold
      qTarget: 520000,
      yearlyTarget: 2300000,
      yearlyReward: 100000,
      qReward: 20000,
      qTiers: [
        { at: 80, reward: '₹6,000 gift voucher' },
        { at: 100, reward: '₹15,000 merchandise reward' },
        { at: 120, reward: 'Smartphone reward' },
      ],
      yTiers: [
        { at: 85, reward: 'Priority rebate slab' },
        { at: 100, reward: '₹55,000 store branding support' },
        { at: 125, reward: 'Display wall makeover' },
      ],
    },
    {
      level: topLevels[4], // Silver Plus
      qTarget: 280000,
      yearlyTarget: 1200000,
      yearlyReward: 50000,
      qReward: 10000,
      qTiers: [
        { at: 80, reward: '₹3,000 voucher' },
        { at: 100, reward: '₹8,000 voucher' },
        { at: 120, reward: 'Branded merchandise' },
      ],
      yTiers: [
        { at: 85, reward: 'Priority rebate slab' },
        { at: 100, reward: '₹25,000 branding support' },
      ],
    },
  ];

  for (const cfg of levelConfigs) {
    await prisma.schemeLevel.create({
      data: {
        schemeId: scheme.id,
        distributorLevelId: cfg.level.id,
        name: `${cfg.level.name} Target`,
        q1Target: cfg.qTarget,
        q2Target: cfg.qTarget,
        q3Target: cfg.qTarget,
        q4Target: cfg.qTarget,
        yearlyTarget: cfg.yearlyTarget,
        q1Reward: cfg.qReward,
        q2Reward: cfg.qReward,
        q3Reward: cfg.qReward,
        q4Reward: cfg.qReward,
        yearlyReward: cfg.yearlyReward,
        quarterlyRewardTiers: cfg.qTiers,
        yearlyRewardTiers: cfg.yTiers,
        timelyPaymentRequired: true,
        maxCreditDays: 30,
      },
    });
  }
  console.log('✅ Scheme:', scheme.name, 'with', levelConfigs.length, 'eligible levels');

  // Sample distributor at "Gold Plus" (so they see meaningful targets)
  const goldPlus = topLevels[2];
  const sampleDistributor = await prisma.distributor.upsert({
    where: { phone: '+919876543210' },
    update: {
      distributorLevelId: goldPlus.id,
    },
    create: {
      phone: '+919876543210',
      name: 'Sample Distributor Pvt Ltd',
      email: 'distributor@example.com',
      address: '123 Business Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gstNumber: '27AABCU9603R1ZM',
      distributorLevelId: goldPlus.id,
      isActive: true,
    },
  });
  console.log('✅ Sample distributor:', sampleDistributor.phone);

  // Wipe & re-seed sample distributor's invoices/payments/sales for idempotency
  await prisma.payment.deleteMany({ where: { invoice: { distributorId: sampleDistributor.id } } });
  await prisma.invoiceItem.deleteMany({ where: { invoice: { distributorId: sampleDistributor.id } } });
  await prisma.invoice.deleteMany({ where: { distributorId: sampleDistributor.id } });
  await prisma.salesEntry.deleteMany({ where: { distributorId: sampleDistributor.id } });

  // Pull fresh categories for ID lookup
  const cats = await prisma.itemCategory.findMany();
  const cat = (code: string) => cats.find((c) => c.code === code)!;

  // Build invoices anchored to the scheme's start date so they always fall inside
  // it regardless of when the seed runs. We aim for visible progress in the
  // current quarter: a few timely-paid, one late, and a couple still open.
  // schemeStartDays = number of days *after* scheme start to issue the invoice.
  const invoicePlans: Array<{
    schemeStartDays: number;
    creditDays: number;
    invoiceNumber: string;
    items: Array<{ catCode: string; quantity: number; rate: number }>;
    payment?: { daysAfterInvoice: number; mode: string };
  }> = [
    {
      schemeStartDays: 5, // very early in Q1
      creditDays: 30,
      invoiceNumber: 'INV-2526-101',
      items: [
        { catCode: 'CAT1', quantity: 50, rate: 4500 },
        { catCode: 'CAT2', quantity: 80, rate: 2200 },
        { catCode: 'CAT3', quantity: 40, rate: 1500 },
      ],
      payment: { daysAfterInvoice: 22, mode: 'NEFT' }, // on time
    },
    {
      schemeStartDays: 18,
      creditDays: 30,
      invoiceNumber: 'INV-2526-118',
      items: [
        { catCode: 'CAT2', quantity: 120, rate: 2200 },
        { catCode: 'CAT4', quantity: 30, rate: 3500 },
      ],
      payment: { daysAfterInvoice: 28, mode: 'RTGS' }, // on time (just)
    },
    {
      schemeStartDays: 25,
      creditDays: 30,
      invoiceNumber: 'INV-2526-127',
      items: [
        { catCode: 'CAT1', quantity: 35, rate: 4500 },
        { catCode: 'CAT5', quantity: 20, rate: 5000 },
      ],
      payment: { daysAfterInvoice: 18, mode: 'UPI' }, // on time
    },
    {
      schemeStartDays: 32,
      creditDays: 30,
      invoiceNumber: 'INV-2526-145',
      items: [
        { catCode: 'CAT2', quantity: 70, rate: 2200 },
        { catCode: 'CAT3', quantity: 50, rate: 1500 },
        { catCode: 'CAT4', quantity: 25, rate: 3500 },
      ],
      payment: { daysAfterInvoice: 42, mode: 'CHEQUE' }, // late
    },
    {
      schemeStartDays: 41,
      creditDays: 30,
      invoiceNumber: 'INV-2526-160',
      items: [
        { catCode: 'CAT1', quantity: 30, rate: 4500 },
        { catCode: 'CAT2', quantity: 60, rate: 2200 },
      ],
      // unpaid yet
    },
    {
      schemeStartDays: 50,
      creditDays: 30,
      invoiceNumber: 'INV-2526-172',
      items: [
        { catCode: 'CAT5', quantity: 15, rate: 5000 },
        { catCode: 'CAT2', quantity: 40, rate: 2200 },
      ],
      // unpaid yet
    },
  ];

  let invoicesCreated = 0;
  for (const plan of invoicePlans) {
    const invoiceDate = nextDay(startDate, plan.schemeStartDays);
    const dueDate = nextDay(invoiceDate, plan.creditDays);
    const items = plan.items.map((it) => ({
      itemCategoryId: cat(it.catCode).id,
      quantity: it.quantity,
      rate: it.rate,
      amount: it.quantity * it.rate,
    }));
    const total = items.reduce((s, it) => s + it.amount, 0);
    let paidAmount = 0;
    if (plan.payment) {
      paidAmount = total;
    }
    const inv = await prisma.invoice.create({
      data: {
        invoiceNumber: plan.invoiceNumber,
        distributorId: sampleDistributor.id,
        invoiceDate,
        dueDate,
        totalAmount: total,
        paidAmount,
        balanceAmount: total - paidAmount,
        paymentStatus: paidAmount >= total ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID',
        creditDays: plan.creditDays,
        items: { create: items },
      },
    });
    if (plan.payment) {
      await prisma.payment.create({
        data: {
          invoiceId: inv.id,
          paymentDate: nextDay(invoiceDate, plan.payment.daysAfterInvoice),
          amount: total,
          paymentMode: plan.payment.mode,
        },
      });
    }
    invoicesCreated++;
  }
  console.log('✅ Sample invoices:', invoicesCreated);

  // A few direct sales entries (no category) — placed inside the scheme window
  await prisma.salesEntry.createMany({
    data: [
      { distributorId: sampleDistributor.id, entryDate: nextDay(startDate, 12), amount: 45000, remarks: 'Cash counter sale' },
      { distributorId: sampleDistributor.id, entryDate: nextDay(startDate, 36), amount: 32000, remarks: 'Walk-in dealer pickup' },
    ],
  });
  console.log('✅ Direct sales entries (2)');

  console.log('🎉 Database seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

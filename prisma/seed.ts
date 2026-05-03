import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Admin User
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
  console.log('✅ Admin user created:', admin.email);

  // Create Distributor Levels
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
  console.log('✅ Distributor levels created');

  // Create Item Categories
  const itemCategories = [
    { name: 'Premium Products', code: 'CAT1', description: 'High margin premium items', weightage: 1.5 },
    { name: 'Standard Products', code: 'CAT2', description: 'Regular product line', weightage: 1.0 },
    { name: 'Value Products', code: 'CAT3', description: 'Economy product line', weightage: 0.8 },
    { name: 'Seasonal Products', code: 'CAT4', description: 'Seasonal special items', weightage: 1.2 },
    { name: 'New Launch', code: 'CAT5', description: 'Newly launched products', weightage: 1.3 },
  ];

  for (const category of itemCategories) {
    await prisma.itemCategory.upsert({
      where: { code: category.code },
      update: {},
      create: category,
    });
  }
  console.log('✅ Item categories created');

  // Create a sample scheme
  const scheme = await prisma.scheme.upsert({
    where: { name: 'Annual Scheme 2024-25' },
    update: {},
    create: {
      name: 'Annual Scheme 2024-25',
      description: 'Annual performance scheme from April 2024 to March 2025',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      isActive: true,
    },
  });
  console.log('✅ Sample scheme created');

  // Create scheme levels for top 5 distributor levels
  const topLevels = await prisma.distributorLevel.findMany({
    where: { priority: { lte: 5 } },
    orderBy: { priority: 'asc' },
  });

  const schemeLevelTargets = [
    { q1: 5000000, q2: 6000000, q3: 5500000, q4: 7000000, yearly: 23500000, q1R: 100000, q2R: 120000, q3R: 110000, q4R: 150000, yearlyR: 500000 },
    { q1: 3000000, q2: 3500000, q3: 3200000, q4: 4000000, yearly: 13700000, q1R: 60000, q2R: 70000, q3R: 65000, q4R: 80000, yearlyR: 300000 },
    { q1: 2000000, q2: 2300000, q3: 2100000, q4: 2500000, yearly: 8900000, q1R: 40000, q2R: 46000, q3R: 42000, q4R: 50000, yearlyR: 180000 },
    { q1: 1000000, q2: 1200000, q3: 1100000, q4: 1300000, yearly: 4600000, q1R: 20000, q2R: 24000, q3R: 22000, q4R: 26000, yearlyR: 100000 },
    { q1: 500000, q2: 600000, q3: 550000, q4: 650000, yearly: 2300000, q1R: 10000, q2R: 12000, q3R: 11000, q4R: 13000, yearlyR: 50000 },
  ];

  for (let i = 0; i < topLevels.length && i < schemeLevelTargets.length; i++) {
    const level = topLevels[i];
    const targets = schemeLevelTargets[i];

    await prisma.schemeLevel.upsert({
      where: {
        schemeId_distributorLevelId: {
          schemeId: scheme.id,
          distributorLevelId: level.id,
        },
      },
      update: {},
      create: {
        schemeId: scheme.id,
        distributorLevelId: level.id,
        name: `${level.name} Target`,
        q1Target: targets.q1,
        q2Target: targets.q2,
        q3Target: targets.q3,
        q4Target: targets.q4,
        yearlyTarget: targets.yearly,
        q1Reward: targets.q1R,
        q2Reward: targets.q2R,
        q3Reward: targets.q3R,
        q4Reward: targets.q4R,
        yearlyReward: targets.yearlyR,
        timelyPaymentRequired: true,
        maxCreditDays: 30,
      },
    });
  }
  console.log('✅ Scheme levels created');

  // Create a sample distributor
  const sampleDistributor = await prisma.distributor.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      phone: '+919876543210',
      name: 'Sample Distributor Pvt Ltd',
      email: 'distributor@example.com',
      address: '123 Business Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gstNumber: '27AABCU9603R1ZM',
      distributorLevelId: topLevels[2].id, // Gold Plus level
      isActive: true,
    },
  });
  console.log('✅ Sample distributor created:', sampleDistributor.phone);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

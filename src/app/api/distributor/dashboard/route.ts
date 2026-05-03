import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { getQuarter, getFinancialYear, getQuarterDateRange } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('distributor');

    // Get distributor with level
    const distributor = await prisma.distributor.findUnique({
      where: { id: session.userId },
      include: {
        distributorLevel: true,
      },
    });

    if (!distributor) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }

    // Get active schemes for this distributor level
    const currentDate = new Date();
    const activeSchemes = await prisma.scheme.findMany({
      where: {
        isActive: true,
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
        schemeLevels: {
          some: {
            distributorLevelId: distributor.distributorLevelId,
          },
        },
      },
      include: {
        schemeLevels: {
          where: {
            distributorLevelId: distributor.distributorLevelId,
          },
        },
      },
    });

    // Calculate current quarter and year achievements
    const currentQuarter = getQuarter(currentDate);
    const financialYear = getFinancialYear(currentDate);
    const quarterRange = getQuarterDateRange(currentQuarter, financialYear);

    // Get sales for current quarter
    const quarterlySales = await prisma.invoice.aggregate({
      where: {
        distributorId: session.userId,
        invoiceDate: {
          gte: quarterRange.start,
          lte: quarterRange.end,
        },
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    // Get yearly sales
    const [startYear] = financialYear.split('-').map(Number);
    const yearStart = new Date(startYear, 3, 1); // April 1
    const yearEnd = new Date(startYear + 1, 2, 31); // March 31

    const yearlySales = await prisma.invoice.aggregate({
      where: {
        distributorId: session.userId,
        invoiceDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    // Get pending invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        distributorId: session.userId,
        paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
      },
      include: {
        items: {
          include: {
            itemCategory: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    });

    // Calculate achievements and rewards
    const achievements = activeSchemes.map((scheme) => {
      const level = scheme.schemeLevels[0];

      // Get achievement record or create placeholder
      const quarterlyAchievement = {
        quarter: currentQuarter,
        target: level[`${currentQuarter.toLowerCase()}Target` as keyof typeof level] as number,
        achieved: quarterlySales._sum.totalAmount || 0,
        reward: level[`${currentQuarter.toLowerCase()}Reward` as keyof typeof level] as number,
        percentage: level[`${currentQuarter.toLowerCase()}Target` as keyof typeof level]
          ? Math.round((quarterlySales._sum.totalAmount || 0) / (level[`${currentQuarter.toLowerCase()}Target` as keyof typeof level] as number) * 100)
          : 0,
      };

      const yearlyAchievement = {
        target: level.yearlyTarget,
        achieved: yearlySales._sum.totalAmount || 0,
        reward: level.yearlyReward,
        percentage: level.yearlyTarget
          ? Math.round((yearlySales._sum.totalAmount || 0) / level.yearlyTarget * 100)
          : 0,
      };

      return {
        scheme: {
          id: scheme.id,
          name: scheme.name,
          period: `${scheme.startDate.toLocaleDateString()} - ${scheme.endDate.toLocaleDateString()}`,
        },
        quarterly: quarterlyAchievement,
        yearly: yearlyAchievement,
      };
    });

    return NextResponse.json({
      distributor: {
        name: distributor.name,
        phone: distributor.phone,
        level: distributor.distributorLevel.name,
      },
      currentPeriod: {
        quarter: currentQuarter,
        financialYear,
      },
      achievements,
      pendingInvoices,
      summary: {
        quarterlySales: quarterlySales._sum.totalAmount || 0,
        quarterlyPaid: quarterlySales._sum.paidAmount || 0,
        yearlySales: yearlySales._sum.totalAmount || 0,
        yearlyPaid: yearlySales._sum.paidAmount || 0,
      },
    });
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

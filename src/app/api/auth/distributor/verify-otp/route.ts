import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyOTP } from '@/lib/otp';
import { getSession } from '@/lib/session';
import { validatePhone } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '');
    const formattedPhone = normalizedPhone.length === 10
      ? `+91${normalizedPhone}`
      : `+${normalizedPhone}`;

    // Verify OTP
    const result = await verifyOTP(formattedPhone, otp);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Get distributor details
    const distributor = await prisma.distributor.findUnique({
      where: { id: result.distributorId },
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

    // Create session
    const session = await getSession();
    session.userId = distributor.id;
    session.userType = 'distributor';
    session.phone = distributor.phone;
    session.name = distributor.name;
    session.isLoggedIn = true;

    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        id: distributor.id,
        phone: distributor.phone,
        name: distributor.name,
        userType: 'distributor',
        level: distributor.distributorLevel.name,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'OTP verification failed' },
      { status: 500 }
    );
  }
}

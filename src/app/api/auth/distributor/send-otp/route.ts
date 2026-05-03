import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createOTPSession } from '@/lib/otp';
import { validatePhone } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

    // Find distributor
    const distributor = await prisma.distributor.findUnique({
      where: { phone: formattedPhone },
    });

    if (!distributor) {
      return NextResponse.json(
        { error: 'Distributor not found with this phone number' },
        { status: 404 }
      );
    }

    if (!distributor.isActive) {
      return NextResponse.json(
        { error: 'Your account is inactive. Please contact admin.' },
        { status: 403 }
      );
    }

    // Create and send OTP
    const otp = await createOTPSession(distributor.id, formattedPhone);

    // In development, send OTP back (remove in production)
    const response: any = {
      success: true,
      message: 'OTP sent successfully',
    };

    if (process.env.NODE_ENV !== 'production') {
      response.otp = otp; // Only for development
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

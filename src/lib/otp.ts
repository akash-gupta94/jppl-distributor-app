import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to phone number
 * Currently using mock implementation - always returns '123456'
 * Replace with actual SMS provider (Twilio, Firebase, etc.) in production
 */
export async function sendOTP(phone: string): Promise<{ success: boolean; otp?: string; error?: string }> {
  try {
    // Mock OTP for development - always use '123456'
    const otp = process.env.NODE_ENV === 'production' ? generateOTP() : '123456';

    console.log(`📱 [MOCK OTP] Sending OTP to ${phone}: ${otp}`);

    // In production, integrate with SMS provider:
    /*
    if (process.env.OTP_PROVIDER === 'twilio') {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await twilio.messages.create({
        body: `Your JPPL OTP is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
    }
    */

    return { success: true, otp };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: 'Failed to send OTP' };
  }
}

/**
 * Create OTP session for a distributor
 */
export async function createOTPSession(distributorId: string, phone: string): Promise<string> {
  const { otp } = await sendOTP(phone);

  // OTP expires in 5 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  // Delete any existing unverified OTP sessions for this distributor
  await prisma.oTPSession.deleteMany({
    where: {
      distributorId,
      verified: false,
    },
  });

  // Create new OTP session
  await prisma.oTPSession.create({
    data: {
      distributorId,
      phone,
      otp: otp || '123456',
      expiresAt,
    },
  });

  return otp || '123456';
}

/**
 * Verify OTP
 */
export async function verifyOTP(
  phone: string,
  otp: string
): Promise<{ success: boolean; distributorId?: string; error?: string }> {
  try {
    // Find the OTP session
    const session = await prisma.oTPSession.findFirst({
      where: {
        phone,
        otp,
        verified: false,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        distributor: true,
      },
    });

    if (!session) {
      return { success: false, error: 'Invalid or expired OTP' };
    }

    // Check if distributor is active
    if (!session.distributor.isActive) {
      return { success: false, error: 'Distributor account is inactive' };
    }

    // Mark OTP as verified
    await prisma.oTPSession.update({
      where: { id: session.id },
      data: { verified: true },
    });

    // Clean up old OTP sessions
    await prisma.oTPSession.deleteMany({
      where: {
        distributorId: session.distributorId,
        id: { not: session.id },
      },
    });

    return {
      success: true,
      distributorId: session.distributorId,
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: 'OTP verification failed' };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('admin');
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
    }
    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }
    const admin = await prisma.admin.findUnique({ where: { id: session.userId } });
    if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    const ok = await bcrypt.compare(currentPassword, admin.password);
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({ where: { id: admin.id }, data: { password: hashed } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

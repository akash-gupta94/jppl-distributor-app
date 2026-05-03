import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId: string;
  userType: 'admin' | 'distributor';
  phone?: string;
  email?: string;
  name?: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  userId: '',
  userType: 'distributor',
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'jppl_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAuth(userType?: 'admin' | 'distributor') {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error('Unauthorized');
  }

  if (userType && session.userType !== userType) {
    throw new Error('Forbidden');
  }

  return session;
}

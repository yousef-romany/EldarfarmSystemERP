
'use server';
import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionUser } from './types';
import { prisma } from './prisma';

const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD || 'complex_password_at_least_32_characters_long',
  cookieName: 'mawashi-manager-session',
  cookieOptions: {
    // secure: process.env.NODE_ENV === 'production',
  },
};

export interface SessionData {
  isLoggedIn?: boolean;
  user?: SessionUser;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

// This function should be called from Server Components or Server Actions
// to get the full, fresh user data.
export async function getFullSession(): Promise<SessionData> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.user?.id) {
    return { isLoggedIn: false };
  }

  // Re-fetch user from DB to ensure data is fresh and permissions are up-to-date
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    // User was deleted, but session still exists. Destroy it.
    session.destroy();
    return { isLoggedIn: false };
  }

  // Return fresh, complete user data
  return {
    isLoggedIn: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role as SessionUser['role'],
      permissions: JSON.parse(user.permissions as string),
    },
  };
}

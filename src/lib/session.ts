
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
  user?: Pick<SessionUser, 'id'>; // Store only the user ID
}

// This is the primary function to get the session. It does NOT touch the database.
// It can be safely used in middleware or simple server components.
export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}

// This function should be called from protected layouts/pages
// to get the full, fresh user data from the database.
export async function getFullSession(): Promise<{ isLoggedIn: boolean; user: SessionUser | null; }> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.user?.id) {
    return { isLoggedIn: false, user: null };
  }

  // Re-fetch user from DB to ensure data is fresh and permissions are up-to-date
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    // User was deleted, but session still exists. Destroy it.
    await session.destroy();
    return { isLoggedIn: false, user: null };
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

// This is a simplified login action that stores only the ID in the session
export async function loginAction(userId: string) {
    const session = await getSession();
    session.isLoggedIn = true;
    session.user = { id: userId };
    await session.save();
}

// This is a simplified logout action
export async function logoutAction() {
    const session = await getSession();
    session.destroy();
}

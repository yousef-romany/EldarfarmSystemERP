
import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionUser } from './types';
import { prisma } from './prisma';

const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'mawashi-manager-session',
  cookieOptions: {
    // secure: process.env.NODE_ENV === 'production',
  },
};

export interface SessionData {
  isLoggedIn?: boolean;
  user?: SessionUser; 
}

// Can be called from middleware or server components.
// Does not access the database.
export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}


// Should be called from protected pages/layouts to get full user data.
// Accesses the database.
export async function getFullSession(): Promise<{ isLoggedIn: boolean; user: SessionUser | null; }> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.user?.id) {
    return { isLoggedIn: false, user: null };
  }

  // Re-fetch user from DB to ensure data is fresh and permissions are up-to-date
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // If user was deleted from DB but session cookie remains, treat as logged out.
  // The session.destroy() call was moved to a dedicated server action to avoid cookie modification errors in Server Components.
  if (!user) {
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


// Server Action to handle login
export async function loginAction(user: SessionUser) {
    const session = await getSession();
    session.isLoggedIn = true;
    session.user = user;
    await session.save();
}

// Server Action to handle logout
export async function logoutAction() {
    const session = await getSession();
    session.destroy();
}

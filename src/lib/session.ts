
'use server';
import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionUser } from './types';
import { prisma } from './prisma';


const sessionOptions: SessionOptions = {
  // TODO: Use a strong password from environment variables
  password: process.env.SECRET_COOKIE_PASSWORD || 'complex_password_at_least_32_characters_long',
  cookieName: 'mawashi-manager-session',
  cookieOptions: {
    // secure: true should be used in production (HTTPS)
    // secure: process.env.NODE_ENV === 'production',
    // httpOnly: true,
  },
};

// Define the shape of the session data
export interface SessionData {
  isLoggedIn: boolean;
  user: SessionUser;
}

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  // If the user is logged in, re-fetch their data from the database to ensure it's fresh
  // This is a robust way to ensure the session user data is never stale.
  if (session.isLoggedIn && session.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    if (user) {
      session.user = {
        id: user.id,
        username: user.username,
        role: user.role as SessionUser['role'],
        permissions: JSON.parse(user.permissions as string),
      };
    } else {
      // If user not found in DB (e.g., deleted), destroy the session
      session.destroy();
    }
  } else {
     if (!session.isLoggedIn) {
        session.isLoggedIn = false;
    }
  }

  return session;
}

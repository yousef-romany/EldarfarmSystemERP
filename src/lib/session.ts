
import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionUser } from './types';


export const sessionOptions: SessionOptions = {
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
  user?: SessionUser;
}

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  // This is a workaround for a bug in iron-session where the session is not saved
  // when the user is not logged in. This causes the session to be re-created on
  // every request, which breaks the flash message system.
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }
  return session;
}

export async function getSessionData() {
    const session = await getSession();
    return session;
}

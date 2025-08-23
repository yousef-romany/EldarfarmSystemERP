
import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { UserPermissions } from './types';


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
  user?: {
      id: string;
      username: string;
      permissions: UserPermissions;
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

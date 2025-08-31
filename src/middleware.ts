
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from './lib/session';

// Define session options directly here as they are needed for getIronSession
const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD || 'complex_password_at_least_32_characters_long',
  cookieName: 'mawashi-manager-session',
  cookieOptions: {},
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Directly get the session without database lookups
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const isLoggedIn = session.isLoggedIn ?? false;

  const isPublicPath = path === '/login';

  // Allow API routes, Next.js internal routes, and static files to pass through
  if (path.startsWith('/api') || path.startsWith('/_next') || path.startsWith('/static') || /\.(.*)$/.test(path)) {
    return NextResponse.next();
  }

  // Redirect logic
  if (isPublicPath && isLoggedIn) {
    // If logged in, redirect from login page to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isPublicPath && !isLoggedIn) {
    // If not logged in and not on a public page, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If we are here, the user is either correctly on a public page
  // or logged in and on a private page. We don't need to check permissions
  // here anymore as it will be handled by the layout.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = await getSession();

  const isPublicPath = path === '/login'; // The public path is now /login

  // If user is trying to access the root, redirect based on login status
  if (path === '/') {
    return NextResponse.redirect(new URL(session.isLoggedIn ? '/dashboard' : '/login', request.url));
  }

  // Allow API routes, Next.js internal routes, and static files to pass through
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    /\.(.*)$/.test(path)
  ) {
    return NextResponse.next();
  }

  // If user is not logged in and not on the public login page, redirect to login
  if (!session.isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and trying to access the login page, redirect to dashboard
  if (session.isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

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

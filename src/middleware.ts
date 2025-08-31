
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const cookie = request.cookies.get('mawashi-manager-session');

  const publicPaths = ['/login', '/forbidden'];
  const isPublicPath = publicPaths.includes(path);
  
  // If user is trying to access a public page, let them through
  if (isPublicPath) {
    // If they are logged in and trying to access login, redirect to dashboard
    if (cookie && path === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // If the path is protected and there is no cookie, redirect to login
  if (!cookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If we are here, the user is accessing a protected route and has a cookie.
  // The actual session validation against the DB will happen in the AppLayout component.
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

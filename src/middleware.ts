
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const cookie = request.cookies.get('mawashi-manager-session');

  // Allow API routes, Next.js internal routes, and static files to pass through
  if (path.startsWith('/api') || path.startsWith('/_next') || path.startsWith('/static') || /\.(.*)$/.test(path)) {
    return NextResponse.next();
  }

  const isPublicPath = path === '/login';

  // If user is trying to access login page but has a session cookie, let them pass
  // but they will be redirected by the page logic if the session is valid.
  if (isPublicPath && cookie) {
     return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  if (isPublicPath && !cookie) {
      return NextResponse.next();
  }

  // If the path is not public and there is no cookie, redirect to login
  if (!isPublicPath && !cookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If we are here, the user is accessing a protected route and has a cookie.
  // The actual session validation will happen in the AppLayout component.
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

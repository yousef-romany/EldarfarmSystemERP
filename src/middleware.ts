
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/session';

// Define which paths are public (don't require authentication)
const publicPaths = ['/login'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));
  
  // Check if it's an API route, internal Next.js route, or a static file
  // These should not be redirected.
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    /\.(.*)$/.test(path) // This regex matches for file extensions, e.g., .png, .ico
  ) {
    return NextResponse.next();
  }

  const session = await getSession();

  // If the user is not logged in and the path is not public, redirect to login
  if (!session.isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is logged in and tries to access a public path (like /login),
  // redirect them to the dashboard.
  if (session.isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow the request to continue
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
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
}

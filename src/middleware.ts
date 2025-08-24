
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/session';
import type { UserPermissions } from './lib/types';

// Map pathnames to their required permission key
const permissionMap: Record<string, keyof UserPermissions | null> = {
  '/dashboard': 'overview',
  '/users': 'users',
  '/barns': 'barns',
  '/livestock-types': 'livestockTypes',
  '/purchases': 'purchases',
  '/sales': 'sales',
  '/vows': 'vows',
  '/contributions': 'contributions',
  '/expenses': 'expenses',
  '/wallets': 'wallets',
  '/settings': 'settings',
  '/reports': 'reports',
  '/daily-report': 'reports',
  '/settlement': 'reports',
  // Add other specific report pages if necessary
  '/reports/available': 'reports',
  '/reports/bookings': 'reports',
  '/reports/livestock-movement': 'reports',
};


export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = await getSession();

  const isPublicPath = path === '/login';
  const isForbiddenPath = path === '/forbidden';
  
  // Allow API routes, Next.js internal routes, static files, and the forbidden page to pass through
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    isForbiddenPath ||
    /\.(.*)$/.test(path)
  ) {
    return NextResponse.next();
  }


  // If user is trying to access the root, redirect based on login status
  if (path === '/') {
    return NextResponse.redirect(new URL(session.isLoggedIn ? '/dashboard' : '/login', request.url));
  }


  // If user is not logged in and not on the public login page, redirect to login
  if (!session.isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and trying to access the login page, redirect to dashboard
  if (session.isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user is logged in, check their permissions for the requested page
  if (session.isLoggedIn) {
    const userPermissions = session.user?.permissions;
    
    // Find the permission key for the current path (including nested paths)
    // by checking which key in permissionMap is a prefix of the current path.
    const matchedKey = Object.keys(permissionMap).find(key => path.startsWith(key));
    
    if (matchedKey) {
        const requiredPermissionKey = permissionMap[matchedKey];
        if (requiredPermissionKey && !userPermissions?.[requiredPermissionKey]?.view) {
            // User does not have view permission, redirect to forbidden page
            return NextResponse.redirect(new URL('/forbidden', request.url));
        }
    }
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

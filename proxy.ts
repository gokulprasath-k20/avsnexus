import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
];

const STUDENT_PATHS = ['/student-dashboard', '/modules', '/leaderboard', '/profile'];
const ADMIN_PATHS = ['/admin-dashboard'];
const SUPERADMIN_PATHS = ['/superadmin-dashboard'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Decode token manually since jsonwebtoken doesn't run on Edge Runtime
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const user = JSON.parse(jsonPayload);

    const role = user.role.toLowerCase();
    if (pathname.startsWith('/superadmin-dashboard') && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/student-dashboard', request.url));
    }
    
    if (pathname.startsWith('/admin-dashboard') && !['admin', 'moduleadmin', 'moduleAdmin'].some(r => role === r.toLowerCase())) {
      return NextResponse.redirect(new URL('/student-dashboard', request.url));
    }

    // Attach user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.userId);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-email', user.email);
    if (user.assignedModuleType) {
      requestHeaders.set('x-user-assigned-module', user.assignedModuleType);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (err) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

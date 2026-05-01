import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';

export function getTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function requireAuth(
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>,
  allowedRoles?: string[]
) {
  return async (request: NextRequest, context?: any) => {
    try {
      const token = getTokenFromRequest(request);
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const user = verifyToken(token);

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return handler(request, user);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  };
}

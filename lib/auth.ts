import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';
import { createClient } from './supabaseServer';

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
      // 1. Check Supabase Session first (Modern)
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. Fallback to existing JWT (Compatibility)
      const token = getTokenFromRequest(request);
      let user: JWTPayload | null = null;

      if (token) {
        try {
          user = verifyToken(token);
        } catch (e) {
          user = null;
        }
      }

      // If no user found via JWT, and no session found via Supabase, unauthorized
      if (!user && !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // If we have a session but no local user object yet, 
      // we should probably let the handler proceed if it doesn't strictly need the JWTPayload
      // or we can reconstruct it.
      // For "keeping logic unchanged", we prefer the JWTPayload.
      
      if (!user) {
        // If we only have Supabase session, we might need to fetch the user from DB
        // But to keep logic simple and "unchanged", we rely on the fact that 
        // login/signup set the 'token' cookie.
        return NextResponse.json({ error: 'Session sync required' }, { status: 401 });
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return handler(request, user);
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
  };
}

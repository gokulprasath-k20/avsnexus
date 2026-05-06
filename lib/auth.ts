import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';
import { createClient } from './supabaseServer';
import connectDB from './db';
import User from '@/models/User';

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
      // 1. Check existing JWT (Fastest)
      const token = getTokenFromRequest(request);
      let user: JWTPayload | null = null;

      if (token) {
        try {
          user = verifyToken(token);
        } catch (e) {
          user = null;
        }
      }

      // 2. Fallback: Check Supabase Session if JWT is missing/invalid
      if (!user) {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Reconstruct user payload from DB using Supabase ID
          await connectDB();
          const dbUser = await User.findOne({ 
            $or: [
              { supabaseId: session.user.id },
              { email: session.user.email }
            ]
          }).lean();

          if (dbUser) {
            user = {
              userId: dbUser._id.toString(),
              registerNumber: dbUser.registerNumber,
              email: dbUser.email,
              role: dbUser.role,
              name: dbUser.name,
              assignedModuleType: dbUser.assignedModuleType,
            };
          }
        }
      }

      // Final check
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

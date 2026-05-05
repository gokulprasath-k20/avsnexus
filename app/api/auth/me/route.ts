import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    // Fast path: JWT is valid — skip Supabase session check entirely
    if (token) {
      try {
        const payload = verifyToken(token);
        await connectDB();
        const user = await User.findById(payload.userId).select('-password').lean();
        if (user) {
          return NextResponse.json({ user }, {
            headers: { 'Cache-Control': 'private, no-store' }
          });
        }
      } catch {
        // JWT invalid — fall through to return 401
      }
    }

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


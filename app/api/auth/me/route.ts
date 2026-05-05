import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { createClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const token = request.cookies.get('token')?.value;
    let userId: string | null = null;

    if (token) {
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
      } catch (e) {
        // Token invalid, continue to check Supabase
      }
    }

    if (!userId) {
      // Check Supabase session
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = await User.findOne({ supabaseId: session.user.id });
        if (user) userId = user._id.toString();
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

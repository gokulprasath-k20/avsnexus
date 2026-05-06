import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

// PATCH /api/users/fcm-token — register FCM token for current user
export const PATCH = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await User.findByIdAndUpdate(user.userId, {
      $addToSet: { fcmTokens: token },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('FCM token save error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// Keep legacy POST for backward-compat (same logic)
export const POST = PATCH;

// DELETE /api/users/fcm-token — remove token on logout
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const { token } = await request.json();
    if (token) {
      await User.findByIdAndUpdate(user.userId, { $pull: { fcmTokens: token } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

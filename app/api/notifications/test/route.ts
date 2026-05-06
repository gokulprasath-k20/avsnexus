import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/auth';
import { messaging } from '@/lib/firebaseAdmin';
import User from '@/models/User';

// POST /api/notifications/test — send a test push to the calling user
export const POST = requireAuth(async (_request: NextRequest, user) => {
  try {
    await connectDB();

    // 1. Save in-app notification
    await Notification.create({
      userId: user.userId,
      type: 'system',
      title: '🔔 Test Notification',
      message: 'Push notifications are working correctly on your device.',
      link: '/notifications',
    });

    // 2. Send FCM push if available
    let pushed = false;
    if (messaging) {
      const dbUser = await User.findById(user.userId).select('fcmTokens').lean() as any;
      const tokens: string[] = dbUser?.fcmTokens || [];

      if (tokens.length > 0) {
        const result = await messaging.sendEachForMulticast({
          notification: {
            title: '🔔 Test Notification',
            body: 'Push notifications are working correctly!',
          },
          data: { url: '/notifications' },
          tokens: tokens.slice(0, 10),
        });
        pushed = result.successCount > 0;
      }
    }

    return NextResponse.json({
      success: true,
      pushed,
      message: pushed
        ? 'Test notification sent! Check your device.'
        : 'In-app notification saved. No FCM token found — open the app in browser and allow notifications.',
    });
  } catch (err) {
    console.error('Test notification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/auth';

// GET /api/notifications
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const notifications = await Notification.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      userId: user.userId,
      isRead: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// PATCH /api/notifications - mark all as read
export const PATCH = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const { notificationId } = await request.json().catch(() => ({}));

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    } else {
      await Notification.updateMany({ userId: user.userId }, { isRead: true });
    }

    return NextResponse.json({ message: 'Notifications marked as read' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

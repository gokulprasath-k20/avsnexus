import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { messaging } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/auth';

export const POST = requireAuth(
  async (req: NextRequest, authUser) => {
    try {
      await connectDB();

      const { title, message, target, filters, url } = await req.json();

      if (!title || !message || !target) {
        return NextResponse.json({ error: 'Missing required fields: title, message, target' }, { status: 400 });
      }

      // Build student query
      const query: Record<string, unknown> = { role: 'student', isActive: true };
      if (target === 'filters' && filters) {
        if (filters.department) query.department = filters.department;
        if (filters.year) query.year = Number(filters.year);
        if (filters.section) query.section = filters.section;
        if (filters.category) query.category = filters.category;
      }

      const students = await User.find(query).select('_id fcmTokens');

      // Save notification to DB for each student (in-app bell)
      const notifDocs = students.map((s) => ({
        userId: s._id,
        title,
        message,
        type: 'announcement',
        link: url || '/student-dashboard',
      }));
      if (notifDocs.length > 0) {
        await Notification.insertMany(notifDocs, { ordered: false }).catch(() => {});
      }

      // Send push notifications if Firebase is configured
      if (!messaging) {
        return NextResponse.json({
          success: true,
          message: 'In-app notifications saved. Push notifications disabled (Firebase not configured).',
          recipientCount: students.length,
          successCount: 0,
          failureCount: 0,
        });
      }

      const allTokens: string[] = [];
      students.forEach((s) => {
        if ((s.fcmTokens?.length ?? 0) > 0) allTokens.push(...s.fcmTokens!);
      });

      if (allTokens.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'In-app notifications saved. No push tokens found.',
          recipientCount: students.length,
          successCount: 0,
          failureCount: 0,
        });
      }

      const uniqueTokens = [...new Set(allTokens)];

      // Batch in groups of 500 (FCM limit)
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < uniqueTokens.length; i += 500) {
        const batch = uniqueTokens.slice(i, i + 500);
        const result = await messaging.sendEachForMulticast({
          notification: { title, body: message },
          data: { url: url || '/student-dashboard', sender: authUser.name || '' },
          tokens: batch,
        });
        successCount += result.successCount;
        failureCount += result.failureCount;
      }

      return NextResponse.json({
        success: true,
        recipientCount: uniqueTokens.length,
        successCount,
        failureCount,
      });
    } catch (error) {
      console.error('Send notification error:', error);
      return NextResponse.json({ error: 'Internal Server Error', detail: String(error) }, { status: 500 });
    }
  },
  ['superadmin', 'moduleAdmin', 'admin']
);

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

      const { title, message, image, target, filters, url } = await req.json();

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

      const students = await User.find(query).select('_id fcmTokens name');
      
      console.log(`[Notification] Found ${students.length} potential recipients for target: ${target}`);

      if (students.length === 0) {
        return NextResponse.json({ 
          error: 'No matching students found for the selected filters.',
          recipientCount: 0 
        }, { status: 404 });
      }

      // Save notification to DB for each student (in-app bell)
      const notifDocs = students.map((s) => ({
        userId: s._id,
        title,
        message,
        ...(image ? { image } : {}),
        type: 'announcement',
        link: url || '/student-dashboard',
      }));
      
      if (notifDocs.length > 0) {
        await Notification.insertMany(notifDocs, { ordered: false }).catch((e) => {
          console.error('[Notification] DB Save Error:', e.message);
        });
      }

      // Send push notifications if Firebase is configured
      if (!messaging) {
        return NextResponse.json({
          success: true,
          message: 'In-app notifications saved. Push notifications disabled (Firebase Admin not initialized).',
          recipientCount: students.length,
          successCount: 0,
          failureCount: 0,
        });
      }

      const allTokens: string[] = [];
      let studentsWithTokens = 0;

      students.forEach((s) => {
        if ((s.fcmTokens?.length ?? 0) > 0) {
          allTokens.push(...s.fcmTokens!);
          studentsWithTokens++;
        }
      });

      console.log(`[Notification] Total tokens found: ${allTokens.length} across ${studentsWithTokens} students.`);

      if (allTokens.length === 0) {
        return NextResponse.json({
          success: true,
          message: `In-app notifications saved for ${students.length} students, but NO push tokens were found. Ensure students have allowed notifications in their browser/app.`,
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
        try {
          const result = await messaging.sendEachForMulticast({
            notification: { title, body: message },
            data: { 
              url: url || '/student-dashboard', 
              sender: authUser.name || 'Admin' 
            },
            tokens: batch,
          });
          successCount += result.successCount;
          failureCount += result.failureCount;
        } catch (fcmError: any) {
          console.error(`[Notification] FCM Batch Error:`, fcmError.message);
          failureCount += batch.length;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Notification sent. Success: ${successCount}, Failed: ${failureCount}`,
        recipientCount: students.length,
        tokenCount: uniqueTokens.length,
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

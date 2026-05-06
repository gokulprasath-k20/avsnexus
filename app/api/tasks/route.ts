import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Module from '@/models/Module';
import User from '@/models/User';
import StudentTask from '@/models/StudentTask';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/auth';
import { messaging } from '@/lib/firebaseAdmin';
import { processDeadlines } from '@/lib/deadlineProcessor';

// GET /api/tasks?moduleId=...&stage=...
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    // Run deadline processor lazily for students
    if (user.role === 'student') {
      processDeadlines(user.userId).catch(() => {});
    }

    const { searchParams } = request.nextUrl;
    const moduleId = searchParams.get('moduleId');
    const stage = searchParams.get('stage');

    const query: Record<string, unknown> = { isActive: true };
    if (moduleId) query.moduleId = moduleId;
    if (stage) query.stage = stage;

    const createdBy = searchParams.get('createdBy');
    if (createdBy) query.createdBy = createdBy;

    const tasks = await Task.find(query)
      .select('-testCases')
      .populate('moduleId', 'name')
      .sort({ stage: 1, order: 1 })
      .lean();

    return NextResponse.json({ tasks }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' }
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// POST /api/tasks - create task (moduleAdmin, superAdmin)
export const POST = requireAuth(
  async (request: NextRequest, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const { moduleId, duration = 0 } = body;

      // Verify admin is assigned to this module
      if (user.role === 'moduleAdmin') {
        const module = await Module.findOne({
          _id: moduleId,
          assignedAdmins: user.userId,
        });
        if (!module) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const task = await Task.create({ ...body, createdBy: user.userId });
      const module = await Module.findById(moduleId).select('name');

      // ─── Create StudentTask for ALL active students ──────────────────────
      const students = await User.find({ role: 'student', isActive: true }).select('_id').lean();

      if (students.length > 0) {
        const deadlineTime = duration > 0
          ? new Date(Date.now() + duration * 60 * 1000)
          : undefined;

        const studentTaskDocs = students.map((s: any) => ({
          studentId: s._id,
          taskId: task._id,
          moduleId: task.moduleId,
          status: 'available',
          deadlineTime,
          notifiedReminder: false,
          pointsDeducted: false,
        }));

        await StudentTask.insertMany(studentTaskDocs, { ordered: false }).catch(() => {});

        // ─── In-app notifications for all students ───────────────────────
        const deadlineMsg = duration > 0
          ? ` Complete within ${duration >= 60 ? `${Math.floor(duration / 60)}h` : `${duration}m`}.`
          : '';
        const notifDocs = students.map((s: any) => ({
          userId: s._id,
          type: 'new_task',
          title: '🚀 New Task Assigned',
          message: `"${task.title}" in ${module?.name || 'your module'}.${deadlineMsg}`,
          link: `/tasks/${task._id}`,
        }));
        await Notification.insertMany(notifDocs, { ordered: false }).catch(() => {});
      }

      // ─── FCM Push to all students ────────────────────────────────────────
      if (messaging) {
        try {
          const studentsWithTokens = await User.find({
            role: 'student',
            isActive: true,
            fcmTokens: { $exists: true, $not: { $size: 0 } },
          }).select('fcmTokens').lean();

          const allTokens = (studentsWithTokens as any[]).flatMap((s: any) => s.fcmTokens || []);
          const uniqueTokens = [...new Set<string>(allTokens)];

          if (uniqueTokens.length > 0) {
            const deadlineLabel = duration > 0
              ? ` — ${duration >= 60 ? `${Math.floor(duration / 60)}h` : `${duration}m`} to complete`
              : '';
            await messaging.sendEachForMulticast({
              notification: {
                title: '🚀 New Task Assigned',
                body: `"${task.title}" in ${module?.name || 'your module'}${deadlineLabel}`,
              },
              data: {
                url: `/tasks/${task._id}`,
                taskId: task._id.toString(),
              },
              tokens: uniqueTokens.slice(0, 500),
            });
          }
        } catch (pushErr) {
          console.error('Push notification failed:', pushErr);
        }
      }

      return NextResponse.json({ task }, { status: 201 });
    } catch (err) {
      console.error('Task create error:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['superadmin', 'moduleAdmin']
);

/**
 * Deadline Processor
 * Called on API requests to process expired deadlines and send reminders.
 * No background job needed — runs lazily on each request.
 */

import StudentTask from '@/models/StudentTask';
import User from '@/models/User';
import Notification from '@/models/Notification';
import Task from '@/models/Task';
import { messaging } from '@/lib/firebaseAdmin';

const PENALTY_POINTS = 5;

async function sendFCMToUser(userId: string, title: string, body: string, link: string) {
  try {
    const user = await User.findById(userId).select('fcmTokens').lean();
    const tokens = (user as any)?.fcmTokens;
    if (!tokens?.length || !messaging) return;
    await messaging.sendEachForMulticast({
      notification: { title, body },
      data: { url: link },
      tokens: [...new Set<string>(tokens)],
    });
  } catch { /* non-critical */ }
}

/**
 * Process deadlines for a specific student or all students.
 * Call this on GET /api/student-tasks and GET /api/tasks.
 */
export async function processDeadlines(studentId?: string) {
  const now = new Date();

  // ─── Auto-fail expired tasks ─────────────────────────────────────────────
  const expiredQuery: Record<string, unknown> = {
    status: 'available',
    deadlineTime: { $lte: now, $ne: null },
  };
  if (studentId) expiredQuery.studentId = studentId;

  const expiredTasks = await StudentTask.find(expiredQuery)
    .select('studentId taskId pointsDeducted')
    .lean();

  if (expiredTasks.length > 0) {
    const expiredIds = expiredTasks.map((t: any) => t._id);

    // Mark as failed
    await StudentTask.updateMany(
      { _id: { $in: expiredIds } },
      { $set: { status: 'failed' } }
    );

    // Deduct points for each student (only once per task)
    const toDeduct = expiredTasks.filter((t: any) => !t.pointsDeducted);
    for (const st of toDeduct) {
      await User.findByIdAndUpdate(st.studentId, {
        $inc: { totalPoints: -PENALTY_POINTS },
      });
      await StudentTask.findByIdAndUpdate((st as any)._id, { pointsDeducted: true });

      // Save in-app notification
      const task = await Task.findById(st.taskId).select('title').lean();
      await Notification.create({
        userId: st.studentId,
        type: 'task_failed',
        title: '⏰ Task Deadline Missed',
        message: `"${(task as any)?.title || 'Task'}" deadline passed. -${PENALTY_POINTS} points deducted.`,
        link: '/student-dashboard',
      });

      // Push notification
      sendFCMToUser(
        st.studentId.toString(),
        '⏰ Task Failed',
        `Deadline passed for "${(task as any)?.title || 'a task'}". -${PENALTY_POINTS} pts deducted.`,
        '/student-dashboard'
      );
    }
  }

  // ─── Send 30-min reminders ───────────────────────────────────────────────
  const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  const reminderQuery: Record<string, unknown> = {
    status: 'available',
    notifiedReminder: false,
    deadlineTime: { $gt: now, $lte: thirtyMinsFromNow },
  };
  if (studentId) reminderQuery.studentId = studentId;

  const reminderTasks = await StudentTask.find(reminderQuery)
    .select('studentId taskId deadlineTime')
    .lean();

  if (reminderTasks.length > 0) {
    const reminderIds = reminderTasks.map((t: any) => t._id);
    await StudentTask.updateMany(
      { _id: { $in: reminderIds } },
      { $set: { notifiedReminder: true } }
    );

    for (const st of reminderTasks) {
      const task = await Task.findById(st.taskId).select('title').lean();
      const minsLeft = Math.round(
        ((st as any).deadlineTime.getTime() - now.getTime()) / 60000
      );

      await Notification.create({
        userId: st.studentId,
        type: 'deadline_reminder',
        title: '⚠️ Deadline Approaching',
        message: `"${(task as any)?.title || 'Task'}" is due in ${minsLeft} minutes!`,
        link: `/tasks/${st.taskId}`,
      });

      sendFCMToUser(
        st.studentId.toString(),
        '⚠️ Deadline in 30 minutes!',
        `"${(task as any)?.title || 'Task'}" is due soon. Submit now!`,
        `/tasks/${st.taskId}`
      );
    }
  }
}

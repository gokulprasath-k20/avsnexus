import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import StudentTask from '@/models/StudentTask';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/auth';
import { processDeadlines } from '@/lib/deadlineProcessor';

// GET /api/student-tasks?tab=available|completed|failed
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    // Run deadline processor for this student
    await processDeadlines(user.userId).catch(() => {});

    const { searchParams } = request.nextUrl;
    const tab = searchParams.get('tab') || 'available';

    const validTabs = ['available', 'completed', 'failed'];
    const status = validTabs.includes(tab) ? tab : 'available';

    const studentObjId = new mongoose.Types.ObjectId(user.userId);

    // Get tasks for this tab
    const studentTasks = await StudentTask.find({
      studentId: studentObjId,
      status,
    })
      .populate({
        path: 'taskId',
        select: 'title description type stage points allowedLanguages duration moduleId topic',
        populate: { path: 'moduleId', select: 'name' },
      })
      .sort({ deadlineTime: 1, createdAt: -1 })
      .lean();

    // Get counts across all tabs in one query
    const countResult = await StudentTask.aggregate([
      { $match: { studentId: studentObjId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const tabCounts = { available: 0, completed: 0, failed: 0 };
    for (const c of countResult) {
      if (c._id in tabCounts) (tabCounts as Record<string, number>)[c._id] = c.count;
    }

    return NextResponse.json(
      { studentTasks, tabCounts },
      { headers: { 'Cache-Control': 'private, no-cache' } }
    );
  } catch (err) {
    console.error('student-tasks GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

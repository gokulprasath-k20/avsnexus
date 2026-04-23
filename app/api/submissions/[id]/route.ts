import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission';
import Score from '@/models/Score';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/auth';

// PATCH /api/submissions/[id] - admin reviews file upload submission
export const PATCH = requireAuth(
  async (request: NextRequest, user) => {
    const id = request.nextUrl.pathname.split('/').pop();
    try {
      await connectDB();
      const { score, feedback } = await request.json();

      const submission = await Submission.findById(id).populate('taskId');
      if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      const oldScore = submission.score;
      const pointsDiff = (score || 0) - oldScore;

      const updated = await Submission.findByIdAndUpdate(
        id,
        {
          score: score || 0,
          feedback,
          status: 'reviewed',
          reviewedBy: user.userId,
          reviewedAt: new Date(),
        },
        { new: true }
      );

      // Update score aggregation
      if (pointsDiff !== 0) {
        const task = submission.taskId as unknown as { moduleId: string; stage: string };
        const stageField =
          task.stage === 'easy'
            ? 'easyPoints'
            : task.stage === 'intermediate'
            ? 'intermediatePoints'
            : 'expertPoints';

        await Score.findOneAndUpdate(
          { studentId: submission.studentId, moduleId: task.moduleId },
          { $inc: { totalPoints: pointsDiff, [stageField]: pointsDiff } },
          { upsert: true }
        );

        await User.findByIdAndUpdate(submission.studentId, {
          $inc: { totalPoints: pointsDiff },
        });
      }

      // Notify student
      await Notification.create({
        userId: submission.studentId,
        type: 'submission_reviewed',
        title: 'Submission Reviewed',
        message: `Your submission has been reviewed. Score: ${score}/100`,
        link: `/submissions/${id}`,
      });

      return NextResponse.json({ submission: updated });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['superAdmin', 'moduleAdmin']
);

// GET /api/submissions/[id]
export const GET = requireAuth(async (request: NextRequest, user) => {
  const id = request.nextUrl.pathname.split('/').pop();
  try {
    await connectDB();
    const submission = await Submission.findById(id)
      .populate('studentId', 'name email')
      .populate('taskId', 'title type stage points submissionGuidelines');
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    // Students can only view their own
    if (
      user.role === 'student' &&
      submission.studentId.toString() !== user.userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ submission });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

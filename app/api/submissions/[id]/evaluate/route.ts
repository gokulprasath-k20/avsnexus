import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission';
import Score from '@/models/Score';
import User from '@/models/User';
import Task from '@/models/Task';
import { requireAuth } from '@/lib/auth';

// PATCH /api/submissions/[id]/evaluate
export const PATCH = requireAuth(async (request: NextRequest, user) => {
  const id = request.nextUrl.pathname.split('/').slice(-2, -1)[0];
  
  try {
    await connectDB();
    const body = await request.json();
    const { marks, remarks, status } = body;

    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Update submission with evaluation data
    submission.marks = marks;
    submission.remarks = remarks;
    submission.status = status;
    submission.reviewedBy = user.userId;
    submission.reviewedAt = new Date();
    
    // For backward compatibility
    submission.score = marks;
    submission.feedback = remarks;

    await submission.save();

    // Update global score if it was a pass
    if (status === 'pass' || status === 'accepted') {
      const task = await Task.findById(submission.taskId);
      if (task) {
        await updateScore(submission.studentId.toString(), task.moduleId.toString(), task.stage, marks);
      }
    }

    return NextResponse.json({ message: 'Evaluation saved', submission });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}, ['superadmin', 'moduleAdmin']);

async function updateScore(
  studentId: string,
  moduleId: string,
  stage: string,
  points: number
) {
  const stageField =
    stage === 'easy'
      ? 'easyPoints'
      : stage === 'intermediate'
      ? 'intermediatePoints'
      : 'expertPoints';

  await Score.findOneAndUpdate(
    { studentId, moduleId },
    {
      $set: { [stageField]: points }, // Set the marks for this stage
      $inc: { totalPoints: points, completedTasks: 1 },
    },
    { upsert: true, new: true }
  );

  await User.findByIdAndUpdate(studentId, {
    $inc: { totalPoints: points },
  });
}

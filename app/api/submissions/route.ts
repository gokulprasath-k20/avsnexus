import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission';
import Score from '@/models/Score';
import User from '@/models/User';
import Task from '@/models/Task';
import { requireAuth } from '@/lib/auth';
import { executeCode } from '@/lib/executor';

// POST /api/submissions - create submission (code or MCQ)
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const body = await request.json();
    const { taskId, code, language, selectedAnswers } = body;

    const task = await Task.findById(taskId);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    let submissionData: Record<string, unknown> = {
      studentId: user.userId,
      taskId,
      moduleId: task.moduleId,
      status: 'pending',
      score: 0,
      submittedAt: new Date(),
    };

    // Code submission
    if (task.type === 'coding' && code) {
      submissionData.code = code;
      submissionData.language = language;
      submissionData.status = 'running';

      const submission = await Submission.create(submissionData);

      // Run test cases with Execution Engine
      const testResults = [];
      let passedCases = 0;
      const testCasesToRun = task.testCases || [];

      if (testCasesToRun.length === 0) {
        return NextResponse.json({ error: 'This task has no test cases configured. An admin must add test cases before it can be evaluated.' }, { status: 400 });
      }

      const normalizeStr = (str: string) => (str || '').replace(/\r/g, '').trim();

      for (let i = 0; i < testCasesToRun.length; i++) {
        const tc = testCasesToRun[i];
        try {
          const result = await executeCode(code, language, tc.input);

          const output = normalizeStr(result.output);
          const expected = normalizeStr(tc.expectedOutput);
          const passed = output === expected;

          if (passed) passedCases++;

          testResults.push({
            testCase: i + 1,
            status: passed ? 'Accepted' : 'Wrong Answer',
            time: result.cpuTime || '0',
            memory: result.memory || 0,
            output,
            isHidden: tc.isHidden,
          });
        } catch {
          testResults.push({
            testCase: i + 1,
            status: 'Error',
            output: 'Execution failed',
            isHidden: tc.isHidden,
          });
        }
      }

      const allPassed = passedCases === testCasesToRun.length && testCasesToRun.length > 0;
      const finalStatus = allPassed ? 'accepted' : 'wrong_answer';
      
      let finalScore = 0;
      if (allPassed) {
        finalScore = task.points;
      } else if (testCasesToRun.length > 0) {
        const percentage = passedCases / testCasesToRun.length;
        const minMarksForAttempt = Math.max(1, Math.floor(task.points * 0.3));
        let calculatedMarks = Math.floor(task.points * percentage);
        if (calculatedMarks === 0 && passedCases === 0) {
           calculatedMarks = minMarksForAttempt; // Minimum marks for attempt if it ran
        }
        finalScore = Math.max(minMarksForAttempt, calculatedMarks);
        if (finalScore >= task.points) finalScore = task.points - 1; // Cannot be full marks if not all passed
      }

      await Submission.findByIdAndUpdate(submission._id, {
        status: finalStatus,
        score: finalScore,
        testResults,
      });

      if (finalScore > 0) {
        // We probably should only update if the score is higher than previous max, but keeping it simple for now based on user instruction
        await updateScore(user.userId, task.moduleId.toString(), task.stage, finalScore);
      }

      return NextResponse.json({
        submission: { ...submission.toObject(), status: finalStatus, score: finalScore, testResults },
      }, { status: 201 });
    }

    // MCQ submission
    if (task.type === 'mcq' && selectedAnswers) {
      submissionData.selectedAnswers = selectedAnswers;
      const correctAnswers = task.options
        ?.map((opt, idx) => (opt.isCorrect ? idx : -1))
        .filter((idx) => idx !== -1) || [];

      const correct = selectedAnswers.every((a: number) => correctAnswers.includes(a)) &&
        selectedAnswers.length === correctAnswers.length;

      submissionData.status = 'accepted';
      submissionData.score = correct ? task.points : 0;
      submissionData.mcqScore = correct ? task.points : 0;

      const submission = await Submission.create(submissionData);

      if (correct) {
        await updateScore(user.userId, task.moduleId.toString(), task.stage, task.points);
      }

      return NextResponse.json({ submission }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
  } catch (error: any) {
    console.error('Submission error:', error.response?.data || error.message || error);
    const errorMessage = error.response?.data?.message || 'Internal server error during evaluation';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});

// GET /api/submissions?taskId=...&studentId=... 
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const query: Record<string, unknown> = {};

    if (user.role === 'student') {
      query.studentId = user.userId;
    }

    const taskId = searchParams.get('taskId');
    const moduleId = searchParams.get('moduleId');
    const status = searchParams.get('status');

    if (taskId) query.taskId = taskId;
    if (moduleId) query.moduleId = moduleId;
    if (status) query.status = status;

    const submissions = await Submission.find(query)
      .populate('studentId', 'name email department year')
      .populate('taskId', 'title type stage points')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ submissions });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

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
      $inc: { totalPoints: points, [stageField]: points, completedTasks: 1 },
    },
    { upsert: true, new: true }
  );

  await User.findByIdAndUpdate(studentId, {
    $inc: { totalPoints: points },
  });
}

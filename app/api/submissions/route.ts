import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission';
import Score from '@/models/Score';
import User from '@/models/User';
import Task from '@/models/Task';
import { requireAuth } from '@/lib/auth';
import { executeCode } from '@/lib/executor';
import { messaging } from '@/lib/firebaseAdmin';

// Simple Dice's Coefficient for string similarity
function calculateSimilarity(str1: string, str2: string) {
  const s1 = (str1 || '').replace(/\s/g, '');
  const s2 = (str2 || '').replace(/\s/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = new Map();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.substring(i, i + 2);
    bigrams1.set(bigram, (bigrams1.get(bigram) || 0) + 1);
  }

  let intersectionSize = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    const count = bigrams1.get(bigram) || 0;
    if (count > 0) {
      bigrams1.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (s1.length + s2.length - 2);
}

// POST /api/submissions - create submission (code or MCQ)
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const body = await request.json();
    const { 
      taskId, 
      code, 
      language, 
      selectedAnswers, 
      status: clientStatus, 
      violationCount, 
      feedback,
      startedAt,
      isAutoSubmitted,
      output: clientOutput,
      error: clientError
    } = body;

    const task = await Task.findById(taskId);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // --- Task Locking Security ---
    const existingCompletion = await Submission.findOne({
      studentId: user.userId,
      taskId,
      status: { $in: ['pass', 'accepted', 'needs_review'] } 
    });

    if (existingCompletion) {
      return NextResponse.json({ 
        error: 'Task already completed. Submissions are locked for this task.' 
      }, { status: 403 });
    }
    // ----------------------------

    // Handle explicit failure (from anti-cheating)
    if (clientStatus === 'fail') {
      const submission = await Submission.create({
        studentId: user.userId,
        taskId,
        moduleId: task.moduleId,
        status: 'fail',
        score: 0,
        marks: 0,
        violationCount: violationCount || 0,
        feedback: feedback || 'Automatic fail due to policy violation',
        remarks: feedback || 'Automatic fail due to policy violation',
        submittedAt: new Date(),
        startedAt,
      });
      return NextResponse.json({ submission }, { status: 201 });
    }

    let submissionData: any = {
      studentId: user.userId,
      taskId,
      moduleId: task.moduleId,
      status: 'pending',
      score: 0,
      marks: 0,
      violationCount: violationCount || 0,
      submittedAt: new Date(),
      startedAt,
      isAutoSubmitted: !!isAutoSubmitted,
    };

    // Code submission
    if (task.type === 'coding') {
      const codeTrimmed = (code || '').trim();
      
      // Auto-fail if code is missing
      if (!codeTrimmed) {
        submissionData.status = 'fail';
        submissionData.marks = 0;
        submissionData.score = 0;
        submissionData.reason = 'No code submitted';
        submissionData.remarks = 'Automatic fail: No code submitted';
        
        const submission = await Submission.create(submissionData);
        return NextResponse.json({ 
          submission: { ...submission.toObject(), status: 'fail' },
          error: 'Code is required for submission'
        }, { status: 201 }); // Still 201 because it's a valid submission, but it's a fail
      }

      submissionData.code = code;
      submissionData.language = language;
      submissionData.status = 'running';
      submissionData.input = body.input || '';
      submissionData.output = body.output || '';
      submissionData.error = body.error || '';
      submissionData.compileError = body.compileError || '';
      submissionData.executionTime = body.executionTime || '0';
      submissionData.memory = body.memory || 0;

      // --- Plagiarism Detection ---
      // ... existing code ...
      let maxPlagiarismScore = 0;
      const otherSubmissions = await Submission.find({ 
        taskId, 
        studentId: { $ne: user.userId },
        code: { $exists: true }
      }).limit(50); 

      for (const other of otherSubmissions) {
        const sim = calculateSimilarity(code, other.code || '');
        if (sim > maxPlagiarismScore) maxPlagiarismScore = sim;
      }

      submissionData.plagiarismScore = Math.round(maxPlagiarismScore * 100);
      if (maxPlagiarismScore > 0.7) {
        submissionData.flagged = true;
      }
      // ----------------------------

      const submission = await Submission.create(submissionData);

      // Run test cases with Execution Engine
      const testResults = [];
      let passedCases = 0;
      const testCasesToRun = task.testCases || [];

      const normalizeStr = (str: string) => (str || '').replace(/\r/g, '').trim();

      for (let i = 0; i < testCasesToRun.length; i++) {
        const tc = testCasesToRun[i];
        try {
          const result = await executeCode(code, language, tc.input);

          const output = normalizeStr(result.stdout || '');
          const error = normalizeStr(result.stderr || '');
          const compileErr = normalizeStr(result.compileError || '');
          const expected = normalizeStr(tc.expectedOutput);
          const passed = output === expected && !compileErr;

          if (passed) passedCases++;

          testResults.push({
            testCase: i + 1,
            status: compileErr ? 'Compilation Error' : (passed ? 'Accepted' : 'Wrong Answer'),
            time: result.time || '0',
            memory: result.memory || 0,
            output: output || error || compileErr,
            expected: tc.isHidden ? undefined : expected,
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
      let finalStatus = allPassed ? 'accepted' : 'wrong_answer';
      
      let finalScore = 0;
      if (allPassed) {
        finalScore = task.points;
      } else if (testCasesToRun.length > 0) {
        const percentage = passedCases / testCasesToRun.length;
        finalScore = Math.floor(task.points * percentage);
      }

      // If plagiarism is suspected, mark as fail
      if (submissionData.flagged) {
        finalStatus = 'fail';
        finalScore = 0;
        submissionData.remarks = `Plagiarism suspected (${submissionData.plagiarismScore}% match).`;
      }

      await Submission.findByIdAndUpdate(submission._id, {
        status: finalStatus === 'accepted' ? 'needs_review' : (allPassed ? 'pass' : finalStatus), 
        score: finalScore,
        marks: finalScore,
        testResults,
        remarks: submissionData.remarks
      });

      // Send Push Notification for Evaluation
      if (messaging) {
        try {
          const student = await User.findById(user.userId).select('fcmTokens');
          if (student && student.fcmTokens && student.fcmTokens.length > 0) {
            const statusLabel = allPassed ? 'Passed 🎉' : (finalStatus === 'wrong_answer' ? 'Failed ❌' : 'Result Updated');
            await messaging.send({
              notification: {
                title: 'Evaluation Completed',
                body: `Your submission for "${task.title}" has been evaluated. Status: ${statusLabel}`,
              },
              data: {
                url: `/tasks/${task._id}`,
                submissionId: submission._id.toString()
              },
              token: student.fcmTokens[student.fcmTokens.length - 1] // Send to latest token
            });
          }
        } catch (pushErr) {
          console.error('Failed to send evaluation notification:', pushErr);
        }
      }

      return NextResponse.json({
        submission: { ...submission.toObject(), status: finalStatus, score: finalScore, marks: finalScore, testResults },
      }, { status: 201 });
    }

    // MCQ submission
    if (task.type === 'mcq' && selectedAnswers) {
      const mcqAnswers = task.options?.map((opt: any, idx: number) => {
        const isSelected = selectedAnswers.includes(idx);
        const isCorrect = opt.isCorrect;
        return {
          question: task.description.split('\n')[0], // Use first line as question title if not explicit
          selectedAnswer: isSelected ? opt.text : '',
          correctAnswer: isCorrect ? opt.text : '',
          isCorrect: isSelected && isCorrect
        };
      }).filter((a: any) => a.selectedAnswer !== '') || [];

      submissionData.mcqAnswers = mcqAnswers;
      submissionData.totalQuestions = task.options?.length || 0;
      submissionData.attendedQuestions = selectedAnswers.length;

      const correctCount = mcqAnswers.filter((a: any) => a.isCorrect).length;
      const totalCorrectNeeded = task.options?.filter((o: any) => o.isCorrect).length || 1;
      
      // Partial marks for MCQ
      const percentage = correctCount / totalCorrectNeeded;
      const finalScore = Math.floor(task.points * percentage);

      submissionData.status = percentage >= 0.5 ? 'pass' : 'fail'; // 50% threshold for pass
      submissionData.marks = finalScore;
      submissionData.score = finalScore;

      const submission = await Submission.create(submissionData);

      if (finalScore > 0) {
        await updateScore(user.userId, task.moduleId.toString(), task.stage, finalScore);
      }

      // Send Push Notification for MCQ Evaluation
      if (messaging) {
        try {
          const student = await User.findById(user.userId).select('fcmTokens');
          if (student && student.fcmTokens && student.fcmTokens.length > 0) {
            const passed = submissionData.status === 'pass';
            await messaging.send({
              notification: {
                title: 'Quiz Result 📝',
                body: `You scored ${finalScore} points in "${task.title}". ${passed ? 'Great job!' : 'Keep practicing!'}`,
              },
              data: {
                url: `/tasks/${task._id}`,
                submissionId: submission._id.toString()
              },
              token: student.fcmTokens[student.fcmTokens.length - 1]
            });
          }
        } catch (pushErr) {
          console.error('Failed to send MCQ notification:', pushErr);
        }
      }

      return NextResponse.json({ submission }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

  // Streak Logic
  const user = await User.findById(studentId);
  if (user) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let newStreak = user.currentStreak || 0;
    
    if (user.lastCompletedDate) {
      const lastDate = new Date(user.lastCompletedDate);
      const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      
      const diffTime = today.getTime() - lastDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        newStreak += 1;
      } else if (diffDays > 1) {
        // Missed days
        newStreak = 1;
      } else if (diffDays === 0) {
        // Same day, streak stays same
      }
    } else {
      // First task ever
      newStreak = 1;
    }

    await User.findByIdAndUpdate(studentId, {
      $inc: { totalPoints: points },
      $set: { currentStreak: newStreak, lastCompletedDate: now }
    });
  }
}

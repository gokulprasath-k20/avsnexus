import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import { requireAuth } from '@/lib/auth';
import { executeCode } from '@/lib/executor';

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const body = await request.json();
    const { taskId, code, language, customInput } = body;

    const task = await Task.findById(taskId);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // Use custom input if provided, otherwise use the first visible test case, otherwise empty string
    let inputToRun = customInput || '';
    if (!customInput && task.testCases && task.testCases.length > 0) {
      const visibleCases = task.testCases.filter((tc: any) => !tc.isHidden);
      if (visibleCases.length > 0) {
        inputToRun = visibleCases[0].input;
      }
    }

    const result = await executeCode(code, language, inputToRun);

    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    const compile_output = result.compileError || '';

    return NextResponse.json({
      stdout,
      stderr,
      compile_output,
      status: 'Finished',
      time: result.time || '0',
      memory: result.memory || 0,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Run error:', error.response?.data || error.message || error);
    const errorMessage = error.response?.data?.message || 'Internal server error during code execution';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});

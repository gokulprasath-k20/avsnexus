import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import Task from '@/models/Task';
import { executeCode } from '@/lib/executor';
import connectDB from '@/lib/db';

export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { code, language, input, taskId } = body;

    if (!code || !language || !taskId) {
      return NextResponse.json({ error: 'Code, language, and taskId are required' }, { status: 400 });
    }

    await connectDB();
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.type !== 'coding') {
      return NextResponse.json({ error: 'Invalid task type for playground execution' }, { status: 400 });
    }

    const result = await executeCode(code, language, input || '');

    return NextResponse.json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compileError: result.compileError || '',
      time: result.time || '0',
      memory: result.memory || 0,
      statusCode: result.statusCode || 200
    }, { status: 200 });

  } catch (error: any) {
    console.error('Execution error:', error);
    return NextResponse.json({ 
      error: 'Code execution failed',
      details: error.message 
    }, { status: 500 });
  }
});

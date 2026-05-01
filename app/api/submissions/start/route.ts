import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Task from '@/models/Task';

// POST /api/submissions/start
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'TaskId is required' }, { status: 400 });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Return the current server time as the official start time
    return NextResponse.json({ 
      startedAt: new Date().toISOString(),
      duration: 30 * 60 // 30 minutes in seconds
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import { requireAuth } from '@/lib/auth';

// GET /api/tasks/[id] - full task details including test cases for admins
export const GET = requireAuth(async (request: NextRequest, user) => {
  const id = request.nextUrl.pathname.split('/').pop();
  try {
    await connectDB();
    const isAdmin = user.role !== 'student';
    const query = Task.findById(id);
    if (!isAdmin) query.select('-testCases'); // hide answers
    const task = await query;
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// PATCH /api/tasks/[id]
export const PATCH = requireAuth(
  async (request: NextRequest) => {
    const id = request.nextUrl.pathname.split('/').pop();
    try {
      await connectDB();
      const body = await request.json();
      const updated = await Task.findByIdAndUpdate(id, body, { new: true });
      if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ task: updated });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['superAdmin', 'moduleAdmin']
);

// DELETE /api/tasks/[id]
export const DELETE = requireAuth(
  async (request: NextRequest) => {
    const id = request.nextUrl.pathname.split('/').pop();
    try {
      await connectDB();
      await Task.findByIdAndUpdate(id, { isActive: false });
      return NextResponse.json({ message: 'Task deleted' });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['superAdmin', 'moduleAdmin']
);

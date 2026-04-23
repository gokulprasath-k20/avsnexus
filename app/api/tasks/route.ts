import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Module from '@/models/Module';
import { requireAuth } from '@/lib/auth';

// GET /api/tasks?moduleId=...&stage=...
export const GET = requireAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const moduleId = searchParams.get('moduleId');
    const stage = searchParams.get('stage');

    const query: Record<string, unknown> = { isActive: true };
    if (moduleId) query.moduleId = moduleId;
    if (stage) query.stage = stage;

    const createdBy = searchParams.get('createdBy');
    if (createdBy) query.createdBy = createdBy;

    const tasks = await Task.find(query)
      .select('-testCases') // hide test cases from students
      .populate('moduleId', 'name')
      .sort({ stage: 1, order: 1 });

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// POST /api/tasks - create task (moduleAdmin, superAdmin)
export const POST = requireAuth(
  async (request: NextRequest, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const { moduleId } = body;

      // Verify admin is assigned to this module
      if (user.role === 'moduleAdmin') {
        const module = await Module.findOne({
          _id: moduleId,
          assignedAdmins: user.userId,
        });
        if (!module) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const task = await Task.create({ ...body, createdBy: user.userId });
      return NextResponse.json({ task }, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['superAdmin', 'moduleAdmin']
);

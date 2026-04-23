import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Module from '@/models/Module';
import { requireAuth } from '@/lib/auth';

type Params = { params: { id: string } };

// GET /api/modules/[id]
export const GET = requireAuth(async (request: NextRequest, user) => {
  const id = request.nextUrl.pathname.split('/').pop();
  try {
    await connectDB();
    const module = await Module.findById(id).populate('assignedAdmins', 'name email');
    if (!module) return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    return NextResponse.json({ module });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// PATCH /api/modules/[id] - superAdmin or assignedAdmin
export const PATCH = requireAuth(
  async (request: NextRequest, user) => {
    const id = request.nextUrl.pathname.split('/').pop();
    try {
      await connectDB();
      const body = await request.json();

      // moduleAdmin can only update if assigned
      if (user.role === 'moduleAdmin') {
        const module = await Module.findOne({ _id: id, assignedAdmins: user.userId });
        if (!module) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updated = await Module.findByIdAndUpdate(id, body, { new: true });
      if (!updated) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

      return NextResponse.json({ module: updated });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['superAdmin', 'moduleAdmin']
);

// DELETE /api/modules/[id] - superAdmin only
export const DELETE = requireAuth(
  async (request: NextRequest) => {
    const id = request.nextUrl.pathname.split('/').pop();
    try {
      await connectDB();
      await Module.findByIdAndUpdate(id, { isActive: false });
      return NextResponse.json({ message: 'Module deleted' });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['superAdmin']
);

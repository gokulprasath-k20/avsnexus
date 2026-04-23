import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Module from '@/models/Module';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/users
export const GET = requireAuth(
  async (request: NextRequest) => {
    try {
      await connectDB();
      const { searchParams } = request.nextUrl;
      const role = searchParams.get('role');
      const query: Record<string, unknown> = { isActive: true };
      if (role) query.role = role;

      const users = await User.find(query)
        .select('-password')
        .populate('assignedModules', 'name type')
        .sort({ createdAt: -1 });

      return NextResponse.json({ users });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['superAdmin']
);

// PATCH /api/admin/users - assign module admin or change role
export const PATCH = requireAuth(
  async (request: NextRequest) => {
    try {
      await connectDB();
      const { userId, role, moduleId, action } = await request.json();

      const user = await User.findById(userId);
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      if (role) {
        user.role = role;
      }

      if (moduleId && action === 'assign') {
        user.assignedModules.push(moduleId);
        await Module.findByIdAndUpdate(moduleId, {
          $addToSet: { assignedAdmins: userId },
        });
      }

      if (moduleId && action === 'unassign') {
        user.assignedModules = user.assignedModules.filter(
          (id) => id.toString() !== moduleId
        );
        await Module.findByIdAndUpdate(moduleId, {
          $pull: { assignedAdmins: userId },
        });
      }

      await user.save();
      return NextResponse.json({ user: { ...user.toObject(), password: undefined } });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['superAdmin']
);

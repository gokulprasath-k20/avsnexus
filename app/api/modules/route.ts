import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Module from '@/models/Module';
import { requireAuth } from '@/lib/auth';

// GET /api/modules - list all active modules
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    const query: Record<string, unknown> = { isActive: true };

    // Module admins only see their assigned module type
    if (user.role === 'moduleAdmin' && user.assignedModuleType) {
      query.type = user.assignedModuleType;
    }

    const modules = await Module.find(query)
      .populate('assignedAdmins', 'name email')
      .sort({ order: 1, createdAt: -1 });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Get modules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// POST /api/modules - create new module (superAdmin & moduleAdmin)
export const POST = requireAuth(
  async (request: NextRequest, user) => {
    try {
      await connectDB();
      const body = await request.json();
      let { name, description, type, icon, stageConfig, topics } = body;

      if (!name || !description || !type) {
        return NextResponse.json(
          { error: 'Name, description, and type are required' },
          { status: 400 }
        );
      }

      // Enforce data isolation: moduleAdmin can only create their assigned type
      if (user.role === 'moduleAdmin') {
        if (user.assignedModuleType && type !== user.assignedModuleType) {
          return NextResponse.json(
            { error: `You are only authorized to create ${user.assignedModuleType} modules.` },
            { status: 403 }
          );
        }
        // Force the type to their assigned type just in case
        type = user.assignedModuleType || type;
      }

      const module = await Module.create({
        name,
        description,
        type,
        icon,
        stageConfig,
        topics,
        createdBy: user.userId,
        assignedAdmins: [user.userId], // Auto-assign the creator
      });

      return NextResponse.json({ module }, { status: 201 });
    } catch (error) {
      console.error('Create module error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['superAdmin', 'moduleAdmin']
);

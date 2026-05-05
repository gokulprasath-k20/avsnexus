import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { supabaseId, email } = await request.json();
    if (!supabaseId) {
      return NextResponse.json({ error: 'Supabase ID is required' }, { status: 400 });
    }

    const query = {
      $or: [
        { supabaseId },
        { email: email?.toLowerCase() },
        { registerNumber: email?.split('@')[0] }
      ],
      isActive: true
    };

    const user = await User.findOne(query);
    if (!user) {
      return NextResponse.json({ error: 'User not found in system' }, { status: 404 });
    }

    if (!user.supabaseId) {
      user.supabaseId = supabaseId;
      await user.save();
    }

    const token = signToken({
      userId: user._id.toString(),
      registerNumber: user.registerNumber,
      email: user.email,
      role: user.role,
      name: user.name,
      assignedModuleType: user.assignedModuleType,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        registerNumber: user.registerNumber,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        section: user.section,
        assignedModuleType: user.assignedModuleType,
        totalPoints: user.totalPoints,
        avatar: user.avatar,
        category: user.category,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

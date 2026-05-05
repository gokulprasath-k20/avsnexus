import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { 
      name, 
      registerNumber, 
      supabaseId,
      department, 
      year, 
      category, 
      section,
      email 
    } = body;
    const role = body.role || 'student';

    if (!supabaseId) {
      return NextResponse.json({ error: 'Supabase ID is required' }, { status: 400 });
    }

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ 
      $or: [{ supabaseId }, { registerNumber }] 
    });

    if (existingUser) {
      if (!existingUser.supabaseId) {
        existingUser.supabaseId = supabaseId;
        await existingUser.save();
      }
      return createAuthResponse(existingUser);
    }

    const user = await User.create({ 
      name, 
      registerNumber, 
      supabaseId,
      role, 
      department, 
      year, 
      category, 
      section,
      email,
      password: 'SUPABASE_AUTH_MANAGED' 
    });

    return createAuthResponse(user);
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function createAuthResponse(user: any) {
  const token = signToken({
    userId: user._id.toString(),
    registerNumber: user.registerNumber,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  const response = NextResponse.json(
    {
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        registerNumber: user.registerNumber,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        section: user.section,
        totalPoints: user.totalPoints,
        category: user.category,
      },
    },
    { status: 201 }
  );

  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { role = 'student' } = body;

    if (role !== 'student') {
      return NextResponse.json({ error: 'Only student accounts can be created via signup' }, { status: 403 });
    }

    const { name, registerNumber, password, department, year, category, section } = body;

    if (!name || !registerNumber || !password || !department || !year || !category || !section) {
      return NextResponse.json({ error: 'All student fields are required' }, { status: 400 });
    }

    if (!/^\d{12}$/.test(registerNumber)) {
      return NextResponse.json({ error: 'Register number must be exactly 12 digits' }, { status: 400 });
    }

    const existingUser = await User.findOne({ registerNumber });
    if (existingUser) {
      return NextResponse.json({ error: 'Register number already in use' }, { status: 409 });
    }

    const user = await User.create({ 
      name, registerNumber, password, role: 'student', department, year, category, section 
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

// app/api/admin/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // 1. Verify SuperAdmin Authorization (Old JWT style or Supabase style)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: SuperAdmin only' }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(id);

    if (!user || !user.supabaseId) {
      return NextResponse.json({ error: 'User not found or not linked to Supabase' }, { status: 404 });
    }

    // 2. Initialize Supabase Admin
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl!, supabaseServiceKey);

    // 3. Update password in Supabase
    const { error: authError } = await supabase.auth.admin.updateUserById(
      user.supabaseId,
      { password: newPassword }
    );

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

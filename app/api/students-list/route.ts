import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const department = searchParams.get('department');
    const section = searchParams.get('section');

    const filter: any = { role: 'student' };
    if (year && year !== 'ALL') filter.year = Number(year);
    if (department && department !== 'ALL') filter.department = department;
    if (section && section !== 'ALL') filter.section = section;

    const students = await User.find(filter)
      .select('name registerNumber department year section email')
      .sort({ department: 1, year: 1, section: 1, name: 1 });

    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

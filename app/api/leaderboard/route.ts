import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Score from '@/models/Score';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

// GET /api/leaderboard?moduleId=...
export const GET = requireAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const moduleId = searchParams.get('moduleId');

    if (moduleId) {
      // Module-specific leaderboard
      const scores = await Score.find({ moduleId })
        .populate('studentId', 'name email avatar')
        .sort({ totalPoints: -1 })
        .limit(100);

      const leaderboard = scores.map((s, idx) => ({
        rank: idx + 1,
        student: s.studentId,
        totalPoints: s.totalPoints,
        easyPoints: s.easyPoints,
        intermediatePoints: s.intermediatePoints,
        expertPoints: s.expertPoints,
        completedTasks: s.completedTasks,
      }));

      return NextResponse.json({ leaderboard });
    } else {
      // Global leaderboard
      const users = await User.find({ role: 'student', isActive: true })
        .select('name email avatar totalPoints')
        .sort({ totalPoints: -1 })
        .limit(100);

      const leaderboard = users.map((u, idx) => ({
        rank: idx + 1,
        student: { _id: u._id, name: u.name, email: u.email, avatar: u.avatar },
        totalPoints: u.totalPoints,
      }));

      return NextResponse.json({ leaderboard });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

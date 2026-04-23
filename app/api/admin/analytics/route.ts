import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Score from '@/models/Score';
import Submission from '@/models/Submission';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/analytics
export const GET = requireAuth(
  async (request: NextRequest) => {
    try {
      await connectDB();

      const [totalStudents, totalSubmissions, pendingReviews] = await Promise.all([
        User.countDocuments({ role: 'student', isActive: true }),
        Submission.countDocuments(),
        Submission.countDocuments({ status: 'needs_review' }),
      ]);

      // Top scorers
      const topStudents = await User.find({ role: 'student' })
        .select('name email totalPoints avatar')
        .sort({ totalPoints: -1 })
        .limit(5);

      // Module completion rates
      const moduleStats = await Score.aggregate([
        {
          $group: {
            _id: '$moduleId',
            totalStudents: { $addToSet: '$studentId' },
            avgPoints: { $avg: '$totalPoints' },
            totalTasks: { $sum: '$completedTasks' },
          },
        },
        {
          $lookup: {
            from: 'modules',
            localField: '_id',
            foreignField: '_id',
            as: 'module',
          },
        },
        { $unwind: '$module' },
        {
          $project: {
            moduleName: '$module.name',
            moduleType: '$module.type',
            studentCount: { $size: '$totalStudents' },
            avgPoints: { $round: ['$avgPoints', 0] },
            totalTasks: 1,
          },
        },
      ]);

      return NextResponse.json({
        stats: {
          totalStudents,
          totalSubmissions,
          pendingReviews,
        },
        topStudents,
        moduleStats,
      });
    } catch (error: any) {
      console.error('Analytics API error:', error);
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
  },
  ['superAdmin']
);

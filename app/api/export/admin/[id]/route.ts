import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Task from '@/models/Task';
import Submission from '@/models/Submission';
import ExcelJS from 'exceljs';
import { formatExcelSheet } from '@/lib/excel-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adminId } = await params;
    const currentUserId = req.headers.get('x-user-id');
    const role = req.headers.get('x-user-role');

    // Security check: Only superadmin or the admin themselves can export this
    if (role !== 'superadmin' && currentUserId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const admin = await User.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const totalStudents = await User.countDocuments({ role: 'student' });
    const tasks = await Task.find({ createdBy: adminId });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('My Report');

    sheet.columns = [
      { header: 'Task Title', key: 'title', width: 30 },
      { header: 'Created Date', key: 'createdAt', width: 20 },
      { header: 'Stage', key: 'stage', width: 15 },
      { header: 'Total Assigned', key: 'assigned', width: 15 },
      { header: 'Attended', key: 'attended', width: 15 },
      { header: 'Pass Count', key: 'passed', width: 15 },
      { header: 'Fail Count', key: 'failed', width: 15 },
    ];

    for (const task of tasks) {
      const submissions = await Submission.find({ taskId: task._id });
      const attendedIds = new Set(submissions.map(s => s.studentId.toString()));
      const attended = attendedIds.size;
      
      const passed = submissions.filter(s => ['accepted', 'reviewed'].includes(s.status)).length;
      const failed = submissions.filter(s => ['wrong_answer', 'runtime_error', 'time_limit_exceeded'].includes(s.status)).length;

      sheet.addRow({
        title: task.title,
        createdAt: task.createdAt.toLocaleDateString(),
        stage: task.stage,
        assigned: totalStudents,
        attended,
        passed,
        failed,
      });
    }

    formatExcelSheet(sheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const date = new Date().toISOString().split('T')[0];
    const adminName = admin.name.replace(/\s+/g, '_');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Admin_Report_${adminName}_${date}.xlsx`,
      },
    });
  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

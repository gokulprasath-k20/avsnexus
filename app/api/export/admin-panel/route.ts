import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Task from '@/models/Task';
import Module from '@/models/Module';
import Submission from '@/models/Submission';
import ExcelJS from 'exceljs';
import { formatExcelSheet } from '@/lib/excel-helpers';

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const totalStudentsCount = await User.countDocuments({ role: 'student' });
    const tasks = await Task.find().populate('moduleId');
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Admin Panel Report');

    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 10 },
      { header: 'Module Name', key: 'moduleName', width: 25 },
      { header: 'Task Name', key: 'taskName', width: 30 },
      { header: 'Level of Task', key: 'level', width: 15 },
      { header: 'No. of Students Attended', key: 'attended', width: 25 },
      { header: 'No. of Students Not Attended', key: 'notAttended', width: 25 },
    ];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const attendedCount = await Submission.distinct('studentId', { taskId: task._id }).then(ids => ids.length);
      const notAttendedCount = totalStudentsCount - attendedCount;

      sheet.addRow({
        sno: i + 1,
        moduleName: (task.moduleId as any)?.name || 'Unknown',
        taskName: task.title,
        level: task.stage,
        attended: attendedCount,
        notAttended: notAttendedCount > 0 ? notAttendedCount : 0,
      });
    }

    formatExcelSheet(sheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const date = new Date().toISOString().split('T')[0];
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Admin_Report_${date}.xlsx`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

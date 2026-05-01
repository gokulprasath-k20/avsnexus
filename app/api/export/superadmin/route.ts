import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Task from '@/models/Task';
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
    
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get('dept');
    const year = searchParams.get('year');

    // Build student filter
    const studentFilter: any = { role: 'student' };
    if (dept && dept !== 'ALL') studentFilter.department = dept;
    if (year && year !== 'ALL') studentFilter.year = Number(year);

    const totalStudents = await User.countDocuments(studentFilter);
    const filteredStudentIds = await User.find(studentFilter).distinct('_id');

    // Aggregate data grouped by Admin and then by Task
    const admins = await User.find({ role: { $in: ['moduleAdmin', 'superadmin'] } }).select('name email');
    
    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Add filter info to Summary Sheet
    summarySheet.addRow(['Filter Applied:', `Dept: ${dept || 'ALL'}, Year: ${year || 'ALL'}`]);
    summarySheet.addRow([]); // Spacer
    
    summarySheet.columns = [
      { header: 'Admin Name', key: 'adminName', width: 25 },
      { header: 'Total Tasks', key: 'totalTasks', width: 15 },
      { header: 'Total Students Assigned', key: 'totalAssigned', width: 25 },
      { header: 'Students Attended', key: 'attended', width: 20 },
      { header: 'Pass Count', key: 'passed', width: 15 },
      { header: 'Fail Count', key: 'failed', width: 15 },
    ];

    for (const admin of admins) {
      const tasks = await Task.find({ createdBy: admin._id });
      if (tasks.length === 0) continue;

      // Excel sheet name rules: max 31 chars, no special chars: \ / ? * [ ] :
      let sheetName = admin.name.replace(/[\\/?*\[\]:]/g, '_').substring(0, 31);
      
      // Ensure unique sheet names if truncated names collide
      let counter = 1;
      const baseName = sheetName;
      while (workbook.getWorksheet(sheetName)) {
        const suffix = `_${counter}`;
        sheetName = baseName.substring(0, 31 - suffix.length) + suffix;
        counter++;
      }

      const adminSheet = workbook.addWorksheet(sheetName);
      adminSheet.addRow(['Filter Applied:', `Dept: ${dept || 'ALL'}, Year: ${year || 'ALL'}`]);
      adminSheet.addRow([]);

      adminSheet.columns = [
        { header: 'Task Title', key: 'title', width: 30 },
        { header: 'Created Date', key: 'createdAt', width: 20 },
        { header: 'Stage', key: 'stage', width: 15 },
        { header: 'Total Assigned', key: 'assigned', width: 15 },
        { header: 'Attended', key: 'attended', width: 15 },
        { header: 'Pass Count', key: 'passed', width: 15 },
        { header: 'Fail Count', key: 'failed', width: 15 },
        { header: 'Easy Pass', key: 'easyPass', width: 12 },
        { header: 'Easy Fail', key: 'easyFail', width: 12 },
        { header: 'Int Pass', key: 'intPass', width: 12 },
        { header: 'Int Fail', key: 'intFail', width: 12 },
        { header: 'Exp Pass', key: 'expPass', width: 12 },
        { header: 'Exp Fail', key: 'expFail', width: 12 },
      ];

      let adminTotalAttended = 0;
      let adminTotalPassed = 0;
      let adminTotalFailed = 0;

      for (const task of tasks) {
        // Filter submissions by task and student filter
        const submissions = await Submission.find({ 
          taskId: task._id,
          studentId: { $in: filteredStudentIds }
        });
        const attendedIds = new Set(submissions.map(s => s.studentId.toString()));
        const attended = attendedIds.size;
        
        const passed = submissions.filter(s => ['accepted', 'reviewed'].includes(s.status)).length;
        const failed = submissions.filter(s => ['wrong_answer', 'runtime_error', 'time_limit_exceeded'].includes(s.status)).length;

        adminTotalAttended += attended;
        adminTotalPassed += passed;
        adminTotalFailed += failed;

        const rowData: any = {
          title: task.title,
          createdAt: task.createdAt.toLocaleDateString(),
          stage: task.stage,
          assigned: totalStudents,
          attended,
          passed,
          failed,
          easyPass: task.stage === 'easy' ? passed : 0,
          easyFail: task.stage === 'easy' ? failed : 0,
          intPass: task.stage === 'intermediate' ? passed : 0,
          intFail: task.stage === 'intermediate' ? failed : 0,
          expPass: task.stage === 'expert' ? passed : 0,
          expFail: task.stage === 'expert' ? failed : 0,
        };

        adminSheet.addRow(rowData);
      }

      formatExcelSheet(adminSheet);

      summarySheet.addRow({
        adminName: admin.name,
        totalTasks: tasks.length,
        totalAssigned: totalStudents,
        attended: adminTotalAttended,
        passed: adminTotalPassed,
        failed: adminTotalFailed,
      });
    }

    formatExcelSheet(summarySheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const date = new Date().toISOString().split('T')[0];
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=SuperAdmin_Report_${date}.xlsx`,
      },
    });
  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

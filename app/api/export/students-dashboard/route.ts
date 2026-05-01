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

    const { searchParams } = new URL(req.url);
    const dept = searchParams.get('department');
    const year = searchParams.get('year');
    const moduleId = searchParams.get('module');

    // 1. Filter students
    const studentFilter: any = { role: 'student' };
    if (dept && dept !== 'ALL') studentFilter.department = dept;
    if (year && year !== 'ALL') studentFilter.year = Number(year);
    const students = await User.find(studentFilter).select('name department year totalPoints');

    // 2. Get Modules and Tasks
    const moduleFilter: any = {};
    if (moduleId && moduleId !== 'ALL') moduleFilter._id = moduleId;
    const modules = await Module.find(moduleFilter).select('name');
    const moduleMap = new Map(modules.map(m => [m._id.toString(), m.name]));

    const tasks = await Task.find(moduleId && moduleId !== 'ALL' ? { moduleId } : {}).select('moduleId stage points');
    
    // Group tasks by module and stage
    const taskGroups: Record<string, { ids: string[], totalPoints: number }> = {};
    tasks.forEach(t => {
      const key = `${t.moduleId}_${t.stage}`;
      if (!taskGroups[key]) taskGroups[key] = { ids: [], totalPoints: 0 };
      taskGroups[key].ids.push(t._id.toString());
      taskGroups[key].totalPoints += t.points;
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Student Performance');

    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Year', key: 'year', width: 8 },
      { header: 'Department', key: 'dept', width: 12 },
      { header: 'Module Name', key: 'module', width: 20 },
      { header: 'Level', key: 'level', width: 12 },
      { header: 'Attended', key: 'attended', width: 10 },
      { header: 'Not Attended', key: 'notAttended', width: 12 },
      { header: 'Passed', key: 'passed', width: 10 },
      { header: 'Failed', key: 'failed', width: 10 },
      { header: 'Points', key: 'points', width: 10 },
    ];

    let sno = 1;
    const stages = ['easy', 'intermediate', 'expert'];

    for (const student of students) {
      // Get all submissions for this student
      const submissions = await Submission.find({ studentId: student._id }).select('taskId status score moduleId');
      
      for (const mod of modules) {
        for (const stage of stages) {
          const key = `${mod._id}_${stage}`;
          const group = taskGroups[key];
          if (!group) continue; // No tasks for this level

          const stageSubmissions = submissions.filter(s => group.ids.includes(s.taskId.toString()));
          
          const attended = stageSubmissions.length;
          const notAttended = group.ids.length - attended;
          const passed = stageSubmissions.filter(s => ['accepted', 'reviewed'].includes(s.status)).length;
          const failed = attended - passed;
          const points = stageSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);

          sheet.addRow({
            sno: sno++,
            name: student.name,
            year: student.year || '-',
            dept: student.department || '-',
            module: mod.name,
            level: stage.charAt(0).toUpperCase() + stage.slice(1),
            attended,
            notAttended: notAttended > 0 ? notAttended : 0,
            passed,
            failed,
            points,
          });
        }
      }
    }

    formatExcelSheet(sheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const date = new Date().toISOString().split('T')[0];
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Student_Report_${date}.xlsx`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

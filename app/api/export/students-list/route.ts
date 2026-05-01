import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
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
    const year = searchParams.get('year');
    const department = searchParams.get('department');
    const section = searchParams.get('section');

    const filter: any = { role: 'student' };
    if (year && year !== 'ALL') filter.year = Number(year);
    if (department && department !== 'ALL') filter.department = department;
    if (section && section !== 'ALL') filter.section = section;

    const students = await User.find(filter)
      .sort({ department: 1, year: 1, section: 1, name: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Students List');

    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Student Name', key: 'name', width: 30 },
      { header: 'Register Number', key: 'regNo', width: 20 },
      { header: 'Department', key: 'dept', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Section', key: 'section', width: 10 },
    ];

    students.forEach((student, index) => {
      sheet.addRow({
        sno: index + 1,
        name: student.name,
        regNo: student.registerNumber || '-',
        dept: student.department || '-',
        year: student.year || '-',
        section: student.section || '-',
      });
    });

    formatExcelSheet(sheet);

    const date = new Date().toISOString().split('T')[0];
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Students_List_${date}.xlsx`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

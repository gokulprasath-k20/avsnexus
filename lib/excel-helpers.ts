import ExcelJS from 'exceljs';

export const formatExcelSheet = (sheet: ExcelJS.Worksheet) => {
  // Bold headers
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Auto column width
  sheet.columns.forEach((column) => {
    let maxColumnLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString() : '';
      maxColumnLength = Math.max(maxColumnLength, cellValue.length);
    });
    column.width = maxColumnLength < 12 ? 12 : maxColumnLength + 2;
  });

  // Add borders to cells
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });
};

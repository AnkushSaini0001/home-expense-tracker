import * as XLSX from 'xlsx';

/** Approximate Excel column width from cell string length */
function colWidthFor(value, min = 12, max = 40) {
  const len = String(value ?? '').length;
  return Math.min(max, Math.max(min, len + 4));
}

/**
 * Set column widths from header keys + row values.
 */
function applyColumnWidths(sheet, rows) {
  if (!rows?.length) {
    sheet['!cols'] = [{ wch: 20 }];
    return;
  }

  const headers = Object.keys(rows[0]);
  sheet['!cols'] = headers.map((header) => {
    // Note column needs extra room for longer remarks
    if (header === 'Note') {
      let maxLen = Math.max(header.length, 28);
      rows.forEach((row) => {
        const cellLen = String(row[header] ?? '').length;
        if (cellLen > maxLen) maxLen = cellLen;
      });
      return { wch: colWidthFor(maxLen, 32, 60) };
    }

    let maxLen = header.length;
    rows.forEach((row) => {
      const cellLen = String(row[header] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return { wch: colWidthFor(maxLen, 14, 45) };
  });
}

/**
 * Build and download an .xlsx file from sheet definitions.
 * @param {Array<{ name: string, rows: Array<Record<string, unknown>> }>} sheets
 * @param {string} fileName - without extension
 */
export function downloadWorkbook(sheets, fileName) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, rows }) => {
    const safeName = String(name || 'Sheet').slice(0, 31);
    const data = rows.length ? rows : [{ Info: 'No data' }];
    const sheet = XLSX.utils.json_to_sheet(data);
    applyColumnWidths(sheet, data);
    XLSX.utils.book_append_sheet(workbook, sheet, safeName);
  });

  const safeFile = String(fileName || 'export').replace(/[^\w\-]+/g, '_');
  XLSX.writeFile(workbook, `${safeFile}.xlsx`);
}

export function buildProviderMonthlyExcel(bill) {
  const { provider, billing, monthFormatted, logs = [] } = bill;
  const isDaily = billing.billingType === 'daily_unit';

  const dailyRows = logs.map((log) => {
    const row = {
      Date: log.date,
      Status: log.status,
      Note: log.notes || '',
    };
    if (isDaily) {
      row.Quantity = log.quantity;
      row.Unit = billing.unit || 'Liter';
      row.Rate = log.rate || billing.rate;
    }
    return row;
  });

  const baseName = `${provider.name}_${monthFormatted}`.replace(/\s+/g, '_');

  return {
    fileName: `Provider_${baseName}`,
    sheets: [
      { name: isDaily ? 'Deliveries' : 'Attendance', rows: dailyRows },
    ],
  };
}

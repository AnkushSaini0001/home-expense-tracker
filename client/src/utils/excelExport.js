import * as XLSX from 'xlsx';

/**
 * Build and download an .xlsx file from sheet definitions.
 * @param {Array<{ name: string, rows: Array<Record<string, unknown>> }>} sheets
 * @param {string} fileName - without extension
 */
export function downloadWorkbook(sheets, fileName) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, rows }) => {
    const safeName = String(name || 'Sheet').slice(0, 31);
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: 'No data' }]);
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

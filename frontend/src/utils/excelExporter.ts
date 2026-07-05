import * as XLSX from 'xlsx';
import { toPlanLabel } from './planLabels';

/**
 * Centered utility to export raw JSON arrays to styled .xlsx Excel spreadsheets.
 * Handles auto-fit columns, UTF-8 sanitation, and dynamic number parsing.
 * Plan fields (gratis, venta_pro, etc.) are translated to formal UI labels.
 */
export function exportDataToExcel(data: any[], fileName: string, sheetName: string = 'Reporte') {
  if (!data || data.length === 0) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  // Plan key detection — translate snake_case DB values to readable labels
  const PLAN_FIELD_KEYS = ['plan', 'Plan', 'PLAN', 'marketingPlan', 'marketing_plan'];
  const PLAN_RAW_VALUES = new Set(['gratis', 'contenidos', 'venta_pro', 'cierre_garantizado']);

  // Map each property directly to columns and format headers
  const formattedData = data.map((item) => {
    const formattedItem: any = {};
    for (const key of Object.keys(item)) {
      // Format CamelCase or snake_case keys to clean uppercase headers
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim()
        .toUpperCase();

      let val = item[key];

      // ── Plan Field Normalization ──────────────────────────────────────────
      // Translate raw backend enum values to formal UI strings in the report.
      if (PLAN_FIELD_KEYS.includes(key) && typeof val === 'string') {
        const lowerVal = val.toLowerCase().trim();
        if (PLAN_RAW_VALUES.has(lowerVal) || val.includes('_') || val.includes(' ')) {
          val = toPlanLabel(val);
        }
        formattedItem[formattedKey] = val;
        continue;
      }
      // ─────────────────────────────────────────────────────────────────────

      if (Array.isArray(val)) {
        val = val.join(', ');
      }

      if (typeof val === 'string') {
        const num = Number(val);
        // Cast stringified numbers (excluding phone numbers/codes starting with + or 0)
        if (val.trim() !== '' && !isNaN(num) && !val.startsWith('0') && !val.startsWith('+')) {
          formattedItem[formattedKey] = num;
        } else {
          formattedItem[formattedKey] = val;
        }
      } else if (typeof val === 'number') {
        formattedItem[formattedKey] = val;
      } else if (val === null || val === undefined) {
        formattedItem[formattedKey] = '';
      } else {
        formattedItem[formattedKey] = String(val);
      }
    }
    return formattedItem;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Dynamic layout & column width algorithm
  if (formattedData.length > 0) {
    const headers = Object.keys(formattedData[0]);
    const colWidths = headers.map((header) => ({ wch: header.length + 3 }));

    formattedData.forEach((row) => {
      headers.forEach((header, index) => {
        const val = row[header];
        const valLength = val !== null && val !== undefined ? String(val).length : 0;
        colWidths[index].wch = Math.max(colWidths[index].wch, valLength + 3);
      });
    });

    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const fullFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, fullFileName);
}

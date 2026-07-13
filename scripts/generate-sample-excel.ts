import * as XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'fs';
import { buildSampleImportRows, SAMPLE_EXCEL_FILENAME } from '../lib/excelSample';
import { parseExcelRowsToEvaluations } from '../lib/excelParser';

const rows = buildSampleImportRows();
const parsed = parseExcelRowsToEvaluations(rows, 'دانشکده علوم', 1);
if (parsed.length !== 2) throw new Error(`expected 2 rows, got ${parsed.length}`);
console.log(
  'OK',
  parsed.map((e) => ({
    name: e.facultyName,
    id: e.nationalId,
    total: e.totalScore,
    years: e.activities?.map((a) => a.year),
  }))
);

mkdirSync('public/samples', { recursive: true });
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'قالب');
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
writeFileSync(`public/samples/${SAMPLE_EXCEL_FILENAME}`, buf);
console.log(`wrote public/samples/${SAMPLE_EXCEL_FILENAME}`);

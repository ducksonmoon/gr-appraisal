const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.xlsx'));
const xlsxPath = path.join(dataDir, files[0] || 'علوم.xlsx');

if (!fs.existsSync(xlsxPath)) {
  console.error('No xlsx file found in data/');
  process.exit(1);
}

const workbook = XLSX.readFile(xlsxPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
console.log(JSON.stringify(rows, null, 2));

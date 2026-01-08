const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'ARCH_PROJECT_MANAGEMENT.xlsx');
console.log('Reading file:', filePath);

try {
    const workbook = XLSX.readFile(filePath);
    workbook.SheetNames.forEach(name => {
        console.log(`\n--- Sheet: ${name} ---`);
        const ws = workbook.Sheets[name];
        const d = XLSX.utils.sheet_to_json(ws, { header: 1 });
        d.slice(0, 10).forEach((row, index) => {
            console.log(`Row ${index}:`, JSON.stringify(row));
        });
    });

} catch (error) {
    console.error('Error reading excel:', error);
}

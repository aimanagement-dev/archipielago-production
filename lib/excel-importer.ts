import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { Task, TaskStatus, TaskArea } from '@/lib/types';

export function parseExcelTasks(filePath: string): Partial<Task>[] {
    if (!fs.existsSync(filePath)) {
        console.warn(`[ExcelImporter] File not found: ${filePath}`);
        return [];
    }

    const workbook = XLSX.readFile(filePath);
    const tasksToImport: Partial<Task>[] = [];
    const months = ['Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto'];

    months.forEach(month => {
        const sheet = workbook.Sheets[month];
        if (!sheet) return;

        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        let startRow = -1;

        // Find section "B. LISTA COMPLETA..."
        for (let i = 0; i < data.length; i++) {
            if (data[i][0] && typeof data[i][0] === 'string' && data[i][0].includes('B. LISTA COMPLETA')) {
                startRow = i + 2; // Data usually starts 2 rows after title (Title -> Header -> Data)
                // startRow ahora apunta a la fila 8 del Excel (índice 7 en array 0-based)
                break;
            }
        }

        if (startRow === -1 || startRow >= data.length) return;

        // Headers are usually at startRow - 1
        const headerRow = data[startRow - 1];

        // Map headers to indices
        const colMap: any = {};
        headerRow.forEach((h: string, idx: number) => {
            if (!h) return;
            const lower = h.toLowerCase();
            if (lower.includes('semana')) colMap.week = idx;
            if (lower.includes('área') || lower.includes('area')) colMap.area = idx;
            if (lower.includes('descripción') || lower.includes('descripcion')) colMap.title = idx;
            if (lower.includes('responsable')) colMap.responsible = idx;
            if (lower.includes('estado')) colMap.status = idx;
            if (lower.includes('nota')) colMap.notes = idx;
        });

        // IMPORTANTE: Leer EXACTAMENTE filas 8-20 del Excel
        // startRow = índice 7 (fila 8), END_ROW = índice 19 (fila 20)
        const END_ROW = 20; // Fila final del Excel (índice 19 en array 0-based)

        for (let i = startRow; i < data.length && i < END_ROW; i++) {
            const row = data[i];
            
            // Detener inmediatamente si encontramos una fila completamente vacía
            if (!row || row.length === 0) {
                break;
            }
            
            // Detener si encontramos un título de nueva sección (por seguridad)
            if (row[0] && typeof row[0] === 'string') {
                const firstCell = row[0].toString().toUpperCase();
                if (firstCell.includes('CALENDARIO') || 
                    firstCell.includes('TIMELINE') || 
                    firstCell.includes('MILESTONE') ||
                    firstCell.includes('RIESGO') ||
                    firstCell.includes('VISTA')) {
                    break;
                }
            }
            
            // Si no hay título en esta fila, saltarla
            if (!row[colMap.title]) continue;

            const title = row[colMap.title];
            const area = (colMap.area !== undefined && row[colMap.area]) ? row[colMap.area] : 'Planificación';
            const statusRaw = (colMap.status !== undefined && row[colMap.status]) ? row[colMap.status] : 'Pendiente';
            const notes = (colMap.notes !== undefined && row[colMap.notes]) ? row[colMap.notes] : '';
            const week = (colMap.week !== undefined && row[colMap.week]) ? row[colMap.week] : '';
            const responsibleRaw = (colMap.responsible !== undefined && row[colMap.responsible]) ? row[colMap.responsible] : '';

            // Normalize Status
            let status: TaskStatus = 'Pendiente';
            if (statusRaw.toLowerCase().includes('curso') || statusRaw.toLowerCase().includes('progreso')) status = 'En Progreso';
            if (statusRaw.toLowerCase().includes('complet')) status = 'Completado';
            if (statusRaw.toLowerCase().includes('bloquea')) status = 'Bloqueado';

            // Normalize Responsible
            const responsible = responsibleRaw ? responsibleRaw.toString().split(/[,&]/).map((s: string) => s.trim()) : [];

            // Helper to getMonthAbbr
            const monthMap: Record<string, any> = {
                'Noviembre': 'Nov', 'Diciembre': 'Dic', 'Enero': 'Ene', 'Febrero': 'Feb',
                'Marzo': 'Mar', 'Abril': 'Abr', 'Mayo': 'May', 'Junio': 'Jun',
                'Julio': 'Jul', 'Agosto': 'Ago'
            };

            const task: Partial<Task> = {
                title,
                area: area as TaskArea,
                status,
                notes,
                week,
                month: monthMap[month] || 'Nov',
                responsible,
                isScheduled: false
            };
            tasksToImport.push(task);
        }
    });

    return tasksToImport;
}

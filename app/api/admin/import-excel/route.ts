import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { Task, TaskStatus, TaskArea } from '@/lib/types';

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) { // Simple auth check
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const filePath = path.join(process.cwd(), 'ARCH_PROJECT_MANAGEMENT.xlsx');
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "Excel file not found" }, { status: 404 });
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
                    break;
                }
            }

            if (startRow === -1 || startRow >= data.length) return;

            // Headers are usually at startRow - 1
            const headerRow = data[startRow - 1];
            // Simple mapping based on index if headers match expected
            // Expected: ["Semanas","Área","Descripción completa","Responsable(s)","Estado","Notas"]

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

            for (let i = startRow; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0 || !row[colMap.title]) continue;

                // Stop if we hit a new section (empty or title-like row that isn't data)
                // Heuristic: if title is missing, likely end.

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

                const task: Partial<Task> = {
                    title,
                    area: area as TaskArea, // Trusting excel or fallback
                    status,
                    notes,
                    week,
                    month: month.substring(0, 3) as any, // 'Nov', 'Dic' etc
                    responsible,
                    isScheduled: false // No exact dates in simple list
                };
                tasksToImport.push(task);
            }
        });

        // Import to Sheets
        const service = new GoogleSheetsService(session.accessToken as string); // Assuming we have token
        // Use the new DB ID logic
        const spreadsheetId = await service.getOrCreateDatabase();

        // Add tasks sequentially or batch if method existed (using loop for now)
        let count = 0;
        for (const task of tasksToImport) {
            await service.addTask(spreadsheetId, task as Task);
            count++;
        }

        return NextResponse.json({ success: true, count, tasks: tasksToImport.length });

    } catch (error: any) {
        console.error("Import error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

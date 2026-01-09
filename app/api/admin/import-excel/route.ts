import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { parseExcelTasks } from '@/lib/excel-importer';
import { Task } from '@/lib/types';
import { isUserAdmin } from '@/lib/constants';
import { generateId } from '@/lib/utils';

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) { // Simple auth check
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user?.email || '';
    const isAdmin = isUserAdmin(userEmail);
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const filePath = require('path').join(process.cwd(), 'ARCH_PROJECT_MANAGEMENT.xlsx');
        const fs = require('fs');
        
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "Excel file not found" }, { status: 404 });
        }

        // Usar la función parseExcelTasks mejorada que limita a filas 8-20
        const tasksToImport = parseExcelTasks(filePath);
        
        if (tasksToImport.length === 0) {
            return NextResponse.json({ 
                error: "No se encontraron tareas para importar. Verifica que el Excel tenga la sección 'B. LISTA COMPLETA' en cada tab mensual." 
            }, { status: 400 });
        }

        // Import to Sheets - Usar findDatabase() para el spreadsheet centralizado
        const service = new GoogleSheetsService(session.accessToken as string);
        const spreadsheetId = await service.findDatabase();
        
        if (!spreadsheetId) {
            return NextResponse.json({ 
                error: "No se encontró el spreadsheet centralizado. Verifica los permisos." 
            }, { status: 500 });
        }

        // Verificar tareas existentes para evitar duplicados
        const existingTasks = await service.getTasks(spreadsheetId);
        const existingTaskMap = new Map<string, Task>();
        
        // Crear clave única basada en título + mes + área
        existingTasks.forEach(task => {
            const key = `${task.title?.toLowerCase().trim()}-${task.month}-${task.area?.toLowerCase().trim()}`;
            existingTaskMap.set(key, task);
        });

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        // Insertar tareas evitando duplicados
        for (const taskPartial of tasksToImport) {
            try {
                // Crear clave única para esta tarea
                const key = `${taskPartial.title?.toLowerCase().trim()}-${taskPartial.month}-${taskPartial.area?.toLowerCase().trim()}`;
                
                // Verificar si ya existe
                if (existingTaskMap.has(key)) {
                    skipped++;
                    continue;
                }
                
                // Generar ID único para la nueva tarea
                const taskId = generateId();
                const task: Task = {
                    ...taskPartial,
                    id: taskId,
                    // Asegurar campos requeridos
                    title: taskPartial.title || 'Sin título',
                    status: taskPartial.status || 'Pendiente',
                    area: taskPartial.area || 'Planificación',
                    month: taskPartial.month || 'Ene',
                    week: taskPartial.week || 'Week 1',
                    responsible: taskPartial.responsible || [],
                    notes: taskPartial.notes || '',
                    isScheduled: taskPartial.isScheduled || false,
                    attachments: [],
                    visibility: 'all',
                    visibleTo: [],
                } as Task;
                
                await service.addTask(spreadsheetId, task);
                imported++;
                
                // Agregar a existingTaskMap para evitar duplicados en la misma importación
                existingTaskMap.set(key, task);
            } catch (error) {
                const errorMsg = `Error importando tarea "${taskPartial.title}": ${error instanceof Error ? error.message : 'Error desconocido'}`;
                console.error(errorMsg, error);
                errors.push(errorMsg);
            }
        }

        return NextResponse.json({ 
            success: true, 
            imported, 
            skipped, 
            total: tasksToImport.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error("Import error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

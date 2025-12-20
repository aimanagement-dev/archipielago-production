import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";
import { authOptions } from "@/lib/auth-config";
import { syncTasksToCalendar, syncCalendarToTasks, CalendarTaskPayload } from "@/lib/google/calendar";
import { Task } from "@/lib/types";

function monthFromDate(date: string): Task['month'] {
    const month = new Date(date).getMonth();
    const map: Task['month'][] = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as any;
    return map[month] || 'Nov';
}

function weekOfMonth(date: string): string {
    const d = new Date(date);
    const day = d.getDate();
    const week = Math.floor((day - 1) / 7) + 1;
    return `Week ${week}`;
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();
        
        // PASO 1: Leer tareas de Sheets
        const sheetsTasks = await service.getTasks(spreadsheetId);
        
        // PASO 2: Leer eventos de Calendar (últimos 3 meses, próximos 6 meses)
        const now = new Date();
        const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
        const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 0).toISOString();
        
        let calendarTasks: CalendarTaskPayload[] = [];
        try {
            const calendarResult = await syncCalendarToTasks(session.accessToken, {
                timeMin,
                timeMax,
            });
            calendarTasks = calendarResult.tasks;
            console.log(`[GET /api/tasks] Leídos ${calendarTasks.length} eventos de Calendar`);
        } catch (calendarError) {
            console.error("[GET /api/tasks] Error leyendo Calendar:", calendarError);
            // Continuar solo con Sheets si Calendar falla, pero loguear el error
        }
        
        // PASO 3: Combinar tareas de Sheets y Calendar
        // Crear un mapa de tareas por ID, dando prioridad a Calendar si hay conflictos
        const tasksMap = new Map<string, Task>();
        
        // Primero agregar todas las tareas de Sheets
        for (const task of sheetsTasks) {
            tasksMap.set(task.id, task);
        }
        
        // Luego actualizar/agregar tareas de Calendar (Calendar tiene prioridad)
        for (const calendarTask of calendarTasks) {
            if (!calendarTask.id || !calendarTask.title || !calendarTask.scheduledDate) {
                continue;
            }
            
            const task: Task = {
                id: calendarTask.id,
                title: calendarTask.title,
                status: (calendarTask.status as Task['status']) || 'Pendiente',
                area: (calendarTask.area as Task['area']) || 'Planificación',
                month: monthFromDate(calendarTask.scheduledDate),
                week: weekOfMonth(calendarTask.scheduledDate),
                responsible: Array.isArray(calendarTask.responsible) ? calendarTask.responsible : [],
                notes: calendarTask.notes || '',
                scheduledDate: calendarTask.scheduledDate,
                scheduledTime: calendarTask.scheduledTime,
                isScheduled: !!calendarTask.scheduledDate,
            };
            
            // Calendar tiene prioridad si existe en ambos
            tasksMap.set(task.id, task);
        }
        
        // Convertir mapa a array
        const combinedTasks = Array.from(tasksMap.values());
        
        console.log(`[GET /api/tasks] Total tareas combinadas: ${combinedTasks.length} (${sheetsTasks.length} de Sheets, ${calendarTasks.length} de Calendar)`);
        
        return NextResponse.json({ tasks: combinedTasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const task = await req.json();
        
        // Validar campos requeridos
        if (!task.id) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
        }
        if (!task.title) {
            return NextResponse.json({ error: "Task title is required" }, { status: 400 });
        }

        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();
        
        // Asegurar que los campos requeridos tengan valores por defecto
        const taskToSave = {
            id: task.id,
            title: task.title,
            status: task.status || 'Pendiente',
            area: task.area || 'Planificación',
            month: task.month || 'Ene',
            week: task.week || 'Week 1',
            responsible: Array.isArray(task.responsible) ? task.responsible : [],
            notes: task.notes || '',
            scheduledDate: task.scheduledDate || '',
            scheduledTime: task.scheduledTime || '',
        };

        await service.addTask(spreadsheetId, taskToSave);
        console.log(`[POST /api/tasks] Tarea ${task.id} guardada en Sheets`);

        // Si la tarea tiene fecha programada, sincronizar automáticamente a Google Calendar
        // ESPERAR la sincronización para asegurar que se cree correctamente
        const accessToken = session.accessToken;
        if (task.scheduledDate && accessToken) {
            try {
                console.log(`[POST /api/tasks] Sincronizando tarea ${task.id} a Calendar...`);
                const syncResult = await syncTasksToCalendar([{
                    id: task.id,
                    title: task.title,
                    scheduledDate: task.scheduledDate,
                    scheduledTime: task.scheduledTime,
                    responsible: task.responsible || [],
                    area: task.area,
                    status: task.status,
                    notes: task.notes,
                }], accessToken);
                console.log(`[POST /api/tasks] Sincronización a Calendar exitosa:`, syncResult);
            } catch (calendarError) {
                console.error("[POST /api/tasks] Error sincronizando a Calendar:", calendarError);
                // NO fallar la creación de la tarea si Calendar falla, pero loguear el error
            }
        }

        return NextResponse.json({ success: true, task: taskToSave });
    } catch (error) {
        console.error("Error creating task:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ 
            error: "Failed to create task", 
            details: errorMessage 
        }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const task = await req.json();
        if (!task.id) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
        }

        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();
        
        // Asegurar que los campos requeridos tengan valores por defecto
        const taskToUpdate = {
            ...task,
            status: task.status || 'Pendiente',
            area: task.area || 'Planificación',
            month: task.month || 'Ene',
            week: task.week || 'Week 1',
            responsible: Array.isArray(task.responsible) ? task.responsible : [],
            notes: task.notes || '',
        };
        
        await service.updateTask(spreadsheetId, taskToUpdate);
        console.log(`[PUT /api/tasks] Tarea ${task.id} actualizada en Sheets`);

        // Sincronizar con Calendar - ESPERAR para asegurar que se actualice correctamente
        const accessToken = session.accessToken;
        if (task.scheduledDate && accessToken) {
            try {
                console.log(`[PUT /api/tasks] Sincronizando tarea ${task.id} a Calendar...`);
                await syncTasksToCalendar([{
                    id: task.id,
                    title: task.title,
                    scheduledDate: task.scheduledDate,
                    scheduledTime: task.scheduledTime,
                    responsible: task.responsible || [],
                    area: task.area,
                    status: task.status,
                    notes: task.notes,
                }], accessToken);
                console.log(`[PUT /api/tasks] Sincronización a Calendar exitosa`);
            } catch (calendarError) {
                console.error("[PUT /api/tasks] Error sincronizando a Calendar:", calendarError);
            }
        } else if (!task.scheduledDate && accessToken) {
            // Si la tarea ya no tiene fecha programada, sincronizar todas las tareas restantes
            service.getTasks(spreadsheetId).then(allTasks => {
                const scheduledTasks = allTasks
                    .filter(t => t.isScheduled && t.scheduledDate)
                    .map(t => ({
                        id: t.id,
                        title: t.title,
                        scheduledDate: t.scheduledDate!,
                        scheduledTime: t.scheduledTime,
                        responsible: t.responsible,
                        area: t.area,
                        status: t.status,
                        notes: t.notes,
                    }));
                return syncTasksToCalendar(scheduledTasks, accessToken);
            }).catch((calendarError) => {
                console.error("Error sincronizando eliminación de Calendar (no crítico):", calendarError);
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating task:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ 
            error: "Failed to update task",
            details: errorMessage
        }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const taskId = searchParams.get('id');

        if (!taskId) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
        }

        console.log(`[DELETE] Attempting to delete task: ${taskId}`);

        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();

        console.log(`[DELETE] Spreadsheet ID: ${spreadsheetId}`);

        // Si es una tarea que vino de Calendar (id generado) puede no existir en Sheets.
        const isCalendarOnlyTask = taskId.startsWith('cal-');
        if (!isCalendarOnlyTask) {
            try {
                await service.deleteTask(spreadsheetId, taskId);
            } catch (error) {
                console.warn(`[DELETE] No se pudo borrar en Sheets (continuando para limpiar Calendar):`, error);
            }
        } else {
            console.log(`[DELETE] Tarea ${taskId} viene de Calendar, omitimos borrado en Sheets`);
        }

        // Eliminar también de Google Calendar si existía (en background)
        const accessToken = session.accessToken;
        if (accessToken) {
            service.getTasks(spreadsheetId).then(allTasks => {
                const scheduledTasks = allTasks
                    .filter(t => t.isScheduled && t.scheduledDate)
                    .map(t => ({
                        id: t.id,
                        title: t.title,
                        scheduledDate: t.scheduledDate!,
                        scheduledTime: t.scheduledTime,
                        responsible: t.responsible,
                        area: t.area,
                        status: t.status,
                        notes: t.notes,
                    }));
                return syncTasksToCalendar(scheduledTasks, accessToken);
            }).catch((calendarError) => {
                console.error("Error eliminando de Calendar (no crítico):", calendarError);
            });
        }

        console.log(`[DELETE] Task ${taskId} deleted successfully`);

        return NextResponse.json({ success: true, deleted: taskId });
    } catch (error) {
        console.error("[DELETE] Error deleting task:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: "Failed to delete task", details: errorMessage }, { status: 500 });
    }
}

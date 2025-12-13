import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";
import { authOptions } from "@/lib/auth-config";
import { syncTasksToCalendar, syncCalendarToTasks, CalendarTaskPayload } from "@/lib/google/calendar";
import { Task } from "@/lib/types";

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
        } catch (calendarError) {
            console.warn("Error leyendo Calendar (continuando con Sheets):", calendarError);
            // Continuar solo con Sheets si Calendar falla
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
                month: 'Ene' as Task['month'],
                week: 'Week 1',
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

        // Si la tarea tiene fecha programada, sincronizar automáticamente a Google Calendar
        // Hacerlo en segundo plano para no bloquear la respuesta
        const accessToken = session.accessToken;
        if (task.scheduledDate && accessToken) {
            // No esperar la sincronización con Calendar, hacerlo en background
            syncTasksToCalendar([{
                id: task.id,
                title: task.title,
                scheduledDate: task.scheduledDate,
                scheduledTime: task.scheduledTime,
                responsible: task.responsible || [],
                area: task.area,
                status: task.status,
                notes: task.notes,
            }], accessToken).catch((calendarError) => {
                console.error("Error sincronizando a Calendar (no crítico):", calendarError);
            });
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

        // Sincronizar con Calendar en background (no bloquear la respuesta)
        const accessToken = session.accessToken; // Guardar para usar en callbacks
        if (task.scheduledDate && accessToken) {
            syncTasksToCalendar([{
                id: task.id,
                title: task.title,
                scheduledDate: task.scheduledDate,
                scheduledTime: task.scheduledTime,
                responsible: task.responsible || [],
                area: task.area,
                status: task.status,
                notes: task.notes,
            }], accessToken).catch((calendarError) => {
                console.error("Error sincronizando a Calendar (no crítico):", calendarError);
            });
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

        await service.deleteTask(spreadsheetId, taskId);

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

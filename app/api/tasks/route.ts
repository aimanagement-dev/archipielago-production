import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";
import { authOptions } from "@/lib/auth-config";
import { syncTasksToCalendar, CalendarTaskPayload } from "@/lib/google/calendar";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();
        const tasks = await service.getTasks(spreadsheetId);

        return NextResponse.json({ tasks });
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
        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();
        await service.addTask(spreadsheetId, task);

        // Si la tarea tiene fecha programada, sincronizar automáticamente a Google Calendar
        if (task.scheduledDate) {
            try {
                const calendarPayload: CalendarTaskPayload = {
                    id: task.id,
                    title: task.title,
                    scheduledDate: task.scheduledDate,
                    scheduledTime: task.scheduledTime,
                    responsible: task.responsible,
                    area: task.area,
                    status: task.status,
                    notes: task.notes,
                };
                await syncTasksToCalendar([calendarPayload], session.accessToken);
            } catch (calendarError) {
                console.error("Error sincronizando a Calendar:", calendarError);
                // No fallar la creación de la tarea si falla la sincronización con Calendar
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
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
        await service.updateTask(spreadsheetId, task);

        // Si la tarea tiene fecha programada, sincronizar automáticamente a Google Calendar
        if (task.scheduledDate) {
            try {
                const calendarPayload: CalendarTaskPayload = {
                    id: task.id,
                    title: task.title,
                    scheduledDate: task.scheduledDate,
                    scheduledTime: task.scheduledTime,
                    responsible: task.responsible,
                    area: task.area,
                    status: task.status,
                    notes: task.notes,
                };
                await syncTasksToCalendar([calendarPayload], session.accessToken);
            } catch (calendarError) {
                console.error("Error sincronizando a Calendar:", calendarError);
                // No fallar la actualización de la tarea si falla la sincronización con Calendar
            }
        } else {
            // Si la tarea ya no tiene fecha programada, eliminar de Calendar si existía
            try {
                // Obtener todas las tareas programadas para sincronizar
                const allTasks = await service.getTasks(spreadsheetId);
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
                await syncTasksToCalendar(scheduledTasks, session.accessToken);
            } catch (calendarError) {
                console.error("Error sincronizando eliminación de Calendar:", calendarError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
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

        // Eliminar también de Google Calendar si existía
        try {
            // Obtener todas las tareas programadas restantes para sincronizar
            const allTasks = await service.getTasks(spreadsheetId);
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
            await syncTasksToCalendar(scheduledTasks, session.accessToken);
        } catch (calendarError) {
            console.error("Error eliminando de Calendar:", calendarError);
            // No fallar la eliminación de la tarea si falla la sincronización con Calendar
        }

        console.log(`[DELETE] Task ${taskId} deleted successfully`);

        return NextResponse.json({ success: true, deleted: taskId });
    } catch (error) {
        console.error("[DELETE] Error deleting task:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: "Failed to delete task", details: errorMessage }, { status: 500 });
    }
}

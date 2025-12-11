import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";
import { authOptions } from "@/lib/auth-config";
import { notifyTaskAssignment, notifyTaskStatusChange } from "@/lib/notifications/helpers";

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

        // Send notifications to assigned users
        if (session.user?.email && task.responsible?.length > 0) {
            await notifyTaskAssignment(task, session.user.email);
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

        // Get previous task state to compare changes
        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();
        const existingTasks = await service.getTasks(spreadsheetId);
        const previousTask = existingTasks.find((t: any) => t.id === task.id);

        await service.updateTask(spreadsheetId, task);

        // Send notifications if task changed
        if (session.user?.email && previousTask) {
            // Notify if responsible users changed
            if (JSON.stringify(previousTask.responsible) !== JSON.stringify(task.responsible)) {
                await notifyTaskAssignment(task, session.user.email, previousTask.responsible);
            }

            // Notify if status changed
            if (previousTask.status !== task.status) {
                await notifyTaskStatusChange(task, previousTask.status, session.user.email);
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

        console.log(`[DELETE] Task ${taskId} deleted successfully`);

        return NextResponse.json({ success: true, deleted: taskId });
    } catch (error) {
        console.error("[DELETE] Error deleting task:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: "Failed to delete task", details: errorMessage }, { status: 500 });
    }
}

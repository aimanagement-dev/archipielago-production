import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";
import { authOptions } from "@/lib/auth-config";

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

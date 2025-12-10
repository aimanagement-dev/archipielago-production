import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";
import { authOptions } from "@/lib/auth-config";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    if (!session.accessToken) {
        return NextResponse.json({
            error: "No access token in session",
            session: {
                user: session.user,
                hasAccessToken: false
            }
        }, { status: 401 });
    }

    try {
        const service = new GoogleSheetsService(session.accessToken);

        // Step 1: Try to get or create database
        const spreadsheetId = await service.getOrCreateDatabase();

        // Step 2: Try to get tasks
        const tasks = await service.getTasks(spreadsheetId);

        return NextResponse.json({
            success: true,
            spreadsheetId,
            tasksCount: tasks.length,
            tasks: tasks.slice(0, 5), // First 5 tasks
            accessTokenLength: session.accessToken.length,
        });
    } catch (error) {
        console.error("Test error:", error);
        return NextResponse.json({
            error: "Failed",
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        }, { status: 500 });
    }
}

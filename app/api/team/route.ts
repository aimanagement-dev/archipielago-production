import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/google-sheets";
import { authOptions } from "@/lib/auth-config";
import { TeamMember } from "@/lib/types";
import { isUserAdmin } from "@/lib/constants";

// Seed data from database as fallback or initial population
import initialTeamData from "@/data/team.json";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();

        // Ensure "Team" sheet exists and get members
        // If empty, we could populate it with initialTeamData? 
        // For now, let's just fetch. logic to auto-seed can happen inside the service or here.
        let teamMembers = await service.getTeam(spreadsheetId);

        // Auto-seed if empty and we have initial data
        if (teamMembers.length === 0 && initialTeamData.length > 0) {
            console.log("[GET /api/team] Hoja de equipo vacía. Sembrando datos iniciales...");
            for (const member of initialTeamData) {
                // Ensure ID
                const memberToSave: TeamMember = {
                    ...member as TeamMember, // Cast to compatible type
                    department: member.department || 'Otro', // Ensure required fields
                    position: member.position || 'Otro'
                };
                await service.addMember(spreadsheetId, memberToSave);
            }
            // Re-fetch after seeding
            teamMembers = await service.getTeam(spreadsheetId);
        }

        return NextResponse.json({ team: teamMembers });
    } catch (error) {
        console.error("Error fetching team:", error);
        return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user?.email || '';
    const isAdmin = isUserAdmin(userEmail);
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const member = await req.json();

        // Basic validation
        if (!member.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();

        // Generate ID if missing
        if (!member.id) member.id = crypto.randomUUID();

        // Ensure default fields
        const memberToSave: TeamMember = {
            id: member.id,
            name: member.name,
            role: member.role || member.position || 'Miembro',
            status: member.status || 'Activo',
            type: member.type || 'Full-time',
            department: member.department || 'Otro',
            position: member.position || 'Otro',
            email: member.email || '',
            phone: member.phone || '',
            notes: member.notes || '',
            // ... copy other fields
            dailyRate: member.dailyRate,
            currency: member.currency,
            union: member.union,
            socials: member.socials || {},
            // Access Flag (default false unless admin overrides, but UI should handle payload)
            // We need to define if 'accessGranted' is part of the payload
            // For now, TeamMember type doesn't have it formally yet in frontend, 
            // but we can save it to sheet as dynamic prop.
        };

        await service.addMember(spreadsheetId, memberToSave);
        console.log(`[POST /api/team] Miembro ${member.name} guardado en Sheets`);

        return NextResponse.json({ success: true, member: memberToSave });
    } catch (error) {
        console.error("Error creating member:", error);
        return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user?.email || '';
    const isAdmin = isUserAdmin(userEmail);
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const member = await req.json();
        if (!member.id) {
            return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
        }

        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();

        await service.updateMember(spreadsheetId, member);
        console.log(`[PUT /api/team] Miembro ${member.name} actualizado en Sheets`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating member:", error);
        return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user?.email || '';
    const isAdmin = isUserAdmin(userEmail);
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
        }

        const service = new GoogleSheetsService(session.accessToken);
        const spreadsheetId = await service.getOrCreateDatabase();

        await service.deleteMember(spreadsheetId, id);
        console.log(`[DELETE /api/team] Miembro ${id} eliminado de Sheets`);

        return NextResponse.json({ success: true, deleted: id });
    } catch (error) {
        console.error("Error deleting member:", error);
        return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
    }
}

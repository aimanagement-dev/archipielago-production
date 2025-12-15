import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { NextResponse } from "next/server";

export async function getSession() {
    return await getServerSession(authOptions);
}

export async function checkAuth() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }
    return null; // Auth successful
}

export async function checkAdmin() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const admins = (process.env.ADMIN_EMAILS ||
        process.env.ALLOWED_LOGIN_EMAILS ||
        'ai.management@archipielagofilm.com,ia.lantica@lanticastudios.com')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

    const userEmail = session.user?.email?.toLowerCase();

    if (!userEmail || !admins.includes(userEmail)) {
        return NextResponse.json(
            { error: "Forbidden" },
            { status: 403 }
        );
    }

    return null; // Admin check successful
}

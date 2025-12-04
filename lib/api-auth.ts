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

    // In the future, check for specific admin roles or emails here.
    // Currently, based on lib/auth.ts, all authenticated users are treated as admins.
    // const userEmail = session.user?.email;
    // if (!userEmail || !['ai.management@archipielagofilm.com'].includes(userEmail)) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    return null; // Admin check successful
}

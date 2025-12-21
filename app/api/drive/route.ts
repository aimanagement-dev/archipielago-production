
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleDriveService } from '@/lib/google-drive';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Extract access token from session exists? 
    // Usually session.accessToken if we configured callback correctly. 
    // Let's assume session includes accessToken.
    const accessToken = (session as any).accessToken;
    if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId') || 'root';
    const action = searchParams.get('action'); // 'list' | 'root_id'

    const drive = new GoogleDriveService(accessToken);

    try {
        if (action === 'root_id') {
            const rootId = await drive.ensureRootFolder();
            return NextResponse.json({ rootId });
        }

        // Default: List files
        // If folderId is 'root', getting the ACTUAL root of "Archipielago_Assets"
        // NOT the User's Root.
        let targetId = folderId;
        if (folderId === 'root') {
            targetId = await drive.ensureRootFolder();
        }

        const files = await drive.listFiles(targetId);
        return NextResponse.json({ files, parentId: targetId });

    } catch (error: any) {
        console.error('Drive API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const accessToken = (session as any).accessToken;

    const drive = new GoogleDriveService(accessToken);

    try {
        const formData = await req.formData();
        const type = formData.get('type'); // 'upload' | 'create_folder'

        if (type === 'create_folder') {
            const name = formData.get('name') as string;
            const parentId = formData.get('parentId') as string;
            const folder = await drive.createFolder(name, parentId);
            return NextResponse.json({ success: true, folder });
        }

        if (type === 'upload') {
            const file = formData.get('file') as File;
            const parentId = formData.get('parentId') as string;

            if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

            const buffer = Buffer.from(await file.arrayBuffer());
            const uploaded = await drive.uploadFile(buffer, file.name, file.type, parentId);

            return NextResponse.json({ success: true, file: uploaded });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (error: any) {
        console.error('Drive Upload Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

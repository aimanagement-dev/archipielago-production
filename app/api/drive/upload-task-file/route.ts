import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleDriveService } from '@/lib/google-drive';
import { TASKS_ATTACHMENTS_FOLDER_NAME, isUserAdmin } from '@/lib/constants';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const accessToken = (session as any).accessToken;
    if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 401 });

    const userEmail = session.user?.email || '';
    const isAdmin = isUserAdmin(userEmail);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const drive = new GoogleDriveService(accessToken);

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const parentId = formData.get('parentId') as string || 'root';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Asegurar que existe la carpeta de attachments de tasks
        const rootFolderId = parentId === 'root' ? await drive.ensureRootFolder() : parentId;
        const tasksFolderId = await drive.ensureFolder(TASKS_ATTACHMENTS_FOLDER_NAME, rootFolderId);

        // Subir el archivo a la carpeta de attachments
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await drive.uploadFile(buffer, file.name, file.type, tasksFolderId);

        return NextResponse.json({ 
            success: true, 
            file: {
                id: uploaded.id,
                name: uploaded.name,
                webViewLink: uploaded.webViewLink,
                webContentLink: uploaded.webContentLink,
                mimeType: uploaded.mimeType,
                thumbnailLink: uploaded.thumbnailLink
            }
        });
    } catch (error: any) {
        console.error('[upload-task-file] Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Error al subir archivo' 
        }, { status: 500 });
    }
}

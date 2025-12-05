import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleDriveService } from '@/lib/google/drive';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor, inicia sesión.' },
        { status: 401 }
      );
    }

    const driveService = new GoogleDriveService(session.accessToken);
    const { searchParams } = new URL(request.url);

    const action = searchParams.get('action') || 'list';
    const folderId = searchParams.get('folderId') || undefined;
    const query = searchParams.get('query') || undefined;
    const pageToken = searchParams.get('pageToken') || undefined;
    const fileId = searchParams.get('fileId') || undefined;

    switch (action) {
      case 'list': {
        const result = await driveService.listFiles(folderId, { pageToken, query });
        return NextResponse.json(result);
      }

      case 'search': {
        if (!query) {
          return NextResponse.json(
            { error: 'Se requiere el parámetro "query" para buscar' },
            { status: 400 }
          );
        }
        const files = await driveService.searchFiles(query);
        return NextResponse.json({ files });
      }

      case 'get': {
        if (!fileId) {
          return NextResponse.json(
            { error: 'Se requiere el parámetro "fileId"' },
            { status: 400 }
          );
        }
        const file = await driveService.getFile(fileId);
        if (!file) {
          return NextResponse.json(
            { error: 'Archivo no encontrado' },
            { status: 404 }
          );
        }
        return NextResponse.json({ file });
      }

      case 'recent': {
        const files = await driveService.getRecentFiles();
        return NextResponse.json({ files });
      }

      case 'shared': {
        const files = await driveService.getSharedWithMe();
        return NextResponse.json({ files });
      }

      case 'project-folder': {
        const folder = await driveService.getOrCreateProjectFolder();
        return NextResponse.json({ folder });
      }

      default:
        return NextResponse.json(
          { error: `Acción desconocida: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en API de Drive:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor, inicia sesión.' },
        { status: 401 }
      );
    }

    const driveService = new GoogleDriveService(session.accessToken);
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'createFolder': {
        const { name, parentId } = body;
        if (!name) {
          return NextResponse.json(
            { error: 'Se requiere el nombre de la carpeta' },
            { status: 400 }
          );
        }
        const folder = await driveService.createFolder({ name, parentId });
        return NextResponse.json({ folder });
      }

      case 'rename': {
        const { fileId, newName } = body;
        if (!fileId || !newName) {
          return NextResponse.json(
            { error: 'Se requieren fileId y newName' },
            { status: 400 }
          );
        }
        const file = await driveService.renameFile(fileId, newName);
        if (!file) {
          return NextResponse.json(
            { error: 'No se pudo renombrar el archivo' },
            { status: 500 }
          );
        }
        return NextResponse.json({ file });
      }

      case 'move': {
        const { fileId, newParentId } = body;
        if (!fileId || !newParentId) {
          return NextResponse.json(
            { error: 'Se requieren fileId y newParentId' },
            { status: 400 }
          );
        }
        const file = await driveService.moveFile(fileId, newParentId);
        if (!file) {
          return NextResponse.json(
            { error: 'No se pudo mover el archivo' },
            { status: 500 }
          );
        }
        return NextResponse.json({ file });
      }

      case 'delete': {
        const { fileId } = body;
        if (!fileId) {
          return NextResponse.json(
            { error: 'Se requiere fileId' },
            { status: 400 }
          );
        }
        const success = await driveService.deleteFile(fileId);
        if (!success) {
          return NextResponse.json(
            { error: 'No se pudo eliminar el archivo' },
            { status: 500 }
          );
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Acción desconocida: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en API de Drive:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

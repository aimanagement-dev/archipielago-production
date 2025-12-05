import { google, drive_v3 } from 'googleapis';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
  shared?: boolean;
  owners?: { displayName: string; emailAddress: string }[];
}

export interface DriveFolder {
  id: string;
  name: string;
  path: string[];
}

export interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
  currentFolder?: DriveFolder;
}

export interface CreateFolderOptions {
  name: string;
  parentId?: string;
}

export interface UploadFileOptions {
  name: string;
  mimeType: string;
  content: Buffer | string;
  parentId?: string;
}

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export class GoogleDriveService {
  private auth;
  private drive: drive_v3.Drive;

  constructor(accessToken: string) {
    this.auth = new google.auth.OAuth2();
    this.auth.setCredentials({ access_token: accessToken });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  /**
   * Lista archivos en una carpeta específica o en la raíz
   */
  async listFiles(
    folderId?: string,
    options?: { pageSize?: number; pageToken?: string; query?: string }
  ): Promise<DriveListResponse> {
    const { pageSize = 50, pageToken, query } = options || {};

    let q = 'trashed = false';

    if (folderId) {
      q += ` and '${folderId}' in parents`;
    } else {
      q += " and 'root' in parents";
    }

    if (query) {
      q += ` and name contains '${query}'`;
    }

    const response = await this.drive.files.list({
      q,
      pageSize,
      pageToken,
      fields: 'nextPageToken, files(id, name, mimeType, iconLink, thumbnailLink, webViewLink, webContentLink, createdTime, modifiedTime, size, parents, shared, owners)',
      orderBy: 'folder, name',
    });

    const files: DriveFile[] = (response.data.files || []).map((file) => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      iconLink: file.iconLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || undefined,
      createdTime: file.createdTime || undefined,
      modifiedTime: file.modifiedTime || undefined,
      size: file.size || undefined,
      parents: file.parents || undefined,
      shared: file.shared || false,
      owners: file.owners?.map((o) => ({
        displayName: o.displayName || '',
        emailAddress: o.emailAddress || '',
      })),
    }));

    let currentFolder: DriveFolder | undefined;
    if (folderId) {
      const folderInfo = await this.getFile(folderId);
      const path = await this.getFolderPath(folderId);
      currentFolder = {
        id: folderId,
        name: folderInfo?.name || 'Carpeta',
        path,
      };
    }

    return {
      files,
      nextPageToken: response.data.nextPageToken || undefined,
      currentFolder,
    };
  }

  /**
   * Busca archivos en todo Drive
   */
  async searchFiles(query: string, pageSize = 20): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      q: `name contains '${query}' and trashed = false`,
      pageSize,
      fields: 'files(id, name, mimeType, iconLink, thumbnailLink, webViewLink, webContentLink, modifiedTime, size, parents)',
      orderBy: 'modifiedTime desc',
    });

    return (response.data.files || []).map((file) => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      iconLink: file.iconLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || undefined,
      modifiedTime: file.modifiedTime || undefined,
      size: file.size || undefined,
      parents: file.parents || undefined,
    }));
  }

  /**
   * Obtiene información de un archivo específico
   */
  async getFile(fileId: string): Promise<DriveFile | null> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, iconLink, thumbnailLink, webViewLink, webContentLink, createdTime, modifiedTime, size, parents, shared, owners',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        iconLink: response.data.iconLink || undefined,
        thumbnailLink: response.data.thumbnailLink || undefined,
        webViewLink: response.data.webViewLink || undefined,
        webContentLink: response.data.webContentLink || undefined,
        createdTime: response.data.createdTime || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
        size: response.data.size || undefined,
        parents: response.data.parents || undefined,
        shared: response.data.shared || false,
        owners: response.data.owners?.map((o) => ({
          displayName: o.displayName || '',
          emailAddress: o.emailAddress || '',
        })),
      };
    } catch {
      return null;
    }
  }

  /**
   * Obtiene el path completo de una carpeta
   */
  async getFolderPath(folderId: string): Promise<string[]> {
    const path: string[] = [];
    let currentId: string | undefined = folderId;

    while (currentId) {
      const file = await this.getFile(currentId);
      if (!file) break;

      path.unshift(file.name);

      if (file.parents && file.parents.length > 0) {
        currentId = file.parents[0];
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * Crea una nueva carpeta
   */
  async createFolder(options: CreateFolderOptions): Promise<DriveFile> {
    const { name, parentId } = options;

    const fileMetadata: drive_v3.Schema$File = {
      name,
      mimeType: FOLDER_MIME_TYPE,
    };

    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, mimeType, webViewLink, createdTime',
    });

    return {
      id: response.data.id!,
      name: response.data.name!,
      mimeType: response.data.mimeType!,
      webViewLink: response.data.webViewLink || undefined,
      createdTime: response.data.createdTime || undefined,
    };
  }

  /**
   * Sube un archivo a Drive
   */
  async uploadFile(options: UploadFileOptions): Promise<DriveFile> {
    const { name, mimeType, content, parentId } = options;

    const fileMetadata: drive_v3.Schema$File = { name };
    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const media = {
      mimeType,
      body: typeof content === 'string' ? Buffer.from(content) : content,
    };

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, mimeType, webViewLink, webContentLink, size, createdTime',
    });

    return {
      id: response.data.id!,
      name: response.data.name!,
      mimeType: response.data.mimeType!,
      webViewLink: response.data.webViewLink || undefined,
      webContentLink: response.data.webContentLink || undefined,
      size: response.data.size || undefined,
      createdTime: response.data.createdTime || undefined,
    };
  }

  /**
   * Elimina un archivo (lo mueve a la papelera)
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await this.drive.files.update({
        fileId,
        requestBody: { trashed: true },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Renombra un archivo
   */
  async renameFile(fileId: string, newName: string): Promise<DriveFile | null> {
    try {
      const response = await this.drive.files.update({
        fileId,
        requestBody: { name: newName },
        fields: 'id, name, mimeType, webViewLink, modifiedTime',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        webViewLink: response.data.webViewLink || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Mueve un archivo a otra carpeta
   */
  async moveFile(fileId: string, newParentId: string): Promise<DriveFile | null> {
    try {
      const file = await this.getFile(fileId);
      const previousParents = file?.parents?.join(',') || '';

      const response = await this.drive.files.update({
        fileId,
        addParents: newParentId,
        removeParents: previousParents,
        fields: 'id, name, mimeType, parents, webViewLink',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        parents: response.data.parents || undefined,
        webViewLink: response.data.webViewLink || undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Obtiene o crea la carpeta del proyecto Archipielago
   */
  async getOrCreateProjectFolder(): Promise<DriveFile> {
    const folderName = 'Archipielago_Project';

    const search = await this.drive.files.list({
      q: `name = '${folderName}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink)',
    });

    if (search.data.files && search.data.files.length > 0) {
      const folder = search.data.files[0];
      return {
        id: folder.id!,
        name: folder.name!,
        mimeType: folder.mimeType!,
        webViewLink: folder.webViewLink || undefined,
      };
    }

    return this.createFolder({ name: folderName });
  }

  /**
   * Verifica si un archivo es una carpeta
   */
  isFolder(file: DriveFile): boolean {
    return file.mimeType === FOLDER_MIME_TYPE;
  }

  /**
   * Obtiene archivos recientes
   */
  async getRecentFiles(limit = 10): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      q: 'trashed = false',
      pageSize: limit,
      fields: 'files(id, name, mimeType, iconLink, thumbnailLink, webViewLink, modifiedTime, size)',
      orderBy: 'viewedByMeTime desc',
    });

    return (response.data.files || []).map((file) => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      iconLink: file.iconLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
      webViewLink: file.webViewLink || undefined,
      modifiedTime: file.modifiedTime || undefined,
      size: file.size || undefined,
    }));
  }

  /**
   * Obtiene archivos compartidos conmigo
   */
  async getSharedWithMe(limit = 20): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      q: 'sharedWithMe = true and trashed = false',
      pageSize: limit,
      fields: 'files(id, name, mimeType, iconLink, thumbnailLink, webViewLink, modifiedTime, size, owners)',
      orderBy: 'modifiedTime desc',
    });

    return (response.data.files || []).map((file) => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      iconLink: file.iconLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
      webViewLink: file.webViewLink || undefined,
      modifiedTime: file.modifiedTime || undefined,
      size: file.size || undefined,
      owners: file.owners?.map((o) => ({
        displayName: o.displayName || '',
        emailAddress: o.emailAddress || '',
      })),
    }));
  }
}

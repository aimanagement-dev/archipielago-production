
import { google } from 'googleapis';
import { Readable } from 'stream';

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    thumbnailLink?: string;
    parents?: string[];
}

export class GoogleDriveService {
    private drive;

    constructor(accessToken: string) {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        this.drive = google.drive({ version: 'v3', auth });
    }

    /**
     * Ensures the root folder "Archipielago_Assets" exists.
     */
    async ensureRootFolder(): Promise<string> {
        const query = "name = 'Archipielago_Assets' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        const res = await this.drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id!;
        }

        // Create if not found
        const fileMetadata = {
            name: 'Archipielago_Assets',
            mimeType: 'application/vnd.google-apps.folder',
        };
        const file = await this.drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
            supportsAllDrives: true
        });

        return file.data.id!;
    }

    /**
     * List files in a specific folder.
     */
    async listFiles(folderId: string): Promise<DriveFile[]> {
        // First verify folder exists, if not, fallback to root? No, let it error.

        const query = `'${folderId}' in parents and trashed = false`;
        const res = await this.drive.files.list({
            q: query,
            fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, parents)',
            orderBy: 'folder, name',
            pageSize: 100,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        return (res.data.files as DriveFile[]) || [];
    }

    /**
     * Create a new folder inside a parent folder.
     */
    async createFolder(name: string, parentId?: string): Promise<DriveFile> {
        const pId = parentId || await this.ensureRootFolder();

        const fileMetadata = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [pId]
        };

        const file = await this.drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, name, mimeType, webViewLink',
            supportsAllDrives: true
        });

        return file.data as DriveFile;
    }

    /**
     * Upload a file to a specific folder.
     * @param fileBuffer Buffer of the file
     * @param name Filename
     * @param mimeType MIME type (e.g., application/pdf)
     * @param parentId ID of the parent folder
     */
    async uploadFile(fileBuffer: Buffer, name: string, mimeType: string, parentId?: string): Promise<DriveFile> {
        const pId = parentId || await this.ensureRootFolder();

        const fileMetadata = {
            name,
            parents: [pId]
        };

        const media = {
            mimeType,
            body: Readable.from(fileBuffer),
        };

        const file = await this.drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, mimeType, webViewLink, thumbnailLink',
            supportsAllDrives: true
        });

        return file.data as DriveFile;
    }

    /**
     * Searches for a subfolder by name inside a parent.
     */
    async findFolder(name: string, parentId: string): Promise<string | null> {
        const query = `name = '${name}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const res = await this.drive.files.list({
            q: query,
            fields: 'files(id)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id!;
        }
        return null;
    }

    /**
     * Ensures a specific subfolder exists inside a parent.
     */
    async ensureFolder(name: string, parentId: string): Promise<string> {
        const existingId = await this.findFolder(name, parentId);
        if (existingId) return existingId;

        const newFolder = await this.createFolder(name, parentId);
        return newFolder.id;
    }
}

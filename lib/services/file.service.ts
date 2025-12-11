import { google } from 'googleapis';
import { supabase } from '../supabase';
import type { FileAttachment } from '../types';

export class FileService {
  // Get OAuth2 client from session
  private static async getAuth(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
  }

  // Upload file to Google Drive
  static async uploadToDrive(
    file: File,
    accessToken: string,
    folderName = 'Archipielago Production'
  ): Promise<{ fileId: string; webViewLink: string; thumbnailLink?: string }> {
    const auth = await this.getAuth(accessToken);
    const drive = google.drive({ version: 'v3', auth });

    // Create or get the folder
    const folderId = await this.getOrCreateFolder(drive, folderName);

    // Convert File to buffer
    const buffer = await file.arrayBuffer();
    const fileMetadata = {
      name: file.name,
      parents: [folderId],
    };

    const media = {
      mimeType: file.type,
      body: Buffer.from(buffer),
    };

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, thumbnailLink',
    });

    return {
      fileId: response.data.id!,
      webViewLink: response.data.webViewLink!,
      thumbnailLink: response.data.thumbnailLink,
    };
  }

  // Get or create a folder in Drive
  private static async getOrCreateFolder(drive: any, folderName: string): Promise<string> {
    // Check if folder exists
    const folderSearch = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      return folderSearch.data.files[0].id;
    }

    // Create folder if it doesn't exist
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });

    return folder.data.id;
  }

  // Save file attachment metadata to Supabase
  static async saveFileMetadata(
    driveFileId: string,
    name: string,
    mimeType: string,
    sizeBytes: number,
    driveUrl: string,
    uploadedBy: string,
    relatedType: 'task' | 'gate' | 'message',
    relatedId: string,
    thumbnailUrl?: string
  ): Promise<FileAttachment> {
    const { data, error } = await supabase
      .from('file_attachments')
      .insert({
        drive_file_id: driveFileId,
        name,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        drive_url: driveUrl,
        thumbnail_url: thumbnailUrl,
        uploaded_by: uploadedBy,
        related_type: relatedType,
        related_id: relatedId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FileAttachment;
  }

  // Get file attachments for a resource
  static async getAttachments(
    relatedType: 'task' | 'gate' | 'message',
    relatedId: string
  ): Promise<FileAttachment[]> {
    const { data, error } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('related_type', relatedType)
      .eq('related_id', relatedId)
      .eq('is_deleted', false)
      .order('uploaded_at', { ascending: true });

    if (error) throw error;
    return (data as FileAttachment[]) || [];
  }

  // Delete file attachment (soft delete)
  static async deleteAttachment(attachmentId: string): Promise<void> {
    const { error } = await supabase
      .from('file_attachments')
      .update({ is_deleted: true })
      .eq('id', attachmentId);

    if (error) throw error;
  }

  // Combined: Upload to Drive + Save metadata
  static async uploadAndSaveFile(
    file: File,
    accessToken: string,
    uploadedBy: string,
    relatedType: 'task' | 'gate' | 'message',
    relatedId: string
  ): Promise<FileAttachment> {
    // Upload to Google Drive
    const { fileId, webViewLink, thumbnailLink } = await this.uploadToDrive(
      file,
      accessToken
    );

    // Save metadata to Supabase
    const attachment = await this.saveFileMetadata(
      fileId,
      file.name,
      file.type,
      file.size,
      webViewLink,
      uploadedBy,
      relatedType,
      relatedId,
      thumbnailLink
    );

    return attachment;
  }
}

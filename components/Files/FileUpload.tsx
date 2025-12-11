'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, X, FileIcon, Download, Trash2 } from 'lucide-react';
import type { FileAttachment } from '@/lib/types';

interface FileUploadProps {
  relatedType: 'task' | 'gate' | 'message';
  relatedId: string;
  attachments?: FileAttachment[];
  onUploadComplete?: (attachment: FileAttachment) => void;
  onDelete?: (attachmentId: string) => void;
}

export default function FileUpload({
  relatedType,
  relatedId,
  attachments = [],
  onUploadComplete,
  onDelete,
}: FileUploadProps) {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (file: File) => {
    if (!session?.accessToken) {
      alert('No se pudo obtener el token de acceso. Por favor, vuelve a iniciar sesión.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('relatedType', relatedType);
      formData.append('relatedId', relatedId);
      formData.append('accessToken', session.accessToken);

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const data = await response.json();
      onUploadComplete?.(data.attachment);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo. Por favor, intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) return;

    try {
      const response = await fetch(`/api/files?attachmentId=${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el archivo');
      }

      onDelete?.(attachmentId);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error al eliminar el archivo.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-white/20 hover:border-white/40'
        }`}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="text-center">
          <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
          <p className="text-sm text-white/60">
            {uploading ? (
              'Subiendo archivo...'
            ) : (
              <>
                <span className="text-white/80 font-medium">Haz clic para subir</span> o
                arrastra un archivo aquí
              </>
            )}
          </p>
        </div>
      </div>

      {/* File List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white/60">Archivos adjuntos</h4>
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-white/40">
                    {formatFileSize(file.size_bytes)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={file.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Abrir en Drive"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

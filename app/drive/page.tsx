'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { DriveFile, DriveFolder } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Folder,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  Presentation,
  Search,
  ChevronRight,
  Home,
  RefreshCw,
  MoreVertical,
  Trash2,
  Edit3,
  ExternalLink,
  FolderPlus,
  Clock,
  Users,
  HardDrive,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'my-drive' | 'recent' | 'shared';

interface DriveState {
  files: DriveFile[];
  currentFolder?: DriveFolder;
  nextPageToken?: string;
  loading: boolean;
  error: string | null;
}

const MIME_TYPE_ICONS: Record<string, typeof File> = {
  'application/vnd.google-apps.folder': Folder,
  'application/vnd.google-apps.document': FileText,
  'application/vnd.google-apps.spreadsheet': FileSpreadsheet,
  'application/vnd.google-apps.presentation': Presentation,
  'application/pdf': FileText,
  'image/': FileImage,
  'video/': FileVideo,
  'audio/': FileAudio,
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('audio/')) return FileAudio;
  return MIME_TYPE_ICONS[mimeType] || File;
}

function formatFileSize(bytes?: string): string {
  if (!bytes) return '';
  const size = parseInt(bytes, 10);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function DrivePage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('my-drive');
  const [driveState, setDriveState] = useState<DriveState>({
    files: [],
    loading: true,
    error: null,
  });
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ file: DriveFile; x: number; y: number } | null>(null);

  const fetchFiles = useCallback(async (folderId?: string) => {
    setDriveState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams({ action: 'list' });
      if (folderId) params.set('folderId', folderId);

      const response = await fetch(`/api/google/drive?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setDriveState({
        files: data.files,
        currentFolder: data.currentFolder,
        nextPageToken: data.nextPageToken,
        loading: false,
        error: null,
      });
    } catch (error) {
      setDriveState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar archivos',
      }));
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    setDriveState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/google/drive?action=recent');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setDriveState({
        files: data.files,
        loading: false,
        error: null,
      });
    } catch (error) {
      setDriveState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar archivos recientes',
      }));
    }
  }, []);

  const fetchShared = useCallback(async () => {
    setDriveState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/google/drive?action=shared');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setDriveState({
        files: data.files,
        loading: false,
        error: null,
      });
    } catch (error) {
      setDriveState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar archivos compartidos',
      }));
    }
  }, []);

  const searchFiles = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchFiles(folderHistory[folderHistory.length - 1]);
      return;
    }

    setIsSearching(true);
    setDriveState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams({ action: 'search', query });
      const response = await fetch(`/api/google/drive?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setDriveState({
        files: data.files,
        loading: false,
        error: null,
      });
    } catch (error) {
      setDriveState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error en la búsqueda',
      }));
    }
  }, [fetchFiles, folderHistory]);

  useEffect(() => {
    if (viewMode === 'my-drive') {
      fetchFiles(folderHistory[folderHistory.length - 1]);
    } else if (viewMode === 'recent') {
      fetchRecent();
    } else if (viewMode === 'shared') {
      fetchShared();
    }
  }, [viewMode, folderHistory, fetchFiles, fetchRecent, fetchShared]);

  const navigateToFolder = (folderId: string) => {
    setIsSearching(false);
    setSearchQuery('');
    setFolderHistory((prev) => [...prev, folderId]);
  };

  const navigateBack = () => {
    setFolderHistory((prev) => prev.slice(0, -1));
  };

  const navigateToRoot = () => {
    setFolderHistory([]);
    setIsSearching(false);
    setSearchQuery('');
  };

  const handleFileClick = (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      navigateToFolder(file.id);
    } else if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('/api/google/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createFolder',
          name: newFolderName,
          parentId: folderHistory[folderHistory.length - 1],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setShowNewFolderModal(false);
      setNewFolderName('');
      fetchFiles(folderHistory[folderHistory.length - 1]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear carpeta');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('¿Estás seguro de que quieres mover este archivo a la papelera?')) return;

    try {
      const response = await fetch('/api/google/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', fileId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      fetchFiles(folderHistory[folderHistory.length - 1]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar archivo');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: DriveFile) => {
    e.preventDefault();
    setContextMenu({ file, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Google Drive</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los archivos del proyecto
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchFiles(folderHistory[folderHistory.length - 1])}
            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={cn('w-5 h-5', driveState.loading && 'animate-spin')} />
          </button>
          {viewMode === 'my-drive' && (
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FolderPlus className="w-5 h-5" />
              Nueva Carpeta
            </button>
          )}
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => { setViewMode('my-drive'); setFolderHistory([]); }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            viewMode === 'my-drive'
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-white/5'
          )}
        >
          <HardDrive className="w-5 h-5" />
          Mi Drive
        </button>
        <button
          onClick={() => setViewMode('recent')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            viewMode === 'recent'
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-white/5'
          )}
        >
          <Clock className="w-5 h-5" />
          Recientes
        </button>
        <button
          onClick={() => setViewMode('shared')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            viewMode === 'shared'
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-white/5'
          )}
        >
          <Users className="w-5 h-5" />
          Compartidos
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar archivos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchFiles(searchQuery)}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Breadcrumb */}
      {viewMode === 'my-drive' && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={navigateToRoot}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            Mi Drive
          </button>
          {driveState.currentFolder?.path.map((name, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {driveState.error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>{driveState.error}</span>
        </div>
      )}

      {/* Loading State */}
      {driveState.loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Files Grid */}
      {!driveState.loading && !driveState.error && (
        <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden">
          {driveState.files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Folder className="w-16 h-16 mb-4 opacity-50" />
              <p>No hay archivos en esta ubicación</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground bg-white/5">
                <div className="col-span-6">Nombre</div>
                <div className="col-span-2">Propietario</div>
                <div className="col-span-2">Modificado</div>
                <div className="col-span-1">Tamaño</div>
                <div className="col-span-1"></div>
              </div>

              {/* File Rows */}
              {driveState.files.map((file) => {
                const Icon = getFileIcon(file.mimeType);
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

                return (
                  <div
                    key={file.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => handleFileClick(file)}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                  >
                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      <Icon
                        className={cn(
                          'w-5 h-5 flex-shrink-0',
                          isFolder ? 'text-amber-500' : 'text-blue-500'
                        )}
                      />
                      <span className="truncate text-foreground">{file.name}</span>
                      {file.shared && (
                        <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground truncate">
                      {file.owners?.[0]?.displayName || 'Yo'}
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {file.modifiedTime
                        ? format(new Date(file.modifiedTime), 'd MMM yyyy', { locale: es })
                        : '-'}
                    </div>
                    <div className="col-span-1 text-sm text-muted-foreground">
                      {isFolder ? '-' : formatFileSize(file.size)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, file);
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-card border border-white/10 rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.file.webViewLink && (
            <button
              onClick={() => {
                window.open(contextMenu.file.webViewLink, '_blank');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir
            </button>
          )}
          <button
            onClick={() => {
              const newName = prompt('Nuevo nombre:', contextMenu.file.name);
              if (newName && newName !== contextMenu.file.name) {
                fetch('/api/google/drive', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'rename',
                    fileId: contextMenu.file.id,
                    newName,
                  }),
                }).then(() => fetchFiles(folderHistory[folderHistory.length - 1]));
              }
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-white/10 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Renombrar
          </button>
          <button
            onClick={() => {
              handleDelete(contextMenu.file.id);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-white/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">Nueva Carpeta</h2>
            <input
              type="text"
              placeholder="Nombre de la carpeta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

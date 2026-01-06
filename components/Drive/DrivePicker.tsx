'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Folder, FileText, Download, Upload, ArrowLeft, Loader2, Check, ChevronRight, Cloud, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    thumbnailLink?: string;
    parents?: string[];
}

interface DrivePickerProps {
    onSelect: (fileLink: string, fileId: string, fileName: string) => void;
    onCancel: () => void;
    initialFolderId?: string;
    area?: string;
}

export default function DrivePicker({ onSelect, onCancel, initialFolderId = 'root', area, className }: DrivePickerProps & { className?: string }) {
    const [currentFolder, setCurrentFolder] = useState<string>(initialFolderId);
    const [path, setPath] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Home' }]);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [magicJumpOccurred, setMagicJumpOccurred] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch files when folder changes
    useEffect(() => {
        // Prevent double-fetch if we just did a magic jump
        if (magicJumpOccurred) return;
        fetchFiles(currentFolder);
    }, [currentFolder, magicJumpOccurred]);

    const fetchFiles = async (folderId: string) => {
        setLoading(true);
        setError(null);
        try {
            // Include area param only if we are at root/initial load
            const areaParam = (folderId === 'root' && area) ? `&area=${encodeURIComponent(area)}` : '';
            const res = await fetch(`/api/drive?folderId=${folderId}${areaParam}`);

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch files');
            }

            setFiles(data.files || []);

            // Handle Magic Jump (Deep Linking to Area Folder)
            if (folderId === 'root' && data.parentId && data.parentId !== 'root' && area) {
                setCurrentFolder(data.parentId);
                setPath([
                    { id: 'root', name: 'Home' },
                    { id: data.parentId, name: area }
                ]);
                setMagicJumpOccurred(true);
            } else {
                setMagicJumpOccurred(false);
            }

        } catch (error: any) {
            console.error('Drive Fetch Error:', error);
            setError(error.message || 'Error desconocido al cargar Drive');
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (folder: DriveFile) => {
        setPath([...path, { id: folder.id, name: folder.name }]);
        setCurrentFolder(folder.id);
        setMagicJumpOccurred(false);
    };

    const handleNavigateUp = () => {
        if (path.length > 1) {
            const newPath = [...path];
            newPath.pop();
            const prev = newPath[newPath.length - 1];
            setPath(newPath);
            setCurrentFolder(prev.id);
            setMagicJumpOccurred(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('type', 'upload');
        formData.append('file', file);
        formData.append('parentId', currentFolder); // Uses resolved ID

        try {
            const res = await fetch('/api/drive', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                // Force Refresh
                const resJson = await res.json();
                console.log('Upload success', resJson);
                // Manually trigger fetch or just reset state to trigger effect
                fetchFiles(currentFolder);
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error(error);
            alert('Upload error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCreateFolder = async () => {
        const name = prompt('Nombre de la carpeta:');
        if (!name) return;

        const formData = new FormData();
        formData.append('type', 'create_folder');
        formData.append('name', name);
        formData.append('parentId', currentFolder);

        await fetch('/api/drive', { method: 'POST', body: formData });
        fetchFiles(currentFolder);
    };

    return (
        <div className={cn(
            "flex flex-col w-full bg-black/90 rounded-xl overflow-hidden border border-white/10 shadow-2xl",
            className || "h-[500px]"
        )}>
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-white/5">
                {path.length > 1 && (
                    <button onClick={handleNavigateUp} className="p-1 hover:bg-white/10 rounded-full">
                        <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                )}
                <div className="flex items-center gap-1 text-sm text-white/80 overflow-hidden">
                    {path.map((p, idx) => (
                        <div key={p.id} className="flex items-center">
                            {idx > 0 && <ChevronRight className="w-3 h-3 mx-1 text-white/40" />}
                            <span className={cn(
                                "truncate max-w-[100px]",
                                idx === path.length - 1 ? "font-bold text-white" : ""
                            )}>
                                {p.name}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={() => {
                            setCurrentFolder('user_root');
                            setPath([{ id: 'user_root', name: 'My Drive' }]);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                        title="Ir a Mi Unidad"
                    >
                        <Cloud className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleCreateFolder}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                        title="Nueva Carpeta"
                    >
                        <Folder className="w-4 h-4" />
                    </button>
                    <label className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2
                        ${uploading ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'hover:bg-white/10 text-primary hover:text-white'}
                    `}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span className="text-xs font-bold">{uploading ? 'Subiendo...' : 'Subir'}</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 bg-gradient-to-b from-white/5 to-transparent">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400 gap-4 p-4 text-center">
                        <div className="p-3 bg-red-500/10 rounded-full">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="font-bold underline mb-2">Error cargando Drive</p>
                            <p className="text-sm opacity-80 max-w-md">{error}</p>
                        </div>
                        <button
                            onClick={() => fetchFiles(currentFolder)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center h-full text-white/40 flex-col gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-xs">Cargando Drive...</span>
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Cloud className="w-8 h-8 text-white/20" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-white mb-1">Carpeta vacía</p>
                            <p className="text-xs text-white/50 max-w-[200px]">
                                Esta carpeta se creó automáticamente. Sube archivos aquí para adjuntarlos a la tarea.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-1">
                        {files.map(file => {
                            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                            return (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 group cursor-pointer border border-transparent hover:border-white/5 transition-all"
                                    onClick={() => isFolder ? handleNavigate(file) : onSelect(file.webViewLink!, file.id, file.name)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            "w-8 h-8 rounded flex items-center justify-center shadow-sm",
                                            isFolder ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                                        )}>
                                            {isFolder ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                        </div>
                                        <div className="truncate text-white text-sm font-medium">
                                            {file.name}
                                        </div>
                                    </div>

                                    {!isFolder && (
                                        <button className="text-xs px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded group-hover:bg-primary group-hover:text-white transition-colors">
                                            Seleccionar
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Debug Footer (Temporary: v2.0) */}
            <div className="p-2 bg-amber-500/20 text-amber-500 font-mono text-xs flex gap-4 overflow-hidden whitespace-nowrap border-t border-amber-500/30">
                <span className="font-bold">VERSION: v2.0 DEBUG</span>
                <span>| Status: {loading ? 'LOADING' : 'IDLE'}</span>
                <span>| Files: {files.length}</span>
                <span>| Error: {error || 'None'}</span>
                <span>| Folder: {currentFolder}</span>
            </div>
        </div>
    );
}

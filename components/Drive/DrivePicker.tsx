'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Folder, FileText, Download, Upload, ArrowLeft, Loader2, Check, ChevronRight } from 'lucide-react';
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
}

export default function DrivePicker({ onSelect, onCancel, initialFolderId = 'root' }: DrivePickerProps) {
    const [currentFolder, setCurrentFolder] = useState<string>(initialFolderId);
    const [path, setPath] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Home' }]);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch files when folder changes
    useEffect(() => {
        fetchFiles(currentFolder);
    }, [currentFolder]);

    const fetchFiles = async (folderId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/drive?folderId=${folderId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setFiles(data.files);

            // Update root ID if we started with 'root' alias
            if (folderId === 'root' && data.parentId) {
                // Adjust path logic if needed, for now just load content
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (folder: DriveFile) => {
        setPath([...path, { id: folder.id, name: folder.name }]);
        setCurrentFolder(folder.id);
    };

    const handleNavigateUp = () => {
        if (path.length > 1) {
            const newPath = [...path];
            newPath.pop();
            const prev = newPath[newPath.length - 1];
            setPath(newPath);
            setCurrentFolder(prev.id);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('type', 'upload');
        formData.append('file', file);
        formData.append('parentId', currentFolder);

        try {
            const res = await fetch('/api/drive', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                // Refresh
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
        <div className="flex flex-col h-[500px] w-full bg-black/90 rounded-xl overflow-hidden border border-white/10">
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
                        onClick={handleCreateFolder}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                        title="Nueva Carpeta"
                    >
                        <Folder className="w-4 h-4" />
                        <span className="sr-only">Nueva carpeta</span>
                    </button>
                    <label className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-2">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span className="text-xs font-bold">Subir</span>
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
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-white/40">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                        <Folder className="w-12 h-12" />
                        <p className="text-sm">Carpeta vacía</p>
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
                                            "w-8 h-8 rounded flex items-center justify-center",
                                            isFolder ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/60"
                                        )}>
                                            {isFolder ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                        </div>
                                        <div className="truncate text-white text-sm font-medium">
                                            {file.name}
                                        </div>
                                    </div>

                                    {!isFolder && (
                                        <button className="text-xs px-2 py-1 bg-white/5 rounded text-white/60 group-hover:bg-primary group-hover:text-white transition-colors">
                                            Seleccionar
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

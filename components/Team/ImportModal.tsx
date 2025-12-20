'use client';

import { useState } from 'react';
import { Upload, AlertCircle, Check, Users, Loader2, DownloadCloud } from 'lucide-react';
import { parseCrewCSV } from '@/lib/csv-importer';
import { useStore } from '@/lib/store';
import { TeamMember } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ImportTab = 'csv' | 'google';

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
    const [activeTab, setActiveTab] = useState<ImportTab>('csv');
    const [csvContent, setCsvContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [previewCount, setPreviewCount] = useState<number | null>(null);

    // Google Contacts State
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [contacts, setContacts] = useState<Partial<TeamMember>[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());

    // Filtering State
    const [searchTerm, setSearchTerm] = useState('');
    const [userMatchOnly, setUserMatchOnly] = useState(false);

    const { addMember, updateMember, team } = useStore();

    // Compute Filtered Contacts
    const filteredContacts = contacts.filter(contact => {
        // 1. Text Search
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            (contact.name?.toLowerCase().includes(searchLower) || false) ||
            (contact.email?.toLowerCase().includes(searchLower) || false);

        if (!matchesSearch) return false;

        // 2. Match Crew Only (Approximate Match)
        if (userMatchOnly) {
            const contactNameParts = contact.name?.toLowerCase().split(' ') || [];
            // Check if any part of the name matches any part of any team member name
            // This is a loose "fuzzy" match
            const hasMatch = team.some(member => {
                const memberNameLower = member.name.toLowerCase();
                return contactNameParts.some(part => part.length > 2 && memberNameLower.includes(part));
            });
            return hasMatch;
        }

        return true;
    });

    // CSV Logic
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setCsvContent(text);
            validateCSV(text);
        };
        reader.readAsText(file);
    };

    const validateCSV = (text: string) => {
        setError(null);
        setSuccess(null);
        if (!text.trim()) {
            setPreviewCount(null);
            return;
        }

        try {
            const result = parseCrewCSV(text);
            if (result.errors.length > 0) {
                setError(`${result.errors.length} errores detectados (ej: ${result.errors[0]})`);
            }
            setPreviewCount(result.members.length);
        } catch (e) {
            setError('Error al analizar el CSV');
        }
    };

    const handleImportCSV = () => {
        const result = parseCrewCSV(csvContent);
        if (result.members.length === 0) {
            setError('No se encontraron miembros válidos para importar');
            return;
        }

        let count = 0;
        result.members.forEach(member => {
            if (member.name) {
                addMember(member as any);
                count++;
            }
        });

        finishImport(count);
    };

    // Google Contacts Logic
    const fetchGoogleContacts = async () => {
        setIsLoadingContacts(true);
        setError(null);
        try {
            const response = await fetch('/api/google/contacts');
            if (response.status === 401) {
                setError('Necesitas otorgar permisos de Contactos. Por favor cierra sesión y vuelve a entrar.');
                return;
            }
            if (!response.ok) throw new Error('Error fetching contacts');

            const data = await response.json();
            setContacts(data.contacts || []);
        } catch (err) {
            setError('Error al obtener contactos de Google.');
        } finally {
            setIsLoadingContacts(false);
        }
    };

    const toggleContactSelection = (index: number) => {
        const newSet = new Set(selectedContacts);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedContacts(newSet);
    };

    // ... (filteredContacts logic is already here from previous step)

    const handleImportGoogle = () => {
        let addedCount = 0;
        let updatedCount = 0;

        contacts.forEach((contact, index) => {
            if (selectedContacts.has(index) && contact.name) {
                // Check if member already exists (by Name or Email)
                const existingMember = team.find(m =>
                    (m.email && m.email === contact.email) ||
                    (contact.name && m.name.toLowerCase() === contact.name.toLowerCase())
                );

                if (existingMember) {
                    // Update existing member (Merge)
                    // Only update fields that are currently empty in the existing member
                    const updates: Partial<TeamMember> = {};
                    if (!existingMember.email && contact.email) updates.email = contact.email;
                    if (!existingMember.phone && contact.phone) updates.phone = contact.phone;
                    // if (!existingMember.photo && contact.photo) updates.photo = contact.photo; // Photo not in type yet
                    if (!existingMember.department && contact.department) updates.department = contact.department;
                    if (!existingMember.position && contact.position) updates.position = contact.position;

                    if (Object.keys(updates).length > 0) {
                        updateMember(existingMember.id, updates);
                        updatedCount++;
                    }
                } else {
                    // Add new member
                    addMember(contact as any);
                    addedCount++;
                }
            }
        });
        finishImport(addedCount + updatedCount, `Import: ${addedCount} new, ${updatedCount} updated`);
    };

    const finishImport = (count: number, message?: string) => {
        setSuccess(message || `¡Éxito! Se procesaron ${count} miembros.`);
        setTimeout(() => {
            onClose();
            setSuccess(null);
            setCsvContent('');
            setPreviewCount(null);
            setContacts([]);
            setSelectedContacts(new Set());
            setActiveTab('csv');
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-card border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <DownloadCloud className="w-6 h-6 text-primary" />
                        Importar Crew
                    </h2>

                    <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('csv')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                activeTab === 'csv' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <Upload className="w-4 h-4" /> CSV
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('google');
                                if (contacts.length === 0) fetchGoogleContacts();
                            }}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                activeTab === 'google' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <Users className="w-4 h-4" /> Google Contacts
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'csv' ? (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center bg-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">Click para subir CSV</span>
                                    <span className="text-xs text-muted-foreground">Formato: Nombre, Email, Rol...</span>
                                </label>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contenido Raw</label>
                                <textarea
                                    value={csvContent}
                                    onChange={(e) => {
                                        setCsvContent(e.target.value);
                                        validateCSV(e.target.value);
                                    }}
                                    className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 font-mono text-xs text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                                    placeholder="Pegar contenido CSV aquí..."
                                />
                                {previewCount !== null && (
                                    <p className="text-xs text-primary font-bold text-right">{previewCount} miembros detectados</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Search & Filter Controls */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                />
                                <button
                                    onClick={() => setUserMatchOnly(!userMatchOnly)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2",
                                        userMatchOnly
                                            ? "bg-primary/20 border-primary text-primary"
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                    )}
                                    title="Mostrar solo coincidencias con crew existente"
                                >
                                    <Users className="w-4 h-4" />
                                    <span className="hidden sm:inline">Match Crew</span>
                                </button>
                            </div>

                            {isLoadingContacts ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <p>Cargando contactos...</p>
                                </div>
                            ) : filteredContacts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                                    {filteredContacts.map((contact, idx) => {
                                        // Find original index in full list to maintain selection map
                                        const originalIndex = contacts.indexOf(contact);
                                        // Hacky: but since we filter, we need to key by something unique or use original index
                                        // For simplicity, let's just use the contact object in the selection Set? 
                                        // Or better: Let's map visibility only.
                                        // Re-implementation: `filteredContacts` creates new array. 
                                        // Let's toggle by Email if unique, or just rely on visual filtering but keep global selection?
                                        // Let's use `originalIndex` for selection tracking.
                                        return (
                                            <div
                                                key={originalIndex}
                                                onClick={() => toggleContactSelection(originalIndex)}
                                                className={cn(
                                                    "p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3",
                                                    selectedContacts.has(originalIndex)
                                                        ? "bg-primary/20 border-primary/50"
                                                        : "bg-white/5 border-white/5 hover:border-white/20"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-4 h-4 mt-1 rounded border flex items-center justify-center",
                                                    selectedContacts.has(originalIndex) ? "bg-primary border-primary text-white" : "border-white/30"
                                                )}>
                                                    {selectedContacts.has(originalIndex) && <Check className="w-3 h-3" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-foreground flex items-center gap-2">
                                                        {contact.name}
                                                        {userMatchOnly && <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-1 rounded">MATCH</span>}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{contact.email}</p>
                                                    {contact.phone && <p className="text-[10px] text-muted-foreground opacity-70">{contact.phone}</p>}
                                                    {contact.union && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-secondary-foreground">{contact.union}</span>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No se encontraron contactos que coincidan.</p>
                                    <button onClick={() => { setSearchTerm(''); setUserMatchOnly(false); }} className="text-primary hover:underline text-sm mt-2">Limpiar filtros</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Messages */}
                    <div className="mt-4 space-y-2">
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-500 text-sm">
                                <Check className="w-4 h-4" />
                                {success}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    {activeTab === 'csv' ? (
                        <button
                            onClick={handleImportCSV}
                            disabled={!csvContent || !!error || previewCount === 0}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        >
                            Importar CSV
                        </button>
                    ) : (
                        <button
                            onClick={handleImportGoogle}
                            disabled={selectedContacts.size === 0}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        >
                            Importar ({selectedContacts.size})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Task, TaskArea, TaskStatus, Month, Attachment } from '@/lib/types';
import TaskAttachments from './TaskAttachments';
import { X, Plus, Search, Users, Upload, FileText, Trash2, Link as LinkIcon } from 'lucide-react';
import DrivePicker from '@/components/Drive/DrivePicker';


interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id'>) => void;
    onDelete?: () => void;
    initialData?: Task;
    defaultDate?: string; // Format: YYYY-MM-DD
}

const AREAS: TaskArea[] = ['Guión', 'Técnico', 'Casting', 'Reporting', 'Pipeline', 'Post-producción', 'Investigación', 'Pre-visualización', 'Producción', 'Planificación', 'Crew'];
const STATUSES: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completado', 'Bloqueado'];
const MONTHS: Month[] = ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'];

export default function TaskModal({ isOpen, onClose, onSave, onDelete, initialData, defaultDate }: TaskModalProps) {
    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        area: 'Producción',
        status: 'Pendiente',
        month: 'Nov',
        week: 'Week 1',
        notes: '',
        responsible: [],
        isScheduled: true, // Default to true as per user preference for Date-driven tasks
        attachments: [],
        visibility: 'all',
        visibleTo: [],
    });
    const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

    // Auto-calculate Month and Week when date changes
    useEffect(() => {
        if (formData.scheduledDate) {
            const date = new Date(formData.scheduledDate);
            if (!isNaN(date.getTime())) {
                // Determine Month
                const monthIndex = date.getMonth(); // 0-11
                const monthMap: Record<number, Month> = {
                    0: 'Ene', 1: 'Feb', 2: 'Mar', 3: 'Abr', 4: 'May', 5: 'Jun',
                    6: 'Jul', 7: 'Ago', 8: 'Nov', 9: 'Nov', 10: 'Nov', 11: 'Dic'
                    // Fallback for Sep/Oct to Nov since they are missing in types
                };

                // Determine Project Week
                // Rule: "Semana 1 es la 2da semana de Noviembre (Nov 10)"
                const projectYear = date.getFullYear();

                // Define Project Start Date: Nov 10 (UTC)
                const projectStartDate = new Date(Date.UTC(projectYear, 10, 10));

                // Check difference in days
                const diffTime = date.getTime() - projectStartDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let weekLabel = '';
                if (diffDays < 0) {
                    const preWeekNum = Math.abs(Math.floor(diffDays / 7));
                    weekLabel = `Pre-W ${preWeekNum}`;
                } else {
                    const weekNum = Math.floor(diffDays / 7) + 1;
                    weekLabel = `Week ${weekNum}`;
                }

                setFormData(prev => ({
                    ...prev,
                    month: monthMap[monthIndex] || 'Nov',
                    week: weekLabel
                }));
            }
        }
    }, [formData.scheduledDate]);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                title: '',
                area: 'Producción',
                status: 'Pendiente',
                month: 'Nov',
                week: 'Week 1',
                notes: '',
                responsible: [],
                isScheduled: true,
                scheduledDate: defaultDate || new Date().toISOString().split('T')[0],
            });
        }
    }, [initialData, isOpen, defaultDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<Task, 'id'>);
        onClose();
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'visible' : 'invisible'}`}>
            <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
            <div className={`relative w-full max-w-lg bg-card border border-white/10 rounded-xl shadow-2xl p-6 transform transition-all ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <h2 className="text-xl font-bold text-foreground mb-4">
                    {initialData ? 'Edit Task' : 'New Task'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            placeholder="Task title..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Area</label>
                            <select
                                value={formData.area}
                                onChange={(e) => setFormData({ ...formData, area: e.target.value as TaskArea })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            >
                                {AREAS.map((area) => (
                                    <option key={area} value={area} className="bg-card text-foreground">{area}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            >
                                {STATUSES.map((status) => (
                                    <option key={status} value={status} className="bg-card text-foreground">{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date Selection - Made Primary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Fecha</label>
                            <input
                                type="date"
                                value={formData.scheduledDate || ''}
                                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            {/* Auto-calculated Info Display */}
                            <label className="text-sm font-medium text-muted-foreground">Periodo</label>
                            <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-muted-foreground cursor-not-allowed">
                                {formData.month} - {formData.week}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Notas</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 min-h-[100px]"
                            placeholder="Add details..."
                        />
                    </div>

                    {/* Advanced Scheduling Options */}
                    <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="checkbox"
                                id="hasTime"
                                checked={!!formData.scheduledTime}
                                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.checked ? '09:00' : undefined })}
                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                            />
                            <label htmlFor="hasTime" className="text-sm font-medium text-foreground">
                                Asignar hora específica
                            </label>
                        </div>

                        {formData.scheduledTime !== undefined && (
                            <div className="space-y-4 max-w-[50%]">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Hora</label>
                                    <input
                                        type="time"
                                        value={formData.scheduledTime || ''}
                                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="hasMeet"
                                        checked={formData.hasMeet || false}
                                        onChange={(e) => setFormData({ ...formData, hasMeet: e.target.checked })}
                                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="hasMeet" className="text-sm font-medium text-foreground flex items-center gap-1">
                                        Video Call (Meet)
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Attachments Section */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                Recursos & Archivos
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsDrivePickerOpen(true)}
                                className="text-xs flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-blue-400 font-medium transition-colors"
                            >
                                <Plus className="w-3 h-3" /> Adjuntar desde Drive
                            </button>
                        </div>

                        {/* Attachments List */}
                        {formData.attachments && formData.attachments.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {formData.attachments.map((att) => (
                                    <div key={att.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 hover:border-white/10 group">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {att.type === 'file' ? <FileText className="w-4 h-4 text-blue-400" /> : <LinkIcon className="w-4 h-4 text-purple-400" />}
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground truncate hover:underline">
                                                {att.name}
                                            </a>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    attachments: formData.attachments?.filter(a => a.id !== att.id)
                                                });
                                            }}
                                            className="p-1 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No hay archivos adjuntos.</p>
                        )}
                    </div>

                    {/* Attachments and Permissions (Advanced) */}
                    <TaskAttachments
                        task={formData}
                        onChange={(updates) => setFormData({ ...formData, ...updates })}
                    />

                    <div className="flex justify-between items-center gap-3 pt-4">
                        {onDelete && initialData ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                                        onDelete();
                                    }
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            >
                                Eliminar
                            </button>
                        ) : (
                            <div></div>
                        )}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                            >
                                {initialData ? 'Save Changes' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Drive Picker Overlay */}
            {isDrivePickerOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDrivePickerOpen(false)} />
                    <div className="relative w-full max-w-2xl z-10">
                        <DrivePicker
                            onSelect={(link, id, name) => {
                                const newAttachment: Attachment = {
                                    id: crypto.randomUUID(),
                                    name: name,
                                    type: 'file',
                                    url: link,
                                    addedBy: 'me',
                                    addedAt: new Date().toISOString()
                                };
                                setFormData({
                                    ...formData,
                                    attachments: [...(formData.attachments || []), newAttachment]
                                });
                                setIsDrivePickerOpen(false);
                            }}
                            onCancel={() => setIsDrivePickerOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

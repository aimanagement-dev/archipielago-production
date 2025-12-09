'use client';

import { useState, useEffect } from 'react';
import { Task, TaskArea, TaskStatus, Month } from '@/lib/types';
import TaskAttachments from './TaskAttachments';


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
        attachments: [],
        visibility: 'all',
        visibleTo: [],
    });

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
                isScheduled: !!defaultDate,
                scheduledDate: defaultDate || '',
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Month</label>
                            <select
                                value={formData.month}
                                onChange={(e) => setFormData({ ...formData, month: e.target.value as Month })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            >
                                {MONTHS.map((month) => (
                                    <option key={month} value={month} className="bg-card text-foreground">{month}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Week</label>
                            <input
                                type="text"
                                value={formData.week}
                                onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                placeholder="e.g. Week 1"
                            />
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

                    {/* Scheduling Section */}
                    <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="checkbox"
                                id="isScheduled"
                                checked={formData.isScheduled || false}
                                onChange={(e) => setFormData({ ...formData, isScheduled: e.target.checked })}
                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                            />
                            <label htmlFor="isScheduled" className="text-sm font-medium text-foreground">
                                Programar con fecha y hora específica
                            </label>
                        </div>

                        {formData.isScheduled && (
                            <div className="grid grid-cols-2 gap-4 mt-3">
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
                                    <label className="text-sm font-medium text-muted-foreground">Hora</label>
                                    <input
                                        type="time"
                                        value={formData.scheduledTime || ''}
                                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                        placeholder="HH:MM"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Attachments and Permissions */}
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
        </div>
    );
}

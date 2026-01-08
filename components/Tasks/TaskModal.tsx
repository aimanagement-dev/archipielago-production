'use client';

import { useState, useEffect } from 'react';
import { Task, TaskArea, TaskStatus, Month, Attachment } from '@/lib/types';
import TaskAttachments from './TaskAttachments';
import { X, Plus, Search, Users, Upload, FileText, Trash2, Link as LinkIcon, Share2 } from 'lucide-react';
import DrivePicker from '@/components/Drive/DrivePicker';
import ComposeModal from '@/components/Comms/ComposeModal';
import { useStore } from '@/lib/store';


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

interface CalendarOption {
    id: string;
    summary: string;
    backgroundColor?: string;
}

export default function TaskModal({ isOpen, onClose, onSave, onDelete, initialData, defaultDate }: TaskModalProps) {
    const { team } = useStore();
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
        calendarId: undefined, // Calendario donde se creará el evento
        startDate: undefined,
        endDate: undefined,
    });
    const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [attachmentMode, setAttachmentMode] = useState<'drive' | 'local'>('drive');
    const [availableCalendars, setAvailableCalendars] = useState<CalendarOption[]>([]);
    const [loadingCalendars, setLoadingCalendars] = useState(false);

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

    // Cargar calendarios disponibles cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setLoadingCalendars(true);
            fetch('/api/calendars/list')
                .then(res => res.json())
                .then(data => {
                    if (data.calendars && Array.isArray(data.calendars)) {
                        setAvailableCalendars(data.calendars);
                        // Si no hay calendarId seleccionado y hay calendarios disponibles, usar el primero (ARCH-Producción)
                        if (!formData.calendarId && data.calendars.length > 0) {
                            const produccionCalendar = data.calendars.find((c: CalendarOption) =>
                                c.summary.toLowerCase().includes('producción') ||
                                c.summary.toLowerCase().includes('produccion')
                            );
                            if (produccionCalendar) {
                                setFormData(prev => ({ ...prev, calendarId: produccionCalendar.id }));
                            } else {
                                setFormData(prev => ({ ...prev, calendarId: data.calendars[0].id }));
                            }
                        }
                    }
                })
                .catch(err => {
                    console.error('Error loading calendars:', err);
                })
                .finally(() => {
                    setLoadingCalendars(false);
                });
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Asegurar que los attachments se carguen correctamente
                // Preservar todos los attachments existentes
                const existingAttachments = Array.isArray(initialData.attachments)
                    ? initialData.attachments
                    : [];

                setFormData({
                    ...initialData,
                    attachments: existingAttachments,
                    responsible: initialData.responsible || [],
                    visibleTo: initialData.visibleTo || [],
                    calendarId: initialData.calendarId || undefined,
                });
            } else {
                // Resetear solo cuando se abre el modal para nueva tarea
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
                    attachments: [],
                    visibility: 'all',
                    visibleTo: [],
                });
            }
        }
    }, [initialData, isOpen, defaultDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Guardar la tarea primero
        onSave(formData as Omit<Task, 'id'>);

        // Si hay responsables asignados Y es una nueva tarea, mostrar modal de notificación
        // NO cerrar el modal todavía - esperar a que se muestre la notificación
        if (!initialData && formData.responsible && formData.responsible.length > 0) {
            // Esperar un momento para que se guarde la tarea antes de mostrar notificación
            setTimeout(() => {
                setIsComposeOpen(true);
            }, 500);
        } else {
            // Si es edición o no hay responsables, cerrar normalmente
            onClose();
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'visible' : 'invisible'}`}>
            <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
            <div className={`relative w-full max-w-lg bg-card border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[90vh] transform transition-all ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="p-6 border-b border-white/5 flex-shrink-0">
                    <h2 className="text-xl font-bold text-foreground">
                        {initialData ? 'Edit Task' : 'New Task'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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

                    {/* Responsible Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" /> Responsable(s)
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-white/5 border border-white/10 rounded-lg min-h-[50px]">
                            {formData.responsible?.map((email) => {
                                const member = team.find(m => m.email === email);
                                return (
                                    <div key={email} className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded-full text-xs border border-primary/30">
                                        <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold">
                                            {member?.name?.charAt(0) || email.charAt(0)}
                                        </div>
                                        <span>{member?.name || email}</span>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({
                                                ...formData,
                                                responsible: (formData.responsible || []).filter(e => e !== email)
                                            })}
                                            className="ml-1 hover:text-primary-foreground transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}

                            <select
                                className="bg-transparent text-sm text-muted-foreground focus:outline-none hover:text-foreground cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.value && !formData.responsible?.includes(e.target.value)) {
                                        setFormData({
                                            ...formData,
                                            responsible: [...(formData.responsible || []), e.target.value]
                                        });
                                        // Reset select
                                        e.target.value = '';
                                    }
                                }}
                                value=""
                            >
                                <option value="" disabled>+ Añadir miembro</option>
                                {team.filter(m => m.email && !formData.responsible?.includes(m.email)).map(member => (
                                    <option key={member.email!} value={member.email!} className="bg-card text-foreground">
                                        {member.name} ({member.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-4 border-t border-white/10 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Start & End Dates - New Requirements */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={formData.startDate || ''}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Fecha Fin</label>
                                <input
                                    type="date"
                                    value={formData.endDate || ''}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Fecha Agendada (Hito)</label>
                                <input
                                    type="date"
                                    value={formData.scheduledDate || ''}
                                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                />
                                <p className="text-[10px] text-muted-foreground">Fecha para el calendario y cálculo de semana.</p>
                            </div>
                            <div className="space-y-2">
                                {/* Auto-calculated Info Display */}
                                <label className="text-sm font-medium text-muted-foreground">Periodo</label>
                                <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-muted-foreground cursor-not-allowed">
                                    {formData.month} - {formData.week}
                                </div>
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
                        {/* Selector de Calendario */}
                        {formData.isScheduled && formData.scheduledDate && (
                            <div className="space-y-2 mb-4">
                                <label className="text-sm font-medium text-muted-foreground">Calendario</label>
                                {loadingCalendars ? (
                                    <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-muted-foreground">
                                        Cargando calendarios...
                                    </div>
                                ) : availableCalendars.length > 0 ? (
                                    <select
                                        value={formData.calendarId || ''}
                                        onChange={(e) => setFormData({ ...formData, calendarId: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                    >
                                        {availableCalendars.map((cal) => (
                                            <option key={cal.id} value={cal.id}>
                                                {cal.summary}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-muted-foreground">
                                        No hay calendarios disponibles
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Selecciona en qué calendario se creará el evento. Los usuarios regulares solo verán eventos del calendario de Producción.
                                </p>
                            </div>
                        )}

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

                    {/* Meet Link Display - MUY VISIBLE cuando existe */}
                    {(formData.meetLink || initialData?.meetLink) && (
                        <div className="border-t border-white/10 pt-4">
                            <label className="text-sm font-bold text-foreground mb-3 block">🔗 Link de Google Meet</label>
                            <div className="bg-blue-500/10 border-2 border-blue-500/40 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.414 1.414.707.707c.39.39.39 1.024 0 1.414l-1.414 1.414c-.39.39-1.024.39-1.414 0l-.707-.707-1.414 1.414c-.39.39-1.024.39-1.414 0l-1.414-1.414c-.39-.39-.39-1.024 0-1.414l1.414-1.414-.707-.707c-.39-.39-.39-1.024 0-1.414l1.414-1.414c.39-.39 1.024-.39 1.414 0l.707.707 1.414-1.414c.39-.39 1.024-.39 1.414 0l1.414 1.414c.39.39.39 1.024 0 1.414l-1.414 1.414.707.707c.39.39.39 1.024 0 1.414z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-1 font-medium">Link de la reunión:</p>
                                        <p className="text-sm text-blue-400 font-mono break-all">{formData.meetLink || initialData?.meetLink}</p>
                                    </div>
                                </div>
                                <a
                                    href={formData.meetLink || initialData?.meetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-bold transition-all border-2 border-blue-500/40 hover:border-blue-500/60 shadow-lg hover:shadow-xl hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.414 1.414.707.707c.39.39.39 1.024 0 1.414l-1.414 1.414c-.39.39-1.024.39-1.414 0l-.707-.707-1.414 1.414c-.39.39-1.024.39-1.414 0l-1.414-1.414c-.39-.39-.39-1.024 0-1.414l1.414-1.414-.707-.707c-.39-.39-.39-1.024 0-1.414l1.414-1.414c.39-.39 1.024-.39 1.414 0l.707.707 1.414-1.414c.39-.39 1.024-.39 1.414 0l1.414 1.414c.39.39.39 1.024 0 1.414l-1.414 1.414.707.707c.39.39.39 1.024 0 1.414z" />
                                    </svg>
                                    <span>Unirse a la Reunión</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Attachments Section - Consolidated */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Recursos</span>
                            <button
                                type="button"
                                onClick={() => setIsDrivePickerOpen(true)}
                                className="text-xs flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-blue-400 font-medium transition-colors"
                            >
                                <Plus className="w-3 h-3" /> Adjuntar
                            </button>
                        </div>
                    </div>

                    {/* Attachments and Permissions (Advanced) */}
                    <TaskAttachments
                        task={formData}
                        onChange={(updates) => setFormData({ ...formData, ...updates })}
                    />
                </form>

                {/* Footer buttons */}
                <div className="p-6 border-t border-white/5 bg-black/20 flex-shrink-0">
                    <div className="flex flex-col gap-3">
                        {/* Info sobre notificaciones automáticas */}
                        {formData.responsible && formData.responsible.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-blue-400/80 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                    Las notificaciones se enviarán automáticamente a {formData.responsible.length} responsable{formData.responsible.length > 1 ? 's' : ''} al guardar
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center gap-3">
                            <div className="flex gap-2">
                                {onDelete && initialData && (
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
                                )}
                                {/* Botón Compartir - siempre visible si hay datos de la tarea */}
                                {initialData && (
                                    <button
                                        type="button"
                                        onClick={() => setIsShareOpen(true)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors flex items-center gap-2"
                                        title="Compartir tarea con equipo"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Compartir
                                    </button>
                                )}
                                {/* Botón para enviar notificación manual - visible si hay responsables */}
                                {formData.responsible && formData.responsible.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setIsComposeOpen(true)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                                        title="Enviar notificación manual a los responsables"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Enviar Notificación
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                >
                                    {initialData ? 'Save Changes' : 'Create Task'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Attachment Picker Modal - Mejorado con opciones Drive y Upload */}
            {
                isDrivePickerOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDrivePickerOpen(false)} />
                        <div className="relative w-full max-w-2xl bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                                <h3 className="font-bold text-foreground">Adjuntar Archivo</h3>
                                <button onClick={() => setIsDrivePickerOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tabs para Drive / Upload Local */}
                            <div className="flex border-b border-white/5 flex-shrink-0">
                                <button
                                    onClick={() => setAttachmentMode('drive')}
                                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${attachmentMode === 'drive'
                                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                        Google Drive
                                    </div>
                                </button>
                                <button
                                    onClick={() => setAttachmentMode('local')}
                                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${attachmentMode === 'local'
                                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        Subir Archivo
                                    </div>
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                {attachmentMode === 'drive' ? (
                                    <div className="h-full overflow-auto">
                                        <DrivePicker
                                            area={formData.area}
                                            onSelect={(link, id, name) => {
                                                const newAttachment: Attachment = {
                                                    id: crypto.randomUUID(),
                                                    name: name,
                                                    type: 'file',
                                                    url: link,
                                                    addedBy: 'me',
                                                    addedAt: new Date().toISOString()
                                                };
                                                // Asegurar que preservamos los attachments existentes
                                                const currentAttachments = formData.attachments || [];
                                                setFormData({
                                                    ...formData,
                                                    attachments: [...currentAttachments, newAttachment]
                                                });
                                                setIsDrivePickerOpen(false);
                                            }}
                                            onCancel={() => setIsDrivePickerOpen(false)}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-6 h-full flex flex-col items-center justify-center">
                                        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                                        <p className="text-sm text-muted-foreground mb-4 text-center">
                                            Selecciona un archivo desde tu computadora
                                        </p>
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                // Mostrar indicador de carga
                                                const uploadButton = document.getElementById('file-upload-label');
                                                const uploadText = document.getElementById('file-upload-text');
                                                if (uploadButton) {
                                                    uploadButton.textContent = 'Subiendo...';
                                                    (uploadButton as HTMLElement).style.opacity = '0.5';
                                                    (uploadButton as HTMLElement).style.cursor = 'not-allowed';
                                                }
                                                if (uploadText) {
                                                    uploadText.textContent = 'Subiendo archivo a Google Drive...';
                                                }

                                                try {
                                                    // Subir archivo a Drive en la carpeta de attachments de tasks
                                                    const formDataToUpload = new FormData();
                                                    formDataToUpload.append('file', file);

                                                    const uploadResponse = await fetch('/api/drive/upload-task-file', {
                                                        method: 'POST',
                                                        body: formDataToUpload
                                                    });

                                                    if (!uploadResponse.ok) {
                                                        const errorData = await uploadResponse.json().catch(() => ({}));
                                                        throw new Error(errorData.error || 'Error al subir archivo');
                                                    }

                                                    const uploadData = await uploadResponse.json();

                                                    if (!uploadData.file || !uploadData.file.webViewLink) {
                                                        throw new Error('No se recibió el link del archivo subido');
                                                    }

                                                    // Crear attachment con el link de Drive
                                                    const newAttachment: Attachment = {
                                                        id: crypto.randomUUID(),
                                                        name: file.name,
                                                        type: 'file',
                                                        url: uploadData.file.webViewLink,
                                                        addedBy: 'me',
                                                        addedAt: new Date().toISOString(),
                                                        size: file.size
                                                    };

                                                    // Asegurar que preservamos los attachments existentes
                                                    const currentAttachments = formData.attachments || [];
                                                    setFormData({
                                                        ...formData,
                                                        attachments: [...currentAttachments, newAttachment]
                                                    });

                                                    setIsDrivePickerOpen(false);

                                                    // Resetear el input
                                                    e.target.value = '';

                                                    if (uploadButton) {
                                                        uploadButton.textContent = 'Seleccionar Archivo';
                                                        (uploadButton as HTMLElement).style.opacity = '1';
                                                        (uploadButton as HTMLElement).style.cursor = 'pointer';
                                                    }
                                                    if (uploadText) {
                                                        uploadText.textContent = 'El archivo se subió correctamente a Google Drive';
                                                    }
                                                } catch (error) {
                                                    console.error('Error uploading file:', error);
                                                    alert(`Error al subir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);

                                                    if (uploadButton) {
                                                        uploadButton.textContent = 'Seleccionar Archivo';
                                                        (uploadButton as HTMLElement).style.opacity = '1';
                                                        (uploadButton as HTMLElement).style.cursor = 'pointer';
                                                    }
                                                    if (uploadText) {
                                                        uploadText.textContent = 'El archivo se subirá automáticamente a Google Drive en la carpeta "Task_Attachments"';
                                                    }
                                                }
                                            }}
                                        />
                                        <label
                                            id="file-upload-label"
                                            htmlFor="file-upload"
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
                                        >
                                            Seleccionar Archivo
                                        </label>
                                        <p id="file-upload-text" className="text-xs text-muted-foreground mt-4 text-center max-w-sm">
                                            El archivo se subirá automáticamente a Google Drive en la carpeta "Task_Attachments"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Compose Modal for Notifications */}
            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => {
                    setIsComposeOpen(false);
                    // Cerrar el modal de tarea después de cerrar el de notificación
                    setTimeout(() => {
                        onClose();
                    }, 200);
                }}
                initialData={{
                    // Mapear responsables (IDs o emails) a lista de emails
                    to: formData.responsible
                        ? formData.responsible
                            .map((resp: string) => {
                                // Si ya es un email, usarlo directamente
                                if (resp.includes('@')) {
                                    return resp;
                                }
                                // Si es un ID, buscar el email en el team
                                const member = team.find(m => m.id === resp);
                                return member?.email || null;
                            })
                            .filter((email: string | null): email is string => !!email)
                        : [],
                    subject: initialData
                        ? `Actualización: ${formData.title || 'Tarea'}`
                        : `Nueva Tarea: ${formData.title || 'Sin título'}`,
                    body: `
${initialData ? 'Tarea Actualizada' : 'Nueva Tarea Asignada'}

Título: ${formData.title || 'Sin título'}
${formData.scheduledDate ? `Fecha: ${new Date(formData.scheduledDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
${formData.scheduledTime ? `Hora: ${formData.scheduledTime}` : ''}
${formData.area ? `Área: ${formData.area}` : ''}
${formData.status ? `Estado: ${formData.status}` : ''}
${formData.notes ? `\nNotas:\n${formData.notes}` : ''}

--
Enviado desde Archipiélago Production OS
                    `.trim(),
                    attachments: formData.attachments
                }}
            />

            {/* Share Modal - Para compartir tarea con notificaciones */}
            <ComposeModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                useSystemEmail={true}
                initialData={{
                    to: [],
                    subject: `Tarea Compartida: ${initialData?.title || formData.title || 'Sin título'}`,
                    body: `
Se te ha compartido una tarea:

Título: ${initialData?.title || formData.title || 'Sin título'}
${initialData?.scheduledDate || formData.scheduledDate ? `Fecha: ${new Date(initialData?.scheduledDate || formData.scheduledDate || '').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
${initialData?.scheduledTime || formData.scheduledTime ? `Hora: ${initialData?.scheduledTime || formData.scheduledTime}` : ''}
${initialData?.area || formData.area ? `Área: ${initialData?.area || formData.area}` : ''}
${initialData?.status || formData.status ? `Estado: ${initialData?.status || formData.status}` : ''}
${initialData?.notes || formData.notes ? `\nNotas:\n${initialData?.notes || formData.notes}` : ''}

🔗 Ver tarea: ${typeof window !== 'undefined' ? window.location.origin : ''}/tasks?task=${initialData?.id || ''}

--
Compartido desde Archipiélago Production OS
                    `.trim(),
                    attachments: initialData?.attachments || formData.attachments || []
                }}
            />
        </div >
    );
}

'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface CalendarOption {
  id: string;
  summary: string;
  backgroundColor?: string;
}

interface EventPayload {
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  description?: string;
  attendees?: string[];
  calendarId?: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: EventPayload) => Promise<void>;
  defaultDate?: string;
}

export default function EventModal({ isOpen, onClose, onSave, defaultDate }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    date: defaultDate || new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '',
    description: '',
    attendees: '',
    calendarId: '',
  });
  const [availableCalendars, setAvailableCalendars] = useState<CalendarOption[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormData((prev) => ({
      title: '',
      date: defaultDate || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '',
      description: '',
      attendees: '',
      calendarId: prev.calendarId,
    }));
    setError(null);
  }, [isOpen, defaultDate]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingCalendars(true);
    fetch('/api/calendars/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.calendars && Array.isArray(data.calendars)) {
          setAvailableCalendars(data.calendars);
          if (!formData.calendarId && data.calendars.length > 0) {
            const produccionCalendar = data.calendars.find((c: CalendarOption) =>
              c.summary.toLowerCase().includes('produccion') || c.summary.toLowerCase().includes('producción')
            );
            setFormData((prev) => ({
              ...prev,
              calendarId: produccionCalendar ? produccionCalendar.id : data.calendars[0].id,
            }));
          }
        }
      })
      .catch((err) => {
        console.error('Error loading calendars:', err);
      })
      .finally(() => {
        setLoadingCalendars(false);
      });
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const attendees = formData.attendees
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      await onSave({
        title: formData.title.trim(),
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime || undefined,
        description: formData.description.trim() || undefined,
        attendees,
        calendarId: formData.calendarId || undefined,
      });
      onClose();
      setFormData({
        title: '',
        date: defaultDate || new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '',
        description: '',
        attendees: '',
        calendarId: formData.calendarId,
      });
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'No se pudo crear el evento.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'visible' : 'invisible'}`}>
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-lg bg-card border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[90vh] transform transition-all ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Nuevo Evento</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/40 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Titulo</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
              placeholder="Nombre del evento..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Fecha</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Hora Inicio</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Hora Fin</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Calendario</label>
              <select
                value={formData.calendarId}
                onChange={(e) => setFormData({ ...formData, calendarId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
              >
                {loadingCalendars && <option value="">Cargando...</option>}
                {!loadingCalendars && availableCalendars.length === 0 && (
                  <option value="">Sin calendarios</option>
                )}
                {availableCalendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id} className="bg-card text-foreground">
                    {calendar.summary}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Invitados (emails separados por coma)</label>
            <input
              type="text"
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
              placeholder="correo1@dominio.com, correo2@dominio.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Descripcion</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 min-h-[90px] resize-none"
              placeholder="Detalles del evento..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {isSubmitting ? 'Creando...' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

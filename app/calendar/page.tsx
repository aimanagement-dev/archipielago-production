'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { ChevronLeft, ChevronRight, Plus, LayoutGrid, List, Columns, Clock, CheckSquare, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, isSameDay, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, statusColors, areaColors } from '@/lib/utils';
import TaskModal from '@/components/Tasks/TaskModal';
import { useAuth } from '@/lib/auth';
import { Task, TaskArea } from '@/lib/types';

type ViewMode = 'month' | 'week' | 'day';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [syncingFromCalendar, setSyncingFromCalendar] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { tasks, addTask, updateTask, deleteTask, fetchCalendarEvents, events, isLoading, fetchTasks } = useStore();
  const { user } = useAuth();

  // Cargar tareas + eventos de Calendar al montar el componente
  useEffect(() => {
    fetchTasks();
    fetchCalendarEvents();
  }, [fetchTasks, fetchCalendarEvents]);

  // Separate scheduled tasks from ongoing tasks
  const scheduledTasks = useMemo(() => {
    // 1. Internal tasks
    const internalTasks = tasks.filter(t => t.isScheduled && t.scheduledDate);

    // 2. Map Google Events to Task-like structure for display
    const googleEvents = events.map(event => {
      // Avoid duplicates
      // Check extendedProperties OR description for TaskID
      const description = event.description || '';
      const hasPropSource = event.extendedProperties?.private?.source === 'arch-pm';
      const hasTaskIdProp = !!event.extendedProperties?.private?.taskId;
      const hasTaskIdDesc = /TaskID:\s*(.+)/.test(description);

      const isInternal = hasPropSource || hasTaskIdProp || hasTaskIdDesc;

      if (isInternal) return null; // Skip internally created events to avoid duplication

      const start = event.start?.dateTime || event.start?.date;
      if (!start) return null;

      // Parse metadata from description if available
      const statusMatch = description.match(/Estado:\s*(.+)/);
      const areaMatch = description.match(/Área:\s*(.+)/);

      const parsedStatus = statusMatch ? statusMatch[1].trim() : 'Pendiente';
      const parsedArea = areaMatch ? areaMatch[1].trim() : 'Planificación';

      return {
        id: event.id || 'google-event',
        title: `${event.summary || '(Sin título)'}${event.sourceCalendar ? ` [${event.sourceCalendar}]` : ' [Google]'}`,
        status: parsedStatus,
        area: parsedArea,
        month: 'Ene',
        week: 'Week 1',
        responsible: [],
        notes: event.description,
        scheduledDate: start.split('T')[0],
        scheduledTime: event.start?.dateTime ? format(parseISO(event.start.dateTime), 'HH:mm') : undefined,
        isScheduled: true,
        isGoogleEvent: true, // Flag to identify external events
      } as unknown as Task;
    }).filter(Boolean) as Task[];

    return [...internalTasks, ...googleEvents];
  }, [tasks, events]);

  const ongoingTasks = useMemo(() =>
    tasks.filter(t => !t.isScheduled || !t.scheduledDate),
    [tasks]
  );

  // Group ongoing tasks by area
  const ongoingByArea = useMemo(() => {
    const groups: Partial<Record<TaskArea, Task[]>> = {};
    // Filtrar tareas que NO están programadas (en curso, sin fecha específica)
    const tasksToShow = ongoingTasks.filter(task => {
      // Incluir todas las tareas que no están programadas o que están en progreso
      return (!task.isScheduled || !task.scheduledDate) && task.status !== 'Completado';
    });
    
    tasksToShow.forEach(task => {
      if (!groups[task.area]) {
        groups[task.area] = [];
      }
      groups[task.area]!.push(task);
    });
    
    // Debug: Log para verificar qué tareas se están mostrando
    if (process.env.NODE_ENV === 'development') {
      console.log('[Calendar] Ongoing tasks by area:', {
        totalTasks: tasks.length,
        ongoingTasks: ongoingTasks.length,
        tasksToShow: tasksToShow.length,
        groupedByArea: Object.keys(groups).length,
        areas: Object.keys(groups),
      });
    }
    
    return groups;
  }, [ongoingTasks, tasks]);

  // Get date range based on view mode
  const { start, end, title } = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        start: monthStart,
        end: monthEnd,
        title: format(currentDate, 'MMMM yyyy', { locale: es })
      };
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: es });
      const weekEnd = endOfWeek(currentDate, { locale: es });
      return {
        start: weekStart,
        end: weekEnd,
        title: `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM yyyy', { locale: es })}`
      };
    } else {
      return {
        start: currentDate,
        end: currentDate,
        title: format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es })
      };
    }
  }, [currentDate, viewMode]);

  const daysToShow = eachDayOfInterval({ start, end });

  // Get scheduled tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return scheduledTasks.filter(t => {
      if (!t.scheduledDate) return false;
      try {
        const taskDate = parseISO(t.scheduledDate);
        return isSameDay(taskDate, day);
      } catch {
        return false;
      }
    }).sort((a, b) => {
      // Sort by time if available
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime.localeCompare(b.scheduledTime);
      }
      return 0;
    });
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Sincronización bidireccional: siempre sincroniza Calendar ↔ Sheets en ambas direcciones
  const handleSyncFromCalendar = async () => {
    setSyncingFromCalendar(true);
    setSyncMessage(null);
    setSyncError(null);

    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 0).toISOString();

      // PASO 1: Sincronizar desde Google Calendar hacia Sheets
      const responseFromCalendar = await fetch(
        `/api/google/calendar/sync?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&updateSheets=true`,
        { method: 'GET' }
      );

      const dataFromCalendar = await responseFromCalendar.json();

      if (!responseFromCalendar.ok || !dataFromCalendar.ok) {
        throw new Error(dataFromCalendar.error || 'No se pudo sincronizar desde Google Calendar.');
      }

      // Esperar un momento para que Sheets procese los cambios
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recargar tareas (ahora lee de Sheets Y Calendar)
      await fetchTasks();

      // Esperar un momento adicional para asegurar que las tareas se carguen
      await new Promise(resolve => setTimeout(resolve, 500));

      // Obtener las tareas actualizadas del store
      const storeState = useStore.getState();
      const updatedTasks = storeState.tasks;

      console.log(`[SYNC] Tareas cargadas después de sincronizar desde Calendar: ${updatedTasks.length}`);

      // PASO 2: Sincronizar desde Sheets hacia Google Calendar
      const scheduledTasksPayload = updatedTasks
        .filter((task) => task.isScheduled && task.scheduledDate)
        .map((task) => ({
          id: task.id,
          title: task.title,
          scheduledDate: task.scheduledDate,
          scheduledTime: task.scheduledTime,
          responsible: task.responsible,
          area: task.area,
          status: task.status,
          notes: task.notes,
        }));

      let dataToCalendar: { ok?: boolean; created?: number; updated?: number; error?: string } | null = null;
      if (scheduledTasksPayload.length > 0) {
        const responseToCalendar = await fetch('/api/google/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks: scheduledTasksPayload }),
        });

        dataToCalendar = await responseToCalendar.json();

        if (!responseToCalendar.ok || (dataToCalendar && !dataToCalendar.ok)) {
          console.warn('Error sincronizando hacia Calendar:', dataToCalendar?.error);
        }
      }

      // Mensaje de éxito combinado
      const parts = [];
      if (dataFromCalendar.tasksFound > 0) parts.push(`${dataFromCalendar.tasksFound} eventos leídos`);
      if (dataFromCalendar.updated > 0) parts.push(`${dataFromCalendar.updated} actualizados en Sheets`);
      if (dataFromCalendar.created > 0) parts.push(`${dataFromCalendar.created} creados en Sheets`);
      if (dataToCalendar) {
        if (dataToCalendar.created && dataToCalendar.created > 0) parts.push(`${dataToCalendar.created} eventos creados`);
        if (dataToCalendar.updated && dataToCalendar.updated > 0) parts.push(`${dataToCalendar.updated} eventos actualizados`);
      }

      setSyncMessage(
        `✅ Sincronización bidireccional completa: ${parts.join(', ')}.`
      );

      // Recargar tareas una vez más para asegurar que todo esté actualizado
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchTasks();

      console.log(`[SYNC] Sincronización completa. Tareas finales: ${useStore.getState().tasks.length}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al sincronizar con Google Calendar.';
      setSyncError(errorMessage);
      console.error('Error en sincronización:', error);
    } finally {
      setSyncingFromCalendar(false);
    }
  };

  // Render Month View - Click on day navigates to day view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const firstDayOfWeek = monthStart.getDay();

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {DAYS.map((day) => (
          <div key={day} className="text-center py-3 text-sm font-black text-muted-foreground uppercase tracking-widest">
            {day}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days */}
        {daysToShow.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => {
                setCurrentDate(day);
                setViewMode('day');
              }}
              className={cn(
                'aspect-square p-2 rounded-xl border transition-all cursor-pointer shadow-sm',
                isCurrentDay
                  ? 'bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-primary/20'
                  : 'bg-muted/30 border-border hover:border-primary/40 hover:bg-muted/60 hover:shadow-md'
              )}
            >
              <div className="h-full flex flex-col">
                <div className={cn(
                  'text-sm font-bold mb-1 flex items-center justify-between',
                  isCurrentDay ? 'text-primary' : 'text-foreground'
                )}>
                  <span>{format(day, 'd')}</span>
                  {dayTasks.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-[10px] font-black text-primary-foreground flex items-center justify-center shadow-sm">
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'text-[9px] px-1.5 py-1 rounded-md font-bold truncate flex items-center gap-1 border border-border/50',
                        areaColors[task.area]
                      )}
                      title={`${task.scheduledTime || ''} - ${task.title}`}
                    >
                      {task.scheduledTime && (
                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                      )}
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-7 gap-2">
        {daysToShow.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[500px] p-3 rounded-xl border transition-all shadow-sm',
                isCurrentDay
                  ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/10'
                  : 'bg-muted/20 border-border'
              )}
            >
              <div className="text-center mb-4 pb-4 border-b border-border">
                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div className={cn(
                  'text-3xl font-black tracking-tighter',
                  isCurrentDay ? 'text-primary' : 'text-foreground'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-wider">
                  {dayTasks.length === 1 ? '1 evento' : `${dayTasks.length} eventos`}
                </div>
              </div>
              <div className="space-y-2">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsModalOpen(true);
                    }}
                    className="p-3 rounded-xl bg-card border border-border shadow-sm hover:border-primary/40 hover:shadow-md cursor-pointer transition-all group"
                  >
                    {task.scheduledTime && (
                      <div className="flex items-center gap-1.5 text-[10px] text-primary font-black mb-1.5 uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        {task.scheduledTime}
                      </div>
                    )}
                    <div className="font-bold text-foreground text-xs mb-2 line-clamp-3 group-hover:text-primary transition-colors">{task.title}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-border/50', areaColors[task.area])}>
                        {task.area}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-border/50', statusColors[task.status])}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Day View
  const renderDayView = () => {
    const dayTasks = getTasksForDay(currentDate);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="bg-muted/10 rounded-xl p-6 border border-border shadow-inner">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Timeline del Día</h3>
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Nueva Tarea
              </button>
            )}
          </div>
          <div className="space-y-1">
            {Array.from({ length: 24 }).map((_, hour) => {
              const hourString = hour.toString().padStart(2, '0');
              const tasksInHour = dayTasks.filter(t =>
                t.scheduledTime && t.scheduledTime.startsWith(hourString)
              );

              return (
                <div key={hour} className="flex items-start gap-4">
                  <div className="w-16 text-xs font-bold text-muted-foreground pt-1.5 tabular-nums">
                    {hourString}:00
                  </div>
                  <div className="flex-1 min-h-[60px] border-l-2 border-border pl-4 relative">
                    <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-border" />
                    {tasksInHour.map(task => (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsModalOpen(true);
                        }}
                        className={cn(
                          'mb-3 p-3 rounded-xl border cursor-pointer shadow-sm',
                          'bg-card border-border hover:border-primary/40 hover:shadow-md transition-all group'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-black text-primary uppercase tracking-wider">{task.scheduledTime}</span>
                        </div>
                        <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{task.title}</div>
                        <div className="flex gap-1.5 mt-2">
                          <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-border/50', areaColors[task.area])}>
                            {task.area}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Day Tasks */}
        <div className="bg-muted/10 rounded-xl p-6 border border-border shadow-inner">
          <h3 className="text-lg font-bold text-foreground mb-6">
            Eventos del Día ({dayTasks.length})
          </h3>
          <div className="space-y-4">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task);
                  setIsModalOpen(true);
                }}
                className="p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
              >
                {task.scheduledTime && (
                  <div className="flex items-center gap-2 mb-2.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-black text-primary uppercase tracking-wider">{task.scheduledTime}</span>
                  </div>
                )}
                <div className="font-bold text-foreground mb-3 group-hover:text-primary transition-colors text-lg leading-tight">{task.title}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-border/50', areaColors[task.area])}>
                    {task.area}
                  </span>
                  <span className={cn('px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-border/50', statusColors[task.status])}>
                    {task.status}
                  </span>
                </div>
                {task.responsible.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground font-medium flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-primary/60" />
                    {task.responsible.join(', ')}
                  </div>
                )}
              </div>
            ))}
            {dayTasks.length === 0 && (
              <div className="text-center py-16 bg-card/50 rounded-xl border border-dashed border-border">
                <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-bold">No hay eventos para este día</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Calendar - 3 columns */}
      <div className="lg:col-span-3 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Calendario de Producción</h1>
            <p className="text-muted-foreground font-medium">Eventos programados - Archipiélago</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Selector */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 border border-border shadow-sm">
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-sm transition-all',
                  viewMode === 'month'
                    ? 'bg-card text-primary shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                )}
                title="Vista Mensual"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-sm transition-all',
                  viewMode === 'week'
                    ? 'bg-card text-primary shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                )}
                title="Vista Semanal"
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-sm transition-all',
                  viewMode === 'day'
                    ? 'bg-card text-primary shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                )}
                title="Vista Diaria"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {user?.role === 'admin' && (
              <>
                <button
                  onClick={handleSyncFromCalendar}
                  disabled={syncingFromCalendar || isLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-card text-foreground rounded-xl hover:bg-muted transition-all border border-border shadow-sm disabled:opacity-50 font-bold text-sm active:scale-95"
                  title="Sincronizar bidireccionalmente con Google Calendar"
                >
                  <RefreshCw className={cn("w-4 h-4 text-primary", (syncingFromCalendar || isLoading) ? "animate-spin" : "")} />
                  <span>
                    {(syncingFromCalendar || isLoading) ? 'Sincronizando...' : 'Sincronizar'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Evento
                </button>
              </>
            )}
          </div>
        </div>

        {syncMessage && (
          <div className="text-sm text-green-700 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20 font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
            {syncMessage}
          </div>
        )}
        {syncError && (
          <div className="text-sm text-red-700 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
            {syncError}
          </div>
        )}

        {/* Calendar Container */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-md">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handlePrevious}
              className="p-2.5 rounded-xl bg-muted border border-border hover:bg-card hover:shadow-md transition-all active:scale-90"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>

            <div className="flex items-center gap-6">
              <h2 className="text-3xl font-black text-foreground capitalize tracking-tight">{title}</h2>
              <button
                onClick={handleToday}
                className="px-4 py-1.5 text-xs font-black uppercase tracking-widest bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-all border border-primary/20"
              >
                Hoy
              </button>
            </div>

            <button
              onClick={handleNext}
              className="p-2.5 rounded-xl bg-muted border border-border hover:bg-card hover:shadow-md transition-all active:scale-90"
            >
              <ChevronRight className="w-6 h-6 text-foreground" />
            </button>
          </div>

          {/* Calendar Content */}
          <div className="min-h-[600px]">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5">Eventos Programados</div>
            <div className="text-3xl font-black text-primary">{scheduledTasks.length}</div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1.5">Tareas en Curso</div>
            <div className="text-3xl font-black text-foreground">{ongoingTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Sidebar - Ongoing Tasks by Department - 1 column */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-card rounded-2xl border border-border p-5 sticky top-6 shadow-md">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            En Curso por Área
          </h3>

          <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(ongoingByArea).map(([area, areaTasks]) => (
              <div key={area} className="space-y-3">
                <div className="flex items-center justify-between sticky top-0 bg-card py-2 z-10 border-b border-border/50">
                  <span className={cn('text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-border/50', areaColors[area as TaskArea])}>
                    {area}
                  </span>
                  <span className="text-xs font-black text-muted-foreground tabular-nums bg-muted rounded-full px-2 py-0.5">{areaTasks.length}</span>
                </div>
                <div className="grid gap-2.5">
                  {areaTasks.map(task => (
                    <div
                      key={task.id}
                      className="p-3 bg-muted/30 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/50 transition-all text-xs shadow-sm group"
                    >
                      <div className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-relaxed">{task.title}</div>
                      <div className="flex items-center gap-2">
                        <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider', statusColors[task.status])}>
                          {task.status}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{task.week}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(ongoingByArea).length === 0 && (
              <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-xl">
                <CheckSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-bold text-sm">No hay tareas en curso</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={async (task) => {
          if (selectedTask && !selectedTask.isGoogleEvent) {
            // Es una tarea interna existente: actualizar
            const exists = tasks.find(t => t.id === selectedTask.id);
            if (exists) {
              await updateTask(selectedTask.id, task);
            } else {
              // Fallback: si tiene ID pero no está en store (raro), intentar crearla
              await addTask(task);
            }
          } else {
            // Es una tarea nueva O un evento de Google (externo) que estamos "importando"
            // Al guardar, se convierte en una tarea interna nueva
            await addTask(task);
          }

          // La sincronización con Calendar ahora se hace automáticamente en el endpoint /api/tasks
          // Solo recargar tareas después de guardar
          await fetchTasks();
          setSelectedTask(null);
        }}
        onDelete={selectedTask ? async () => {
          // La eliminación de Calendar se hace automáticamente en el endpoint /api/tasks
          if (!selectedTask.isGoogleEvent) {
            await deleteTask(selectedTask.id);
          } else {
            // TODO: Manejar borrado de eventos externos si es necesario
            // Por seguridad, solo permitimos borrar tareas internas por ahora desde la UI
            alert("Solo se pueden eliminar tareas creadas en la aplicación.");
            return;
          }
          setIsModalOpen(false);
          setSelectedTask(null);
          await fetchTasks();
        } : undefined}
        initialData={selectedTask || undefined}
        defaultDate={currentDate.toISOString().split('T')[0]}
      />
    </div>
  );
}

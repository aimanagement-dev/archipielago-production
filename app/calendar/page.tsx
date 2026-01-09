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
type ContentType = 'all' | 'tasks' | 'events';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [syncingFromCalendar, setSyncingFromCalendar] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<TaskArea | 'Todas'>('Todas');

  const { tasks, addTask, updateTask, deleteTask, fetchCalendarEvents, events, isLoading, fetchTasks } = useStore();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const openTaskModal = (task: Task | null) => {
    if (!isAdmin) return;
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchTasks();
    fetchCalendarEvents();
  }, [fetchTasks, fetchCalendarEvents]);

  const scheduledTasks = useMemo(() => {
    // 1. Internal tasks
    const internalTasks = tasks.filter(t => t.isScheduled && t.scheduledDate);

    // 2. Map Google Events to Task-like structure for display
    const googleEvents = events.map(event => {
      const description = event.description || '';
      const hasPropSource = event.extendedProperties?.private?.source === 'arch-pm';
      const hasTaskIdProp = !!event.extendedProperties?.private?.taskId;
      const hasTaskIdDesc = /TaskID:\s*(.+)/.test(description);

      const isInternal = hasPropSource || hasTaskIdProp || hasTaskIdDesc;

      if (isInternal) return null;

      const start = event.start?.dateTime || event.start?.date;
      if (!start) return null;

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
        isGoogleEvent: true,
      } as unknown as Task;
    }).filter(Boolean) as Task[];

    let result: Task[] = [];
    if (contentType === 'all') {
      result = [...internalTasks, ...googleEvents];
    } else if (contentType === 'tasks') {
      result = internalTasks;
    } else {
      result = googleEvents;
    }
    return result;
  }, [tasks, events, contentType]);

  const ongoingTasks = useMemo(() =>
    tasks.filter(t => !t.isScheduled || !t.scheduledDate),
    [tasks]
  );

  const ongoingByArea = useMemo(() => {
    const groups: Partial<Record<TaskArea, Task[]>> = {};
    const tasksToShow = ongoingTasks.filter(task => {
      return (!task.isScheduled || !task.scheduledDate) && task.status !== 'Completado';
    });

    tasksToShow.forEach(task => {
      if (!groups[task.area]) {
        groups[task.area] = [];
      }
      groups[task.area]!.push(task);
    });

    return groups;
  }, [ongoingTasks]);

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
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime.localeCompare(b.scheduledTime);
      }
      return 0;
    });
  };

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

  const handleSyncFromCalendar = async () => {
    setSyncingFromCalendar(true);
    setSyncMessage(null);
    setSyncError(null);

    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 0).toISOString();

      const responseFromCalendar = await fetch(
        `/api/google/calendar/sync?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&updateSheets=true`,
        { method: 'GET' }
      );

      const dataFromCalendar = await responseFromCalendar.json();

      if (!responseFromCalendar.ok || !dataFromCalendar.ok) {
        throw new Error(dataFromCalendar.error || 'No se pudo sincronizar desde Google Calendar.');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchTasks();
      await new Promise(resolve => setTimeout(resolve, 500));

      const storeState = useStore.getState();
      const updatedTasks = storeState.tasks;

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
      }

      const parts = [];
      if (dataFromCalendar.tasksFound > 0) parts.push(`${dataFromCalendar.tasksFound} eventos leídos`);
      if (dataFromCalendar.updated > 0) parts.push(`${dataFromCalendar.updated} actualizados en Sheets`);
      if (dataFromCalendar.created > 0) parts.push(`${dataFromCalendar.created} creados en Sheets`);
      if (dataToCalendar) {
        if (dataToCalendar.created && dataToCalendar.created > 0) parts.push(`${dataToCalendar.created} eventos creados`);
        if (dataToCalendar.updated && dataToCalendar.updated > 0) parts.push(`${dataToCalendar.updated} eventos actualizados`);
      }

      setSyncMessage(`✅ Sincronización completa: ${parts.join(', ')}.`);
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al sincronizar con Google Calendar.';
      setSyncError(errorMessage);
    } finally {
      setSyncingFromCalendar(false);
    }
  };

  const handleImportExcel = async () => {
    if (!confirm('¿Estás seguro de que deseas importar las tareas del Excel? Esto podría duplicar tareas si ya existen.')) return;

    setSyncingFromCalendar(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/admin/import-excel', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`✅ Importación completada: ${data.count} tareas importadas.`);
        await fetchTasks();
      } else {
        setSyncError(`Error: ${data.error}`);
      }
    } catch (e) {
      setSyncError('Error de conexión al importar Excel.');
    } finally {
      setSyncingFromCalendar(false);
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const firstDayOfWeek = monthStart.getDay();

    return (
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center py-3 text-sm font-black text-muted-foreground uppercase tracking-widest">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
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
                        'text-[9px] px-1.5 py-1 font-bold truncate flex items-center gap-1 transition-all',
                        task.isGoogleEvent
                          ? 'rounded-full border border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                          : cn('rounded-md border border-border/50', areaColors[task.area])
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
                    onClick={() => openTaskModal(task)}
                    className={cn(
                      "p-3 border shadow-sm hover:shadow-md cursor-pointer transition-all group",
                      task.isGoogleEvent
                        ? "rounded-2xl border-blue-200 bg-blue-50 hover:border-blue-300"
                        : "rounded-xl bg-card border-border hover:border-primary/40"
                    )}
                  >
                    {task.scheduledTime && (
                      <div className={cn("flex items-center gap-1.5 text-[10px] font-black mb-1.5 uppercase tracking-wider", task.isGoogleEvent ? "text-blue-600" : "text-primary")}>
                        <Clock className="w-3 h-3" />
                        {task.scheduledTime}
                      </div>
                    )}
                    <div className={cn("font-bold text-xs mb-2 line-clamp-3 transition-colors", task.isGoogleEvent ? "text-blue-900" : "text-foreground group-hover:text-primary")}>{task.title}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-border/50', areaColors[task.area])}>
                        {task.area}
                      </span>
                      {!task.isGoogleEvent && (
                        <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-border/50', statusColors[task.status])}>
                          {task.status}
                        </span>
                      )}
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

  const renderDayView = () => {
    const dayTasks = getTasksForDay(currentDate);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-muted/10 rounded-xl p-6 border border-border shadow-inner">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Timeline del Día</h3>
            {user?.role === 'admin' && (
              <button
                onClick={() => openTaskModal(null)}
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
                        onClick={() => openTaskModal(task)}
                        className={cn(
                          'mb-3 p-3 border cursor-pointer shadow-sm transition-all group',
                          task.isGoogleEvent
                            ? "rounded-2xl border-blue-200 bg-blue-50 hover:border-blue-300"
                            : "rounded-xl bg-card border-border hover:border-primary/40 hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Clock className={cn("w-3.5 h-3.5", task.isGoogleEvent ? "text-blue-600" : "text-primary")} />
                          <span className={cn("text-xs font-black uppercase tracking-wider", task.isGoogleEvent ? "text-blue-600" : "text-primary")}>{task.scheduledTime}</span>
                        </div>
                        <div className={cn("font-bold text-sm transition-colors", task.isGoogleEvent ? "text-blue-900" : "text-foreground group-hover:text-primary")}>{task.title}</div>
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

        <div className="bg-muted/10 rounded-xl p-6 border border-border shadow-inner">
          <h3 className="text-lg font-bold text-foreground mb-6">
            Eventos del Día ({dayTasks.length})
          </h3>
          <div className="space-y-4">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => openTaskModal(task)}
                className={cn(
                  "p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer group",
                  task.isGoogleEvent
                    ? "border-blue-200 bg-blue-50/50 hover:border-blue-300"
                    : "bg-card border-border hover:border-primary/40"
                )}
              >
                {task.scheduledTime && (
                  <div className="flex items-center gap-2 mb-2.5">
                    <Clock className={cn("w-4 h-4", task.isGoogleEvent ? "text-blue-600" : "text-primary")} />
                    <span className={cn("text-sm font-black uppercase tracking-wider", task.isGoogleEvent ? "text-blue-600" : "text-primary")}>{task.scheduledTime}</span>
                  </div>
                )}
                <div className={cn("font-bold mb-3 transition-colors text-lg leading-tight", task.isGoogleEvent ? "text-blue-900" : "text-foreground group-hover:text-primary")}>{task.title}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-border/50', areaColors[task.area])}>
                    {task.area}
                  </span>
                  {!task.isGoogleEvent && (
                    <span className={cn('px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-border/50', statusColors[task.status])}>
                      {task.status}
                    </span>
                  )}
                </div>
                {task.responsible.length > 0 && !task.isGoogleEvent && (
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
      <div className="lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Calendario</h1>
            <p className="text-muted-foreground font-medium">Gestión de Tareas y Eventos</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-muted rounded-xl p-1 border border-border/50">
              <button
                onClick={() => setContentType('all')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                  contentType === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Todo
              </button>
              <button
                onClick={() => setContentType('tasks')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5',
                  contentType === 'tasks' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Tareas
              </button>
              <button
                onClick={() => setContentType('events')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5',
                  contentType === 'events' ? 'bg-card text-blue-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                Eventos
              </button>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 border border-border shadow-sm">
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  'px-3 sm:px-3.5 py-2 rounded-lg text-sm transition-all',
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
                  'px-3 sm:px-3.5 py-2 rounded-lg text-sm transition-all',
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
                  'px-3 sm:px-3.5 py-2 rounded-lg text-sm transition-all',
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
              <button
                onClick={handleImportExcel}
                disabled={syncingFromCalendar}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 border border-emerald-600/20 rounded-xl transition-all text-xs font-bold uppercase tracking-wider shrink-0"
                title="Importar Excel de Proyecto"
              >
                <RefreshCw className={cn("w-4 h-4", syncingFromCalendar && "animate-spin")} />
                Importar Excel
              </button>
            )}
          </div>
        </div>

        {syncMessage && (
          <div className="text-sm text-green-700 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20 font-bold shadow-sm animate-in fade-in slide-in-from-top-2 shrink-0">
            {syncMessage}
          </div>
        )}
        {syncError && (
          <div className="text-sm text-red-700 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 font-bold shadow-sm animate-in fade-in slide-in-from-top-2 shrink-0">
            {syncError}
          </div>
        )}

        <div className="flex flex-col gap-6 flex-1">
          {user?.role === 'admin' && (
            <div className="flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={handleSyncFromCalendar}
                disabled={syncingFromCalendar || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-card text-foreground rounded-xl hover:bg-muted transition-all border border-border shadow-sm disabled:opacity-50 font-bold text-xs active:scale-95"
                title="Sincronizar Manualmente"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 text-primary", (syncingFromCalendar || isLoading) ? "animate-spin" : "")} />
                <span>
                  {(syncingFromCalendar || isLoading) ? 'SINC...' : 'SYNC'}
                </span>
              </button>
              <button
                onClick={() => openTaskModal(null)}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-lg active:scale-95 uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                Nuevo Evento
              </button>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border p-6 shadow-md flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <button onClick={handlePrevious} className="p-2 rounded-xl bg-muted border border-border hover:bg-card transition-all"><ChevronLeft className="w-5 h-5" /></button>
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-foreground capitalize">{title}</h2>
                <button onClick={handleToday} className="px-3 py-1 text-[10px] font-black uppercase bg-primary/10 text-primary rounded-full border border-primary/20 hover:bg-primary/20">Hoy</button>
              </div>
              <button onClick={handleNext} className="p-2 rounded-xl bg-muted border border-border hover:bg-card transition-all"><ChevronRight className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 min-h-[500px]">
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 shrink-0">
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
      </div>

      <div className="lg:col-span-1 h-full overflow-hidden flex flex-col">
        <div className="bg-card rounded-2xl border border-border p-5 h-full flex flex-col shadow-md">
          <div className="mb-4 shrink-0 space-y-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              En Curso por Área
            </h3>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value as TaskArea | 'Todas')}
              className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground focus:outline-none focus:border-primary/50 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <option value="Todas">Todas las Áreas</option>
              {['Guión', 'Técnico', 'Casting', 'Reporting', 'Pipeline', 'Post-producción', 'Investigación', 'Pre-visualización', 'Producción', 'Planificación', 'Crew'].map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            {Object.entries(ongoingByArea)
              .filter(([area]) => selectedArea === 'Todas' || area === selectedArea)
              .map(([area, areaTasks]) => (
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
                        onClick={() => openTaskModal(task)}
                        className="p-3 bg-muted/30 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/50 transition-all text-xs shadow-sm cursor-pointer group"
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

            {Object.keys(ongoingByArea).filter(area => selectedArea === 'Todas' || area === selectedArea).length === 0 && (
              <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-xl">
                <CheckSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-bold text-sm">
                  {selectedArea === 'Todas' ? 'No hay tareas en curso' : `No hay tareas de ${selectedArea}`}
                </p>
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
            const exists = tasks.find(t => t.id === selectedTask.id);
            if (exists) {
              await updateTask(selectedTask.id, task);
            } else {
              await addTask(task);
            }
          } else {
            await addTask(task);
          }
          await fetchTasks();
          setSelectedTask(null);
        }}
        onDelete={selectedTask ? async () => {
          if (!selectedTask.isGoogleEvent) {
            await deleteTask(selectedTask.id);
          } else {
            alert("Solo se pueden eliminar tareas internas.");
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

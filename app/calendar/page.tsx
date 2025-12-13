'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, LayoutGrid, List, Columns, Clock, CheckSquare, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, isSameDay, isToday, isSameMonth, parseISO } from 'date-fns';
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

  const { tasks, gates, addTask, updateTask, deleteTask, isLoading, fetchTasks } = useStore();
  const { user } = useAuth();

  // Cargar tareas al montar el componente
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Separate scheduled tasks from ongoing tasks
  const scheduledTasks = useMemo(() =>
    tasks.filter(t => t.isScheduled && t.scheduledDate),
    [tasks]
  );

  const ongoingTasks = useMemo(() =>
    tasks.filter(t => !t.isScheduled || !t.scheduledDate),
    [tasks]
  );

  // Group ongoing tasks by area
  const ongoingByArea = useMemo(() => {
    const groups: Partial<Record<TaskArea, Task[]>> = {};
    ongoingTasks.forEach(task => {
      if (!groups[task.area]) {
        groups[task.area] = [];
      }
      groups[task.area]!.push(task);
    });
    return groups;
  }, [ongoingTasks]);

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
          <div key={day} className="text-center py-3 text-sm font-bold text-muted-foreground uppercase tracking-wider">
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
                'aspect-square p-2 rounded-lg border transition-all cursor-pointer',
                isCurrentDay
                  ? 'bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 border-white/5 hover:border-primary/20 hover:bg-white/10'
              )}
            >
              <div className="h-full flex flex-col">
                <div className={cn(
                  'text-sm font-medium mb-1 flex items-center justify-between',
                  isCurrentDay ? 'text-primary' : 'text-foreground'
                )}>
                  <span>{format(day, 'd')}</span>
                  {dayTasks.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'text-[8px] px-1.5 py-1 rounded truncate flex items-center gap-1',
                        areaColors[task.area]
                      )}
                      title={`${task.scheduledTime || ''} - ${task.title}`}
                    >
                      {task.scheduledTime && (
                        <Clock className="w-2 h-2 flex-shrink-0" />
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
                'min-h-[500px] p-3 rounded-lg border transition-all',
                isCurrentDay
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-white/5 border-white/5'
              )}
            >
              <div className="text-center mb-3 pb-3 border-b border-white/10">
                <div className="text-xs text-muted-foreground uppercase">
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div className={cn(
                  'text-2xl font-bold',
                  isCurrentDay ? 'text-primary' : 'text-foreground'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {dayTasks.length} eventos
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
                    className="p-2 rounded-lg bg-white/10 border border-white/10 hover:border-primary/30 cursor-pointer transition-all"
                  >
                    {task.scheduledTime && (
                      <div className="flex items-center gap-1 text-[10px] text-primary font-bold mb-1">
                        <Clock className="w-3 h-3" />
                        {task.scheduledTime}
                      </div>
                    )}
                    <div className="font-medium text-foreground text-xs mb-1 line-clamp-2">{task.title}</div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px]', areaColors[task.area])}>
                        {task.area}
                      </span>
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px]', statusColors[task.status])}>
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
        <div className="bg-white/5 rounded-lg p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Timeline del Día</h3>
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Tarea
              </button>
            )}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 24 }).map((_, hour) => {
              const hourString = hour.toString().padStart(2, '0');
              const tasksInHour = dayTasks.filter(t =>
                t.scheduledTime && t.scheduledTime.startsWith(hourString)
              );

              return (
                <div key={hour} className="flex items-start gap-3">
                  <div className="w-16 text-sm font-medium text-muted-foreground pt-1">
                    {hourString}:00
                  </div>
                  <div className="flex-1 min-h-[50px] border-l-2 border-white/10 pl-4">
                    {tasksInHour.map(task => (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsModalOpen(true);
                        }}
                        className={cn(
                          'mb-2 p-2 rounded-lg border cursor-pointer',
                          'bg-white/5 border-white/10 hover:border-primary/30 transition-all'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3 h-3 text-primary" />
                          <span className="text-xs font-bold text-primary">{task.scheduledTime}</span>
                        </div>
                        <div className="font-medium text-sm text-foreground">{task.title}</div>
                        <div className="flex gap-1 mt-1">
                          <span className={cn('px-1.5 py-0.5 rounded text-[9px]', areaColors[task.area])}>
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
        <div className="bg-white/5 rounded-lg p-6 border border-white/5">
          <h3 className="text-lg font-bold text-foreground mb-4">
            Eventos del Día ({dayTasks.length})
          </h3>
          <div className="space-y-3">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task);
                  setIsModalOpen(true);
                }}
                className="p-3 bg-white/5 border border-white/5 rounded-lg hover:border-primary/30 transition-all cursor-pointer"
              >
                {task.scheduledTime && (
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">{task.scheduledTime}</span>
                  </div>
                )}
                <div className="font-medium text-foreground mb-2">{task.title}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('px-2 py-0.5 rounded text-[10px]', areaColors[task.area])}>
                    {task.area}
                  </span>
                  <span className={cn('px-2 py-0.5 rounded text-[10px]', statusColors[task.status])}>
                    {task.status}
                  </span>
                </div>
                {task.responsible.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    👤 {task.responsible.join(', ')}
                  </div>
                )}
              </div>
            ))}
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
            <h1 className="text-3xl font-bold text-foreground">Calendario de Producción</h1>
            <p className="text-muted-foreground">Eventos programados - Archipiélago</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  'px-3 py-1.5 rounded text-sm font-medium transition-all',
                  viewMode === 'month'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'px-3 py-1.5 rounded text-sm font-medium transition-all',
                  viewMode === 'week'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  'px-3 py-1.5 rounded text-sm font-medium transition-all',
                  viewMode === 'day'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {user?.role === 'admin' && (
              <>
                <button
                  onClick={handleSyncFromCalendar}
                  disabled={syncingFromCalendar || isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 text-foreground rounded-lg hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50"
                  title="Sincronizar bidireccionalmente con Google Calendar"
                >
                  <RefreshCw className={cn("w-4 h-4", (syncingFromCalendar || isLoading) ? "animate-spin" : "")} />
                  <span className="text-sm font-medium">
                    {(syncingFromCalendar || isLoading) ? 'Sincronizando...' : 'Sincronizar Calendar'}
                  </span>
                </button>
                {syncMessage && (
                  <div className="text-sm text-green-400 bg-green-400/10 px-3 py-1 rounded-lg max-w-md">
                    {syncMessage}
                  </div>
                )}
                {syncError && (
                  <div className="text-sm text-red-400 bg-red-400/10 px-3 py-1 rounded-lg max-w-md">
                    {syncError}
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  <Plus className="w-5 h-5" />
                  Evento
                </button>
              </>
            )}
          </div>
        </div>

        {/* Calendar Container */}
        <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-foreground capitalize">{title}</h2>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                Hoy
              </button>
            </div>

            <button
              onClick={handleNext}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Calendar Content */}
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-4">
            <div className="text-xs text-muted-foreground mb-1">Eventos Programados</div>
            <div className="text-2xl font-bold text-primary">{scheduledTasks.length}</div>
          </div>
          <div className="bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-4">
            <div className="text-xs text-muted-foreground mb-1">Tareas en Curso</div>
            <div className="text-2xl font-bold text-foreground">{ongoingTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Sidebar - Ongoing Tasks by Department - 1 column */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-4 sticky top-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            En Curso por Área
          </h3>

          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {Object.entries(ongoingByArea).map(([area, areaTasks]) => (
              <div key={area} className="space-y-2">
                <div className="flex items-center justify-between sticky top-0 bg-card/40 backdrop-blur-sm py-2">
                  <span className={cn('text-sm font-bold px-2 py-1 rounded', areaColors[area as TaskArea])}>
                    {area}
                  </span>
                  <span className="text-xs text-muted-foreground">{areaTasks.length}</span>
                </div>
                {areaTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-2 bg-white/5 border border-white/5 rounded-lg hover:border-primary/20 transition-all text-xs"
                  >
                    <div className="font-medium text-foreground mb-1 line-clamp-2">{task.title}</div>
                    <div className="flex items-center gap-1">
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px]', statusColors[task.status])}>
                        {task.status}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{task.week}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {Object.keys(ongoingByArea).length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay tareas en curso
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
          let taskId: string;
          
          if (selectedTask) {
            taskId = selectedTask.id;
            await updateTask(selectedTask.id, task);
          } else {
            // addTask genera un ID nuevo, necesitamos obtenerlo después
            await addTask(task);
            // Esperar un momento y obtener el ID de la tarea recién creada
            await new Promise(resolve => setTimeout(resolve, 100));
            const updatedTasks = useStore.getState().tasks;
            const newTask = updatedTasks.find(t => 
              t.title === task.title && 
              t.scheduledDate === task.scheduledDate
            );
            taskId = newTask?.id || `temp-${Date.now()}`;
          }
          
          // La sincronización con Calendar ahora se hace automáticamente en el endpoint /api/tasks
          // Solo recargar tareas después de guardar
          await fetchTasks();
          setSelectedTask(null);
        }}
        onDelete={selectedTask ? async () => {
          // La eliminación de Calendar se hace automáticamente en el endpoint /api/tasks
          await deleteTask(selectedTask.id);
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

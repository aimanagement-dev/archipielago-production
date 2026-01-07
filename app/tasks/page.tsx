'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import TaskList from '@/components/Tasks/TaskList';
import TaskFilters from '@/components/Tasks/TaskFilters';
import TaskModal from '@/components/Tasks/TaskModal';
import { Plus, LayoutGrid, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type GroupBy = 'none' | 'month' | 'week' | 'area' | 'status';

export default function TasksPage() {
  const [filters, setFilters] = useState({ area: 'all', status: 'all', month: 'all' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [syncing, setSyncing] = useState(false);
  const [syncingFromCalendar, setSyncingFromCalendar] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { tasks, addTask, updateTask, deleteTask, fetchTasks } = useStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter(task => {
    if (filters.area !== 'all' && task.area !== filters.area) return false;
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.month !== 'all' && task.month !== filters.month) return false;
    return true;
  });

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      deleteTask(id);
    }
  };

  const handleSave = async (taskData: Omit<Task, 'id'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
      setIsModalOpen(false);
      setEditingTask(undefined);
    } else {
      // Para nuevas tareas, guardar pero NO cerrar el modal todavía
      // El TaskModal manejará el cierre después de mostrar la notificación
      await addTask(taskData);
      // NO cerrar aquí - TaskModal manejará el flujo de notificación y cierre
      // Si no hay responsables, TaskModal cerrará automáticamente
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  // Sincronizar desde la app hacia Google Calendar
  const handleSyncToCalendar = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setSyncError(null);

    const payload = tasks
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

    if (payload.length === 0) {
      setSyncMessage('No hay tareas programadas para enviar a Google Calendar.');
      setSyncing(false);
      return;
    }

    try {
      const response = await fetch('/api/google/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: payload }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo sincronizar con Google Calendar.');
      }

      const parts = [];
      if (data.created > 0) parts.push(`${data.created} creadas`);
      if (data.updated > 0) parts.push(`${data.updated} actualizadas`);
      if (data.deleted > 0) parts.push(`${data.deleted} eliminadas`);
      if (data.skipped > 0) parts.push(`${data.skipped} omitidas`);

      setSyncMessage(
        `✅ Sincronización hacia Calendar completa: ${parts.join(', ')}.`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al sincronizar con Google Calendar.';
      setSyncError(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  // Sincronizar desde Google Calendar hacia la app
  const handleSyncFromCalendar = async () => {
    setSyncingFromCalendar(true);
    setSyncMessage(null);
    setSyncError(null);

    try {
      // Calcular rango de fechas (últimos 3 meses y próximos 6 meses)
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 0).toISOString();

      const response = await fetch(
        `/api/google/calendar/sync?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&updateSheets=true`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo sincronizar desde Google Calendar.');
      }

      const parts = [];
      if (data.tasksFound > 0) parts.push(`${data.tasksFound} eventos encontrados`);
      if (data.updated > 0) parts.push(`${data.updated} actualizados`);
      if (data.created > 0) parts.push(`${data.created} creados`);

      setSyncMessage(
        `✅ Sincronización desde Calendar completa: ${parts.join(', ')}.`
      );

      // Recargar tareas desde Sheets
      await fetchTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al sincronizar desde Google Calendar.';
      setSyncError(errorMessage);
    } finally {
      setSyncingFromCalendar(false);
    }
  };

  // Group tasks
  const groupedTasks = (() => {
    if (groupBy === 'none') {
      return { 'Todas las tareas': filteredTasks };
    }

    const groups: Record<string, Task[]> = {};

    filteredTasks.forEach(task => {
      let key = '';

      if (groupBy === 'month') {
        key = task.month;
      } else if (groupBy === 'week') {
        key = task.week;
      } else if (groupBy === 'area') {
        key = task.area;
      } else if (groupBy === 'status') {
        key = task.status;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);
    });

    return groups;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Tareas</h1>
          <p className="text-muted-foreground">Organiza y monitorea todas las tareas del proyecto</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncToCalendar}
              disabled={syncing}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg font-medium border border-border transition-colors',
                syncing
                  ? 'bg-muted text-muted-foreground cursor-not-allowed font-bold'
                  : 'bg-muted/50 hover:bg-muted text-foreground'
              )}
              title="Sincronizar hacia Google Calendar (App → Calendar)"
            >
              <ArrowUp className="w-4 h-4" />
              {syncing ? 'Sincronizando...' : '→ Calendar'}
            </button>
            <button
              onClick={handleSyncFromCalendar}
              disabled={syncingFromCalendar}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg font-medium border border-border transition-colors',
                syncingFromCalendar
                  ? 'bg-muted text-muted-foreground cursor-not-allowed font-bold'
                  : 'bg-muted/50 hover:bg-muted text-foreground'
              )}
              title="Sincronizar desde Google Calendar (Calendar → App)"
            >
              <ArrowDown className="w-4 h-4" />
              {syncingFromCalendar ? 'Sincronizando...' : '← Calendar'}
            </button>
          </div>
          {syncMessage && (
            <div className="text-sm text-green-700 bg-emerald-500/10 px-3 py-1 rounded-lg font-semibold border border-emerald-500/20">
              {syncMessage}
            </div>
          )}
          {syncError && (
            <div className="text-sm text-red-700 bg-red-500/10 px-3 py-1 rounded-lg font-semibold border border-red-500/20">
              {syncError}
            </div>
          )}

          <button
            onClick={() => {
              setEditingTask(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <Plus className="w-5 h-5" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* View Options */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">Agrupar por:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setGroupBy('none')}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-bold transition-all uppercase tracking-wider',
                  groupBy === 'none'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                Sin agrupar
              </button>
              <button
                onClick={() => setGroupBy('month')}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-bold transition-all uppercase tracking-wider',
                  groupBy === 'month'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                Mes
              </button>
              <button
                onClick={() => setGroupBy('week')}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-bold transition-all uppercase tracking-wider',
                  groupBy === 'week'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                Semana
              </button>
              <button
                onClick={() => setGroupBy('area')}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-bold transition-all uppercase tracking-wider',
                  groupBy === 'area'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                Área
              </button>
              <button
                onClick={() => setGroupBy('status')}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-bold transition-all uppercase tracking-wider',
                  groupBy === 'status'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                Estado
              </button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground font-medium">
            Total: <span className="font-bold text-foreground">{filteredTasks.length}</span> tareas
          </div>
        </div>
      </div>

      {(syncMessage || syncError) && (
        <div
          className={cn(
            'rounded-lg border px-4 py-3 text-sm font-medium',
            syncError ? 'border-red-500/40 bg-red-500/10 text-red-700' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
          )}
        >
          {syncError || syncMessage}
        </div>
      )}

      <TaskFilters filters={filters} setFilters={setFilters} />

      {/* Grouped Tasks */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                {groupBy === 'month' && <Calendar className="w-5 h-5 text-primary" />}
                {groupName}
                <span className="text-sm font-normal text-muted-foreground">
                  ({groupTasks.length})
                </span>
              </h2>
            </div>

            <TaskList
              tasks={groupTasks}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        ))}

        {Object.keys(groupedTasks).length === 0 && (
          <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-12 text-center">
            <LayoutGrid className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No hay tareas que coincidan con los filtros</p>
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialData={editingTask}
      />
    </div>
  );
}

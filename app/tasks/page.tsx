'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import TaskList from '@/components/Tasks/TaskList';
import TaskFilters from '@/components/Tasks/TaskFilters';
import TaskModal from '@/components/Tasks/TaskModal';
import { Plus, LayoutGrid, List, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

type GroupBy = 'none' | 'month' | 'week' | 'area' | 'status';

export default function TasksPage() {
  const [filters, setFilters] = useState({ area: 'all', status: 'all', month: 'all' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [groupBy, setGroupBy] = useState<GroupBy>('month');

  const { tasks, addTask, updateTask, deleteTask } = useStore();

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

  const handleSave = (taskData: Omit<Task, 'id'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
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

      {/* View Options */}
      <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Agrupar por:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setGroupBy('none')}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-all',
                  groupBy === 'none'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                Sin agrupar
              </button>
              <button
                onClick={() => setGroupBy('month')}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-all',
                  groupBy === 'month'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                Mes
              </button>
              <button
                onClick={() => setGroupBy('week')}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-all',
                  groupBy === 'week'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                Semana
              </button>
              <button
                onClick={() => setGroupBy('area')}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-all',
                  groupBy === 'area'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                Área
              </button>
              <button
                onClick={() => setGroupBy('status')}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-all',
                  groupBy === 'status'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                Estado
              </button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Total: <span className="font-bold text-foreground">{filteredTasks.length}</span> tareas
          </div>
        </div>
      </div>

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

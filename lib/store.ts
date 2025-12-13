import { create } from 'zustand';
import { Task, TeamMember, Gate, CalendarEvent, Stats } from './types';
import { generateId } from './utils';
import tasksData from '@/data/tasks.json';
import teamData from '@/data/team.json';
import gatesData from '@/data/gates.json';

interface AppState {
  tasks: Task[];
  team: TeamMember[];
  gates: Gate[];
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;

  // Task actions
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  fetchTasks: () => Promise<void>;

  // Gate actions
  addGate: (gate: Omit<Gate, 'id'>) => void;
  updateGate: (id: string, updates: Partial<Gate>) => void;
  deleteGate: (id: string) => void;

  // Team actions
  addMember: (member: Omit<TeamMember, 'id'>) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;

  // Computed
  getStats: () => Stats;
  getTasksByMonth: (month: string) => Task[];
  getTasksByArea: (area: string) => Task[];
  getTasksByStatus: (status: string) => Task[];
  syncCalendar: () => Promise<void>;
}

import { persist } from 'zustand/middleware';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [], // Start empty, fetch from API
      team: teamData as TeamMember[],
      gates: gatesData as Gate[],
      events: [],
      isLoading: false,
      error: null,

      fetchTasks: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/tasks');
          if (response.ok) {
            const data = await response.json();
            // Si recibimos tareas válidas, actualizamos
            if (data.tasks && Array.isArray(data.tasks)) {
              set({ tasks: data.tasks, isLoading: false, error: null });
            } else {
              // Si la respuesta es válida pero no tiene tareas (ej. hoja vacía),
              // respetamos eso, pero podríamos loguearlo.
              set({ tasks: [], isLoading: false, error: null });
            }
          } else {
            // Si la API falla (401, 500), NO borramos las tareas existentes del estado
            // Solo marcamos el error y dejamos de cargar
            console.warn('Failed to fetch from API');
            set({
              isLoading: false,
              error: 'No se pudo sincronizar con Google Sheets. Mostrando datos locales.'
            });
            // Opcional: Si no hay tareas cargadas, podríamos cargar mocks
            if (get().tasks.length === 0) {
              set({ tasks: tasksData as Task[] });
            }
          }
        } catch (error) {
          console.error('Error fetching tasks:', error);
          set({
            isLoading: false,
            error: 'Error de conexión. Mostrando datos locales.'
          });
          // No borramos tareas existentes
        }
      },

      addTask: async (task) => {
        // Generar ID siempre (task es Omit<Task, "id">)
        const newTask = { ...task, id: generateId() };
        const previousTasks = get().tasks;

        // Optimistic update
        set((state) => ({
          tasks: [...state.tasks, newTask]
        }));

        try {
          const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.details || 'Failed to sync task to Sheets');
          }

          // Recargar tareas después de crear para asegurar sincronización
          const { fetchTasks } = get();
          setTimeout(() => fetchTasks(), 500);
        } catch (error) {
          console.error('Failed to sync task to Sheets:', error);
          // NO revertir el optimistic update - mantener la tarea en la UI
          // El usuario puede intentar sincronizar manualmente después
          set({ error: `Error al sincronizar la tarea: ${error instanceof Error ? error.message : 'Unknown error'}` });
          // No lanzar el error para que la UI no se rompa
        }
      },

      updateTask: async (id, updates) => {
        const currentTask = get().tasks.find(t => t.id === id);
        if (!currentTask) return;

        const updatedTask = { ...currentTask, ...updates };
        const previousTasks = get().tasks;

        // Optimistic update
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
        }));

        try {
          const response = await fetch('/api/tasks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTask),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.details || 'Failed to update task in Sheets');
          }

          // Recargar tareas después de actualizar para asegurar sincronización
          const { fetchTasks } = get();
          setTimeout(() => fetchTasks(), 500);
        } catch (error) {
          console.error('Failed to sync task update to Sheets:', error);
          // NO revertir - mantener los cambios en la UI
          set({ error: `Error al actualizar la tarea: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      },

      deleteTask: async (id) => {
        const previousTasks = get().tasks;

        // Optimistic update
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== id)
        }));

        try {
          const response = await fetch(`/api/tasks?id=${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete task from Sheets');
          }
        } catch (error) {
          console.error('Failed to sync task deletion to Sheets:', error);
          // Revert optimistic update on error
          set({ tasks: previousTasks });
        }
      },

      updateGate: (id, updates) => set((state) => ({
        gates: state.gates.map(g => g.id === id ? { ...g, ...updates } : g)
      })),

      addGate: (gate) => set((state) => ({
        gates: [...state.gates, { ...gate, id: generateId() }]
      })),

      deleteGate: (id) => set((state) => ({
        gates: state.gates.filter(g => g.id !== id)
      })),

      addMember: (member) => set((state) => ({
        team: [...state.team, { ...member, id: generateId() }]
      })),

      updateMember: (id, updates) => set((state) => ({
        team: state.team.map(m => m.id === id ? { ...m, ...updates } : m)
      })),

      deleteMember: (id) => set((state) => ({
        team: state.team.filter(m => m.id !== id)
      })),

      getStats: () => {
        const { tasks, gates } = get();
        return {
          totalTasks: tasks.length,
          completed: tasks.filter(t => t.status === 'Completado').length,
          inProgress: tasks.filter(t => t.status === 'En Progreso').length,
          pending: tasks.filter(t => t.status === 'Pendiente').length,
          blocked: tasks.filter(t => t.status === 'Bloqueado').length,
          gatesCompleted: gates.filter(g => g.status === 'Aprobado').length,
          totalGates: gates.length,
        };
      },

      getTasksByMonth: (month) => {
        return get().tasks.filter(t => t.month === month);
      },

      getTasksByArea: (area) => {
        return get().tasks.filter(t => t.area === area);
      },

      getTasksByStatus: (status) => {
        return get().tasks.filter(t => t.status === status);
      },

      syncCalendar: async () => {
        const { tasks } = get();
        set({ isLoading: true });
        try {
          const response = await fetch('/api/google/calendar/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error syncing calendar');
          }

          set({ isLoading: false });
          // Podríamos mostrar un toast de éxito aquí si tuviéramos un sistema de notificaciones
        } catch (error) {
          console.error('Error syncing calendar:', error);
          set({
            isLoading: false,
            error: `Error al sincronizar calendario: ${error instanceof Error ? error.message : 'Unknown'}`
          });
        }
      },
    }),
    {
      name: 'arch-pm-storage',
      partialize: (state) => ({
        // Solo persistir team y gates, NO tasks
        // Las tasks siempre vienen de Google Sheets
        team: state.team,
        gates: state.gates,
        events: state.events,
      }),
    }
  )
);

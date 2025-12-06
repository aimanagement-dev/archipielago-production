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
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
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
            throw new Error('Failed to sync task to Sheets');
          }
        } catch (error) {
          console.error('Failed to sync task to Sheets:', error);
          // Revert optimistic update on error
          set({ tasks: previousTasks });
          set({ error: 'Error al sincronizar la tarea. Por favor, inténtalo de nuevo.' });
          throw error;
        }
      },

      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),

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
    }),
    {
      name: 'arch-pm-storage',
    }
  )
);

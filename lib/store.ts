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

  // Task actions
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

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
      tasks: tasksData as Task[],
      team: teamData as TeamMember[],
      gates: gatesData as Gate[],
      events: [],

      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, { ...task, id: generateId() }]
      })),

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

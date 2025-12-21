import { create } from 'zustand';
import { Task, TeamMember, Gate, CalendarEvent, Stats, Subscription, Expense } from './types';
import { generateId } from './utils';
import tasksData from '@/data/tasks.json';
import teamData from '@/data/team.json';
import gatesData from '@/data/gates.json';

interface AppState {
  tasks: Task[];
  team: TeamMember[];
  gates: Gate[];
  events: CalendarEvent[];

  // Finance State
  finance: {
    subscriptions: Subscription[];
    expenses: Expense[];
  };

  isLoading: boolean;
  error: string | null;

  // Task actions
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchTeam: () => Promise<void>;

  // Gate actions
  addGate: (gate: Omit<Gate, 'id'>) => void;
  updateGate: (id: string, updates: Partial<Gate>) => void;
  deleteGate: (id: string) => void;

  // Team actions
  addMember: (member: Omit<TeamMember, 'id'>) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;

  // Finance Actions
  fetchFinance: () => Promise<void>;
  addTransaction: (type: 'subscription' | 'expense', data: any) => Promise<void>;

  // Computed
  getStats: () => Stats;
  getTasksByMonth: (month: string) => Task[];
  getTasksByArea: (area: string) => Task[];
  getTasksByStatus: (status: string) => Task[];
  syncCalendar: () => Promise<void>;
  fetchCalendarEvents: (start?: string, end?: string) => Promise<void>;

  // Presence & Chat (local/demo only)
  userStatuses: Record<string, 'online' | 'offline' | 'away'>;
  setUserStatus: (userId: string, status: 'online' | 'offline' | 'away') => void;
  activeChatUser?: string;
  setActiveChat: (userId: string) => void;
  chatSessions: Record<string, { from: string; text: string; ts: string }[]>;
  sendChatMessage: (userId: string, text: string) => void;
  currentUserId?: string;
  setCurrentUser: (userId: string) => void;
}

import { persist } from 'zustand/middleware';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [], // Start empty, fetch from API
      team: teamData as TeamMember[],
      gates: gatesData as Gate[],
      events: [],
      finance: {
        subscriptions: [],
        expenses: []
      },
      isLoading: false,
      error: null,
      userStatuses: {},
      activeChatUser: undefined,
      chatSessions: {},
      currentUserId: undefined,

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
              set({ tasks: [], isLoading: false, error: null });
            }
          } else {
            console.warn('Failed to fetch from API');
            set({
              isLoading: false,
              error: 'No se pudo sincronizar con Google Sheets. Mostrando datos locales.'
            });
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
        }
      },

      addTask: async (task) => {
        const newTask = { ...task, id: generateId() };
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

          const { fetchTasks } = get();
          setTimeout(() => fetchTasks(), 500);
        } catch (error) {
          console.error('Failed to sync task to Sheets:', error);
          set({ error: `Error al sincronizar la tarea: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      },

      updateTask: async (id, updates) => {
        const currentTask = get().tasks.find(t => t.id === id);
        if (!currentTask) return;

        const updatedTask = { ...currentTask, ...updates };

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

          const { fetchTasks } = get();
          setTimeout(() => fetchTasks(), 500);
        } catch (error) {
          console.error('Failed to sync task update to Sheets:', error);
          set({ error: `Error al actualizar la tarea: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      },

      deleteTask: async (id) => {
        const previousTasks = get().tasks;

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

      fetchTeam: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/team');
          if (response.ok) {
            const data = await response.json();
            if (data.team && Array.isArray(data.team)) {
              console.log("[Store] Team fetched from API:", data.team.length);
              set({ team: data.team, isLoading: false, error: null });
            } else {
              set({ team: [], isLoading: false, error: null });
            }
          } else {
            console.warn('Failed to fetch team from API');
            set({ isLoading: false, error: 'Error sincronizando equipo.' });
          }
        } catch (error) {
          console.error('Error fetching team:', error);
          set({ isLoading: false, error: 'Error de conexión (Equipo).' });
        }
      },

      addMember: async (member) => {
        const newMember = { ...member, id: generateId() };
        set((state) => ({ team: [...state.team, newMember] }));

        try {
          const response = await fetch('/api/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMember),
          });
          if (!response.ok) throw new Error('Failed to create member');
          get().fetchTeam();
        } catch (e) {
          console.error(e);
          set({ error: 'Error al guardar miembro nueva.' });
        }
      },

      updateMember: async (id, updates) => {
        set((state) => ({
          team: state.team.map(m => m.id === id ? { ...m, ...updates } : m)
        }));

        try {
          const attributeState = get().team.find(m => m.id === id);
          const fullUpdated = { ...attributeState, ...updates };

          const response = await fetch('/api/team', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullUpdated),
          });
          if (!response.ok) throw new Error('Failed to update member');
        } catch (e) {
          console.error(e);
          set({ error: 'Error al actualizar miembro.' });
        }
      },

      deleteMember: async (id) => {
        const prevTeam = get().team;
        set((state) => ({ team: state.team.filter(m => m.id !== id) }));

        try {
          const response = await fetch(`/api/team?id=${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete member');
        } catch (e) {
          console.error(e);
          set({ team: prevTeam, error: 'Error al eliminar miembro.' });
        }
      },

      // --- Finance Actions ---
      fetchFinance: async () => {
        try {
          const response = await fetch('/api/finance');
          if (response.ok) {
            const data = await response.json();
            set({
              finance: {
                subscriptions: data.subscriptions || [],
                expenses: data.expenses || []
              }
            });
          }
        } catch (error) {
          console.error('Error fetching finance:', error);
        }
      },

      addTransaction: async (type: 'subscription' | 'expense', data: any) => {
        const newId = generateId();
        const newItem = { ...data, id: newId };

        try {
          const response = await fetch('/api/finance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data: newItem })
          });
          if (response.ok) {
            set((state) => {
              const newFinance = { ...state.finance };
              if (type === 'subscription') {
                newFinance.subscriptions = [...newFinance.subscriptions, newItem];
              } else {
                newFinance.expenses = [...newFinance.expenses, newItem];
              }
              return { finance: newFinance };
            });
          }
        } catch (error) {
          console.error('Error adding transaction:', error);
        }
      },


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
        } catch (error) {
          console.error('Error syncing calendar:', error);
          set({
            isLoading: false,
            error: `Error al sincronizar calendario: ${error instanceof Error ? error.message : 'Unknown'}`
          });
        }
      },

      fetchCalendarEvents: async (start, end) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          if (start) params.append('start', start);
          if (end) params.append('end', end);

          const response = await fetch(`/api/google/calendar/events?${params.toString()}`);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error fetching calendar events');
          }

          const data = await response.json();
          if (data.events) {
            set({ events: data.events, isLoading: false, error: null });
          } else {
            set({ events: [], isLoading: false, error: null });
          }

        } catch (error) {
          console.error('Error fetching calendar events:', error);
          set({
            isLoading: false,
            error: `Error al obtener eventos del calendario: ${error instanceof Error ? error.message : 'Unknown'}`
          });
        }
      },

      setUserStatus: (userId, status) => {
        const currentUser = get().currentUserId;
        if (!currentUser) return;
        if (currentUser !== userId) return;

        set((state) => ({
          userStatuses: {
            ...state.userStatuses,
            [userId]: status,
          },
        }));
      },

      setActiveChat: (userId) => {
        set({ activeChatUser: userId });
      },

      sendChatMessage: (userId, text) => {
        const ts = new Date().toISOString();
        set((state) => {
          const existing = state.chatSessions[userId] || [];
          return {
            chatSessions: {
              ...state.chatSessions,
              [userId]: [
                ...existing,
                { from: 'Yo', text, ts },
              ],
            },
          };
        });
      },

      setCurrentUser: (userId) => {
        set({ currentUserId: userId });
        set((state) => {
          if (state.userStatuses[userId]) return state;
          return {
            userStatuses: {
              ...state.userStatuses,
              [userId]: 'online',
            },
          };
        });
      },
    }),
    {
      name: 'arch-pm-storage',
      partialize: (state) => ({
        team: state.team,
        gates: state.gates,
        events: state.events,
        finance: state.finance, // Persist Finance Data
        chatSessions: state.chatSessions,
        userStatuses: state.userStatuses,
      }),
    }
  )
);

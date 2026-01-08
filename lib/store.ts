import { create } from 'zustand';
import { Task, TeamMember, Gate, CalendarEvent, Stats, Subscription, Transaction, Expense } from './types';
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
    transactions: Transaction[];
    expenses: Expense[]; // Legacy, mantener para migración
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
  addSubscription: (data: Partial<Subscription>) => Promise<void>;
  addTransaction: (data: Partial<Transaction>) => Promise<void>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

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
      team: [], // Start empty, fetch from API (no usar teamData para evitar datos obsoletos)
      gates: gatesData as Gate[],
      events: [],
      finance: {
        subscriptions: [],
        transactions: [],
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
              // Siempre actualizar con los datos de la API (no comparar para evitar datos obsoletos)
              console.log("[Store] Team updated from API:", data.team.length);
              set({ team: data.team, isLoading: false, error: null });
            } else {
              set({ team: [], isLoading: false, error: null });
            }
          } else {
            console.warn('Failed to fetch team from API');
            set({ isLoading: false, error: 'Error sincronizando equipo.' });
            // No mantener datos antiguos si falla el fetch
            set({ team: [] });
          }
        } catch (error) {
          console.error('Error fetching team:', error);
          set({ isLoading: false, error: 'Error de conexión (Equipo).' });
          // No mantener datos antiguos si falla el fetch
          set({ team: [] });
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
          // Refrescar desde la API para asegurar sincronización
          get().fetchTeam();
        } catch (e) {
          console.error(e);
          set({ error: 'Error al actualizar miembro.' });
          // Refrescar desde la API incluso si hay error para obtener estado actual
          get().fetchTeam();
        }
      },

      deleteMember: async (id) => {
        const prevTeam = get().team;
        set((state) => ({ team: state.team.filter(m => m.id !== id) }));

        try {
          const response = await fetch(`/api/team?id=${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete member');
          // Refrescar desde la API para asegurar sincronización
          get().fetchTeam();
        } catch (e) {
          console.error(e);
          set({ error: 'Error al eliminar miembro.' });
          // Refrescar desde la API incluso si hay error para obtener estado actual
          get().fetchTeam();
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
                transactions: data.transactions || [],
                expenses: data.expenses || [] // Legacy
              }
            });
          }
        } catch (error) {
          console.error('Error fetching finance:', error);
        }
      },

      addSubscription: async (data: Partial<Subscription>) => {
        const newId = generateId();
        const newSub: Subscription = {
          id: newId,
          platform: data.platform || '',
          category: data.category || '',
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          billingCycle: data.billingCycle || 'Monthly',
          renewalDay: data.renewalDay || 1,
          cardUsed: data.cardUsed,
          status: data.status || 'Active',
          ownerId: data.ownerId,
          users: data.users || [],
          receiptUrl: data.receiptUrl,
          notes: data.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: data.createdBy
        };

        try {
          const response = await fetch('/api/finance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'subscription', data: newSub })
          });
          if (response.ok) {
            set((state) => ({
              finance: {
                ...state.finance,
                subscriptions: [...state.finance.subscriptions, newSub]
              }
            }));
            get().fetchFinance(); // Refresh to get server-generated fields
          }
        } catch (error) {
          console.error('Error adding subscription:', error);
        }
      },

      addTransaction: async (data: Partial<Transaction>) => {
        const newId = generateId();
        const newTrans: Transaction = {
          id: newId,
          date: data.date || new Date().toISOString().split('T')[0],
          vendor: data.vendor || '',
          kind: data.kind || 'one_off',
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          category: data.category || '',
          payerId: data.payerId,
          users: data.users || [],
          subscriptionId: data.subscriptionId,
          receiptRef: data.receiptRef,
          receiptUrl: data.receiptUrl,
          notes: data.notes,
          status: data.status || 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: data.createdBy
        };

        try {
          const response = await fetch('/api/finance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'transaction', data: newTrans })
          });
          if (response.ok) {
            set((state) => ({
              finance: {
                ...state.finance,
                transactions: [...state.finance.transactions, newTrans]
              }
            }));
            get().fetchFinance(); // Refresh
          }
        } catch (error) {
          console.error('Error adding transaction:', error);
        }
      },

      updateSubscription: async (id: string, data: Partial<Subscription>) => {
        try {
          const response = await fetch('/api/finance', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'subscription', id, data })
          });
          if (response.ok) {
            set((state) => ({
              finance: {
                ...state.finance,
                subscriptions: state.finance.subscriptions.map(s =>
                  s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
                )
              }
            }));
            get().fetchFinance(); // Refresh
          } else {
            throw new Error('Failed to update subscription');
          }
        } catch (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
      },

      updateTransaction: async (id: string, data: Partial<Transaction>) => {
        try {
          const response = await fetch('/api/finance', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'transaction', id, data })
          });
          if (response.ok) {
            set((state) => ({
              finance: {
                ...state.finance,
                transactions: state.finance.transactions.map(t =>
                  t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
                )
              }
            }));
            get().fetchFinance(); // Refresh
          } else {
            throw new Error('Failed to update transaction');
          }
        } catch (error) {
          console.error('Error updating transaction:', error);
          throw error;
        }
      },

      deleteSubscription: async (id: string) => {
        try {
          const response = await fetch(`/api/finance?type=subscription&id=${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            set((state) => ({
              finance: {
                ...state.finance,
                subscriptions: state.finance.subscriptions.filter(s => s.id !== id)
              }
            }));
          } else {
            throw new Error('Failed to delete subscription');
          }
        } catch (error) {
          console.error('Error deleting subscription:', error);
          throw error;
        }
      },

      deleteTransaction: async (id: string) => {
        try {
          const response = await fetch(`/api/finance?type=transaction&id=${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            set((state) => ({
              finance: {
                ...state.finance,
                transactions: state.finance.transactions.filter(t => t.id !== id)
              }
            }));
          } else {
            throw new Error('Failed to delete transaction');
          }
        } catch (error) {
          console.error('Error deleting transaction:', error);
          throw error;
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
        // NO persistir team - siempre debe venir de Google Sheets
        // team: state.team, // REMOVIDO: Los datos del equipo deben venir siempre de la API
        gates: state.gates,
        events: state.events,
        finance: state.finance, // Persist Finance Data
        chatSessions: state.chatSessions,
        userStatuses: state.userStatuses,
      }),
    }
  )
);

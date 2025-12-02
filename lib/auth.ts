import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'user' | 'viewer';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    register: (email: string, password: string, name: string) => Promise<boolean>;
}

// Mock users database (in production, this would be in a backend)
const MOCK_USERS = [
    {
        id: '1',
        email: 'admin@archipielago.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin' as UserRole,
    },
    {
        id: '2',
        email: 'user@archipielago.com',
        password: 'user123',
        name: 'Team Member',
        role: 'user' as UserRole,
    },
];

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,

            login: async (email: string, password: string) => {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));

                const foundUser = MOCK_USERS.find(
                    u => u.email === email && u.password === password
                );

                if (foundUser) {
                    const { password: _, ...user } = foundUser;
                    set({ user, isAuthenticated: true });
                    return true;
                }

                return false;
            },

            logout: () => {
                set({ user: null, isAuthenticated: false });
            },

            register: async (email: string, password: string, name: string) => {
                // In production, this would call an API
                await new Promise(resolve => setTimeout(resolve, 500));

                // Check if user already exists
                const exists = MOCK_USERS.some(u => u.email === email);
                if (exists) {
                    return false;
                }

                // Create new user with 'user' role by default
                const newUser = {
                    id: String(MOCK_USERS.length + 1),
                    email,
                    name,
                    role: 'user' as UserRole,
                };

                set({ user: newUser, isAuthenticated: true });
                return true;
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);

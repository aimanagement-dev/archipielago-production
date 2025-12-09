import { useSession, signIn, signOut } from "next-auth/react";

export type UserRole = 'admin' | 'user' | 'viewer';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
}

export const useAuth = () => {
    const { data: session, status } = useSession();

    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated';

    // Simple role mapping based on email
    // In the future, this should come from the Google Sheet 'Team' tab
    const getRole = (email?: string | null): UserRole => {
        if (!email) return 'viewer';
        // Admin emails - EXCLUSIVAMENTE usar ai.management@archipielagofilm.com
        const admins = ['ai.management@archipielagofilm.com'];
        if (admins.includes(email)) return 'admin';
        return 'user'; // Default to user for non-admins
    };

    const user: User | null = session?.user ? {
        id: session.user.email || 'unknown',
        email: session.user.email || '',
        name: session.user.name || '',
        role: getRole(session.user.email),
        avatar: session.user.image || undefined,
    } : null;

    return {
        user,
        isAuthenticated,
        isLoading,
        login: () => signIn('google'),
        logout: () => signOut(),
        register: () => signIn('google'),
    };
};

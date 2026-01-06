import { useSession, signIn, signOut } from "next-auth/react";
import { useStore } from "@/lib/store";

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
    const { team } = useStore();

    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated';

    const getRole = (email?: string | null): UserRole => {
        if (!email) return 'viewer';

        // 1. Check Hardcoded Super Admins
        const superAdmins = [
            'ai.management@archipielagofilm.com',
            'ai.lantica@lanticastudios.com',
            'federico.beron@lanticastudios.com'
        ];
        if (superAdmins.includes(email)) return 'admin';

        // 2. Check Team Data for Role or Name Match
        if (team && team.length > 0) {
            const member = team.find(m =>
                (m.email?.toLowerCase() === email.toLowerCase()) ||
                (m.secondaryEmail?.toLowerCase() === email.toLowerCase())
            );

            if (member) {
                // If member found, check if they are designated as 'Admin' in sheet
                // Or if their name matches the Super Admin Users
                const adminNames = ['Cindy Toribio', 'Federico Beron', 'Archipielago AI Management'];

                // Flexible check: Exact name match or if name contains substring (riskier but covers user request)
                // User said: "Cindy toribio" and "Federico Beron".
                const isNamedAdmin = adminNames.some(n => member.name.toLowerCase().includes(n.toLowerCase()));

                if (isNamedAdmin) return 'admin';
                if (member.role?.toLowerCase().includes('admin')) return 'admin';
                if (member.department?.toLowerCase() === 'production' && member.position?.toLowerCase() === 'producer') return 'admin';
            }
        }

        return 'user';
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

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

        // 1. Check Hardcoded Super Admins (by email)
        const superAdmins = [
            'ai.management@archipielagofilm.com',
            'ai.lantica@lanticastudios.com',
            'federico.beron@lanticastudios.com',
            // Cindy Toribio removida de admins - ahora es user regular
        ];
        if (superAdmins.includes(email.toLowerCase())) return 'admin';

        // 2. Check Team Data for Role or Name Match
        if (team && team.length > 0) {
            const member = team.find(m =>
                (m.email?.toLowerCase() === email.toLowerCase()) ||
                (m.secondaryEmail?.toLowerCase() === email.toLowerCase())
            );

            if (member) {
                // Check if member name matches admin names (Federico Berón)
                const adminNames = ['Federico Beron', 'Federico Berón', 'Archipielago AI Management'];
                const isNamedAdmin = adminNames.some(n => member.name.toLowerCase().includes(n.toLowerCase()));

                if (isNamedAdmin) return 'admin';
                
                // Check if email matches admin emails from team member data
                const adminEmails = [
                    'federico.beron@lanticastudios.com',
                    // Cindy Toribio removida de admins - ahora es user regular
                ];
                if (member.email && adminEmails.includes(member.email.toLowerCase())) return 'admin';
                
                // Check role or position
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

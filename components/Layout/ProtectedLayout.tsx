'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import AIAssistant from '@/components/AIAssistant';
import Header from '@/components/Layout/Header';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isAuthenticated && pathname !== '/login') {
            router.push('/login');
        }
    }, [isAuthenticated, pathname, router]);

    // Show login page without layout
    if (pathname === '/login') {
        return <>{children}</>;
    }

    // Show loading or redirect for unauthenticated users
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto relative flex flex-col">
                <Header />
                <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
                    <div className="p-8 relative z-10 max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
            <AIAssistant />
        </div>
    );
}

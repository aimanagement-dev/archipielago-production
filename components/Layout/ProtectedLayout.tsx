'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import AIAssistant from '@/components/AIAssistant';
import Header from '@/components/Layout/Header';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Solo redirigir si no está cargando y no está autenticado
        if (!isLoading && !isAuthenticated && pathname !== '/login') {
            router.push('/login');
        }
        // Si está autenticado y está en /login, redirigir al dashboard
        if (!isLoading && isAuthenticated && pathname === '/login') {
            router.push('/');
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    // Show login page without layout
    if (pathname === '/login') {
        return <>{children}</>;
    }

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </div>
        );
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

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import DrivePicker from '@/components/Drive/DrivePicker';
import { HardDrive } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function DrivePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    if (isLoading || !mounted) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="p-8 space-y-6 h-full flex flex-col">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <HardDrive className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Google Drive Browser</h1>
                    <p className="text-muted-foreground">Explora y gestiona los archivos del proyecto (Solo Admin)</p>
                </div>
            </div>

            <div className="flex-1 border border-border rounded-xl overflow-hidden shadow-2xl relative">
                {/* 
                  Reutilizamos DrivePicker pero ocultamos el botón de Cancelar/Seleccionar si fuera necesario,
                  o simplemente usamos su funcionalidad de navegación.
                  Al pasar onSelect, podemos hacer que abra el archivo en una nueva pestaña.
                */}
                <div className="absolute inset-0">
                    <DrivePicker
                        initialFolderId="user_root" // Empezar en Mi Unidad para total libertad
                        onSelect={(link) => window.open(link, '_blank')}
                        onCancel={() => { }}
                        className="h-full"
                    // area no es necesario aquí, queremos navegación libre
                    />
                </div>
            </div>
        </div>
    );
}

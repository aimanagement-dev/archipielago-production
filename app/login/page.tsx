'use client';

import { useAuth } from '@/lib/auth';
import { Film, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Suspense } from 'react';

function LoginContent() {
    const { login, isLoading } = useAuth();
    const searchParams = useSearchParams();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        // Verificar si hay un error en los query params
        const error = searchParams.get('error');
        if (error) {
            const errorMessages: Record<string, string> = {
                'Configuration': 'Error de configuración del servidor. Contacta al administrador.',
                'AccessDenied': 'Tu cuenta no está autorizada para acceder a esta aplicación.',
                'Verification': 'Error de verificación. Intenta nuevamente.',
                'Default': 'Error al iniciar sesión. Intenta nuevamente.',
            };
            setErrorMessage(errorMessages[error] || errorMessages['Default']);
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md"
            >
                <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4">
                            <Film className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-amber-200 bg-clip-text text-transparent">
                            Archipiélago
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2">Production Management System</p>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-destructive">Error de autenticación</p>
                                <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Google Login Button */}
                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                setErrorMessage(null); // Limpiar error al intentar de nuevo
                                login();
                            }}
                            disabled={isLoading}
                            className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            )}
                            <span>Continue with Google</span>
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-muted-foreground">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    © 2025 Lantica Studios. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}


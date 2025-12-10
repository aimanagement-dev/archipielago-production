'use client';

import { useAuth } from '@/lib/auth';
import { Film, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
    const { login, isLoading } = useAuth();
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    const errorMessages: Record<string, string> = {
        'OAuthCallback': 'Error de autenticación. Verifica que tu cuenta esté autorizada.',
        'OAuthSignin': 'Error al iniciar sesión con Google.',
        'OAuthAccountNotLinked': 'Esta cuenta ya está vinculada con otro método.',
        'AccessDenied': 'Acceso denegado. Tu cuenta no está autorizada.',
        'default': 'Error de autenticación. Intenta de nuevo.',
    };

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
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{errorMessages[error] || errorMessages.default}</span>
                        </div>
                    )}

                    {/* Google Login Button */}
                    <div className="space-y-4">
                        <button
                            onClick={() => login()}
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}

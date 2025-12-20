'use client';

import { useEffect } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log fatal errors to console (or external service in production)
        console.error('Fatal Error:', error);
    }, [error]);

    return (
        <html>
            <body className="bg-background text-foreground antialiased min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-8 text-center bg-card/50 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                            Sistema Interrumpido
                        </h2>
                        <p className="text-muted-foreground">
                            Hemos detectado un error crítico. Esto puede deberse a problemas de conexión o a una sesión expirada.
                        </p>
                        {process.env.NODE_ENV === 'development' && (
                            <div className="p-4 bg-destructive/10 rounded-lg text-left overflow-auto max-h-40">
                                <p className="text-xs font-mono text-destructive">{error.message}</p>
                                {error.digest && <p className="text-xs text-muted-foreground mt-2">Digest: {error.digest}</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => reset()}
                            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reintentar
                        </button>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Ir al Login
                        </button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Si el problema persiste, contacta a soportetécnico@lanticastudios.com
                    </p>
                </div>
            </body>
        </html>
    );
}

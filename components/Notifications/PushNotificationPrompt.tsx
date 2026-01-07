'use client';

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useState, useEffect } from 'react';

export default function PushNotificationPrompt() {
  const { permission, isSubscribed, isLoading, error, subscribe, unsubscribe } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  // Mostrar prompt si no está suscrito y tiene permiso
  useEffect(() => {
    if (permission === 'granted' && !isSubscribed && !showPrompt) {
      setShowPrompt(true);
    }
  }, [permission, isSubscribed, showPrompt]);

  if (permission === 'unsupported') {
    return null; // No mostrar nada si no está soportado
  }

  if (permission === 'denied') {
    return (
      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-400">
        <p>Las notificaciones están bloqueadas. Por favor habilítalas en la configuración de tu navegador.</p>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      if (permission === 'default') {
        const granted = await subscribe();
        if (!granted) return;
      } else {
        await subscribe();
      }
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          {error}
        </div>
      )}
      
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isSubscribed
            ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isSubscribed ? 'Desactivando...' : 'Activando...'}
          </>
        ) : (
          <>
            {isSubscribed ? (
              <>
                <BellOff className="w-4 h-4" />
                Desactivar Notificaciones Push
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Activar Notificaciones Push
              </>
            )}
          </>
        )}
      </button>

      {isSubscribed && (
        <p className="text-xs text-muted-foreground text-center">
          Recibirás notificaciones cuando te asignen tareas o te compartan contenido.
        </p>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user?.email) {
      setIsSubscribed(false);
      return;
    }

    try {
      const response = await fetch('/api/push/subscribe');
      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(!!data.subscription);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    }
  }, [user?.email]);

  // Verificar soporte y permiso
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }

    // Verificar permiso actual
    if (Notification.permission === 'granted') {
      setPermission('granted');
    } else if (Notification.permission === 'denied') {
      setPermission('denied');
    } else {
      setPermission('default');
    }

    // Verificar si ya está suscrito
    checkSubscription();
  }, [checkSubscription]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setError('Las notificaciones no están soportadas en este navegador');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setPermission('granted');
        return true;
      } else {
        setPermission('denied');
        setError('Permiso de notificaciones denegado');
        return false;
      }
    } catch (error) {
      setError('Error al solicitar permiso de notificaciones');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user?.email) {
      setError('Debes estar logueado para activar notificaciones');
      return false;
    }

    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Obtener VAPID public key del servidor
      const vapidPublicKeyResponse = await fetch('/api/push/vapid-public-key');
      if (!vapidPublicKeyResponse.ok) {
        throw new Error('No se pudo obtener la clave pública VAPID');
      }
      const { publicKey } = await vapidPublicKeyResponse.json();

      if (!publicKey) {
        throw new Error('VAPID public key no configurada en el servidor');
      }

      // Crear suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Guardar suscripción en el servidor
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la suscripción');
      }

      setIsSubscribed(true);
      return true;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      setError(error.message || 'Error al activar notificaciones');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, permission, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Eliminar suscripción del servidor
      const response = await fetch('/api/push/subscribe', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la suscripción');
      }

      // Eliminar suscripción local
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch (error: any) {
      console.error('Error unsubscribing from push:', error);
      setError(error.message || 'Error al desactivar notificaciones');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

// Helper para convertir VAPID key de base64url a Uint8Array
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

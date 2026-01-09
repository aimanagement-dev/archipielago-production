'use client';

import { Task } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { useState } from 'react';

interface Props {
  task: Task;
  onResponse?: () => void;
}

export default function MeetingInvitation({ task, onResponse }: Props) {
  const { user } = useAuth();
  const [isResponding, setIsResponding] = useState(false);
  
  if (!task.hasMeet || !task.meetLink) {
    return null;
  }

  const userEmail = user?.email?.toLowerCase();
  const isInvited = task.responsible?.some((email: string) => email.toLowerCase() === userEmail) ||
                    task.visibleTo?.some((email: string) => email.toLowerCase() === userEmail);
  
  if (!isInvited) {
    return null;
  }

  const currentResponse = task.attendeeResponses?.find(r => r.email.toLowerCase() === userEmail);
  const responseStatus = currentResponse?.response;

  const handleResponse = async (response: 'accepted' | 'declined' | 'tentative') => {
    if (!userEmail) return;
    
    setIsResponding(true);
    try {
      // Actualizar respuesta localmente
      const currentResponses = task.attendeeResponses || [];
      const updatedResponses = currentResponses.filter(r => r.email.toLowerCase() !== userEmail);
      updatedResponses.push({ email: userEmail, response });

      // Actualizar en el servidor
      const response_api = await fetch(`/api/tasks/${task.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });

      if (!response_api.ok) {
        throw new Error('Error al guardar respuesta');
      }

      // Actualizar en el store local sin tocar la API de tareas
      useStore.setState((state) => ({
        tasks: state.tasks.map(t => t.id === task.id ? { ...t, attendeeResponses: updatedResponses } : t),
      }));
      
      if (onResponse) {
        onResponse();
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      alert('Error al responder la invitación. Por favor intenta de nuevo.');
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-foreground">Invitación a reunión</span>
        </div>
        {responseStatus && (
          <span className={`text-xs px-2 py-1 rounded ${
            responseStatus === 'accepted' ? 'bg-green-500/20 text-green-400' :
            responseStatus === 'declined' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {responseStatus === 'accepted' ? 'Aceptada' :
             responseStatus === 'declined' ? 'Rechazada' :
             'Tal vez'}
          </span>
        )}
      </div>
      
      {!responseStatus ? (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => handleResponse('accepted')}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors border border-green-500/30 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Aceptar
          </button>
          <button
            onClick={() => handleResponse('tentative')}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors border border-yellow-500/30 disabled:opacity-50"
          >
            <Clock className="w-4 h-4" />
            Tal vez
          </button>
          <button
            onClick={() => handleResponse('declined')}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/30 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Rechazar
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <button
            onClick={() => handleResponse(responseStatus === 'accepted' ? 'declined' : 'accepted')}
            disabled={isResponding}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cambiar respuesta
          </button>
        </div>
      )}
    </div>
  );
}

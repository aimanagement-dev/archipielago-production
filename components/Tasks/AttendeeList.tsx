'use client';

import { Task } from '@/lib/types';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { useStore } from '@/lib/store';

interface Props {
  task: Task;
}

export default function AttendeeList({ task }: Props) {
  const { team } = useStore();
  
  if (!task.hasMeet || !task.meetLink) {
    return null;
  }

  // Combinar responsables y visibleTo para obtener todos los invitados
  const allInvitees = new Set<string>();
  task.responsible?.forEach(email => allInvitees.add(email));
  task.visibleTo?.forEach(email => allInvitees.add(email));

  if (allInvitees.size === 0) {
    return null;
  }

  const responses = task.attendeeResponses || [];
  const responseMap = new Map(responses.map(r => [r.email.toLowerCase(), r.response]));

  const getResponseIcon = (response?: string) => {
    switch (response) {
      case 'accepted':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'tentative':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground opacity-50" />;
    }
  };

  const getResponseText = (response?: string) => {
    switch (response) {
      case 'accepted':
        return 'Aceptada';
      case 'declined':
        return 'Rechazada';
      case 'tentative':
        return 'Tal vez';
      default:
        return 'Sin respuesta';
    }
  };

  const getResponseColor = (response?: string) => {
    switch (response) {
      case 'accepted':
        return 'text-green-400';
      case 'declined':
        return 'text-red-400';
      case 'tentative':
        return 'text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="mt-3 p-3 bg-muted/30 border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <User className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Invitados ({allInvitees.size})</span>
      </div>
      <div className="space-y-2">
        {Array.from(allInvitees).map((email) => {
          const response = responseMap.get(email.toLowerCase());
          const member = team.find(m => m.email?.toLowerCase() === email.toLowerCase());
          const displayName = member?.name || email;

          return (
            <div key={email} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getResponseIcon(response)}
                <span className="text-foreground truncate">{displayName}</span>
                {member && (
                  <span className="text-muted-foreground text-[10px] truncate">({email})</span>
                )}
              </div>
              <span className={`text-xs font-medium ${getResponseColor(response)}`}>
                {getResponseText(response)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

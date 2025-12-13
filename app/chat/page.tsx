'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Circle, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const statusColors: Record<'online' | 'offline' | 'away', string> = {
  online: 'bg-green-500',
  away: 'bg-amber-500',
  offline: 'bg-gray-400',
};

const statusLabels: { value: 'online' | 'offline' | 'away'; label: string }[] = [
  { value: 'online', label: 'En línea' },
  { value: 'away', label: 'Ausente' },
  { value: 'offline', label: 'Desconectado' },
];

export default function ChatPage() {
  const {
    team,
    userStatuses,
    setUserStatus,
    chatSessions,
    sendChatMessage,
    activeChatUser,
    setActiveChat,
    currentUserId,
    setCurrentUser,
  } = useStore();

  const { user } = useAuth();

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.id) {
      setCurrentUser(user.id);
    }
  }, [user, setCurrentUser]);

  const sortedTeam = useMemo(
    () => [...team].sort((a, b) => a.name.localeCompare(b.name)),
    [team]
  );

  // Seleccionar chat por defecto
  useEffect(() => {
    if (!activeChatUser && sortedTeam.length > 0) {
      setActiveChat(sortedTeam[0].id);
    }
  }, [activeChatUser, sortedTeam, setActiveChat]);

  const activeUser = sortedTeam.find((u) => u.id === activeChatUser);
  const messages = activeUser ? chatSessions[activeUser.id] || [] : [];
  const activeStatus: 'online' | 'offline' | 'away' =
    (activeUser && userStatuses[activeUser.id]) || 'offline';

  const handleSend = () => {
    if (!activeUser || !message.trim()) return;
    sendChatMessage(activeUser.id, message.trim());
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chat en vivo</h1>
          <p className="text-muted-foreground">
            Lista de usuarios con estado en línea / desconectado. Doble click para chatear.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de usuarios */}
        <div className="lg:col-span-1 bg-card/50 border border-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Usuarios</h3>
            <span className="text-xs text-muted-foreground">
              Doble click para abrir chat
            </span>
          </div>
          <div className="space-y-2 max-h-[65vh] overflow-auto">
            {sortedTeam.map((user) => {
              const status: 'online' | 'offline' | 'away' =
                userStatuses[user.id] || 'offline';
              const isActive = activeUser?.id === user.id;
              const isSelf = currentUserId === user.id;
              return (
                <div
                  key={user.id}
                  onDoubleClick={() => setActiveChat(user.id)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors cursor-pointer',
                    isActive
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-white/5 hover:border-primary/30 hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">
                        {user.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <span
                        className={cn(
                          'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-background',
                          statusColors[status]
                        )}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {user.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.role}
                      </div>
                    </div>
                  </div>
                  {isSelf ? (
                    <select
                      value={status}
                      onChange={(e) =>
                        setUserStatus(
                          user.id,
                          e.target.value as 'online' | 'offline' | 'away'
                        )
                      }
                      className="bg-white/5 border border-white/10 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {statusLabels.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {statusLabels.find((s) => s.value === status)?.label || 'Desconectado'}
                    </span>
                  )}
                </div>
              );
            })}
            {sortedTeam.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">
                No hay usuarios cargados.
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 bg-card/50 border border-white/5 rounded-xl p-4 flex flex-col min-h-[60vh]">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">
                  {activeUser
                    ? activeUser.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                    : '?'}
                </div>
                <span
                  className={cn(
                    'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-background',
                    statusColors[activeStatus]
                  )}
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {activeUser ? activeUser.name : 'Selecciona un usuario'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {activeStatus === 'online'
                    ? 'Disponible'
                    : activeStatus === 'away'
                    ? 'Ausente'
                    : 'Desconectado'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-3 pr-2">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                No hay mensajes. Escribe para iniciar la conversación.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={`${msg.ts}-${idx}`}
                className={cn(
                  'max-w-md px-3 py-2 rounded-lg text-sm border',
                  msg.from === 'Yo'
                    ? 'ml-auto bg-primary text-primary-foreground border-primary/50'
                    : 'mr-auto bg-white/5 text-foreground border-white/10'
                )}
              >
                <div className="font-semibold">{msg.from}</div>
                <div>{msg.text}</div>
                <div className="text-[10px] opacity-60 mt-1">
                  {new Date(msg.ts).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={
                activeUser
                  ? `Mensaje para ${activeUser.name}`
                  : 'Selecciona un usuario'
              }
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleSend}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Nota: el estado es manual (local) y el chat es local/demostrativo (no persistente ni en tiempo real).
      </div>
    </div>
  );
}


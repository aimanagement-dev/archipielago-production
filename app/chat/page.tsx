'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const statusColors: Record<'online' | 'offline' | 'away', string> = {
  online: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  away: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  offline: 'bg-muted-foreground/30',
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
    if (user?.id && user.id !== currentUserId) {
      setCurrentUser(user.id);
    }
  }, [user?.id, currentUserId, setCurrentUser]);

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
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Chat en Vivo</h1>
          <p className="text-muted-foreground font-medium">
            Colaboración y comunicación directa con el equipo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de usuarios */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xl font-bold tracking-tight">Usuarios</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {team.length} miembros
            </span>
          </div>
          <div className="space-y-2 max-h-[65vh] overflow-auto pr-2 custom-scrollbar">
            {sortedTeam.map((user) => {
              const status: 'online' | 'offline' | 'away' =
                userStatuses[user.id] || 'offline';
              const isActive = activeUser?.id === user.id;
              const isSelf = currentUserId === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => setActiveChat(user.id)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all cursor-pointer group',
                    isActive
                      ? 'border-primary/50 bg-primary/5 shadow-inner'
                      : 'border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border tracking-tighter shadow-sm",
                        isActive ? "bg-primary text-primary-foreground border-primary/20" : "bg-card text-foreground border-border"
                      )}>
                        {user.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card',
                          statusColors[status]
                        )}
                      />
                    </div>
                    <div>
                      <div className={cn(
                        "text-sm font-bold tracking-tight",
                        isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                      )}>
                        {user.name}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
                      className="bg-card border border-border text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm hover:border-primary/40 transition-all"
                    >
                      {statusLabels.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {statusLabels.find((s) => s.value === status)?.label || 'Desconectado'}
                    </span>
                  )}
                </div>
              );
            })}
            {sortedTeam.length === 0 && (
              <div className="text-sm text-muted-foreground font-bold text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                No hay usuarios cargados.
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col min-h-[65vh] shadow-xl relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

          <div className="flex items-center justify-between border-b border-border pb-5 mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-lg font-black text-primary-foreground border-4 border-card shadow-lg tracking-tighter">
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
                    'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card',
                    statusColors[activeStatus]
                  )}
                />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-foreground">
                  {activeUser ? activeUser.name : 'Selecciona un usuario'}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", statusColors[activeStatus])} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {activeStatus === 'online'
                      ? 'En Línea'
                      : activeStatus === 'away'
                        ? 'Ausente'
                        : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-4 pr-3 custom-scrollbar relative z-10">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8 bg-muted/10 rounded-2xl border border-dashed border-border">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary opacity-40" />
                </div>
                <div>
                  <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Sin mensajes aún</p>
                  <p className="text-[11px] text-muted-foreground/60 max-w-[200px] mt-2 font-medium">Inicia la conversación escribiendo algo abajo.</p>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={`${msg.ts}-${idx}`}
                className={cn(
                  'max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm relative group transition-all',
                  msg.from === 'Yo'
                    ? 'ml-auto bg-primary text-primary-foreground border border-primary/50 rounded-tr-none'
                    : 'mr-auto bg-muted border border-border text-foreground rounded-tl-none'
                )}
              >
                {msg.from !== 'Yo' && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-1">{msg.from}</div>
                )}
                <div className="font-medium leading-relaxed">{msg.text}</div>
                <div className={cn(
                  "text-[9px] font-bold mt-2 opacity-60 flex items-center gap-1",
                  msg.from === 'Yo' ? "justify-end" : "justify-start"
                )}>
                  {new Date(msg.ts).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border flex items-center gap-3 relative z-10">
            <div className="flex-1 relative">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder={
                  activeUser
                    ? `Mensaje para ${activeUser.name}...`
                    : 'Selecciona un usuario'
                }
                className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-card transition-all"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!activeUser || !message.trim()}
              className="p-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-center py-4 border-t border-border/10">
        Archipiélago Unified Collaboration System • Local Instance
      </div>
    </div>
  );
}


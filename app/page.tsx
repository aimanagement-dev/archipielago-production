'use client';

import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { format, isToday, parseISO, differenceInMinutes, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  CheckCircle,
  TrendingUp,
  Users,
  Flag,
  Activity,
  AlertCircle,
  Sparkles,
  ArrowRight,
  DollarSign,
  Clock,
  Video,
  FileText
} from 'lucide-react';
import { cn, statusColors, areaColors } from '@/lib/utils';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, gates, team, getStats } = useStore();
  const stats = getStats();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for real-time countdown
    return () => clearInterval(interval);
  }, []);

  // Get current time and date
  const now = currentTime;
  const currentDate = format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const currentTimeFormatted = format(now, 'HH:mm', { locale: es });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  // Get today's scheduled tasks
  const todaysTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.isScheduled || !t.scheduledDate) return false;
      try {
        const taskDate = parseISO(t.scheduledDate);
        return isToday(taskDate);
      } catch {
        return false;
      }
    }).sort((a, b) => {
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime.localeCompare(b.scheduledTime);
      }
      return 0;
    });
  }, [tasks]);

  // Get active tasks (in progress)
  const activeTasks = tasks.filter(t => t.status === 'En Progreso').slice(0, 5);

  // Get upcoming gates
  const upcomingGates = gates.filter(g => g.status === 'Pendiente').slice(0, 3);



  return (
    <div className="space-y-6">
      {/* Hero Section - Welcome */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card rounded-2xl border border-border p-8 shadow-sm">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-20" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent mb-2">
                {getGreeting()}, {user?.email === 'ai.management@archipielagofilm.com' ? 'Cindy/Fede' : user?.name}!
              </h1>
              <p className="text-lg text-muted-foreground font-medium">
                Bienvenido al centro de comando de Archipiélago
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">{currentDate}</div>
              <div className="text-4xl font-black text-primary drop-shadow-sm">{currentTimeFormatted}</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-muted/30 backdrop-blur-sm rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.completed}</div>
                  <div className="text-xs text-muted-foreground font-bold uppercase">Completadas</div>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 backdrop-blur-sm rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.inProgress}</div>
                  <div className="text-xs text-muted-foreground font-bold uppercase">En Progreso</div>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 backdrop-blur-sm rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{team.length}</div>
                  <div className="text-xs text-muted-foreground font-bold uppercase">Crew</div>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 backdrop-blur-sm rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <Flag className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.gatesCompleted}/{stats.totalGates}</div>
                  <div className="text-xs text-muted-foreground font-bold uppercase">Gates</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Events */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Agenda de Hoy
            </h2>
            <Link
              href="/calendar"
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 uppercase tracking-wider"
            >
              Ver calendario completo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {todaysTasks.length > 0 ? (
            <div className="space-y-3">
              {todaysTasks.map((task) => {
                // Calculate time until meeting
                const getTimeUntilMeeting = () => {
                  if (!task.scheduledDate || !task.scheduledTime) return null;
                  try {
                    const [hours, minutes] = task.scheduledTime.split(':').map(Number);
                    const taskDate = parseISO(task.scheduledDate);
                    taskDate.setHours(hours, minutes, 0, 0);
                    const diffMinutes = differenceInMinutes(taskDate, now);
                    
                    if (diffMinutes < 0) {
                      return { text: 'En curso', isPast: true };
                    }
                    if (diffMinutes < 60) {
                      return { text: `En ${diffMinutes} min`, isPast: false };
                    }
                    const diffHours = differenceInHours(taskDate, now);
                    const remainingMinutes = diffMinutes % 60;
                    if (remainingMinutes === 0) {
                      return { text: `En ${diffHours}h`, isPast: false };
                    }
                    return { text: `En ${diffHours}h ${remainingMinutes}min`, isPast: false };
                  } catch {
                    return null;
                  }
                };

                const timeUntil = getTimeUntilMeeting();
                const hasMeeting = !!task.meetLink;
                const isAdmin = user?.role === 'admin';

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      // Navigate to task detail or open modal
                      if (isAdmin) {
                        router.push(`/tasks?edit=${task.id}`);
                      } else {
                        router.push(`/tasks?view=${task.id}`);
                      }
                    }}
                    className="flex items-start gap-4 p-4 bg-muted/20 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group cursor-pointer"
                  >
                    {task.scheduledTime ? (
                      <div className="flex flex-col items-center min-w-[60px] bg-card p-2 rounded-lg border border-border shadow-sm">
                        <div className="text-2xl font-black text-primary">{task.scheduledTime.split(':')[0]}</div>
                        <div className="text-xs text-muted-foreground font-bold uppercase">{task.scheduledTime.split(':')[1]}</div>
                      </div>
                    ) : (
                      <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors flex-1">{task.title}</h3>
                        {timeUntil && (
                          <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                            timeUntil.isPast 
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-primary/20 text-primary border border-primary/30"
                          )}>
                            <Clock className="w-3 h-3" />
                            {timeUntil.text}
                          </div>
                        )}
                      </div>
                      
                      {/* Notes/Topic preview */}
                      {task.notes && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.notes}</p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-border/50', areaColors[task.area])}>
                          {task.area}
                        </span>
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-border/50', statusColors[task.status])}>
                          {task.status}
                        </span>
                        {task.responsible && task.responsible.length > 0 && (
                          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {task.responsible.slice(0, 2).join(', ')}
                            {task.responsible.length > 2 && ` +${task.responsible.length - 2}`}
                          </span>
                        )}
                      </div>

                      {/* Meeting button - MUY VISIBLE y prominente */}
                      {hasMeeting && task.meetLink && (
                        <div className="mt-3 pt-3 border-t-2 border-blue-500/30">
                          <a
                            href={task.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-bold transition-all border-2 border-blue-500/40 hover:border-blue-500/60 shadow-lg hover:shadow-xl hover:scale-105"
                          >
                            <Video className="w-5 h-5" />
                            <span>{timeUntil?.isPast ? 'Unirse a la Reunión' : 'Entrar a la Reunión'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </a>
                          <p className="text-xs text-muted-foreground mt-2 text-center font-mono break-all">
                            {task.meetLink}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed border-border">
              <Sparkles className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold text-lg">No hay eventos programados para hoy</p>
              <p className="text-sm text-muted-foreground/70 mt-1 font-medium">¡Aprovecha para avanzar en tareas pendientes!</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6">Accesos Rápidos</h2>
          <div className="space-y-3">
            <Link
              href="/tasks"
              className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group"
            >
              <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors border border-primary/10">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-foreground">Gestión de Tareas</div>
                <div className="text-xs text-muted-foreground font-medium">{stats.totalTasks} tareas activas</div>
              </div>
            </Link>
            <Link
              href="/calendar"
              className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group"
            >
              <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors border border-blue-500/10">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-bold text-foreground">Calendario</div>
                <div className="text-xs text-muted-foreground font-medium">Ver programación</div>
              </div>
            </Link>
            <Link
              href="/team"
              className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group"
            >
              <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors border border-emerald-500/10">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-bold text-foreground">Equipo</div>
                <div className="text-xs text-muted-foreground font-medium">{team.length} miembros</div>
              </div>
            </Link>
            <Link
              href="/gates"
              className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group"
            >
              <div className="p-2.5 bg-violet-500/10 rounded-lg group-hover:bg-violet-500/20 transition-colors border border-violet-500/10">
                <Flag className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <div className="font-bold text-foreground">Gates</div>
                <div className="text-xs text-muted-foreground font-medium">Checkpoints del proyecto</div>
              </div>
            </Link>
            <Link
              href="/finance"
              className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group"
            >
              <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors border border-emerald-500/10">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-bold text-foreground">Finanzas</div>
                <div className="text-xs text-muted-foreground font-medium">Control de gastos</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Tasks & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tasks */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              En Progreso
            </h2>
            <Link
              href="/tasks"
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
            >
              Ver todas
            </Link>
          </div>
          <div className="grid gap-3">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    if (user?.role === 'admin') {
                      router.push(`/tasks?edit=${task.id}`);
                    } else {
                      router.push(`/tasks?view=${task.id}`);
                    }
                  }}
                  className="p-4 bg-muted/20 border border-border rounded-xl hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{task.title}</div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-border/50', areaColors[task.area])}>
                      {task.area}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold uppercase">{task.week}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-muted/10 rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground font-medium">No hay tareas en progreso</p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Upcoming Gates */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Flag className="w-5 h-5 text-violet-600" />
            Próximos Hitos
          </h2>
          <div className="grid gap-3">
            {upcomingGates.length > 0 ? (
              upcomingGates.map((gate) => (
                <div
                  key={gate.id}
                  onClick={() => {
                    if (user?.role === 'admin') {
                      router.push(`/gates?edit=${gate.id}`);
                    } else {
                      router.push(`/gates?view=${gate.id}`);
                    }
                  }}
                  className="p-4 bg-muted/20 border border-border rounded-xl hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-bold text-foreground group-hover:text-primary transition-colors">{gate.name}</div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/30">
                      Pendiente
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{gate.week}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-muted/10 rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground font-medium">Todos los gates completados</p>
              </div>
            )}
          </div>

          {/* Blocked tasks alert */}
          {stats.blocked > 0 && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="font-bold text-destructive text-sm uppercase tracking-wider">Atención Requerida</span>
              </div>
              <p className="text-xs text-destructive/80 font-medium">
                {stats.blocked} tarea{stats.blocked > 1 ? 's' : ''} bloqueada{stats.blocked > 1 ? 's' : ''} que requiere acción inmediata.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Progreso General del Proyecto
        </h2>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Estado de Completitud</span>
              <span className="text-lg font-black text-primary">
                {Math.round((stats.completed / (stats.totalTasks || 1)) * 100)}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                style={{ width: `${(stats.completed / (stats.totalTasks || 1)) * 100}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="text-center p-3 bg-muted/20 border border-border rounded-xl">
              <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-widest">Completadas</div>
              <div className="text-2xl font-black text-emerald-600">{stats.completed}</div>
            </div>
            <div className="text-center p-3 bg-muted/20 border border-border rounded-xl">
              <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-widest">En Progreso</div>
              <div className="text-2xl font-black text-amber-600">{stats.inProgress}</div>
            </div>
            <div className="text-center p-3 bg-muted/20 border border-border rounded-xl">
              <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-widest">Pendientes</div>
              <div className="text-2xl font-black text-blue-600">{stats.pending}</div>
            </div>
            <div className="text-center p-3 bg-muted/20 border border-border rounded-xl">
              <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-widest">Bloqueadas</div>
              <div className="text-2xl font-black text-destructive">{stats.blocked}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

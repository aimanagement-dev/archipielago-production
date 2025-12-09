'use client';

import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { format, isToday, parseISO } from 'date-fns';
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
  ArrowRight
} from 'lucide-react';
import { cn, statusColors, areaColors } from '@/lib/utils';
import Link from 'next/link';
import { useMemo } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, gates, team, getStats } = useStore();
  const stats = getStats();

  // Get current time and date
  const now = new Date();
  const currentDate = format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const currentTime = format(now, 'HH:mm', { locale: es });

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
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-card/40 to-card/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-amber-200 bg-clip-text text-transparent mb-2">
                {getGreeting()}, {user?.name}! 👋
              </h1>
              <p className="text-lg text-muted-foreground">
                Bienvenido al centro de comando de Archipiélago
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground capitalize mb-1">{currentDate}</div>
              <div className="text-3xl font-bold text-primary">{currentTime}</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.completed}</div>
                  <div className="text-xs text-muted-foreground">Completadas</div>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.inProgress}</div>
                  <div className="text-xs text-muted-foreground">En Progreso</div>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{team.length}</div>
                  <div className="text-xs text-muted-foreground">Crew</div>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <Flag className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.gatesCompleted}/{stats.totalGates}</div>
                  <div className="text-xs text-muted-foreground">Gates</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Events */}
        <div className="lg:col-span-2 bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Agenda de Hoy
            </h2>
            <Link
              href="/calendar"
              className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Ver calendario completo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {todaysTasks.length > 0 ? (
            <div className="space-y-3">
              {todaysTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-lg hover:border-primary/30 transition-all"
                >
                  {task.scheduledTime ? (
                    <div className="flex flex-col items-center min-w-[60px]">
                      <div className="text-2xl font-bold text-primary">{task.scheduledTime.split(':')[0]}</div>
                      <div className="text-xs text-muted-foreground">{task.scheduledTime.split(':')[1]}</div>
                    </div>
                  ) : (
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">{task.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded text-[10px]', areaColors[task.area])}>
                        {task.area}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded text-[10px]', statusColors[task.status])}>
                        {task.status}
                      </span>
                      {task.responsible.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          👤 {task.responsible.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No hay eventos programados para hoy</p>
              <p className="text-sm text-muted-foreground/70 mt-1">¡Aprovecha para avanzar en tareas pendientes!</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Accesos Rápidos</h2>
          <div className="space-y-3">
            <Link
              href="/tasks"
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg hover:border-primary/30 hover:bg-white/10 transition-all group"
            >
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">Gestión de Tareas</div>
                <div className="text-xs text-muted-foreground">{stats.totalTasks} tareas activas</div>
              </div>
            </Link>
            <Link
              href="/calendar"
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg hover:border-primary/30 hover:bg-white/10 transition-all group"
            >
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="font-medium text-foreground">Calendario</div>
                <div className="text-xs text-muted-foreground">Ver programación</div>
              </div>
            </Link>
            <Link
              href="/team"
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg hover:border-primary/30 hover:bg-white/10 transition-all group"
            >
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="font-medium text-foreground">Equipo</div>
                <div className="text-xs text-muted-foreground">{team.length} miembros</div>
              </div>
            </Link>
            <Link
              href="/gates"
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg hover:border-primary/30 hover:bg-white/10 transition-all group"
            >
              <div className="p-2 bg-violet-500/10 rounded-lg group-hover:bg-violet-500/20 transition-colors">
                <Flag className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <div className="font-medium text-foreground">Gates</div>
                <div className="text-xs text-muted-foreground">Checkpoints del proyecto</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Tasks & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tasks */}
        <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              En Progreso
            </h2>
            <Link
              href="/tasks"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-white/5 border border-white/5 rounded-lg hover:border-primary/20 transition-all"
                >
                  <div className="font-medium text-foreground text-sm mb-1">{task.title}</div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 rounded text-[10px]', areaColors[task.area])}>
                      {task.area}
                    </span>
                    <span className="text-xs text-muted-foreground">{task.week}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay tareas en progreso
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Upcoming Gates */}
        <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 text-violet-500" />
            Próximos Hitos
          </h2>
          <div className="space-y-3">
            {upcomingGates.length > 0 ? (
              upcomingGates.map((gate) => (
                <div
                  key={gate.id}
                  className="p-3 bg-white/5 border border-white/5 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-foreground text-sm">{gate.name}</div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Pendiente
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{gate.week}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Todos los gates completados
              </div>
            )}
          </div>

          {/* Blocked tasks alert */}
          {stats.blocked > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="font-medium text-destructive text-sm">Atención Requerida</span>
              </div>
              <p className="text-xs text-destructive/80">
                {stats.blocked} tarea{stats.blocked > 1 ? 's' : ''} bloqueada{stats.blocked > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Progreso General del Proyecto
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Completado</span>
              <span className="text-sm font-bold text-foreground">
                {Math.round((stats.completed / stats.totalTasks) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${(stats.completed / stats.totalTasks) * 100}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 pt-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Completadas</div>
              <div className="text-lg font-bold text-emerald-500">{stats.completed}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">En Progreso</div>
              <div className="text-lg font-bold text-amber-500">{stats.inProgress}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Pendientes</div>
              <div className="text-lg font-bold text-blue-500">{stats.pending}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Bloqueadas</div>
              <div className="text-lg font-bold text-destructive">{stats.blocked}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useStore } from '@/lib/store';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

export default function StatsCards() {
  const stats = useStore((state) => state.getStats());

  const cards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: CheckCircle,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-500/10',
      text: 'text-blue-500'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-500'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-500/10',
      text: 'text-amber-500'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: AlertCircle,
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-500/10',
      text: 'text-orange-500'
    },
    {
      title: 'Blocked',
      value: stats.blocked,
      icon: XCircle,
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-500/10',
      text: 'text-red-500'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative overflow-hidden bg-card/40 backdrop-blur-md rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${card.gradient}`} />

          <div className="relative flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.text}`} />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tracking-tight">{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

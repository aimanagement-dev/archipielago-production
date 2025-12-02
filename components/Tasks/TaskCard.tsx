'use client';

import { Task } from '@/lib/types';
import { useStore } from '@/lib/store';
import { cn, statusColors, areaColors } from '@/lib/utils';
import { ChevronDown, ChevronUp, Users, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
}

export default function TaskCard({ task, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const updateTask = useStore((state) => state.updateTask);

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const statuses = ['Pendiente', 'En Progreso', 'Completado', 'Bloqueado'] as const;
    const currentIndex = statuses.indexOf(task.status as any);
    const nextIndex = (currentIndex + 1) % statuses.length;
    updateTask(task.id, { status: statuses[nextIndex] });
  };

  return (
    <div
      className="group bg-card/40 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden hover:border-primary/20 transition-all duration-200"
    >
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium tracking-wide', areaColors[task.area])}>
                {task.area}
              </span>
              <span className="text-[10px] text-muted-foreground">{task.week}</span>
              <span className="text-[10px] text-muted-foreground/50">• {task.month}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleStatus}
              className={cn('px-3 py-1 rounded-full text-[10px] font-medium transition-all hover:scale-105 active:scale-95', statusColors[task.status])}
            >
              {task.status}
            </button>
            <div className="p-1 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/5 animate-accordion-down">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{task.responsible.join(', ') || 'No assigned members'}</span>
                </div>
                {task.notes && (
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">{task.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Edit Task"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                    className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

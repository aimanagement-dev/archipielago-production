'use client';

import { Task, TaskStatus } from '@/lib/types';
import { useStore } from '@/lib/store';
import { cn, statusColors, areaColors } from '@/lib/utils';
import { ChevronDown, ChevronUp, Users, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import MeetingInvitation from './MeetingInvitation';
import AttendeeList from './AttendeeList';

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
    const statuses: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completado', 'Bloqueado'];
    const currentIndex = statuses.indexOf(task.status);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % statuses.length : 0;
    updateTask(task.id, { status: statuses[nextIndex] });
  };

  return (
    <div
      className="group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border border-border/50', areaColors[task.area])}>
                {task.area}
              </span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase">{task.week}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase">• {task.month}</span>
            </div>
            
            {/* Meet Link - MUY VISIBLE siempre que exista */}
            {task.meetLink && (
              <div className="mt-3">
                <a
                  href={task.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-bold transition-all border-2 border-blue-500/40 hover:border-blue-500/60 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.414 1.414.707.707c.39.39.39 1.024 0 1.414l-1.414 1.414c-.39.39-1.024.39-1.414 0l-.707-.707-1.414 1.414c-.39.39-1.024.39-1.414 0l-1.414-1.414c-.39-.39-.39-1.024 0-1.414l1.414-1.414-.707-.707c-.39-.39-.39-1.024 0-1.414l1.414-1.414c.39-.39 1.024-.39 1.414 0l.707.707 1.414-1.414c.39-.39 1.024-.39 1.414 0l1.414 1.414c.39.39.39 1.024 0 1.414l-1.414 1.414.707.707c.39.39.39 1.024 0 1.414z"/>
                  </svg>
                  <span>Unirse a Google Meet</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleStatus}
              className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 border border-border/20', statusColors[task.status])}
            >
              {task.status}
            </button>
            <div className="p-1 text-muted-foreground group-hover:text-primary transition-colors">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border animate-accordion-down">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                  <Users className="w-4 h-4" />
                  <span>{task.responsible && task.responsible.length > 0 ? task.responsible.join(', ') : 'No assigned members'}</span>
                </div>
                {task.meetLink && (
                  <div className="mt-2">
                    <a
                      href={task.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-colors border border-blue-500/30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.414 1.414.707.707c.39.39.39 1.024 0 1.414l-1.414 1.414c-.39.39-1.024.39-1.414 0l-.707-.707-1.414 1.414c-.39.39-1.024.39-1.414 0l-1.414-1.414c-.39-.39-.39-1.024 0-1.414l1.414-1.414-.707-.707c-.39-.39-.39-1.024 0-1.414l1.414-1.414c.39-.39 1.024-.39 1.414 0l.707.707 1.414-1.414c.39-.39 1.024-.39 1.414 0l1.414 1.414c.39.39.39 1.024 0 1.414l-1.414 1.414.707.707c.39.39.39 1.024 0 1.414z"/>
                      </svg>
                      Unirse a Google Meet
                    </a>
                  </div>
                )}
                <MeetingInvitation task={task} />
                <AttendeeList task={task} />
                {task.notes && (
                  <p className="text-sm text-foreground/80 leading-relaxed font-medium bg-muted/30 p-3 rounded-lg border border-border/50">{task.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4 self-end pb-1">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border border-border"
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
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-border"
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

'use client';

import { Task } from '@/lib/types';
import TaskCard from './TaskCard';

interface Props {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
}

export default function TaskList({ tasks, onEdit, onDelete }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
        <p className="text-muted-foreground font-medium">No hay tareas que coincidan con los filtros</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

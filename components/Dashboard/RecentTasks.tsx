'use client';

import { useStore } from '@/lib/store';
import { cn, statusColors, areaColors } from '@/lib/utils';
import { ListTodo } from 'lucide-react';

export default function RecentTasks() {
  const tasks = useStore((state) => state.tasks);
  const activeTasks = tasks.filter(t => t.status !== 'Completado').slice(0, 8);

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ListTodo className="w-5 h-5 text-primary" />
          </div>
          Active Tasks
        </h2>
        <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
          Priority
        </span>
      </div>

      <div className="space-y-3">
        {activeTasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:border-primary/30 transition-all duration-200 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{task.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium tracking-wide', areaColors[task.area])}>
                  {task.area}
                </span>
                <span className="text-[10px] text-muted-foreground">{task.week}</span>
              </div>
            </div>
            <span className={cn('px-2 py-1 rounded-full text-[10px] font-medium ml-2', statusColors[task.status])}>
              {task.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

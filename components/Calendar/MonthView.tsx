'use client';

import { Task, Gate } from '@/lib/types';
import { cn, statusColors, areaColors } from '@/lib/utils';
import { Flag } from 'lucide-react';

interface Props {
  tasks: Task[];
  gates: Gate[];
  monthKey: string;
}

export default function MonthView({ tasks, gates, monthKey }: Props) {
  // Group tasks by week
  const tasksByWeek: Record<string, Task[]> = {};
  tasks.forEach(task => {
    if (!tasksByWeek[task.week]) {
      tasksByWeek[task.week] = [];
    }
    tasksByWeek[task.week].push(task);
  });

  const weeks = Object.keys(tasksByWeek).sort();

  // Find gates for this month (simple check)
  const monthGates = gates.filter(g => {
    if (monthKey === 'Dic' && (g.week.includes('5') || g.week.includes('6'))) return true;
    if (monthKey === 'Ene' && (g.week.includes('9') || g.week.includes('10'))) return true;
    if (monthKey === 'Mar' && g.week.includes('16')) return true;
    if (monthKey === 'May' && g.week.includes('26')) return true;
    if (monthKey === 'Jul' && g.week.includes('32')) return true;
    return false;
  });

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay tareas programadas para este mes
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {monthGates.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
            <Flag className="w-5 h-5" />
            Gate este mes
          </div>
          {monthGates.map(gate => (
            <div key={gate.id} className="text-sm text-amber-700">
              {gate.name} - {gate.week}: {gate.deliverables.slice(0, 2).join(', ')}
            </div>
          ))}
        </div>
      )}

      {weeks.map(week => (
        <div key={week}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{week}</h3>
          <div className="grid gap-2">
            {tasksByWeek[week].map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', areaColors[task.area])}>
                    {task.area}
                  </span>
                  <span className="text-sm text-gray-900">{task.title}</span>
                </div>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColors[task.status])}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

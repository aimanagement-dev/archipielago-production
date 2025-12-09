'use client';

import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Flag, CheckCircle, Clock } from 'lucide-react';

export default function GatesTimeline() {
  const gates = useStore((state) => state.gates);

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Flag className="w-5 h-5 text-primary" />
          </div>
          Production Gates
        </h2>
        <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
          Milestones
        </span>
      </div>

      <div className="space-y-0 relative">
        {/* Vertical Line */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

        {gates.map((gate, index) => (
          <div key={gate.id} className="relative flex gap-6 group">
            <div className="flex flex-col items-center z-10">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300',
                gate.status === 'Aprobado'
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : gate.status === 'Rechazado'
                    ? 'bg-red-500 border-red-400 text-white'
                    : 'bg-card border-muted-foreground/30 text-muted-foreground group-hover:border-primary group-hover:text-primary'
              )}>
                {gate.status === 'Aprobado' ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < gates.length - 1 && (
                <div className="w-px h-8" />
              )}
            </div>

            <div className="flex-1 pb-8 group-hover:translate-x-1 transition-transform duration-200">
              <div className="bg-white/5 border border-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-foreground">{gate.name}</h3>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    gate.status === 'Aprobado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      gate.status === 'En Progreso' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-white/5 text-muted-foreground border-white/10'
                  )}>
                    {gate.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Clock className="w-3 h-3" />
                  <span>{gate.week}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gate.deliverables.slice(0, 3).map((d, i) => (
                    <span key={i} className="text-[10px] bg-black/20 px-2 py-1 rounded text-muted-foreground">
                      {d}
                    </span>
                  ))}
                  {gate.deliverables.length > 3 && (
                    <span className="text-[10px] px-1 text-muted-foreground">+{gate.deliverables.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

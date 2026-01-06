'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Gate } from '@/lib/types';
import { Flag, Plus, CheckCircle, Clock, XCircle, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import GateModal from '@/components/Gates/GateModal';

const statusConfig = {
  'Pendiente': { color: 'bg-amber-500/10 text-amber-700 border-amber-500/30 font-bold uppercase tracking-wider', icon: Clock },
  'En Progreso': { color: 'bg-blue-500/10 text-blue-700 border-blue-500/30 font-bold uppercase tracking-wider', icon: Clock },
  'Completado': { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-bold uppercase tracking-wider', icon: CheckCircle },
  'Aprobado': { color: 'bg-green-500/10 text-green-700 border-green-500/30 font-bold uppercase tracking-wider', icon: CheckCircle },
  'Rechazado': { color: 'bg-red-500/10 text-red-700 border-red-500/30 font-bold uppercase tracking-wider', icon: XCircle },
};

export default function GatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGate, setEditingGate] = useState<Gate | undefined>(undefined);

  const { gates, addGate, updateGate, deleteGate } = useStore();
  const { user } = useAuth();

  const handleEdit = (gate: Gate) => {
    setEditingGate(gate);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el gate "${name}"?`)) {
      deleteGate(id);
    }
  };

  const handleSave = (gateData: Omit<Gate, 'id'>) => {
    if (editingGate) {
      updateGate(editingGate.id, gateData);
    } else {
      addGate(gateData);
    }
    setIsModalOpen(false);
    setEditingGate(undefined);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingGate(undefined);
  };

  // Stats
  const stats = {
    total: gates.length,
    completed: gates.filter(g => g.status === 'Completado' || g.status === 'Aprobado').length,
    inProgress: gates.filter(g => g.status === 'En Progreso').length,
    pending: gates.filter(g => g.status === 'Pendiente').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Production Gates</h1>
          <p className="text-muted-foreground font-medium">Checkpoints y milestones del proyecto</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setEditingGate(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nuevo Gate
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <Flag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">{stats.total}</div>
              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Total Gates</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">{stats.completed}</div>
              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Completados</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">{stats.inProgress}</div>
              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">En Progreso</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground">{stats.pending}</div>
              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Pendientes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gates Timeline */}
      <div className="bg-card rounded-2xl border border-border p-8 shadow-md">
        <h2 className="text-2xl font-black text-foreground mb-8 text-center uppercase tracking-widest">Timeline de Gates</h2>

        <div className="space-y-0 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[35px] top-4 bottom-4 w-1 bg-gradient-to-b from-primary via-blue-500 to-emerald-500 opacity-20 hidden md:block" />

          {gates.map((gate, index) => {
            const config = statusConfig[gate.status];
            const Icon = config.icon;

            return (
              <div
                key={gate.id}
                className="group relative bg-muted/20 border border-border rounded-2xl p-6 mb-6 hover:bg-muted/40 hover:border-primary/40 transition-all hover:shadow-lg"
              >
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Icon */}
                  <div className={cn(
                    'p-4 rounded-2xl border-2 relative z-10 shadow-sm transition-transform group-hover:scale-110',
                    gate.status === 'Completado' || gate.status === 'Aprobado'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : gate.status === 'En Progreso'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : gate.status === 'Rechazado'
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-amber-500/10 border-amber-500/30'
                  )}>
                    <Icon className={cn(
                      'w-8 h-8',
                      gate.status === 'Completado' || gate.status === 'Aprobado' ? 'text-emerald-600' :
                        gate.status === 'En Progreso' ? 'text-blue-600' :
                          gate.status === 'Rechazado' ? 'text-red-600' :
                            'text-amber-600'
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-1 tracking-tight group-hover:text-primary transition-colors">{gate.name}</h3>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest tabular-nums bg-muted px-2 py-1 rounded-md border border-border inline-block">{gate.week}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'px-4 py-1.5 rounded-full text-[10px] font-black border shadow-sm uppercase tracking-wider',
                          config.color
                        )}>
                          {gate.status}
                        </span>

                        {user?.role === 'admin' && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                            <button
                              onClick={() => handleEdit(gate)}
                              className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-primary hover:bg-muted transition-all shadow-sm"
                              title="Editar"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(gate.id, gate.name)}
                              className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-destructive hover:bg-muted transition-all shadow-sm"
                              title="Eliminar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {gate.description && (
                      <p className="text-sm font-medium text-foreground/70 mb-5 leading-relaxed bg-card/50 p-4 rounded-xl border border-border/50">
                        {gate.description}
                      </p>
                    )}

                    {/* Deliverables */}
                    {gate.deliverables && gate.deliverables.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-primary" />
                          Entregables Requeridos:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {gate.deliverables.map((deliverable, i) => {
                            // Handle legacy string array if store wasn't cleared
                            const isLegacy = typeof deliverable === 'string';
                            const name = isLegacy ? deliverable : deliverable.name;
                            const isCompleted = !isLegacy && deliverable.completed;

                            return (
                              <div
                                key={i}
                                className={cn(
                                  "flex items-center gap-3 text-sm font-bold text-foreground bg-card border px-4 py-3 rounded-xl shadow-sm transition-all cursor-pointer group/item",
                                  isCompleted
                                    ? "border-emerald-500/50 bg-emerald-500/5"
                                    : "border-border hover:border-primary/40"
                                )}
                                onClick={() => {
                                  // Determine new completed state
                                  const newCompleted = !isCompleted;

                                  // Create new deliverables array
                                  const newDeliverables = [...gate.deliverables];
                                  if (isLegacy) {
                                    // Convert string to object
                                    newDeliverables[i] = { name: deliverable as string, completed: newCompleted };
                                  } else {
                                    newDeliverables[i] = { ...deliverable, completed: newCompleted };
                                  }

                                  // Check if ALL are completed
                                  const allCompleted = newDeliverables.every(d =>
                                    typeof d === 'string' ? false : d.completed
                                  );

                                  // Auto-status update logic
                                  let newStatus = gate.status;
                                  if (allCompleted) {
                                    newStatus = 'Completado';
                                  } else if (gate.status === 'Completado') {
                                    newStatus = 'En Progreso';
                                  }

                                  updateGate(gate.id, { deliverables: newDeliverables, status: newStatus });
                                }}
                              >
                                <div className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                                  isCompleted
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "bg-muted border-muted-foreground/30 group-hover/item:border-primary"
                                )}>
                                  {isCompleted && <CheckCircle className="w-3.5 h-3.5" />}
                                </div>
                                <span className={cn(isCompleted && "text-muted-foreground line-through decoration-emerald-500/50")}>
                                  {name}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center gap-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {gate.responsible && (
                        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
                          <span className="text-lg">👤</span>
                          <span>{gate.responsible}</span>
                        </div>
                      )}
                      {gate.date && (
                        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
                          <span className="text-lg">📅</span>
                          <span>{gate.date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {gates.length === 0 && (
          <div className="text-center py-12">
            <Flag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No hay gates configurados</p>
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Crear el primer gate
              </button>
            )}
          </div>
        )}
      </div>

      <GateModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialData={editingGate}
      />
    </div>
  );
}

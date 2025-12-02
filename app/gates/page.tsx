'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Gate } from '@/lib/types';
import { Flag, Plus, CheckCircle, Clock, XCircle, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import GateModal from '@/components/Gates/GateModal';

const statusConfig = {
  'Pendiente': { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
  'En Progreso': { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
  'Completado': { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle },
  'Aprobado': { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
  'Rechazado': { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
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
          <h1 className="text-3xl font-bold text-foreground">Production Gates</h1>
          <p className="text-muted-foreground">Checkpoints y milestones del proyecto</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setEditingGate(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <Plus className="w-5 h-5" />
            Nuevo Gate
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Flag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Gates</div>
            </div>
          </div>
        </div>
        <div className="bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Completados</div>
            </div>
          </div>
        </div>
        <div className="bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground">En Progreso</div>
            </div>
          </div>
        </div>
        <div className="bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pendientes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gates Timeline */}
      <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Timeline de Gates</h2>

        <div className="space-y-4">
          {gates.map((gate, index) => {
            const config = statusConfig[gate.status];
            const Icon = config.icon;

            return (
              <div
                key={gate.id}
                className="group relative bg-white/5 border border-white/5 rounded-xl p-6 hover:border-primary/20 transition-all"
              >
                {/* Connecting Line */}
                {index < gates.length - 1 && (
                  <div className="absolute left-9 top-[60px] w-0.5 h-12 bg-gradient-to-b from-white/20 to-transparent" />
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'p-3 rounded-xl border-2 relative z-10',
                    gate.status === 'Completado' || gate.status === 'Aprobado'
                      ? 'bg-emerald-500/20 border-emerald-500/30'
                      : gate.status === 'En Progreso'
                        ? 'bg-blue-500/20 border-blue-500/30'
                        : gate.status === 'Rechazado'
                          ? 'bg-red-500/20 border-red-500/30'
                          : 'bg-amber-500/20 border-amber-500/30'
                  )}>
                    <Icon className={cn(
                      'w-6 h-6',
                      gate.status === 'Completado' || gate.status === 'Aprobado' ? 'text-emerald-500' :
                        gate.status === 'En Progreso' ? 'text-blue-500' :
                          gate.status === 'Rechazado' ? 'text-red-500' :
                            'text-amber-500'
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-1">{gate.name}</h3>
                        <p className="text-sm text-muted-foreground">{gate.week}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium border',
                          config.color
                        )}>
                          {gate.status}
                        </span>

                        {user?.role === 'admin' && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(gate)}
                              className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(gate.id, gate.name)}
                              className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {gate.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {gate.description}
                      </p>
                    )}

                    {/* Deliverables */}
                    {gate.deliverables.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Entregables:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {gate.deliverables.map((deliverable, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm text-foreground bg-white/5 px-3 py-2 rounded-lg"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {deliverable}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      {gate.responsible && (
                        <div className="flex items-center gap-1">
                          <span>👤</span>
                          <span>{gate.responsible}</span>
                        </div>
                      )}
                      {gate.date && (
                        <div className="flex items-center gap-1">
                          <span>📅</span>
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

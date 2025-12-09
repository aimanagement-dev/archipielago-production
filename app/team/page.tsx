'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { TeamMember } from '@/lib/types';
import { Plus, Mail, Users, Pencil, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import TeamModal from '@/components/Team/TeamModal';

export default function TeamPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const { team, addMember, updateMember, deleteMember } = useStore();
  const { user } = useAuth();

  const filteredTeam = team.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar a ${name} del equipo?`)) {
      deleteMember(id);
    }
  };

  const handleSave = (memberData: Omit<TeamMember, 'id'>) => {
    if (editingMember) {
      updateMember(editingMember.id, memberData);
    } else {
      addMember(memberData);
    }
    setIsModalOpen(false);
    setEditingMember(undefined);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingMember(undefined);
  };

  // Group by role
  const roleGroups: Record<string, TeamMember[]> = {};
  filteredTeam.forEach(member => {
    const category = member.role.split(' ')[0]; // First word of role
    if (!roleGroups[category]) {
      roleGroups[category] = [];
    }
    roleGroups[category].push(member);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipo de Producción</h1>
          <p className="text-muted-foreground">Gestiona el crew y contactos del proyecto</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setEditingMember(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <Plus className="w-5 h-5" />
            Nuevo Miembro
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{team.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
        <div className="bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {team.filter(m => m.status === 'Activo').length}
              </div>
              <div className="text-xs text-muted-foreground">Activos</div>
            </div>
          </div>
        </div>
        <div className="bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {team.filter(m => m.type === 'Full-time').length}
              </div>
              <div className="text-xs text-muted-foreground">Full-time</div>
            </div>
          </div>
        </div>
        <div className="bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {team.filter(m => m.type === 'Part-time').length}
              </div>
              <div className="text-xs text-muted-foreground">Part-time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, rol o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeam.map((member) => (
          <div
            key={member.id}
            className="group bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6 hover:border-primary/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                  <span className="text-lg font-bold text-primary">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id, member.name)}
                    className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {member.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${member.email}`} className="hover:text-primary transition-colors">
                    {member.email}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap mt-3">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                  member.status === 'Activo'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                )}>
                  {member.status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-muted-foreground border border-white/10">
                  {member.type}
                </span>
              </div>

              {member.notes && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                  {member.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTeam.length === 0 && (
        <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-12 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No se encontraron miembros</p>
        </div>
      )}

      <TeamModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialData={editingMember}
      />
    </div>
  );
}

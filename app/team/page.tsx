'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { TeamMember } from '@/lib/types';
import { Plus, Mail, Users, Pencil, Trash2, Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import TeamModal from '@/components/Team/TeamModal';
import ImportModal from '@/components/Team/ImportModal';
import { Upload } from 'lucide-react';

export default function TeamPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

  const handleSendInvitation = async (member: TeamMember) => {
    if (!member.email) {
      alert('Este miembro no tiene un email registrado.');
      return;
    }

    if (!confirm(`¿Enviar invitación por email a ${member.name} (${member.email})?`)) {
      return;
    }

    try {
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://archipielago-production.vercel.app';
      const loginUrl = `${appUrl}/login`;

      const emailSubject = `Invitación a Archipiélago Production OS`;
      const emailBody = `
Hola ${member.name},

Te invitamos a unirte a Archipiélago Production OS, nuestra plataforma de gestión de producción cinematográfica.

Con esta plataforma podrás:
- Ver y gestionar tareas asignadas
- Acceder al calendario de producción
- Colaborar con el equipo
- Mantenerte al día con los hitos del proyecto

Para comenzar, simplemente haz clic en el siguiente enlace e inicia sesión con tu cuenta de Google:

${loginUrl}

Si tienes alguna pregunta, no dudes en contactarnos.

¡Esperamos verte pronto!

Equipo de Archipiélago Production
      `.trim();

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f59e0b;">Invitación a Archipiélago Production OS</h2>
          <p>Hola <strong>${member.name}</strong>,</p>
          <p>Te invitamos a unirte a <strong>Archipiélago Production OS</strong>, nuestra plataforma de gestión de producción cinematográfica.</p>
          <p>Con esta plataforma podrás:</p>
          <ul>
            <li>Ver y gestionar tareas asignadas</li>
            <li>Acceder al calendario de producción</li>
            <li>Colaborar con el equipo</li>
            <li>Mantenerte al día con los hitos del proyecto</li>
          </ul>
          <p>Para comenzar, simplemente haz clic en el siguiente enlace e inicia sesión con tu cuenta de Google:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Acceder a la Plataforma
            </a>
          </p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>¡Esperamos verte pronto!</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Equipo de Archipiélago Production
          </p>
        </div>
      `;

      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: member.email,
          subject: emailSubject,
          text: emailBody,
          html: emailHtml,
          useSystemEmail: true, // Enviar desde la cuenta del sistema
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al enviar el email');
      }

      // IMPORTANTE: Otorgar acceso automáticamente al usuario invitado
      let accessGranted = false;
      let dbShared = false;

      try {
        // 1. Actualizar el miembro con accessGranted = true
        await updateMember(member.id, { 
          ...member, 
          accessGranted: true // Otorgar acceso automáticamente
        });
        accessGranted = true;
        console.log(`✅ Acceso otorgado automáticamente a ${member.email}`);

        // NOTA: NO compartimos el DB automáticamente
        // El usuario puede acceder a la app con accessGranted = true sin necesidad de acceso al DB
        // El sistema verificará el acceso usando las credenciales del admin en cada request

      } catch (updateError) {
        console.error('Error otorgando acceso al usuario:', updateError);
        // Continuar de todas formas, el email ya se envió
        alert(`⚠️ Invitación enviada pero hubo un error al otorgar acceso. Por favor, verifica manualmente que el usuario tenga accessGranted = true en su ficha.`);
        return;
      }

      // Mensaje de éxito con detalles e instrucciones importantes
      const successMessage = `✅ Invitación enviada exitosamente a ${member.name} (${member.email})\n\n` +
        `✓ Email de invitación enviado\n` +
        `✓ Acceso otorgado automáticamente (accessGranted = true)\n\n` +
        `⚠️ IMPORTANTE - Acción Requerida:\n` +
        `Debes agregar ${member.email} como "Test User" en Google Cloud Console:\n\n` +
        `1. Ve a: https://console.cloud.google.com/\n` +
        `2. APIs & Services > OAuth consent screen\n` +
        `3. Sección "Test users" > "+ ADD USERS"\n` +
        `4. Agrega: ${member.email}\n` +
        `5. Guarda los cambios\n\n` +
        `Sin esto, el usuario será bloqueado por Google al intentar hacer login.\n\n` +
        `Una vez agregado, el usuario podrá iniciar sesión con su cuenta de Google.`;

      alert(successMessage);
      
      // También mostrar en consola para referencia
      console.log(`\n📋 USUARIO PENDIENTE DE AGREGAR COMO TEST USER:`);
      console.log(`Email: ${member.email}`);
      console.log(`Instrucciones: Ve a Google Cloud Console > OAuth consent screen > Test users > Agregar este email\n`);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      alert(`❌ Error al enviar invitación: ${error.message}`);
    }
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
          <div className="flex gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary-foreground rounded-lg font-medium hover:bg-secondary/20 transition-colors border border-white/10"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button
              onClick={() => {
                setEditingMember(undefined);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Miembro</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{team.length}</div>
              <div className="text-xs text-muted-foreground font-medium">Total</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {team.filter(m => m.status === 'Activo').length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Activos</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {team.filter(m => m.type === 'Full-time').length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Full-time</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {team.filter(m => m.type === 'Part-time').length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Part-time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, rol o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeam.map((member) => (
          <div
            key={member.id}
            className="group bg-card rounded-xl border border-border p-6 hover:border-primary/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <span className="text-lg font-bold text-primary">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{member.role}</p>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  {member.email && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendInvitation(member);
                      }}
                      className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      title="Enviar Invitación"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(member);
                    }}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(member.id, member.name);
                    }}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {member.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${member.email}`} className="hover:text-primary transition-colors">
                    {member.email}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap mt-3">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase',
                  member.status === 'Activo'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-600 border-red-500/30'
                )}>
                  {member.status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border uppercase">
                  {member.type}
                </span>
              </div>

              {member.notes && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2 font-medium">
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
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}

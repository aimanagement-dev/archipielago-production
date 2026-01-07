'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { X, Send, User, Users, Mail, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamMember, Attachment } from '@/lib/types';
import { DEPARTMENTS } from '@/lib/constants';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    useSystemEmail?: boolean; // Si true, envía desde ai.management@archipielagofilm.com
    initialData?: {
        to?: string[];
        subject?: string;
        body?: string;
        attachments?: Attachment[];
    };
}

export default function ComposeModal({ isOpen, onClose, initialData, useSystemEmail = false }: ComposeModalProps) {
    const { team, fetchTeam } = useStore();
    const [to, setTo] = useState<string[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [notificationType, setNotificationType] = useState<'email' | 'push'>('email');
    const [showDepartments, setShowDepartments] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Fetch team only when opening
            fetchTeam();

            // Set initial data
            if (initialData) {
                setTo(initialData.to || []);
                setSubject(initialData.subject || '');
                setBody(initialData.body || '');
                setAttachments(initialData.attachments || []);
            } else {
                setTo([]);
                setSubject('');
                setBody('');
                setAttachments([]);
            }
        }
    }, [isOpen]); // Only run when opening status changes

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            const allRecipients = getAllRecipients();
            
            if (allRecipients.length === 0) {
                alert('Por favor selecciona al menos un destinatario o departamento');
                setIsSending(false);
                return;
            }

            // Append attachments to body for Drive links handling
            let finalBody = body;
            let finalHtml = body.replace(/\n/g, '<br/>');

            if (attachments.length > 0) {
                const attachmentsList = attachments.map(a => `- ${a.name}: ${a.url}`).join('\n');
                const attachmentsHtml = attachments.map(a => `<li><a href="${a.url}">${a.name}</a></li>`).join('');

                finalBody += `\n\nAttachments:\n${attachmentsList}`;
                finalHtml += `<br/><br/><strong>Attachments:</strong><ul>${attachmentsHtml}</ul>`;
            }

            if (notificationType === 'email') {
                // Enviar por email
                const response = await fetch('/api/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: allRecipients.join(','),
                        subject,
                        text: finalBody,
                        html: finalHtml,
                        useSystemEmail: useSystemEmail // Usar email del sistema si está habilitado
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || errorData.error || 'Failed to send email');
                }

                alert(`Correo enviado exitosamente a ${allRecipients.length} destinatario(s)!`);
            } else {
                // TODO: Implementar notificaciones push en la app
                // Por ahora, mostrar mensaje informativo
                alert(`Notificaciones push aún no están implementadas. Se enviará por email a ${allRecipients.length} destinatario(s).`);
                
                // Enviar por email como fallback
                const response = await fetch('/api/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: allRecipients.join(','),
                        subject,
                        text: finalBody,
                        html: finalHtml
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || errorData.error || 'Failed to send email');
                }
            }

            onClose();
        } catch (error: any) {
            console.error('Error sending notification:', error);
            alert(`Error al enviar: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const toggleRecipient = (email: string) => {
        if (to.includes(email)) {
            setTo(to.filter(e => e !== email));
        } else {
            setTo([...to, email]);
        }
    };

    const toggleDepartment = (dept: string) => {
        if (departments.includes(dept)) {
            setDepartments(departments.filter(d => d !== dept));
        } else {
            setDepartments([...departments, dept]);
        }
    };

    // Obtener todos los emails de los departamentos seleccionados
    const getAllRecipients = (): string[] => {
        const deptEmails = new Set<string>();
        departments.forEach(dept => {
            team.filter(m => m.department === dept && m.email).forEach(m => {
                if (m.email) deptEmails.add(m.email);
            });
        });
        return Array.from(new Set([...to, ...Array.from(deptEmails)]));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Send className="w-5 h-5 text-primary" />
                        Redactar Mensaje
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSend} className="flex-1 overflow-y-auto flex flex-col">
                    <div className="p-6 space-y-4 flex-1">
                        {/* Notification Type Selector */}
                        <div className="flex gap-2 p-1 bg-black/20 rounded-lg border border-white/10">
                            <button
                                type="button"
                                onClick={() => setNotificationType('email')}
                                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                    notificationType === 'email'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Mail className="w-4 h-4" />
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setNotificationType('push')}
                                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                    notificationType === 'push'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Bell className="w-4 h-4" />
                                Notificación App
                            </button>
                        </div>

                        {/* Recipients */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Para:</label>
                                <button
                                    type="button"
                                    onClick={() => setShowDepartments(!showDepartments)}
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                >
                                    <Users className="w-3 h-3" />
                                    {showDepartments ? 'Personas' : 'Departamentos'}
                                </button>
                            </div>
                            
                            {/* Selected Recipients */}
                            <div className="flex flex-wrap gap-2 p-2 bg-black/20 border border-white/10 rounded-lg min-h-[42px]">
                                {to.map(email => {
                                    const member = team.find(m => m.email === email);
                                    return (
                                        <span key={email} className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 text-primary text-xs rounded-md">
                                            <User className="w-3 h-3" />
                                            {member ? member.name : email}
                                            <button
                                                type="button"
                                                onClick={() => toggleRecipient(email)}
                                                className="hover:text-foreground"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                                {departments.map(dept => (
                                    <span key={dept} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md">
                                        <Users className="w-3 h-3" />
                                        {dept}
                                        <button
                                            type="button"
                                            onClick={() => toggleDepartment(dept)}
                                            className="hover:text-foreground"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                                <span className="text-xs text-muted-foreground self-center px-1">
                                    {to.length === 0 && departments.length === 0 ? 'Selecciona destinatarios...' : ''}
                                </span>
                            </div>

                            {/* Team List or Departments List */}
                            {showDepartments ? (
                                <div className="max-h-32 overflow-y-auto border border-white/5 rounded-lg bg-black/10">
                                    {DEPARTMENTS.map(dept => (
                                        <button
                                            key={dept}
                                            type="button"
                                            onClick={() => toggleDepartment(dept)}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 transition-colors ${
                                                departments.includes(dept) ? 'bg-primary/10' : ''
                                            }`}
                                        >
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-foreground">{dept}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {team.filter(m => m.department === dept).length} miembros
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="max-h-32 overflow-y-auto border border-white/5 rounded-lg bg-black/10">
                                    {team.filter(m => m.email && !to.includes(m.email)).map(member => (
                                        <button
                                            key={member.id}
                                            type="button"
                                            onClick={() => member.email && toggleRecipient(member.email)}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 transition-colors"
                                        >
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-foreground">{member.name}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">{member.email}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Subject */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Asunto</label>
                            <input
                                type="text"
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                placeholder="Asunto del correo..."
                            />
                        </div>

                        {/* Body */}
                        <div className="space-y-1.5 flex-1 flex flex-col">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mensaje</label>
                            <textarea
                                required
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="w-full flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 min-h-[200px] font-mono"
                                placeholder="Escribe tu mensaje aquí..."
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSending || (to.length === 0 && departments.length === 0)}
                            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {notificationType === 'email' ? (
                                <>
                                    <Mail className="w-4 h-4" />
                                    {isSending ? 'Enviando...' : 'Enviar Email'}
                                </>
                            ) : (
                                <>
                                    <Bell className="w-4 h-4" />
                                    {isSending ? 'Enviando...' : 'Enviar Notificación'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

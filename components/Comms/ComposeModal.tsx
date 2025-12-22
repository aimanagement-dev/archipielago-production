'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { X, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamMember } from '@/lib/types';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        to?: string[];
        subject?: string;
        body?: string;
    };
}

export default function ComposeModal({ isOpen, onClose, initialData }: ComposeModalProps) {
    const { team, fetchTeam } = useStore();
    const [to, setTo] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Fetch team only when opening
            fetchTeam();

            // Set initial data
            if (initialData) {
                setTo(initialData.to || []);
                setSubject(initialData.subject || '');
                setBody(initialData.body || '');
            } else {
                setTo([]);
                setSubject('');
                setBody('');
            }
        }
    }, [isOpen]); // Only run when opening status changes

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            const response = await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: to.join(','),
                    subject,
                    text: body,
                    html: body.replace(/\n/g, '<br/>') // Basic formatting
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            alert('Correo enviado exitosamente!');
            onClose();
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Error al enviar el correo. Por favor intenta de nuevo.');
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
                        {/* Recipients */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Para:</label>
                            <div className="flex flex-wrap gap-2 p-2 bg-black/20 border border-white/10 rounded-lg min-h-[42px]">
                                {to.map(email => {
                                    const member = team.find(m => m.email === email);
                                    return (
                                        <span key={email} className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 text-primary text-xs rounded-md">
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
                                <span className="text-xs text-muted-foreground self-center px-1">
                                    {to.length === 0 ? 'Selecciona destinatarios de la lista...' : ''}
                                </span>
                            </div>

                            {/* Team List */}
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
                            disabled={isSending || to.length === 0}
                            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {isSending ? 'Enviando...' : 'Enviar Correo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

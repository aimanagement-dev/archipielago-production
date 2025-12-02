'use client';

import { useState, useEffect } from 'react';
import { TeamMember, MemberStatus, MemberType } from '@/lib/types';

interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Omit<TeamMember, 'id'>) => void;
    initialData?: TeamMember;
}

const STATUSES: MemberStatus[] = ['Activo', 'Inactivo'];
const TYPES: MemberType[] = ['Full-time', 'Part-time'];

export default function TeamModal({ isOpen, onClose, onSave, initialData }: TeamModalProps) {
    const [formData, setFormData] = useState<Partial<TeamMember>>({
        name: '',
        role: '',
        status: 'Activo',
        type: 'Full-time',
        email: '',
        notes: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                role: '',
                status: 'Activo',
                type: 'Full-time',
                email: '',
                notes: '',
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<TeamMember, 'id'>);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-card border border-white/10 rounded-xl shadow-2xl p-6 transform transition-all">
                <h2 className="text-xl font-bold text-foreground mb-4">
                    {initialData ? 'Editar Miembro' : 'Nuevo Miembro'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            placeholder="Nombre completo..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Rol</label>
                        <input
                            type="text"
                            required
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            placeholder="Ej: Director, Producer, DOP..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Estado</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            >
                                {STATUSES.map((status) => (
                                    <option key={status} value={status} className="bg-card text-foreground">
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as MemberType })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            >
                                {TYPES.map((type) => (
                                    <option key={type} value={type} className="bg-card text-foreground">
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            placeholder="email@ejemplo.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Notas</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 min-h-[80px]"
                            placeholder="Información adicional..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        >
                            {initialData ? 'Guardar Cambios' : 'Crear Miembro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

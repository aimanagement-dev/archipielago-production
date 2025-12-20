'use client';

import { useState, useEffect } from 'react';
import { TeamMember, MemberStatus, MemberType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { User, Briefcase, Phone, Heart } from 'lucide-react';

interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: Omit<TeamMember, 'id'>) => void;
    initialData?: TeamMember;
}

const STATUSES: MemberStatus[] = ['Activo', 'Inactivo'];
const TYPES: MemberType[] = ['Full-time', 'Part-time'];

type Tab = 'general' | 'professional' | 'contact' | 'emergency';

export default function TeamModal({ isOpen, onClose, onSave, initialData }: TeamModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [formData, setFormData] = useState<Partial<TeamMember>>({
        name: '',
        role: '',
        status: 'Activo',
        type: 'Full-time',
        email: '',
        phone: '',
        notes: '',
        socials: {}
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
                socials: {}
            });
        }
        setActiveTab('general');
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<TeamMember, 'id'>);
        onClose();
    };

    if (!isOpen) return null;

    const Input = ({ label, value, onChange, placeholder, type = 'text', required = false }: any) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
            <input
                type={type}
                required={required}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                placeholder={placeholder}
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-card border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            {initialData ? 'Editar Miembro' : 'Nuevo Miembro'}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">Completa los detalles del perfil</p>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                        {[
                            { id: 'general', icon: User, label: 'General' },
                            { id: 'professional', icon: Briefcase, label: 'Pro' },
                            { id: 'contact', icon: Phone, label: 'Contacto' },
                            { id: 'emergency', icon: Heart, label: 'Salud/Emerg' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={cn(
                                    "p-2 rounded-md transition-all flex items-center gap-2 text-xs font-medium",
                                    activeTab === tab.id
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                                title={tab.label}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:block">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">

                        {activeTab === 'general' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Input label="Nombre Completo" value={formData.name} onChange={(v: string) => setFormData({ ...formData, name: v })} required placeholder="Ej: Ana García" />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="ID / DNI / Pasaporte" value={formData.idNumber} onChange={(v: string) => setFormData({ ...formData, idNumber: v })} placeholder="Documento de identidad" />
                                    <Input label="Nacionalidad" value={formData.nationality} onChange={(v: string) => setFormData({ ...formData, nationality: v })} placeholder="Ej: Dominicana" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            {STATUSES.map(s => <option key={s} value={s} className="bg-card">{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Contrato</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as MemberType })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            {TYPES.map(t => <option key={t} value={t} className="bg-card">{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas / Bio</label>
                                    <textarea
                                        value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 min-h-[100px]"
                                        placeholder="Información general..."
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'professional' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Departamento" value={formData.department} onChange={(v: string) => setFormData({ ...formData, department: v })} placeholder="Ej: Camera" />
                                    <Input label="Posición / Cargo" value={formData.position} onChange={(v: string) => setFormData({ ...formData, position: v, role: v })} placeholder="Ej: DoP" required />
                                </div>
                                <Input label="Sindicato / Guild" value={formData.union} onChange={(v: string) => setFormData({ ...formData, union: v })} placeholder="Ej: ADOCINE" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tarifa Diaria</label>
                                        <input
                                            type="number"
                                            value={formData.dailyRate || ''}
                                            onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Moneda</label>
                                        <select
                                            value={formData.currency || 'USD'}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            <option value="USD" className="bg-card">USD</option>
                                            <option value="DOP" className="bg-card">DOP</option>
                                            <option value="EUR" className="bg-card">EUR</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h3 className="text-sm font-bold text-muted-foreground">Enlaces Profesionales</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="LinkedIn URL" value={formData.socials?.linkedin} onChange={(v: string) => setFormData({ ...formData, socials: { ...formData.socials, linkedin: v } })} placeholder="https://linkedin.com/in/..." />
                                        <Input label="IMDb URL" value={formData.socials?.imdb} onChange={(v: string) => setFormData({ ...formData, socials: { ...formData.socials, imdb: v } })} placeholder="https://imdb.com/..." />
                                        <Input label="Portfolio / Website" value={formData.socials?.website} onChange={(v: string) => setFormData({ ...formData, socials: { ...formData.socials, website: v } })} placeholder="https://..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Input label="Email Principal" value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} type="email" placeholder="correo@ejemplo.com" />
                                <Input label="Email Secundario" value={formData.secondaryEmail} onChange={(v: string) => setFormData({ ...formData, secondaryEmail: v })} type="email" placeholder="personal@ejemplo.com" />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Teléfono / Celular" value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} placeholder="+1 (829) 000-0000" />
                                    <Input label="Instagram" value={formData.socials?.instagram} onChange={(v: string) => setFormData({ ...formData, socials: { ...formData.socials, instagram: v } })} placeholder="@usuario" />
                                </div>
                                <Input label="Dirección Física" value={formData.address} onChange={(v: string) => setFormData({ ...formData, address: v })} placeholder="Calle, Ciudad, Sector..." />
                            </div>
                        )}

                        {activeTab === 'emergency' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-lg space-y-4">
                                    <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                                        <Heart className="w-4 h-4" />
                                        Contacto de Emergencia
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Nombre Contacto" value={formData.emergencyContactName} onChange={(v: string) => setFormData({ ...formData, emergencyContactName: v })} placeholder="Nombre" />
                                        <Input label="Relación" value={formData.emergencyContactRelation} onChange={(v: string) => setFormData({ ...formData, emergencyContactRelation: v })} placeholder="Madre, Esposo, etc." />
                                    </div>
                                    <Input label="Teléfono Emergencia" value={formData.emergencyContactPhone} onChange={(v: string) => setFormData({ ...formData, emergencyContactPhone: v })} placeholder="Teléfono urgente" />
                                </div>

                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg space-y-4">
                                    <h3 className="text-sm font-bold text-blue-400">Salud & Logística</h3>
                                    <Input label="Requerimientos Dietéticos" value={formData.dietaryRequirements} onChange={(v: string) => setFormData({ ...formData, dietaryRequirements: v })} placeholder="Vegetariano, Kosher..." />
                                    <Input label="Alergias Médicas" value={formData.allergies} onChange={(v: string) => setFormData({ ...formData, allergies: v })} placeholder="Penicilina, Maní..." />
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3 sticky bottom-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                        >
                            {initialData ? 'Guardar Cambios' : 'Crear Ficha'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

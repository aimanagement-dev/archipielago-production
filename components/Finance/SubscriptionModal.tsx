'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Subscription, TeamMember } from '@/lib/types';
import { X, Plus, Search, Users, Upload, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FINANCE_DRIVE_FOLDER_ID } from '@/lib/constants';
import TeamModal from '@/components/Team/TeamModal';
import DrivePicker from '@/components/Drive/DrivePicker';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (subscription: Partial<Subscription>) => void;
    initialData?: Subscription;
}

const CATEGORIES = ['LLMS', 'Gen. Img/Video', 'Ed. Video', 'Cloud Storage', 'Dev Tools', 'Design', 'Other'];
const STATUSES: Subscription['status'][] = ['Active', 'Paused', 'Cancelled', 'Trial'];
const BILLING_CYCLES: Subscription['billingCycle'][] = ['Monthly', 'Yearly'];

export default function SubscriptionModal({ isOpen, onClose, onSave, initialData }: SubscriptionModalProps) {
    const { team, fetchTeam, addMember } = useStore();
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
    const [searchOwner, setSearchOwner] = useState('');
    const [searchUsers, setSearchUsers] = useState('');

    const [formData, setFormData] = useState<Partial<Subscription>>({
        platform: '',
        category: '',
        amount: 0,
        currency: 'USD',
        billingCycle: 'Monthly',
        renewalDay: 1,
        cardUsed: '',
        status: 'Active',
        ownerId: undefined,
        users: [],
        receiptUrl: '',
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                amount: initialData.amount || initialData.cost || 0 // Legacy compatibility
            });
        } else {
            setFormData({
                platform: '',
                category: '',
                amount: 0,
                currency: 'USD',
                billingCycle: 'Monthly',
                renewalDay: 1,
                cardUsed: '',
                status: 'Active',
                ownerId: undefined,
                users: [],
                receiptUrl: '',
                notes: ''
            });
        }
        if (isOpen) {
            fetchTeam();
        }
    }, [initialData, isOpen, fetchTeam]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const filteredOwner = team.filter(m =>
        m.name.toLowerCase().includes(searchOwner.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchOwner.toLowerCase())
    );

    const filteredUsers = team.filter(m =>
        m.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchUsers.toLowerCase())
    );

    const selectedOwner = team.find(m => m.id === formData.ownerId);
    const selectedUsers = team.filter(m => formData.users?.includes(m.id));

    const toggleUser = (userId: string) => {
        const current = formData.users || [];
        if (current.includes(userId)) {
            setFormData({ ...formData, users: current.filter(id => id !== userId) });
        } else {
            setFormData({ ...formData, users: [...current, userId] });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-2xl bg-card border border-white/10 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                {initialData ? 'Editar Suscripción' : 'Nueva Suscripción'}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">Gestiona suscripciones y servicios</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            {/* Básicos */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Información Básica</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plataforma *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.platform || ''}
                                            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            placeholder="Ej: CLAUDE, WEAVY"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categoría *</label>
                                        <select
                                            required
                                            value={formData.category || ''}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat} className="bg-card">{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Costo *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.amount || 0}
                                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Moneda</label>
                                        <select
                                            value={formData.currency || 'USD'}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'USD' | 'DOP' | 'EUR' })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            <option value="USD" className="bg-card">USD</option>
                                            <option value="DOP" className="bg-card">DOP</option>
                                            <option value="EUR" className="bg-card">EUR</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ciclo</label>
                                        <select
                                            value={formData.billingCycle || 'Monthly'}
                                            onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'Monthly' | 'Yearly' })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            {BILLING_CYCLES.map(cycle => (
                                                <option key={cycle} value={cycle} className="bg-card">{cycle}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Día de Renovación</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={formData.renewalDay || 1}
                                            onChange={(e) => setFormData({ ...formData, renewalDay: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tarjeta Usada</label>
                                        <input
                                            type="text"
                                            value={formData.cardUsed || ''}
                                            onChange={(e) => setFormData({ ...formData, cardUsed: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            placeholder="Ej: VISA 4237"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</label>
                                        <select
                                            value={formData.status || 'Active'}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as Subscription['status'] })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            {STATUSES.map(status => (
                                                <option key={status} value={status} className="bg-card">{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Integración Crew */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Asignación de Crew
                                </h3>

                                {/* Owner (Quién paga) */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quién Paga (Owner)</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={searchOwner}
                                            onChange={(e) => setSearchOwner(e.target.value)}
                                            placeholder="Buscar miembro del crew..."
                                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsTeamModalOpen(true)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                                            title="Crear nuevo miembro"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {searchOwner && filteredOwner.length > 0 && (
                                        <div className="bg-black/40 border border-white/10 rounded-lg max-h-40 overflow-y-auto">
                                            {filteredOwner.map(member => (
                                                <button
                                                    key={member.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, ownerId: member.id });
                                                        setSearchOwner('');
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/5 transition-colors flex items-center justify-between"
                                                >
                                                    <span>{member.name}</span>
                                                    {member.email && <span className="text-xs text-muted-foreground">{member.email}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedOwner && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                                            <span className="text-sm text-foreground">{selectedOwner.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, ownerId: undefined })}
                                                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Users (Quién usa) */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quién Usa (Multi-select)</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={searchUsers}
                                            onChange={(e) => setSearchUsers(e.target.value)}
                                            placeholder="Buscar miembros del crew..."
                                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsTeamModalOpen(true)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                                            title="Crear nuevo miembro"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {searchUsers && filteredUsers.length > 0 && (
                                        <div className="bg-black/40 border border-white/10 rounded-lg max-h-40 overflow-y-auto">
                                            {filteredUsers.map(member => (
                                                <button
                                                    key={member.id}
                                                    type="button"
                                                    onClick={() => toggleUser(member.id)}
                                                    className={cn(
                                                        "w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between",
                                                        formData.users?.includes(member.id)
                                                            ? "bg-primary/20 text-primary"
                                                            : "text-foreground hover:bg-white/5"
                                                    )}
                                                >
                                                    <span>{member.name}</span>
                                                    {formData.users?.includes(member.id) && (
                                                        <span className="text-xs">✓</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUsers.map(member => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg"
                                                >
                                                    <span className="text-xs text-foreground">{member.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleUser(member.id)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Metadata</h3>
                                {/* Comprobantes / Facturas */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                        <HardDrive className="w-4 h-4" />
                                        Comprobantes & Facturas
                                    </h3>
                                    <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Archivo en Drive</label>
                                            {formData.receiptUrl && (
                                                <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                                                    ✓ Vinculado
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.receiptUrl || ''}
                                                readOnly
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground/70 focus:outline-none cursor-not-allowed"
                                                placeholder="Sube un comprobante para vincularlo..."
                                            />
                                            {formData.receiptUrl && (
                                                <a
                                                    href={formData.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors flex items-center justify-center"
                                                    title="Ver archivo"
                                                >
                                                    View
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setIsDrivePickerOpen(true)}
                                                className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 border border-yellow-600/30 rounded-lg transition-colors flex items-center gap-2"
                                                title="Sube directamente al folder de Finanzas"
                                            >
                                                <Upload className="w-4 h-4" />
                                                <span className="hidden sm:inline">Subir</span>
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-2">
                                            Los archivos se guardarán automáticamente en la carpeta segura de Finanzas.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas</label>
                                    <textarea
                                        value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 min-h-[100px]"
                                        placeholder="Notas adicionales..."
                                    />
                                </div>
                            </div>
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
                                {initialData ? 'Guardar Cambios' : 'Crear Suscripción'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Team Modal para crear nuevo miembro */}
            <TeamModal
                isOpen={isTeamModalOpen}
                onClose={() => {
                    setIsTeamModalOpen(false);
                    fetchTeam(); // Refresh team list
                }}
                onSave={(member) => {
                    addMember(member);
                    setIsTeamModalOpen(false);
                    fetchTeam();
                }}
            />

            {/* Drive Picker Modal */}
            {isDrivePickerOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDrivePickerOpen(false)} />
                    <div className="relative w-full max-w-2xl z-10">
                        <DrivePicker
                            initialFolderId={FINANCE_DRIVE_FOLDER_ID}
                            onSelect={(link) => {
                                setFormData({ ...formData, receiptUrl: link });
                                setIsDrivePickerOpen(false);
                            }}
                            onCancel={() => setIsDrivePickerOpen(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}





'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Transaction, TeamMember, Subscription } from '@/lib/types';
import { X, Plus, Search, Users, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import TeamModal from '@/components/Team/TeamModal';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Partial<Transaction>) => void;
    initialData?: Transaction;
}

const CATEGORIES = ['LLMS', 'Gen. Img/Video', 'Ed. Video', 'Cloud Storage', 'Dev Tools', 'Design', 'Other'];
const KINDS: Transaction['kind'][] = ['fixed', 'extra', 'one_off', 'trial'];
const STATUSES: Transaction['status'][] = ['pending', 'approved', 'paid'];

export default function TransactionModal({ isOpen, onClose, onSave, initialData }: TransactionModalProps) {
    const { team, finance, fetchTeam, addMember } = useStore();
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [searchPayer, setSearchPayer] = useState('');
    const [searchUsers, setSearchUsers] = useState('');

    const [formData, setFormData] = useState<Partial<Transaction>>({
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        kind: 'one_off',
        amount: 0,
        currency: 'USD',
        category: '',
        payerId: undefined,
        users: [],
        subscriptionId: undefined,
        receiptRef: '',
        receiptUrl: '',
        notes: '',
        status: 'pending'
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                vendor: '',
                kind: 'one_off',
                amount: 0,
                currency: 'USD',
                category: '',
                payerId: undefined,
                users: [],
                subscriptionId: undefined,
                receiptRef: '',
                receiptUrl: '',
                notes: '',
                status: 'pending'
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

    const filteredPayer = team.filter(m =>
        m.name.toLowerCase().includes(searchPayer.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchPayer.toLowerCase())
    );

    const filteredUsers = team.filter(m =>
        m.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchUsers.toLowerCase())
    );

    const selectedPayer = team.find(m => m.id === formData.payerId);
    const selectedUsers = team.filter(m => formData.users?.includes(m.id));
    const activeSubscriptions = finance.subscriptions.filter(s => s.status === 'Active');

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
                                {initialData ? 'Editar Transacción' : 'Nueva Transacción'}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">Registra gastos y pagos</p>
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
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date || ''}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vendor/Plataforma *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.vendor || ''}
                                            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            placeholder="Ej: CLAUDE, WEAVY"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo *</label>
                                        <select
                                            required
                                            value={formData.kind || 'one_off'}
                                            onChange={(e) => setFormData({ ...formData, kind: e.target.value as Transaction['kind'] })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            {KINDS.map(kind => (
                                                <option key={kind} value={kind} className="bg-card">
                                                    {kind === 'fixed' ? 'Fijo (Suscripción)' : 
                                                     kind === 'extra' ? 'Extra (Suscripción)' :
                                                     kind === 'one_off' ? 'One-off' : 'Trial'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cantidad *</label>
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</label>
                                        <select
                                            value={formData.status || 'pending'}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as Transaction['status'] })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                        >
                                            {STATUSES.map(status => (
                                                <option key={status} value={status} className="bg-card">
                                                    {status === 'pending' ? 'Pendiente' :
                                                     status === 'approved' ? 'Aprobado' : 'Pagado'}
                                                </option>
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

                                {/* Payer (Quién paga) */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quién Pagó</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={searchPayer}
                                            onChange={(e) => setSearchPayer(e.target.value)}
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
                                    {searchPayer && filteredPayer.length > 0 && (
                                        <div className="bg-black/40 border border-white/10 rounded-lg max-h-40 overflow-y-auto">
                                            {filteredPayer.map(member => (
                                                <button
                                                    key={member.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, payerId: member.id });
                                                        setSearchPayer('');
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/5 transition-colors flex items-center justify-between"
                                                >
                                                    <span>{member.name}</span>
                                                    {member.email && <span className="text-xs text-muted-foreground">{member.email}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedPayer && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                                            <span className="text-sm text-foreground">{selectedPayer.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, payerId: undefined })}
                                                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Users (Quién usa) */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quién Usó (Multi-select)</label>
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

                            {/* Vinculación con Suscripción */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4" />
                                    Vinculación (Opcional)
                                </h3>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suscripción Relacionada</label>
                                    <select
                                        value={formData.subscriptionId || ''}
                                        onChange={(e) => setFormData({ ...formData, subscriptionId: e.target.value || undefined })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                    >
                                        <option value="" className="bg-card">Ninguna (One-off)</option>
                                        {activeSubscriptions.map(sub => (
                                            <option key={sub.id} value={sub.id} className="bg-card">
                                                {sub.platform} - ${sub.amount} {sub.currency} ({sub.category})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Receipt & Metadata */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Recibo y Notas</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Referencia de Recibo</label>
                                        <input
                                            type="text"
                                            value={formData.receiptRef || ''}
                                            onChange={(e) => setFormData({ ...formData, receiptRef: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            placeholder="Ej: invoice, receipt, factura"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">URL de Recibo</label>
                                        <input
                                            type="url"
                                            value={formData.receiptUrl || ''}
                                            onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            placeholder="https://drive.google.com/..."
                                        />
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
                                {initialData ? 'Guardar Cambios' : 'Crear Transacción'}
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
                    fetchTeam();
                }}
                onSave={(member) => {
                    addMember(member);
                    setIsTeamModalOpen(false);
                    fetchTeam();
                }}
            />
        </>
    );
}

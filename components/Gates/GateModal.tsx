'use client';

import { useState, useEffect } from 'react';
import { Gate, GateStatus } from '@/lib/types';

interface GateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (gate: Omit<Gate, 'id'>) => void;
    initialData?: Gate;
}

const STATUSES: GateStatus[] = ['Pendiente', 'En Progreso', 'Completado'];

export default function GateModal({ isOpen, onClose, onSave, initialData }: GateModalProps) {
    const [formData, setFormData] = useState<Partial<Gate>>({
        name: '',
        status: 'Pendiente',
        week: '',
        deliverables: [],
        description: '',
    });

    const [newDeliverable, setNewDeliverable] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                status: 'Pendiente',
                week: '',
                deliverables: [],
                description: '',
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<Gate, 'id'>);
        onClose();
    };

    const addDeliverable = () => {
        if (newDeliverable.trim()) {
            setFormData({
                ...formData,
                deliverables: [...(formData.deliverables || []), newDeliverable.trim()]
            });
            setNewDeliverable('');
        }
    };

    const removeDeliverable = (index: number) => {
        setFormData({
            ...formData,
            deliverables: formData.deliverables?.filter((_, i) => i !== index) || []
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-card border border-white/10 rounded-xl shadow-2xl p-6 transform transition-all max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-foreground mb-4">
                    {initialData ? 'Editar Gate' : 'Nuevo Gate'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nombre del Gate</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                            placeholder="Ej: Gate 1 - Greenlight"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Estado</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as GateStatus })}
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
                            <label className="text-sm font-medium text-muted-foreground">Semana</label>
                            <input
                                type="text"
                                required
                                value={formData.week}
                                onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                placeholder="Ej: Semana 1-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 min-h-[80px]"
                            placeholder="Descripción del gate..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Entregables</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newDeliverable}
                                onChange={(e) => setNewDeliverable(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                placeholder="Agregar entregable..."
                            />
                            <button
                                type="button"
                                onClick={addDeliverable}
                                className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                            >
                                +
                            </button>
                        </div>
                        {formData.deliverables && formData.deliverables.length > 0 && (
                            <div className="space-y-2 mt-3">
                                {formData.deliverables.map((deliverable, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-white/5 border border-white/5 rounded-lg"
                                    >
                                        <span className="text-sm text-foreground">{deliverable}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeDeliverable(index)}
                                            className="text-destructive hover:text-destructive/80 text-sm"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
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
                            {initialData ? 'Guardar Cambios' : 'Crear Gate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

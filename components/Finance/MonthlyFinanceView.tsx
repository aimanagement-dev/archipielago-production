'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Subscription, Transaction } from '@/lib/types';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TransactionModal from './TransactionModal';

interface MonthlyFinanceViewProps {
    year: number;
    month: number; // 0-11
}

export default function MonthlyFinanceView({ year, month }: MonthlyFinanceViewProps) {
    const { finance, team, deleteTransaction, updateTransaction } = useStore();
    const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
    const [editingTrans, setEditingTrans] = useState<Transaction | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = async (id: string, vendor: string) => {
        if (!confirm(`¿Estás seguro de eliminar la transacción "${vendor}"?`)) return;
        try {
            await deleteTransaction(id);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Error al eliminar transacción');
        }
    };

    const handleEdit = (trans: Transaction) => {
        setEditingTrans(trans);
        setIsModalOpen(true);
    };

    // Helper: Get team member name by ID
    const getMemberName = (id?: string) => {
        if (!id) return 'N/A';
        const member = team.find(m => m.id === id);
        return member?.name || id;
    };

    // Get active subscriptions
    const activeSubs = finance.subscriptions.filter(s => s.status === 'Active');
    const totalMonthlyFixed = activeSubs.reduce((acc, sub) => acc + (sub.amount || sub.cost || 0), 0);

    // Get transactions for this month
    const monthTransactions = useMemo(() => {
        return finance.transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate.getMonth() === month && transDate.getFullYear() === year;
        });
    }, [finance.transactions, month, year]);

    // Group transactions by subscription
    const transactionsBySub = useMemo(() => {
        const grouped: Record<string, Transaction[]> = {};
        const oneOffs: Transaction[] = [];

        monthTransactions.forEach(trans => {
            if (trans.subscriptionId) {
                if (!grouped[trans.subscriptionId]) {
                    grouped[trans.subscriptionId] = [];
                }
                grouped[trans.subscriptionId].push(trans);
            } else {
                oneOffs.push(trans);
            }
        });

        return { grouped, oneOffs };
    }, [monthTransactions]);

    // Calculate totals
    const totals = useMemo(() => {
        const fixed = monthTransactions.filter(t => t.kind === 'fixed').reduce((acc, t) => acc + t.amount, 0);
        const extra = monthTransactions.filter(t => t.kind === 'extra').reduce((acc, t) => acc + t.amount, 0);
        const oneOff = monthTransactions.filter(t => t.kind === 'one_off').reduce((acc, t) => acc + t.amount, 0);
        const total = fixed + extra + oneOff;
        const projected = totalMonthlyFixed;

        return {
            fixed,
            extra,
            oneOff,
            total,
            projected,
            difference: total - projected,
            percentage: projected > 0 ? (total / projected) * 100 : 0
        };
    }, [monthTransactions, totalMonthlyFixed]);

    const toggleSub = (subId: string) => {
        const newExpanded = new Set(expandedSubs);
        if (newExpanded.has(subId)) {
            newExpanded.delete(subId);
        } else {
            newExpanded.add(subId);
        }
        setExpandedSubs(newExpanded);
    };

    const monthName = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Proyectado */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Proyectado</span>
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">${totals.projected.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Suscripciones fijas</div>
                </div>

                {/* Real */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Real</span>
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">${totals.total.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Total gastado</div>
                </div>

                {/* Diferencia */}
                <div className={cn(
                    "bg-card rounded-xl border p-6 shadow-sm",
                    totals.difference >= 0
                        ? "border-red-500/30 bg-red-500/5 text-red-700"
                        : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
                )}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Diferencia</span>
                        {totals.difference >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-red-600" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-emerald-600" />
                        )}
                    </div>
                    <div className={cn(
                        "text-2xl font-bold",
                        totals.difference >= 0 ? "text-red-600" : "text-emerald-600"
                    )}>
                        {totals.difference >= 0 ? '+' : ''}${totals.difference.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">
                        {totals.difference >= 0 ? 'Por encima' : 'Por debajo'} del presupuesto
                    </div>
                </div>

                {/* % Cumplimiento */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">% Presupuesto</span>
                        <AlertCircle className={cn(
                            "w-4 h-4",
                            totals.percentage > 100 ? "text-red-600" : totals.percentage > 80 ? "text-yellow-600" : "text-emerald-600"
                        )} />
                    </div>
                    <div className={cn(
                        "text-2xl font-bold",
                        totals.percentage > 100 ? "text-red-600" : totals.percentage > 80 ? "text-amber-600" : "text-emerald-600"
                    )}>
                        {totals.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Del presupuesto usado</div>
                </div>
            </div>

            {/* Vista Consolidada del Mes */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Resumen de {monthName}
                    </h3>
                </div>

                <div className="divide-y divide-border">
                    {/* Suscripciones con gastos asociados */}
                    {activeSubs.map(sub => {
                        const subTransactions = transactionsBySub.grouped[sub.id] || [];
                        const subFixed = subTransactions.filter(t => t.kind === 'fixed').reduce((acc, t) => acc + t.amount, 0);
                        const subExtra = subTransactions.filter(t => t.kind === 'extra').reduce((acc, t) => acc + t.amount, 0);
                        const subTotal = (sub.amount || sub.cost || 0) + subExtra;
                        const isExpanded = expandedSubs.has(sub.id);

                        return (
                            <div key={sub.id} className="hover:bg-muted/30 transition-colors">
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer"
                                    onClick={() => toggleSub(sub.id)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-lg font-bold text-muted-foreground">
                                            {sub.platform.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-foreground">{sub.platform}</h4>
                                                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                                    {sub.category}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-medium">
                                                <span>Fijo: ${(sub.amount || sub.cost || 0).toFixed(2)}</span>
                                                {subExtra > 0 && (
                                                    <span className="text-orange-600">+ Extra: ${subExtra.toFixed(2)}</span>
                                                )}
                                                <span className="text-emerald-600 font-bold">Total: ${subTotal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-emerald-600">${subTotal.toFixed(2)}</div>
                                            <div className="text-[10px] text-muted-foreground font-bold uppercase">{sub.currency}</div>
                                        </div>
                                        {subTransactions.length > 0 && (
                                            <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Gastos expandidos */}
                                {isExpanded && subTransactions.length > 0 && (
                                    <div className="px-4 pb-4 pl-14 bg-muted/20">
                                        <div className="space-y-2 mt-2">
                                            {subTransactions.map(trans => (
                                                <div key={trans.id} className="flex items-center justify-between py-2 px-3 bg-card border border-border shadow-sm rounded-lg text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-muted-foreground font-medium">
                                                            {new Date(trans.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                        <span className="text-foreground font-semibold">{trans.vendor}</span>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase",
                                                            trans.kind === 'extra'
                                                                ? "bg-orange-500/10 text-orange-600 border-orange-500/30"
                                                                : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                                                        )}>
                                                            {trans.kind === 'extra' ? 'Extra' : 'Fijo'}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-foreground">${trans.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* One-offs del mes */}
                    {transactionsBySub.oneOffs.length > 0 && (
                        <>
                            <div className="px-6 py-3 bg-muted/20 border-t border-border">
                                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-purple-600" />
                                    Gastos One-off ({transactionsBySub.oneOffs.length})
                                </h4>
                            </div>
                            {transactionsBySub.oneOffs.map(trans => (
                                <div key={trans.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-foreground">{trans.vendor}</h4>
                                                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                                    {trans.category}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 font-medium">
                                                {new Date(trans.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-foreground">${trans.amount.toFixed(2)}</div>
                                            <div className="text-[10px] text-muted-foreground font-bold uppercase">{trans.currency}</div>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(trans)}
                                                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(trans.id, trans.vendor)}
                                                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Total del mes */}
                    <div className="px-6 py-4 bg-gradient-to-r from-primary/10 to-primary/5 border-t-2 border-primary/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total del Mes</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {monthTransactions.length} transacciones
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-primary">${totals.total.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                    vs ${totals.projected.toFixed(2)} proyectado
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Modal */}
                <TransactionModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingTrans(undefined);
                    }}
                    onSave={async (data) => {
                        if (editingTrans) {
                            await updateTransaction(editingTrans.id, data);
                        }
                        setIsModalOpen(false);
                        setEditingTrans(undefined);
                    }}
                    initialData={editingTrans}
                />
            </div>
        </div >
    );
}



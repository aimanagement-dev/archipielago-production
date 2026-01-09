'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Transaction } from '@/lib/types';
import { Search, Filter, Calendar, DollarSign, X, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import TransactionModal from './TransactionModal';

interface TransactionsTableProps {
    onEdit?: (transaction: Transaction) => void;
    canEdit?: boolean;
}

const KINDS: Transaction['kind'][] = ['fixed', 'extra', 'one_off', 'trial'];
const STATUSES: Transaction['status'][] = ['pending', 'approved', 'paid'];

export default function TransactionsTable({ onEdit, canEdit = true }: TransactionsTableProps) {
    const { finance, team, deleteTransaction, updateTransaction } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterKind, setFilterKind] = useState<Transaction['kind'] | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<Transaction['status'] | 'all'>('all');
    const [filterMonth, setFilterMonth] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [editingTrans, setEditingTrans] = useState<Transaction | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Helper: Get team member name by ID
    const getMemberName = (id?: string) => {
        if (!id) return 'N/A';
        const member = team.find(m => m.id === id);
        return member?.name || id;
    };

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        finance.transactions.forEach(t => {
            if (t.category) cats.add(t.category);
        });
        return Array.from(cats).sort();
    }, [finance.transactions]);

    // Get unique months
    const months = useMemo(() => {
        const monthSet = new Set<string>();
        finance.transactions.forEach(t => {
            if (t.date) {
                const date = new Date(t.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthSet.add(monthKey);
            }
        });
        return Array.from(monthSet).sort().reverse();
    }, [finance.transactions]);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return finance.transactions.filter(t => {
            // Search
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                if (!t.vendor.toLowerCase().includes(searchLower) &&
                    !t.category.toLowerCase().includes(searchLower) &&
                    !t.notes?.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            // Kind filter
            if (filterKind !== 'all' && t.kind !== filterKind) return false;

            // Status filter
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;

            // Category filter
            if (filterCategory !== 'all' && t.category !== filterCategory) return false;

            // Month filter
            if (filterMonth !== 'all') {
                const date = new Date(t.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (monthKey !== filterMonth) return false;
            }

            return true;
        }).sort((a, b) => {
            // Sort by date descending (newest first)
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }, [finance.transactions, searchTerm, filterKind, filterStatus, filterCategory, filterMonth]);

    const handleDelete = async (id: string, vendor: string) => {
        if (!canEdit) return;
        if (!confirm(`¿Estás seguro de eliminar la transacción "${vendor}"?`)) return;
        try {
            await deleteTransaction(id);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Error al eliminar transacción');
        }
    };

    const handleEdit = (trans: Transaction) => {
        if (!canEdit) return;
        setEditingTrans(trans);
        setIsModalOpen(true);
        if (onEdit) onEdit(trans);
    };

    const getKindLabel = (kind: Transaction['kind']) => {
        const labels = {
            fixed: 'Fijo',
            extra: 'Extra',
            one_off: 'One-off',
            trial: 'Trial'
        };
        return labels[kind];
    };

    const getStatusLabel = (status: Transaction['status']) => {
        const labels = {
            pending: 'Pendiente',
            approved: 'Aprobado',
            paid: 'Pagado'
        };
        return labels[status];
    };

    const getStatusColor = (status: Transaction['status']) => {
        const colors = {
            pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
        return colors[status];
    };

    const getKindColor = (kind: Transaction['kind']) => {
        const colors = {
            fixed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            extra: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            one_off: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
            trial: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
        };
        return colors[kind];
    };

    // Calculate totals
    const totals = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            acc.total += t.amount;
            if (t.kind === 'fixed') acc.fixed += t.amount;
            if (t.kind === 'extra') acc.extra += t.amount;
            if (t.kind === 'one_off') acc.oneOff += t.amount;
            return acc;
        }, { total: 0, fixed: 0, extra: 0, oneOff: 0 });
    }, [filteredTransactions]);

    return (
        <>
            <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            Transacciones ({filteredTransactions.length})
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Total filtrado:</span>
                            <span className="font-bold text-emerald-400">${totals.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {/* Search */}
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por vendor, categoría..."
                                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Kind Filter */}
                        <select
                            value={filterKind}
                            onChange={(e) => setFilterKind(e.target.value as Transaction['kind'] | 'all')}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                        >
                            <option value="all">Todos los tipos</option>
                            {KINDS.map(kind => (
                                <option key={kind} value={kind}>{getKindLabel(kind)}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as Transaction['status'] | 'all')}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                        >
                            <option value="all">Todos los estados</option>
                            {STATUSES.map(status => (
                                <option key={status} value={status}>{getStatusLabel(status)}</option>
                            ))}
                        </select>

                        {/* Month Filter */}
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                        >
                            <option value="all">Todos los meses</option>
                            {months.map(month => {
                                const [year, monthNum] = month.split('-');
                                const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                                return (
                                    <option key={month} value={month}>
                                        {date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Category Filter */}
                    {categories.length > 0 && (
                        <div className="mt-3">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full md:w-auto"
                            >
                                <option value="all">Todas las categorías</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Active Filters */}
                    {(filterKind !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || filterMonth !== 'all' || searchTerm) && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Filtros activos:</span>
                            {filterKind !== 'all' && (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                                    Tipo: {getKindLabel(filterKind)}
                                    <button onClick={() => setFilterKind('all')} className="hover:text-primary/70">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {filterStatus !== 'all' && (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                                    Estado: {getStatusLabel(filterStatus)}
                                    <button onClick={() => setFilterStatus('all')} className="hover:text-primary/70">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {filterCategory !== 'all' && (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                                    Categoría: {filterCategory}
                                    <button onClick={() => setFilterCategory('all')} className="hover:text-primary/70">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {filterMonth !== 'all' && (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                                    Mes: {filterMonth}
                                    <button onClick={() => setFilterMonth('all')} className="hover:text-primary/70">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                                    Búsqueda: {searchTerm}
                                    <button onClick={() => setSearchTerm('')} className="hover:text-primary/70">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setFilterKind('all');
                                    setFilterStatus('all');
                                    setFilterCategory('all');
                                    setFilterMonth('all');
                                    setSearchTerm('');
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Limpiar todos
                            </button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Vendor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Categoría</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Monto</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Payer</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTransactions.map(trans => {
                                const sub = finance.subscriptions.find(s => s.id === trans.subscriptionId);
                                return (
                                    <tr key={trans.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 text-sm text-foreground">
                                            {new Date(trans.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">{trans.vendor}</span>
                                                {sub && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ← {sub.platform}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                                getKindColor(trans.kind)
                                            )}>
                                                {getKindLabel(trans.kind)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{trans.category}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-bold text-emerald-400">
                                                ${trans.amount.toFixed(2)}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-1">{trans.currency}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                                getStatusColor(trans.status)
                                            )}>
                                                {getStatusLabel(trans.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {trans.payerId ? getMemberName(trans.payerId) : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {trans.receiptUrl && (
                                                    <a
                                                        href={trans.receiptUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                        title="Ver comprobante"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {canEdit && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(trans)}
                                                            className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(trans.id, trans.vendor)}
                                                            className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredTransactions.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">
                        <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No se encontraron transacciones con los filtros aplicados</p>
                    </div>
                )}
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
        </>
    );
}




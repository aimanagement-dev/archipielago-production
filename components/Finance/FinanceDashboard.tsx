'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { CreditCard, DollarSign, Calendar, Plus, TrendingUp, AlertCircle, RefreshCw, Pencil, Trash2, List, History, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Subscription, Transaction } from '@/lib/types';
import { FINANCE_DRIVE_FOLDER_ID } from '@/lib/constants';
import SubscriptionModal from './SubscriptionModal';
import TransactionModal from './TransactionModal';
import TransactionsTable from './TransactionsTable';
import MonthlyFinanceView from './MonthlyFinanceView';
import DrivePicker from '@/components/Drive/DrivePicker';

type Tab = 'month' | 'subscriptions' | 'history';

export default function FinanceDashboard() {
    const { finance, team, fetchFinance, fetchTeam, addSubscription, addTransaction } = useStore();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [isTransModalOpen, setIsTransModalOpen] = useState(false);
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | undefined>(undefined);
    const [editingTrans, setEditingTrans] = useState<Transaction | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<Tab>('month');

    // Month selector state
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    useEffect(() => {
        fetchFinance();
        fetchTeam();
        setIsLoaded(true);
    }, [fetchFinance, fetchTeam]);

    // Helper: Get team member name by ID
    const getMemberName = (id?: string) => {
        if (!id) return 'N/A';
        const member = team.find(m => m.id === id);
        return member?.name || id;
    };

    // Helper: Get team member names by IDs
    const getMemberNames = (ids: string[] = []) => {
        if (ids.length === 0) return 'N/A';
        return ids.map(id => getMemberName(id)).join(', ');
    };

    // Calculations
    const activeSubs = finance.subscriptions.filter(s => s.status === 'Active');
    const totalMonthlyFixed = activeSubs.reduce((acc, sub) => acc + (sub.amount || sub.cost || 0), 0);

    // Upcoming Renewals Logic
    const nextRenewals = activeSubs
        .map(s => {
            const today = new Date();
            const currentDay = today.getDate();
            let month = today.getMonth();
            let year = today.getFullYear();

            // If renewal day passed this month, moves to next
            if (s.renewalDay < currentDay) {
                month++;
                if (month > 11) { month = 0; year++; }
            }

            const date = new Date(year, month, s.renewalDay);
            // Calculate days remaining
            const diffTime = date.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return { ...s, nextDate: date, daysLeft };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 3); // Top 3 upcoming

    const handleImportLegacy = async () => {
        if (!confirm('¿Importar datos del Excel antiguo? Esto agregará las suscripciones al sistema.')) return;
        try {
            const res = await fetch('/api/finance', {
                method: 'POST',
                body: JSON.stringify({ type: 'import_legacy' })
            });
            if (res.ok) {
                alert('¡Datos migrados exitosamente!');
                fetchFinance(); // Refresh
            }
        } catch (e) {
            console.error(e);
            alert('Error al importar');
        }
    };

    const handleImportMonthlyExpenses = async () => {
        if (!confirm('¿Importar gastos variables de Nov y Dec 2025? Esto agregará las transacciones desde las hojas mensuales del Excel.')) return;
        try {
            const res = await fetch('/api/finance', {
                method: 'POST',
                body: JSON.stringify({ type: 'import_monthly_expenses' })
            });
            if (res.ok) {
                const data = await res.json();
                alert(`¡Importación exitosa! Se importaron ${data.count} transacciones desde ${data.months.join(' y ')}.`);
                fetchFinance(); // Refresh
            } else {
                const error = await res.json();
                alert(`Error: ${error.error || 'Error al importar'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error al importar gastos mensuales');
        }
    };

    const handleExportReport = () => {
        const timestamp = new Date().toISOString().split('T')[0];

        // Export Subscriptions
        const subHeaders = ['ID', 'Platform', 'Category', 'Amount', 'Currency', 'BillingCycle', 'RenewalDay', 'CardUsed', 'Status', 'Owner', 'Users', 'Notes'];
        const subRows = finance.subscriptions.map(s => [
            s.id,
            s.platform,
            s.category,
            s.amount || s.cost || 0,
            s.currency,
            s.billingCycle,
            s.renewalDay,
            s.cardUsed || '',
            s.status,
            s.ownerId ? getMemberName(s.ownerId) : (s.owner || ''),
            s.users.length > 0 ? getMemberNames(s.users) : '',
            s.notes || ''
        ]);

        // Export Transactions
        const transHeaders = ['ID', 'Date', 'Vendor', 'Kind', 'Amount', 'Currency', 'Category', 'Payer', 'Users', 'Subscription', 'Status', 'Notes'];
        const transRows = finance.transactions.map(t => {
            const sub = finance.subscriptions.find(s => s.id === t.subscriptionId);
            return [
                t.id,
                t.date,
                t.vendor,
                t.kind,
                t.amount,
                t.currency,
                t.category,
                t.payerId ? getMemberName(t.payerId) : '',
                t.users.length > 0 ? getMemberNames(t.users) : '',
                sub ? sub.platform : '',
                t.status,
                t.notes || ''
            ];
        });

        // Combine into CSV
        const csvContent = [
            '=== SUSCRIPCIONES ===',
            subHeaders.join(','),
            ...subRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
            '',
            '=== TRANSACCIONES ===',
            transHeaders.join(','),
            ...transRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `finance_report_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClearData = async () => {
        if (!confirm('⚠️ ¿Estás seguro? Esto BORRARÁ TODAS las suscripciones importadas para reiniciar. Úsalo si la importación salió mal.')) return;
        try {
            const res = await fetch('/api/finance?action=reset_all', {
                method: 'DELETE',
            });
            if (res.ok) {
                alert('Base de datos de Finanzas reiniciada.');
                fetchFinance();
            }
        } catch (e) { alert('Error al reiniciar'); }
    };


    const handleEditSub = (sub: Subscription) => {
        setEditingSub(sub);
        setIsSubModalOpen(true);
    };

    const handleEditTrans = (trans: Transaction) => {
        setEditingTrans(trans);
        setIsTransModalOpen(true);
    };

    const handleSaveSubscription = async (data: Partial<Subscription>) => {
        if (editingSub) {
            const { updateSubscription } = useStore.getState();
            await updateSubscription(editingSub.id, data);
        } else {
            await addSubscription(data);
        }
        fetchFinance();
    };

    const handleSaveTransaction = async (data: Partial<Transaction>) => {
        if (editingTrans) {
            const { updateTransaction } = useStore.getState();
            await updateTransaction(editingTrans.id, data);
        } else {
            await addTransaction(data);
        }
        fetchFinance();
    };

    const handleDeleteSub = async (id: string, platform: string) => {
        if (!confirm(`¿Estás seguro de eliminar la suscripción "${platform}"?`)) return;
        try {
            const { deleteSubscription } = useStore.getState();
            await deleteSubscription(id);
            fetchFinance();
        } catch (error) {
            console.error('Error deleting subscription:', error);
            alert('Error al eliminar suscripción');
        }
    };

    // Get available months from transactions
    const availableMonths = Array.from(new Set(
        finance.transactions.map(t => {
            const date = new Date(t.date);
            return `${date.getFullYear()}-${date.getMonth()}`;
        })
    )).sort().reverse();

    // Month options for selector
    const monthOptions = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        monthOptions.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            label: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        });
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header con Selector de Mes y Tabs */}
            <div className="bg-card backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-sm">
                {/* Action Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-muted/30 border-b border-border gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-foreground font-bold text-lg">Control Financiero</h2>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="bg-muted px-2 py-0.5 rounded-full text-foreground/70 font-medium">{activeSubs.length} suscripciones</span>
                                <span>&bull;</span>
                                <span className="text-emerald-600 font-semibold">${totalMonthlyFixed.toFixed(2)}/mes fijo</span>
                            </div>
                        </div>
                    </div>

                    {/* Selector de Mes (solo en tab "Este Mes") */}
                    {activeTab === 'month' && (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={`${selectedYear}-${selectedMonth}`}
                                onChange={(e) => {
                                    const [year, month] = e.target.value.split('-').map(Number);
                                    setSelectedYear(year);
                                    setSelectedMonth(month);
                                }}
                                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                            >
                                {monthOptions.map(opt => (
                                    <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`} className="bg-background text-foreground">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full md:w-auto flex-wrap">
                        <button
                            onClick={() => {
                                setEditingSub(undefined);
                                setIsSubModalOpen(true);
                            }}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg border border-transparent shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            Nueva Suscripción
                        </button>
                        <button
                            onClick={() => {
                                setEditingTrans(undefined);
                                setIsTransModalOpen(true);
                            }}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg border border-transparent shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            Nueva Transacción
                        </button>
                        <button
                            onClick={handleExportReport}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-secondary hover:bg-muted text-secondary-foreground text-xs font-bold rounded-lg border border-border transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                            📄 Exportar
                        </button>
                        {activeTab === 'month' && (
                            <button
                                onClick={handleImportMonthlyExpenses}
                                className="flex-1 md:flex-none px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg border border-transparent shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                                📅 Importar Gastos
                            </button>
                        )}
                        <button
                            onClick={() => setIsDriveModalOpen(true)}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded-lg border border-transparent shadow-lg shadow-yellow-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                            <HardDrive className="w-4 h-4" />
                            Drive de Finanzas
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border bg-muted/50">
                    <button
                        onClick={() => setActiveTab('month')}
                        className={cn(
                            "flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                            activeTab === 'month'
                                ? "text-primary border-b-2 border-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Calendar className="w-4 h-4" />
                        Este Mes
                    </button>
                    <button
                        onClick={() => setActiveTab('subscriptions')}
                        className={cn(
                            "flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                            activeTab === 'subscriptions'
                                ? "text-primary border-b-2 border-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <List className="w-4 h-4" />
                        Suscripciones ({activeSubs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                            activeTab === 'history'
                                ? "text-primary border-b-2 border-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <History className="w-4 h-4" />
                        Historial ({finance.transactions.length})
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'month' && (
                    <MonthlyFinanceView year={selectedYear} month={selectedMonth} />
                )}

                {activeTab === 'subscriptions' && (
                    <div className="space-y-6">
                        {/* Subscription List */}
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    Suscripciones Activas ({activeSubs.length})
                                </h3>
                            </div>

                            <div className="divide-y divide-border">
                                {activeSubs.map(sub => (
                                    <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-xl font-bold text-muted-foreground group-hover:text-primary group-hover:border-primary/50 transition-all shadow-sm flex-shrink-0">
                                                {sub.platform.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-foreground leading-none text-lg truncate">{sub.platform}</p>
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                                        {sub.category}
                                                    </span>
                                                    {sub.ownerId && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                                                            Owner: {getMemberName(sub.ownerId)}
                                                        </span>
                                                    )}
                                                    {sub.users && sub.users.length > 0 && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 font-medium" title={getMemberNames(sub.users)}>
                                                            {sub.users.length} usuario{sub.users.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs text-muted-foreground mb-0.5">Renovación</p>
                                                <div className="flex items-center gap-1.5 justify-end">
                                                    <Calendar className="w-3 h-3 text-blue-500" />
                                                    <p className="text-sm text-foreground font-semibold">Día {sub.renewalDay}</p>
                                                </div>
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                <p className="font-bold text-emerald-600 text-xl tracking-tight">${sub.amount || sub.cost || 0}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{sub.currency} / MES</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditSub(sub)}
                                                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSub(sub.id, sub.platform)}
                                                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {activeSubs.length === 0 && (
                                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                            <CreditCard className="w-8 h-8 text-muted-foreground/40" />
                                        </div>
                                        <p>No hay suscripciones registradas.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Próximos Pagos */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                Próximos Pagos
                            </h3>

                            <div className="space-y-4">
                                {nextRenewals.map((item, idx) => (
                                    <div key={idx} className="relative bg-muted/20 rounded-xl p-4 border border-border flex gap-4 items-center group hover:border-purple-500/30 transition-colors">
                                        <div className="bg-muted w-14 h-14 rounded-xl flex flex-col items-center justify-center border border-border group-hover:bg-purple-500/10 group-hover:text-purple-600 transition-colors">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.nextDate.toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-xl font-bold text-foreground leading-none mt-0.5">{item.nextDate.getDate()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">{item.platform}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                                                <p className="text-xs text-purple-700 font-semibold">en {item.daysLeft} días</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-foreground">${item.amount || item.cost || 0}</span>
                                        </div>
                                    </div>
                                ))}
                                {nextRenewals.length === 0 && <p className="text-sm text-muted-foreground italic">Nada pendiente por ahora.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <TransactionsTable />
                )}
            </div>

            {/* Modals */}
            <SubscriptionModal
                isOpen={isSubModalOpen}
                onClose={() => {
                    setIsSubModalOpen(false);
                    setEditingSub(undefined);
                }}
                onSave={handleSaveSubscription}
                initialData={editingSub}
            />
            <TransactionModal
                isOpen={isTransModalOpen}
                onClose={() => {
                    setIsTransModalOpen(false);
                    setEditingTrans(undefined);
                }}
                onSave={handleSaveTransaction}
                initialData={editingTrans}
            />

            {/* Finance Drive Modal */}
            {isDriveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDriveModalOpen(false)} />
                    <div className="relative w-full max-w-4xl h-[80vh] bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/20">
                            <h3 className="font-bold flex items-center gap-2">
                                <HardDrive className="w-5 h-5 text-yellow-500" />
                                Drive de Finanzas
                            </h3>
                            <button onClick={() => setIsDriveModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <span className="sr-only">Cerrar</span>
                                ×
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <DrivePicker
                                initialFolderId={FINANCE_DRIVE_FOLDER_ID}
                                onSelect={() => { }} // No action needed on select for this view
                                onCancel={() => setIsDriveModalOpen(false)}
                                className="h-full"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

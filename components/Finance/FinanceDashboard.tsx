'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { CreditCard, DollarSign, Calendar, Plus, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
// import FinanceModal from './FinanceModal'; // To be implemented

export default function FinanceDashboard() {
    const { finance, fetchFinance } = useStore();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        fetchFinance().then(() => setIsLoaded(true));
    }, [fetchFinance]);

    // Calculations
    const activeSubs = finance.subscriptions.filter(s => s.status === 'Active');
    const totalMonthlyFixed = activeSubs.reduce((acc, sub) => acc + sub.cost, 0);

    // Get current month expenses
    const currentMonth = new Date().getMonth();
    const monthlyExpenses = finance.expenses.filter(e => new Date(e.date).getMonth() === currentMonth);
    const totalVariable = monthlyExpenses.reduce((acc, exp) => acc + exp.amount, 0);

    const projectedBurn = totalMonthlyFixed + totalVariable;

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

    const handleExportReport = () => {
        const headers = ['Platform', 'Category', 'Cost', 'Currency', 'RenewalDay', 'Status'];
        const csvContent = [
            headers.join(','),
            ...finance.subscriptions.map(s =>
                `"${s.platform}","${s.category}",${s.cost},"${s.currency}",${s.renewalDay},"${s.status}"`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'finance_report_2025.csv');
        document.body.appendChild(link);
        link.click();
    };

    const handleClearData = async () => {
        if (!confirm('⚠️ ¿Estás seguro? Esto BORRARÁ TODAS las suscripciones importadas para reiniciar. Úsalo si la importación salió mal.')) return;
        try {
            // Reset call
            const res = await fetch('/api/finance?action=reset_all', {
                method: 'DELETE',
            });
            if (res.ok) {
                alert('Base de datos de Finanzas reiniciada.');
                fetchFinance();
            }
        } catch (e) { alert('Error al reiniciar'); }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 backdrop-blur-md gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                        <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg">Control Financiero</h2>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="bg-white/10 px-2 py-0.5 rounded-full text-white/70">{activeSubs.length} suscripciones</span>
                            <span>&bull;</span>
                            <span className="text-emerald-400 font-medium">${projectedBurn.toFixed(2)}/mes</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExportReport}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                        📄 Exportar
                    </button>
                    {activeSubs.length > 0 ? (
                        <button
                            onClick={handleClearData}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group">
                            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform" />
                            Reiniciar Data
                        </button>
                    ) : (
                        <button
                            onClick={handleImportLegacy}
                            className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg border border-transparent shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                            🔄 Importar Legacy (v3)
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Stats Card */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Projection Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 p-8 shadow-2xl group">
                        <div className="absolute top-0 right-0 p-40 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-1000" />

                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                            <div>
                                <p className="text-emerald-400 font-medium mb-1 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <TrendingUp className="w-4 h-4" /> Proyección Mensual
                                </p>
                                <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter">
                                    ${projectedBurn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    <span className="text-xl text-muted-foreground font-normal ml-2">USD</span>
                                </h1>
                            </div>
                            <div className="text-left sm:text-right bg-white/5 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                                <p className="text-xs text-muted-foreground mb-1">Costo Anual Estimado</p>
                                <p className="text-xl font-bold text-white">
                                    ${(projectedBurn * 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>

                        {/* Visual Bar */}
                        <div className="mt-8 relative pt-2">
                            <div className="flex justify-between text-xs font-mono text-muted-foreground mb-2">
                                <span>Software & SaaS ({Math.round((totalMonthlyFixed / (projectedBurn || 1)) * 100)}%)</span>
                                <span>Gastos Variables ({Math.round((totalVariable / (projectedBurn || 1)) * 100)}%)</span>
                            </div>
                            <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-white/5">
                                {/* Fixed Costs Segment */}
                                <div
                                    className="bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] relative group/bar"
                                    style={{ width: `${(totalMonthlyFixed / (projectedBurn || 1)) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/bar:translate-x-full transition-transform duration-1000 skew-x-12" />
                                </div>
                                {/* Variable Segment */}
                                <div className="bg-amber-500/80" style={{ width: `${(totalVariable / (projectedBurn || 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Subscription List */}
                    <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                Suscripciones Activas
                            </h3>

                        </div>

                        <div className="divide-y divide-white/5">
                            {activeSubs.map(sub => (
                                <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-xl font-bold text-white/40 group-hover:text-white group-hover:border-blue-500/50 transition-all shadow-lg">
                                            {sub.platform.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white leading-none text-lg">{sub.platform}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/5">
                                                    {sub.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-muted-foreground mb-0.5">Renovación</p>
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <Calendar className="w-3 h-3 text-blue-400" />
                                                <p className="text-sm text-white font-medium">Día {sub.renewalDay}</p>
                                            </div>
                                        </div>
                                        <div className="text-right min-w-[100px]">
                                            <p className="font-bold text-emerald-400 text-xl tracking-tight">${sub.cost}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{sub.currency} / MES</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {activeSubs.length === 0 && (
                                <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                        <CreditCard className="w-8 h-8 text-white/20" />
                                    </div>
                                    <p>No hay suscripciones registradas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Upcoming */}
                <div className="space-y-6">
                    <div className="bg-card/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            Próximos Pagos
                        </h3>

                        <div className="space-y-4">
                            {nextRenewals.map((item, idx) => (
                                <div key={idx} className="relative bg-black/40 rounded-xl p-4 border border-white/5 flex gap-4 items-center group hover:border-purple-500/30 transition-colors">
                                    <div className="bg-white/5 w-14 h-14 rounded-xl flex flex-col items-center justify-center border border-white/10 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.nextDate.toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-xl font-bold text-white leading-none mt-0.5">{item.nextDate.getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{item.platform}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                            <p className="text-xs text-purple-300 font-medium">en {item.daysLeft} días</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-white">${item.cost}</span>
                                    </div>
                                </div>
                            ))}
                            {nextRenewals.length === 0 && <p className="text-sm text-muted-foreground italic">Nada pendiente por ahora.</p>}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-white/10 bg-white/5 text-center">
                        <p className="text-xs text-muted-foreground">
                            Tip: Mantén tus gastos actualizados para tener una proyección real.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

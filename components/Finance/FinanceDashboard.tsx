'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { CreditCard, DollarSign, Calendar, Plus, TrendingUp, AlertCircle } from 'lucide-react';
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono text-emerald-500/70 bg-emerald-500/10 px-2 py-1 rounded">ESTE MES</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            ${projectedBurn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-sm text-emerald-400/60 font-medium">Burn Rate Proyectado</p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono text-blue-500/70 bg-blue-500/10 px-2 py-1 rounded">ACTIVAS</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            {activeSubs.length}
                        </h3>
                        <p className="text-sm text-blue-400/60 font-medium">Suscripciones SaaS</p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 backdrop-blur-sm flex flex-col justify-center items-center gap-3 cursor-pointer hover:bg-white/5 transition-all group">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                        <Plus className="w-6 h-6 text-white group-hover:text-black" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-white">Registrar Transacción</span>
                </div>
            </div>

            {/* Subscriptions List */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Suscripciones Activas
                    </h2>
                </div>

                <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-muted-foreground font-medium border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3">Plataforma</th>
                                <th className="px-4 py-3">Costo</th>
                                <th className="px-4 py-3">Renovación</th>
                                <th className="px-4 py-3">Tarjeta</th>
                                <th className="px-4 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {activeSubs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        No hay suscripciones activas.
                                    </td>
                                </tr>
                            ) : (
                                activeSubs.map(sub => (
                                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white">{sub.platform}</td>
                                        <td className="px-4 py-3 text-emerald-400">${sub.cost}</td>
                                        <td className="px-4 py-3">Día {sub.renewalDay}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{sub.cardUsed}</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded text-xs">
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

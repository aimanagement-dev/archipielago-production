'use client';

import { useAuth } from '@/lib/auth';
import { Users, Shield, Calendar, Activity, AlertTriangle, Copy, CheckCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';

export default function AdminPage() {
    const { user } = useAuth();
    const { tasks, team, gates } = useStore();
    const [pendingTestUsers, setPendingTestUsers] = useState<Array<{email: string; name: string}>>([]);
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    useEffect(() => {
        // Obtener usuarios con accessGranted que necesitan ser agregados como Test Users
        const usersWithAccess = team
            .filter((m: any) => m.accessGranted === true && m.email)
            .map((m: any) => ({
                email: m.email,
                name: m.name,
            }));
        setPendingTestUsers(usersWithAccess);
    }, [team]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedEmail(text);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const copyAllEmails = () => {
        const emails = pendingTestUsers.map(u => u.email).join('\n');
        copyToClipboard(emails);
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
                    <p className="text-muted-foreground">You need admin privileges to access this page.</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Users',
            value: team.length,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
        },
        {
            title: 'Active Tasks',
            value: tasks.filter(t => t.status !== 'Completado').length,
            icon: Activity,
            color: 'from-emerald-500 to-emerald-600',
        },
        {
            title: 'Milestones',
            value: gates.length,
            icon: Calendar,
            color: 'from-amber-500 to-amber-600',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Shield className="w-8 h-8 text-primary" />
                    Admin Panel
                </h1>
                <p className="text-muted-foreground mt-2">Manage users, permissions, and system settings</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6 hover:border-primary/20 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    </div>
                ))}
            </div>

            {/* Google OAuth Test Users - IMPORTANTE */}
            {pendingTestUsers.length > 0 && (
                <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-amber-400 mb-2">
                                ⚠️ Usuarios Pendientes de Agregar como Test Users
                            </h2>
                            <p className="text-sm text-amber-300/80 mb-4">
                                Estos usuarios tienen <code className="bg-amber-500/20 px-1 rounded">accessGranted = true</code> pero necesitan ser agregados manualmente en Google Cloud Console para poder hacer login.
                            </p>
                            
                            <div className="bg-black/30 rounded-lg p-4 mb-4 space-y-2">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-amber-200">Emails a agregar:</span>
                                    <button
                                        onClick={copyAllEmails}
                                        className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs font-medium transition-colors border border-amber-500/30"
                                    >
                                        {copiedEmail ? (
                                            <>
                                                <CheckCircle className="w-3 h-3" />
                                                Copiado
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                Copiar Todos
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {pendingTestUsers.map((user) => (
                                        <div key={user.email} className="flex items-center justify-between text-sm">
                                            <span className="text-amber-200 font-mono">{user.email}</span>
                                            <button
                                                onClick={() => copyToClipboard(user.email)}
                                                className="p-1 hover:bg-amber-500/20 rounded transition-colors"
                                                title="Copiar email"
                                            >
                                                {copiedEmail === user.email ? (
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-amber-300" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-lg p-4 border border-amber-500/20">
                                <h3 className="text-sm font-bold text-amber-300 mb-2">📋 Instrucciones:</h3>
                                <ol className="text-xs text-amber-200/90 space-y-1.5 list-decimal list-inside">
                                    <li>Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline hover:text-amber-200">Google Cloud Console</a></li>
                                    <li>Selecciona el proyecto: <code className="bg-amber-500/20 px-1 rounded">archipielago-production</code></li>
                                    <li>Ve a: <strong>APIs & Services</strong> → <strong>OAuth consent screen</strong></li>
                                    <li>Desplázate hasta la sección <strong>"Test users"</strong></li>
                                    <li>Haz clic en <strong>"+ ADD USERS"</strong></li>
                                    <li>Pega los emails de arriba (uno por línea o separados por comas)</li>
                                    <li>Haz clic en <strong>"ADD"</strong> y <strong>GUARDA</strong> los cambios</li>
                                </ol>
                                <p className="text-xs text-amber-300/70 mt-3 font-medium">
                                    ⚡ Sin esto, los usuarios serán bloqueados por Google al intentar hacer login.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Management */}
            <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Team Members
                </h2>

                <div className="space-y-3">
                    {team.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                                    <span className="text-lg font-bold text-primary">
                                        {member.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{member.name}</p>
                                    <p className="text-sm text-muted-foreground">{member.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${member.status === 'Activo'
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>
                                    {member.status}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-muted-foreground border border-white/10">
                                    {member.type}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">System Information</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Version</span>
                            <span className="text-foreground font-medium">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Environment</span>
                            <span className="text-foreground font-medium">Production</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Database</span>
                            <span className="text-emerald-500 font-medium">Connected</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-md rounded-xl border border-white/5 p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">Project Status</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Start Date</span>
                            <span className="text-foreground font-medium">Nov 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">End Date</span>
                            <span className="text-foreground font-medium">Ago 2026</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span className="text-emerald-500 font-medium">Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

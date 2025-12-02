'use client';

import { useAuth } from '@/lib/auth';
import { LogOut, Settings, User, Shield } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
    const { user, logout } = useAuth();
    const [showMenu, setShowMenu] = useState(false);

    if (!user) return null;

    return (
        <header className="h-16 border-b border-white/10 bg-card/30 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
            <div>
                <h2 className="text-sm font-medium text-muted-foreground">Welcome back,</h2>
                <h1 className="text-lg font-bold text-foreground">{user.name}</h1>
            </div>

            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                    <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {user.role === 'admin' && <Shield className="w-3 h-3 text-primary" />}
                            <span className="capitalize">{user.role}</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                        <span className="text-sm font-bold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </button>

                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-30"
                            onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40">
                            <div className="p-3 border-b border-white/10 bg-white/5">
                                <p className="text-sm font-medium text-foreground">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="p-2">
                                <button
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                                    onClick={() => setShowMenu(false)}
                                >
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-foreground">Profile</span>
                                </button>
                                <button
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                                    onClick={() => setShowMenu(false)}
                                >
                                    <Settings className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-foreground">Settings</span>
                                </button>
                            </div>
                            <div className="p-2 border-t border-white/10">
                                <button
                                    onClick={() => {
                                        logout();
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors text-left group"
                                >
                                    <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
                                    <span className="text-sm text-foreground group-hover:text-destructive">Logout</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}

'use client';

import { useAuth } from '@/lib/auth';
import { isUserAdmin } from '@/lib/constants';
import { useTheme } from 'next-themes';
import { Bell, Lock, Palette, Globe, Moon, Sun, Sunset } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!user) return null;

    const isAdmin = isUserAdmin(user.email);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
                <p className="text-muted-foreground">Manage your application preferences</p>
            </div>

            {/* Notifications */}
            <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Notifications</h2>
                        <p className="text-sm text-muted-foreground">Control how you receive updates</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p className="font-medium text-foreground">Push Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive real-time updates</p>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-primary' : 'bg-muted-foreground/20'
                                }`}
                        >
                            <span
                                className={`absolute top-1 left-1 w-4 h-4 bg-background rounded-full transition-transform ${notifications ? 'translate-x-6' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p className="font-medium text-foreground">Email Alerts</p>
                            <p className="text-sm text-muted-foreground">Get updates via email</p>
                        </div>
                        <button
                            onClick={() => setEmailAlerts(!emailAlerts)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${emailAlerts ? 'bg-primary' : 'bg-muted-foreground/20'
                                }`}
                        >
                            <span
                                className={`absolute top-1 left-1 w-4 h-4 bg-background rounded-full transition-transform ${emailAlerts ? 'translate-x-6' : ''
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Security</h2>
                        <p className="text-sm text-muted-foreground">Manage your account security</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="font-medium text-foreground mb-1">Connected Account</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-primary mt-2">✓ Google OAuth Active</p>
                    </div>
                </div>
            </div>

            {/* Appearance (Admin Only) */}
            {isAdmin && (
                <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Palette className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Appearance</h2>
                            <p className="text-sm text-muted-foreground">Customize interface (Admin Only)</p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="font-medium text-foreground mb-3">Theme Preference</p>
                        {mounted && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all ${theme === 'dark'
                                        ? 'bg-primary/20 text-primary border-primary/50'
                                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                        }`}
                                >
                                    <Moon className="w-4 h-4" />
                                    Dark Mode
                                </button>
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all ${theme === 'light'
                                        ? 'bg-primary/20 text-primary border-primary/50'
                                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                        }`}
                                >
                                    <Sun className="w-4 h-4" />
                                    Light Mode
                                </button>
                                <button
                                    onClick={() => setTheme('sunset')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all ${theme === 'sunset'
                                        ? 'bg-primary/20 text-primary border-primary/50'
                                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                        }`}
                                >
                                    <Sunset className="w-4 h-4" />
                                    Sunset
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Language */}
            <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Language & Region</h2>
                        <p className="text-sm text-muted-foreground">Set your preferred language</p>
                    </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="font-medium text-foreground mb-2">Language</p>
                    <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option>Español</option>
                        <option>English</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

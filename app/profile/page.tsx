'use client';

import { useAuth } from '@/lib/auth';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    const displayName = user.email === 'ai.management@archipielagofilm.com' ? 'Cindy/Fede' : user.name;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
                <p className="text-muted-foreground">Manage your personal information</p>
            </div>

            <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/30">
                        <span className="text-3xl font-bold text-primary">
                            {displayName?.charAt(0).toUpperCase()}
                        </span>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                                <User className="w-4 h-4" />
                                Name
                            </label>
                            <p className="text-lg font-semibold text-foreground">{displayName}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                                <Mail className="w-4 h-4" />
                                Email
                            </label>
                            <p className="text-foreground">{user.email}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                                <Shield className="w-4 h-4" />
                                Role
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium capitalize">
                                    {user.role}
                                </span>
                                {user.role === 'admin' && (
                                    <span className="text-xs text-muted-foreground">Full system access</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4" />
                                Member Since
                            </label>
                            <p className="text-foreground">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Quick Stats</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-2xl font-bold text-primary">12</p>
                        <p className="text-sm text-muted-foreground">Active Tasks</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-2xl font-bold text-primary">34</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-2xl font-bold text-primary">98%</p>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

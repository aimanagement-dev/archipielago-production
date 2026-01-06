'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, CheckSquare, Users, Flag, Settings, MessageSquare, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Gates', href: '/gates', icon: Flag },
];

const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: Settings },
  { name: 'Drive', href: '/drive', icon: HardDrive },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-card/60 backdrop-blur-xl border-r border-border flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
          Archipiélago
        </h1>
        <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase font-semibold">Production OS</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}

        {user?.role === 'admin' && (
          <>
            <div className="my-4 border-t border-border" />
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Lantica Studios</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <span className="font-medium">Production Active</span>
          </div>
          <p className="opacity-70">Nov 2025 - Ago 2026</p>
        </div>
      </div>
    </div>
  );
}

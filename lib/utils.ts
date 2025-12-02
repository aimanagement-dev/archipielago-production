import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export const statusColors: Record<string, string> = {
  'Pendiente': 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  'En Progreso': 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
  'Completado': 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  'Bloqueado': 'bg-red-500/10 text-red-500 border border-red-500/20',
  'Aprobado': 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  'Rechazado': 'bg-red-500/10 text-red-500 border border-red-500/20',
};

export const areaColors: Record<string, string> = {
  'Guión': 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
  'Técnico': 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
  'Casting': 'bg-pink-500/10 text-pink-500 border border-pink-500/20',
  'Reporting': 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20',
  'Pipeline': 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20',
  'Post-producción': 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
  'Investigación': 'bg-teal-500/10 text-teal-500 border border-teal-500/20',
  'Pre-visualización': 'bg-violet-500/10 text-violet-500 border border-violet-500/20',
  'Producción': 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  'Planificación': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  'Crew': 'bg-slate-500/10 text-slate-500 border border-slate-500/20',
};

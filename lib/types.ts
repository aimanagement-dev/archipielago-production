export type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completado' | 'Bloqueado';
export type TaskArea = 'Guión' | 'Técnico' | 'Casting' | 'Reporting' | 'Pipeline' | 'Post-producción' | 'Investigación' | 'Pre-visualización' | 'Producción' | 'Planificación' | 'Crew';
export type MemberStatus = 'Activo' | 'Inactivo';
export type MemberType = 'Full-time' | 'Part-time';
export type GateStatus = 'Pendiente' | 'En Progreso' | 'Completado' | 'Aprobado' | 'Rechazado';
export type EventType = 'task' | 'gate' | 'deadline' | 'meeting';
export type Month = 'Nov' | 'Dic' | 'Ene' | 'Feb' | 'Mar' | 'Abr' | 'May' | 'Jun' | 'Jul' | 'Ago';

export interface Task {
  id: string;
  title: string;
  area: TaskArea;
  week: string;
  responsible: string[];
  status: TaskStatus;
  notes: string;
  dueDate?: string;
  month: Month;
  scheduledDate?: string; // ISO date string 'YYYY-MM-DD'
  scheduledTime?: string; // Time string 'HH:MM'
  isScheduled?: boolean; // Flag to indicate if task has specific date/time
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: MemberStatus;
  type: MemberType;
  email?: string;
  notes?: string;
}

export interface Gate {
  id: string;
  name: string;
  week: string;
  deliverables: string[];
  responsible: string;
  criteria: string;
  status: GateStatus;
  date?: string;
  description?: string;
}

export interface CalendarEvent {
  id: string;
  taskId?: string;
  gateId?: string;
  date: string;
  type: EventType;
  title: string;
}

export interface Stats {
  totalTasks: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  gatesCompleted: number;
  totalGates: number;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
  shared?: boolean;
  owners?: { displayName: string; emailAddress: string }[];
}

export interface DriveFolder {
  id: string;
  name: string;
  path: string[];
}

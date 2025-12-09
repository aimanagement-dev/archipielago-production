export type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completado' | 'Bloqueado';
export type TaskArea = 'Guión' | 'Técnico' | 'Casting' | 'Reporting' | 'Pipeline' | 'Post-producción' | 'Investigación' | 'Pre-visualización' | 'Producción' | 'Planificación' | 'Crew';
export type MemberStatus = 'Activo' | 'Inactivo';
export type MemberType = 'Full-time' | 'Part-time';
export type GateStatus = 'Pendiente' | 'En Progreso' | 'Completado' | 'Aprobado' | 'Rechazado';
export type EventType = 'task' | 'gate' | 'deadline' | 'meeting';
export type Month = 'Nov' | 'Dic' | 'Ene' | 'Feb' | 'Mar' | 'Abr' | 'May' | 'Jun' | 'Jul' | 'Ago';

export type VisibilityLevel = 'all' | 'department' | 'individual';
export type Department = 'Guión' | 'Técnico' | 'Casting' | 'Reporting' | 'Pipeline' | 'Post-producción' | 'Investigación' | 'Pre-visualización' | 'Producción' | 'Planificación' | 'Crew';

export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'link';
  url: string;
  addedBy: string;
  addedAt: string;
  size?: number; // in bytes, for files
}

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
  isGoogleEvent?: boolean; // Flag to indicate if task is from Google Calendar
  attachments?: Attachment[]; // Documents and links attached to task
  visibility?: VisibilityLevel; // Who can see this task
  visibleTo?: string[]; // Specific emails/departments if visibility is restricted
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
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  extendedProperties?: {
    private?: {
      [key: string]: string;
    };
  };
  htmlLink?: string;
  // Legacy fields kept for compatibility if needed, but made optional
  taskId?: string;
  gateId?: string;
  date?: string;
  type?: EventType;
  title?: string;
  sourceCalendar?: string;
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

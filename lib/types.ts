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
  hasMeet?: boolean; // Wants Google Meet link
  isGoogleEvent?: boolean; // Flag to indicate if task is from Google Calendar
  attachments?: Attachment[]; // Documents and links attached to task
  visibility?: VisibilityLevel; // Who can see this task
  visibleTo?: string[]; // Specific emails/departments if visibility is restricted
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; // To be deprecated in favor of position/department
  status: MemberStatus;
  type: MemberType;
  accessGranted?: boolean; // System Access Toggle

  // Contácto y Personal
  email?: string;
  secondaryEmail?: string;
  phone?: string;
  address?: string;
  idNumber?: string; // DNI / Passport
  nationality?: string;

  // Profesional
  department?: string; // e.g. "Camera", "Sound", "Production"
  position?: string;   // e.g. "DoP", "Boom Operator"
  union?: string;      // Sindicato / Guild
  dailyRate?: number;
  currency?: 'USD' | 'DOP' | 'EUR';

  // Emergencia
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Metadata & Extras
  notes?: string;
  dietaryRequirements?: string;
  allergies?: string;
  socials?: {
    linkedin?: string;
    imdb?: string;
    instagram?: string; // Portafolio
    website?: string;
  };
}

export interface Gate {
  id: string;
  name: string;
  week: string;
  deliverables: { name: string; completed: boolean }[];
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

export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Paused' | 'Trial';
export type BillingCycle = 'Monthly' | 'Yearly';

export interface Subscription {
  id: string;
  platform: string;
  category: string; // e.g. "LLMS", "Gen. Img/Video", "Infrastructure"
  amount: number; // Renamed from 'cost' for consistency
  currency: 'USD' | 'DOP' | 'EUR';
  billingCycle: BillingCycle;
  renewalDay: number; // 1-31
  cardUsed?: string; // e.g. "VISA 4237"
  status: SubscriptionStatus;

  // INTEGRACIÓN CON CREW
  ownerId?: string; // ID del TeamMember que "paga" (dropdown)
  users: string[]; // IDs de TeamMembers que "usan" (multi-select)

  // Metadata
  notes?: string;
  receiptUrl?: string; // Link a factura en Drive
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // Email del admin que creó

  // Legacy compatibility (deprecated, use ownerId instead)
  owner?: string; // Email (mantener para migración)
  cost?: number; // Alias de amount (mantener para compatibilidad)
}

export type TransactionKind = 'fixed' | 'extra' | 'one_off' | 'trial';
export type TransactionStatus = 'pending' | 'approved' | 'paid';

export interface Transaction {
  id: string;
  date: string; // Fecha real del gasto (YYYY-MM-DD)
  vendor: string; // Plataforma/vendor
  kind: TransactionKind; // Tipo fuerte: fixed/extra/one_off/trial
  amount: number;
  currency: 'USD' | 'DOP' | 'EUR';
  category: string; // "LLMS", "Ed. Video", etc.

  // INTEGRACIÓN CON CREW
  payerId?: string; // ID del TeamMember que pagó (dropdown)
  users: string[]; // IDs de TeamMembers que usaron (multi-select)

  // Vinculación opcional
  subscriptionId?: string; // Si este gasto viene de una suscripción

  // Receipt & Control
  receiptRef?: string; // "invoice", "receipt", "factura", o texto libre
  receiptUrl?: string; // Link al archivo
  notes?: string;

  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // Email del admin que creó
}

// Legacy type (deprecated, use Transaction instead)
export type ExpenseType = 'Subscription Charge' | 'One-off' | 'Reimbursement';
export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: 'USD' | 'DOP' | 'EUR';
  category: string;
  type: ExpenseType;
  receiptUrl?: string;
  status?: 'Pending' | 'Approved' | 'Paid';
}

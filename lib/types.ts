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

// Chat & Messaging Types
export type ChatRoomType = 'team' | 'project' | 'area';
export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_blocked'
  | 'mention'
  | 'gate_approved'
  | 'gate_rejected'
  | 'file_uploaded'
  | 'comment_added';

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: ChatRoomType;
  area?: TaskArea;
  created_by: string; // User email
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_email: string;
  sender_name: string;
  content: string;
  mentions?: string[]; // Array of mentioned user emails
  attachments?: FileAttachment[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_edited: boolean;
}

export interface Notification {
  id: string;
  user_email: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface FileAttachment {
  id: string;
  drive_file_id: string;
  name: string;
  mime_type: string;
  size_bytes?: number;
  drive_url: string;
  thumbnail_url?: string;
  uploaded_by: string;
  uploaded_at: string;
  related_type: 'task' | 'gate' | 'message';
  related_id: string;
  is_deleted: boolean;
}

// Extended Task with attachments
export interface TaskWithAttachments extends Task {
  attachments?: FileAttachment[];
}

// Extended Gate with attachments
export interface GateWithAttachments extends Gate {
  attachments?: FileAttachment[];
}

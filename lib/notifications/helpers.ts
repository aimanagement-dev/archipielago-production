import { NotificationService } from '../services/notification.service';
import type { Task, Gate } from '../types';

/**
 * Send notification when a task is created or assigned
 */
export async function notifyTaskAssignment(
  task: Task,
  assignedBy: string,
  previousResponsible?: string[]
) {
  const newAssignees = task.responsible.filter(
    (email) => !previousResponsible?.includes(email)
  );

  for (const assigneeEmail of newAssignees) {
    if (assigneeEmail && assigneeEmail !== assignedBy) {
      await NotificationService.notifyTaskAssigned(
        assigneeEmail,
        task.id,
        task.title,
        assignedBy
      );
    }
  }
}

/**
 * Send notification when task status changes
 */
export async function notifyTaskStatusChange(
  task: Task,
  previousStatus: string,
  changedBy: string
) {
  // Notify when task is completed
  if (task.status === 'Completado' && previousStatus !== 'Completado') {
    for (const responsible of task.responsible) {
      if (responsible && responsible !== changedBy) {
        await NotificationService.notifyTaskCompleted(
          responsible,
          task.id,
          task.title,
          changedBy
        );
      }
    }
  }

  // Notify when task is blocked
  if (task.status === 'Bloqueado' && previousStatus !== 'Bloqueado') {
    for (const responsible of task.responsible) {
      if (responsible) {
        await NotificationService.createNotification(
          responsible,
          'task_blocked',
          'Tarea bloqueada',
          `La tarea "${task.title}" ha sido marcada como bloqueada`,
          `/tasks?id=${task.id}`,
          task.id
        );
      }
    }
  }
}

/**
 * Send notification when gate status changes
 */
export async function notifyGateStatusChange(
  gate: Gate,
  previousStatus: string
) {
  if (
    (gate.status === 'Aprobado' || gate.status === 'Rechazado') &&
    gate.status !== previousStatus &&
    gate.responsible
  ) {
    await NotificationService.notifyGateStatusChange(
      gate.responsible,
      gate.id,
      gate.name,
      gate.status
    );
  }
}

/**
 * Send notification when file is uploaded
 */
export async function notifyFileUpload(
  uploadedBy: string,
  fileName: string,
  relatedType: 'task' | 'gate' | 'message',
  relatedId: string,
  recipientEmails: string[]
) {
  const typeLabels = {
    task: 'tarea',
    gate: 'gate',
    message: 'mensaje',
  };

  for (const email of recipientEmails) {
    if (email && email !== uploadedBy) {
      await NotificationService.createNotification(
        email,
        'file_uploaded',
        'Nuevo archivo adjunto',
        `${uploadedBy} subió "${fileName}" a ${typeLabels[relatedType]}`,
        relatedType === 'task' ? `/tasks?id=${relatedId}` : `/gates?id=${relatedId}`,
        relatedId
      );
    }
  }
}

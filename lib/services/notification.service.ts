import { supabase } from '../supabase';
import type { Notification, NotificationType } from '../types';

export class NotificationService {
  // Fetch notifications for a user
  static async getNotifications(userEmail: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as Notification[]) || [];
  }

  // Get unread notification count
  static async getUnreadCount(userEmail: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', userEmail)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  // Create a notification
  static async createNotification(
    userEmail: string,
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string,
    relatedId?: string
  ): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_email: userEmail,
        type,
        title,
        message,
        action_url: actionUrl,
        related_id: relatedId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userEmail: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_email', userEmail)
      .eq('is_read', false);

    if (error) throw error;
  }

  // Subscribe to new notifications
  static subscribeToNotifications(
    userEmail: string,
    onNewNotification: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications:${userEmail}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_email=eq.${userEmail}`,
        },
        (payload) => {
          onNewNotification(payload.new as Notification);
        }
      )
      .subscribe();
  }

  // Helper: Notify task assignment
  static async notifyTaskAssigned(
    assigneeEmail: string,
    taskId: string,
    taskTitle: string,
    assignedBy: string
  ): Promise<void> {
    await this.createNotification(
      assigneeEmail,
      'task_assigned',
      'Nueva tarea asignada',
      `${assignedBy} te asignó la tarea: ${taskTitle}`,
      `/tasks?id=${taskId}`,
      taskId
    );
  }

  // Helper: Notify task completion
  static async notifyTaskCompleted(
    userEmail: string,
    taskId: string,
    taskTitle: string,
    completedBy: string
  ): Promise<void> {
    await this.createNotification(
      userEmail,
      'task_completed',
      'Tarea completada',
      `${completedBy} completó la tarea: ${taskTitle}`,
      `/tasks?id=${taskId}`,
      taskId
    );
  }

  // Helper: Notify mention in chat
  static async notifyMention(
    mentionedEmail: string,
    mentionedBy: string,
    chatRoomId: string,
    chatRoomName: string,
    messagePreview: string
  ): Promise<void> {
    await this.createNotification(
      mentionedEmail,
      'mention',
      `${mentionedBy} te mencionó`,
      `En ${chatRoomName}: ${messagePreview.substring(0, 50)}...`,
      `/chat?room=${chatRoomId}`,
      chatRoomId
    );
  }

  // Helper: Notify gate status change
  static async notifyGateStatusChange(
    userEmail: string,
    gateId: string,
    gateName: string,
    status: string
  ): Promise<void> {
    const type = status === 'Aprobado' ? 'gate_approved' : 'gate_rejected';
    const title = status === 'Aprobado' ? 'Gate aprobado' : 'Gate rechazado';

    await this.createNotification(
      userEmail,
      type,
      title,
      `El gate "${gateName}" ha sido ${status.toLowerCase()}`,
      `/gates?id=${gateId}`,
      gateId
    );
  }
}

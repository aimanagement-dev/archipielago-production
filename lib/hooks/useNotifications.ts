import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { NotificationService } from '../services/notification.service';
import type { Notification } from '../types';

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      loadNotifications();
      loadUnreadCount();

      // Subscribe to real-time notifications
      const channel = NotificationService.subscribeToNotifications(
        session.user.email,
        (newNotification) => {
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      );

      return () => {
        channel.unsubscribe();
      };
    }
  }, [session]);

  const loadNotifications = async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    try {
      const notifs = await NotificationService.getNotifications(session.user.email);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!session?.user?.email) return;

    try {
      const count = await NotificationService.getUnreadCount(session.user.email);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!session?.user?.email) return;

    try {
      await NotificationService.markAllAsRead(session.user.email);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}

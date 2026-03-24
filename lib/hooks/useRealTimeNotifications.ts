"use client";

import { useState, useEffect, useCallback } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

export interface NotificationData {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: any;
  created_at: string;
}

export function useRealTimeNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await insforge.database
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
        const unread = data.filter((n: NotificationData) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const handleNewNotification = (payload: any) => {
      const newNotif = payload as NotificationData;
      setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
      setUnreadCount(prev => prev + 1);

      // Show browser notification if permission granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/TalentMesh_Logo-removebg-preview.png',
        });
      }
    };

    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        await insforge.realtime.subscribe('notifications:' + user.id);
        insforge.realtime.on('INSERT_notifications', handleNewNotification);
      } catch (err) {
        console.error('Realtime connection error:', err);
      }
    };

    setupRealtime();

    return () => {
      insforge.realtime.off('INSERT_notifications', handleNewNotification);
      insforge.realtime.unsubscribe('notifications:' + user.id);
    };
  }, [user, fetchNotifications]);

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await insforge.database
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await insforge.database
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    markAsRead,
    refresh: fetchNotifications,
  };
}

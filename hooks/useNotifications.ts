import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../components/ui/ToastProvider';

export type NotificationType = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
export type NotificationCategory = 'FINANCE' | 'PROCESS' | 'SYSTEM' | 'DEADLINE';

export interface SystemNotification {
  id: string;
  user_id?: string | null;
  role_target?: string | null;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  link_action?: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch notifications targeted to user OR their role
      let query = supabase
        .from('system_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 for performance

      // RLS should handle filtering, but client side refinement is okay too if needed
      // Actually RLS handles it.

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setNotifications(data as SystemNotification[]);
        setUnreadCount(data.filter((n: SystemNotification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:system_notifications')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and UPDATE
          schema: 'public',
          table: 'system_notifications',
          // Filter by user_id is tricky in realtime cause of potential NULLs for role-based.
          // Simplest is to filter on client or just refetch on any change table-wide (might be noisy).
          // Better: Listen to INSERT where user_id=uid OR user_id is null.
          // Supabase Realtime filters can be limited. Let's start with table-wide and filter in callback or just refetch.
        },
        async (payload) => {
           // Refetch to be safe and accurate with RLS
           await fetchNotifications();
           
           // Optional: Show toast for new INSERTs
           if (payload.eventType === 'INSERT') {
             const newNotif = payload.new as SystemNotification;
             // Check if relevant to user (RLS doesn't filter realtime payloads fully if not careful, 
             // but if we refetch, we get the filtered list. Here we just want a toast.)
             // Ideally we check if it matches our role or ID.
             const isForMe = newNotif.user_id === user.id || 
                             (newNotif.user_id === null && (!newNotif.role_target || newNotif.role_target === 'ALL' || (profile?.role && newNotif.role_target.includes(profile.role))));
            
             if (isForMe && !newNotif.is_read) {
                showToast(newNotif.title, newNotif.type === 'CRITICAL' ? 'error' : (newNotif.type === 'WARNING' ? 'warning' : 'info'));
             }
           }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.role, fetchNotifications, showToast]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));

      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking as read:', error);
      // Revert optimism if needed (skip for simplicity)
      fetchNotifications();
    }
  };
  
  const markAllAsRead = async () => {
      try {
        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        
        // We can only update what we can see, simplified to updated unread ones
        // This might be tricky with RLS if we don't have update policy for all.
        // Our policy: "Users can update own/role notifications" -> USING check is ok.
        // We'll update all unread notifications visible to us.
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        
        if (unreadIds.length === 0) return;

        const { error } = await supabase
          .from('system_notifications')
          .update({ is_read: true })
          .in('id', unreadIds);

        if (error) throw error;

      } catch (err) {
          console.error('Error marking all read:', err);
          fetchNotifications();
      }
  }

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}

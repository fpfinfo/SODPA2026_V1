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
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load local state
      const localDismissed = JSON.parse(localStorage.getItem('sosfu_dismissed_notifs') || '[]');
      const mutedTitles = JSON.parse(localStorage.getItem('sosfu_muted_titles') || '[]');

      // Fetch notifications targeted to user OR their role (and global broadcasts)
      let query = supabase
        .from('system_notifications')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Merge DB data with local dismissal state AND filter muted titles
        const mergedData = data
          .filter((n: SystemNotification) => !mutedTitles.includes(n.title)) // Block muted titles (Spam Fix)
          .map((n: SystemNotification) => ({
            ...n,
            is_read: n.is_read || localDismissed.includes(n.id)
          }));
        
        setNotifications(mergedData as SystemNotification[]);
        setUnreadCount(mergedData.filter((n: SystemNotification) => !n.is_read).length);
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
        },
        async (payload) => {
           // Refetch to be safe and accurate with RLS
           await fetchNotifications();
           
           if (payload.eventType === 'INSERT') {
             const newNotif = payload.new as SystemNotification;
             // Check if relevant to user
             const isForMe = newNotif.user_id === user.id || 
                             (newNotif.user_id === null && (!newNotif.role_target || newNotif.role_target === 'ALL'));
             
             // Check local storage too
             const localDismissed = JSON.parse(localStorage.getItem('sosfu_dismissed_notifs') || '[]');
             const mutedTitles = JSON.parse(localStorage.getItem('sosfu_muted_titles') || '[]');

             const isLocallyDismissed = localDismissed.includes(newNotif.id);
             const isMuted = mutedTitles.includes(newNotif.title);

             if (isForMe && !newNotif.is_read && !isLocallyDismissed && !isMuted) {
                showToast({ 
                  title: newNotif.title, 
                  type: newNotif.type === 'CRITICAL' ? 'error' : (newNotif.type === 'WARNING' ? 'warning' : 'info')
                });
             }
           }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, showToast]);

  const markAsRead = async (id: string) => {
    try {
      // 1. Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // 2. Local Storage Persistence (Defensive)
      const localDismissed = JSON.parse(localStorage.getItem('sosfu_dismissed_notifs') || '[]');
      if (!localDismissed.includes(id)) {
        localDismissed.push(id);
        localStorage.setItem('sosfu_dismissed_notifs', JSON.stringify(localDismissed));
      }

      // 3. Backend Update
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.warn('Backend update failed, relying on local storage:', error);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      // Do not refetch here so we don't lose the optimistic/local state
    }
  };
  
  const markAllAsRead = async () => {
      try {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // 1. Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        
        // 2. Local Storage Persistence
        const localDismissed = JSON.parse(localStorage.getItem('sosfu_dismissed_notifs') || '[]');
        const newDismissed = [...new Set([...localDismissed, ...unreadIds])];
        localStorage.setItem('sosfu_dismissed_notifs', JSON.stringify(newDismissed));

        // 3. Backend Update
        const { error } = await supabase
          .from('system_notifications')
          .update({ is_read: true })
          .in('id', unreadIds);

        if (error) throw error;

      } catch (err) {
          console.error('Error marking all read:', err);
      }
  }

  const markGroupAsRead = async (title: string) => {
    try {
      // Filter target IDs
      const targetIds = notifications
        .filter(n => n.title === title && !n.is_read)
        .map(n => n.id);

      // 1. Update UI (mark read AND remove from view if desired, but here we just mark read)
      // Actually, if we MUTE the title, they should disappear?
      // For UX consistency, let's just mark them read in state.
      setNotifications(prev => prev.map(n => n.title === title ? { ...n, is_read: true } : n));
      
      const countToRemove = notifications.filter(n => n.title === title && !n.is_read).length;
      setUnreadCount(prev => Math.max(0, prev - countToRemove));

      // 2. Local Storage (dismiss IDs AND mute title)
      const localDismissed = JSON.parse(localStorage.getItem('sosfu_dismissed_notifs') || '[]');
      const newDismissed = [...new Set([...localDismissed, ...targetIds])];
      localStorage.setItem('sosfu_dismissed_notifs', JSON.stringify(newDismissed));

      // CRITICAL: Mute the title to prevent future spam
      const mutedTitles = JSON.parse(localStorage.getItem('sosfu_muted_titles') || '[]');
      if (!mutedTitles.includes(title)) {
          mutedTitles.push(title);
          localStorage.setItem('sosfu_muted_titles', JSON.stringify(mutedTitles));
      }

      // 3. Backend
      if (targetIds.length > 0) {
        const { error } = await supabase
          .from('system_notifications')
          .update({ is_read: true })
          .in('id', targetIds);
        
        if (error) throw error;
      }

    } catch (error) {
       console.error('Error marking group as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    markGroupAsRead
  };
}

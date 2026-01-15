/**
 * useRoleRequests Hook
 * Manages role change requests for RBAC system
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export type SystemRole = 'SUPRIDO' | 'GESTOR' | 'SOSFU' | 'SEPLAN' | 'AJSEFIN' | 'SGP';

export interface RoleRequest {
  id: string;
  nome: string;
  email: string;
  role: SystemRole;
  requested_role: SystemRole;
  role_request_status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  role_request_date: string | null;
  role_request_reason: string | null;
  avatar_url: string | null;
}

interface UseRoleRequestsReturn {
  // For users
  currentRole: SystemRole | null;
  requestedRole: SystemRole | null;
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  requestRoleChange: (newRole: SystemRole, reason?: string) => Promise<boolean>;
  cancelRoleRequest: () => Promise<boolean>;
  
  // For SOSFU admins
  pendingRequests: RoleRequest[];
  isLoading: boolean;
  error: string | null;
  approveRequest: (userId: string) => Promise<boolean>;
  rejectRequest: (userId: string, reason: string) => Promise<boolean>;
  refreshRequests: () => Promise<void>;
}

export const ROLE_LABELS: Record<SystemRole, string> = {
  SUPRIDO: 'Suprido',
  GESTOR: 'Gestor',
  SOSFU: 'SOSFU (Administrador)',
  SEPLAN: 'SEPLAN',
  AJSEFIN: 'AJSEFIN',
  SGP: 'SGP',
};

export function useRoleRequests(): UseRoleRequestsReturn {
  const [currentRole, setCurrentRole] = useState<SystemRole | null>(null);
  const [requestedRole, setRequestedRole] = useState<SystemRole | null>(null);
  const [requestStatus, setRequestStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [pendingRequests, setPendingRequests] = useState<RoleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user's role status
  const fetchUserRole = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('role, requested_role, role_request_status')
        .eq('id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (data) {
        setCurrentRole(data.role as SystemRole || 'SUPRIDO');
        setRequestedRole(data.requested_role as SystemRole || null);
        setRequestStatus(data.role_request_status);
      }
    } catch (err: any) {
      console.error('Error fetching user role:', err);
    }
  }, []);

  // Fetch pending requests (for SOSFU admins)
  const fetchPendingRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, nome, email, role, requested_role, role_request_status, role_request_date, role_request_reason, avatar_url')
        .eq('role_request_status', 'PENDING')
        .order('role_request_date', { ascending: true });
      
      if (fetchError) throw fetchError;
      
      setPendingRequests((data || []) as RoleRequest[]);
    } catch (err: any) {
      console.error('Error fetching pending requests:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
    fetchPendingRequests();
  }, [fetchUserRole, fetchPendingRequests]);

  // Request a role change (user action)
  const requestRoleChange = async (newRole: SystemRole, reason?: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          requested_role: newRole,
          role_request_status: 'PENDING',
          role_request_date: new Date().toISOString(),
          role_request_reason: reason || null,
        })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      setRequestedRole(newRole);
      setRequestStatus('PENDING');
      return true;
    } catch (err: any) {
      console.error('Error requesting role change:', err);
      setError(err.message);
      return false;
    }
  };

  // Cancel pending role request (user action)
  const cancelRoleRequest = async (): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          requested_role: null,
          role_request_status: null,
          role_request_date: null,
          role_request_reason: null,
        })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      setRequestedRole(null);
      setRequestStatus(null);
      return true;
    } catch (err: any) {
      console.error('Error canceling role request:', err);
      setError(err.message);
      return false;
    }
  };

  // Approve a role request (SOSFU admin action)
  const approveRequest = async (targetUserId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      // First get the requested role
      const { data: userData, error: fetchError } = await supabase
        .from('profiles')
        .select('requested_role')
        .eq('id', targetUserId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update with approved role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: userData.requested_role,
          requested_role: null,
          role_request_status: 'APPROVED',
          role_approved_by: userId,
          role_approved_at: new Date().toISOString(),
          role_rejection_reason: null,
        })
        .eq('id', targetUserId);
      
      if (updateError) throw updateError;
      
      // Refresh the list
      await fetchPendingRequests();
      return true;
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError(err.message);
      return false;
    }
  };

  // Reject a role request (SOSFU admin action)
  const rejectRequest = async (targetUserId: string, reason: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          requested_role: null,
          role_request_status: 'REJECTED',
          role_approved_by: userId,
          role_approved_at: new Date().toISOString(),
          role_rejection_reason: reason,
        })
        .eq('id', targetUserId);
      
      if (updateError) throw updateError;
      
      // Refresh the list
      await fetchPendingRequests();
      return true;
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    currentRole,
    requestedRole,
    requestStatus,
    requestRoleChange,
    cancelRoleRequest,
    pendingRequests,
    isLoading,
    error,
    approveRequest,
    rejectRequest,
    refreshRequests: fetchPendingRequests,
  };
}

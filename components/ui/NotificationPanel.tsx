// ============================================================================
// NotificationPanel - Dropdown panel for displaying notifications
// Shows in the header with bell icon and unread count badge
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  RotateCcw, 
  Clock, 
  Send, 
  AlertTriangle,
  Check,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationPanelProps {
  variant?: 'light' | 'dark';
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ variant = 'light' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead, 
    markAllAsRead
  } = useNotifications();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'APROVACAO':
      case 'SUCCESS':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'DEVOLUCAO':
      case 'ERROR':
        return <RotateCcw size={14} className="text-red-600" />;
      case 'PRAZO':
      case 'WARNING':
        return <Clock size={14} className="text-amber-600" />;
      case 'TRAMITACAO':
        return <Send size={14} className="text-blue-600" />;
      default:
        return <Bell size={14} className="text-gray-600" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'APROVACAO':
      case 'SUCCESS':
        return 'bg-green-50 border-green-100';
      case 'DEVOLUCAO':
      case 'ERROR':
        return 'bg-red-50 border-red-100';
      case 'PRAZO':
      case 'WARNING':
        return 'bg-amber-50 border-amber-100';
      case 'TRAMITACAO':
        return 'bg-blue-50 border-blue-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.link_action) {
      // Navigate to the linked page
      window.location.href = notification.link_action;
    }
    
    setIsOpen(false);
  };

  const isDark = variant === 'dark';

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isDark 
            ? 'hover:bg-white/10 text-white/80 hover:text-white' 
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
        }`}
      >
        <Bell size={20} />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1 shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Bell size={16} className="text-blue-600" />
              Notificações
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                  title="Marcar todas como lidas"
                >
                  <Check size={14} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Nenhuma notificação</p>
                <p className="text-xs text-gray-400 mt-1">Você está em dia!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 20).map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {/* Type Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeBg(notification.type || notification.category)}`}>
                      {getTypeIcon(notification.type || notification.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    {/* Action indicator */}
                    {notification.link_action && (
                      <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Mostrando as últimas {Math.min(notifications.length, 20)} notificações
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;

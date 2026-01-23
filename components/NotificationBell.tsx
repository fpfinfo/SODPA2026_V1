import React, { useState } from 'react';
import { Bell, Check, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useNotifications, SystemNotification } from '../hooks/useNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NotificationHistoryModal } from './NotificationHistoryModal';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, markGroupAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL': return <AlertCircle size={16} className="text-red-500" />;
      case 'WARNING': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'SUCCESS': return <CheckCircle size={16} className="text-emerald-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const getBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white';
    switch (type) {
      case 'CRITICAL': return 'bg-red-50';
      case 'WARNING': return 'bg-amber-50';
      case 'SUCCESS': return 'bg-emerald-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-700">Notificações</h3>
              {unreadCount > 0 && (
                <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                    <Check size={12} /> Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map(notif => (
                    <div 
                        key={notif.id} 
                        className={`p-4 transition-colors hover:bg-slate-50 relative group ${getBgColor(notif.type, notif.is_read)}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                            {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <h4 className={`text-sm font-semibold ${notif.is_read ? 'text-slate-600' : 'text-slate-800'}`}>
                                {notif.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                {format(new Date(notif.created_at), "dd MMM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className={`text-xs ${notif.is_read ? 'text-slate-500' : 'text-slate-600'} leading-relaxed`}>
                            {notif.message}
                          </p>
                          {notif.link_action && (
                            <a 
                              href={notif.link_action} 
                              onClick={() => {
                                markGroupAsRead(notif.title);
                                setIsOpen(false);
                              }}
                              className="text-xs text-blue-600 hover:underline mt-1 block font-medium"
                            >
                                Resolver Agora →
                            </a>
                          )}
                        </div>
                      </div>
                      {!notif.is_read && (
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                            title="Marcar como lida"
                          >
                            <Check size={12} />
                          </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wide"
                onClick={() => {
                  setIsOpen(false);
                  setIsHistoryOpen(true);
                }}
              >
                Ver Histórico Completo
              </button>
            </div>
          </div>
        </>
      )}

      <NotificationHistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
    </div>
  );
};

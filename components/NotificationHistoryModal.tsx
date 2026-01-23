import React from 'react';
import { X, CheckCheck, Trash2, Calendar, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useNotifications, SystemNotification } from '../hooks/useNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationHistoryModal: React.FC<NotificationHistoryModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markAllAsRead, refresh } = useNotifications();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL': return <AlertCircle size={20} className="text-red-500" />;
      case 'WARNING': return <AlertTriangle size={20} className="text-amber-500" />;
      case 'SUCCESS': return <CheckCircle size={20} className="text-emerald-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white hover:bg-slate-50';
    switch (type) {
      case 'CRITICAL': return 'bg-red-50 hover:bg-red-100/50';
      case 'WARNING': return 'bg-amber-50 hover:bg-amber-100/50';
      case 'SUCCESS': return 'bg-emerald-50 hover:bg-emerald-100/50';
      default: return 'bg-blue-50 hover:bg-blue-100/50';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Histórico de Notificações</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {notifications.length} notificações encontradas
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        {notifications.some(n => !n.is_read) && (
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-end">
                <button 
                    onClick={() => markAllAsRead()}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                    <CheckCheck size={16} /> Mark All as Read
                </button>
            </div>
        )}

        {/* List */}
        <div className="overflow-y-auto p-2 sm:p-4 space-y-2 bg-slate-50/50 min-h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <Info size={32} />
              </div>
              <p className="font-medium">Nenhuma notificação no histórico</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 rounded-xl border border-slate-100/50 transition-all ${getBgColor(notif.type, notif.is_read)}`}
              >
                <div className="flex gap-4">
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-semibold truncate pr-4 ${notif.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                            {notif.title}
                        </h4>
                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-100 shadow-sm">
                            <Calendar size={10} />
                            {format(new Date(notif.created_at), "dd MMM HH:mm", { locale: ptBR })}
                        </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${notif.is_read ? 'text-slate-500' : 'text-slate-700'}`}>
                        {notif.message}
                    </p>
                    {notif.metadata?.nup && (
                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-slate-100 text-[10px] font-mono text-slate-500 font-bold">
                            NUP: {notif.metadata.nup}
                        </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, ExternalLink, Inbox } from 'lucide-react';
import { useNotifications, SystemNotification } from '../../hooks/useNotifications';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'CRITICAL': return 'bg-red-50 border-red-100 text-red-700';
      case 'WARNING': return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'SUCCESS': return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      default: return 'bg-slate-50 border-slate-100 text-slate-700';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => { setIsOpen(!isOpen); if(!isOpen) refresh(); }}
        className="relative w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-all flex items-center justify-center border border-slate-200 shadow-sm"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[100] animate-in slide-in-from-top-4 fade-in duration-200 transform origin-top-right">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notificações</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center opacity-50">
                <Inbox size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-500">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 hover:bg-slate-50 transition-colors relative group ${notif.is_read ? 'opacity-60' : 'bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-xs font-bold ${notif.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                            {new Date(notif.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">
                          {notif.message}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                           <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getTypeStyles(notif.type)} uppercase tracking-wider`}>
                             {notif.category}
                           </span>
                           {notif.link_action && (
                             <a href={notif.link_action} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline">
                               Ver <ExternalLink size={10} />
                             </a>
                           )}
                        </div>
                      </div>
                      
                      {!notif.is_read && (
                        <button 
                          onClick={(e) => handleMarkRead(e, notif.id)}
                          className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 absolute top-2 right-2"
                          title="Marcar como lida"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <button className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors w-full py-1">
              Ver Histórico Completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

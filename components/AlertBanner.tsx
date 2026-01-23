import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useNotifications, SystemNotification } from '../hooks/useNotifications';

export const AlertBanner: React.FC = () => {
  const { notifications, markGroupAsRead } = useNotifications();
  const [criticalAlert, setCriticalAlert] = useState<SystemNotification | null>(null);

  useEffect(() => {
    // Find the most recent UNREAD CRITICAL alert
    const critical = notifications.find(n => n.type === 'CRITICAL' && !n.is_read);
    setCriticalAlert(critical || null);
  }, [notifications]);

  if (!criticalAlert) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-6 py-4 shadow-xl relative z-[100] animate-in slide-in-from-top duration-500 border-b border-white/10">
      <div className="container mx-auto flex items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/10 rounded-xl animate-pulse">
            <AlertCircle size={24} className="flex-shrink-0" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm md:text-base uppercase tracking-wide opacity-90">{criticalAlert.title}</p>
            <p className="text-sm text-white/90 mt-0.5 leading-relaxed font-medium">{criticalAlert.message}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {criticalAlert.link_action && (
            <a 
              href={criticalAlert.link_action}
              onClick={() => markGroupAsRead(criticalAlert.title)}
              className="whitespace-nowrap bg-white text-red-700 px-6 py-2.5 rounded-xl text-xs font-black hover:bg-red-50 hover:scale-105 transition-all shadow-md uppercase tracking-wider"
            >
              Verificar
            </a>
          )}
          
          <button 
            onClick={() => markGroupAsRead(criticalAlert.title)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
            aria-label="Dispensar alerta"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

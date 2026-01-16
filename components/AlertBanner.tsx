import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useNotifications, SystemNotification } from '../hooks/useNotifications';

export const AlertBanner: React.FC = () => {
  const { notifications } = useNotifications();
  const [criticalAlert, setCriticalAlert] = useState<SystemNotification | null>(null);

  useEffect(() => {
    // Find the most recent UNREAD CRITICAL alert
    const critical = notifications.find(n => n.type === 'CRITICAL' && !n.is_read);
    setCriticalAlert(critical || null);
  }, [notifications]);

  if (!criticalAlert) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 shadow-lg relative z-50 animate-in slide-in-from-top duration-300">
      <div className="container mx-auto flex items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="font-bold text-sm md:text-base">{criticalAlert.title}</p>
            <p className="text-xs md:text-sm text-red-100 mt-0.5">{criticalAlert.message}</p>
          </div>
        </div>
        
        {criticalAlert.link_action && (
           <a 
             href={criticalAlert.link_action}
             className="whitespace-nowrap bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shadow-sm"
           >
             VERIFICAR
           </a>
        )}
      </div>
    </div>
  );
};

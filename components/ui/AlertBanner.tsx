import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export const AlertBanner: React.FC = () => {
  const { notifications, markAsRead, unreadCount } = useNotifications();
  const [activeAlert, setActiveAlert] = useState<any | null>(null);

  // Pick the latest CRITICAL or WARNING unread notification as a banner
  useEffect(() => {
    // We sort by date descendant, so find the first one that is unread and critical/system
    const critical = notifications.find(n => !n.is_read && (n.type === 'CRITICAL' || n.category === 'SYSTEM'));
    setActiveAlert(critical || null);
  }, [notifications, unreadCount]);

  if (!activeAlert) return null;

  const handleDismiss = () => {
    // Mark as read in hook (optimistic + backend + local storage)
    markAsRead(activeAlert.id);
    setActiveAlert(null);
  };

  const bgColors = {
    'CRITICAL': 'bg-red-600',
    'WARNING': 'bg-amber-500',
    'INFO': 'bg-blue-600',
    'SUCCESS': 'bg-emerald-600'
  };

  const icons = {
    'CRITICAL': AlertCircle,
    'WARNING': AlertTriangle,
    'INFO': Info,
    'SUCCESS': CheckCircle2
  };

  const Icon = icons[activeAlert.type as keyof typeof icons] || Info;
  const bgColor = bgColors[activeAlert.type as keyof typeof bgColors] || 'bg-slate-800';

  return (
    <div className={`${bgColor} text-white px-4 py-3 relative z-50 shadow-md animate-in slide-in-from-top-full duration-300`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="shrink-0" size={20} />
          <p className="font-bold text-sm md:text-base">
            <span className="uppercase tracking-wider opacity-90 mr-2">{activeAlert.title}:</span>
            <span className="font-medium opacity-90">{activeAlert.message}</span>
          </p>
        </div>
        <button 
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

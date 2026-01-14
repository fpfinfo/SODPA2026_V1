import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Visual styles per toast type
const TOAST_STYLES: Record<ToastType, { bg: string; border: string; iconColor: string; Icon: any }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconColor: 'text-emerald-600', Icon: CheckCircle2 },
  error: { bg: 'bg-red-50', border: 'border-red-200', iconColor: 'text-red-600', Icon: XCircle },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', iconColor: 'text-amber-600', Icon: AlertTriangle },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', iconColor: 'text-blue-600', Icon: Info },
};

// Toast Component
const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const style = TOAST_STYLES[toast.type];
  const Icon = style.Icon;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <div 
      className={`${style.bg} ${style.border} border rounded-2xl p-4 shadow-xl min-w-[320px] max-w-[420px] animate-in slide-in-from-right-5 duration-300 flex items-start gap-3`}
      role="alert"
    >
      <div className={`p-2 rounded-xl ${style.bg} ${style.iconColor}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-800">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{toast.message}</p>
        )}
      </div>
      <button 
        onClick={onDismiss}
        className="p-1 hover:bg-white/50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Toast Provider Component
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      
      {/* Toast Container - Fixed position top-right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem 
              toast={toast} 
              onDismiss={() => dismissToast(toast.id)} 
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// useToast Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Helper functions for common toast patterns
export const toastHelpers = {
  success: (showToast: ToastContextType['showToast'], title: string, message?: string) => 
    showToast({ type: 'success', title, message }),
  error: (showToast: ToastContextType['showToast'], title: string, message?: string) => 
    showToast({ type: 'error', title, message }),
  warning: (showToast: ToastContextType['showToast'], title: string, message?: string) => 
    showToast({ type: 'warning', title, message }),
  info: (showToast: ToastContextType['showToast'], title: string, message?: string) => 
    showToast({ type: 'info', title, message }),
};

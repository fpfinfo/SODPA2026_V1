import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Info, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from './ToastProvider';

export const AlertBanner: React.FC = () => {
  const { notifications, markAsRead, unreadCount, refresh } = useNotifications();
  const { showToast } = useToast();
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

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

  // NOVA FEATURE: Ação direta do banner (ex: confirmar recebimento de recurso)
  const handleAction = async () => {
    if (!activeAlert.link_action) return;
    
    // Se é uma ação de confirmação de recurso, processar diretamente
    if (activeAlert.link_action.includes('action=confirm')) {
      setIsProcessingAction(true);
      
      try {
        // Extrair ID do processo da URL
        const urlParams = new URLSearchParams(activeAlert.link_action.split('?')[1]);
        const processId = urlParams.get('id');
        
        if (processId) {
          // 1. Atualizar status do processo
          const { error: updateError } = await supabase
            .from('solicitacoes')
            .update({
              status_workflow: 'ACCOUNTABILITY_OPEN',
              status: 'EXECUÇÃO INICIADA',
              data_credito: new Date().toISOString() // Usar campo existente
            })
            .eq('id', processId);

          if (updateError) throw updateError;

          // 2. Registrar na tramitação
          await supabase.from('historico_tramitacao').insert({
            solicitacao_id: processId,
            origem: 'SUPRIDO',
            destino: 'SUPRIDO',
            status_anterior: 'AWAITING_SUPRIDO_CONFIRMATION',
            status_novo: 'ACCOUNTABILITY_OPEN',
            observacao: 'Suprido confirmou o recebimento do recurso. Execução da despesa iniciada.',
            created_at: new Date().toISOString()
          });

          // 3. Marcar notificação como lida
          markAsRead(activeAlert.id);
          setActiveAlert(null);

          showToast({
            title: '🎉 Recurso confirmado!',
            message: 'Execução da despesa iniciada. Você pode começar a utilizar o suprimento.',
            type: 'success'
          });

          // Atualizar lista de notificações
          refresh();
        }
      } catch (error: any) {
        console.error('Erro ao confirmar recurso:', error);
        showToast({
          title: 'Erro ao confirmar',
          message: error.message || 'Tente novamente',
          type: 'error'
        });
      } finally {
        setIsProcessingAction(false);
      }
    } else {
      // Para outras ações, navegar para o link
      window.location.href = activeAlert.link_action;
    }
  };

  const bgColors = {
    'CRITICAL': 'bg-gradient-to-r from-red-600 to-red-700',
    'WARNING': 'bg-gradient-to-r from-amber-500 to-amber-600',
    'INFO': 'bg-gradient-to-r from-blue-600 to-blue-700',
    'SUCCESS': 'bg-gradient-to-r from-emerald-600 to-emerald-700'
  };

  const icons = {
    'CRITICAL': AlertCircle,
    'WARNING': AlertTriangle,
    'INFO': Info,
    'SUCCESS': CheckCircle2
  };

  const Icon = icons[activeAlert.type as keyof typeof icons] || Info;
  const bgColor = bgColors[activeAlert.type as keyof typeof bgColors] || 'bg-slate-800';
  const hasAction = !!activeAlert.link_action;

  return (
    <div className={`${bgColor} text-white px-4 py-3 relative z-50 shadow-lg animate-in slide-in-from-top-full duration-300`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="shrink-0 animate-pulse" size={20} />
          <p className="font-medium text-sm md:text-base truncate">
            <span className="font-black uppercase tracking-wider mr-2">{activeAlert.title}:</span>
            <span className="opacity-95">{activeAlert.message}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {hasAction && (
            <button
              onClick={handleAction}
              disabled={isProcessingAction}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-red-700 rounded-lg font-bold text-sm hover:bg-red-50 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {isProcessingAction ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  Confirmar Recebimento
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
          
          <button 
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            title="Dispensar"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

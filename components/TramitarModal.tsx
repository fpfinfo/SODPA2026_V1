import React, { useState } from 'react';
import { X, Send, ChevronDown, Loader2, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ui/ToastProvider';

interface TramitarModalProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
  processNup: string;
  currentStatus: string;
  currentModule: 'SUPRIDO' | 'GESTOR' | 'SOSFU' | 'SEFIN' | 'AJSEFIN' | 'SGP';
  onSuccess?: () => void;
}

// Define available destinations based on workflow
const WORKFLOW_DESTINATIONS: Record<string, { value: string; label: string; status: string }[]> = {
  'SUPRIDO': [
    { value: 'GESTOR', label: 'Gestor da Unidade (Atesto)', status: 'PENDENTE ATESTO' }
  ],
  'GESTOR': [
    { value: 'SOSFU', label: 'SOSFU - Análise Técnica', status: 'EM ANÁLISE SOSFU' },
    { value: 'SUPRIDO', label: 'Devolver ao Suprido (Correção)', status: 'DEVOLVIDO' }
  ],
  'SOSFU': [
    { value: 'SEFIN', label: 'SEFIN - Ordenador de Despesa', status: 'PENDENTE ASSINATURA' },
    { value: 'GESTOR', label: 'Devolver ao Gestor', status: 'DEVOLVIDO' },
    { value: 'AJSEFIN', label: 'AJSEFIN - Parecer Jurídico', status: 'AGUARDANDO PARECER' }
  ],
  'SEFIN': [
    { value: 'SOSFU', label: 'SOSFU - Empenho/Financeiro', status: 'APROVADO' },
    { value: 'SOSFU', label: 'Devolver à SOSFU (Correção)', status: 'DEVOLVIDO' }
  ],
  'AJSEFIN': [
    { value: 'SOSFU', label: 'Retornar à SOSFU', status: 'PARECER EMITIDO' }
  ],
  'SGP': [
    { value: 'SOSFU', label: 'Retornar à SOSFU', status: 'INCLUSÃO EM FOLHA REALIZADA' }
  ]
};

export const TramitarModal: React.FC<TramitarModalProps> = ({
  isOpen,
  onClose,
  processId,
  processNup,
  currentStatus,
  currentModule,
  onSuccess
}) => {
  const [selectedDestination, setSelectedDestination] = useState('');
  const [observacao, setObservacao] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  const destinations = WORKFLOW_DESTINATIONS[currentModule] || [];

  const handleTramitar = async () => {
    if (!selectedDestination) {
      showToast({ type: 'warning', title: 'Selecione o destino', message: 'Por favor, selecione o destino da tramitação.' });
      return;
    }

    // Business Rule: GESTOR must have CERTIDAO_ATESTO before sending to SOSFU
    // Exception: Auto-Atesto - When Gestor is the Suprido (owner of the request), atesto is dispensed
    if (currentModule === 'GESTOR' && selectedDestination === 'SOSFU') {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if current user is the suprido (auto-atesto case)
      const { data: solicitacao } = await supabase
        .from('solicitacoes')
        .select('user_id, suprido_id')
        .eq('id', processId)
        .limit(1)
        .maybeSingle();

      const isAutoAtesto = solicitacao?.user_id === user?.id || solicitacao?.suprido_id === user?.id;

      if (!isAutoAtesto) {
        // Only check for atesto document if NOT auto-atesto
        const { data: atestoDoc, error: atestoError } = await supabase
          .from('documentos')
          .select('id')
          .eq('solicitacao_id', processId)
          .in('tipo', ['CERTIDAO_ATESTO', 'CERTIDAO_ATESTO_PC', 'ATESTO', 'CERTIDAO'])
          .maybeSingle();

        if (atestoError) {
          console.error('Error checking atesto:', atestoError);
        }

        if (!atestoDoc) {
          showToast({ 
            type: 'error', 
            title: 'Atesto Obrigatório', 
            message: 'Você precisa gerar a Certidão de Atesto antes de encaminhar para a SOSFU.' 
          });
          return;
        }
      } else {
        console.log('✅ Auto-Atesto: Gestor é o próprio Suprido - atesto dispensado');
      }
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const selectedDest = destinations.find(d => d.value === selectedDestination);
      
      if (!selectedDest) throw new Error('Destino não encontrado');

      // Update solicitacao status
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({
          status: selectedDest.status,
          destino_atual: selectedDest.value,
          updated_at: new Date().toISOString()
        })
        .eq('id', processId);

      if (updateError) throw updateError;

      // Insert tramitacao history record
      const { error: histError } = await supabase
        .from('historico_tramitacao')
        .insert({
          solicitacao_id: processId,
          origem: currentModule,
          destino: selectedDest.value,
          status_anterior: currentStatus,
          status_novo: selectedDest.status,
          observacao: observacao || null,
          tramitado_por: user?.id,
          data_tramitacao: new Date().toISOString()
        });

      if (histError) {
        console.warn('Could not insert tramitacao history:', histError);
        // Continue anyway - history is optional
      }

      showToast({ type: 'success', title: 'Processo tramitado!', message: `Encaminhado para ${selectedDest.label}` });
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error tramitating process:', error);
      showToast({ type: 'error', title: 'Erro ao tramitar', message: (error as Error).message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-blue-600 text-white p-8 rounded-t-[32px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Send size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Tramitar Processo</h3>
                <p className="text-blue-200 text-xs font-medium mt-1">{processNup}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Current Status */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Atual</p>
            <p className="text-sm font-bold text-slate-700">{currentStatus}</p>
          </div>

          {/* Destination Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Encaminhar para *</label>
            <div className="relative">
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full p-4 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:ring-2 focus:ring-blue-200 outline-none"
              >
                <option value="">Selecione o destino...</option>
                {destinations.map(dest => (
                  <option key={dest.value + dest.status} value={dest.value}>{dest.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>

          {/* Observation */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observação (opcional)</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione uma nota sobre esta tramitação..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 resize-none h-24 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Após tramitar, o processo ficará disponível na caixa de entrada do destino selecionado e não poderá ser desfeito.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-slate-500 font-bold text-xs hover:bg-slate-50 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleTramitar}
            disabled={!selectedDestination || isProcessing}
            className="flex-1 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isProcessing ? (
              <><Loader2 size={16} className="animate-spin"/> Tramitando...</>
            ) : (
              <><Send size={16}/> Confirmar Tramitação</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TramitarModal;

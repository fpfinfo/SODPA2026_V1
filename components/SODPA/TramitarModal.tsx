// ============================================================================
// TramitarModal - Modal para tramitação de processos SODPA
// Implementa lógica de roteamento: SEFIN, SGP, ou Presidência
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  X,
  Send,
  CheckCircle,
  AlertCircle,
  Building2,
  Users,
  Crown,
  ArrowRight,
  FileText,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';

// Routing Rules:
// - Passagem (Estado): SODPA → SEFIN
// - Diária (Estado): SODPA → SGP
// - Diária/Passagem (Fora do Estado/Exterior): SODPA → PRESIDÊNCIA

interface TramitarModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    tipo: 'DIARIA' | 'PASSAGEM';
    tipo_destino: string; // ESTADO, PAIS, EXTERIOR
    solicitante_nome: string;
    destino: string;
    status: string;
  };
  onSuccess?: () => void;
}

interface RoutingOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const ROUTING_OPTIONS: Record<string, RoutingOption> = {
  SEFIN: {
    id: 'SEFIN',
    label: 'SEFIN',
    description: 'Secretaria de Finanças - Autorização de Passagens',
    icon: <Building2 size={24} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  SGP: {
    id: 'SGP',
    label: 'SGP',
    description: 'Secretaria de Gestão de Pessoas - Autorização de Diárias',
    icon: <Users size={24} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  PRESIDENCIA: {
    id: 'PRESIDENCIA',
    label: 'Presidência',
    description: 'Gabinete da Presidência - Viagens fora do Estado',
    icon: <Crown size={24} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
};

export function TramitarModal({
  isOpen,
  onClose,
  request,
  onSuccess
}: TramitarModalProps) {
  const { user } = useAuth();
  const [despachoConteudo, setDespachoConteudo] = useState('');
  const [tramitando, setTramitando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Determine automatic routing based on rules
  const autoDestino = useMemo(() => {
    // Out of state/abroad → always Presidency
    if (request.tipo_destino === 'PAIS' || request.tipo_destino === 'EXTERIOR') {
      return 'PRESIDENCIA';
    }
    
    // Within state
    if (request.tipo_destino === 'ESTADO') {
      // Passagem → SEFIN
      if (request.tipo === 'PASSAGEM') {
        return 'SEFIN';
      }
      // Diária → SGP
      if (request.tipo === 'DIARIA') {
        return 'SGP';
      }
    }
    
    // Fallback
    return 'SEFIN';
  }, [request.tipo, request.tipo_destino]);

  const destinoOption = ROUTING_OPTIONS[autoDestino];

  const getRoutingExplanation = () => {
    if (request.tipo_destino === 'PAIS' || request.tipo_destino === 'EXTERIOR') {
      return 'Viagens fora do Estado requerem autorização da Presidência.';
    }
    if (request.tipo === 'PASSAGEM') {
      return 'Passagens dentro do Estado são autorizadas pela SEFIN.';
    }
    return 'Diárias dentro do Estado são autorizadas pela SGP.';
  };

  const handleTramitar = async () => {
    if (!despachoConteudo.trim()) {
      setError('Por favor, preencha o despacho de encaminhamento.');
      return;
    }

    setTramitando(true);
    setError(null);

    try {
      // 1. Create despacho document
      const { error: docError } = await supabase
        .from('sodpa_documents')
        .insert({
          request_id: request.id,
          tipo: 'DESPACHO',
          titulo: `Despacho de Encaminhamento - ${destinoOption.label}`,
          conteudo: despachoConteudo,
          origem_modulo: 'SODPA',
          destino_modulo: autoDestino,
          created_by: user?.id,
          assinado: true,
          assinado_por: user?.id,
          data_assinatura: new Date().toISOString()
        });

      if (docError) throw docError;

      // 2. Get current historico
      const { data: currentRequest, error: fetchError } = await supabase
        .from('sodpa_requests')
        .select('historico_tramitacao')
        .eq('id', request.id)
        .single();

      if (fetchError) throw fetchError;

      const historico = currentRequest?.historico_tramitacao || [];
      
      // 3. Add new tramitação entry
      const novaTramitacao = {
        timestamp: new Date().toISOString(),
        de: 'SODPA',
        para: autoDestino,
        usuario_id: user?.id,
        acao: 'TRAMITADO',
        observacao: `Encaminhado para ${destinoOption.label}`
      };

      // 4. Update request
      const { error: updateError } = await supabase
        .from('sodpa_requests')
        .update({
          status: 'TRAMITADO',
          destino_atual: autoDestino,
          assigned_to_id: null, // Reset assignment for new module
          historico_tramitacao: [...historico, novaTramitacao],
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);

    } catch (err) {
      console.error('[TramitarModal] Error:', err);
      setError('Erro ao tramitar processo. Tente novamente.');
    } finally {
      setTramitando(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Tramitado com Sucesso!</h3>
          <p className="text-gray-500">
            O processo foi encaminhado para <strong>{destinoOption.label}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
              <Send className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tramitar Processo</h2>
              <p className="text-indigo-100 text-sm">{request.solicitante_nome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Routing Info */}
          <div className={`p-5 rounded-xl border-2 ${destinoOption.bgColor} border-${destinoOption.color.replace('text-', '')}/30`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${destinoOption.bgColor} ${destinoOption.color}`}>
                {destinoOption.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Destino:</span>
                  <ArrowRight size={14} className="text-gray-400" />
                  <span className={`font-bold text-lg ${destinoOption.color}`}>
                    {destinoOption.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{destinoOption.description}</p>
              </div>
            </div>
          </div>

          {/* Routing Explanation */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Roteamento Automático</p>
              <p className="text-sm text-blue-600 mt-1">{getRoutingExplanation()}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-blue-700">
                <span><strong>Tipo:</strong> {request.tipo}</span>
                <span><strong>Destino:</strong> {request.tipo_destino === 'ESTADO' ? 'No Estado' : request.tipo_destino === 'PAIS' ? 'Fora do Estado' : 'Exterior'}</span>
              </div>
            </div>
          </div>

          {/* Despacho */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText size={16} />
              Despacho de Encaminhamento *
            </label>
            <textarea
              value={despachoConteudo}
              onChange={(e) => setDespachoConteudo(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={`À ${destinoOption.label},\n\nEncaminho o presente processo para análise e providências.\n\nAtenciosamente,`}
            />
            <p className="mt-2 text-xs text-gray-500">
              Este despacho será anexado ao dossiê digital do processo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleTramitar}
            disabled={tramitando || !despachoConteudo.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
          >
            {tramitando ? (
              <>
                <RefreshIcon className="animate-spin" />
                Tramitando...
              </>
            ) : (
              <>
                <Send size={16} />
                Tramitar para {destinoOption.label}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple refresh icon for loading state
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={`h-4 w-4 ${className}`} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
      />
    </svg>
  );
}

export default TramitarModal;

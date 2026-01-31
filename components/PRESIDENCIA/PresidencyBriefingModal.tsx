import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Globe, Calendar, PenTool, FileText, Ban, Loader2 } from 'lucide-react';
import { Request } from '../../types';

interface PresidencyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request | null;
  onConfirm: (requestId: string) => void;
  onReject: (requestId: string, reason: string) => void;
}

const PresidencyBriefingModal: React.FC<PresidencyBriefingModalProps> = ({ 
  isOpen, onClose, request, onConfirm, onReject 
}) => {
  const [isSigning, setIsSigning] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen || !request) return null;

  const handleAuthorize = () => {
    setIsSigning(true);
    setTimeout(() => {
      onConfirm(request.id);
      setIsSigning(false);
      onClose();
    }, 1500);
  };

  const handleReject = () => {
    onReject(request.id, rejectReason);
    setIsRejecting(false);
    setRejectReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 bg-opacity-80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">
        
        {/* Executive Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6 flex justify-between items-center text-white border-b border-amber-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/50 shadow-lg shadow-amber-500/10">
              <Globe className="text-amber-400" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold tracking-wide">Deliberação da Presidência</h3>
              <p className="text-sm text-slate-400">Autorização de Deslocamento Interestadual</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content - Smart Briefing */}
        <div className="p-8 bg-gradient-to-b from-slate-50 to-white">
            
          {/* 1. The "Why" - Public Interest (Most Important) */}
          <div className="mb-8">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText size={14} /> Interesse Público & Justificativa
            </h4>
            <div className="bg-white border-l-4 border-amber-500 p-5 rounded-r-xl shadow-sm">
              <p className="text-lg font-serif text-slate-800 leading-relaxed italic">
                "{request.description}"
              </p>
              <p className="text-sm text-slate-500 mt-3">
                <span className="font-bold text-slate-700">{request.requesterName}</span>
                <span className="text-slate-400"> • </span>
                {request.requesterSector}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* 2. The Validation Checks (Trust Indicators) */}
            <div className="flex-1 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Validação Administrativa
              </h4>
              
              <div className="flex items-center gap-3 text-sm text-slate-700 bg-green-50/50 p-3 rounded-lg border border-green-100">
                <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                <span>Elegibilidade SGP (Férias/Licenças)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 bg-green-50/50 p-3 rounded-lg border border-green-100">
                <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                <span>Conformidade Técnica SODPA</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 bg-green-50/50 p-3 rounded-lg border border-green-100">
                <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                <span>Disponibilidade Orçamentária SEFIN</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 bg-green-50/50 p-3 rounded-lg border border-green-100">
                <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                <span>Parecer Jurídico AJSEFIN</span>
              </div>
            </div>

            {/* 3. The Cost & Logistics */}
            <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Resumo de Custos
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Destino</span>
                  <span className="font-bold text-slate-800">{request.destination}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Data da Viagem</span>
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={14} className="text-amber-500" />
                    {request.deadline ? new Date(request.deadline).toLocaleDateString('pt-BR') : 'N/D'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Tipo</span>
                  <span className="font-medium text-slate-700">{request.type}</span>
                </div>
              </div>
              
              <div className="pt-4 mt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Estimado</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(request.value || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Form */}
          {isRejecting && (
            <div className="mt-6 bg-red-50 p-5 rounded-xl border border-red-200 animate-fade-in">
              <label className="text-sm font-bold text-red-800 mb-2 block">Observações / Esclarecimentos Necessários</label>
              <textarea 
                className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm bg-white"
                rows={3}
                placeholder="Descreva os esclarecimentos necessários ou motivo da devolução..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setIsRejecting(false)} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-2">
                  Cancelar
                </button>
                <button 
                  onClick={handleReject} 
                  disabled={!rejectReason.trim()}
                  className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmar Devolução
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isRejecting && (
          <div className="bg-slate-100 px-8 py-6 border-t border-slate-200 flex justify-between items-center">
            <button 
              onClick={() => setIsRejecting(true)}
              className="text-slate-500 hover:text-red-600 font-bold text-sm flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Ban size={16} />
              Solicitar Esclarecimentos
            </button>
            
            <button 
              onClick={handleAuthorize}
              disabled={isSigning}
              className={`bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white text-base font-bold px-8 py-4 rounded-xl shadow-xl shadow-slate-300 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 ${isSigning ? 'opacity-80 cursor-wait' : ''}`}
            >
              {isSigning ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Autorizando via Token...
                </>
              ) : (
                <>
                  <ShieldCheck size={20} className="text-amber-400" />
                  Autorizar Deslocamento
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresidencyBriefingModal;

import React, { useState } from 'react';
import { X, CheckCircle, AlertOctagon, Calendar, User, CreditCard, Ban, Briefcase, FileSearch } from 'lucide-react';
import { SgpRequest } from './types';

interface SgpAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: SgpRequest | null;
  onConfirm: (requestId: string) => void;
  onReject: (requestId: string, reason: string) => void;
}

const SgpAnalysisModal: React.FC<SgpAnalysisModalProps> = ({ 
  isOpen, onClose, request, onConfirm, onReject
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen || !request) return null;

  const erpStatus = request.erpStatus || 'ACTIVE';
  const hasConflict = erpStatus === 'VACATION' || erpStatus === 'LEAVE';
  const hasBankError = erpStatus === 'BANK_ERROR';

  const handleConfirm = () => {
    onConfirm(request.id);
    onClose();
  };

  const handleReject = () => {
    onReject(request.id, rejectReason);
    setIsRejecting(false);
    setRejectReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-700 rounded-lg">
                    <FileSearch size={24} className="text-indigo-200" />
                </div>
                <div>
                    <h3 className="text-xl font-bold leading-none">Validação Funcional</h3>
                    <p className="text-xs text-indigo-300 mt-1">Análise de Elegibilidade e Dados Cadastrais</p>
                </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50">
            
            {/* 1. Servant Info Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-5">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 text-gray-400">
                    <User size={32} />
                </div>
                <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-800">{request.requesterName}</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Matrícula</span>
                            <p className="text-sm font-medium text-gray-700">{request.requesterMatricula || '550192-3'}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Cargo/Função</span>
                            <p className="text-sm font-medium text-gray-700">{request.category || 'Analista Judiciário'}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Lotação</span>
                            <p className="text-sm font-medium text-gray-700">{request.requesterSector}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Status ERP</span>
                            {erpStatus === 'ACTIVE' && <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">Ativo</span>}
                            {erpStatus === 'VACATION' && <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">Férias Programadas</span>}
                            {erpStatus === 'BANK_ERROR' && <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">Erro Bancário</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CONFLICT VALIDATOR (Timeline) */}
            <div className={`p-6 rounded-xl border-2 ${hasConflict ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h4 className={`text-sm font-bold uppercase flex items-center gap-2 ${hasConflict ? 'text-red-700' : 'text-gray-600'}`}>
                        <Calendar size={18} /> Linha do Tempo: Fev/2024
                    </h4>
                    {hasConflict && (
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                            <AlertOctagon size={12} /> CONFLITO DETECTADO
                        </span>
                    )}
                </div>

                {/* Visual Timeline */}
                <div className="relative pt-6 pb-2">
                    {/* Days Scale */}
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-2 uppercase border-b border-gray-200 pb-1">
                        {[...Array(20)].map((_, i) => (
                            <span key={i} className="w-5 text-center">{i + 5}</span>
                        ))}
                    </div>
                    
                    {/* Travel Bar */}
                    <div className="relative h-12 flex items-center mb-4">
                        <div className="w-24 text-xs font-bold text-blue-700 mr-2">Viagem</div>
                        <div className="flex-1 relative h-6 bg-gray-100 rounded-full overflow-hidden">
                             <div className="absolute top-0 bottom-0 left-[25%] w-[20%] bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                 Solicitado
                             </div>
                        </div>
                    </div>

                    {/* ERP Status Bar */}
                    <div className="relative h-12 flex items-center">
                        <div className={`w-24 text-xs font-bold mr-2 ${hasConflict ? 'text-red-700' : 'text-gray-500'}`}>
                            {erpStatus === 'VACATION' ? 'Férias' : 'Afastamentos'}
                        </div>
                        <div className="flex-1 relative h-6 bg-gray-100 rounded-full overflow-hidden">
                             {erpStatus === 'VACATION' ? (
                                <div className="absolute top-0 bottom-0 left-[35%] w-[65%] bg-red-400/80 rounded-l-full flex items-center pl-2 text-[10px] text-white font-bold border-l-2 border-red-600">
                                    <AlertOctagon size={10} className="mr-1" /> Férias Regulamentares
                                </div>
                             ) : (
                                <div className="absolute top-0 bottom-0 w-full flex items-center justify-center text-[10px] text-gray-400 italic">
                                    Nenhum afastamento registrado no período.
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Overlap Indicator */}
                    {hasConflict && (
                         <div className="absolute top-16 left-[35%] w-[10%] h-16 border-x-2 border-red-500 border-dashed bg-red-500/10 z-10 flex items-center justify-center">
                            <span className="bg-red-600 text-white text-[9px] font-bold px-1 rounded transform -rotate-90">Colisão</span>
                         </div>
                    )}
                </div>
            </div>

            {/* 3. Banking Data Check */}
            <div className={`p-5 rounded-xl border ${hasBankError ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                 <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${hasBankError ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-800">Dados Bancários</h4>
                            <p className="text-sm font-mono text-gray-600 mt-1">Banco do Brasil (001) | Ag: 3512-X | CC: 10928-1</p>
                        </div>
                    </div>
                    {hasBankError ? (
                        <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded border border-yellow-200 flex items-center gap-1">
                            <AlertOctagon size={12} /> CONTA INATIVA
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded border border-green-200 flex items-center gap-1">
                            <CheckCircle size={12} /> VALIDADO
                        </span>
                    )}
                 </div>
            </div>

            {/* Reject Form */}
            {isRejecting && (
                <div className="bg-red-50 p-5 rounded-xl border border-red-200 animate-fade-in">
                    <label className="text-sm font-bold text-red-800 mb-2 block">Justificativa da Recusa</label>
                    <textarea 
                        className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm bg-white"
                        rows={3}
                        placeholder="Descreva o motivo (ex: Colisão com férias, conta inválida)..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-3">
                         <button onClick={() => setIsRejecting(false)} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-2">Cancelar</button>
                         <button onClick={handleReject} className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded hover:bg-red-700">Confirmar Recusa</button>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        {!isRejecting && (
            <div className="p-6 border-t border-gray-200 bg-white flex justify-between items-center flex-shrink-0">
                <button 
                    onClick={() => setIsRejecting(true)}
                    className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                    <Ban size={18} />
                    Notificar Erro / Rejeitar
                </button>
                
                <button 
                    onClick={handleConfirm}
                    disabled={hasConflict || hasBankError}
                    title={hasConflict ? "Resolva o conflito antes de validar" : ""}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-3 rounded-lg shadow-lg shadow-indigo-200 flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    <Briefcase size={18} />
                    Validar e Registrar Afastamento
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default SgpAnalysisModal;

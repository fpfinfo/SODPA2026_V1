import React, { useState } from 'react';
import { X, CheckCircle, FileText, Ban, Landmark, Coins, TrendingDown, PenTool, AlertTriangle } from 'lucide-react';
import { SefinRequest } from './types';

interface SefinAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: SefinRequest | null;
  onConfirm: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const SefinAuthorizationModal: React.FC<SefinAuthorizationModalProps> = ({ 
  isOpen, onClose, request, onConfirm, onReject 
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen || !request) return null;

  // Mock Financial Data (derived from request value)
  const budgetSource = request.type === 'PASSAGEM' ? '33.90.33 - Passagens e Despesas c/ Locomoção' : '33.90.14 - Diárias - Pessoal Civil';
  const availableBalance = 1250000.00;
  const impactPercentage = ((request.value || 0) / availableBalance) * 100;

  const handleConfirm = () => {
    onConfirm(request.id);
    onClose();
  };

  const handleReject = () => {
    onReject(request.id);
    setIsRejecting(false);
    setRejectReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 bg-opacity-70 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header - Executive Style */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white flex-shrink-0 border-b border-slate-700">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/50">
                    <PenTool className="text-green-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold leading-none">Ordenação de Despesa</h3>
                    <p className="text-xs text-slate-400 mt-1">Autorização Financeira e Assinatura Digital</p>
                </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>

        {/* Content Split View */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT: Legal Context (The 'Minuta') */}
            <div className="w-1/2 bg-slate-50 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <FileText size={14} /> Minuta Jurídica (AJSEFIN)
                    </h4>
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-200 flex items-center gap-1">
                        <CheckCircle size={10} /> Validada
                    </span>
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="bg-white shadow-sm border border-gray-200 p-8 min-h-full">
                        <div className="mb-6 text-center border-b border-gray-100 pb-4">
                            <div className="w-12 h-12 mx-auto mb-2 bg-slate-100 rounded-full flex items-center justify-center">
                              <Landmark className="text-slate-600" size={24} />
                            </div>
                            <h2 className="font-serif font-bold text-gray-800">Tribunal de Justiça do Estado do Pará</h2>
                            <p className="font-serif text-sm text-gray-500">Assessoria Jurídica da Secretaria de Finanças</p>
                        </div>
                        <div className="font-serif text-sm text-gray-800 leading-relaxed whitespace-pre-wrap text-justify">
                            {request.legalOpinion || "Minuta de autorização não gerada. Favor retornar à AJSEFIN."}
                        </div>
                        <div className="mt-12 pt-4 border-t border-gray-800 w-1/2 mx-auto text-center">
                            <p className="font-serif font-bold text-gray-900 text-sm">{request.legalOpinionAuthor || 'Assessor Responsável'}</p>
                            <p className="font-serif text-xs text-gray-500">OAB/PA 00.000</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Financial Context (Budget & Action) */}
            <div className="w-1/2 bg-white flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Coins size={14} /> Impacto Orçamentário
                    </h4>
                    <span className="text-[10px] text-gray-400">Exercício 2024</span>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Budget Card */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Landmark size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Fonte de Recurso</p>
                                <p className="font-bold text-gray-800 text-sm">{budgetSource}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Saldo Disponível</span>
                                <span className="text-lg font-bold text-green-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(availableBalance)}
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-red-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1 bg-red-50 rounded-bl-lg">
                                    <TrendingDown size={12} className="text-red-500" />
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Valor do Processo</span>
                                <span className="text-lg font-bold text-red-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(request.value || 0)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${impactPercentage}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">{impactPercentage.toFixed(4)}% da dotação</span>
                        </div>
                    </div>

                    {/* Reject Form Toggle */}
                    {isRejecting ? (
                        <div className="bg-red-50 rounded-xl p-5 border border-red-100 animate-fade-in">
                            <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                                <Ban size={16} /> Motivo da Devolução
                            </h4>
                            <textarea 
                                className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 text-sm bg-white"
                                rows={4}
                                placeholder="Justifique a devolução para o setor jurídico..."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => setIsRejecting(false)} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-2">Cancelar</button>
                                <button onClick={handleReject} disabled={!rejectReason} className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50">Confirmar Devolução</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                             <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                                <CheckCircle size={16} />
                                <p>Certifico que a despesa está adequada aos fins institucionais e autorizo o pagamento.</p>
                             </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {!isRejecting && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                        <button 
                            onClick={() => setIsRejecting(true)}
                            className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Ban size={16} />
                            Devolver / Rejeitar
                        </button>

                        <button 
                            onClick={handleConfirm}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-6 py-3 rounded-lg shadow-lg shadow-green-200 flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95"
                        >
                            <PenTool size={18} />
                            Assinar Digitalmente
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SefinAuthorizationModal;

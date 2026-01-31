import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  DollarSign, 
  FileText,
  AlertCircle 
} from 'lucide-react';
import { formatCurrency } from '../../utils/budgetUtils';

interface SefinAnaliseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  processData: {
    nup: string;
    supridoNome: string;
  };
  financialData: {
    valorConcedido: number;
    totalGasto: number;
    totalGlosado: number;
    saldoDevolver: number;
  };
  hasGDR: boolean;
  hasAtesto: boolean;
}

export const SefinAnaliseModal: React.FC<SefinAnaliseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  processData,
  financialData,
  hasGDR,
  hasAtesto
}) => {
  const [checklist, setChecklist] = useState({
    gdrSaldo: false,
    dossieCompleto: false,
    naturezaDespesa: false,
    regularidadeFiscal: false
  });

  // Reset checklist when opening
  useEffect(() => {
    if (isOpen) {
      setChecklist({
        gdrSaldo: false,
        dossieCompleto: false,
        naturezaDespesa: false,
        regularidadeFiscal: false
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleItem = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  // Determine validation status for badge
  const isConciliado = financialData.saldoDevolver === 0 && financialData.totalGlosado === 0;
  const hasPendingDevolucao = financialData.saldoDevolver > 0 && !hasGDR;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Análise Técnica Conclusiva</h3>
              <p className="text-xs text-slate-500 font-medium">Confirmação final para Baixa no SIAFE</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* 1. Identificação e Status Financeiro */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Processo</p>
                  <p className="font-bold text-slate-700">{processData.nup}</p>
                  <p className="text-xs text-slate-500">{processData.supridoNome}</p>
                </div>
                {isConciliado && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded flex items-center gap-1">
                    <CheckSquare size={12} /> Conciliação Válida
                  </span>
                )}
                {hasPendingDevolucao && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded flex items-center gap-1">
                    <AlertTriangle size={12} /> Devolução Pendente
                  </span>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-[10px] uppercase font-black text-blue-400 tracking-wider mb-1">Valor Aprovado</p>
              <p className="text-2xl font-black text-blue-700">{formatCurrency(financialData.totalGasto)}</p>
            </div>

            <div className={`rounded-xl p-3 border ${financialData.saldoDevolver > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
              <p className={`text-[10px] uppercase font-black tracking-wider mb-1 ${financialData.saldoDevolver > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                Saldo a Devolver
              </p>
              <p className={`text-2xl font-black ${financialData.saldoDevolver > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                {formatCurrency(financialData.saldoDevolver)}
              </p>
            </div>
          </div>

          {/* 2. Checklist de Conformidade */}
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
              <CheckSquare size={14} /> Checklist de Conformidade Técnica
            </h4>
            
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-all group">
                <div 
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    checklist.gdrSaldo 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-300 text-transparent group-hover:border-blue-400'
                  }`}
                >
                  <CheckSquare size={12} fill="currentColor" />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={checklist.gdrSaldo}
                  onChange={() => toggleItem('gdrSaldo')}
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-colors ${checklist.gdrSaldo ? 'text-slate-800' : 'text-slate-600'}`}>
                    Regularidade de Saldos e GDR
                  </p>
                  <p className="text-xs text-slate-400">
                    Confirmo que os comprovantes de recolhimento (se houver saldo) são autênticos e foram verificados.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-all group">
                <div 
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    checklist.dossieCompleto 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-300 text-transparent group-hover:border-blue-400'
                  }`}
                >
                  <CheckSquare size={12} fill="currentColor" />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={checklist.dossieCompleto}
                  onChange={() => toggleItem('dossieCompleto')}
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-colors ${checklist.dossieCompleto ? 'text-slate-800' : 'text-slate-600'}`}>
                    Integridade do Dossiê ({hasAtesto ? 'Com Atesto' : 'Sem Atesto'})
                  </p>
                  <p className="text-xs text-slate-400">
                    Confirmo que a Certidão de Atesto do Gestor está presente ou foi devidamente justificada.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-all group">
                <div 
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    checklist.naturezaDespesa 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-300 text-transparent group-hover:border-blue-400'
                  }`}
                >
                  <CheckSquare size={12} fill="currentColor" />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={checklist.naturezaDespesa}
                  onChange={() => toggleItem('naturezaDespesa')}
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-colors ${checklist.naturezaDespesa ? 'text-slate-800' : 'text-slate-600'}`}>
                    Natureza da Despesa
                  </p>
                  <p className="text-xs text-slate-400">
                    Atesto que os itens adquiridos condizem estritamente com a finalidade do suprimento.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-all group">
                <div 
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    checklist.regularidadeFiscal 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-300 text-transparent group-hover:border-blue-400'
                  }`}
                >
                  <CheckSquare size={12} fill="currentColor" />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={checklist.regularidadeFiscal}
                  onChange={() => toggleItem('regularidadeFiscal')}
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-colors ${checklist.regularidadeFiscal ? 'text-slate-800' : 'text-slate-600'}`}>
                    Regularidade Fiscal
                  </p>
                  <p className="text-xs text-slate-400">
                    Validei a regularidade das Notas Fiscais e Recibos apresentados conforme a legislação.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Alert se houver glosas */}
          {financialData.totalGlosado > 0 && (
             <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-3">
               <AlertTriangle size={16} className="text-amber-600" />
               <p className="text-xs text-amber-700 font-medium">
                 Atenção: Há R$ {formatCurrency(financialData.totalGlosado)} em valores glosados nesta prestação.
               </p>
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={!allChecked}
            className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              allChecked 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck size={18} />
            Confirmar Aprovação e Baixa
          </button>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { 
  CheckCircle2, 
  Key, 
  CalendarDays, 
  FileCheck, 
  Zap, 
  Send, 
  Lock, 
  CreditCard 
} from 'lucide-react';
import { Process, ProcessType, ConcessionStatus, ProcessDocument, DocType } from '../../types';

interface InputState {
  ne: string;
  dl: string;
  ob: string;
  siafe_nl: string;
  siafe_date: string;
}

interface ExecutionWorkflowPanelProps {
  selectedProcess: Process;
  inputs: InputState;
  setInputs: React.Dispatch<React.SetStateAction<InputState>>;
  hasDoc: (type: DocType) => boolean;
  handleGenerateDoc: (type: DocType) => Promise<void>;
  handleTramitarSefin: () => Promise<void>;
  handleFinalizePayment: () => Promise<void>;
  handleSimulateSefinReturn: () => void;
  isReadyToTramit: boolean;
  isEditableStatus: boolean;
}

export const ExecutionWorkflowPanel: React.FC<ExecutionWorkflowPanelProps> = ({
  selectedProcess,
  inputs,
  setInputs,
  hasDoc,
  handleGenerateDoc,
  handleTramitarSefin,
  handleFinalizePayment,
  handleSimulateSefinReturn,
  isReadyToTramit,
  isEditableStatus
}) => {
  return (
    <div className="space-y-8">
      {/* Accountability Flow */}
      {selectedProcess.type === ProcessType.ACCOUNTABILITY ? (
        <div className="animate-in slide-in-from-bottom-4">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">A</div>
            Finalização de Prestação de Contas
          </h4>
          <div className="space-y-4">
            {/* SIAFE NL Input */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nota de Lançamento (NL) - SIAFE</label>
                  <div className="relative">
                    <Key size={14} className="absolute left-3 top-3 text-slate-400"/>
                    <input 
                      type="text" 
                      placeholder="Ex: 2026NL000999" 
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={inputs.siafe_nl}
                      onChange={e => setInputs({...inputs, siafe_nl: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data da Baixa no Sistema</label>
                  <div className="relative">
                    <CalendarDays size={14} className="absolute left-3 top-3 text-slate-400"/>
                    <input 
                      type="date" 
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={inputs.siafe_date}
                      onChange={e => setInputs({...inputs, siafe_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleGenerateDoc('PORTARIA_ACCOUNTABILITY')}
                disabled={!inputs.siafe_nl || !inputs.siafe_date || hasDoc('PORTARIA_ACCOUNTABILITY')}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileCheck size={18}/>
                {hasDoc('PORTARIA_ACCOUNTABILITY') ? 'Portaria de Regularidade Gerada' : 'Gerar Portaria de Regularidade'}
              </button>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                <Zap size={16}/>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900">Análise Sentinela Concluída</p>
                <p className="text-[10px] text-blue-700 mt-1 uppercase font-black tracking-tight">Status: REGULAR COM RESSALVA (AUTO)</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Initial Document Generation Phase */}
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</div>
            Instrução Processual
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {/* Certidão */}
            <div className="p-4 rounded-2xl border border-slate-200 flex flex-col justify-between h-32 bg-white">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-600">1. Certidão de Regularidade</span>
                {hasDoc('CERTIDAO_REGULARIDADE') && <CheckCircle2 size={16} className="text-emerald-500"/>}
              </div>
              <button 
                onClick={() => handleGenerateDoc('CERTIDAO_REGULARIDADE')}
                disabled={hasDoc('CERTIDAO_REGULARIDADE')}
                className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                {hasDoc('CERTIDAO_REGULARIDADE') ? 'Gerado' : 'Gerar Certidão'}
              </button>
            </div>

            {/* Portaria */}
            <div className="p-4 rounded-2xl border border-slate-200 flex flex-col justify-between h-32 bg-white">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-600">2. Portaria SF</span>
                {hasDoc('PORTARIA') && <CheckCircle2 size={16} className="text-emerald-500"/>}
              </div>
              <button 
                onClick={() => handleGenerateDoc('PORTARIA')}
                disabled={hasDoc('PORTARIA')}
                className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                {hasDoc('PORTARIA') ? 'Gerado' : 'Minutar Portaria'}
              </button>
            </div>

            {/* Nota de Empenho - Requires Input */}
            <div className="col-span-2 p-4 rounded-2xl border border-blue-100 bg-blue-50/50 flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">3. Número da NE (SIAFE)</label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                  <input 
                    type="text" 
                    placeholder="Ex: 2026NE000123" 
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                    value={inputs.ne}
                    onChange={e => setInputs({...inputs, ne: e.target.value})}
                    disabled={hasDoc('NOTA_EMPENHO')}
                  />
                </div>
              </div>
              <button 
                onClick={() => handleGenerateDoc('NOTA_EMPENHO')}
                disabled={!inputs.ne || hasDoc('NOTA_EMPENHO')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {hasDoc('NOTA_EMPENHO') ? 'Emitida' : 'Emitir NE'}
              </button>
            </div>
          </div>

          {/* Send to SEFIN Action */}
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleTramitarSefin}
              disabled={!isReadyToTramit || !isEditableStatus}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all ${
                !isReadyToTramit || !isEditableStatus
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
              title={!isReadyToTramit ? "Gere os 3 documentos obrigatórios acima para habilitar." : "Enviar para SEFIN"}
            >
              <Send size={16}/> Tramitar para SEFIN (Assinatura Lote)
            </button>
          </div>
        </>
      )}

      {/* Wait State for SEFIN */}
      {selectedProcess.status === ConcessionStatus.AWAITING_SIGNATURE && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-amber-600"/>
            <div>
              <h4 className="text-sm font-black text-amber-800 uppercase">Aguardando Assinatura</h4>
              <p className="text-xs text-amber-700">Processo em posse do Ordenador de Despesa (SEFIN).</p>
            </div>
          </div>
          {/* Dev Button to Force Return */}
          <button onClick={handleSimulateSefinReturn} className="text-[10px] underline text-amber-600 hover:text-amber-800 font-bold">
            [DEV: Simular Retorno]
          </button>
        </div>
      )}

      {/* Workflow Phase 2: Payment Execution */}
      {selectedProcess.status === ConcessionStatus.FINANCE && (
        <div className="animate-in slide-in-from-bottom-4">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2 mt-8 border-t border-slate-200 pt-8">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">2</div>
            Execução Financeira (Pagamento)
          </h4>
          <div className="space-y-4">
            {/* DL Input */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">4. Documento de Liquidação (DL)</label>
                <input 
                  type="text" 
                  placeholder="Ex: 2026NL000055" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={inputs.dl}
                  onChange={e => setInputs({...inputs, dl: e.target.value})}
                  disabled={hasDoc('LIQUIDACAO')}
                />
              </div>
              <button 
                onClick={() => handleGenerateDoc('LIQUIDACAO')}
                disabled={!inputs.dl || hasDoc('LIQUIDACAO')}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 mt-4"
              >
                Emitir DL
              </button>
            </div>

            {/* OB Input */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">5. Ordem Bancária (OB)</label>
                <input 
                  type="text" 
                  placeholder="Ex: 2026OB000089" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={inputs.ob}
                  onChange={e => setInputs({...inputs, ob: e.target.value})}
                  disabled={hasDoc('ORDEM_BANCARIA')}
                />
              </div>
              <button 
                onClick={() => handleGenerateDoc('ORDEM_BANCARIA')}
                disabled={!inputs.ob || hasDoc('ORDEM_BANCARIA')}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 mt-4"
              >
                Emitir OB
              </button>
            </div>

            {/* Finalize */}
            <button 
              onClick={handleFinalizePayment}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black shadow-xl transition-all flex items-center justify-center gap-2 mt-6"
            >
              <CreditCard size={18}/> Concluir Pagamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

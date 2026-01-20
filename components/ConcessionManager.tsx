import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Process, ProcessType, ConcessionStatus, ProcessDocument, DocType } from '../types';
import { DocumentPreviewModal } from './ConcessionManager/DocumentPreviewModal';
import { ProcessListPanel } from './ConcessionManager/ProcessListPanel';
import { BudgetCheckerPanel } from './ConcessionManager/BudgetCheckerPanel';
import { ExecutionWorkflowPanel } from './ConcessionManager/ExecutionWorkflowPanel';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  ArrowRight, 
  Briefcase,
  Zap,
  ChevronRight,
  TrendingUp,
  Ban,
  FileSignature,
  Building2,
  CalendarDays,
  FileCheck,
  Printer,
  Eye,
  Key,
  Landmark,
  Send,
  Loader2,
  X,
  CreditCard,
  Lock,
  Unlock
} from 'lucide-react';

interface ConcessionManagerProps {
  processes: Process[];
  onUpdateStatus: (processId: string, newStatus: string) => void;
  onUpdateExecutionNumbers: (processId: string, numbers: { ne_numero?: string; dl_numero?: string; ob_numero?: string }) => Promise<void>;
  onTramitToSefin: (processId: string) => Promise<void>;
  onCompleteExecution: (processId: string) => Promise<void>;
  refresh: () => void;
  budgetCap?: number; // Mocked Total Budget
}

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

export const ConcessionManager: React.FC<ConcessionManagerProps> = ({ 
    processes, 
    onUpdateStatus, 
    onUpdateExecutionNumbers,
    onTramitToSefin,
    onCompleteExecution,
    refresh,
    budgetCap = 500000 
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'DOCS'>('ANALYSIS');

  // Input States for Finance
  const [inputs, setInputs] = useState({
      ne: '',
      dl: '',
      ob: '',
      siafe_nl: '',
      siafe_date: ''
  });

  const [previewDoc, setPreviewDoc] = useState<ProcessDocument | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter processes for Concession only
  const concessionProcesses = useMemo(() => {
    return processes.filter(p => 
      (p.type === ProcessType.CONCESSION || p.type === ProcessType.ACCOUNTABILITY) &&
      (statusFilter === 'ALL' || p.status === statusFilter) &&
      (p.protocolNumber.toLowerCase().includes(filterText.toLowerCase()) || 
       p.interestedParty?.toLowerCase().includes(filterText.toLowerCase()))
    );
  }, [processes, filterText, statusFilter]);

  const selectedProcess = useMemo(() => 
    concessionProcesses.find(p => p.id === selectedId) || concessionProcesses[0] || null
  , [concessionProcesses, selectedId]);

  // Calculate Budget Impact
  const budgetUsed = 320000; 
  const percentUsed = (budgetUsed / budgetCap) * 100;
  const currentImpact = selectedProcess ? selectedProcess.value : 0;
  const percentImpact = (currentImpact / budgetCap) * 100;

  // --- Actions ---


  const handleGenerateDoc = async (type: DocType) => {
      if (!selectedProcess) return;

      // Validation
      if (type === 'NOTA_EMPENHO' && !inputs.ne) { alert('Informe o número da Nota de Empenho.'); return; }
      if (type === 'LIQUIDACAO' && !inputs.dl) { alert('Informe o número do Documento de Liquidação.'); return; }
      if (type === 'ORDEM_BANCARIA' && !inputs.ob) { alert('Informe o número da Ordem Bancária.'); return; }
      if (type === 'PORTARIA_ACCOUNTABILITY' && (!inputs.siafe_nl || !inputs.siafe_date)) { 
          alert('Informe a Nota de Lançamento (NL) e a Data da Baixa no SIAFE.'); return; 
      }

      try {
          // Persistence in DB
          if (type === 'NOTA_EMPENHO') await onUpdateExecutionNumbers(selectedProcess.id, { ne_numero: inputs.ne });
          if (type === 'LIQUIDACAO') await onUpdateExecutionNumbers(selectedProcess.id, { dl_numero: inputs.dl });
          if (type === 'ORDEM_BANCARIA') await onUpdateExecutionNumbers(selectedProcess.id, { ob_numero: inputs.ob });

          const newDoc: ProcessDocument = {
              id: `DOC-${Date.now()}`,
              type,
              title: getDocTitle(type),
              generatedAt: new Date().toISOString(),
              metadata: {
                  neNumber: type === 'NOTA_EMPENHO' ? inputs.ne : undefined,
                  dlNumber: type === 'LIQUIDACAO' ? inputs.dl : undefined,
                  obNumber: type === 'ORDEM_BANCARIA' ? inputs.ob : undefined,
                  siafeNl: type === 'PORTARIA_ACCOUNTABILITY' ? inputs.siafe_nl : undefined,
                  siafeDate: type === 'PORTARIA_ACCOUNTABILITY' ? inputs.siafe_date : undefined,
              }
          };

          // In production, we would also insert this into the 'documentos' table
          // For now, updating numbers is the priority persistence
          setPreviewDoc(newDoc);
          refresh();
      } catch (err) {
          alert('Erro ao persistir documento: ' + (err as Error).message);
      }
  };

  const getDocTitle = (type: DocType) => {
      switch(type) {
          case 'PORTARIA': return 'Portaria de Autorização';
          case 'CERTIDAO_REGULARIDADE': return 'Certidão de Regularidade';
          case 'NOTA_EMPENHO': return 'Nota de Empenho (NE)';
          case 'LIQUIDACAO': return 'Documento de Liquidação (DL)';
          case 'ORDEM_BANCARIA': return 'Ordem Bancária (OB)';
          case 'PORTARIA_ACCOUNTABILITY': return 'Portaria de Regularidade de PC';
          default: return 'Documento';
      }
  };

  const hasDoc = (type: DocType) => selectedProcess?.generatedDocuments?.some(d => d.type === type);

  const handleTramitarSefin = async () => {
      if (!selectedProcess) return;
      
      // Verificar documentos na tabela execution_documents
      const { data: execDocs, error: fetchError } = await supabase
        .from('execution_documents')
        .select('tipo, status')
        .eq('solicitacao_id', selectedProcess.id);

      if (fetchError) {
        alert('Erro ao verificar documentos: ' + fetchError.message);
        return;
      }

      const hasPortaria = execDocs?.some(d => d.tipo === 'PORTARIA');
      const hasCertidao = execDocs?.some(d => d.tipo === 'CERTIDAO_REGULARIDADE');
      const hasNE = execDocs?.some(d => d.tipo === 'NOTA_EMPENHO');

      if (!hasPortaria || !hasCertidao || !hasNE) {
          alert('Gere a Portaria, a Certidão e a NE antes de tramitar.');
          return;
      }
      
      try {
          // 1. Criar tramitação com status_novo
          const { error: tramitError } = await supabase
            .from('historico_tramitacao')
            .insert({
              solicitacao_id: selectedProcess.id,
              origem: 'SOSFU',
              destino: 'SEFIN',
              status_anterior: 'EM ANÁLISE SOSFU',
              status_novo: 'AGUARDANDO ASSINATURA SEFIN',
              observacao: 'Documentos enviados para assinatura em lote (Portaria, Certidão, NE)',
              created_at: new Date().toISOString()
            });

          if (tramitError) {
            console.error('Erro na tramitação:', tramitError);
            throw tramitError;
          }

          // 2. Atualizar status da solicitação
          await supabase
            .from('solicitacoes')
            .update({
              status: 'AGUARDANDO ASSINATURA SEFIN',
              destino_atual: 'SEFIN',
              execution_status: 'AGUARDANDO_ASSINATURA_SEFIN',
              sefin_sent_at: new Date().toISOString()
            })
            .eq('id', selectedProcess.id);

          // 3. ESSENCIAL: Criar tasks na tabela sefin_tasks com documento_id!
          // Buscar IDs dos documentos de execution_documents
          const { data: execDocsWithIds } = await supabase
            .from('execution_documents')
            .select('id, tipo')
            .eq('solicitacao_id', selectedProcess.id)
            .in('tipo', ['PORTARIA', 'CERTIDAO_REGULARIDADE', 'NOTA_EMPENHO']);

          const portariaDoc = execDocsWithIds?.find(d => d.tipo === 'PORTARIA');
          const certidaoDoc = execDocsWithIds?.find(d => d.tipo === 'CERTIDAO_REGULARIDADE');
          const neDoc = execDocsWithIds?.find(d => d.tipo === 'NOTA_EMPENHO');

          // 3a. Task para Portaria
          await supabase
            .from('sefin_tasks')
            .insert({
              solicitacao_id: selectedProcess.id,
              documento_id: portariaDoc?.id || null,
              tipo: 'PORTARIA',
              titulo: `Portaria de Concessão - ${selectedProcess.interestedParty}`,
              origem: 'SOSFU',
              valor: selectedProcess.value,
              status: 'PENDING',
              created_at: new Date().toISOString()
            });

          // 3b. Task para Certidão
          await supabase
            .from('sefin_tasks')
            .insert({
              solicitacao_id: selectedProcess.id,
              documento_id: certidaoDoc?.id || null,
              tipo: 'CERTIDAO_REGULARIDADE',
              titulo: `Certidão de Regularidade - ${selectedProcess.interestedParty}`,
              origem: 'SOSFU',
              valor: selectedProcess.value,
              status: 'PENDING',
              created_at: new Date().toISOString()
            });

          // 3c. Task para Nota de Empenho
          await supabase
            .from('sefin_tasks')
            .insert({
              solicitacao_id: selectedProcess.id,
              documento_id: neDoc?.id || null,
              tipo: 'NOTA_EMPENHO',
              titulo: `Nota de Empenho - ${selectedProcess.protocolNumber}`,
              origem: 'SOSFU',
              valor: selectedProcess.value,
              status: 'PENDING',
              created_at: new Date().toISOString()
            });


          setSuccessMessage(`✅ Processo ${selectedProcess.protocolNumber} tramitado para SEFIN! O processo agora aguarda assinatura do Ordenador de Despesas.`);
          setTimeout(() => setSuccessMessage(null), 10000);
          refresh();
      } catch (err) {
          alert('Erro ao tramitar para SEFIN: ' + (err as Error).message);
      }
  };

  // Simulates Return from SEFIN
  const handleSimulateSefinReturn = async () => {
      if(confirm('Simular assinatura e retorno da SEFIN?')) {
          const { error } = await supabase.from('solicitacoes').update({ status: ConcessionStatus.FINANCE }).eq('id', selectedProcess!.id);
          if (error) alert('Erro ao simular: ' + error.message);
          else refresh();
      }
  };

  const handleFinalizePayment = async () => {
      if (!hasDoc('LIQUIDACAO') || !hasDoc('ORDEM_BANCARIA')) {
          alert('Gere a DL e a OB para concluir o pagamento.');
          return;
      }
      try {
          await onCompleteExecution(selectedProcess!.id);
          alert('Pagamento Concluído! O processo agora aguarda prestação de contas.');
          refresh();
      } catch (err) {
          alert('Erro ao concluir execução: ' + (err as Error).message);
      }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);


  // Logic to check if ready to tramit - docs must be generated
  const isReadyToTramit = hasDoc('PORTARIA') && hasDoc('CERTIDAO_REGULARIDADE') && hasDoc('NOTA_EMPENHO');
  // Editable if not already sent for signature, in finance phase, or already granted
  const isEditableStatus = selectedProcess?.status !== ConcessionStatus.AWAITING_SIGNATURE && 
                           selectedProcess?.status !== ConcessionStatus.FINANCE && 
                           selectedProcess?.status !== ConcessionStatus.COMPLETE;

  return (
    <div className="h-full flex flex-col bg-slate-50/50 overflow-hidden animate-in fade-in">
        {previewDoc && selectedProcess && (
            <DocumentPreviewModal
                doc={previewDoc}
                process={selectedProcess}
                onClose={() => setPreviewDoc(null)}
                formatMoney={formatMoney}
            />
        )}
        
        {/* Success Banner - shows after tramitation */}
        {successMessage && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
                <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-2xl">
                    <div className="p-2 bg-white/20 rounded-xl">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm">{successMessage}</p>
                        <p className="text-xs text-emerald-100 mt-1">Acesse o módulo SEFIN para visualizar na caixa de assinaturas.</p>
                    </div>
                    <button 
                        onClick={() => setSuccessMessage(null)} 
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        )}
        
        {/* Top KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6 px-6 pt-2">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={20}/></div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Solicitações</p>
                    <p className="text-2xl font-black text-slate-800">{concessionProcesses.length}</p>
                </div>
            </div>
            {/* ... Other KPIs same as before ... */}
            <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-lg flex items-center gap-4 col-span-2">
                <div className="p-3 bg-white/10 rounded-xl"><TrendingUp size={20}/></div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Orçamentário</p>
                    <p className="text-2xl font-black text-emerald-400">{formatMoney(budgetCap - budgetUsed)}</p>
                </div>
            </div>
        </div>

        {/* Main Workstation */}
        <div className="flex-1 flex overflow-hidden px-6 pb-6 gap-6">
            
            {/* Left: Process List */}
            <ProcessListPanel
                processes={concessionProcesses}
                selectedId={selectedId}
                onSelect={(id, p) => { setSelectedId(id); setInputs({ ne: p.neNumber || '', dl: p.dlNumber || '', ob: p.obNumber || '', siafe_nl: '', siafe_date: '' }); }}
                filterText={filterText}
                setFilterText={setFilterText}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                formatMoney={formatMoney}
            />

            {/* Right: Action Panel */}
            {selectedProcess ? (
                <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-slate-800">{selectedProcess.protocolNumber}</h2>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    selectedProcess.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                    {selectedProcess.priority === 'CRITICAL' ? 'Alta Prioridade' : 'Normal'}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-slate-500 mt-1">{selectedProcess.interestedParty}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setActiveTab('ANALYSIS')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'ANALYSIS' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>Análise</button>
                            <button onClick={() => setActiveTab('DOCS')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'DOCS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500'}`}>Documentos & Execução</button>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                        
                        {activeTab === 'ANALYSIS' && (
                            <div className="space-y-6">
                                {/* Budget Checker Visualization */}
                                <BudgetCheckerPanel 
                                    percentUsed={percentUsed}
                                    percentImpact={percentImpact}
                                    unitCategory={selectedProcess.unitCategory}
                                />

                                {/* Description */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14}/> Detalhes da Solicitação
                                    </h3>
                                    <div className="p-6 bg-white border border-slate-200 rounded-2xl text-sm text-slate-600 leading-relaxed shadow-sm">
                                        {selectedProcess.purpose || 'Descrição não informada pelo solicitante.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'DOCS' && (
                            <div className="space-y-8">
                                {/* Tree View of Documents */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase size={14}/> Árvore do Processo (Dossiê)</h3>
                                    <div className="space-y-2">
                                        {selectedProcess.generatedDocuments?.length ? (
                                            selectedProcess.generatedDocuments.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={16}/></div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700">{doc.title}</p>
                                                            <p className="text-[10px] text-slate-400">{new Date(doc.generatedAt).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {doc.metadata?.neNumber && <span className="text-[9px] font-mono bg-slate-100 px-2 py-1 rounded">NE: {doc.metadata.neNumber}</span>}
                                                        {doc.metadata?.dlNumber && <span className="text-[9px] font-mono bg-slate-100 px-2 py-1 rounded">DL: {doc.metadata.dlNumber}</span>}
                                                        <button onClick={() => setPreviewDoc(doc)} className="p-2 hover:bg-slate-50 rounded text-slate-400 hover:text-blue-600"><Eye size={16}/></button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : <p className="text-xs text-slate-400 italic pl-2">Nenhum documento gerado.</p>}
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 my-4"></div>

                                <ExecutionWorkflowPanel
                                    selectedProcess={selectedProcess}
                                    inputs={inputs}
                                    setInputs={setInputs}
                                    hasDoc={hasDoc}
                                    handleGenerateDoc={handleGenerateDoc}
                                    handleTramitarSefin={handleTramitarSefin}
                                    handleFinalizePayment={handleFinalizePayment}
                                    handleSimulateSefinReturn={handleSimulateSefinReturn}
                                    isReadyToTramit={isReadyToTramit}
                                    isEditableStatus={isEditableStatus}
                                />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-300">
                    <FileText size={64} strokeWidth={1} />
                    <p className="mt-4 font-bold text-sm uppercase tracking-widest">Selecione um processo para análise</p>
                </div>
            )}
        </div>
    </div>
  );
};

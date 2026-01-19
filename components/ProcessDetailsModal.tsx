import React, { useState, useEffect } from 'react';
import { Process, ProcessType, Role, AccountStatus } from '../types';
import { supabase } from '../lib/supabaseClient';
import { UniversalDossierPanel } from './ProcessDetails/UniversalDossierPanel';
import { DetailsTab } from './ProcessDetails/Tabs/DetailsTab';
import { ExecutionTab } from './ProcessDetails/Tabs/ExecutionTab';
import { useExecutionDocuments } from '../hooks/useExecutionDocuments';
import { ConformityChecklist } from './ConformityChecklist';
import { useProcessDetails } from '../hooks/useProcessDetails';
import { useOrcamentoSOSFU } from '../hooks/useOrcamentoSOSFU';
import { getBudgetLabel, shouldFetchFromSOSFU, getPTRESCategory } from '../utils/budgetUtils';
import { 
  X, 
  Calendar, 
  User, 
  DollarSign, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Gavel, 
  Calculator, 
  Stamp, 
  BadgeCheck, 
  FileSearch, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  FileCheck, 
  FileCode, 
  Eye, 
  FolderOpen,
  Receipt,
  Database, 
  Search, 
  History, 
  Loader2, 
  Lock, 
  Unlock,
  Wallet,
  TrendingUp,
  PieChart,
  Landmark,
  Scale,
  Send,
  Timer,
  Edit,
  Trash2
} from 'lucide-react';

interface ProcessDetailsModalProps {
  process: Process;
  onClose: () => void;
  initialTab?: 'DETAILS' | 'ANALYSIS' | 'DOSSIER';
  teamMembers?: { id: string; nome: string; avatar_url: string | null }[];
}

export const ProcessDetailsModal: React.FC<ProcessDetailsModalProps> = ({ process, onClose, initialTab = 'OVERVIEW', teamMembers = [] }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOSSIER' | 'EXECUTION' | 'ANALYSIS'>(initialTab);
  const [checklist, setChecklist] = useState({ regularidade: false, atestoGestor: process.status === 'PENDENTE SOSFU', orcamento: false, identificacao: true });
  const [showRegularityModal, setShowRegularityModal] = useState(false);
  const [checkStep, setCheckStep] = useState<'IDLE' | 'SCANNING' | 'RESULTS'>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [hasCertidaoAtesto, setHasCertidaoAtesto] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

  // Fetch enriched process data with servidores_tj details
  const { processData: enrichedProcessData, isLoading: isLoadingDetails } = useProcessDetails(process.id);

  // Fetch execution documents for checklist
  const { documents: executionDocuments } = useExecutionDocuments(process.id);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchCurrentUser();
  }, []);

  // Check for Certidão de Regularidade in dossier
  useEffect(() => {
    const checkCertidao = async () => {
      const { data } = await supabase
        .from('documentos')
        .select('id, tipo, created_at')
        .eq('solicitacao_id', process.id)
        .eq('tipo', 'CERTIDAO_REGULARIDADE')
        .maybeSingle();
      
      setHasCertidaoAtesto(!!data);
    };
    
    checkCertidao();
  }, [process.id]);

  // Fetch SOSFU budget if applicable
  const ptres = enrichedProcessData?.ptres;
  const { orcamento: orcamentoSOSFU } = useOrcamentoSOSFU(
    shouldFetchFromSOSFU(ptres) ? ptres : undefined
  );

  const assignedStaff = teamMembers.find(s => s.id === process.assignedToId);
  const isConcession = process.type === ProcessType.CONCESSION;
  const isTCE = process.type === ProcessType.SPECIAL_ACCOUNT;
  const slaDate = new Date(process.slaDeadline || process.createdAt);
  const isCritical = slaDate < new Date();
  const budgetStats = { unitName: 'Comarca de Mãe do Rio', unitCode: '03.01.05.02', annualLimit: 50000.00, executed: 32450.00, currentRequest: process.value };


  const handleToggleCheck = (key: keyof typeof checklist) => { if (key === 'regularidade' && !checklist.regularidade) { setShowRegularityModal(true); runRegularityScan(); } else { setChecklist(prev => ({ ...prev, [key]: !prev[key] })); } };
  const runRegularityScan = () => { setCheckStep('SCANNING'); setScanProgress(0); const interval = setInterval(() => { setScanProgress(prev => { if (prev >= 100) { clearInterval(interval); setCheckStep('RESULTS'); return 100; } return prev + 2; }); }, 30); };
  const confirmRegularity = () => { setChecklist(prev => ({ ...prev, regularidade: true })); setShowRegularityModal(false); };
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const isApproved = checklist.regularidade && checklist.atestoGestor && checklist.orcamento;

  const renderLegalDeadlineTimer = () => {
    if (!process.legalDeadline) return null;
    const deadline = new Date(process.legalDeadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isExpired = diffDays <= 0;
    return (
      <div className={`p-6 rounded-2xl border-2 flex items-center justify-between shadow-lg ${isExpired ? 'bg-emerald-50 border-emerald-500' : 'bg-amber-50 border-amber-500'}`}>
        <div className="flex items-center gap-4"><div className={`p-3 rounded-full ${isExpired ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>{isExpired ? <CheckCircle2 size={32}/> : <Timer size={32}/>}</div><div><h4 className={`text-sm font-black uppercase tracking-widest ${isExpired ? 'text-emerald-800' : 'text-amber-800'}`}>{isExpired ? 'Prazo Recursal Esgotado' : 'Aguardando Prazo Recursal'}</h4><p className={`text-xs font-medium ${isExpired ? 'text-emerald-700' : 'text-amber-700'}`}>{isExpired ? 'O processo está apto para trânsito em julgado e envio à SGP.' : `Faltam ${diffDays} dia(s) para o encerramento do prazo de defesa.`}</p></div></div>
        {!isExpired && (<div className="text-center bg-white px-4 py-2 rounded-xl border border-amber-200"><span className="block text-[10px] text-amber-500 font-bold uppercase">Restam</span><span className="text-2xl font-black text-amber-600">{diffDays}</span><span className="block text-[10px] text-amber-500 font-bold uppercase">Dias</span></div>)}
      </div>
    );
  };

  const renderRegularityModal = () => (
    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
      <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white"><div><h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShieldCheck className="text-emerald-600" /> Validação de Adimplência</h3><p className="text-xs text-slate-500 font-medium">Verificação automática de pendências no SISUP e SIAFE.</p></div><button onClick={() => setShowRegularityModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button></div>
      <div className="flex-1 p-10 flex flex-col items-center justify-center">
        {checkStep === 'SCANNING' && (<div className="text-center space-y-6 w-full max-w-md"><div className="relative pt-4"><div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-75" style={{ width: `${scanProgress}%` }}></div></div><div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest"><span>Progresso</span><span>{scanProgress}%</span></div></div><div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-3"><p className={`text-xs flex items-center gap-3 ${scanProgress > 10 ? 'text-slate-700 font-bold' : 'text-slate-300'}`}>{scanProgress > 10 ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Loader2 size={14} className="animate-spin"/>} Identificando Servidor</p><p className={`text-xs flex items-center gap-3 ${scanProgress > 50 ? 'text-slate-700 font-bold' : 'text-slate-300'}`}>{scanProgress > 50 ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Loader2 size={14} className="animate-spin"/>} Consultando SIAFE</p><p className={`text-xs flex items-center gap-3 ${scanProgress > 90 ? 'text-slate-700 font-bold' : 'text-slate-300'}`}>{scanProgress > 90 ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Loader2 size={14} className="animate-spin"/>} Validando Teto</p></div></div>)}
        {checkStep === 'RESULTS' && (<div className="w-full max-w-2xl animate-in slide-in-from-bottom-8 text-center"><div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-8 mb-8"><Unlock size={48} className="text-emerald-600 mx-auto mb-4" /><h2 className="text-2xl font-black text-emerald-800">Suprido Adimplente</h2><p className="text-sm text-emerald-700">Nenhuma pendência impeditiva encontrada.</p></div><div className="flex gap-4 justify-center"><button onClick={() => setShowRegularityModal(false)} className="px-6 py-3 text-slate-500 font-bold text-xs hover:bg-slate-50 rounded-xl">Cancelar</button><button onClick={confirmRegularity} className="px-8 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 shadow-xl flex items-center gap-2"><Stamp size={16} /> Emitir Certidão</button></div></div>)}
      </div>
    </div>
  );

  const renderFinancialImpact = () => {
    // Usar PTRES da solicitação (já definido no escopo do componente)
    const category = getPTRESCategory(ptres);
    
    // orcamentoSOSFU já foi buscado no nível do componente
    
    // Determinar dados do orçamento
    const budgetLabel = getBudgetLabel(ptres);
    const unitName = (category !== 'ESPECIFICO') 
      ? 'SOSFU - SEFIN' 
      : (enrichedProcessData?.unidade || budgetStats.unitName);
    
    const annualLimit = orcamentoSOSFU?.teto_anual || budgetStats.annualLimit;
    const executed = orcamentoSOSFU?.executado || budgetStats.executed;
    
    const executedPercent = (executed / annualLimit) * 100;
    const requestPercent = (budgetStats.currentRequest / annualLimit) * 100;
    const isOverBudget = executedPercent + requestPercent > 100;
    
    return (
      <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Landmark size={24}/>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                {budgetLabel}
              </h4>
              <p className="text-lg font-bold leading-tight">{unitName}</p>
              {ptres && (
                <p className="text-xs text-slate-400 mt-1">PTRES: {ptres}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Teto Anual</p>
            <p className="text-2xl font-black">{formatCurrency(annualLimit)}</p>
          </div>
        </div>
        <div className="relative z-10 mb-8">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            <span>Execução Atual</span>
            <span>{executedPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
            <div style={{ width: `${executedPercent}%` }} className="h-full bg-blue-600 transition-all duration-1000 relative group/bar">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
            </div>
            <div style={{ width: `${requestPercent}%` }} className={`h-full ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-1000 relative flex items-center justify-center`}>
              <div className="w-full h-full animate-pulse opacity-50 bg-white/20"></div>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <span className="text-[10px] text-slate-400">Consumido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
              <span className={`text-[10px] font-bold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                Impacto (+{formatCurrency(process.value)})
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800 relative z-10">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Disponível Antes</p>
            <p className="text-sm font-bold text-slate-300">{formatCurrency(annualLimit - executed)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Disponível Após</p>
            <p className={`text-xl font-black ${isOverBudget ? 'text-red-500' : 'text-emerald-400'}`}>
              {formatCurrency(annualLimit - executed - process.value)}
            </p>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 text-white opacity-[0.02] pointer-events-none"><PieChart size={250} /></div>
      </div>
    );
  };

  const getFooterActions = () => {
    // 1. Ação de Baixa de Responsabilidade (Pós-SGP)
    if (isTCE && process.status === AccountStatus.AVERBACAO_SGP) {
      return (
        <div className="flex gap-4 w-full justify-between items-center">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-2 rounded-lg text-xs font-bold"><CheckCircle2 size={16} className="text-emerald-600"/>Processo Averbado na SGP em {new Date().toLocaleDateString()}</div>
          <button className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all flex items-center gap-2 animate-in zoom-in" title="Finalizar o processo e limpar o débito" onClick={() => { alert('Responsabilidade baixada com sucesso! O suprido está regular.'); onClose(); }}><CheckCircle size={18} /> Baixar Responsabilidade</button>
        </div>
      );
    }
    // 2. Ações de Envio para SGP (Fase de Prazo Recursal)
    if (isTCE && process.status === AccountStatus.PRAZO_RECURSAL) {
      const isExpired = process.legalDeadline ? new Date(process.legalDeadline) < new Date() : false;
      return (
        <div className="flex gap-4 w-full justify-end">
          <button className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2" title="Anexar defesa apresentada pelo servidor"><FileText size={16}/> Registrar Recurso</button>
          <button disabled={!isExpired} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 ${isExpired ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'}`} title={!isExpired ? 'Bloqueado: Aguarde o fim do prazo recursal' : 'Enviar para desconto em folha'}>{isExpired ? <Send size={18} /> : <Lock size={18} />} {isExpired ? 'Certificar e Enviar SGP' : 'Aguardando Prazo'}</button>
        </div>
      );
    }
    // 3. Ações Padrão (Concessão/Prestação) - REMOVIDO
    // Botão agora está APENAS na ExecutionTab
    return null;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {showRegularityModal && renderRegularityModal()}
        <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-20">
          <div className="flex items-center gap-6"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isTCE ? 'bg-red-50 text-red-600' : isConcession ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{isTCE ? <Scale size={28}/> : <FileSearch size={28} />}</div><div><div className="flex items-center gap-3"><h2 className="text-2xl font-black tracking-tight text-slate-900">{process.protocolNumber}</h2><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isTCE ? 'bg-red-100 text-red-700' : isConcession ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{isTCE ? 'Tomada de Contas' : isConcession ? 'Concessão' : 'Prestação'}</span></div><p className="text-slate-500 text-xs font-bold tracking-wide mt-1 uppercase">{process.interestedParty} • R$ {process.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div></div>
          <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-500"><X size={20} /></button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 px-10">
          {[
            { id: 'OVERVIEW', label: 'Visão Geral', icon: Eye }, 
            { id: 'DOSSIER', label: 'Dossiê Digital', icon: FolderOpen },
            { id: 'EXECUTION', label: 'Execução da Despesa', icon: Receipt },
            { id: 'ANALYSIS', label: 'Análise Técnica', icon: ShieldCheck }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`py-4 px-6 text-xs font-bold uppercase tracking-widest flex items-center gap-2 border-b-4 transition-all ${activeTab === tab.id ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-sm -mb-[2px]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <tab.icon size={16}/> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
          {activeTab === 'OVERVIEW' && (
            <div className="flex flex-col gap-8 animate-in fade-in">
              {/* Detailed 4-Card View */}
              <div className="-mx-8 -mt-8">
                <DetailsTab process={enrichedProcessData || {
                  id: process.id,
                  nup: process.protocolNumber,
                  tipo: process.type,
                  status: (process.destino_atual?.includes('SOSFU') && process.status === 'Pendente Atesto') ? 'em_analise_sosfu' : process.status,
                  valor_solicitado: process.value,
                  valor_total: process.value,
                  urgencia: process.priority,
                  user_id: process.supridoId,
                  suprido_nome: process.interestedParty,
                  created_at: process.createdAt,
                  descricao: process.purpose,
                  dados_bancarios: process.bankData,
                  items: process.items,
                  gestor: process.manager,
                }} />
              </div>

              {/* SOSFU Specific Analysis & Tramitation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-2 pb-10">
                <div className="space-y-8">
                  {isTCE && renderLegalDeadlineTimer()}
                  
                  {/* Analysis Box */}
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-all group" onClick={() => setActiveTab('ANALYSIS')}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                        <Calculator size={24}/>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Pré-Análise Orçamentária</p>
                        <p className="text-xs text-slate-500">Clique para ver detalhes do impacto</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-bold uppercase">Impacto</p>
                      <p className="text-lg font-black text-blue-600">{((process.value / 50000) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tramitação</h4>
                  <div className="space-y-4 pl-4 border-l-2 border-slate-100">
                    <div className="relative pb-6">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-200"></div>
                      <p className="text-sm font-bold text-slate-800">Análise SOSFU</p>
                      <p className="text-xs text-slate-500">Em andamento por {assignedStaff?.nome || '...'}</p>
                    </div>
                    <div className="relative pb-6 opacity-50">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300"></div>
                      <p className="text-sm font-bold text-slate-800">Atesto do Gestor</p>
                      <p className="text-xs text-slate-500">Concluído em {new Date(process.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'EXECUTION' && (
            <div className="animate-in fade-in">
              <ExecutionTab 
                processData={process}
                enrichedProcessData={enrichedProcessData}
              />
            </div>
          )}
          {activeTab === 'ANALYSIS' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 p-8 animate-in slide-in-from-right-4">
              <div>
                <ConformityChecklist 
                  processData={{
                    // Use the same mapping as the OVERVIEW tab (see lines 288-303)
                    nome: enrichedProcessData?.suprido_nome || process.interestedParty || process.providerName || '',
                    cpf: enrichedProcessData?.servidor_dados?.cpf || process.providerCpf || '',
                    // Map bank details - enrichedProcessData uses dados_bancarios, process uses bankData
                    banco: enrichedProcessData?.dados_bancarios?.bankName || process.bankData?.bankName || '',
                    agencia: enrichedProcessData?.dados_bancarios?.agency || process.bankData?.agency || '',
                    conta_corrente: enrichedProcessData?.dados_bancarios?.account || process.bankData?.account || '',
                    // Map value - both use valor_total/value
                    valor_solicitado: enrichedProcessData?.valor_total || process.value || 0,
                    // Map description - enrichedProcessData has descricao, process has purpose
                    descricao: enrichedProcessData?.descricao || process.purpose || '',
                    status: process.status,
                    has_certidao_regularidade: hasCertidaoAtesto
                  }}
                  executionDocuments={executionDocuments}
                  ptresCode={enrichedProcessData?.ptres}
                />
              </div>
              <div className="space-y-8">{renderFinancialImpact()}<div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Parecer do Analista</h4><textarea className="w-full h-32 bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Insira observações técnicas ou ressalvas aqui..."></textarea></div></div>
            </div>
          )}
          {activeTab === 'DOSSIER' && (
            <div className="pt-4 animate-in fade-in">
              <UniversalDossierPanel 
                processId={process.id}
                currentUserId={currentUserId}
                processData={{
                  id: process.id,
                  nup: process.protocolNumber,
                  type: process.type,
                  valor_total: process.value,
                  descricao: process.purpose,
                  suprido_nome: process.interestedParty,
                  created_at: process.createdAt,
                  lotacao: (enrichedProcessData as any)?.lotacao,
                  itens_despesa: process.items?.map((item: any) => ({
                    codigo: item.element || 'N/A',
                    descricao: item.desc || item.description || 'Despesa',
                    quantidade: item.qty || item.quantity || 1,
                    valor_unitario: item.val || item.value || 0,
                    valor_total: item.val || item.value || 0
                  })) || []
                }}
              />
            </div>
          )}
        </div>

        <div className="bg-white px-10 py-6 border-t border-slate-200 flex justify-between items-center z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"><div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Clock size={16}/> SLA: {slaDate.toLocaleDateString()}</div>{getFooterActions()}</div>
      </div>
    </div>
  );
};
import React from 'react';
import { 
  PlusCircle, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  Bell, 
  RefreshCw, 
  Search, 
  History as HistoryIcon,
  Zap,
  Scale,
  Calendar,
  Edit,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  FileSearch as FileSearchIcon,
  AlertTriangle,
  Info
} from 'lucide-react';

interface SupridoHomeProps {
  kpiData: {
    saldoDisponivel: number;
    aPrestarContas: number;
    adiantamentosAtivos: number;
    diasRestantes: number;
    pendencias: number;
    statusGeral: string;
  };
  pendingConfirmations: any[];
  isConfirmingReceipt: boolean;
  onConfirmReceipt: (id: string) => void;
  onNewRequest: () => void;
  history: any[];
  historyFilter: string;
  setHistoryFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  onSelectProcess: (process: any) => void;
  onDraftEdit: (process: any) => void;
  onDraftDelete: (process: any) => void;
  onPrestacaoContas: (process: any) => void;
  isEditableProcess: (status: string) => boolean;
  isDeletableProcess: (status: string) => boolean;
}

export const SupridoHome: React.FC<SupridoHomeProps> = ({
  kpiData,
  pendingConfirmations,
  isConfirmingReceipt,
  onConfirmReceipt,
  onNewRequest,
  history,
  historyFilter,
  setHistoryFilter,
  statusFilter,
  setStatusFilter,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  onSelectProcess,
  onDraftEdit,
  onDraftDelete,
  onPrestacaoContas,
  isEditableProcess,
  isDeletableProcess
}) => {
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Pagination Logic
  const filteredHistory = history.filter((req: any) => {
    const matchesSearch = req.nup?.toLowerCase().includes(historyFilter.toLowerCase()) || 
                          req.object?.toLowerCase().includes(historyFilter.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const currentItems = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-10 max-w-[1400px] mx-auto space-y-16 animate-in fade-in pb-32">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Meu Painel de Suprido</h1>
           <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2 italic">
              <Info size={14} className="text-blue-500" /> Gerencie suas solicitações e acompanhe o fluxo processual.
           </p>
        </div>
        <div className="flex gap-4">
          <button onClick={onNewRequest} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[24px] text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95">
             <PlusCircle size={22} /> Nova Solicitação
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            label: 'SALDO DISPONÍVEL', 
            val: formatCurrency(kpiData.saldoDisponivel), 
            sub: `${kpiData.adiantamentosAtivos} ADIANTAMENTO${kpiData.adiantamentosAtivos !== 1 ? 'S' : ''} ATIVO${kpiData.adiantamentosAtivos !== 1 ? 'S' : ''}`, 
            icon: Wallet,
            theme: 'emerald',
            gradient: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50',
            text: 'text-emerald-900',
            subText: 'text-emerald-600/80',
            iconColor: 'text-emerald-600'
          },
          { 
            label: 'A PRESTAR CONTAS', 
            val: formatCurrency(kpiData.aPrestarContas), 
            sub: kpiData.diasRestantes > 0 ? `PRAZO: ${kpiData.diasRestantes} DIAS RESTANTES` : 'SEM PRESTAÇÕES PENDENTES', 
            icon: Clock,
            theme: 'amber',
            gradient: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-50',
            text: 'text-amber-900',
            subText: 'text-amber-600/80',
            iconColor: 'text-amber-600'
          },
          { 
            label: 'STATUS GERAL', 
            val: kpiData.statusGeral, 
            sub: kpiData.pendencias === 0 ? 'SEM PENDÊNCIAS IMPEDITIVAS' : `${kpiData.pendencias} SOLICITAÇÕES PENDENTES`, 
            icon: CheckCircle2, 
            theme: 'blue',
            gradient: 'from-blue-600 to-indigo-700',
            bg: 'bg-white', // Default minimalist for status
            text: 'text-slate-900',
            subText: 'text-slate-500',
            iconColor: 'text-blue-600',
            border: kpiData.pendencias === 0 
          },
        ].map((kpi, i) => (
          <div key={i} className={`relative overflow-hidden p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between h-48 group transition-all hover:shadow-2xl hover:-translate-y-1 ${kpi.theme === 'blue' ? 'bg-white' : kpi.bg}`}>
             {/* Gradient Accent for Colorful Cards */}
             {kpi.theme !== 'blue' && (
               <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${kpi.gradient} opacity-10 rounded-bl-[100px] pointer-events-none transition-opacity group-hover:opacity-20`}></div>
             )}

             <div className="flex justify-between items-start z-10">
                <div className={`p-3.5 rounded-2xl transition-all ${kpi.theme === 'blue' ? 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600' : 'bg-white/60 backdrop-blur-sm shadow-sm ' + kpi.iconColor}`}>
                   <kpi.icon size={26} strokeWidth={2} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${kpi.theme === 'blue' ? 'text-slate-400' : kpi.subText}`}>{kpi.label}</span>
             </div>
             
             <div className="z-10">
                <h3 className={`text-4xl font-black tracking-tighter leading-none mb-2 ${kpi.text}`}>{kpi.val}</h3>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide ${kpi.theme === 'blue' ? 'text-slate-400' : kpi.subText}`}>
                   {kpi.theme === 'amber' && <AlertTriangle size={12} className="animate-pulse" />}
                   {kpi.sub}
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* === CONFIRMATION PENDING BANNER === */}
      {pendingConfirmations.length > 0 && pendingConfirmations.map(process => (
        <div key={process.id} className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[32px] p-6 shadow-xl animate-in slide-in-from-top-2 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                <Bell size={28} className="text-white" />
              </div>
              <div className="text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-100">🔔 Confirmação Pendente</p>
                <h3 className="text-xl font-black">{process.nup}</h3>
                <p className="text-sm text-amber-100">
                  Valor creditado: <strong>{formatCurrency(process.valor_solicitado || 0)}</strong>
                  {process.data_credito && ` • Data: ${new Date(process.data_credito).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => onConfirmReceipt(process.id)}
              disabled={isConfirmingReceipt}
              className="flex items-center gap-2 px-6 py-3 bg-white text-amber-700 rounded-xl font-black text-sm hover:bg-amber-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirmingReceipt ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Confirmar Recebimento
                </>
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Histórico de Solicitações */}
      <div className="bg-[#0f172a] rounded-[56px] shadow-2xl overflow-hidden relative group">
        <div className="px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6 text-white">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-3xl flex items-center justify-center shadow-inner ring-1 ring-white/10"><HistoryIcon size={32} /></div>
              <div><h2 className="text-2xl font-black uppercase tracking-tight">Histórico de Solicitações</h2><p className="text-slate-400 text-xs font-bold uppercase opacity-60 tracking-widest">Gestão de Processos</p></div>
           </div>
           
           {/* Filters Toolbar */}
           <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="relative group/search">
                  <Search className="absolute left-4 top-3 text-slate-500 group-focus-within/search:text-blue-400 transition-colors" size={16} />
                  <input 
                      type="text" 
                      placeholder="Buscar NUP ou objeto..." 
                      className="pl-12 pr-6 py-3 bg-slate-900/50 border border-transparent focus:border-blue-500/50 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all w-64"
                      value={historyFilter}
                      onChange={(e) => { setHistoryFilter(e.target.value); setCurrentPage(1); }}
                  />
              </div>
              <div className="h-8 w-px bg-white/10 mx-1"></div>
              <select 
                  className="bg-slate-900/50 text-white text-xs font-bold py-3 pl-4 pr-10 rounded-xl border border-transparent hover:bg-slate-800 focus:outline-none appearance-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                  <option value="TODOS">Todos os Status</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="CONCEDIDO">Concedido</option>
                  <option value="PRESTANDO CONTAS">Prestando Contas</option>
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="ARQUIVADO">Arquivado</option>
              </select>
           </div>
        </div>

        <div className="bg-[#f8fafc] mx-2 mb-2 rounded-[52px] p-8 min-h-[600px] flex flex-col relative">
           {/* Decorative Top Shadow/Gradient */}
           <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/5 to-transparent rounded-t-[52px] pointer-events-none"></div>

           <div className="flex-1 space-y-3">
              {currentItems.length > 0 ? currentItems.map((p: any) => (
                <div key={p.id} onClick={() => onSelectProcess(p)} className="group relative bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden">
                    {/* Hover Accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-center gap-6">
                        {/* Icon Box */}
                        <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 transition-colors ${
                            p.type === 'SESSÃO DE JÚRI' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                        }`}>
                            {p.type === 'SESSÃO DE JÚRI' ? <Scale size={28} strokeWidth={1.5} /> : <Zap size={28} strokeWidth={1.5} />}
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-base font-black text-slate-800 tracking-tight truncate">{p.nup}</h3>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{p.type}</span>
                            </div>
                            <p className="text-xs font-medium text-slate-500 truncate pr-4">{p.object || p.desc || 'Sem descrição'}</p>
                        </div>

                        {/* Date & Value */}
                        <div className="text-right px-4 border-l border-slate-100 hidden md:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Solicitado em</p>
                            <div className="flex items-center justify-end gap-2 text-slate-700 font-bold text-sm">
                                <Calendar size={14} className="text-slate-400"/> {p.date || new Date(p.created_at).toLocaleDateString('pt-BR')}
                            </div>
                        </div>

                        <div className="text-right px-4 border-l border-slate-100 hidden md:block w-32">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor</p>
                            <p className="text-base font-black text-slate-900">{formatCurrency(p.val || 0)}</p>
                        </div>

                        {/* Status & Action */}
                        <div className="pl-2">
                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-colors ${
                                 p.status === 'CONCEDIDO' ? 'bg-emerald-100 text-emerald-700' :
                                 p.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' :
                                 p.status === 'RASCUNHO' ? 'bg-slate-100 text-slate-600' :
                                 p.status === 'PRESTANDO CONTAS' ? 'bg-purple-100 text-purple-700' :
                                 p.status === 'ARQUIVADO' ? 'bg-gray-100 text-gray-600' :
                                 'bg-blue-50 text-blue-600'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    p.status === 'CONCEDIDO' ? 'bg-emerald-500' :
                                    p.status === 'PENDENTE' ? 'bg-amber-500' :
                                    p.status === 'PRESTANDO CONTAS' ? 'bg-purple-500' :
                                    'bg-slate-400'
                                }`}></div>
                                {p.status}
                            </span>
                        </div>
                        
                        {/* Actions Group */}
                        <div className="flex items-center gap-2 pl-2">
                            {/* Direct Edit for Drafts */}
                            {isEditableProcess(p.status) && (
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         onDraftEdit(p);
                                      }}
                                      className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 hover:scale-110 transition-all border border-amber-100"
                                      title="Editar"
                                   >
                                      <Edit size={18} />
                                   </button>
                                   {isDeletableProcess(p.status) && (
                                      <button 
                                         onClick={(e) => {
                                            e.stopPropagation();
                                            onDraftDelete(p);
                                         }}
                                         className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:scale-110 transition-all border border-red-100"
                                         title="Excluir"
                                      >
                                         <Trash2 size={18} />
                                      </button>
                                   )}
                               </div>
                            )}
                            
                            {(p.status === 'PRESTANDO CONTAS' || 
                              p.status === 'A PRESTAR CONTAS' ||
                              p.status_workflow === 'AWAITING_ACCOUNTABILITY' ||
                              p.status_workflow === 'ACCOUNTABILITY_OPEN') && (
                               <button 
                                  onClick={(e) => {
                                     e.stopPropagation();
                                     onPrestacaoContas(p);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 shadow-md transition-all"
                               >
                                  <FileText size={16} />
                                  Prestar Contas
                               </button>
                            )}
                            
                             <div className="text-slate-300 group-hover:text-blue-600 transition-colors p-2">
                               <ChevronRight size={24} />
                            </div>
                        </div>
                    </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 opacity-60">
                    <FileSearchIcon size={64} strokeWidth={1} />
                    <p className="mt-4 font-bold text-sm uppercase tracking-widest">Nenhum registro encontrado</p>
                </div>
              )}
           </div>

           {/* Barra de Paginação */}
           <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-auto">
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
                 >
                   <ChevronLeft size={20} />
                 </button>
                 <div className="flex items-center gap-1.5 px-4">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                 </div>
                 <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
                 >
                   <ChevronRight size={20} />
                 </button>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Página {currentPage} de {totalPages}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  FileText, 
  DollarSign, 
  User, 
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ProcessData } from '../../../hooks/useProcessDetails';

interface DetailsTabProps {
  process: ProcessData;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({ process }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase().replace(/ /g, '_') || 'pendente_atesto';
    
    // Status mapping override for visuals
    let visualKey = normalizedStatus;
    if (normalizedStatus === 'atestado' || normalizedStatus.includes('sosfu')) {
        visualKey = 'em_analise_sosfu';
    }

    const statusConfig: Record<string, { icon: any, color: string, label: string }> = {
      'pendente_atesto': { icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pendente Atesto' },
      'atestado': { icon: CheckCircle2, color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Atestado' },
      'em_analise_sosfu': { icon: AlertCircle, color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Em Análise SOSFU' },
      'aprovado': { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Aprovado' },
      'devolvido': { icon: AlertCircle, color: 'bg-red-50 text-red-700 border-red-200', label: 'Devolvido' },
      // Fallback keys match normalized DB values just in case
      'pendente': { icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pendente' },
    };

    const config = statusConfig[visualKey] || statusConfig[normalizedStatus] || statusConfig['pendente_atesto'];
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${config.color} font-bold text-sm`}>
        <Icon size={16} />
        {config.label}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-8">
      {/* Row 1: Dados Gerais + Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Dados Gerais */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Dados Gerais</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">NUP</label>
              <p className="text-lg font-bold text-slate-900 mt-1">{process.nup}</p>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
              <p className="text-base text-slate-700 mt-1">{process.tipo}</p>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <div className="mt-2">{getStatusBadge(process.status)}</div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Criação</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar size={16} className="text-slate-400" />
                <p className="text-base text-slate-700">
                  {new Date(process.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Financeiro */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Financeiro</h3>
          </div>
          
          <div className="space-y-6">
            
            {/* Breakdown of Elements */}
            {process.items && process.items.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Detalhamento da Despesa</label>
                <div className="space-y-2">
                  {process.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                      <div className="flex flex-col">
                         <span className="font-bold text-slate-700">{item.element}</span>
                         <span className="text-xs text-slate-500">{item.description}</span>
                      </div>
                      <span className="font-medium text-emerald-600">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Total Solicitado</label>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(process.valor_solicitado || process.valor_total || 0)}
              </p>
            </div>
            
            {process.urgencia && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgência</label>
                <p className="text-base text-slate-700 mt-1">{process.urgencia}</p>
              </div>
            )}

            {process.tipo === 'Sessão de Júri' && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Participantes</label>
                  <p className="text-base text-slate-700 mt-1">{process.juri_participantes || 0} pessoas</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duração</label>
                  <p className="text-base text-slate-700 mt-1">{process.juri_dias || 0} dias</p>
                </div>
              </>
            )}

            {process.dados_bancarios && (
              <div className="pt-4 mt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dados Bancários</label>
                <div className="mt-2 bg-slate-50 rounded-xl p-3 flex items-center gap-3 text-sm flex-wrap">
                  <span className="font-bold text-slate-800">{process.dados_bancarios.bankName}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600">Ag: <span className="font-mono font-bold text-slate-800">{process.dados_bancarios.agency}</span></span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600">CC: <span className="font-mono font-bold text-slate-800">{process.dados_bancarios.account}</span></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Interessado + Justificativa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Interessado */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
              <User className="text-purple-600" size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Interessado</h3>
          </div>
                    {/* Enhanced Interessado Card - Updated */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
               <div className="col-span-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome</label>
                 <p className="text-sm font-bold text-slate-900">{process.suprido_nome || 'N/A'}</p>
                 <p className="text-xs text-slate-500">{process.servidor_dados?.cpf ? `CPF: ${process.servidor_dados.cpf}` : ''}</p>
                 <p className="text-xs text-slate-500">{process.perfil_email ? `Email: ${process.perfil_email}` : ''}</p>
               </div>

               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Cargo</label>
                 <p className="text-sm text-slate-800">{process.suprido_cargo || 'N/A'}</p>
               </div>

               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Vínculo</label>
                 <p className="text-sm text-slate-800">{process.servidor_dados?.vinculo || 'N/A'}</p>
               </div>

               <div className="col-span-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Lotação</label>
                 <p className="text-sm text-slate-800">{process.lotacao || 'N/A'}</p>
               </div>
               
               {process.servidor_dados && (
                 <>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Categoria / Grau</label>
                      <p className="text-sm text-slate-800">{process.servidor_dados.categoria || '-'} / {process.servidor_dados.grau || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Entrância</label>
                      <p className="text-sm text-slate-800">{process.servidor_dados.entrancia || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Polo</label>
                      <p className="text-sm text-slate-800">{process.servidor_dados.polo || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Região</label>
                      <p className="text-sm text-slate-800">{process.servidor_dados.regiao || 'N/A'}</p>
                    </div>
                 </>
               )}
            </div>

            {process.gestor && (
              <div className="pt-4 mt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Gestor Responsável</label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{process.gestor.nome}</p>
                    <p className="text-xs text-slate-500">{process.gestor.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Card: Justificativa */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
              <FileText className="text-amber-600" size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Justificativa</h3>
          </div>
          
          <div className="space-y-4">
            {process.items && process.items.length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mb-4">
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 block flex items-center gap-2">
                  <DollarSign size={12} /> Elementos de Despesa
                </label>
                <div className="space-y-2">
                  {process.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm border-b border-amber-200/50 last:border-0 pb-2 last:pb-0">
                      <span className="text-amber-900 font-medium">{item.element} <span className="text-amber-700/70 font-normal">- {item.description}</span></span>
                      <span className="font-bold text-amber-950">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-slate-50 rounded-2xl p-6 max-h-64 overflow-y-auto">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {(process.descricao || 'Nenhuma justificativa fornecida.').replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3/$2/$1')}
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

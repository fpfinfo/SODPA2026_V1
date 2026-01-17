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
import { ProcessData } from '../hooks/useProcessDetails';

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
    const statusConfig = {
      'pendente_atesto': { icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pendente Atesto' },
      'atestado': { icon: CheckCircle2, color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Atestado' },
      'em_analise_sosfu': { icon: AlertCircle, color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Em Análise SOSFU' },
      'aprovado': { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Aprovado' },
      'devolvido': { icon: AlertCircle, color: 'bg-red-50 text-red-700 border-red-200', label: 'Devolvido' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pendente_atesto'];
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
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Solicitado</label>
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
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</label>
              <p className="text-base font-bold text-slate-900 mt-1">{process.suprido_nome || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo</label>
              <p className="text-base text-slate-700 mt-1">{process.suprido_cargo || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lotação</label>
              <div className="flex items-center gap-2 mt-1">
                <Building2 size={16} className="text-slate-400" />
                <p className="text-base text-slate-700">{process.lotacao || process.unidade || process.comarca || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Justificativa */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
              <FileText className="text-amber-600" size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Justificativa</h3>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-6 max-h-64 overflow-y-auto">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {process.descricao || 'Nenhuma justificativa fornecida.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

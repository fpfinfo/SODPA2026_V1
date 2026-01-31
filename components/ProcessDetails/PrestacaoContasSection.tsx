import React from 'react';
import { 
  Receipt, 
  FileText, 
  CheckCircle2, 
  Clock,
  DollarSign,
  AlertTriangle,
  Building2,
  Calendar,
  ExternalLink,
  Banknote
} from 'lucide-react';
import { PrestacaoContasData, ComprovantePC } from './hooks/useDossierData';

interface PrestacaoContasSectionProps {
  prestacaoData: PrestacaoContasData;
  comprovantes: ComprovantePC[];
  startingFolha: number;
  onViewComprovante?: (comprovante: ComprovantePC) => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateStr: string) => 
  new Date(dateStr).toLocaleDateString('pt-BR');

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'SUBMETIDA':
      return { label: 'Submetida', color: 'bg-blue-100 text-blue-700', icon: Clock };
    case 'EM_ANALISE':
      return { label: 'Em Análise', color: 'bg-amber-100 text-amber-700', icon: Clock };
    case 'PENDENCIA':
      return { label: 'Pendência', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
    case 'APROVADA':
      return { label: 'Aprovada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
    case 'SIAFE_BAIXADA':
      return { label: 'Baixada', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 };
    default:
      return { label: status || 'Rascunho', color: 'bg-slate-100 text-slate-600', icon: FileText };
  }
};

const ELEMENTO_LABELS: Record<string, string> = {
  '3.3.90.30.01': 'Consumo Geral',
  '3.3.90.30.02': 'Combustível',
  '3.3.90.33': 'Passagens e Locomoção',
  '3.3.90.36': 'Serviços PF',
  '3.3.90.39': 'Serviços PJ',
};

export const PrestacaoContasSection: React.FC<PrestacaoContasSectionProps> = ({
  prestacaoData,
  comprovantes,
  startingFolha,
  onViewComprovante
}) => {
  const statusConfig = getStatusConfig(prestacaoData.status);
  const StatusIcon = statusConfig.icon;

  // Calculate totals
  const totalGasto = comprovantes.reduce((sum, c) => sum + c.valor, 0);
  const saldoDevolvido = prestacaoData.valor_concedido - totalGasto;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Receipt size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black uppercase tracking-tight">Prestação de Contas</h4>
              <p className="text-sm text-white/80">
                {prestacaoData.submitted_at 
                  ? `Submetida em ${formatDate(prestacaoData.submitted_at)}`
                  : 'Em elaboração'}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 ${statusConfig.color}`}>
            <StatusIcon size={14} />
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          Resumo Financeiro
        </p>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Concedido</p>
            <p className="text-lg font-black text-slate-700">{formatCurrency(prestacaoData.valor_concedido)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-blue-400 font-bold uppercase">Total Gasto</p>
            <p className="text-lg font-black text-blue-700">{formatCurrency(totalGasto)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-emerald-400 font-bold uppercase">Devolvido</p>
            <p className="text-lg font-black text-emerald-700">{formatCurrency(saldoDevolvido > 0 ? saldoDevolvido : 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-purple-400 font-bold uppercase">Comprovantes</p>
            <p className="text-lg font-black text-purple-700">{comprovantes.length}</p>
          </div>
        </div>
        
        {/* Retenções (if any) */}
        {(prestacaoData.total_inss_retido || prestacaoData.total_iss_retido) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Retenções</p>
            <div className="flex gap-4">
              {prestacaoData.total_inss_retido && prestacaoData.total_inss_retido > 0 && (
                <span className="text-xs font-medium text-purple-700">
                  INSS: {formatCurrency(prestacaoData.total_inss_retido)}
                </span>
              )}
              {prestacaoData.total_iss_retido && prestacaoData.total_iss_retido > 0 && (
                <span className="text-xs font-medium text-purple-700">
                  ISS: {formatCurrency(prestacaoData.total_iss_retido)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comprovantes List */}
      {comprovantes.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
            Comprovantes Anexados
          </p>
          {comprovantes.map((comp, index) => (
            <div 
              key={comp.id}
              onClick={() => onViewComprovante?.(comp)}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer group"
            >
              {/* Folha Number */}
              <div className="w-14 text-center shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase tracking-widest">FLS.</span>
                <span className="text-2xl font-black text-slate-700 group-hover:text-purple-600">
                  {String(startingFolha + index).padStart(2, '0')}
                </span>
              </div>

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Receipt size={20} className="text-purple-600" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h5 className="text-sm font-bold text-slate-800 truncate">
                    {comp.tipo === 'NOTA_FISCAL' ? 'NOTA FISCAL' : 
                     comp.tipo === 'CUPOM_FISCAL' ? 'CUPOM FISCAL' : 
                     comp.tipo === 'RECIBO' ? 'RECIBO' : comp.tipo}
                    {comp.numero && ` #${comp.numero}`}
                  </h5>
                  <span className="text-[9px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded uppercase font-bold tracking-wider shrink-0">
                    {ELEMENTO_LABELS[comp.elemento_despesa] || comp.elemento_despesa}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {comp.emitente}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(comp.data_emissao)}
                  </span>
                </div>
              </div>

              {/* Value */}
              <div className="text-right shrink-0">
                <p className="text-lg font-black text-slate-800">{formatCurrency(comp.valor)}</p>
              </div>

              {/* Action */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={18} className="text-purple-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GDRs */}
      {(prestacaoData.gdr_inss_paga || prestacaoData.gdr_saldo_paga) && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
            Guias de Recolhimento (GDRs)
          </p>
          
          {prestacaoData.gdr_inss_paga && (
            <div className="bg-white rounded-xl border border-emerald-200 p-4 flex items-center gap-4">
              <div className="w-14 text-center shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase tracking-widest">FLS.</span>
                <span className="text-2xl font-black text-emerald-600">
                  {String(startingFolha + comprovantes.length).padStart(2, '0')}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Banknote size={20} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-slate-800">GDR INSS #{prestacaoData.gdr_inss_numero}</h5>
                <p className="text-xs text-slate-500">Recolhimento de INSS retido</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-emerald-700">{formatCurrency(prestacaoData.gdr_inss_valor || 0)}</p>
              </div>
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
          )}

          {prestacaoData.gdr_saldo_paga && (
            <div className="bg-white rounded-xl border border-emerald-200 p-4 flex items-center gap-4">
              <div className="w-14 text-center shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase tracking-widest">FLS.</span>
                <span className="text-2xl font-black text-emerald-600">
                  {String(startingFolha + comprovantes.length + (prestacaoData.gdr_inss_paga ? 1 : 0)).padStart(2, '0')}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Banknote size={20} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-slate-800">GDR DEVOLUÇÃO #{prestacaoData.gdr_saldo_numero}</h5>
                <p className="text-xs text-slate-500">Devolução de saldo não utilizado</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-emerald-700">{formatCurrency(prestacaoData.gdr_saldo_valor || 0)}</p>
              </div>
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

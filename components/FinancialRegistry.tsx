import React from 'react';
import { Process, INSSTable } from '../types';
import { INSS_TABLE_2025 } from '../constants';
import { 
  Calculator, 
  Settings, 
  Download, 
  Printer, 
  RefreshCw,
  ArrowDownLeft,
  Landmark,
  Undo2
} from 'lucide-react';

interface FinancialRegistryProps {
  processes: Process[];
  type: 'TAX_INSS' | 'GDR_CONTROL';
  isLoading?: boolean;
  onManageTables?: () => void;
}

export const FinancialRegistry: React.FC<FinancialRegistryProps> = ({ processes, type, isLoading, onManageTables }) => {
  const isTax = type === 'TAX_INSS';
  
  const totals = processes.reduce((acc, p) => {
    if (isTax && p.taxData) {
      acc.base += p.taxData.serviceValue;
      acc.employee += p.taxData.inssEmployee;
      acc.patronal += p.taxData.inssPatronal;
    } else if (!isTax && p.balanceData) {
      acc.base += p.value; // Conceded
      acc.employee += p.balanceData.amountSpent;
      acc.patronal += p.balanceData.amountReturned;
    }
    return acc;
  }, { base: 0, employee: 0, patronal: 0 });

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (isLoading) return <div className="p-20 text-center animate-pulse text-slate-400">Auditoria Financeira em Processamento...</div>;

  return (
    <div className="space-y-6">
      {/* 1. Module Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {isTax ? <Landmark size={24} className="text-emerald-600"/> : <Undo2 size={24} className="text-teal-600"/>}
            {isTax ? 'Gestão de INSS (Recolhimento GDR)' : 'Gestão de Devoluções (Saldo GDR)'}
          </h2>
          <p className="text-slate-500 text-sm">
            {isTax ? 'Controle de todas as GDR relacionadas com recolhimento de INSS e obrigações tributárias.' 
                   : 'Controle de GDR relacionadas apenas com devolução de recursos não utilizados.'}
          </p>
        </div>
        {isTax && (
          <button 
            onClick={onManageTables}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Settings size={16} /> Gerenciar Tabelas INSS
          </button>
        )}
      </div>

      {/* 2. INSS Table Context (Active Brackets) - Only for INSS Tab */}
      {isTax && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Ano 2025</div>
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            Tabela INSS Ativa
          </h3>
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-4 gap-4 flex-1">
              {INSS_TABLE_2025.ranges.map((r, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{r.rate}%</span>
                    <span className="text-xs text-slate-500 font-medium">{r.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">R$ {r.min.toFixed(2)} até {r.max === INSS_TABLE_2025.ceiling ? 'Teto' : `R$ ${r.max.toFixed(2)}`}</p>
                </div>
              ))}
            </div>
            <div className="border-l border-slate-200 pl-8 ml-8">
              <p className="text-[10px] uppercase font-bold text-slate-400">Teto de Contribuição</p>
              <h4 className="text-xl font-extrabold text-blue-700">{formatBRL(INSS_TABLE_2025.ceiling)}</h4>
              <p className="text-[10px] text-slate-400 italic">Tabela oficial 2025 (Diário Oficial da União)</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. KPI Summaries */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isTax ? 'Total Base de Cálculo' : 'Total Concedido'}</p>
           <h3 className="text-2xl font-extrabold text-slate-800">{formatBRL(totals.base)}</h3>
           <p className="text-[10px] text-slate-400">{isTax ? 'Valor bruto dos serviços' : `${processes.length} suprimentos de fundos`}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
           <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isTax ? 'Total INSS Retido (PF)' : 'Total Executado (Gasto)'}</p>
           <h3 className="text-2xl font-extrabold text-blue-600">{formatBRL(totals.employee)}</h3>
           <p className="text-[10px] text-slate-400">{isTax ? 'A recolher via GDR' : 'Comprovado com notas'}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
           <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isTax ? 'Total INSS Patronal (20%)' : 'Total Devolvido (Saldo GDR)'}</p>
           <h3 className="text-2xl font-extrabold text-emerald-600">{formatBRL(totals.patronal)}</h3>
           <p className="text-[10px] text-slate-400">{isTax ? 'Encargo TJPA' : 'Recurso não utilizado'}</p>
        </div>
      </div>

      {/* 4. Filters Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-5 gap-4">
        <div className="space-y-1">
           <label className="text-[10px] font-bold text-slate-400 uppercase">Período</label>
           <div className="flex gap-2">
              <input type="date" className="w-full text-xs border border-slate-200 p-2 rounded" />
              <input type="date" className="w-full text-xs border border-slate-200 p-2 rounded" />
           </div>
        </div>
        <div className="space-y-1">
           <label className="text-[10px] font-bold text-slate-400 uppercase">{isTax ? 'Prestador de Serviço' : 'Suprido'}</label>
           <select className="w-full text-xs border border-slate-200 p-2 rounded bg-slate-50"><option>Todos</option></select>
        </div>
        <div className="space-y-1">
           <label className="text-[10px] font-bold text-slate-400 uppercase">Município</label>
           <select className="w-full text-xs border border-slate-200 p-2 rounded bg-slate-50"><option>Todos</option></select>
        </div>
        <div className="space-y-1">
           <label className="text-[10px] font-bold text-slate-400 uppercase">{isTax ? 'Mês Competência' : 'Status GDR'}</label>
           <select className="w-full text-xs border border-slate-200 p-2 rounded bg-slate-50"><option>Todos</option></select>
        </div>
        <div className="flex items-end">
           <button className="text-xs font-bold text-blue-600 bg-blue-50 w-full p-2 rounded hover:bg-blue-100">Limpar Filtros</button>
        </div>
      </div>

      {/* 5. Detailed Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <h3 className="font-bold text-slate-700 text-sm">Registros de {isTax ? 'Retenção' : 'Devolução'} ({processes.length})</h3>
           <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium hover:bg-slate-50">
                <RefreshCw size={12} /> Atualizar
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium hover:bg-slate-50">
                <Download size={12} /> CSV
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-700 shadow-sm">
                <Printer size={12} /> Imprimir GDRs
              </button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Data Ref.</th>
                <th className="px-6 py-3">{isTax ? 'Prestador (Pessoa Física)' : 'Suprido (Responsável)'}</th>
                {isTax && (
                  <>
                    <th className="px-6 py-3">CPF / NIT</th>
                    <th className="px-6 py-3">Município</th>
                  </>
                )}
                {!isTax && (
                  <>
                    <th className="px-6 py-3">Nº GDR</th>
                    <th className="px-6 py-3">Elemento Despesa</th>
                  </>
                )}
                <th className="px-6 py-3 text-right">Valor {isTax ? 'Bruto' : 'Concedido'}</th>
                <th className="px-6 py-3 text-right text-blue-600">{isTax ? 'INSS Retido' : 'Valor Gasto'}</th>
                <th className="px-6 py-3 text-right text-emerald-600">{isTax ? 'INSS Patronal' : 'Devolução (Saldo)'}</th>
                <th className="px-6 py-3 text-center">Status GDR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processes.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {p.taxData?.serviceDate ? new Date(p.taxData.serviceDate).toLocaleDateString('pt-BR') : new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{p.interestedParty}</td>
                  {isTax && (
                    <>
                      <td className="px-6 py-4 text-slate-500 font-mono">{p.providerCpf || '---'}</td>
                      <td className="px-6 py-4 text-slate-500">{p.city || '---'}</td>
                    </>
                  )}
                  {!isTax && (
                    <>
                      <td className="px-6 py-4 text-slate-500 font-mono">{p.balanceData?.gdrBalanceNumber || '---'}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {p.items && p.items.length > 0 
                          ? <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold">{p.items[0].element}</span> 
                          : <span className="text-slate-300 text-[10px]">3.3.90.30.99</span>
                        }
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 text-right font-medium text-slate-600">
                    {formatBRL(isTax ? (p.taxData?.serviceValue || 0) : p.value)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">
                    {formatBRL(isTax ? (p.taxData?.inssEmployee || 0) : (p.balanceData?.amountSpent || 0))}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    {formatBRL(isTax ? (p.taxData?.inssPatronal || 0) : (p.balanceData?.amountReturned || 0))}
                  </td>
                  <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold ${
                        (isTax ? p.taxData?.gdrInssStatus : p.balanceData?.status) === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {(isTax ? p.taxData?.gdrInssStatus : p.balanceData?.status) || 'Pendente'}
                      </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-extrabold border-t-2 border-slate-200">
                <td colSpan={isTax ? 4 : 4} className="px-6 py-4 uppercase text-slate-800 tracking-wider">Totais Consolidados</td>
                <td className="px-6 py-4 text-right text-slate-800">{formatBRL(totals.base)}</td>
                <td className="px-6 py-4 text-right text-blue-700">{formatBRL(totals.employee)}</td>
                <td className="px-6 py-4 text-right text-emerald-700">{formatBRL(totals.patronal)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

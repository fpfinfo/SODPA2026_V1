import React from 'react';
import { Receipt, Calculator, Calendar, Banknote, FileText } from 'lucide-react';

interface ExecutionTabProps {
  processData: any;
  enrichedProcessData?: any;
}

export const ExecutionTab: React.FC<ExecutionTabProps> = ({ 
  processData, 
  enrichedProcessData 
}) => {
  const itens = enrichedProcessData?.itens_despesa || processData.items || [];
  const totalGeral = enrichedProcessData?.valor_total || processData.value || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Receipt className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Execução da Despesa</h3>
          <p className="text-sm text-slate-500">Detalhamento dos itens e cronograma de execução</p>
        </div>
      </div>

      {/* Itens de Despesa */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Elementos de Despesa
          </h4>
        </div>
        <table className="w-full">
          <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Código</th>
              <th className="px-6 py-3 text-left">Descrição</th>
              <th className="px-6 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {itens.length > 0 ? (
              itens.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-blue-600 font-bold">
                    {item.codigo || item.element || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {item.descricao || item.description || item.desc || 'Despesa'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-sm text-slate-900">
                    {formatCurrency(item.valor_total || item.value || item.val || 0)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-400">
                  Nenhum item de despesa cadastrado
                </td>
              </tr>
            )}
          </tbody>
          {itens.length > 0 && (
            <tfoot className="bg-slate-800 text-white">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-sm font-bold uppercase">
                  Total Geral
                </td>
                <td className="px-6 py-4 text-right text-lg font-black">
                  {formatCurrency(totalGeral)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Timeline de Execução */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-black text-slate-700 uppercase">
            Cronograma de Execução
          </h4>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <div className="w-4 h-4 rounded-full bg-white"></div>
            </div>
            <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-800">Solicitação Criada</p>
              <p className="text-xs text-slate-500 mt-1">
                {formatDate(processData.createdAt || processData.created_at)}
              </p>
            </div>
          </div>
          
          {enrichedProcessData?.data_inicio && enrichedProcessData?.data_fim && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <div className="w-4 h-4 rounded-full bg-white"></div>
              </div>
              <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">Período de Execução</p>
                <p className="text-xs text-slate-500 mt-1">
                  De {formatDate(enrichedProcessData.data_inicio)} até{' '}
                  {formatDate(enrichedProcessData.data_fim)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 rounded-full bg-white"></div>
            </div>
            <div className="flex-1 bg-white/50 rounded-xl p-4 border-2 border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-400">Prestação de Contas</p>
              <p className="text-xs text-slate-400 mt-1">
                Aguardando execução
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-slate-500 uppercase">Valor Solicitado</p>
          </div>
          <p className="text-2xl font-black text-blue-600">
            {formatCurrency(totalGeral)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-bold text-slate-500 uppercase">INSS Retido</p>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {formatCurrency(enrichedProcessData?.inss_total || 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-bold text-slate-500 uppercase">Valor Líquido</p>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {formatCurrency(totalGeral - (enrichedProcessData?.inss_total || 0))}
          </p>
        </div>
      </div>
    </div>
  );
};

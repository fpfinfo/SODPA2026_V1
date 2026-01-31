
import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Plus, 
  MoreHorizontal, 
  UserPlus, 
  Calendar,
  Search,
  ChevronDown
} from 'lucide-react';
import { useSODPAProcesses } from '../../hooks/useSODPAProcesses';
import { StatusDiaria } from '../../types';
import { useToast } from '../ui/ToastProvider';

interface GestaoDiariasPanelProps {
  onOpenProcess?: (processId: string, tipo: 'DIARIA' | 'PASSAGEM') => void;
}

type FilterType = 'TODAS' | 'NOVAS' | 'EM_ANALISE' | 'PRESTACAO_CONTAS' | 'CONCLUIDAS';

export function GestaoDiariasPanel({ onOpenProcess }: GestaoDiariasPanelProps) {
  const { 
    diarias, 
    loading, 
    updateStatus, 
    assignToUser, 
    currentUserId 
  } = useSODPAProcesses();

  const [activeFilter, setActiveFilter] = useState<FilterType>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  // Statistics Calculation
  const stats = useMemo(() => {
    const pendentes = diarias.filter(d => ['SOLICITADA', 'PENDENTE_ANALISE', 'EM_ANALISE'].includes(d.status)).length;
    const aprovados = diarias.filter(d => ['APROVADA', 'PAGA', 'CONCLUIDA'].includes(d.status)).length;
    const totalValue = diarias.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);

    return { pendentes, aprovados, totalValue };
  }, [diarias]);

  // Filtering Logic
  const filteredDiarias = useMemo(() => {
    return diarias.filter(diaria => {
      // Text Search
      const searchMatch = 
        diaria.servidorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        diaria.nup.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      // Tab Filter
      switch (activeFilter) {
        case 'NOVAS':
          return diaria.status === 'SOLICITADA';
        case 'EM_ANALISE':
          return ['PENDENTE_ANALISE', 'EM_ANALISE', 'AGUARDANDO_DOCS'].includes(diaria.status);
        case 'PRESTACAO_CONTAS':
          return ['PRESTACAO_CONTAS', 'PENDENTE_COMPROVACAO'].includes(diaria.status as string);
        case 'CONCLUIDAS':
          return ['PAGA', 'CONCLUIDA', 'DEVOLVIDA', 'ARQUIVADA'].includes(diaria.status);
        case 'TODAS':
        default:
          return true;
      }
    });
  }, [diarias, activeFilter, searchTerm]);

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Helper for Status Badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'AGUARDANDO_SOSFU': 'text-blue-600 font-bold',
      'SOLICITADA': 'text-blue-600 font-bold',
      'PRESTACAO_CONTAS': 'text-amber-600 font-bold',
      'PENDENTE_ASSINATURA': 'text-amber-600 font-bold',
      'AGUARDANDO_ASSINATURA': 'text-amber-600 font-bold',
      'APROVADA': 'text-emerald-600 font-bold',
      'APROVADO': 'text-emerald-600 font-bold',
      'EM_ANALISE': 'text-amber-600 font-bold',
      'REJEITADO': 'text-red-600 font-bold',
      'DEVOLVIDA': 'text-red-600 font-bold',
      'PAGA': 'text-emerald-600 font-bold',
      'CONCLUIDA': 'text-emerald-600 font-bold',
    };

    // Default formatting if status not in map
    const displayStatus = status.replace(/_/g, ' ');
    const className = styles[status] || 'text-gray-600 font-bold';

    return <span className={`text-[11px] uppercase tracking-wide ${className}`}>{displayStatus}</span>;
  };

  const getCategoryColor = (category?: string) => {
    switch(category) {
      case 'MAGISTRADO': return 'text-orange-600';
      case 'ORDINÁRIO': return 'text-orange-600';
      case 'EXTRAORDINÁRIO': return 'text-orange-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestão de Diárias</h2>
          <p className="text-sm text-gray-500">Controle de concessões, pagamentos e prestação de contas.</p>
        </div>
        <div className="flex gap-2">
           <button 
             className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
           >
             <Filter className="h-4 w-4" />
             Filtros Avançados
           </button>
           <button 
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
             onClick={() => onOpenProcess?.('NEW', 'DIARIA')}
           >
             <Plus className="h-4 w-4" />
             Nova Diária
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pendentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">PENDENTES DE ANÁLISE</p>
              <h3 className="text-3xl font-bold text-amber-500">{stats.pendentes}</h3>
              <span className="text-xs text-gray-400">solicitações</span>
            </div>
          </div>
          <div className="h-1 w-24 bg-amber-400 rounded-full mt-2"></div>
        </div>

        {/* Aprovados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">APROVADOS (TOTAL)</p>
              <h3 className="text-3xl font-bold text-emerald-500">{stats.aprovados}</h3>
              <span className="text-xs text-gray-400">processos</span>
            </div>
          </div>
          <div className="h-1 w-48 bg-emerald-500 rounded-full mt-2"></div>
        </div>

        {/* Valor Acumulado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">VALOR ACUMULADO</p>
              <h3 className="text-3xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Previsão orçamentária atualizada</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto mobile-scroll">
          {[
            { id: 'TODAS', label: 'Todas' },
            { id: 'NOVAS', label: 'Novas' },
            { id: 'EM_ANALISE', label: 'Em Análise' },
            { id: 'PRESTACAO_CONTAS', label: 'Prestação de Contas' },
            { id: 'CONCLUIDAS', label: 'Concluídas' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        {/* Simple Search Input if needed, though not explicitly in mockup it's good UX */}
        {/* Hidden for high fidelity match unless requested, but sticking to "Listagem" title below */}
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Listagem de Diárias</h3>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium border border-blue-100">
            {filteredDiarias.length} Processos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Protocolo / Interessado</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo / Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Valor / Prazo</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                     Carregando diárias...
                   </td>
                 </tr>
              ) : filteredDiarias.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                     Nenhum registro encontrado para este filtro.
                   </td>
                 </tr>
              ) : (
                filteredDiarias.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors uppercase">
                          {item.servidorNome}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {item.nup}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600">Diária</span>
                        <span className={`text-[11px] font-bold uppercase ${getCategoryColor(item.tipoDiaria)}`}>
                          {item.tipoDiaria || 'ORDINÁRIO'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.valorTotal || 0)}
                        </span>
                        <span className="text-xs text-gray-400">
                          Vence: {formatDate(item.dataFim)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        {getStatusBadge(item.status)}
                        <span className="text-[11px] text-gray-400 italic">
                          {item.assignedToId ? 'Atribuído' : 'Não atribuído'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100">
                        <button 
                          onClick={() => onOpenProcess?.(item.id, 'DIARIA')}
                          className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-1"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                          Detalhes
                        </button>
                        <button 
                          onClick={() => {
                             if(currentUserId) {
                               assignToUser(item.id, currentUserId, 'DIARIA')
                                 .then(() => showToast({ type: 'success', title: 'Successo', message: 'Processo atribuído com sucesso!' }))
                                 .catch(err => showToast({ type: 'error', title: 'Erro', message: 'Erro ao atribuir: ' + err.message }));
                             }
                          }}
                          className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                        >
                          <UserPlus className="h-3 w-3" />
                          Atribuir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer - Static for now as per image logic implied "Exibindo X" */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-500">
                Mostrando {filteredDiarias.length} de {diarias.length} resultados
            </span>
            <div className="flex gap-1">
                <button className="px-2 py-1 border border-gray-200 rounded bg-white text-xs text-gray-500 disabled:opacity-50" disabled>Anterior</button>
                <button className="px-2 py-1 border border-gray-200 rounded bg-white text-xs text-gray-500 disabled:opacity-50" disabled>Próxima</button>
            </div>
        </div>
      </div>
    </div>
  );
}

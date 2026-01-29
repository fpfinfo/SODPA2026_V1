// ============================================================================
// InboxPanel - Painel de Caixa de Entrada SODPA
// Exibe processos não atribuídos aguardando análise
// ============================================================================

import React, { useState } from 'react';
import { 
  Inbox, 
  Filter, 
  Calendar, 
  Plane, 
  RefreshCw,
  Users,
  Search,
  SortAsc,
  ChevronDown
} from 'lucide-react';
import { useSODPAInbox, InboxFilter, InboxSort } from '../../hooks/useSODPAInbox';
import { useSODPATeamMembers } from '../../hooks/useSODPATeamMembers';
import { ProcessCard } from './ProcessCard';
import { ProcessoSODPA } from '../../types';

interface InboxPanelProps {
  onOpenProcess?: (processo: ProcessoSODPA) => void;
}

export function InboxPanel({ onOpenProcess }: InboxPanelProps) {
  const {
    processos,
    loading,
    error,
    totalDiarias,
    totalPassagens,
    total,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    assignToMe,
    assignToMember,
    refetch
  } = useSODPAInbox();

  const { members } = useSODPATeamMembers();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<ProcessoSODPA | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter by search term
  const filteredProcessos = processos.filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      p.solicitanteNome.toLowerCase().includes(search) ||
      p.protocoloNUP?.toLowerCase().includes(search) ||
      p.destino?.toLowerCase().includes(search)
    );
  });

  const handleAssignToMe = async (processo: ProcessoSODPA) => {
    const success = await assignToMe(processo.id, processo.tipo);
    if (success) {
      // TODO: Show toast success
    }
  };

  const handleOpenAssignModal = (processo: ProcessoSODPA) => {
    setSelectedProcess(processo);
    setShowAssignModal(true);
  };

  const handleAssignToMember = async (memberId: string) => {
    if (!selectedProcess) return;
    const success = await assignToMember(selectedProcess.id, selectedProcess.tipo, memberId);
    if (success) {
      setShowAssignModal(false);
      setSelectedProcess(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Inbox className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Caixa de Entrada</h2>
            <p className="text-sm text-gray-500">
              {total} {total === 1 ? 'processo aguardando' : 'processos aguardando'} atribuição
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === 'ALL' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos ({total})
          </button>
          <button
            onClick={() => setFilter('DIARIA')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === 'DIARIA' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Diárias ({totalDiarias})
          </button>
          <button
            onClick={() => setFilter('PASSAGEM')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === 'PASSAGEM' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plane className="h-3.5 w-3.5" />
            Passagens ({totalPassagens})
          </button>
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <SortAsc className="h-4 w-4" />
            <span>
              {sortBy === 'created_at' ? 'Mais recentes' : 
               sortBy === 'prioridade' ? 'Prioridade' : 'Valor'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {/* TODO: Dropdown menu for sort options */}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Carregando processos...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProcessos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Inbox className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Caixa de entrada vazia</h3>
          <p className="text-gray-500 text-sm">
            {searchTerm 
              ? 'Nenhum processo encontrado para esta busca' 
              : 'Todos os processos foram atribuídos'}
          </p>
        </div>
      )}

      {/* Process Grid */}
      {!loading && filteredProcessos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProcessos.map((processo) => (
            <ProcessCard
              key={processo.id}
              processo={processo}
              showAssignActions
              onOpen={() => onOpenProcess?.(processo)}
              onAssignToMe={() => handleAssignToMe(processo)}
              onAssign={() => handleOpenAssignModal(processo)}
            />
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Atribuir Processo</h3>
                  <p className="text-sm text-gray-500">
                    Selecione um membro da equipe
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-2 max-h-[300px] overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Nenhum membro disponível
                </p>
              ) : (
                members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleAssignToMember(member.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {member.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{member.nome}</div>
                      <div className="text-xs text-gray-500">
                        {member.funcao} • {member.taskCount} processos
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${
                        member.ocupacaoPercent >= 80 ? 'text-red-600' :
                        member.ocupacaoPercent >= 50 ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {member.ocupacaoPercent}%
                      </div>
                      <div className="text-xs text-gray-400">ocupação</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedProcess(null);
                }}
                className="w-full py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InboxPanel;

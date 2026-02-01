// ============================================================================
// SODPA - Dashboard Principal
// Serviço de Diárias e Passagens Aéreas - TJPA
// ============================================================================

import React, { useState } from 'react';
import { 
  Inbox, 
  FileText, 
  Plane, 
  ClipboardList, 
  Settings, 
  Filter, 
  Plus, 
  Users, 
  AlertTriangle, 
  CheckCircle2,
  BarChart3, 
  Calendar,
  RefreshCw,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useSODPAProcesses } from '../hooks/useSODPAProcesses';
import { useSODPATeamMembers } from '../hooks/useSODPATeamMembers';
import { useSODPAInbox } from '../hooks/useSODPAInbox';
import { useSODPAMyDesk } from '../hooks/useSODPAMyDesk';
import { SODPATabView, ProcessoSODPA } from '../types';
import { InboxPanel } from './SODPA/InboxPanel';
import { MyDeskPanel } from './SODPA/MyDeskPanel';
import { GestaoDiariasPanel } from './SODPA/GestaoDiariasPanel';
import { GestaoPassagensPanel } from './SODPA/GestaoPassagensPanel';
import { RelatoriosPanel } from './SODPA/RelatoriosPanel';
import { ConfiguracoesPanel } from './SODPA/ConfiguracoesPanel';
import { RequestWizard } from './SODPA/RequestWizard';

interface DashboardSODPAProps {
  onOpenProcess?: (processId: string, tipo: 'DIARIA' | 'PASSAGEM') => void;
}

// Sub-views for the Control Panel
type PanelView = 'OVERVIEW' | 'INBOX' | 'MYDESK';

export function DashboardSODPA({ onOpenProcess }: DashboardSODPAProps) {
  const [activeTab, setActiveTab] = useState<SODPATabView>('PAINEL');
  const [panelView, setPanelView] = useState<PanelView>('OVERVIEW');
  const [showRequestWizard, setShowRequestWizard] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    stats, 
    getInbox,
    getMinhaMesa 
  } = useSODPAProcesses();
  
  const { 
    members: teamMembers, 
    loading: loadingTeam 
  } = useSODPATeamMembers();

  // Inbox stats from dedicated hook
  const { total: inboxTotal, totalDiarias: inboxDiarias, totalPassagens: inboxPassagens } = useSODPAInbox();
  
  // My Desk stats from dedicated hook
  const { total: myDeskTotal, emAnalise, prontosSefin, retornoSefin } = useSODPAMyDesk();

  const tabs = [
    { id: 'PAINEL' as SODPATabView, label: 'Painel de Controle', icon: ClipboardList },
    { id: 'DIARIAS' as SODPATabView, label: 'Gestão de Diárias', icon: Calendar },
    { id: 'PASSAGENS' as SODPATabView, label: 'Gestão de Passagens', icon: Plane },
    { id: 'RELATORIOS' as SODPATabView, label: 'Relatórios', icon: BarChart3 },
    { id: 'CONFIG' as SODPATabView, label: 'Configurações', icon: Settings },
  ];

  // Handle opening a process
  const handleOpenProcess = (processo: ProcessoSODPA) => {
    onOpenProcess?.(processo.id, processo.tipo);
  };

  // KPI Cards Component - Now clickable to navigate to sub-views
  const renderKPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Caixa de Entrada */}
      <div 
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer group"
        onClick={() => setPanelView('INBOX')}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:scale-105 transition-transform">
              <Inbox className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">Caixa de Entrada</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">{inboxTotal}</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-gray-600">{inboxDiarias} Diárias</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="text-gray-600">{inboxPassagens} Passagens</span>
          </span>
        </div>
      </div>

      {/* Minha Mesa */}
      <div 
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer group"
        onClick={() => setPanelView('MYDESK')}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl group-hover:scale-105 transition-transform">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">Minha Mesa</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">{myDeskTotal}</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-gray-600">{emAnalise} Em Análise</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-gray-600">{prontosSefin} Prontos</span>
          </span>
        </div>
      </div>

      {/* Fluxo SEFIN */}
      <div 
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer group"
        onClick={() => {/* TODO: SEFIN flow view */}}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl group-hover:scale-105 transition-transform">
              <Plane className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">Fluxo SEFIN</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">{stats.aguardandoAprovacao}</div>
        <div className="text-xs text-gray-500">Aguardando assinatura SEFIN</div>
      </div>

      {/* Concluídos */}
      <div 
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer group"
        onClick={() => {/* TODO: Concluded view */}}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">Retorno SEFIN</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-green-500 transition-colors" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">{retornoSefin}</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-gray-600">{stats.concluidos} Concluídos</span>
          </span>
        </div>
      </div>
    </div>
  );

  // Team Management Component
  const renderTeamManagement = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Users className="h-5 w-5 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Gestão da Equipe Técnica</h3>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Analista / Função</th>
              <th className="px-5 py-3 font-medium">Carga de Trabalho</th>
              <th className="px-5 py-3 font-medium">Alertas SLA</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loadingTeam ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Carregando equipe...
                </td>
              </tr>
            ) : teamMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  Nenhum membro da equipe cadastrado
                </td>
              </tr>
            ) : (
              teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img 
                          src={member.avatarUrl} 
                          alt={member.nome} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
                          {member.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{member.nome}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">{member.funcao}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700 min-w-[80px]">
                        {member.taskCount} Processos
                      </span>
                      <div className="flex-1 max-w-[140px]">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              member.ocupacaoPercent >= 80 
                                ? 'bg-gradient-to-r from-red-400 to-red-500' 
                                : member.ocupacaoPercent >= 50 
                                  ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                                  : 'bg-gradient-to-r from-blue-400 to-blue-500'
                            }`}
                            style={{ width: `${member.ocupacaoPercent}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 min-w-[50px]">
                        {member.ocupacaoPercent}% Cap.
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {member.atrasados > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {member.atrasados} ATRASADOS
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 justify-end">
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                        title="Ver fila de processos"
                      >
                        <FileText className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                        title="Redistribuir processos"
                      >
                        <Users className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Placeholder for other tabs
  const renderPlaceholder = (icon: React.ReactNode, title: string) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">Módulo em desenvolvimento</p>
    </div>
  );

  // Render the panel content based on current view
  const renderPanelContent = () => {
    switch (panelView) {
      case 'INBOX':
        return (
          <>
            {/* Back button */}
            <button
              onClick={() => setPanelView('OVERVIEW')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Voltar para Visão Geral
            </button>
            <InboxPanel onOpenProcess={handleOpenProcess} />
          </>
        );
      
      case 'MYDESK':
        return (
          <>
            {/* Back button */}
            <button
              onClick={() => setPanelView('OVERVIEW')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Voltar para Visão Geral
            </button>
            <MyDeskPanel onOpenProcess={handleOpenProcess} />
          </>
        );
      
      case 'OVERVIEW':
      default:
        return (
          <>
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-2">
                  <TrendingUp className="h-3 w-3" />
                  Mesa Técnica SODPA
                </span>
                <h2 className="text-2xl font-bold text-gray-900">Visão Geral Unificada</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${
                    showFilters 
                      ? 'border-blue-200 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </button>
                <button 
                  onClick={() => setShowRequestWizard(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Plus className="h-4 w-4" />
                  Novo Processo
                </button>
              </div>
            </div>

            {renderKPICards()}
            {renderTeamManagement()}
          </>
        );
    }
  };

  // If wizard is open, show it full-screen
  if (showRequestWizard) {
    return (
      <RequestWizard 
        onClose={() => setShowRequestWizard(false)}
        onSuccess={() => {
          setShowRequestWizard(false);
          // Refresh data would go here
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'PAINEL') setPanelView('OVERVIEW');
                }}
                className={`flex items-center gap-2 px-4 py-3.5 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'PAINEL' && renderPanelContent()}

        {activeTab === 'DIARIAS' && <GestaoDiariasPanel onOpenProcess={onOpenProcess} />}

        {activeTab === 'PASSAGENS' && <GestaoPassagensPanel onOpenProcess={onOpenProcess} />}

        {activeTab === 'RELATORIOS' && <RelatoriosPanel />}

        {activeTab === 'CONFIG' && <ConfiguracoesPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
          © 2026 Tribunal de Justiça do Estado do Pará. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

export default DashboardSODPA;

import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  FolderOpen,
  History,
  Send,
  BadgeCheck,
  Plus,
  Loader2
} from 'lucide-react';
import { useProcessDetails } from '../../hooks/useProcessDetails';
import { DetailsTab } from './Tabs/DetailsTab';
import { HistoryTab } from './Tabs/HistoryTab';
import { UniversalDossierPanel } from './UniversalDossierPanel';

type TabType = 'details' | 'dossier' | 'history';

interface UniversalProcessDetailsPageProps {
  processId: string;
  currentUserId: string;
  onClose: () => void;
  
  // Profile-specific permissions
  canEdit?: boolean;
  canTramitar?: boolean;
  canGenerateAtesto?: boolean;
  canCreateDocument?: boolean;
  
  // Loading states
  isLoadingAtesto?: boolean;
  
  // Profile-specific actions
  onTramitar?: () => void;
  onGenerateAtesto?: () => void;
  onCreateDocument?: () => void;
}

export const UniversalProcessDetailsPage: React.FC<UniversalProcessDetailsPageProps> = ({
  processId,
  currentUserId,
  onClose,
  canTramitar = false,
  canGenerateAtesto = false,
  canCreateDocument = false,
  isLoadingAtesto = false,
  onTramitar,
  onGenerateAtesto,
  onCreateDocument,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const { processData, isLoading, error } = useProcessDetails(processId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Carregando processo...</p>
        </div>
      </div>
    );
  }

  if (error || !processData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 shadow-xl max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Erro ao carregar</h2>
          <p className="text-slate-600 mb-6">Não foi possível carregar os detalhes do processo.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'details' as TabType, label: 'Detalhes', icon: FileText },
    { id: 'dossier' as TabType, label: 'Dossiê Digital', icon: FolderOpen },
    { id: 'history' as TabType, label: 'Histórico', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button + NUP */}
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all text-slate-700 font-bold text-sm"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Voltar</span>
              </button>
              
              <div className="border-l border-slate-300 pl-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">NUP</p>
                <p className="text-lg font-black text-slate-900">{processData.nup}</p>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-3">
              {canCreateDocument && onCreateDocument && (
                <button
                  onClick={onCreateDocument}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm transition-all"
                >
                  <Plus size={18} />
                  <span className="hidden md:inline">Novo Documento</span>
                </button>
              )}
              
              {canGenerateAtesto && onGenerateAtesto && (
                <button
                  onClick={onGenerateAtesto}
                  disabled={isLoadingAtesto}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold text-sm transition-all border border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingAtesto ? <Loader2 size={18} className="animate-spin" /> : <BadgeCheck size={18} />}
                  <span className="hidden md:inline">{isLoadingAtesto ? 'Gerando...' : 'Gerar Atesto'}</span>
                </button>
              )}
              
              {canTramitar && onTramitar && (
                <button
                  onClick={onTramitar}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg transition-all"
                >
                  <Send size={18} />
                  TRAMITAR
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all relative
                    ${isActive 
                      ? 'text-blue-600 bg-slate-50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon size={18} />
                  {tab.label}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'details' && <DetailsTab process={processData} />}
        
        {activeTab === 'dossier' && (
          <UniversalDossierPanel
            processId={processId}
            processData={processData}
            currentUserId={currentUserId}
          />
        )}
        
        {activeTab === 'history' && <HistoryTab processId={processId} />}
      </div>
    </div>
  );
};

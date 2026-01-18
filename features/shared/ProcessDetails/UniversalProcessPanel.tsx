import React, { useState, useEffect } from 'react';
import { 
  FileSearch, 
  FileCode, 
  FileText, 
  BookOpen, 
  Clock, 
  ArrowLeft,
  LayoutList,
  Zap,
  Plus,
  ArrowUpRight,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DocumentInventory, DocumentItem } from './DocumentInventory';
import { TimelineHistory } from '../TimelineHistory';

export type SubViewMode = 'DETAILS' | 'COVER' | 'REQUEST' | 'DOSSIER' | 'HISTORY';

interface UniversalProcessPanelProps {
  process: any;
  currentUserId: string;
  currentUserRole: string;
  subView: SubViewMode;
  onSubViewChange: (view: SubViewMode) => void;
  onBack: () => void;
  onCreateDocument: () => void;
  onTramitar: () => void;
  onEditProcess?: () => void;
  onDeleteProcess?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canTramitar?: boolean;
  children?: React.ReactNode; // For custom content in main area
}

export const UniversalProcessPanel: React.FC<UniversalProcessPanelProps> = ({
  process,
  currentUserId,
  currentUserRole,
  subView,
  onSubViewChange,
  onBack,
  onCreateDocument,
  onTramitar,
  onEditProcess,
  onDeleteProcess,
  canEdit = false,
  canDelete = false,
  canTramitar = true,
  children
}) => {
  const [dossierDocs, setDossierDocs] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [tramitacaoHistory, setTramitacaoHistory] = useState<any[]>([]);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // Fetch dossier documents
  const fetchDossierDocs = async () => {
    if (!process?.id) return;
    setIsLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('solicitacao_id', process.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (data) setDossierDocs(data);
    } catch (error) {
      console.error('Error fetching dossier docs:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Fetch tramitacao history
  const fetchTramitacaoHistory = async () => {
    if (!process?.id) return;
    try {
      const { data, error } = await supabase
        .from('historico_tramitacao')
        .select('*')
        .eq('solicitacao_id', process.id)
        .order('data_tramitacao', { ascending: false });
      
      if (error) throw error;
      if (data) setTramitacaoHistory(data);
    } catch (err) {
      console.error('Error fetching tramitacao history:', err);
    }
  };

  // Fetch on mount and subView change
  useEffect(() => {
    if (subView === 'DOSSIER') {
      fetchDossierDocs();
    } else if (subView === 'HISTORY') {
      fetchTramitacaoHistory();
    }
  }, [subView, process?.id]);

  const handleViewDocument = (doc: DocumentItem) => {
    setViewingDoc(doc);
  };

  const handleEditDocument = (doc: DocumentItem) => {
    setEditingDoc(doc);
  };

  const getProcessNup = () => process?.nup || process?.protocolNumber || 'N/A';

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden animate-in fade-in">
      {/* Sidebar - Árvore do Processo */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <LayoutList size={14} /> Árvore do Processo
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => onSubViewChange('DETAILS')} 
              className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${
                subView === 'DETAILS' 
                  ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <FileSearch size={18} /> Detalhes do Processo
            </button>
            
            <div className="h-px bg-slate-100 my-4"></div>
            
            <button 
              onClick={() => onSubViewChange('DOSSIER')} 
              className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                subView === 'DOSSIER' 
                  ? 'bg-slate-900 text-white shadow-xl' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <BookOpen size={18} /> Dossiê Digital
            </button>
            
            <button 
              onClick={() => onSubViewChange('HISTORY')} 
              className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${
                subView === 'HISTORY' 
                  ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Clock size={18} /> Histórico / Auditoria
            </button>
          </div>
        </div>
        
        <div className="p-8 mt-auto">
          <button 
            onClick={onBack} 
            className="w-full py-5 bg-slate-100 text-slate-600 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Voltar ao Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8 bg-[#f1f5f9]">
        {/* Header Bar */}
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[32px] shadow-2xl border border-white flex flex-col md:flex-row items-center justify-between sticky top-0 z-[100] gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Zap size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                SCS • {getProcessNup()}
              </span>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                Painel de Controle
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100/50 p-2 rounded-2xl border border-slate-200/50">
            <button 
              onClick={() => onSubViewChange('DETAILS')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                subView === 'DETAILS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              <FileSearch size={14} /> Detalhes
            </button>
            
            <button 
              onClick={onCreateDocument} 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/50 transition-all"
            >
              <Plus size={14} /> Novo
            </button>
            
            {canTramitar && (
              <button 
                onClick={onTramitar} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/50 transition-all"
              >
                <ArrowUpRight size={14} /> Tramitar
              </button>
            )}

            {/* Conditional Edit/Delete */}
            {(canEdit || canDelete) && (
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
            )}
            
            {canEdit && onEditProcess && (
              <button 
                onClick={onEditProcess}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-200"
              >
                <Edit size={14} /> Editar
              </button>
            )}
            
            {canDelete && onDeleteProcess && (
              <button 
                onClick={onDeleteProcess}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 transition-all border border-red-200"
              >
                <Trash2 size={14} /> Excluir
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {subView === 'DOSSIER' && (
          <DocumentInventory
            documents={dossierDocs}
            currentUserId={currentUserId}
            processId={process?.id}
            onRefresh={fetchDossierDocs}
            onViewDocument={handleViewDocument}
            onEditDocument={handleEditDocument}
          />
        )}

        {subView === 'HISTORY' && (
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl">
              <h2 className="text-2xl font-black tracking-tight">Histórico / Auditoria</h2>
              <p className="text-slate-400 text-sm mt-1">Registro completo de tramitações e alterações.</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <TimelineHistory events={tramitacaoHistory} />
            </div>
          </div>
        )}

        {/* Custom content for other views */}
        {children && subView !== 'DOSSIER' && subView !== 'HISTORY' && children}

        {/* Document Viewer Modal */}
        {viewingDoc && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800">{viewingDoc.titulo || viewingDoc.nome}</h3>
                <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-slate-100 rounded-lg">✕</button>
              </div>
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-serif text-slate-700 leading-relaxed">
                  {viewingDoc.conteudo || 'Sem conteúdo disponível'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  FileText, 
  FileCheck, 
  FileCode, 
  Gavel, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  FileDown,
  Loader2,
  User,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';

export interface DocumentItem {
  id: string;
  nome?: string;
  titulo?: string;
  tipo: string;
  status: string;
  conteudo?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

interface DocumentInventoryProps {
  documents: DocumentItem[];
  currentUserId: string;
  processId: string;
  onRefresh: () => void;
  onViewDocument: (doc: DocumentItem) => void;
  onEditDocument: (doc: DocumentItem) => void;
  onViewStaticDocument?: (type: 'COVER' | 'REQUEST') => void;
}

export const DocumentInventory: React.FC<DocumentInventoryProps> = ({
  documents,
  currentUserId,
  processId,
  onRefresh,
  onViewDocument,
  onEditDocument,
  onViewStaticDocument
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const { showToast } = useToast();

  const getDocumentIcon = (tipo: string) => {
    switch (tipo) {
      case 'CERTIDAO':
      case 'CERTIDAO_ATESTO':
        return <FileCheck size={20} />;
      case 'DECISAO':
        return <Gavel size={20} />;
      case 'DESPACHO':
        return <FileCode size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'CERTIDAO':
      case 'CERTIDAO_ATESTO':
        return 'bg-emerald-50 text-emerald-600';
      case 'DECISAO':
        return 'bg-red-50 text-red-600';
      case 'DESPACHO':
        return 'bg-blue-50 text-blue-600';
      case 'OFICIO':
        return 'bg-indigo-50 text-indigo-600';
      case 'MEMORANDO':
        return 'bg-amber-50 text-amber-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const isOwner = (doc: DocumentItem) => doc.created_by === currentUserId;

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      const docToDelete = documents.find(d => d.id === docId);
      
      // Log to audit trail
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('historico_documentos').insert({
        documento_id: docId,
        acao: 'DELETE',
        usuario_id: user?.id,
        usuario_nome: user?.email,
        dados_anteriores: docToDelete
      });

      // Delete the document
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      showToast({ type: 'success', title: 'Documento excluído', message: 'O documento foi removido do dossiê.' });
      onRefresh();
    } catch (error) {
      console.error('Error deleting document:', error);
      showToast({ type: 'error', title: 'Erro ao excluir', message: 'Não foi possível excluir o documento.' });
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  // Add static pieces (Capa and Requerimento)
  const staticPieces = [
    { id: 'static-cover', num: '01', title: 'CAPA DO PROCESSO', desc: 'Identificação oficial do protocolo e metadados estruturais.', isStatic: true },
    { id: 'static-request', num: '02', title: 'REQUERIMENTO INICIAL', desc: 'Justificativa e plano de aplicação assinado digitalmente.', isStatic: true }
  ];

  return (
    <div className="space-y-6">
      {/* Document List - with scroll for many documents */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {/* Static Pieces */}
        {staticPieces.map((piece) => (
          <div 
            key={piece.id}
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">FLS.</span>
                  <p className="text-2xl font-black text-slate-300">{piece.num}</p>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">{piece.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{piece.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onViewStaticDocument?.(piece.id === 'static-cover' ? 'COVER' : 'REQUEST')}
                  className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600"
                  title="Visualizar"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Dynamic Documents */}
        {documents.map((doc, idx) => (
          <div 
            key={doc.id}
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">FLS.</span>
                  <p className="text-2xl font-black text-slate-300">{String(idx + 3).padStart(2, '0')}</p>
                </div>
                <div className={`p-3 rounded-xl ${getTypeColor(doc.tipo)}`}>
                  {getDocumentIcon(doc.tipo)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      {doc.titulo || doc.nome || 'Documento'}
                    </h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      doc.status === 'ASSINADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {doc.status || 'MINUTA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {isOwner(doc) && (
                      <span className="flex items-center gap-1 text-blue-500 font-bold">
                        <User size={12} /> Você criou
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onViewDocument(doc)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500"
                  title="Visualizar"
                >
                  <Eye size={16} />
                </button>
                
                {/* Edit - only for owner */}
                {isOwner(doc) && (
                  <button 
                    onClick={() => onEditDocument(doc)}
                    className="p-2 bg-amber-50 hover:bg-amber-100 rounded-lg text-amber-600"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                )}
                
                {/* Delete - only for owner */}
                {isOwner(doc) && (
                  <>
                    {showDeleteConfirm === doc.id ? (
                      <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          disabled={deletingId === doc.id}
                          className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
                          title="Confirmar exclusão"
                        >
                          {deletingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(null)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500"
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowDeleteConfirm(doc.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Delete Confirmation Overlay */}
            {showDeleteConfirm === doc.id && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                <AlertTriangle size={20} className="text-red-500" />
                <span className="text-sm font-bold text-red-700 flex-1">Confirmar exclusão deste documento?</span>
              </div>
            )}
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-slate-600">Nenhum documento anexado</p>
            <p className="text-xs mt-1">Clique em "+ NOVO" para adicionar documentos ao dossiê</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// DossieDigital - Árvore de documentos do processo
// Exibe e gerencia todos documentos criados durante o ciclo de vida do processo
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  FileText,
  FilePlus,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Pencil,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';

// Document types
export const DOCUMENT_TYPES = [
  { id: 'DESPACHO', label: 'Despacho', description: 'Encaminhamento ou decisão administrativa', icon: '📋' },
  { id: 'PORTARIA', label: 'Portaria', description: 'Ato normativo ou autorização', icon: '📜' },
  { id: 'OFICIO', label: 'Ofício', description: 'Comunicação oficial externa', icon: '✉️' },
  { id: 'MEMORANDO', label: 'Memorando', description: 'Comunicação interna', icon: '📝' },
  { id: 'MINUTA', label: 'Minuta', description: 'Rascunho para revisão', icon: '📄' },
  { id: 'DECISAO', label: 'Decisão', description: 'Deliberação final', icon: '⚖️' }
];

export interface SODPADocument {
  id: string;
  request_id: string;
  tipo: string;
  titulo: string;
  conteudo?: string;
  numero_sequencial?: string;
  assinado: boolean;
  assinado_por?: string;
  data_assinatura?: string;
  origem_modulo?: string;
  destino_modulo?: string;
  created_at: string;
  created_by?: string;
  // Joined fields
  assinado_por_nome?: string;
  created_by_nome?: string;
}

interface DossieDigitalProps {
  requestId: string;
  onNewDocument?: () => void;
  onViewDocument?: (doc: SODPADocument) => void;
  readOnly?: boolean;
}

export function DossieDigital({ 
  requestId, 
  onNewDocument, 
  onViewDocument,
  readOnly = false 
}: DossieDigitalProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<SODPADocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});

  // Fetch documents
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('sodpa_documents')
        .select(`
          *,
          assinado_por_profile:profiles!sodpa_documents_assinado_por_fkey(nome),
          created_by_profile:profiles!sodpa_documents_created_by_fkey(nome)
        `)
        .eq('request_id', requestId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const normalized = (data || []).map(d => ({
        ...d,
        assinado_por_nome: d.assinado_por_profile?.nome,
        created_by_nome: d.created_by_profile?.nome
      }));

      setDocuments(normalized);

      // Auto-expand types with documents
      const typesWithDocs = [...new Set(normalized.map(d => d.tipo))];
      const expanded: Record<string, boolean> = {};
      typesWithDocs.forEach(t => expanded[t] = true);
      setExpandedTypes(expanded);
    } catch (err) {
      console.error('[DossieDigital] Error fetching documents:', err);
      setError('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchDocuments();
    }
  }, [requestId]);

  const toggleType = (tipo: string) => {
    setExpandedTypes(prev => ({ ...prev, [tipo]: !prev[tipo] }));
  };

  const getDocsByType = (tipo: string) => {
    return documents.filter(d => d.tipo === tipo);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeConfig = (tipo: string) => {
    return DOCUMENT_TYPES.find(t => t.id === tipo) || { 
      id: tipo, 
      label: tipo, 
      description: '', 
      icon: '📄' 
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FolderOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Dossiê Digital</h3>
            <p className="text-xs text-gray-500">{documents.length} documento(s)</p>
          </div>
        </div>
        {!readOnly && onNewDocument && (
          <button
            onClick={onNewDocument}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
          >
            <FilePlus size={16} />
            Novo Documento
          </button>
        )}
      </div>

      {/* Document Tree */}
      <div className="p-4">
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum documento no dossiê</p>
            {!readOnly && onNewDocument && (
              <button
                onClick={onNewDocument}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Criar primeiro documento
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {DOCUMENT_TYPES.map(docType => {
              const docs = getDocsByType(docType.id);
              if (docs.length === 0) return null;

              const isExpanded = expandedTypes[docType.id];

              return (
                <div key={docType.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  {/* Type Header */}
                  <button
                    onClick={() => toggleType(docType.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{docType.icon}</span>
                      <span className="font-semibold text-gray-800">{docType.label}</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {docs.length}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {/* Documents List */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {docs.map(doc => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{doc.titulo}</span>
                                {doc.numero_sequencial && (
                                  <span className="text-xs font-mono text-gray-500">
                                    Nº {doc.numero_sequencial}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{formatDate(doc.created_at)}</span>
                                {doc.created_by_nome && (
                                  <>
                                    <span>•</span>
                                    <span>por {doc.created_by_nome}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Signature status */}
                            {doc.assinado ? (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                <CheckCircle size={12} />
                                Assinado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                <Clock size={12} />
                                Pendente
                              </span>
                            )}
                            {/* Actions */}
                            <button
                              onClick={() => onViewDocument?.(doc)}
                              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                              title="Visualizar"
                            >
                              <Eye size={16} className="text-gray-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DossieDigital;

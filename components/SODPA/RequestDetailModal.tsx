// ============================================================================
// RequestDetailModal - Modal para visualizar detalhes da solicitação
// Usado tanto pelo servidor quanto pelos analistas SODPA
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Plane,
  User,
  Building,
  Phone,
  Mail,
  FileText,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  ArrowRight,
  CreditCard,
  History,
  Folder,
  Paperclip,
  Download,
  Eye,
  Loader2,
  Plus
} from 'lucide-react';
import { TimelineHistory } from '../TimelineHistory';
import { supabase } from '../../lib/supabaseClient';

interface DocumentAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  created_at: string;
}

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    tipo: 'DIARIA' | 'PASSAGEM';
    status: string;
    nup?: string;
    solicitante_nome: string;
    solicitante_email: string;
    solicitante_cpf?: string;
    solicitante_matricula?: string;
    solicitante_cargo?: string;
    solicitante_lotacao?: string;
    solicitante_municipio?: string;
    solicitante_telefone?: string;
    gestor_nome?: string;
    gestor_email?: string;
    banco?: string;
    agencia?: string;
    conta_corrente?: string;
    tipo_destino: string;
    origem: string;
    destino: string;
    data_inicio: string;
    data_fim: string;
    dias: number;
    motivo?: string;
    valor_total?: number;
    assinatura_digital?: boolean;
    data_assinatura?: string;
    destino_atual?: string;
    created_at: string;
  } | null;
  onTramitar?: () => void;
  onNovoDocumento?: () => void;
  showActions?: boolean; // true for SODPA analysts, false for requester view
}

type TabType = 'detalhes' | 'historico' | 'dossie';

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onTramitar,
  onNovoDocumento,
  showActions = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('detalhes');
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Fetch documents when switching to dossie tab or when request changes
  const fetchDocuments = useCallback(async () => {
    if (!request?.id) return;
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from('sodpa_attachments')
        .select('*')
        .eq('request_id', request.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, [request?.id]);

  useEffect(() => {
    if (activeTab === 'dossie') {
      fetchDocuments();
    }
  }, [activeTab, fetchDocuments]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  if (!isOpen || !request) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any }> = {
      'NOVO': { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
      'ENVIADO': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Send },
      'EM_ANALISE': { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      'APROVADO': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      'REJEITADO': { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
      'CONCLUIDO': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
    };
    return configs[status] || configs['NOVO'];
  };

  const getDestinoLabel = (destino: string) => {
    const labels: Record<string, string> = {
      'SODPA': 'Mesa SODPA',
      'SEFIN': 'SEFIN (Autorização)',
      'SGP': 'SGP (Autorização)',
      'PRESIDENCIA': 'Presidência (Autorização)',
      'RASCUNHO': 'Rascunho'
    };
    return labels[destino] || destino;
  };

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              {request.tipo === 'DIARIA' ? (
                <Calendar className="h-6 w-6 text-white" />
              ) : (
                <Plane className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {request.tipo === 'DIARIA' ? 'Solicitação de Diária' : 'Solicitação de Passagem'}
              </h2>
              <p className="text-blue-100 text-sm">
                {request.nup || `ID: ${request.id.slice(0, 8)}...`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon size={16} />
              {request.status.replace(/_/g, ' ')}
            </span>
            {request.destino_atual && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <ArrowRight size={14} />
                {getDestinoLabel(request.destino_atual)}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            Criado em {formatDate(request.created_at)}
          </span>
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 border-b border-gray-200 bg-white flex gap-1">
          <button
            onClick={() => setActiveTab('detalhes')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'detalhes' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <FileText size={14} />
            Detalhes
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'historico' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <History size={14} />
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('dossie')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'dossie' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Folder size={14} />
            Dossiê Digital
            {documents.length > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {documents.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'historico' ? (
            <TimelineHistory processId={request.id} />
          ) : activeTab === 'dossie' ? (
            <div className="space-y-4">
              {/* Header with Add button */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Folder className="text-blue-600" size={20} />
                  Dossiê Digital
                </h3>
                {onNovoDocumento && (
                  <button
                    onClick={onNovoDocumento}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Novo Documento
                  </button>
                )}
              </div>

              {/* Document List */}
              {loadingDocs ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
                  <p className="text-sm text-gray-500 mt-2">Carregando documentos...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Paperclip className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-3 font-medium">Nenhum documento anexado</p>
                  <p className="text-gray-400 text-sm">Clique em "Novo Documento" para adicionar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FileText className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{doc.file_name}</p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${doc.file_path}`, '_blank')}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${doc.file_path}`;
                            link.download = doc.file_name;
                            link.click();
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
          <>
          {/* Trip Info Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              Informações da Viagem
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Origem</span>
                <span className="font-semibold text-gray-800">{request.origem}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Destino</span>
                <span className="font-semibold text-gray-800">{request.destino}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Data Início</span>
                <span className="font-semibold text-gray-800">{formatDate(request.data_inicio)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Data Fim</span>
                <span className="font-semibold text-gray-800">{formatDate(request.data_fim)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Duração</span>
                <span className="font-semibold text-gray-800">{request.dias} dia{request.dias > 1 ? 's' : ''}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Tipo de Destino</span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                  request.tipo_destino === 'ESTADO' ? 'bg-green-100 text-green-700' :
                  request.tipo_destino === 'PAIS' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {request.tipo_destino === 'ESTADO' ? 'No Estado' : 
                   request.tipo_destino === 'PAIS' ? 'Fora do Estado' : 'Exterior'}
                </span>
              </div>
            </div>
            {request.motivo && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <span className="text-xs text-gray-500 block mb-1">Motivo</span>
                <p className="text-gray-700">{request.motivo}</p>
              </div>
            )}
          </div>

          {/* Requester Info */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              <User size={16} className="text-indigo-600" />
              Dados do Solicitante
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="text-gray-800 font-medium">{request.solicitante_nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <span className="text-gray-600 text-sm">{request.solicitante_email}</span>
              </div>
              {request.solicitante_cargo && (
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="text-gray-400" />
                  <span className="text-gray-600 text-sm">{request.solicitante_cargo}</span>
                </div>
              )}
              {request.solicitante_lotacao && (
                <div className="flex items-center gap-2">
                  <Building size={14} className="text-gray-400" />
                  <span className="text-gray-600 text-sm">{request.solicitante_lotacao}</span>
                </div>
              )}
              {request.solicitante_telefone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-600 text-sm">{request.solicitante_telefone}</span>
                </div>
              )}
              {request.solicitante_matricula && (
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" />
                  <span className="text-gray-600 text-sm">Mat. {request.solicitante_matricula}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bank Info */}
          {(request.banco || request.agencia || request.conta_corrente) && (
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-amber-600" />
                Dados Bancários
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {request.banco && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Banco</span>
                    <span className="font-medium text-gray-800">{request.banco}</span>
                  </div>
                )}
                {request.agencia && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Agência</span>
                    <span className="font-medium text-gray-800">{request.agencia}</span>
                  </div>
                )}
                {request.conta_corrente && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Conta</span>
                    <span className="font-medium text-gray-800">{request.conta_corrente}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signature Info */}
          {request.assinatura_digital && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 flex items-center gap-3">
              <CheckCircle className="text-green-600" size={20} />
              <div>
                <span className="font-semibold text-green-800">Assinado Digitalmente</span>
                {request.data_assinatura && (
                  <span className="text-green-600 text-sm ml-2">
                    em {formatDate(request.data_assinatura)}
                  </span>
                )}
              </div>
            </div>
          )}
          </>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            {onNovoDocumento && (
              <button
                onClick={onNovoDocumento}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2"
              >
                <FileText size={16} />
                Novo Documento
              </button>
            )}
            {onTramitar && (
              <button
                onClick={onTramitar}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
              >
                <Send size={16} />
                Tramitar
              </button>
            )}
          </div>
        )}

        {/* Close button for requester view */}
        {!showActions && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetailModal;

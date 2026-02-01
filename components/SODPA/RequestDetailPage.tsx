import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  History,
  Folder,
  Plus,
  MapPin,
  Calendar,
  Plane,
  CreditCard,
  User,
  Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';
import { TimelineHistory } from '../TimelineHistory';
import { DocumentFactoryModal } from './Documents/DocumentFactoryModal';
import { DossierDigitalPanel } from './Dossier/DossierDigitalPanel';
import { DocumentPreviewModal } from './Documents/DocumentPreviewModal';
import { CapaProcessoTemplate } from './Documents/Templates/CapaProcessoTemplate';
import { RequerimentoTemplate } from './Documents/Templates/RequerimentoTemplate';

interface RequestDetailPageProps {
  request: any;
  onBack: () => void;
  onTramitar?: () => void;
}

type TabType = 'detalhes' | 'historico' | 'dossie';

export const RequestDetailPage: React.FC<RequestDetailPageProps> = ({
  request,
  onBack,
  onTramitar
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('detalhes');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [showDocumentFactory, setShowDocumentFactory] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);

  const handleViewDocument = async (doc: any) => {
    if (doc.file_type === 'AUTO_CAPA' || doc.file_type === 'AUTO_REQ') {
      setViewingDocument(doc);
    } else {
      try {
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.file_path, 60); // 60 seconds valid
          
        if (error) throw error;
        window.open(data.signedUrl, '_blank');
      } catch (err) {
        console.error('Error opening document:', err);
        showToast({ type: 'error', title: 'Erro ao abrir', message: 'Não foi possível gerar link seguro.' });
      }
    }
  };

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!request?.id) return;
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from('sodpa_attachments')
        .select('*')
        .eq('request_id', request.id)
        .select('*')
        .eq('request_id', request.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, [request?.id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
  }, []);

  useEffect(() => {
    if (activeTab === 'dossie') {
      fetchDocuments();
    }
  }, [activeTab, fetchDocuments]);

  // Handle new document creation
  const handleSaveDocument = async (docType: string, content: string) => {
    try {
      // 1. Generate PDF (Mocked as text file for now since we don't have a real PDF generator in this context)
      // In a real app, this would call an Edge Function to generate the PDF
      const blob = new Blob([content], { type: 'text/plain' });
      const fileName = `TJPA-${docType}-${new Date().getTime()}.txt`;
      const filePath = `sodpa/${request.id}/${fileName}`;

      // 2. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // 3. Save reference
      const { error: dbError } = await supabase
        .from('sodpa_attachments')
        .insert({
          request_id: request.id,
          file_name: fileName.replace('.txt', '.pdf'), // Pretend it's a PDF for the UI
          file_path: filePath,
          file_size: blob.size,
          file_type: docType,
          created_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      showToast({
        type: 'success',
        title: 'Documento Criado',
        message: `${docType} anexado ao dossiê com sucesso.`
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error creating document:', error);
      showToast({
        type: 'error',
        title: 'Erro ao criar documento',
        message: error.message
      });
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (!currentUser) return;
    if (!window.confirm(`Tem certeza que deseja excluir o documento "${doc.file_name}"?`)) return;

    try {
      // 1. Soft Delete
      const { error: deleteError } = await supabase
        .from('sodpa_attachments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', doc.id);

      if (deleteError) throw deleteError;

      // 2. Audit Log (Historico)
      const { error: auditError } = await supabase
        .from('historico_tramitacao')
        .insert({
          solicitacao_id: request.id,
          origem: 'SODPA', // Contexto atual
          destino: 'SODPA', // Mantém contexto
          status_anterior: request.status,
          status_novo: request.status, // Status não muda
          observacao: `DOCUMENTO EXCLUÍDO: ${doc.file_name}`,
          tramitado_por: currentUser.id,
          tramitado_por_nome: currentUser.email
        });

      if (auditError) console.error('Error logging audit:', auditError);

      showToast({
        type: 'success',
        title: 'Documento Excluído',
        message: 'Registro removido e auditoria atualizada.'
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      showToast({
        type: 'error',
        title: 'Erro ao excluir',
        message: error.message
      });
    }
  };

  const handleDownloadConsolidated = async () => {
    showToast({ type: 'info', title: 'Gerando PDF...', message: 'Aguarde enquanto renderizamos todos os documentos.' });
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstPage = true;

      // Create temporary container for rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      document.body.appendChild(tempContainer);

      // Function to render React component to canvas
      const renderComponentToCanvas = async (Component: React.FC<any>, props: any) => {
        const ReactDOM = await import('react-dom/client');
        const root = ReactDOM.createRoot(tempContainer);
        
        // Render component
        await new Promise<void>((resolve) => {
          root.render(React.createElement(Component, props));
          setTimeout(resolve, 500); // Wait for rendering
        });

        // Capture canvas
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          logging: false,
          useCORS: true
        });

        root.unmount();
        return canvas;
      };

      // 1. Capa
      const capaCanvas = await renderComponentToCanvas(CapaProcessoTemplate, { request });
      if (!isFirstPage) pdf.addPage();
      pdf.addImage(capaCanvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      isFirstPage = false;

      // 2. Requerimento
      const reqCanvas = await renderComponentToCanvas(RequerimentoTemplate, { request });
      if (!isFirstPage) pdf.addPage();
      pdf.addImage(reqCanvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);

      // 3. Attachments List
      const attachmentDocs = documents.filter(d => d.file_type !== 'AUTO_CAPA' && d.file_type !== 'AUTO_REQ');
      if (attachmentDocs.length > 0) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('ÍNDICE DE ANEXOS', 105, 20, { align: 'center' });
        pdf.setFontSize(11);
        attachmentDocs.forEach((d, i) => {
          const y = 40 + (i * 8);
          pdf.text(`${i+1}. ${d.file_name}`, 20, y);
          pdf.setFontSize(9);
          pdf.setTextColor(100);
          pdf.text(`(${(d.file_size/1024).toFixed(1)} KB)`, 25, y + 4);
          pdf.setTextColor(0);
          pdf.setFontSize(11);
        });
      }

      // Cleanup
      document.body.removeChild(tempContainer);

      // Save
      pdf.save(`Dossie_Consolidado_${request.nup || request.id.slice(0,8)}.pdf`);
      showToast({ type: 'success', title: 'PDF Gerado', message: 'Download concluído com sucesso.' });
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao gerar PDF. Verifique o console.' });
    }
  };

  const statusColors = {
    'NOVO': 'bg-gray-100 text-gray-700',
    'ENVIADO': 'bg-blue-100 text-blue-700',
    'EM_ANALISE': 'bg-amber-100 text-amber-700',
    'APROVADO': 'bg-green-100 text-green-700',
    'CONCLUIDO': 'bg-emerald-100 text-emerald-700',
    'REJEITADO': 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Header / Navbar Replacement */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-blue-600 text-white p-2 rounded-lg">
                {request.tipo === 'PASSAGEM' ? <Plane size={20} /> : <Calendar size={20} />}
              </span>
              <h1 className="text-xl font-bold text-gray-900">
                Solicitação de {request.tipo === 'PASSAGEM' ? 'Passagem' : 'Diária'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-[52px]">
              ID: {request.id}
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`px-4 py-2 rounded-full font-bold text-sm ${(statusColors as any)[request.status] || 'bg-gray-100'}`}>
          {request.status.replace(/_/g, ' ')}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
            
            {/* Tabs Header */}
            <div className="px-8 pt-8 pb-0 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('detalhes')}
                  className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'detalhes' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <FileText size={18} />
                  Detalhes
                </button>
                <button
                  onClick={() => setActiveTab('historico')}
                  className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'historico' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <History size={18} />
                  Histórico
                </button>
                <button
                  onClick={() => setActiveTab('dossie')}
                  className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'dossie' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Folder size={18} />
                  Dossiê Digital
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'dossie' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {documents.length + 1}
                  </span>
                </button>
              </div>

              {/* Action Buttons (Contextual) */}
              {activeTab === 'dossie' && (
                <div className="pb-3">
                  <button
                    onClick={() => setShowDocumentFactory(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5"
                  >
                    <Plus size={18} />
                    Novo Documento
                  </button>
                </div>
              )}
            </div>

            {/* Tab Content */}
            <div className="p-8 flex-1 bg-slate-50/50">
              
              {activeTab === 'detalhes' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Trip Info */}
                  <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <MapPin size={16} />
                        Dados da Viagem
                      </h3>
                      <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                         <div>
                            <label className="text-xs text-gray-400 font-semibold uppercase">Origem</label>
                            <p className="font-medium text-gray-900 text-lg">{request.origem}</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 font-semibold uppercase">Destino</label>
                            <p className="font-medium text-gray-900 text-lg">{request.destino}</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 font-semibold uppercase">Data Início</label>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                              <Calendar size={16} className="text-blue-500" />
                              {new Date(request.data_inicio).toLocaleDateString('pt-BR')}
                            </p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 font-semibold uppercase">Data Fim</label>
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                              <Calendar size={16} className="text-blue-500" />
                              {new Date(request.data_fim).toLocaleDateString('pt-BR')}
                            </p>
                         </div>
                      </div>
                    </section>
                    
                    <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <User size={16} />
                        Solicitante
                      </h3>
                      <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                         <div>
                            <label className="text-xs text-gray-400 font-semibold uppercase">Nome</label>
                            <p className="font-medium text-gray-900">{request.solicitante_nome}</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 font-semibold uppercase">E-mail</label>
                            <p className="font-medium text-gray-900">{request.solicitante_email}</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 font-semibold uppercase">Gestor Responsável</label>
                            <p className="font-medium text-gray-900">{request.gestor_nome || '-'}</p>
                         </div>
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Values & Bank */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
                      <h3 className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Valor Total Estimado</h3>
                      <p className="text-4xl font-black tracking-tight">
                        R$ {request.valor_total ? request.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </p>
                      <div className="mt-6 pt-6 border-t border-white/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-200 text-sm">Diárias ({request.dias} dias)</span>
                            <span className="font-bold">R$ ...</span>
                          </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CreditCard size={16} />
                        Dados Bancários
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm">Banco</span>
                            <span className="font-medium text-gray-900">{request.banco || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm">Agência</span>
                            <span className="font-medium text-gray-900">{request.agencia || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm">Conta</span>
                            <span className="font-medium text-gray-900">{request.conta_corrente || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'historico' && (
                <TimelineHistory processId={request.id} />
              )}

              {activeTab === 'dossie' && (
                <DossierDigitalPanel 
                  documents={documents}
                  isLoading={loadingDocs}
                  onView={handleViewDocument}
                  onDownload={(doc) => {
                     const link = document.createElement('a');
                     link.href = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${doc.file_path}`;
                     link.download = doc.file_name;
                     link.click();
                  }}
                  onDelete={handleDeleteDocument}
                  onDownloadConsolidated={handleDownloadConsolidated}
                  currentUserId={currentUser?.id}
                />
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Document Factory Modal */}
      <DocumentFactoryModal
        isOpen={showDocumentFactory}
        onClose={() => setShowDocumentFactory(false)}
        onSave={handleSaveDocument}
        protocolo={request.nup || `TJPA-REQ-${new Date().getFullYear()}-${request.id.slice(0, 4)}`}
      />

      {/* Document Preview Modal */}
      {viewingDocument && (
        <DocumentPreviewModal
          document={viewingDocument}
          request={request}
          onClose={() => setViewingDocument(null)}
        />
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { FileText, Eye, FileDown, BookOpen, Loader2 } from 'lucide-react';
import { useDossierData } from './hooks/useDossierData';
import { DocumentInventory } from './DocumentInventory';
import { StaticCover, StaticRequest } from './StaticDocuments';

interface ProcessData {
  id: string;
  nup?: string;
  tipo?: string;
  type?: string;
  valor_total?: number;
  value?: number;
  descricao?: string;
  description?: string;
  suprido_nome?: string;
  interested?: string;
  unidade?: string;
  unit?: string;
  date?: string;
  created_at?: string;
  data_inicio?: string;
  data_fim?: string;
  itens_despesa?: any[];
}

interface UniversalDossierPanelProps {
  processId: string;
  processData: ProcessData;
  currentUserId: string;
  onDocumentEdit?: (doc: any) => void;
}

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

export const UniversalDossierPanel: React.FC<UniversalDossierPanelProps> = ({
  processId,
  processData,
  currentUserId,
  onDocumentEdit,
}) => {
  const { dossierDocs, isLoading, refreshDocs, deleteDocument, updateDocument } = useDossierData({
    processId,
    currentUserId,
  });

  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleViewDocument = (doc: any) => {
    setSelectedPreviewDoc(doc);
    setShowPdfViewer(true);
  };

  const handleDeleteDocument = async (docId: string) => {
    const result = await deleteDocument(docId);
    if (result.success) {
      refreshDocs();
    }
  };

  const handleViewConsolidated = () => {
    setSelectedPreviewDoc(null);
    setShowPdfViewer(true);
  };

  // Build documents list for PDF
  const docsToRender = selectedPreviewDoc
    ? [selectedPreviewDoc]
    : [
        { id: '1', title: 'Capa do Processo', type: 'STATIC_CAPA' },
        { id: '2', title: 'Requerimento Inicial', type: 'STATIC_REQ' },
        ...dossierDocs.map((doc) => ({
          id: doc.id,
          title: doc.nome || doc.titulo || 'Documento Anexo',
          type: 'DYNAMIC',
          originalDoc: doc,
        })),
      ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500 pb-32">
      {/* Header with Actions */}
      <div className="bg-[#0f172a] rounded-[48px] p-10 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between relative overflow-hidden group gap-6">
        <div className="relative z-10">
          <h3 className="text-3xl font-black tracking-tighter">Inventário de Peças Processuais</h3>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Volume consolidado para auditoria e prestação de contas.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <button
            onClick={handleViewConsolidated}
            className="flex items-center gap-3 px-8 py-5 bg-white text-slate-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl"
          >
            <Eye size={18} />
            Visualizar PDF Consolidado
          </button>
          <button
            onClick={handleViewConsolidated}
            className="flex items-center gap-3 px-8 py-5 bg-white text-slate-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl"
          >
            <FileDown size={18} />
            Exportar PDF Consolidado
          </button>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <BookOpen size={200} />
        </div>
      </div>

      {/* Document Inventory */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : (
        <DocumentInventory
          documents={dossierDocs.filter(doc => 
            // Filter out auto-created static documents (Capa and Requerimento)
            // They only appear in PDF Consolidado, not in inventory
            !doc.nome?.includes('Capa do Processo') && 
            !doc.nome?.includes('CAPA DO PROCESSO') &&
            !doc.nome?.includes('Requerimento Inicial') &&
            !doc.nome?.includes('REQUERIMENTO INICIAL') &&
            !doc.titulo?.includes('Capa do Processo') &&
            !doc.titulo?.includes('CAPA DO PROCESSO') &&
            !doc.titulo?.includes('Requerimento Inicial') &&
            !doc.titulo?.includes('REQUERIMENTO INICIAL')
          )}
          currentUserId={currentUserId}
          processId={processId}
          onRefresh={refreshDocs}
          onViewDocument={handleViewDocument}
          onEditDocument={onDocumentEdit || (() => {})}
        />
      )}

      {/* PDF Viewer Modal */}
      {showPdfViewer && (
        <div
          id="pdf-modal-wrapper"
          className="fixed inset-0 z-[300] flex items-center justify-center p-6 md:p-10"
        >
          <div
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl no-print"
            onClick={() => setShowPdfViewer(false)}
          ></div>
          <div
            className="relative bg-[#333] w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95"
            id="pdf-print-root"
          >
            {/* Header */}
            <div className="p-4 bg-[#2a2a2a] border-b border-white/5 flex items-center justify-between shadow-2xl no-print">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-600 text-white rounded-lg shadow-lg">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                    {selectedPreviewDoc?.title || `Consolidado_${processData.nup}.pdf`}
                  </h3>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                    SISUP - Tribunal de Justiça do Pará
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-black/40 rounded-lg p-1 mr-4">
                  <button
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                    className="px-3 py-1 text-white hover:bg-white/10 rounded text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-bold text-white">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                    className="px-3 py-1 text-white hover:bg-white/10 rounded text-xs font-bold"
                  >
                    +
                  </button>
                </div>
                
                {/* Sign Document Button - Only for MINUTA documents created by current user */}
                {selectedPreviewDoc?.type === 'DYNAMIC' && 
                 selectedPreviewDoc?.originalDoc?.status === 'MINUTA' &&
                 selectedPreviewDoc?.originalDoc?.created_by === currentUserId && (
                  <button
                    onClick={async () => {
                      if (!selectedPreviewDoc?.originalDoc?.id) return;
                      
                      const result = await updateDocument(selectedPreviewDoc.originalDoc.id, {
                        status: 'ASSINADO'
                      });
                      
                      if (result.success) {
                        // Refresh to show signature
                        await refreshDocs();
                        setShowPdfViewer(false);
                        setTimeout(() => {
                          handleViewDocument(selectedPreviewDoc);
                        }, 300);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Assinar Documento
                  </button>
                )}
                
                <button
                  onClick={() => setShowPdfViewer(false)}
                  className="p-2 text-white/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* PDF Content */}
            <div
              id="pdf-scroll-container"
              className="flex-1 overflow-y-auto p-12 flex flex-col items-center gap-16 custom-scrollbar bg-[#525659] print:p-0 print:bg-white print:block"
            >
              <div
                id="pdf-content-container"
                className="flex flex-col gap-16 w-full items-center pb-24 transition-transform duration-200 ease-out print:w-full print:block print:p-0 print:gap-0"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              >
                {docsToRender.map((docItem, index) => (
                  <div
                    key={docItem.id}
                    className="w-[820px] bg-white shadow-2xl p-24 min-h-[1160px] flex flex-col text-[#000] font-sans relative border-t-8 border-slate-900 shrink-0 print-page"
                  >
                    {/* Unified Header (ONLY if NOT Capa) */}
                    {docItem.type !== 'STATIC_CAPA' && (
                      <div className="flex flex-col items-center justify-center mb-16 space-y-4">
                        <img src={BRASAO_TJPA_URL} alt="Brasão" className="w-20 opacity-90" />
                        <h1 className="text-lg font-bold text-slate-900 uppercase tracking-widest text-center">
                          TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ
                        </h1>
                      </div>
                    )}

                    {/* Render Content Based on Type */}
                    {docItem.type === 'STATIC_CAPA' ? (
                      <StaticCover processData={processData} />
                    ) : docItem.type === 'STATIC_REQ' ? (
                      <StaticRequest processData={processData} />
                    ) : (
                      <>
                        {/* Dynamic Document */}
                        <div className="text-center mb-12">
                          <h2 className="text-2xl font-black uppercase tracking-widest">
                            {docItem.title}
                          </h2>
                          <p className="text-sm text-slate-500 mt-2">{docItem.originalDoc?.tipo || 'DOCUMENTO'}</p>
                        </div>
                        <div className="w-full h-px bg-slate-900/20 mb-8"></div>
                        <div className="font-serif text-base leading-loose text-justify whitespace-pre-wrap">
                          {docItem.originalDoc?.conteudo || 'Conteúdo não disponível para visualização.'}
                        </div>


                        {/* Electronic Signature Section for Signed Documents */}
                        {docItem.type === 'DYNAMIC' && (() => {
                          console.log('🔍 DEBUG Signature:', {
                            status: docItem.originalDoc?.status,
                            profiles: docItem.originalDoc?.profiles,
                            created_by: docItem.originalDoc?.created_by,
                            doc: docItem.originalDoc
                          });
                          return true;
                        })() && docItem.originalDoc?.status === 'ASSINADO' && (
                          <div className="mt-16 pt-8 border-t-2 border-slate-200 break-inside-avoid">
                            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
                              <h5 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                ASSINATURA ELETRÔNICA CERTIFICADA
                              </h5>
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                                  OK
                                </div>
                                <div className="flex-1 space-y-2">
                                  <p className="text-base font-bold text-emerald-900 uppercase">
                                    {docItem.originalDoc?.profiles?.nome || 'Usuário do Sistema'}
                                  </p>
                                  <p className="text-xs text-emerald-700 mt-1">
                                    {docItem.originalDoc?.profiles?.cargo || 'Servidor'}
                                  </p>
                                  <div className="mt-3 text-[11px] font-medium text-emerald-800 space-y-1">
                                    <p>
                                      <strong>Data:</strong> {new Date(docItem.originalDoc.created_at).toLocaleDateString('pt-BR')} às {new Date(docItem.originalDoc.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p>
                                      <strong>Hash de Verificação:</strong> {docItem.originalDoc.id.substring(0, 16).toUpperCase()}...
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <p className="text-[9px] text-emerald-600 mt-4 leading-relaxed border-t border-emerald-200 pt-3">
                                A autenticidade deste documento pode ser conferida no sistema SISUP através do ID {docItem.originalDoc.id}. 
                                Assinado eletronicamente conforme MP 2.200-2/2001.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Footer for Digital Documents */}
                        <div className="text-center pt-12 mt-auto border-t border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest">
                          Documento gerado pelo Sistema SISUP - TJPA <br />
                          ID: {docItem.originalDoc?.id} • NUP: {processData.nup}
                        </div>
                      </>
                    )}

                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                      <img src={BRASAO_TJPA_URL} className="w-[500px] grayscale" alt="TJPA Watermark" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

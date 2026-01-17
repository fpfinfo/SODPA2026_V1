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
  const { dossierDocs, isLoading, refreshDocs, deleteDocument } = useDossierData({
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
          documents={dossierDocs}
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

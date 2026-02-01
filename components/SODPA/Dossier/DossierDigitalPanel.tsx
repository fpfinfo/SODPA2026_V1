import React, { useState } from 'react';
import { 
  FileText, 
  Eye, 
  Download, 
  Printer, 
  Loader2,
  AlertCircle,
  FileCheck,
  Trash2
} from 'lucide-react';

interface DossierDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
  type?: string;
  page_count?: number;
  created_by?: string;
}

interface DossierDigitalPanelProps {
  documents: DossierDocument[];
  isLoading: boolean;
  onView: (doc: DossierDocument) => void;
  onDownload: (doc: DossierDocument) => void;
  onDelete?: (doc: DossierDocument) => void;
  onDownloadConsolidated?: () => void;
  currentUserId?: string;
}

export const DossierDigitalPanel: React.FC<DossierDigitalPanelProps> = ({
  documents,
  isLoading,
  onView,
  onDownload,
  onDelete,
  onDownloadConsolidated,
  currentUserId
}) => {
  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Inventário de Peças Processuais</h2>
            <p className="text-slate-400 text-sm">Volume consolidado para auditoria e prestação de contas.</p>
          </div>
          
          <button 
            onClick={onDownloadConsolidated}
            className="flex items-center gap-3 px-6 py-3 bg-white text-slate-900 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Eye size={18} />
            VISUALIZAR PDF CONSOLIDADO
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
            <p className="text-gray-500 font-medium">Carregando processo eletrônico...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <FileText className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-500 font-bold mb-1">Processo Vazio</p>
            <p className="text-gray-400 text-sm">Nenhuma peça processual anexada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Dynamic Items */}
            {documents.map((doc, index) => (
              <div 
                key={doc.id}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center w-12 text-slate-300 font-mono">
                    <span className="text-[10px] font-bold uppercase tracking-wider">FLS.</span>
                    <span className="text-2xl font-black text-slate-200 group-hover:text-blue-500 transition-colors">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-slate-800 text-lg uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                        {doc.file_name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                      </h4>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                        ASSINADO
                      </span>
                      {doc.type === 'DESPACHO' && (
                         <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                         DESPACHO
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs font-medium mt-1">
                      {new Date(doc.created_at).toLocaleDateString('pt-BR')} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {/* Delete Button (Conditional) */}
                  {onDelete && currentUserId && doc.created_by === currentUserId && (
                    <button 
                      onClick={() => onDelete(doc)}
                      className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}

                   <button 
                    onClick={() => onDownload(doc)}
                    className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    title="Baixar"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => onView(doc)}
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

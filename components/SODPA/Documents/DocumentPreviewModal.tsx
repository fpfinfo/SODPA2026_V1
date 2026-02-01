import React from 'react';
import { X } from 'lucide-react';
import { CapaProcessoTemplate } from './Templates/CapaProcessoTemplate';
import { RequerimentoTemplate } from './Templates/RequerimentoTemplate';

interface DocumentPreviewModalProps {
  document: any;
  request: any;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  request,
  onClose
}) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{document.file_name}</h2>
            <p className="text-sm text-gray-500 mt-1">Documento Gerado Automaticamente</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden" style={{ minHeight: '842px' }}>
            {document.file_type === 'AUTO_CAPA' && (
              <CapaProcessoTemplate request={request} />
            )}
            {document.file_type === 'AUTO_REQ' && (
              <RequerimentoTemplate request={request} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

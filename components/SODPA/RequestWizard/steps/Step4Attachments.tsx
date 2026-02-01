import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, Upload, FileText, X, File, Image, Paperclip } from 'lucide-react';
import { AttachmentFile } from '../types';

interface Step4Props {
  value: AttachmentFile[];
  onChange: (files: AttachmentFile[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4Attachments: React.FC<Step4Props> = ({ value, onChange, onNext, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: AttachmentFile[] = [];
    
    Array.from(files).forEach(file => {
      const attachment: AttachmentFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
      newAttachments.push(attachment);
    });

    onChange([...value, ...newAttachments]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id: string) => {
    const attachment = value.find(a => a.id === id);
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    onChange(value.filter(a => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={24} className="text-green-500" />;
    if (type === 'application/pdf') return <FileText size={24} className="text-red-500" />;
    return <File size={24} className="text-gray-500" />;
  };

  return (
    <div className="py-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Anexos</h2>
        <p className="text-gray-500">Anexe documentos relevantes para a solicitação (opcional)</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Paperclip className="text-blue-600" size={20} />
          Documentos
        </h3>
        
        {/* Dropzone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload size={32} className="text-blue-600" />
          </div>
          <p className="text-gray-700 font-medium mb-1">Clique para selecionar arquivos</p>
          <p className="text-gray-500 text-sm">ou arraste e solte aqui</p>
          <p className="text-gray-400 text-xs mt-2">PDF, JPG, PNG (máx. 10MB por arquivo)</p>
          
          <input 
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File List */}
        {value.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-bold text-gray-600 uppercase">
              {value.length} arquivo{value.length > 1 ? 's' : ''} anexado{value.length > 1 ? 's' : ''}
            </p>
            
            {value.map(attachment => (
              <div 
                key={attachment.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                {/* Preview or Icon */}
                <div className="flex-shrink-0">
                  {attachment.preview ? (
                    <img 
                      src={attachment.preview} 
                      alt={attachment.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      {getFileIcon(attachment.type)}
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{attachment.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(attachment.size)}</p>
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(attachment.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        
        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          Próximo <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Step4Attachments;

import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, Loader2, File, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export interface DocumentoLiquidacaoFormData {
  file: File | null;
  file_path: string | null;
  file_url: string | null;
}

interface DocumentoLiquidacaoFormModalProps {
  onSubmit: (data: DocumentoLiquidacaoFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
  isOpen?: boolean;
  processData?: any;
  neData?: any;
}

export const DocumentoLiquidacaoFormModal: React.FC<DocumentoLiquidacaoFormModalProps> = ({ 
  onSubmit, 
  onClose, 
  isLoading = false,
  isOpen = true,
  processData
}) => {
  if (!isOpen) return null;

  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (selectedFile: File | undefined) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Selecione um arquivo PDF válido');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 10MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const processId = processData?.id || 'unknown';
      const path = `execution/${processId}/dl_${timestamp}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(path, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path);

      setFile(selectedFile);
      setFilePath(path);
      setFileUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async () => {
    if (filePath) {
      try {
        await supabase.storage.from('documentos').remove([filePath]);
      } catch (e) {
        console.error('Error removing file:', e);
      }
    }
    setFile(null);
    setFilePath(null);
    setFileUrl(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !filePath) {
      setError('Faça upload do PDF do Documento de Liquidação');
      return;
    }

    onSubmit({
      file,
      file_path: filePath,
      file_url: fileUrl
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-purple-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg text-white">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Anexar Documento de Liquidação</h3>
              <p className="text-xs text-slate-600">Faça upload do PDF exportado do SIAFE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading || isUploading}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Nova regra:</strong> O PDF do Documento de Liquidação deve ser exportado diretamente do <strong>SIAFE</strong> 
              (fonte da verdade). O SOSFU apenas armazena e gerencia assinaturas digitais.
            </p>
          </div>

          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              file 
                ? 'border-emerald-300 bg-emerald-50' 
                : error
                  ? 'border-red-300 bg-red-50'
                  : 'border-purple-300 bg-white hover:border-purple-400 hover:bg-purple-50'
            }`}
          >
            {file ? (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <p className="font-bold text-emerald-800">{file.name}</p>
                <p className="text-xs text-emerald-600">
                  {(file.size / 1024).toFixed(1)} KB • PDF pronto para registro
                </p>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <Trash2 size={14} />
                  Remover e escolher outro
                </button>
              </div>
            ) : isUploading ? (
              <div className="space-y-3">
                <Loader2 size={32} className="mx-auto text-purple-600 animate-spin" />
                <p className="text-sm text-slate-600">Fazendo upload...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                  <Upload size={32} className="text-purple-600" />
                </div>
                <p className="text-sm text-slate-700 font-medium mb-2">
                  Arraste o PDF do Documento de Liquidação aqui
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  ou clique para selecionar do seu computador
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  className="hidden"
                  id="dl-upload"
                  disabled={isUploading}
                />
                <label 
                  htmlFor="dl-upload" 
                  className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
                >
                  <File size={16} />
                  Selecionar PDF do SIAFE
                </label>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || isUploading}
              className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading || !file}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Anexar DL
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

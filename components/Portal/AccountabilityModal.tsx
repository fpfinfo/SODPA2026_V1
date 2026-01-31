import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface AccountabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSubmit: (requestId: string, files: File[], report: string) => Promise<void>;
}

export const AccountabilityModal: React.FC<AccountabilityModalProps> = ({
  isOpen,
  onClose,
  request,
  onSubmit
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!report.trim()) {
      setError('Por favor, descreva as despesas realizadas.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(request.id, files, report);
      onClose();
      setFiles([]);
      setReport('');
    } catch (err) {
      setError('Erro ao enviar prestação de contas. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Prestação de Contas</h2>
              <p className="text-sm text-gray-500">{request.nup}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Instruções</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Anexe os comprovantes de despesa (notas fiscais, recibos)</li>
                  <li>Descreva todas as despesas realizadas</li>
                  <li>Informe valores e justificativas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprovantes
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-orange-300 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Arraste arquivos ou clique para selecionar
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="text-sm text-orange-600 font-medium hover:underline cursor-pointer"
              >
                Selecionar arquivos
              </label>
            </div>
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relatório de Despesas *
            </label>
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              placeholder="Descreva todas as despesas realizadas, incluindo valores, datas e justificativas..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Enviar Prestação
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountabilityModal;

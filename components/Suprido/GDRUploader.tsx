import React, { useState, useRef } from 'react';
import {
  ExternalLink,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Loader2
} from 'lucide-react';

interface GDRUploaderProps {
  tipo: 'INSS' | 'SALDO';
  valorEsperado: number;
  numeroGDR?: string;
  arquivoNome?: string;
  arquivoUrl?: string;
  paga?: boolean;
  onUpload: (file: File, numeroGDR: string) => Promise<void>;
  onRemove?: () => void;
  disabled?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const GDR_PORTAL_URL = 'https://apps.tjpa.jus.br/gdr-publico/emissao-guia';

export const GDRUploader: React.FC<GDRUploaderProps> = ({
  tipo,
  valorEsperado,
  numeroGDR: initialNumero = '',
  arquivoNome,
  arquivoUrl,
  paga = false,
  onUpload,
  onRemove,
  disabled = false
}) => {
  const [numeroGDR, setNumeroGDR] = useState(initialNumero);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = {
    INSS: {
      title: 'GDR de INSS',
      subtitle: 'Recolhimento do imposto retido',
      description: 'Guia para recolher os 11% de INSS retidos dos prestadores de serviço pessoa física.',
      color: 'amber',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      textClass: 'text-amber-700',
      buttonClass: 'bg-amber-600 hover:bg-amber-700'
    },
    SALDO: {
      title: 'GDR de Devolução',
      subtitle: 'Recursos não utilizados',
      description: 'Guia para devolver ao TJPA os recursos não utilizados do adiantamento.',
      color: 'red',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200',
      textClass: 'text-red-700',
      buttonClass: 'bg-red-600 hover:bg-red-700'
    }
  }[tipo];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo: 10MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !numeroGDR.trim()) {
      setError('Preencha o número da GDR e selecione o arquivo');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile, numeroGDR.trim());
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
    }
  };

  // Se já foi paga/anexada, mostrar versão compacta
  if (paga && arquivoNome) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <div>
              <h4 className="font-black text-emerald-800 uppercase tracking-tight">
                {config.title}
              </h4>
              <p className="text-sm text-emerald-600">
                Nº {numeroGDR || initialNumero} • {formatCurrency(valorEsperado)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {arquivoUrl && (
              <a
                href={arquivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-200 transition-all"
              >
                <Eye size={16} />
                Visualizar
              </a>
            )}
            {onRemove && !disabled && (
              <button
                onClick={onRemove}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Remover"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${config.bgClass} border-2 ${config.borderClass} rounded-2xl p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${config.bgClass} border ${config.borderClass} rounded-xl flex items-center justify-center`}>
            <AlertTriangle size={24} className={config.textClass} />
          </div>
          <div>
            <h4 className={`text-lg font-black ${config.textClass} uppercase tracking-tight`}>
              {config.title}
            </h4>
            <p className="text-sm text-slate-500">{config.subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Valor esperado</p>
          <p className={`text-xl font-black ${config.textClass}`}>
            {formatCurrency(valorEsperado)}
          </p>
        </div>
      </div>

      {/* Descrição */}
      <p className="text-sm text-slate-600 mb-6">
        {config.description}
      </p>

      {/* Link para Portal */}
      <a
        href={GDR_PORTAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 w-full px-4 py-3 ${config.buttonClass} text-white rounded-xl text-sm font-bold transition-all mb-6`}
      >
        <ExternalLink size={18} />
        Emitir GDR no Portal TJPA
      </a>

      {/* Formulário de Upload */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Após emitir e pagar a GDR, anexe aqui:
        </p>

        {/* Número da GDR */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Número da GDR *
          </label>
          <input
            type="text"
            value={numeroGDR}
            onChange={(e) => setNumeroGDR(e.target.value)}
            disabled={disabled || isUploading}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            placeholder="Ex: 2026.00012345"
          />
        </div>

        {/* Upload do Comprovante */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Comprovante de Pagamento *
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="w-full p-6 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">
                Clique para selecionar o comprovante
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Aceitos: PDF, JPG, PNG (máx. 5MB)
              </p>
            </button>
          )}
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Botão Confirmar */}
        <button
          onClick={handleUpload}
          disabled={disabled || isUploading || !selectedFile || !numeroGDR.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Confirmar GDR Paga
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GDRUploader;

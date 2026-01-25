import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Trash2,
  Eye,
  RefreshCw,
  DollarSign,
  Calendar,
  Building2,
  Hash,
  FileSpreadsheet
} from 'lucide-react';
import { useComprovantes, ELEMENTOS_DESPESA, TIPOS_COMPROVANTE, ComprovanteMetadata, TipoComprovante, ElementoDespesa } from '../../hooks/useComprovantes';
import { useToast } from '../ui/ToastProvider';
import { useFornecedoresHistory } from '../../hooks/useFornecedoresHistory';
import { validateCNPJ, formatCNPJ, validateCPF, formatCPF } from '../../utils/validators';
import { Search, Printer, FilePlus, QrCode } from 'lucide-react';
import { ReciboTransporteModal } from '../Documents/ReciboTransporteModal';
import { BpeScanner } from '../Documents/BpeScanner';

// =============================================================================
// TYPES
// =============================================================================

interface ComprovantesUploaderProps {
  prestacaoId: string;
  nup?: string; // New prop for doc generation
  valorConcedido: number;
  readOnly?: boolean;
  onTotalChange?: (total: number) => void;
}

interface FormData {
  tipo: TipoComprovante;
  numero: string;
  serie: string;
  emitente: string;
  cnpj_cpf: string;
  valor: string;
  data_emissao: string;
  descricao: string;
  elemento_despesa: ElementoDespesa;
}

const initialFormData: FormData = {
  tipo: 'NOTA_FISCAL',
  numero: '',
  serie: '',
  emitente: '',
  cnpj_cpf: '',
  valor: '',
  data_emissao: '',
  descricao: '',
  elemento_despesa: '3.3.90.30'
};

// =============================================================================
// COMPONENT
// =============================================================================

export const ComprovantesUploader: React.FC<ComprovantesUploaderProps> = ({
  prestacaoId,
  nup = '0000000-00.0000.0.00.0000',
  valorConcedido,
  readOnly = false,
  onTotalChange
}) => {
  const { showToast } = useToast();
  const { suggestions, searchFornecedores, clearSuggestions } = useFornecedoresHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [showReciboModal, setShowReciboModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [cnpjError, setCnpjError] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const {
    comprovantes,
    isLoading,
    isUploading,
    uploadProgress,
    totalValor,
    totalGlosado,
    totalLiquido,
    porElemento,
    alertasCriticos,
    uploadComprovante,
    deleteComprovante,
    fetchComprovantes
  } = useComprovantes({ prestacaoId });

  // Fetch on mount
  React.useEffect(() => {
    fetchComprovantes();
  }, [fetchComprovantes]);

  // Notify parent of total changes
  React.useEffect(() => {
    onTotalChange?.(totalLiquido);
  }, [totalLiquido, onTotalChange]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setShowForm(true);

    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) return;

    const valorNumerico = parseFloat(formData.valor.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert('Informe um valor válido');
      return;
    }

    const metadata: ComprovanteMetadata = {
      tipo: formData.tipo,
      numero: formData.numero || undefined,
      serie: formData.serie || undefined,
      emitente: formData.emitente,
      cnpj_cpf: formData.cnpj_cpf || undefined,
      valor: valorNumerico,
      data_emissao: formData.data_emissao,
      descricao: formData.descricao || undefined,
      elemento_despesa: formData.elemento_despesa
    };

    const result = await uploadComprovante(selectedFile, metadata);

    if (result.success) {
      // Reset form
      setSelectedFile(null);
      setFormData(initialFormData);
      setShowForm(false);
      setPreviewUrl(null);
      setCnpjError(false);
      clearSuggestions();
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      showToast({ type: 'success', title: 'Comprovante anexado!', message: 'O documento foi salvo com sucesso.' });
    } else {
      showToast({ type: 'error', title: 'Erro', message: result.error || 'Erro ao enviar comprovante' });
    }
  }, [selectedFile, formData, uploadComprovante]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Remover este comprovante?')) return;
    await deleteComprovante(id);
  }, [deleteComprovante]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getSentinelaColor = (risk?: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-600 bg-emerald-50';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      default: return 'text-slate-400 bg-slate-50';
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Header com Totais */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[28px] p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black">Comprovantes de Despesa</h3>
              <p className="text-xs text-slate-400">{comprovantes.length} documento(s) anexado(s)</p>
            </div>
          </div>
          {alertasCriticos > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-xl">
              <AlertTriangle size={18} className="text-red-400" />
              <span className="text-sm font-bold">{alertasCriticos} Alerta(s) Crítico(s)</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Valor Concedido</p>
            <p className="text-xl font-black">{formatCurrency(valorConcedido)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Gasto</p>
            <p className="text-xl font-black text-blue-400">{formatCurrency(totalValor)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Glosas</p>
            <p className="text-xl font-black text-amber-400">{formatCurrency(totalGlosado)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Saldo Restante</p>
            <p className={`text-xl font-black ${valorConcedido - totalLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(valorConcedido - totalLiquido)}
            </p>
          </div>
        </div>
      </div>

      {/* Resumo por Elemento */}
      <div className="grid grid-cols-4 gap-3">
        {ELEMENTOS_DESPESA.map(el => {
          const data = porElemento[el.code] || { total: 0, count: 0 };
          return (
            <div key={el.code} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{el.code}</p>
              <p className="text-sm font-bold text-slate-700 truncate">{el.label}</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900">{formatCurrency(data.total)}</span>
                <span className="text-xs text-slate-400">{data.count} doc(s)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão de Upload e Novo Documento */}
      {!readOnly && !showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="py-6 border-2 border-dashed border-slate-200 rounded-[28px] hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              {isUploading ? (
                <>
                  <RefreshCw size={32} className="text-blue-500 animate-spin" />
                  <span className="text-sm font-bold text-blue-600">Enviando... {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <Upload size={32} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm font-bold text-slate-500 group-hover:text-blue-600">
                    Clique para anexar Nota Fiscal, Recibo ou Cupom
                  </span>
                  <span className="text-xs text-slate-400">PDF, JPEG ou PNG (máx. 10MB)</span>
                </>
              )}
            </button>

            {/* Gerador de Docs */}
            <button
              onClick={() => setShowReciboModal(true)}
              className="py-6 border-2 border-dashed border-slate-200 rounded-[28px] hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <FilePlus size={32} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-sm font-bold text-slate-500 group-hover:text-emerald-600">
                Emitir Recibo de Transporte
              </span>
              <span className="text-xs text-slate-400">Para Barqueiros e Locação de Veículos (Isento)</span>
            </button>
            
            {/* Leitor BP-e */}
            <button
              onClick={() => setShowScanner(true)}
              className="py-6 border-2 border-dashed border-slate-200 rounded-[28px] hover:border-purple-400 hover:bg-purple-50/50 transition-all flex flex-col items-center justify-center gap-2 group md:col-span-2"
            >
              <QrCode size={32} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
              <span className="text-sm font-bold text-slate-500 group-hover:text-purple-600">
                Ler QR Code Fiscal
              </span>
              <span className="text-xs text-slate-400">Passagens (BP-e) e Cupons (NFC-e)</span>
            </button>
        </div>
      )}

      {/* Recibo Modal */}
      <ReciboTransporteModal 
         isOpen={showReciboModal} 
         onClose={() => setShowReciboModal(false)} 
         nup={nup} 
      />
      
      {/* Scanner */}
      {showScanner && (
        <BpeScanner 
          onClose={() => setShowScanner(false)}
          onScanSuccess={(text) => {
             setShowScanner(false);
             // Create dummy proof file from QR data
             const blob = new Blob([`QR CODE CAPTURED DATA:\n${text}`], { type: 'text/plain' });
             const file = new File([blob], "bpe_qrcode_capture.txt", { type: "text/plain" });
             
             setSelectedFile(file);
             // Detect Type based on URL content (Heuristic)
             const lowerText = text.toLowerCase();
             let tipoDetectado: 'PASSAGEM' | 'CUPOM_FISCAL' | 'OUTROS' = 'OUTROS';
             let elementoDetectado: '3.3.90.33' | '3.3.90.30' | '3.3.90.39' = '3.3.90.39';
             let desc = 'Documento capturado via QR Code';

             if (lowerText.includes('bpe') || lowerText.includes('bilhete') || lowerText.includes('svrs')) {
                tipoDetectado = 'PASSAGEM';
                elementoDetectado = '3.3.90.33';
                desc = 'Bilhete de Passagem (BP-e)';
             } else if (lowerText.includes('nfce') || lowerText.includes('nfe') || lowerText.includes('fazenda') || lowerText.includes('sefa')) {
                tipoDetectado = 'CUPOM_FISCAL';
                elementoDetectado = '3.3.90.30';
                desc = 'Cupom Fiscal (NFC-e) - Consumo';
             }

             setFormData(prev => ({ 
               ...prev, 
               tipo: tipoDetectado, 
               elemento_despesa: elementoDetectado,
               descricao: desc,
               numero: text.length > 20 ? text.slice(0, 44) : text
             }));
             setShowForm(true);
             showToast({ 
               title: 'QR Code Fiscal Lido!', 
               message: `Identificado: ${tipoDetectado === 'PASSAGEM' ? 'Passagem' : 'Nota Fiscal/Cupom'}. Confirme os dados.`, 
               type: 'success' 
             });
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Formulário de Metadados */}
      {showForm && selectedFile && (
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-lg p-6 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <FileText size={24} className="text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800">Dados do Comprovante</h4>
                <p className="text-xs text-slate-500 truncate max-w-xs">{selectedFile.name}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
              <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-xl" />
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tipo */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo de Documento *</label>
              <select
                value={formData.tipo}
                onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value as TipoComprovante }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {TIPOS_COMPROVANTE.map(t => (
                  <option key={t.code} value={t.code}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Elemento de Despesa */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Elemento de Despesa *</label>
              <select
                value={formData.elemento_despesa}
                onChange={e => setFormData(prev => ({ ...prev, elemento_despesa: e.target.value as ElementoDespesa }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {ELEMENTOS_DESPESA.map(el => (
                  <option key={el.code} value={el.code}>{el.code} - {el.label}</option>
                ))}
              </select>
            </div>

            {/* Número */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Hash size={12} /> Número do Documento
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={e => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                placeholder="Ex: 001234"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Série */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Série</label>
              <input
                type="text"
                value={formData.serie}
                onChange={e => setFormData(prev => ({ ...prev, serie: e.target.value }))}
                placeholder="Ex: 001"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Emitente com Autocomplete */}
            <div className="space-y-2 col-span-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 size={12} /> Fornecedor/Prestador *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.emitente}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, emitente: val }));
                    searchFornecedores(val);
                    setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Nome do estabelecimento ou prestador"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                  autoComplete="off"
                />
                <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-50">
                     {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col"
                          onClick={() => {
                             setFormData(prev => ({ ...prev, emitente: s.emitente, cnpj_cpf: s.cnpj_cpf }));
                             setCnpjError(!validateCNPJ(s.cnpj_cpf));
                             clearSuggestions();
                             setShowSuggestions(false);
                          }}
                        >
                           <span className="text-sm font-bold text-slate-700">{s.emitente}</span>
                           {s.cnpj_cpf && <span className="text-xs text-slate-400">{s.cnpj_cpf}</span>}
                        </button>
                     ))}
                  </div>
                )}
              </div>
            </div>

            {/* CNPJ/CPF com Format e Validacao */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CNPJ/CPF</label>
              <input
                type="text"
                value={formData.cnpj_cpf}
                onChange={e => {
                   let val = e.target.value;
                   // Simple Formatting logic
                   if (val.length <= 14) val = formatCPF(val);
                   else val = formatCNPJ(val);
                   
                   setFormData(prev => ({ ...prev, cnpj_cpf: val }));
                   if (val.length >= 11) {
                      const isValid = val.length > 14 ? validateCNPJ(val) : validateCPF(val);
                      setCnpjError(!isValid);
                   } else {
                      setCnpjError(false);
                   }
                }}
                placeholder="00.000.000/0000-00"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 transition-all ${cnpjError ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-500/20'}`}
              />
              {cnpjError && (
                 <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1">
                    <AlertTriangle size={10} /> Documento inválido
                 </p>
              )}
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={12} /> Valor *
              </label>
              <input
                type="text"
                value={formData.valor}
                onChange={e => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                placeholder="0,00"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* Data de Emissão */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> Data de Emissão *
              </label>
              <input
                type="date"
                value={formData.data_emissao}
                onChange={e => setFormData(prev => ({ ...prev, data_emissao: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Descrição dos Itens/Serviços</label>
              <textarea
                value={formData.descricao}
                onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva brevemente os itens ou serviços adquiridos"
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="px-6 py-3 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.emitente || !formData.valor || !formData.data_emissao || isUploading}
              className="px-8 py-3 bg-blue-600 text-white font-black text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
            >
              {isUploading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Anexar Comprovante
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Lista de Comprovantes */}
      {comprovantes.length > 0 && (
        <div className="space-y-3">
          {comprovantes.map(comp => (
            <div
              key={comp.id}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getSentinelaColor(comp.sentinela_risk)}`}>
                <FileText size={24} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">{comp.tipo.replace('_', ' ')}</span>
                  {comp.numero && <span className="text-xs text-slate-500">#{comp.numero}</span>}
                  {comp.validado && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} /> Validado
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-800 truncate">{comp.emitente}</p>
                <p className="text-xs text-slate-500">{comp.elemento_despesa} • {new Date(comp.data_emissao).toLocaleDateString('pt-BR')}</p>
              </div>

              {/* Value */}
              <div className="text-right">
                <p className="text-lg font-black text-slate-900">{formatCurrency(comp.valor)}</p>
                {comp.glosa_valor ? (
                  <p className="text-xs text-amber-600 font-bold">Glosa: {formatCurrency(comp.glosa_valor)}</p>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {comp.storage_url && (
                  <a
                    href={comp.storage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={18} />
                  </a>
                )}
                {!readOnly && (
                  <button
                    onClick={() => handleDelete(comp.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && comprovantes.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold">Nenhum comprovante anexado</p>
          <p className="text-sm mt-1">Use o botão acima para adicionar notas fiscais e recibos</p>
        </div>
      )}
    </div>
  );
};

export default ComprovantesUploader;

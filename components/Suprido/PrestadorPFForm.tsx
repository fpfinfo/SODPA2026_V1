import React, { useState, useMemo } from 'react';
import {
  User,
  CreditCard,
  MapPin,
  Calendar,
  Briefcase,
  Upload,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ExternalLink
} from 'lucide-react';

interface PrestadorPFData {
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  pisNit: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  atividade: string;
  dataPrestacao: string;
  valorBruto: number;
  // Arquivos
  documentosPessoais?: File | null;
  comprovanteResidencia?: File | null;
}

interface CalculosTributarios {
  valorBruto: number;
  issRetido: number;      // 5%
  inssRetido: number;     // 11% (limitado ao teto)
  valorLiquido: number;
}

interface PrestadorPFFormProps {
  data: PrestadorPFData;
  onChange: (data: PrestadorPFData) => void;
  onCalculosChange?: (calculos: CalculosTributarios) => void;
  disabled?: boolean;
}

// Teto do INSS 2026 (valor estimado - ajustar conforme legislação)
const TETO_INSS_2026 = 7786.02;
const ALIQUOTA_ISS = 0.05;    // 5%
const ALIQUOTA_INSS = 0.11;   // 11%

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  return digit === parseInt(cleaned.charAt(10));
};

const formatCPF = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
};

const validatePISNIT = (pis: string): boolean => {
  const cleaned = pis.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights[i];
  }
  const remainder = sum % 11;
  const digit = remainder < 2 ? 0 : 11 - remainder;
  return digit === parseInt(cleaned.charAt(10));
};

const formatPISNIT = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8, 10)}-${cleaned.slice(10)}`;
};

export const PrestadorPFForm: React.FC<PrestadorPFFormProps> = ({
  data,
  onChange,
  onCalculosChange,
  disabled = false
}) => {
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [pisValid, setPisValid] = useState<boolean | null>(null);

  // Cálculos tributários em tempo real
  const calculos = useMemo((): CalculosTributarios => {
    const valorBruto = data.valorBruto || 0;
    const issRetido = valorBruto * ALIQUOTA_ISS;
    
    // INSS: 11% limitado ao teto
    const baseINSS = Math.min(valorBruto, TETO_INSS_2026);
    const inssRetido = baseINSS * ALIQUOTA_INSS;
    
    const valorLiquido = valorBruto - issRetido - inssRetido;
    
    return { valorBruto, issRetido, inssRetido, valorLiquido };
  }, [data.valorBruto]);

  // Notificar mudanças nos cálculos
  React.useEffect(() => {
    if (onCalculosChange) {
      onCalculosChange(calculos);
    }
  }, [calculos, onCalculosChange]);

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('endereco.')) {
      const enderecoField = field.replace('endereco.', '');
      onChange({
        ...data,
        endereco: {
          ...data.endereco,
          [enderecoField]: value
        }
      });
    } else {
      onChange({ ...data, [field]: value });
    }
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    handleChange('cpf', formatted);
    
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      setCpfValid(validateCPF(cleaned));
    } else {
      setCpfValid(null);
    }
  };

  const handlePISChange = (value: string) => {
    const formatted = formatPISNIT(value);
    handleChange('pisNit', formatted);
    
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      setPisValid(validatePISNIT(cleaned));
    } else {
      setPisValid(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Alerta sobre retenções */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={24} className="text-amber-600" />
          </div>
          <div>
            <h4 className="text-lg font-black text-amber-800 uppercase tracking-tight">
              Atenção: Serviço de Pessoa Física
            </h4>
            <p className="text-sm text-amber-700 mt-1">
              Pagamentos a pessoas físicas exigem retenção de <strong>ISS (5%)</strong> e <strong>INSS (11%)</strong>.
              O valor do INSS retido deverá ser recolhido via GDR.
            </p>
          </div>
        </div>
      </div>

      {/* Dados Pessoais do Prestador */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <User size={20} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Dados do Prestador (PF)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome Completo */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={data.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              placeholder="Nome completo do prestador de serviço"
            />
          </div>

          {/* CPF */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              CPF *
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.cpf}
                onChange={(e) => handleCPFChange(e.target.value)}
                disabled={disabled}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                  cpfValid === false 
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                    : cpfValid === true 
                      ? 'border-green-300 focus:ring-green-200 focus:border-green-400'
                      : 'border-slate-200 focus:ring-purple-200 focus:border-purple-400'
                }`}
                placeholder="000.000.000-00"
              />
              {cpfValid !== null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cpfValid ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={20} className="text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RG */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              RG *
            </label>
            <input
              type="text"
              value={data.rg}
              onChange={(e) => handleChange('rg', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              placeholder="Número do RG"
            />
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Data de Nascimento *
            </label>
            <input
              type="date"
              value={data.dataNascimento}
              onChange={(e) => handleChange('dataNascimento', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            />
          </div>

          {/* PIS/NIT */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              PIS/NIT * <span className="text-amber-600">(Essencial para INSS)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.pisNit}
                onChange={(e) => handlePISChange(e.target.value)}
                disabled={disabled}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                  pisValid === false 
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                    : pisValid === true 
                      ? 'border-green-300 focus:ring-green-200 focus:border-green-400'
                      : 'border-slate-200 focus:ring-purple-200 focus:border-purple-400'
                }`}
                placeholder="000.00000.00-0"
              />
              {pisValid !== null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {pisValid ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={20} className="text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <MapPin size={20} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Endereço Completo</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logradouro *</label>
            <input
              type="text"
              value={data.endereco?.logradouro || ''}
              onChange={(e) => handleChange('endereco.logradouro', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              placeholder="Rua, Avenida, etc."
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número *</label>
            <input
              type="text"
              value={data.endereco?.numero || ''}
              onChange={(e) => handleChange('endereco.numero', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Compl.</label>
            <input
              type="text"
              value={data.endereco?.complemento || ''}
              onChange={(e) => handleChange('endereco.complemento', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bairro *</label>
            <input
              type="text"
              value={data.endereco?.bairro || ''}
              onChange={(e) => handleChange('endereco.bairro', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cidade *</label>
            <input
              type="text"
              value={data.endereco?.cidade || ''}
              onChange={(e) => handleChange('endereco.cidade', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">UF *</label>
            <select
              value={data.endereco?.estado || 'PA'}
              onChange={(e) => handleChange('endereco.estado', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            >
              <option value="PA">PA</option>
              <option value="AC">AC</option>
              <option value="AM">AM</option>
              {/* Outros estados... */}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CEP *</label>
            <input
              type="text"
              value={data.endereco?.cep || ''}
              onChange={(e) => handleChange('endereco.cep', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              placeholder="00000-000"
            />
          </div>
        </div>
      </div>

      {/* Dados do Serviço */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Briefcase size={20} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Dados do Serviço Prestado</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Descrição da Atividade/Serviço *
            </label>
            <textarea
              value={data.atividade}
              onChange={(e) => handleChange('atividade', e.target.value)}
              disabled={disabled}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all resize-none"
              placeholder="Descreva o serviço prestado..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Data da Prestação *
            </label>
            <input
              type="date"
              value={data.dataPrestacao}
              onChange={(e) => handleChange('dataPrestacao', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Valor Bruto do Serviço (R$) *
            </label>
            <input
              type="number"
              value={data.valorBruto || ''}
              onChange={(e) => handleChange('valorBruto', parseFloat(e.target.value) || 0)}
              disabled={disabled}
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      {/* Calculadora Tributária */}
      {data.valorBruto > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calculator size={20} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-black text-purple-800">Cálculo Tributário Automático</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-purple-200">
              <span className="text-slate-700 font-medium">Valor Bruto do Serviço</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(calculos.valorBruto)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-purple-200">
              <span className="text-red-600 font-medium">(-) ISS (5% - Prefeitura)</span>
              <span className="text-lg font-bold text-red-600">- {formatCurrency(calculos.issRetido)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-purple-200">
              <div>
                <span className="text-red-600 font-medium">(-) INSS (11% - Recolher via GDR)</span>
                <p className="text-xs text-slate-500 mt-1">
                  * Base limitada ao teto de {formatCurrency(TETO_INSS_2026)}
                </p>
              </div>
              <span className="text-lg font-bold text-red-600">- {formatCurrency(calculos.inssRetido)}</span>
            </div>

            <div className="flex justify-between items-center py-4 bg-emerald-100 rounded-xl px-4 mt-4">
              <span className="text-emerald-800 font-black text-lg">VALOR LÍQUIDO A PAGAR</span>
              <span className="text-2xl font-black text-emerald-700">{formatCurrency(calculos.valorLiquido)}</span>
            </div>
          </div>

          {/* Alerta sobre GDR */}
          <div className="mt-6 p-4 bg-amber-100 border border-amber-300 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Você deve emitir uma GDR para recolher {formatCurrency(calculos.inssRetido)} referente ao INSS retido.
                </p>
                <a 
                  href="https://apps.tjpa.jus.br/gdr-publico/emissao-guia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-all"
                >
                  <ExternalLink size={16} />
                  Emitir GDR INSS (Portal TJPA)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploads de Documentos */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Upload size={20} className="text-slate-600" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Documentos Obrigatórios</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Cópia do CPF/RG ou CNH *
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-purple-300 transition-all cursor-pointer">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleChange('documentosPessoais', e.target.files?.[0] || null)}
                disabled={disabled}
                className="hidden"
                id="docs-pessoais"
              />
              <label htmlFor="docs-pessoais" className="cursor-pointer">
                <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">
                  {data.documentosPessoais ? data.documentosPessoais.name : 'Clique para anexar'}
                </p>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Comprovante de Residência *
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-purple-300 transition-all cursor-pointer">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleChange('comprovanteResidencia', e.target.files?.[0] || null)}
                disabled={disabled}
                className="hidden"
                id="comp-residencia"
              />
              <label htmlFor="comp-residencia" className="cursor-pointer">
                <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">
                  {data.comprovanteResidencia ? data.comprovanteResidencia.name : 'Clique para anexar'}
                </p>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrestadorPFForm;

// ============================================================================
// NewDocumentModal - Modal para criar novos documentos no dossiê
// Suporta: Portaria, Despacho, Ofício, Memorando, Minuta, Decisão
// ============================================================================

import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle,
  Save,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { DOCUMENT_TYPES } from './DossieDigital';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  originModule: string; // SODPA, SEFIN, SGP, PRESIDENCIA
  onSuccess?: () => void;
}

// Document templates
const TEMPLATES: Record<string, string> = {
  DESPACHO: `DESPACHO

Processo: [NUP]

À [SETOR DE DESTINO],

[CONTEÚDO DO DESPACHO]

Considerando o exposto, [ENCAMINHE-SE/ARQUIVE-SE/AUTORIZA-SE].

Belém-PA, [DATA].

_______________________________
[NOME DO ASSINANTE]
[CARGO]`,

  PORTARIA: `PORTARIA Nº [NÚMERO], DE [DATA]

O [CARGO], no uso de suas atribuições legais,

RESOLVE:

Art. 1º [CONTEÚDO DA PORTARIA]

Art. 2º Esta Portaria entra em vigor na data de sua publicação.

Belém-PA, [DATA].

_______________________________
[NOME DO ASSINANTE]
[CARGO]`,

  OFICIO: `OFÍCIO Nº [NÚMERO]

Belém, [DATA]

A [DESTINATÁRIO]
[ENDEREÇO]

Assunto: [ASSUNTO]

Senhor(a),

[CONTEÚDO DO OFÍCIO]

Atenciosamente,

_______________________________
[NOME DO ASSINANTE]
[CARGO]`,

  MEMORANDO: `MEMORANDO Nº [NÚMERO]

Para: [DESTINATÁRIO]
De: [REMETENTE]
Assunto: [ASSUNTO]
Data: [DATA]

[CONTEÚDO DO MEMORANDO]

_______________________________
[NOME DO ASSINANTE]
[CARGO]`,

  MINUTA: `[TIPO DE DOCUMENTO]

[CONTEÚDO DA MINUTA]

*** MINUTA PARA REVISÃO ***`,

  DECISAO: `DECISÃO

Processo: [NUP]

Interessado: [NOME DO SERVIDOR]

[CONTEÚDO DA DECISÃO]

Diante do exposto, DECIDO:

[DETERMINAÇÃO]

Belém-PA, [DATA].

_______________________________
[NOME DO ASSINANTE]
[CARGO]`
};

export function NewDocumentModal({
  isOpen,
  onClose,
  requestId,
  originModule,
  onSuccess
}: NewDocumentModalProps) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState('DESPACHO');
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState(TEMPLATES.DESPACHO);
  const [destinoModulo, setDestinoModulo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTipoChange = (newTipo: string) => {
    setTipo(newTipo);
    setConteudo(TEMPLATES[newTipo] || '');
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      setError('Informe o título do documento');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Create document
      const { error: insertError } = await supabase
        .from('sodpa_documents')
        .insert({
          request_id: requestId,
          tipo,
          titulo: titulo.trim(),
          conteudo,
          origem_modulo: originModule,
          destino_modulo: destinoModulo || null,
          created_by: user?.id,
          assinado: false
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[NewDocumentModal] Error saving:', err);
      setError('Erro ao salvar documento');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Documento Criado!</h3>
          <p className="text-gray-500">O documento foi adicionado ao dossiê.</p>
        </div>
      </div>
    );
  }

  const selectedType = DOCUMENT_TYPES.find(t => t.id === tipo);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Novo Documento</h2>
              <p className="text-blue-100 text-sm">Adicionar ao dossiê digital</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Document Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DOCUMENT_TYPES.map(docType => (
                <button
                  key={docType.id}
                  onClick={() => handleTipoChange(docType.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    tipo === docType.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{docType.icon}</span>
                  <span className={`text-sm font-medium ${
                    tipo === docType.id ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {docType.label}
                  </span>
                </button>
              ))}
            </div>
            {selectedType && (
              <p className="mt-2 text-xs text-gray-500">{selectedType.description}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Título do Documento *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={`Ex: ${selectedType?.label} de Encaminhamento`}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Destination Module (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Módulo de Destino (opcional)
            </label>
            <div className="relative">
              <select
                value={destinoModulo}
                onChange={(e) => setDestinoModulo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Selecione se aplicável</option>
                <option value="SEFIN">SEFIN - Autorização Financeira</option>
                <option value="SGP">SGP - Gestão de Pessoas</option>
                <option value="PRESIDENCIA">Presidência</option>
                <option value="SODPA">SODPA - Diárias e Passagens</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Conteúdo
            </label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Digite o conteúdo do documento..."
            />
            <p className="mt-2 text-xs text-gray-500">
              Dica: Edite o template acima substituindo os campos entre colchetes [CAMPO]
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !titulo.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            {saving ? (
              <>
                <RefreshIcon className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} />
                Salvar Documento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple refresh icon for loading state
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={`h-4 w-4 ${className}`} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
      />
    </svg>
  );
}

export default NewDocumentModal;

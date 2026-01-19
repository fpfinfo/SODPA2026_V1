/**
 * DocumentPreview Component
 * Full-featured document preview panel for SEFIN module
 */

import React, { useEffect } from 'react';
import { X, MessageSquare, PenTool, Loader2, FileText, AlertCircle } from 'lucide-react';
import { DocumentHeader } from './DocumentHeader';
import { useDocumentData } from '../../hooks/useDocumentData';
import { StaticPortaria } from '../ProcessDetails/StaticDocuments/StaticPortaria';
import { StaticNE } from '../ProcessDetails/StaticDocuments/StaticNE';
import { StaticDL } from '../ProcessDetails/StaticDocuments/StaticDL';
import { StaticOB } from '../ProcessDetails/StaticDocuments/StaticOB';

export interface PreviewTask {
  id: string;
  protocol: string;
  type: string;
  title: string;
  description?: string;
  value?: number;
  date: string;
  author: string;
  content_preview?: string;
  documento_id?: string;
  solicitacao_id?: string;
}

interface DocumentPreviewProps {
  task: PreviewTask | null;
  onClose: () => void;
  onSign: () => void;
  onReturn: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  task,
  onClose,
  onSign,
  onReturn,
}) => {
  // Fetch complete document data
  const { document, isLoading } = useDocumentData(
    task?.documento_id,
    task?.solicitacao_id
  );

  if (!task) return null;

  // Build processData for Static components
  const processData = document?.solicitacao ? {
    suprido_nome: document.solicitacao.suprido_nome || 'Servidor',
    suprido_cargo: document.solicitacao.suprido_cargo,
    suprido_cpf: document.solicitacao.suprido_cpf,
    nup: document.solicitacao.nup || task.protocol,
    valor_total: document.solicitacao.valor_total || task.value || 0,
    value: document.solicitacao.valor_total || task.value || 0,
    lotacao: document.solicitacao.lotacao,
    descricao: document.solicitacao.descricao,
    itens_despesa: document.solicitacao.itens_despesa,
    dados_bancarios: document.solicitacao.dados_bancarios,
    gestor: document.solicitacao.gestor_nome ? {
      nome: document.solicitacao.gestor_nome,
      email: document.solicitacao.gestor_email,
    } : undefined,
  } : {
    suprido_nome: task.title?.split(' - ')[1] || 'Servidor',
    nup: task.protocol,
    valor_total: task.value || 0,
    value: task.value || 0,
  };

  // Build documentData for Static components
  const documentData = {
    id: document?.id || task.id,
    tipo: task.type,
    conteudo: document?.conteudo || task.content_preview,
    created_at: document?.created_at || new Date().toISOString(),
    metadata: document?.metadata || {
      numero_portaria: task.protocol?.split('-').pop() || '001',
      numero_completo: task.protocol,
      ptres_code: '8727',
      dotacao_code: '162',
      valor: task.value,
    },
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(val);
  };

  // Render the appropriate document component
  const renderDocument = () => {
    const type = task.type?.toUpperCase();

    switch (type) {
      case 'PORTARIA':
        return <StaticPortaria processData={processData} documentData={documentData} />;
      case 'NOTA_EMPENHO':
        return <StaticNE processData={processData} documentData={documentData} />;
      case 'NOTA_LIQUIDACAO':
        return <StaticDL processData={processData} documentData={documentData} />;
      case 'ORDEM_BANCARIA':
        return <StaticOB processData={processData} documentData={documentData} />;
      case 'CERTIDAO_REGULARIDADE':
        return (
          <div className="p-12 text-center">
            <FileText size={48} className="mx-auto text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Certidão de Regularidade</h3>
            <p className="text-slate-600">{task.content_preview}</p>
          </div>
        );
      default:
        // Fallback for unknown types
        return (
          <div className="p-12 space-y-6">
            <h2 className="text-xl font-bold text-center uppercase border-y-2 border-slate-900 py-3">
              {task.type?.replace('_', ' ')}
            </h2>
            <div className="text-justify space-y-4 text-sm leading-relaxed">
              <p>{task.content_preview}</p>
              <p>
                Considerando o disposto na legislação vigente e a disponibilidade 
                orçamentária atestada pela SOSFU.
              </p>
              <p>
                <strong>DETERMINO</strong> o prosseguimento do feito conforme solicitado, 
                autorizando a despesa no valor de {task.value && formatCurrency(task.value)}.
              </p>
            </div>
            {/* Signature area */}
            <div className="mt-16 pt-8 border-t border-slate-300 text-center">
              <div className="w-56 h-px bg-slate-900 mx-auto mb-2"></div>
              <p className="font-bold text-sm uppercase">Ordenador de Despesas</p>
              <p className="text-xs text-slate-500">Aguardando Assinatura Digital</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Preview Panel */}
      <div className="w-[900px] max-w-full bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col relative z-50">
        {/* Header */}
        <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20}/>
            </button>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 truncate">
                {task.title}
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded uppercase tracking-widest shrink-0">
                  Minuta
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">{task.protocol}</p>
            </div>
          </div>
          
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={onReturn} 
              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <MessageSquare size={14}/> Devolver
            </button>
            <button 
              onClick={onSign} 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-md flex items-center gap-2 transition-colors"
            >
              <PenTool size={14}/> Assinar
            </button>
          </div>
        </div>
        
        {/* Document Area - Full height scrollable container */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Carregando documento...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-[210mm] mx-auto bg-white shadow-xl rounded-lg overflow-hidden min-h-[297mm]">
              {/* TJPA Header */}
              <DocumentHeader />
              
              {/* Document Content - with internal padding */}
              <div className="px-16 py-8">
                {renderDocument()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

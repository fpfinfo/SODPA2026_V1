import React from 'react';
import { FileText, Eye, CheckCircle2, Receipt, AlertTriangle, RefreshCw } from 'lucide-react';
import { useDossierData, DossierDocument } from '../ProcessDetails/hooks/useDossierData';

interface DossierReviewPanelProps {
  processId: string;
  prestacaoId?: string; // Explicit ID
  currentUserId: string;
  onApprovalChange: (checked: boolean) => void;
  declaracaoAceita: boolean;
}

export const DossierReviewPanel: React.FC<DossierReviewPanelProps> = ({
  processId,
  prestacaoId,
  currentUserId,
  onApprovalChange,
  declaracaoAceita
}) => {
  const { dossierDocs, comprovantesPC, isLoading, error, refreshDocs } = useDossierData({
    processId,
    prestacaoId,
    currentUserId
  });

  // Count by type
  const comprovantesCount = dossierDocs.filter(d => d.tipo === 'COMPROVANTE_DESPESA').length;
  const gdrCount = dossierDocs.filter(d => d.tipo === 'GDR').length;
  const docsCount = dossierDocs.filter(d => !['COMPROVANTE_DESPESA', 'GDR'].includes(d.tipo)).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-slate-500">Carregando dossiê...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
        <AlertTriangle size={24} className="mx-auto text-red-500 mb-2" />
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={refreshDocs}
          className="mt-2 text-sm text-red-600 underline hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with file counts */}
      <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-blue-500" />
            <span className="text-sm font-bold text-slate-700">{comprovantesCount} Comprovantes</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-emerald-500" />
            <span className="text-sm font-bold text-slate-700">{gdrCount} GDRs</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-purple-500" />
            <span className="text-sm font-bold text-slate-700">{docsCount} Documentos</span>
          </div>
        </div>
        <button
          onClick={refreshDocs}
          className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          title="Atualizar"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Inventário do Dossiê Digital
          </h4>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {dossierDocs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Nenhum documento encontrado</p>
            </div>
          ) : (
            dossierDocs.map((doc, index) => (
              <div
                key={doc.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {/* FLS Number */}
                  <div className="w-10 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">FLS.</span>
                    <p className="text-lg font-black text-slate-600">{String(index + 1).padStart(2, '0')}</p>
                  </div>

                  {/* Icon by type */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    doc.tipo === 'COMPROVANTE_DESPESA' ? 'bg-blue-100 text-blue-600' :
                    doc.tipo === 'GDR' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {doc.tipo === 'COMPROVANTE_DESPESA' ? <Receipt size={18} /> :
                     doc.tipo === 'GDR' ? <CheckCircle2 size={18} /> :
                     <FileText size={18} />}
                  </div>

                  {/* Details */}
                  <div>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">
                      {doc.titulo || doc.nome}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {doc.tipo?.replace(/_/g, ' ')} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                      {doc.metadata?.valor && ` • ${formatCurrency(doc.metadata.valor)}`}
                    </p>
                  </div>
                </div>

                {/* View Button */}
                {doc.file_url ? (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Visualizar documento"
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Eye size={18} />
                  </a>
                ) : (
                  <span className="p-2 text-slate-300" title="Sem arquivo anexado">
                    <Eye size={18} />
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approval Checkbox */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={declaracaoAceita}
            onChange={(e) => onApprovalChange(e.target.checked)}
            className="w-6 h-6 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700 leading-relaxed">
            <strong className="text-slate-900">REVISEI O DOSSIÊ DIGITAL</strong> e certifico que todos os 
            comprovantes foram anexados corretamente, estão legíveis e correspondem às despesas lançadas. 
            Confirmo que o dossiê está completo e pronto para análise do Gestor.
          </span>
        </label>
      </div>
    </div>
  );
};

export default DossierReviewPanel;

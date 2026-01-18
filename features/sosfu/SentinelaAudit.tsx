import React, { useState, useEffect } from 'react';
import { Process, SentinelaAnalysis, AuditAlert } from '../types';
import { 
  ShieldCheck, 
  Eye, 
  FileSearch, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  FileText, 
  ChevronRight, 
  BrainCircuit,
  Maximize2,
  AlertTriangle,
  ArrowRightCircle,
  Gavel,
  History
} from 'lucide-react';

interface SentinelaAuditProps {
  process: Process;
  onClose: () => void;
}

export const SentinelaAudit: React.FC<SentinelaAuditProps> = ({ process, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<SentinelaAnalysis | null>(null);

  // Simulating the Machine Learning + Rule Engine Analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockResult: SentinelaAnalysis = {
        confidenceScore: 92,
        status: 'MANUAL_REVIEW',
        extractedData: {
          cnpj: '12.345.678/0001-90',
          invoiceNumber: 'NF-e 8821',
          issueDate: '2025-01-10', // Despesa antes do crédito (Mocking Error)
          totalAmount: 450.00,
          items: [
            { description: 'Almoço Executivo x3', quantity: 3, unitPrice: 150.00, total: 450.00 }
          ]
        },
        alerts: [
          {
            id: 'A1',
            type: 'CRITICAL',
            category: 'CHRONOLOGY',
            message: 'Inconsistência Cronológica Detetada',
            description: 'A data de emissão (10/01) é anterior à data do crédito do suprimento (12/01). Viola a Lei 4.320/64.',
            ruleId: 'L4320_CRON'
          },
          {
            id: 'A2',
            type: 'WARNING',
            category: 'SEMANTIC',
            message: 'Possível Desvio de Finalidade',
            description: 'IA detectou item "Almoço" em suprimento destinado a "Material de Consumo" (339030).',
            ruleId: 'AI_ND_MISMATCH'
          }
        ],
        suggestedGlosaText: `Sugere-se a glosa da despesa referente à nota fiscal NF-e 8821, no valor de R$ 450,00, por apresentar vício de cronologia, tendo sido emitida em data anterior (10/01/2025) ao efetivo crédito dos recursos em conta bancária (12/01/2025), infringindo o regime de adiantamento regido pela Lei 4.320/64.`
      };
      setAnalysis(mockResult);
      setIsAnalyzing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isAnalyzing) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 animate-pulse">Sentinela SOSFU Ativado</h2>
          <p className="text-slate-500 text-sm">Realizando OCR e cruzamento de regras legais...</p>
        </div>
        <div className="w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 animate-progress"></div>
        </div>
        <style>{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .animate-progress {
            animation: progress 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[250] flex flex-col bg-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-200">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 flex items-center gap-2">
              Sentinela SOSFU <span className="text-xs font-normal text-slate-400">| Auditoria Inteligente</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{process.protocolNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confiança IA:</span>
             <div className="w-16 h-2 bg-slate-200 rounded-full">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analysis?.confidenceScore}%` }}></div>
             </div>
             <span className="text-xs font-bold text-emerald-600">{analysis?.confidenceScore}%</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Document Viewer */}
        <div className="flex-1 bg-slate-700 p-8 flex flex-col items-center overflow-y-auto relative">
           <div className="sticky top-0 right-0 mb-4 w-full flex justify-end">
              <button className="p-2 bg-slate-800/50 text-white rounded-full hover:bg-slate-800 transition-colors">
                 <Maximize2 size={18} />
              </button>
           </div>
           
           {/* Mock Receipt Document */}
           <div className="w-[500px] aspect-[1/1.41] bg-white shadow-2xl rounded-sm p-8 text-slate-900 font-mono text-[10px] relative overflow-hidden ring-4 ring-blue-500/20">
              {/* OCR Scanning Overlay Effect */}
              <div className="absolute inset-0 bg-blue-400/10 animate-scan"></div>
              
              <div className="border-b-2 border-slate-900 pb-2 mb-4 text-center">
                <h2 className="text-sm font-bold">RESTAURANTE BOA VISTA LTDA</h2>
                <p>CNPJ: 12.345.678/0001-90</p>
                <p>Belém - Pará</p>
              </div>

              <div className="mb-4">
                <p>NF-e: 8821 | SÉRIE: 001</p>
                <p className="font-bold bg-yellow-100 px-1 inline-block">EMISSÃO: 10/01/2025 12:30</p>
              </div>

              <div className="space-y-1 mb-8">
                <div className="flex justify-between border-b border-slate-200 pb-1 font-bold">
                  <span>DESCRIÇÃO</span>
                  <span>TOTAL</span>
                </div>
                <div className="flex justify-between">
                  <span>3x ALMOÇO EXECUTIVO</span>
                  <span>R$ 450,00</span>
                </div>
              </div>

              <div className="text-right border-t-2 border-slate-900 pt-2 font-bold text-sm">
                 TOTAL: R$ 450,00
              </div>

              <div className="mt-20 text-[8px] text-slate-400 text-center uppercase">
                 Documento Fiscal Eletrônico - Autenticação OCR Ativa
              </div>

              <style>{`
                @keyframes scan {
                  0% { transform: translateY(-100%); }
                  100% { transform: translateY(100%); }
                }
                .animate-scan {
                  animation: scan 3s linear infinite;
                }
              `}</style>
           </div>
        </div>

        {/* Right: X-Ray Audit Panel */}
        <div className="w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-xl">
           <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                <BrainCircuit size={14} className="text-blue-600" /> Painel Raio-X Sentinela
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                analysis?.status === 'MANUAL_REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {analysis?.status === 'MANUAL_REVIEW' ? 'Revisão Necessária' : 'Validado'}
              </span>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* 1. Chronology Verification */}
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Análise Cronológica</h4>
                    <History size={14} className="text-slate-300" />
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs">
                       <span className="text-slate-500">Crédito Suprimento:</span>
                       <span className="font-bold text-slate-700">12/01/2025</span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="text-slate-500">Data Emissão Nota:</span>
                       <span className="font-bold text-red-600 bg-red-50 px-1 rounded">10/01/2025</span>
                    </div>
                 </div>
              </div>

              {/* 2. Alerts Checklist */}
              <div className="space-y-3">
                 <h4 className="text-xs font-bold text-slate-400 uppercase">Checklist de Auditoria</h4>
                 <div className="space-y-2">
                    {analysis?.alerts.map((alert) => (
                      <div key={alert.id} className={`p-3 rounded-xl border-l-4 shadow-sm ${
                        alert.type === 'CRITICAL' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
                      }`}>
                         <div className="flex items-start gap-2">
                            {alert.type === 'CRITICAL' ? (
                               <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
                            ) : (
                               <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                            )}
                            <div>
                               <p className="text-xs font-bold text-slate-800 leading-tight">{alert.message}</p>
                               <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{alert.description}</p>
                            </div>
                         </div>
                      </div>
                    ))}
                    
                    <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl flex items-center gap-2">
                       <CheckCircle2 size={16} className="text-emerald-600" />
                       <span className="text-xs font-bold text-emerald-800">Fornecedor Regularizado (SIAFE)</span>
                    </div>
                 </div>
              </div>

              {/* 3. AI Generated Glosa Text */}
              {analysis?.suggestedGlosaText && (
                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <h4 className="text-xs font-bold text-slate-400 uppercase">Sugestão de Parecer de Glosa</h4>
                       <Gavel size={14} className="text-slate-300" />
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl relative group">
                       <p className="text-[11px] italic text-indigo-900 leading-relaxed font-serif">
                          "{analysis.suggestedGlosaText}"
                       </p>
                       <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow-sm text-indigo-600">
                          <Zap size={12} />
                       </button>
                    </div>
                 </div>
              )}
           </div>

           {/* Quick Actions Footer */}
           <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
              <button className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-md">
                 <CheckCircle2 size={16} /> Validar Documento
              </button>
              <button className="w-full bg-white border border-red-200 text-red-600 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50">
                 <ArrowRightCircle size={16} /> Encaminhar para Diligência
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

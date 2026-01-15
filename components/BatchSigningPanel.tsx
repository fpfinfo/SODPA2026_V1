/**
 * Batch Signing Panel Component
 * Interface for Ordenador to sign multiple batches in one action
 */

import React, { useState, useMemo } from 'react';
import {
  FileSignature,
  Package,
  Check,
  Clock,
  FileText,
  DollarSign,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  Calendar,
  MapPin,
} from 'lucide-react';
import {
  Quarter,
  QUARTER_CONFIG,
  BatchSummary,
  formatCurrency,
} from '../types/batch';

interface BatchSigningPanelProps {
  onSign?: (batchId: string) => Promise<void>;
}

// Mock batch data
const MOCK_BATCHES: BatchSummary[] = [
  {
    id: 'batch-2026-1q',
    year: 2026,
    quarter: '1Q',
    total_processos: 144,
    total_valor: 2000000,
    total_documentos: 432,
    status: 'GERADO',
    comarcas_regulares: 138,
    comarcas_excluidas: 6,
    generated_by: 'Maria Silva (SOSFU)',
    generated_at: '2026-01-14T21:30:00Z',
  },
  {
    id: 'batch-2025-3q',
    year: 2025,
    quarter: '3Q',
    total_processos: 140,
    total_valor: 1900000,
    total_documentos: 420,
    status: 'ASSINADO',
    comarcas_regulares: 140,
    comarcas_excluidas: 4,
    generated_by: 'Maria Silva (SOSFU)',
    generated_at: '2025-09-10T14:20:00Z',
    signed_by: 'João Mendes (Ordenador)',
    signed_at: '2025-09-10T16:45:00Z',
  },
];

export const BatchSigningPanel: React.FC<BatchSigningPanelProps> = ({ onSign }) => {
  const [batches, setBatches] = useState<BatchSummary[]>(MOCK_BATCHES);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [signingBatchId, setSigningBatchId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const pendingBatches = useMemo(() => batches.filter(b => b.status === 'GERADO'), [batches]);
  const signedBatches = useMemo(() => batches.filter(b => b.status !== 'GERADO'), [batches]);

  const getStatusBadge = (status: BatchSummary['status']) => {
    switch (status) {
      case 'GERADO':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full"><Clock size={14} /> Aguardando Assinatura</span>;
      case 'ASSINADO':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full"><CheckCircle size={14} /> Assinado</span>;
      case 'LIBERADO':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full"><Check size={14} /> Liberado</span>;
      default:
        return null;
    }
  };

  const handleSign = async (batchId: string) => {
    setSigningBatchId(batchId);
    setMessage(null);
    
    try {
      // Simulate signing delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      if (onSign) await onSign(batchId);
      
      // Update batch status
      setBatches(prev => prev.map(b => 
        b.id === batchId 
          ? { ...b, status: 'ASSINADO' as const, signed_by: 'Ordenador Atual', signed_at: new Date().toISOString() }
          : b
      ));
      
      setMessage({ type: 'success', text: 'Lote assinado com sucesso! Processos liberados para execução.' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao assinar lote. Tente novamente.' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSigningBatchId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg">
              <FileSignature size={28} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
                Módulo Ordenador de Despesa
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Assinatura de Lotes em Bloco
              </h2>
            </div>
          </div>

          <div className="text-right">
            <p className="text-4xl font-black text-white">{pendingBatches.length}</p>
            <p className="text-xs text-indigo-300">Lotes Pendentes</p>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg animate-in slide-in-from-top-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      {/* Pending Batches */}
      {pendingBatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} />
            Lotes Aguardando Assinatura
          </h3>
          
          {pendingBatches.map(batch => (
            <div key={batch.id} className="bg-white rounded-2xl border-2 border-amber-200 shadow-lg overflow-hidden">
              {/* Batch Header */}
              <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                      <Package size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">
                        Lote Ordinário {QUARTER_CONFIG[batch.quarter].label}/{batch.year}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Gerado em {formatDate(batch.generated_at)} por {batch.generated_by}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(batch.status)}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <Users size={20} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-2xl font-black text-slate-800">{batch.total_processos}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Processos</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <DollarSign size={20} className="mx-auto text-emerald-500 mb-2" />
                    <p className="text-2xl font-black text-emerald-600">{formatCurrency(batch.total_valor)}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Valor Total</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <FileText size={20} className="mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-black text-blue-600">{batch.total_documentos}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Documentos</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <MapPin size={20} className="mx-auto text-purple-500 mb-2" />
                    <p className="text-2xl font-black text-purple-600">{batch.comarcas_regulares}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Comarcas</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-white flex items-center justify-between">
                <button
                  onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-bold"
                >
                  <Eye size={16} />
                  Ver Detalhes
                  {expandedBatch === batch.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <button
                  onClick={() => handleSign(batch.id)}
                  disabled={signingBatchId === batch.id}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-70"
                >
                  {signingBatchId === batch.id ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Assinando {batch.total_documentos} Documentos...
                    </>
                  ) : (
                    <>
                      <FileSignature size={20} />
                      Assinar e Liberar Lote
                    </>
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedBatch === batch.id && (
                <div className="p-6 bg-slate-50 border-t border-slate-200 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Documentos por Processo</p>
                      <ul className="space-y-1 text-sm text-slate-600">
                        <li className="flex items-center gap-2"><FileText size={14} className="text-blue-500" /> Portaria de Concessão</li>
                        <li className="flex items-center gap-2"><FileText size={14} className="text-emerald-500" /> Nota de Empenho</li>
                        <li className="flex items-center gap-2"><FileText size={14} className="text-purple-500" /> Certidão de Regularidade</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comarcas Excluídas</p>
                      <p className="text-sm text-red-600 font-bold">{batch.comarcas_excluidas} comarcas</p>
                      <p className="text-xs text-slate-500">Por pendências ou falta de suprido</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Após Assinatura</p>
                      <p className="text-sm text-slate-600">Todos os processos serão enviados para execução e os supridos serão notificados automaticamente.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Signed Batches */}
      {signedBatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle size={16} />
            Histórico de Lotes Assinados
          </h3>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Lote</th>
                  <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Processos</th>
                  <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assinado Por</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {signedBatches.map(batch => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">
                        {QUARTER_CONFIG[batch.quarter].label}/{batch.year}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-700">{batch.total_processos}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(batch.total_valor)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{batch.signed_by}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{batch.signed_at ? formatDate(batch.signed_at) : '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(batch.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {batches.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">Nenhum Lote Gerado</h3>
          <p className="text-sm text-slate-400">Os lotes quadrimestrais aparecerão aqui após serem gerados pela SOSFU.</p>
        </div>
      )}
    </div>
  );
};

export default BatchSigningPanel;

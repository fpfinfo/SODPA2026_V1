import React, { useEffect, useState, useMemo } from 'react';
import {
  Shield,
  DollarSign,
  User,
  Calendar,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  RefreshCw,
  Download,
  Calculator,
  Building2,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';

// =============================================================================
// TYPES
// =============================================================================

interface RegistroINSS {
  id: string;
  solicitacao_id: string;
  prestacao_contas_id: string;
  comprovante_id: string;
  cpf: string;
  nome: string;
  pis_nit: string;
  valor_bruto: number;
  inss_retido_11: number;
  inss_patronal_20: number;
  nup: string;
  portaria_numero: string;
  comarca: string;
  atividade: string;
  data_prestacao: string;
  status: 'PENDENTE_RECOLHIMENTO' | 'GUIA_GERADA' | 'RECOLHIDO' | 'BAIXADO';
  guia_numero?: string;
  guia_data_geracao?: string;
  data_recolhimento?: string;
  comprovante_path?: string;
  created_at: string;
  updated_at: string;
}

interface GestaoINSSTabProps {
  onSelectProcess?: (processId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const GestaoINSSTab: React.FC<GestaoINSSTabProps> = ({
  onSelectProcess
}) => {
  const { showToast } = useToast();
  const [registros, setRegistros] = useState<RegistroINSS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedRegistros, setSelectedRegistros] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // ==========================================================================
  // FETCH
  // ==========================================================================

  const fetchRegistros = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('gestao_inss')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (err: any) {
      console.error('Error fetching gestao_inss:', err);
      showToast({
        title: 'Erro ao carregar',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  // ==========================================================================
  // COMPUTED
  // ==========================================================================

  const filteredRegistros = useMemo(() => {
    if (filterStatus === 'ALL') return registros;
    return registros.filter(r => r.status === filterStatus);
  }, [registros, filterStatus]);

  const totais = useMemo(() => {
    const pendentes = registros.filter(r => r.status === 'PENDENTE_RECOLHIMENTO');
    const recolhidos = registros.filter(r => r.status === 'RECOLHIDO' || r.status === 'BAIXADO');
    
    return {
      totalRegistros: registros.length,
      totalPendentes: pendentes.length,
      valorPatronalPendente: pendentes.reduce((sum, r) => sum + r.inss_patronal_20, 0),
      valorPatronalRecolhido: recolhidos.reduce((sum, r) => sum + r.inss_patronal_20, 0)
    };
  }, [registros]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const handleGerarGuia = async () => {
    if (selectedRegistros.size === 0) {
      showToast({
        title: 'Selecione registros',
        message: 'Selecione pelo menos um registro para gerar a guia.',
        type: 'error'
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simular geração de guia
      const guiaNumero = `GPS-${Date.now()}`;
      
      const { error } = await supabase
        .from('gestao_inss')
        .update({
          status: 'GUIA_GERADA',
          guia_numero: guiaNumero,
          guia_data_geracao: new Date().toISOString().split('T')[0]
        })
        .in('id', Array.from(selectedRegistros));

      if (error) throw error;

      showToast({
        title: 'Guia Gerada!',
        message: `Guia ${guiaNumero} gerada para ${selectedRegistros.size} registro(s).`,
        type: 'success'
      });

      setSelectedRegistros(new Set());
      fetchRegistros();
    } catch (err: any) {
      showToast({
        title: 'Erro ao gerar guia',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmarRecolhimento = async (registroId: string) => {
    try {
      const { error } = await supabase
        .from('gestao_inss')
        .update({
          status: 'RECOLHIDO',
          data_recolhimento: new Date().toISOString().split('T')[0]
        })
        .eq('id', registroId);

      if (error) throw error;

      showToast({
        title: 'Recolhimento confirmado!',
        message: 'O registro foi atualizado.',
        type: 'success'
      });

      fetchRegistros();
    } catch (err: any) {
      showToast({
        title: 'Erro',
        message: err.message,
        type: 'error'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      'PENDENTE_RECOLHIMENTO': { color: 'bg-amber-100 text-amber-700', label: 'Pendente' },
      'GUIA_GERADA': { color: 'bg-blue-100 text-blue-700', label: 'Guia Gerada' },
      'RECOLHIDO': { color: 'bg-emerald-100 text-emerald-700', label: 'Recolhido' },
      'BAIXADO': { color: 'bg-slate-100 text-slate-600', label: 'Baixado' }
    };
    return configs[status] || { color: 'bg-slate-100 text-slate-600', label: status };
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={32} className="animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Gestão de INSS Patronal</h2>
            <p className="text-white/80 text-sm">Controle de recolhimento dos 20% sobre serviços PF</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Total Registros</p>
            <p className="text-2xl font-black">{totais.totalRegistros}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Pendentes</p>
            <p className="text-2xl font-black">{totais.totalPendentes}</p>
          </div>
          <div className="bg-amber-400/30 rounded-xl p-3 text-center">
            <p className="text-[10px] text-white/80 uppercase tracking-wider">A Recolher</p>
            <p className="text-xl font-black">{formatCurrency(totais.valorPatronalPendente)}</p>
          </div>
          <div className="bg-emerald-400/30 rounded-xl p-3 text-center">
            <p className="text-[10px] text-white/80 uppercase tracking-wider">Recolhido</p>
            <p className="text-xl font-black">{formatCurrency(totais.valorPatronalRecolhido)}</p>
          </div>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['ALL', 'PENDENTE_RECOLHIMENTO', 'GUIA_GERADA', 'RECOLHIDO'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filterStatus === status 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'Todos' : getStatusBadge(status).label}
            </button>
          ))}
        </div>

        {selectedRegistros.size > 0 && (
          <button
            onClick={handleGerarGuia}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download size={18} />
                Gerar Guia GPS ({selectedRegistros.size})
              </>
            )}
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRegistros(new Set(filteredRegistros.filter(r => r.status === 'PENDENTE_RECOLHIMENTO').map(r => r.id)));
                    } else {
                      setSelectedRegistros(new Set());
                    }
                  }}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase">Prestador</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase">CPF/PIS</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase">Processo</th>
              <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase">Valor Bruto</th>
              <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase">INSS 20%</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRegistros.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              filteredRegistros.map(registro => {
                const badge = getStatusBadge(registro.status);
                return (
                  <tr key={registro.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {registro.status === 'PENDENTE_RECOLHIMENTO' && (
                        <input
                          type="checkbox"
                          checked={selectedRegistros.has(registro.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedRegistros);
                            if (e.target.checked) {
                              newSet.add(registro.id);
                            } else {
                              newSet.delete(registro.id);
                            }
                            setSelectedRegistros(newSet);
                          }}
                          className="rounded border-slate-300"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                          <User size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{registro.nome}</p>
                          <p className="text-xs text-slate-400">{registro.atividade}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-700">{registro.cpf}</p>
                      <p className="text-xs text-slate-400">{registro.pis_nit}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectProcess?.(registro.solicitacao_id)}
                        className="text-sm font-medium text-purple-600 hover:underline"
                      >
                        {registro.nup}
                      </button>
                      {registro.data_prestacao && (
                        <p className="text-xs text-slate-400">{formatDate(registro.data_prestacao)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-bold text-slate-800">{formatCurrency(registro.valor_bruto)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-black text-purple-700">{formatCurrency(registro.inss_patronal_20)}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {registro.status === 'GUIA_GERADA' && (
                        <button
                          onClick={() => handleConfirmarRecolhimento(registro.id)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                          title="Confirmar Recolhimento"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {registro.guia_numero && (
                        <span className="text-xs text-slate-400 block mt-1">
                          {registro.guia_numero}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestaoINSSTab;

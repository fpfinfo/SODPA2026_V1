import React, { useEffect, useState, useMemo } from 'react';
import {
  Wallet,
  DollarSign,
  User,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  Search,
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';

// =============================================================================
// TYPES
// =============================================================================

interface RegistroDevolucao {
  id: string;
  solicitacao_id: string;
  prestacao_contas_id: string;
  data_referencia: string;
  suprido_nome: string;
  numero_gdr: string;
  elemento_origem: string;
  valor_concedido: number;
  valor_gasto: number;
  valor_devolucao: number;
  status_gdr: 'PENDENTE' | 'CONFERIDO' | 'CONCILIADO' | 'DIVERGENCIA';
  data_confirmacao?: string;
  confirmado_por?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface GestaoDevolucoesTabProps {
  onSelectProcess?: (processId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const GestaoDevolucoesTab: React.FC<GestaoDevolucoesTabProps> = ({
  onSelectProcess
}) => {
  const { showToast } = useToast();
  const [registros, setRegistros] = useState<RegistroDevolucao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroDevolucao | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  // ==========================================================================
  // FETCH
  // ==========================================================================

  const fetchRegistros = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('gestao_devolucoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (err: any) {
      console.error('Error fetching gestao_devolucoes:', err);
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
    let result = registros;
    
    if (filterStatus !== 'ALL') {
      result = result.filter(r => r.status_gdr === filterStatus);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.suprido_nome.toLowerCase().includes(term) ||
        r.numero_gdr?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [registros, filterStatus, searchTerm]);

  const totais = useMemo(() => {
    const pendentes = registros.filter(r => r.status_gdr === 'PENDENTE');
    const conferidos = registros.filter(r => r.status_gdr === 'CONFERIDO');
    const conciliados = registros.filter(r => r.status_gdr === 'CONCILIADO');
    const divergentes = registros.filter(r => r.status_gdr === 'DIVERGENCIA');
    
    return {
      totalRegistros: registros.length,
      totalPendentes: pendentes.length,
      valorPendente: pendentes.reduce((sum, r) => sum + r.valor_devolucao, 0),
      valorConciliado: conciliados.reduce((sum, r) => sum + r.valor_devolucao, 0),
      totalDivergentes: divergentes.length
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

  const handleConfirmarCredito = async (registro: RegistroDevolucao) => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('gestao_devolucoes')
        .update({
          status_gdr: 'CONFERIDO',
          data_confirmacao: new Date().toISOString().split('T')[0],
          confirmado_por: user?.id
        })
        .eq('id', registro.id);

      if (error) throw error;

      showToast({
        title: 'Crédito Confirmado!',
        message: 'O crédito da GDR foi conferido no extrato.',
        type: 'success'
      });

      fetchRegistros();
    } catch (err: any) {
      showToast({
        title: 'Erro',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConciliar = async (registro: RegistroDevolucao) => {
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('gestao_devolucoes')
        .update({
          status_gdr: 'CONCILIADO',
          observacoes: observacoes || null
        })
        .eq('id', registro.id);

      if (error) throw error;

      // Atualizar status da prestação de contas
      if (registro.prestacao_contas_id) {
        await supabase
          .from('prestacao_contas')
          .update({
            status: 'ENCERRADA'
          })
          .eq('id', registro.prestacao_contas_id);
      }

      showToast({
        title: 'GDR Conciliada!',
        message: 'A devolução foi conciliada com sucesso.',
        type: 'success'
      });

      setSelectedRegistro(null);
      setObservacoes('');
      fetchRegistros();
    } catch (err: any) {
      showToast({
        title: 'Erro',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarcarDivergencia = async (registro: RegistroDevolucao) => {
    const motivo = prompt('Informe o motivo da divergência:');
    if (!motivo) return;

    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('gestao_devolucoes')
        .update({
          status_gdr: 'DIVERGENCIA',
          observacoes: motivo
        })
        .eq('id', registro.id);

      if (error) throw error;

      showToast({
        title: 'Divergência registrada',
        message: 'O registro foi marcado para análise.',
        type: 'success'
      });

      fetchRegistros();
    } catch (err: any) {
      showToast({
        title: 'Erro',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string; icon: typeof CheckCircle2 }> = {
      'PENDENTE': { color: 'bg-amber-100 text-amber-700', label: 'Pendente', icon: AlertTriangle },
      'CONFERIDO': { color: 'bg-blue-100 text-blue-700', label: 'Conferido', icon: Eye },
      'CONCILIADO': { color: 'bg-emerald-100 text-emerald-700', label: 'Conciliado', icon: CheckCircle2 },
      'DIVERGENCIA': { color: 'bg-red-100 text-red-700', label: 'Divergência', icon: AlertCircle }
    };
    return configs[status] || { color: 'bg-slate-100 text-slate-600', label: status, icon: AlertTriangle };
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={32} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Wallet size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Gestão de Devoluções</h2>
            <p className="text-white/80 text-sm">Conciliação de GDRs de saldo não utilizado</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Total GDRs</p>
            <p className="text-2xl font-black">{totais.totalRegistros}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Pendentes</p>
            <p className="text-2xl font-black">{totais.totalPendentes}</p>
          </div>
          <div className="bg-amber-400/30 rounded-xl p-3 text-center">
            <p className="text-[10px] text-white/80 uppercase tracking-wider">A Conferir</p>
            <p className="text-xl font-black">{formatCurrency(totais.valorPendente)}</p>
          </div>
          <div className="bg-emerald-400/30 rounded-xl p-3 text-center">
            <p className="text-[10px] text-white/80 uppercase tracking-wider">Conciliado</p>
            <p className="text-xl font-black">{formatCurrency(totais.valorConciliado)}</p>
          </div>
        </div>
      </div>

      {/* Divergências Alert */}
      {totais.totalDivergentes > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-800">{totais.totalDivergentes} GDR(s) com divergência</p>
            <p className="text-sm text-red-600">Verifique os valores e entre em contato com os supridos.</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {['ALL', 'PENDENTE', 'CONFERIDO', 'CONCILIADO', 'DIVERGENCIA'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filterStatus === status 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'Todos' : getStatusBadge(status).label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por suprido ou GDR..."
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 w-64"
          />
        </div>
      </div>

      {/* Cards de Registros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRegistros.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            Nenhum registro encontrado
          </div>
        ) : (
          filteredRegistros.map(registro => {
            const badge = getStatusBadge(registro.status_gdr);
            const Icon = badge.icon;
            
            return (
              <div 
                key={registro.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                    <Icon size={12} />
                    {badge.label}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(registro.data_referencia)}</span>
                </div>

                {/* Suprido */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <User size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{registro.suprido_nome}</p>
                    <p className="text-xs text-slate-400">GDR: {registro.numero_gdr || 'Não informado'}</p>
                  </div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <p className="text-[9px] text-slate-400 uppercase">Concedido</p>
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(registro.valor_concedido)}</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-[9px] text-blue-400 uppercase">Gasto</p>
                    <p className="text-sm font-bold text-blue-700">{formatCurrency(registro.valor_gasto)}</p>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-[9px] text-emerald-400 uppercase">Devolução</p>
                    <p className="text-sm font-black text-emerald-700">{formatCurrency(registro.valor_devolucao)}</p>
                  </div>
                </div>

                {/* Observações */}
                {registro.observacoes && (
                  <p className="text-xs text-slate-500 mb-4 p-2 bg-slate-50 rounded-lg italic">
                    {registro.observacoes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  {registro.status_gdr === 'PENDENTE' && (
                    <>
                      <button
                        onClick={() => handleConfirmarCredito(registro)}
                        disabled={isProcessing}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all disabled:opacity-50"
                      >
                        Confirmar Crédito
                      </button>
                      <button
                        onClick={() => handleMarcarDivergencia(registro)}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-all disabled:opacity-50"
                      >
                        Divergência
                      </button>
                    </>
                  )}
                  {registro.status_gdr === 'CONFERIDO' && (
                    <button
                      onClick={() => handleConciliar(registro)}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? 'Processando...' : 'Conciliar GDR'}
                    </button>
                  )}
                  {registro.status_gdr === 'CONCILIADO' && (
                    <div className="flex-1 text-center py-2 text-emerald-600 text-xs font-bold">
                      ✓ Conciliado em {registro.data_confirmacao ? formatDate(registro.data_confirmacao) : 'N/A'}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GestaoDevolucoesTab;

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  Users,
  Search,
  MapPin,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  RefreshCw,
  MoreHorizontal,
  Eye,
  History,
  Edit3,
  Filter,
  ChevronDown,
  UserPlus
} from 'lucide-react';
import { useNomeacao } from '../../hooks/useNomeacao';
import { useToast } from '../ui/ToastProvider';

interface UnidadeTitular {
  id: string;
  comarca_id: string;
  comarca_nome: string;
  comarca_codigo: string;
  tipo_suprimento: 'ORDINARIO' | 'JURI';
  suprido_atual_id: string | null;
  suprido_nome: string | null;
  suprido_email: string | null;
  suprido_avatar: string | null;
  servidor_tj_id: string | null;
  portaria_numero: string | null;
  portaria_data: string | null;
  status: 'REGULAR' | 'IRREGULAR' | 'SUSPENSO' | 'SEM_TITULAR' | 'PENDENTE_NOMEACAO';
  motivo_irregularidade: string | null;
  valor_mensal_custeio: number;
  valor_mensal_capital: number;
  ptres: string;
  updated_at: string;
  nomeacao_pendente_id: string | null;
}

interface SupridoMasterTableProps {
  onEditTitular?: (unidade: UnidadeTitular) => void;
  onViewHistory?: (unidadeId: string) => void;
}

export const SupridoMasterTable: React.FC<SupridoMasterTableProps> = ({
  onEditTitular,
  onViewHistory
}) => {
  const [titulares, setTitulares] = useState<UnidadeTitular[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tipoFilter, setTipoFilter] = useState<string>('ALL');
  
  const { approveNomeacao, rejectNomeacao } = useNomeacao()
  const { showToast } = useToast()
  
  // Pagination State
  const [visibleCount, setVisibleCount] = useState(20);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, statusFilter, tipoFilter]);

  // Fetch titulares from database
  const fetchTitulares = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('unidade_titulares')
        .select(`
          id,
          comarca_id,
          tipo_suprimento,
          suprido_atual_id,
          servidor_tj_id,
          portaria_numero,
          portaria_data,
          status,
          motivo_irregularidade,
          valor_mensal_custeio,
          valor_mensal_capital,
          ptres,
          updated_at,
          nomeacao_pendente_id,
          comarcas!unidade_titulares_comarca_id_fkey (
            nome,
            codigo
          ),
          profiles!unidade_titulares_suprido_atual_id_fkey (
            nome,
            email,
            avatar_url
          )
        `)
        .order('comarcas(nome)', { ascending: true });

      if (error) throw error;

      const transformed: UnidadeTitular[] = (data || []).map((item: any) => ({
        id: item.id,
        comarca_id: item.comarca_id,
        comarca_nome: item.comarcas?.nome || 'Comarca não encontrada',
        comarca_codigo: item.comarcas?.codigo || '--',
        tipo_suprimento: item.tipo_suprimento,
        suprido_atual_id: item.suprido_atual_id,
        suprido_nome: item.profiles?.nome || null,
        suprido_email: item.profiles?.email || null,
        suprido_avatar: item.profiles?.avatar_url || null,
        servidor_tj_id: item.servidor_tj_id,
        portaria_numero: item.portaria_numero,
        portaria_data: item.portaria_data,
        status: item.nomeacao_pendente_id ? 'PENDENTE_NOMEACAO' : item.status,
        motivo_irregularidade: item.motivo_irregularidade,
        valor_mensal_custeio: item.valor_mensal_custeio || 0,
        valor_mensal_capital: item.valor_mensal_capital || 0,
        ptres: item.ptres || '8193',
        updated_at: item.updated_at,
        nomeacao_pendente_id: item.nomeacao_pendente_id || null
      }));

      setTitulares(transformed);
    } catch (error) {
      console.error('Error fetching titulares:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTitulares();
  }, []);

  const handleApprove = async (titular: UnidadeTitular) => {
    if (!titular.nomeacao_pendente_id) return
    if(!confirm('Confirma a aprovação da troca de responsabilidade? A Portaria será efetivada e o novo suprido assumirá a comarca.')) return

    const res = await approveNomeacao(titular.nomeacao_pendente_id, titular.comarca_id)
    if (res.success) {
      showToast({ title: 'Aprovado', message: 'Troca de suprido efetivada.', type: 'success' })
      fetchTitulares()
    } else {
      showToast({ title: 'Erro', message: res.error, type: 'error' })
    }
  }

  // Filter titulares
  const filteredTitulares = useMemo(() => {
    return titulares.filter(t => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchComarca = t.comarca_nome.toLowerCase().includes(query);
        const matchSuprido = t.suprido_nome?.toLowerCase().includes(query);
        if (!matchComarca && !matchSuprido) return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      // Tipo filter
      if (tipoFilter !== 'ALL' && t.tipo_suprimento !== tipoFilter) return false;
      return true;
    });
  }, [titulares, searchQuery, statusFilter, tipoFilter]);

  // Pagination Logic
  const paginatedTitulares = useMemo(() => {
    return filteredTitulares.slice(0, visibleCount);
  }, [filteredTitulares, visibleCount]);

  // Stats
  const stats = useMemo(() => ({
    total: titulares.length,
    regular: titulares.filter(t => t.status === 'REGULAR').length,
    irregular: titulares.filter(t => t.status === 'IRREGULAR').length,
    semTitular: titulares.filter(t => t.status === 'SEM_TITULAR').length,
    suspenso: titulares.filter(t => t.status === 'SUSPENSO').length,
    pending: titulares.filter(t => t.status === 'PENDENTE_NOMEACAO').length
  }), [titulares]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGULAR':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200"><CheckCircle2 size={12}/> Regular</span>;
      case 'IRREGULAR':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-200"><AlertCircle size={12}/> Irregular</span>;
      case 'SUSPENSO':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200"><Clock size={12}/> Suspenso</span>;
      case 'SEM_TITULAR':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200"><UserX size={12}/> Sem Titular</span>;
      case 'PENDENTE_NOMEACAO':
         return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200 animate-pulse"><UserPlus size={12}/> Nomeação Pendente</span>;
      default:
        return <span className="text-slate-400 text-xs">--</span>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header with Stats */}
      <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Gestão de Supridos</h2>
              <p className="text-orange-100 text-sm font-medium">Fonte da Verdade - Titulares por Comarca</p>
            </div>
          </div>
          <button 
            onClick={fetchTitulares}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-black">{stats.total}</p>
            <p className="text-[10px] font-bold text-orange-100 uppercase tracking-wider">Total</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-black text-emerald-300">{stats.regular}</p>
            <p className="text-[10px] font-bold text-orange-100 uppercase tracking-wider">Regulares</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-black text-red-300">{stats.irregular}</p>
            <p className="text-[10px] font-bold text-orange-100 uppercase tracking-wider">Irregulares</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-black text-slate-300">{stats.semTitular}</p>
            <p className="text-[10px] font-bold text-orange-100 uppercase tracking-wider">Sem Titular</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-black text-amber-300">{stats.suspenso}</p>
            <p className="text-[10px] font-bold text-orange-100 uppercase tracking-wider">Suspensos</p>
          </div>
          {stats.pending > 0 && (
            <div className="bg-blue-600/30 backdrop-blur-sm rounded-xl p-3 text-center border border-blue-400/30 animate-pulse">
               <p className="text-3xl font-black text-blue-100">{stats.pending}</p>
               <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Pendentes</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por comarca ou suprido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="ALL">Todos Status</option>
            <option value="REGULAR">Regular</option>
            <option value="IRREGULAR">Irregular</option>
            <option value="SEM_TITULAR">Sem Titular</option>
            <option value="SUSPENSO">Suspenso</option>
            <option value="PENDENTE_NOMEACAO">Pendência</option>
          </select>
          
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="ALL">Todos Tipos</option>
            <option value="ORDINARIO">Ordinário</option>
            <option value="JURI">Júri</option>
          </select>
        </div>
        
        <span className="text-xs text-slate-500 font-medium">
          {filteredTitulares.length} de {titulares.length} registros
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={32} className="text-orange-500 animate-spin" />
          </div>
        ) : filteredTitulares.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Building2 size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-bold">Nenhum registro encontrado</p>
            <p className="text-sm">Ajuste os filtros ou aguarde a sincronização</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Comarca</th>
                <th className="text-left px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Suprido Titular</th>
                <th className="text-center px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="text-center px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Portaria</th>
                <th className="text-right px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Valor Mensal</th>
                <th className="text-center px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTitulares.map((titular) => (
                <tr key={titular.id} className="hover:bg-slate-50 transition-colors">
                  {/* Comarca */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{titular.comarca_nome}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{titular.comarca_codigo}</p>
                        {titular.nomeacao_pendente_id && (
                           <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-1 rounded border border-blue-100 mt-1 inline-block">
                             Troca Solicitada
                           </span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Suprido */}
                  <td className="px-4 py-3">
                    {titular.suprido_nome ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {titular.suprido_avatar ? (
                            <img src={titular.suprido_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            titular.suprido_nome.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{titular.suprido_nome}</p>
                          <p className="text-[10px] text-slate-400">{titular.suprido_email}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Não designado</span>
                    )}
                  </td>
                  
                  {/* Tipo */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      titular.tipo_suprimento === 'ORDINARIO' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {titular.tipo_suprimento}
                    </span>
                  </td>
                  
                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(titular.status)}
                  </td>
                  
                  {/* Portaria */}
                  <td className="px-4 py-3">
                    {titular.portaria_numero ? (
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-700 text-xs">{titular.portaria_numero}</p>
                          <p className="text-[10px] text-slate-400">
                            {titular.portaria_data ? new Date(titular.portaria_data).toLocaleDateString('pt-BR') : '--'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">--</span>
                    )}
                  </td>
                  
                  {/* Valor */}
                  <td className="px-4 py-3 text-right">
                    <p className="font-black text-slate-800">
                      {formatCurrency(titular.valor_mensal_custeio + titular.valor_mensal_capital)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      C: {formatCurrency(titular.valor_mensal_custeio)} | K: {formatCurrency(titular.valor_mensal_capital)}
                    </p>
                  </td>
                  
                  {/* Ações */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex gap-1">
                        <button 
                            onClick={() => onEditTitular?.(titular)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            title="Editar"
                        >
                            <Edit3 size={16} />
                        </button>
                        <button 
                            onClick={() => onViewHistory?.(titular.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            title="Histórico"
                        >
                            <History size={16} />
                        </button>
                      </div>

                      {/* Action for Approval */}
                      {titular.nomeacao_pendente_id && (
                        <button
                          onClick={() => handleApprove(titular)}
                          className="mt-1 w-full px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Analisar Portaria
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Load More Button */}
        {filteredTitulares.length > visibleCount && (
            <div className="p-4 flex flex-col items-center justify-center border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-400 mb-2 font-medium">
                    Exibindo {visibleCount} de {filteredTitulares.length} registros
                </p>
                <button 
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all hover:shadow-md"
                >
                    <ChevronDown size={16} />
                    Carregar Mais
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default SupridoMasterTable;

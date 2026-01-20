import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  Factory,
  Play,
  CheckSquare,
  Square,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  Zap,
  Download,
  Filter
} from 'lucide-react';
import { useToast } from '../ui/ToastProvider';

interface UnidadeConcessao {
  id: string;
  comarca_id: string;
  comarca_nome: string;
  comarca_codigo: string;
  suprido_id: string | null;
  suprido_nome: string | null;
  tipo_suprimento: string;
  status: string;
  valor_custeio: number;
  valor_capital: number;
  ptres: string;
  dotacao_id: string | null;
  dotacao_codigo: string | null;
  selected: boolean;
  processado: boolean;
  solicitacao_id: string | null;
}

interface OrdinaryProcessFactoryProps {
  competencia?: string;
  onProcessComplete?: () => void;
}

export const OrdinaryProcessFactory: React.FC<OrdinaryProcessFactoryProps> = ({
  competencia: initialCompetencia,
  onProcessComplete
}) => {
  const { showToast } = useToast();
  
  // Get current month as default competência
  const currentCompetencia = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  
  const [competencia, setCompetencia] = useState(initialCompetencia || currentCompetencia);
  const [unidades, setUnidades] = useState<UnidadeConcessao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });
  const [selectAll, setSelectAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDENTE' | 'PROCESSADO'>('ALL');

  // Fetch unidades from unidade_titulares
  const fetchUnidades = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('unidade_titulares')
        .select(`
          id,
          comarca_id,
          suprido_atual_id,
          tipo_suprimento,
          status,
          valor_mensal_custeio,
          valor_mensal_capital,
          ptres,
          dotacao_id,
          comarcas!unidade_titulares_comarca_id_fkey (
            nome,
            codigo
          ),
          profiles!unidade_titulares_suprido_atual_id_fkey (
            id,
            nome
          )
        `)
        .eq('tipo_suprimento', 'ORDINARIO')
        .in('status', ['REGULAR', 'SEM_TITULAR'])
        .order('comarcas(nome)', { ascending: true });

      if (error) throw error;

      // Check existing processes for this competência
      const { data: existingProcesses } = await supabase
        .from('solicitacoes')
        .select('id, lotacao_id')
        .eq('tipo', 'ORDINARIO')
        .ilike('competencia', competencia);

      const existingLotacoes = new Set((existingProcesses || []).map(p => p.lotacao_id));

      const transformed: UnidadeConcessao[] = (data || []).map((item: any) => ({
        id: item.id,
        comarca_id: item.comarca_id,
        comarca_nome: item.comarcas?.nome || 'N/A',
        comarca_codigo: item.comarcas?.codigo || '--',
        suprido_id: item.profiles?.id || item.suprido_atual_id,
        suprido_nome: item.profiles?.nome || null,
        tipo_suprimento: item.tipo_suprimento,
        status: item.status,
        valor_custeio: item.valor_mensal_custeio || 500,
        valor_capital: item.valor_mensal_capital || 0,
        ptres: item.ptres || '8193',
        dotacao_id: item.dotacao_id,
        dotacao_codigo: null,
        selected: false,
        processado: existingLotacoes.has(item.comarca_id),
        solicitacao_id: null
      }));

      setUnidades(transformed);
    } catch (error) {
      console.error('Error fetching unidades:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar unidades' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidades();
  }, [competencia]);

  // Handle selection
  const toggleSelect = (id: string) => {
    setUnidades(prev => prev.map(u => 
      u.id === id ? { ...u, selected: !u.selected } : u
    ));
  };

  const toggleSelectAll = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setUnidades(prev => prev.map(u => 
      u.processado ? u : { ...u, selected: newState }
    ));
  };

  // Handle value changes
  const updateValor = (id: string, field: 'valor_custeio' | 'valor_capital', value: number) => {
    setUnidades(prev => prev.map(u => 
      u.id === id ? { ...u, [field]: value } : u
    ));
  };

  // Filtered unidades
  const filteredUnidades = useMemo(() => {
    return unidades.filter(u => {
      if (filterStatus === 'PENDENTE') return !u.processado;
      if (filterStatus === 'PROCESSADO') return u.processado;
      return true;
    });
  }, [unidades, filterStatus]);

  // Selected count and totals
  const selectedUnidades = useMemo(() => unidades.filter(u => u.selected), [unidades]);
  const totalValor = useMemo(() => 
    selectedUnidades.reduce((sum, u) => sum + u.valor_custeio + u.valor_capital, 0),
    [selectedUnidades]
  );

  // Process batch concession
  const processarConcessao = async () => {
    if (selectedUnidades.length === 0) {
      showToast({ type: 'warning', title: 'Atenção', message: 'Selecione ao menos uma unidade' });
      return;
    }

    const unidadesSemTitular = selectedUnidades.filter(u => !u.suprido_id);
    if (unidadesSemTitular.length > 0) {
      showToast({ 
        type: 'error', 
        title: 'Unidades sem titular', 
        message: `${unidadesSemTitular.length} unidade(s) não possuem suprido designado` 
      });
      return;
    }

    // Validation: Valor must be > 0
    const unidadesSemValor = selectedUnidades.filter(u => (u.valor_custeio + u.valor_capital) <= 0);
    if (unidadesSemValor.length > 0) {
      showToast({ 
        type: 'error', 
        title: 'Valores inválidos', 
        message: `${unidadesSemValor.length} unidade(s) possuem valor zerado ou negativo` 
      });
      return;
    }

    setIsProcessing(true);
    setProcessProgress({ current: 0, total: selectedUnidades.length });

    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < selectedUnidades.length; i++) {
      const unidade = selectedUnidades[i];
      setProcessProgress({ current: i + 1, total: selectedUnidades.length });

      try {
        // 1. Create solicitação
        const nup = `TJPA-ORD-${competencia.replace('-', '')}-${String(i + 1).padStart(4, '0')}`;
        
        const { data: solicitacao, error: solError } = await supabase
          .from('solicitacoes')
          .insert({
            nup,
            tipo: 'ORDINARIO',
            competencia,
            user_id: unidade.suprido_id,
            lotacao_id: unidade.comarca_id,
            status: 'CONCEDIDO',
            valor_solicitado: unidade.valor_custeio + unidade.valor_capital,
            valor_total: unidade.valor_custeio + unidade.valor_capital,
            descricao: `Suprimento de Fundos Ordinário - Competência ${competencia}`,
            itens_despesa: JSON.stringify([
              { element: '3.3.90.30', desc: 'Material de Consumo', val: unidade.valor_custeio },
              { element: '3.3.90.39', desc: 'Outros Serviços', val: unidade.valor_capital }
            ]),
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (solError) throw solError;

        // 2. Create documents (Capa, Requerimento, Portaria, NE, DL, OB)
        const docs = [
          { tipo: 'CAPA', nome: 'Capa do Processo', status: 'GERADO' },
          { tipo: 'REQUERIMENTO', nome: 'Requerimento Inicial', status: 'GERADO' },
          { tipo: 'PORTARIA', nome: `Portaria de Concessão - ${competencia}`, status: 'MINUTA' },
          { tipo: 'CERTIDAO_REGULARIDADE', nome: 'Certidão de Regularidade', status: 'MINUTA' },
          { tipo: 'NOTA_EMPENHO', nome: 'Nota de Empenho', status: 'MINUTA' },
          { tipo: 'DOC_LIQUIDACAO', nome: 'Documento de Liquidação', status: 'MINUTA' },
          { tipo: 'ORDEM_BANCARIA', nome: 'Ordem Bancária', status: 'MINUTA' }
        ];

        for (const doc of docs) {
          await supabase.from('documentos').insert({
            solicitacao_id: solicitacao.id,
            tipo: doc.tipo,
            nome: doc.nome,
            status: doc.status,
            created_at: new Date().toISOString()
          });
        }

        // 3. Update unidade as processado
        setUnidades(prev => prev.map(u => 
          u.id === unidade.id ? { ...u, processado: true, selected: false, solicitacao_id: solicitacao.id } : u
        ));

        // 4. Create notification for the Suprido
        await supabase.from('system_notifications').insert({
          user_id: unidade.suprido_id,
          type: 'SUCCESS',
          category: 'FINANCE',
          title: 'Recurso Creditado!',
          message: `Suprimento Ordinário de ${formatCurrency(unidade.valor_custeio + unidade.valor_capital)} foi concedido para ${competenciaLabel}.`,
          link_action: `/suprido/processo/${solicitacao.id}`,
          metadata: {
            processo_id: solicitacao.id,
            nup: nup,
            competencia: competencia,
            valor: unidade.valor_custeio + unidade.valor_capital,
            origem: 'ORDINARY_PROCESS_FACTORY'
          }
        });

        sucessos++;
      } catch (error) {
        console.error('Error processing unidade:', unidade.id, error);
        erros++;
      }
    }

    setIsProcessing(false);
    setSelectAll(false);

    if (erros === 0) {
      showToast({ 
        type: 'success', 
        title: 'Concessão Processada!', 
        message: `${sucessos} processos criados com sucesso` 
      });
    } else {
      showToast({ 
        type: 'warning', 
        title: 'Processamento Parcial', 
        message: `${sucessos} sucessos, ${erros} erros` 
      });
    }

    onProcessComplete?.();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const competenciaLabel = useMemo(() => {
    const [year, month] = competencia.split('-');
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${months[parseInt(month) - 1]} de ${year}`;
  }, [competencia]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Factory size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Fábrica de Processos</h2>
              <p className="text-purple-200 text-sm font-medium">Concessão em Lote - Suprimento Ordinário</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Competência</p>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <input
                  type="month"
                  value={competencia}
                  onChange={(e) => setCompetencia(e.target.value)}
                  className="bg-transparent font-bold text-lg focus:outline-none"
                />
              </div>
            </div>
            
            <button 
              onClick={fetchUnidades}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-black">{unidades.length}</p>
            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Total Unidades</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-black text-emerald-300">{selectedUnidades.length}</p>
            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Selecionadas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-black text-amber-300">{unidades.filter(u => u.processado).length}</p>
            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Já Processadas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{formatCurrency(totalValor)}</p>
            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Valor Selecionado</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            {selectAll ? <CheckSquare size={16} className="text-purple-600" /> : <Square size={16} />}
            Selecionar Todos
          </button>
          
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-none"
            >
              <option value="ALL">Todas</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="PROCESSADO">Processadas</option>
            </select>
          </div>
        </div>

        {/* FAB - Main Action */}
        <button
          onClick={processarConcessao}
          disabled={isProcessing || selectedUnidades.length === 0}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-lg ${
            selectedUnidades.length > 0 && !isProcessing
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-purple-200'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processando {processProgress.current}/{processProgress.total}...
            </>
          ) : (
            <>
              <Play size={18} />
              Processar Concessão Mensal
              {selectedUnidades.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-lg text-xs">
                  {selectedUnidades.length} unidades
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={32} className="text-purple-500 animate-spin" />
          </div>
        ) : filteredUnidades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Building2 size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-bold">Nenhuma unidade encontrada</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="w-12 px-4 py-3"></th>
                <th className="text-left px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Comarca</th>
                <th className="text-left px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Suprido Titular</th>
                <th className="text-right px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Custeio (R$)</th>
                <th className="text-right px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Capital (R$)</th>
                <th className="text-center px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">PTRES</th>
                <th className="text-center px-4 py-3 font-black text-[10px] text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnidades.map((unidade) => (
                <tr 
                  key={unidade.id} 
                  className={`transition-colors ${
                    unidade.processado 
                      ? 'bg-emerald-50/50' 
                      : unidade.selected 
                        ? 'bg-purple-50' 
                        : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3 text-center">
                    {unidade.processado ? (
                      <CheckCircle2 size={20} className="text-emerald-500 mx-auto" />
                    ) : (
                      <button
                        onClick={() => toggleSelect(unidade.id)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        {unidade.selected ? (
                          <CheckSquare size={20} className="text-purple-600" />
                        ) : (
                          <Square size={20} className="text-slate-300" />
                        )}
                      </button>
                    )}
                  </td>
                  
                  {/* Comarca */}
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{unidade.comarca_nome}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{unidade.comarca_codigo}</p>
                  </td>
                  
                  {/* Suprido */}
                  <td className="px-4 py-3">
                    {unidade.suprido_nome ? (
                      <p className="font-medium text-slate-700">{unidade.suprido_nome}</p>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs">
                        <AlertCircle size={12} /> Sem titular
                      </span>
                    )}
                  </td>
                  
                  {/* Custeio - Editable */}
                  <td className="px-4 py-3 text-right">
                    {unidade.processado ? (
                      <span className="font-bold text-slate-700">{formatCurrency(unidade.valor_custeio)}</span>
                    ) : (
                      <input
                        type="number"
                        value={unidade.valor_custeio}
                        onChange={(e) => updateValor(unidade.id, 'valor_custeio', parseFloat(e.target.value) || 0)}
                        className="w-28 px-2 py-1 text-right font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    )}
                  </td>
                  
                  {/* Capital - Editable */}
                  <td className="px-4 py-3 text-right">
                    {unidade.processado ? (
                      <span className="font-bold text-slate-700">{formatCurrency(unidade.valor_capital)}</span>
                    ) : (
                      <input
                        type="number"
                        value={unidade.valor_capital}
                        onChange={(e) => updateValor(unidade.id, 'valor_capital', parseFloat(e.target.value) || 0)}
                        className="w-28 px-2 py-1 text-right font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    )}
                  </td>
                  
                  {/* PTRES */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono font-bold rounded">
                      {unidade.ptres}
                    </span>
                  </td>
                  
                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    {unidade.processado ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg">
                        <CheckCircle2 size={12} /> Processado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">
                        Pendente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrdinaryProcessFactory;

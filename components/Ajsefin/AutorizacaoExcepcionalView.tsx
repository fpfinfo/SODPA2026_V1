import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';
import { 
  Gavel, 
  ArrowLeft,
  FileText,
  AlertCircle,
  Eye,
  Send,
  Loader2,
  CheckCircle2,
  Users,
  Utensils
} from 'lucide-react';

interface JuriException {
  tipo: 'POLICIAIS' | 'ALMOCO' | 'JANTAR' | 'LANCHE' | 'PRAZO' | 'PC_FORA_PRAZO';
  solicitado: number;
  limite: number;
  excedente: number;
}

interface ExceptionalProcess {
  id: string;
  nup: string;
  tipo: string;
  status: string;
  valor_solicitado: number;
  suprido_nome?: string;
  comarca_destino: string;
  created_at: string;
  data_inicio?: string;
  juri_participantes?: {
    policias?: number;
    jurados?: number;
    servidores?: number;
    testemunhas?: number;
    defensor?: number;
    promotor?: number;
    reus?: number;
  };
  juri_projecao_custos?: any[];
  juri_dias?: number;
  profiles?: { nome: string };
}

interface AutorizacaoExcepcionalViewProps {
  onBack: () => void;
  onViewProcess: (processId: string) => void;
  currentUserId: string;
}

const LIMITS = {
  policiais: 5,
  almoco: 30.00,
  jantar: 30.00,
  lanche: 11.00,
  prazo_minimo_dias: 7
};

/**
 * AutorizacaoExcepcionalView - Lista processos aguardando autorização excepcional de júri
 * Permite ao AJSEFIN preparar e enviar documentos de autorização ao Ordenador
 */
export const AutorizacaoExcepcionalView: React.FC<AutorizacaoExcepcionalViewProps> = ({
  onBack,
  onViewProcess,
  currentUserId
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [processes, setProcesses] = useState<ExceptionalProcess[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ExceptionalProcess | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch processes with status AGUARDANDO AUTORIZACAO EXCEPCIONAL
  useEffect(() => {
    const fetchProcesses = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('solicitacoes')
          .select(`
            id,
            nup,
            tipo,
            status,
            valor_solicitado,
            comarca_destino,
            created_at,
            data_inicio,
            juri_participantes,
            juri_projecao_custos,
            juri_dias,
            user_id,
            profiles:user_id(nome)
          `)
          .eq('destino_atual', 'AJSEFIN')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Map processes with profile names
        const mappedProcesses = (data || []).map((p: any) => ({
          ...p,
          suprido_nome: p.profiles?.nome || 'Suprido'
        }));
        
        setProcesses(mappedProcesses);
      } catch (err) {
        console.error('Error fetching exceptional processes:', err);
        showToast({
          type: 'error',
          title: 'Erro',
          message: 'Não foi possível carregar os processos.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcesses();
  }, []);

  // Detect exceptions from process data
  const detectExceptions = (process: ExceptionalProcess): JuriException[] => {
    const exceptions: JuriException[] = [];
    
    // Check policiais from juri_participantes (correct field name)
    const policias = process.juri_participantes?.policias || 0;
    if (policias > LIMITS.policiais) {
      exceptions.push({
        tipo: 'POLICIAIS',
        solicitado: policias,
        limite: LIMITS.policiais,
        excedente: policias - LIMITS.policiais
      });
    }

    // Check meal values from juri_projecao_custos (correct field name)
    if (Array.isArray(process.juri_projecao_custos)) {
      process.juri_projecao_custos.forEach((item: any) => {
        const unitValue = item.approvedUnitValue || item.unitValue || 0;
        const id = item.id?.toLowerCase() || '';
        
        if (id.includes('almoco') && unitValue > LIMITS.almoco) {
          exceptions.push({
            tipo: 'ALMOCO',
            solicitado: unitValue,
            limite: LIMITS.almoco,
            excedente: unitValue - LIMITS.almoco
          });
        }
        if (id.includes('jantar') && unitValue > LIMITS.jantar) {
          exceptions.push({
            tipo: 'JANTAR',
            solicitado: unitValue,
            limite: LIMITS.jantar,
            excedente: unitValue - LIMITS.jantar
          });
        }
        if (id.includes('lanche') && unitValue > LIMITS.lanche) {
          exceptions.push({
            tipo: 'LANCHE',
            solicitado: unitValue,
            limite: LIMITS.lanche,
            excedente: unitValue - LIMITS.lanche
          });
        }
      });
    }

    // Check deadline exception (prazo de antecedência)
    if (process.data_inicio) {
      const eventDate = new Date(process.data_inicio);
      const createdDate = new Date(process.created_at);
      createdDate.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      
      const diffTime = eventDate.getTime() - createdDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays < LIMITS.prazo_minimo_dias) {
        exceptions.push({
          tipo: 'PRAZO',
          solicitado: diffDays,
          limite: LIMITS.prazo_minimo_dias,
          excedente: LIMITS.prazo_minimo_dias - diffDays
        });
      }
    }

    return exceptions;
  };

  const formatExceptionLabel = (tipo: JuriException['tipo']) => {
    switch (tipo) {
      case 'POLICIAIS': return 'Policiais';
      case 'ALMOCO': return 'Almoço';
      case 'JANTAR': return 'Jantar';
      case 'LANCHE': return 'Lanche';
      case 'PRAZO': return 'Prazo de Antecedência';
      case 'PC_FORA_PRAZO': return 'PC Fora do Prazo';
      default: return tipo;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Generate authorization document
  const handleGenerateAuthorization = async (process: ExceptionalProcess) => {
    setIsGenerating(true);
    try {
      const exceptions = detectExceptions(process);
      
      // Create the authorization document
      const { data: doc, error: docError } = await supabase
        .from('documentos')
        .insert({
          solicitacao_id: process.id,
          tipo: 'AUTORIZACAO_ORDENADOR',
          nome: `Autorização de Despesa Excepcional - ${process.nup}`,
          titulo: 'Autorização de Despesa Excepcional - Sessão de Júri',
          status: 'MINUTA',
          created_by: currentUserId,
          metadata: {
            exceptions: exceptions,
            numero_autorizacao: String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0'),
            processo_nup: process.nup,
            suprido_nome: process.suprido_nome,
            unidade: process.unidade,
            valor_total: process.valor_total
          }
        })
        .select()
        .single();

      if (docError) throw docError;

      showToast({
        type: 'success',
        title: 'Documento Gerado',
        message: 'Autorização de Despesa Excepcional criada com sucesso. Encaminhe para assinatura do Ordenador.'
      });

      // Optionally: Update process status or trigger tramitation
      // For now, just refresh the list
      setSelectedProcess(null);
      
    } catch (err) {
      console.error('Error generating authorization:', err);
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível gerar o documento de autorização.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Tramit to SEFIN
  const handleTramitToSefin = async (process: ExceptionalProcess) => {
    try {
      // First, find the authorization document we created
      const { data: authDoc } = await supabase
        .from('documentos')
        .select('id')
        .eq('solicitacao_id', process.id)
        .eq('tipo', 'AUTORIZACAO_ORDENADOR')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Create sefin_task for SEFIN inbox
      const { error: taskError } = await supabase
        .from('sefin_tasks')
        .insert({
          solicitacao_id: process.id,
          documento_id: authDoc?.id || null,
          tipo: 'AUTORIZACAO_ORDENADOR',
          status: 'PENDING',
          titulo: `Autorização Excepcional - ${process.suprido_nome}`,
          valor: process.valor_total
        });

      if (taskError) {
        console.error('Error creating sefin_task:', taskError);
        // Continue even if task creation fails - tramitation is more important
      }

      // Update status
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({ status: 'AGUARDANDO ASSINATURA ORDENADOR' })
        .eq('id', process.id);

      if (updateError) throw updateError;

      // Record tramitation
      await supabase
        .from('tramitacoes')
        .insert({
          solicitacao_id: process.id,
          origem: 'AJSEFIN',
          destino: 'SEFIN',
          observacao: 'Encaminhado para assinatura do Ordenador de Despesas - Autorização Excepcional de Júri',
          user_id: currentUserId
        });

      showToast({
        type: 'success',
        title: 'Processo Tramitado',
        message: 'Processo enviado para assinatura do Ordenador de Despesas.'
      });

      // Remove from list
      setProcesses(prev => prev.filter(p => p.id !== process.id));
      setSelectedProcess(null);

    } catch (err) {
      console.error('Error tramiting to SEFIN:', err);
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível tramitar o processo.'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={48} className="animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-in slide-in-from-right-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-purple-600 hover:shadow-md transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Gavel className="text-purple-600" size={28} />
              Autorizações Excepcionais de Júri
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Processos com valores acima dos limites regulamentares aguardando autorização.
            </p>
          </div>
        </div>
        <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100">
          {processes.length} Pendentes
        </div>
      </div>

      {/* Process List */}
      <div className="bg-white rounded-[24px] shadow-lg border border-slate-200 overflow-hidden">
        {processes.length === 0 ? (
          <div className="px-6 py-20 text-center text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 size={48} className="text-emerald-200" />
              <p className="font-medium text-sm">Nenhum processo aguardando autorização excepcional.</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Processo / Suprido
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Unidade
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Valor
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Exceções
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processes.map(process => {
                const exceptions = detectExceptions(process);
                return (
                  <tr 
                    key={process.id} 
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedProcess(process)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700 text-sm">{process.suprido_nome}</div>
                      <div className="text-[10px] font-mono text-slate-400">{process.nup}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-slate-600 max-w-xs truncate">
                        {process.comarca_destino || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-800">
                        {formatCurrency(Number(process.valor_solicitado) || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {exceptions.map((exc, i) => (
                          <span 
                            key={i}
                            className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                              exc.tipo === 'POLICIAIS' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}
                          >
                            {exc.tipo === 'POLICIAIS' ? (
                              <span className="flex items-center gap-1">
                                <Users size={10} /> {exc.solicitado}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Utensils size={10} /> {formatCurrency(exc.solicitado)}
                              </span>
                            )}
                          </span>
                        ))}
                        {exceptions.length === 0 && (
                          <span className="text-[10px] text-slate-400 italic">Nenhuma detectada</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewProcess(process.id); }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
                        >
                          <Eye size={14} /> Ver
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedProcess(process); }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-all shadow-sm"
                        >
                          <FileText size={14} /> Preparar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail/Action Modal */}
      {selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Gavel className="text-purple-600" size={24} />
                    Autorização Excepcional
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{selectedProcess.nup}</p>
                </div>
                <button 
                  onClick={() => setSelectedProcess(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Process Info */}
              <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Servidor Suprido</p>
                  <p className="text-sm font-bold text-slate-800">{selectedProcess.suprido_nome}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unidade</p>
                  <p className="text-sm font-bold text-slate-800">{selectedProcess.unidade}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Total</p>
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(selectedProcess.valor_total || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</p>
                  <p className="text-sm font-bold text-slate-800">{selectedProcess.tipo}</p>
                </div>
              </div>

              {/* Exceptions Detail */}
              <div>
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-500" />
                  Exceções a Autorizar
                </h4>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  {detectExceptions(selectedProcess).map((exc, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {exc.tipo === 'POLICIAIS' ? (
                          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                            <Users size={16} />
                          </div>
                        ) : (
                          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                            <Utensils size={16} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-800">{formatExceptionLabel(exc.tipo)}</p>
                          <p className="text-xs text-slate-500">
                            Limite: {exc.tipo === 'POLICIAIS' ? `${exc.limite} pessoas` : formatCurrency(exc.limite)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-700">
                          {exc.tipo === 'POLICIAIS' ? `${exc.solicitado} pessoas` : formatCurrency(exc.solicitado)}
                        </p>
                        <p className="text-[10px] text-amber-600 font-bold">
                          +{exc.tipo === 'POLICIAIS' ? exc.excedente : formatCurrency(exc.excedente)} excedente
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Próximos passos:</strong> Ao clicar em "Gerar Autorização", será criado um documento 
                  formal de Autorização de Despesa Excepcional. Após revisão, o documento deve ser tramitado 
                  para assinatura do Ordenador de Despesas (SEFIN).
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedProcess(null)}
                className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleGenerateAuthorization(selectedProcess)}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition-all shadow-lg disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileText size={16} />
                )}
                Gerar Autorização
              </button>
              <button
                onClick={() => handleTramitToSefin(selectedProcess)}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg"
              >
                <Send size={16} />
                Enviar ao Ordenador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutorizacaoExcepcionalView;

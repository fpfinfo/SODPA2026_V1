import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Users, 
  Utensils, 
  Save, 
  Loader2, 
  AlertTriangle,
  Scale,
  Clock,
  Edit3
} from 'lucide-react';
import { useToast } from '../../ui/ToastProvider';
import { ContextualExceptionBanner } from './ContextualExceptionBanner';
import { JuriException } from '../../../hooks/useExceptionDetection';
import { TramitarModal } from '../../TramitarModal';

interface JuriParticipants {
  servidores: number;
  reus: number;
  jurados: number;
  testemunhas: number;
  defensor: number;
  promotor: number;
  policias: number;
  [key: string]: number;
}

interface ProjectionItem {
  id: string;
  description: string;
  element: string;
  unitValue: number;
  quantity: number;
  total: number;
  isAuto?: boolean;
  freqType?: string;
  approvedQty?: number;
  approvedUnitValue?: number;
}

interface JuriAdjustmentTabProps {
  processData: any;
  onRefresh?: () => void;
  viewerRole?: 'USER' | 'SUPRIDO' | 'GESTOR' | 'SOSFU' | 'AJSEFIN' | 'SEFIN' | 'SODPA' | 'SGP' | 'PRESIDENCIA';
}

const PARTICIPANT_LABELS: Record<string, string> = {
  servidores: 'Servidores',
  reus: 'Réus',
  jurados: 'Jurados',
  testemunhas: 'Testemunhas',
  defensor: 'Defensor Público',
  promotor: 'Promotor',
  policias: 'Policiais'
};

// Default items matching SupridoDashboard
const DEFAULT_JURI_ITEMS: ProjectionItem[] = [
  { id: 'almoco', description: 'Refeição - Almoço', element: '3.3.90.39.01 - Material de Consumo', unitValue: 30, quantity: 0, total: 0, isAuto: true, freqType: 'almocos' },
  { id: 'jantar', description: 'Refeição - Jantar', element: '3.3.90.39.01 - Material de Consumo', unitValue: 25, quantity: 0, total: 0, isAuto: true, freqType: 'jantares' },
  { id: 'lanche', description: 'Lanches', element: '3.3.90.30.01 - Material de Consumo', unitValue: 10, quantity: 0, total: 0, isAuto: true, freqType: 'lanches' },
  { id: 'agua', description: 'Água Mineral 20L', element: '3.3.90.30.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'biscoito', description: 'Biscoito / Bolacha', element: '3.3.90.30.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'suco', description: 'Suco - Polpa KG', element: '3.3.90.30.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'cafe', description: 'Café KG', element: '3.3.90.30.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'acucar', description: 'Açúcar KG', element: '3.3.90.30.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'descartaveis', description: 'Descartáveis', element: '3.3.90.30.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'material', description: 'Material de Expediente', element: '3.3.90.30.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'combustivel', description: 'Combustível', element: '3.3.90.30.02 - Combustíveis e Lubrificantes', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'xerox', description: 'Foto Cópia (Xerox)', element: '3.3.90.39.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'som', description: 'Serviço de Som', element: '3.3.90.39.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'locacao', description: 'Locação de Equipamentos Diversos', element: '3.3.90.39.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'outros', description: 'Outros (Especificar)', element: '3.3.90.30.01 - Material de Consumo', unitValue: 0, quantity: 0, total: 0, isAuto: false },
];

const INITIAL_PARTICIPANTS: JuriParticipants = {
  servidores: 0,
  reus: 0,
  jurados: 0,
  testemunhas: 0,
  defensor: 0,
  promotor: 0,
  policias: 0
};

// Helper to safely parse JSON
const safeParse = (value: any, fallback: any) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const JuriAdjustmentTab: React.FC<JuriAdjustmentTabProps> = ({ 
  processData, 
  onRefresh,
  viewerRole = 'SOSFU'
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [solicitacao, setSolicitacao] = useState<any>(null);
  
  // Requested values (read-only)
  const [participantesSolicitados, setParticipantesSolicitados] = useState<JuriParticipants>({...INITIAL_PARTICIPANTS});
  const [projecaoSolicitada, setProjecaoSolicitada] = useState<ProjectionItem[]>([]);
  
  // Approved values (editable)
  const [participantesAprovados, setParticipantesAprovados] = useState<JuriParticipants>({...INITIAL_PARTICIPANTS});
  const [projecaoAprovada, setProjecaoAprovada] = useState<ProjectionItem[]>([]);
  
  const [lastUpdate, setLastUpdate] = useState<{ by: string; at: string } | null>(null);
  
  // Tramitação modal state
  const [showTramitarModal, setShowTramitarModal] = useState(false);

  useEffect(() => {
    const fetchSolicitacao = async () => {
      if (!processData?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('solicitacoes')
          .select('*')
          .eq('id', processData.id)
          .single();

        if (error) throw error;
        if (data) {
          setSolicitacao(data);
          console.log('Fetched solicitacao data:', data);
          
          // Parse requested participants
          const participantes = safeParse(data.juri_participantes, {...INITIAL_PARTICIPANTS});
          const safeParticipantes = {...INITIAL_PARTICIPANTS};
          Object.keys(INITIAL_PARTICIPANTS).forEach(key => {
            safeParticipantes[key] = Number(participantes[key]) || 0;
          });
          setParticipantesSolicitados(safeParticipantes);
          
          // Parse requested projection items
          let projecao = safeParse(data.juri_projecao_custos, DEFAULT_JURI_ITEMS);
          if (!Array.isArray(projecao) || projecao.length === 0) {
            projecao = DEFAULT_JURI_ITEMS;
          }
          setProjecaoSolicitada(projecao);
          
          // Parse approved participants (default to requested if not set)
          const participantesAprov = safeParse(data.juri_participantes_aprovados, null);
          if (participantesAprov) {
            const safeAprov = {...INITIAL_PARTICIPANTS};
            Object.keys(INITIAL_PARTICIPANTS).forEach(key => {
              safeAprov[key] = Number(participantesAprov[key]) || 0;
            });
            setParticipantesAprovados(safeAprov);
          } else {
            setParticipantesAprovados({...safeParticipantes});
          }
          
          // Parse approved projection (default to requested if not set)
          const projecaoAprov = safeParse(data.juri_projecao_aprovados, null);
          if (projecaoAprov && Array.isArray(projecaoAprov) && projecaoAprov.length > 0) {
            setProjecaoAprovada(projecaoAprov);
          } else {
            // Initialize approved with same values as requested
            setProjecaoAprovada(projecao.map((item: ProjectionItem) => ({
              ...item,
              approvedQty: item.quantity,
              approvedUnitValue: item.unitValue
            })));
          }
          
          // Set last update info
          if (data.updated_at) {
            setLastUpdate({
              by: data.updated_by_name || 'Sistema',
              at: new Date(data.updated_at).toLocaleString('pt-BR')
            });
          }
        }
      } catch (error) {
        console.error('Error fetching solicitacao:', error);
        showToast({ type: 'error', title: 'Erro ao carregar dados do processo' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolicitacao();
  }, [processData?.id]);

  // Calculate total approved participants
  const totalParticipantesAprovados = Object.values(participantesAprovados).reduce((a, b) => a + b, 0);
  const totalParticipantesSolicitados = Object.values(participantesSolicitados).reduce((a, b) => a + b, 0);

  // Auto-recalculate AUTO items when approved participants change
  useEffect(() => {
    if (projecaoAprovada.length === 0 || isLoading) return;
    
    // Get the multiplier from the original solicitation (sessions count)
    // Original: QTD_SOLIC / TOTAL_PARTICIPANTES_SOLIC = sessions per participant
    const getOriginalMultiplier = (itemId: string): number => {
      const originalItem = projecaoSolicitada.find(i => i.id === itemId);
      if (!originalItem || totalParticipantesSolicitados === 0) return 2; // default 2 sessions
      // Calculate how many sessions were originally planned
      const multiplier = originalItem.quantity / totalParticipantesSolicitados;
      return multiplier > 0 ? multiplier : 2;
    };
    
    setProjecaoAprovada(prev => prev.map(item => {
      // Only auto-update items marked as isAuto
      if (item.isAuto && (item.id === 'almoco' || item.id === 'jantar' || item.id === 'lanche')) {
        const multiplier = getOriginalMultiplier(item.id);
        const newQty = Math.round(totalParticipantesAprovados * multiplier);
        return {
          ...item,
          approvedQty: newQty
        };
      }
      return item;
    }));
  }, [totalParticipantesAprovados, totalParticipantesSolicitados, projecaoSolicitada, isLoading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({
          juri_participantes_aprovados: participantesAprovados,
          juri_projecao_aprovados: projecaoAprovada,
          updated_at: new Date().toISOString()
        })
        .eq('id', processData.id);

      if (error) throw error;
      
      showToast({ type: 'success', title: 'Quantidades aprovadas salvas com sucesso!' });
      setLastUpdate({
        by: 'Você',
        at: new Date().toLocaleString('pt-BR')
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error saving approved values:', error);
      showToast({ type: 'error', title: 'Erro ao salvar', message: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const totalSolicitado = projecaoSolicitada.reduce((acc, item) => acc + (item.quantity * item.unitValue), 0);
  const totalAprovado = projecaoAprovada.reduce((acc, item) => {
    const qty = item.approvedQty ?? item.quantity;
    const unitVal = item.approvedUnitValue ?? item.unitValue;
    return acc + (qty * unitVal);
  }, 0);

  const updateApprovedQty = (index: number, value: number) => {
    setProjecaoAprovada(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, approvedQty: value };
      }
      return item;
    }));
  };

  const updateApprovedUnitValue = (index: number, value: number) => {
    setProjecaoAprovada(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, approvedUnitValue: value };
      }
      return item;
    }));
  };

  // Limits configuration
  const LIMITS = {
    policiais: 5,
    almoco: 30.00,
    jantar: 30.00,
    lanche: 11.00
  };

  // Detect exceptions based on current approved values
  const detectedExceptions = useMemo((): JuriException[] => {
    const exceptions: JuriException[] = [];
    
    // Check policiais limit
    const policiais = participantesAprovados.policias || 0;
    if (policiais > LIMITS.policiais) {
      exceptions.push({
        tipo: 'POLICIAIS',
        solicitado: policiais,
        limite: LIMITS.policiais,
        excedente: policiais - LIMITS.policiais
      });
    }
    
    // Check meal values
    projecaoAprovada.forEach(item => {
      const unitValue = item.approvedUnitValue ?? item.unitValue ?? 0;
      
      if (item.id === 'almoco' && unitValue > LIMITS.almoco) {
        exceptions.push({
          tipo: 'VALOR_ALMOCO',
          solicitado: unitValue,
          limite: LIMITS.almoco,
          excedente: unitValue - LIMITS.almoco
        });
      }
      
      if (item.id === 'jantar' && unitValue > LIMITS.jantar) {
        exceptions.push({
          tipo: 'VALOR_JANTAR',
          solicitado: unitValue,
          limite: LIMITS.jantar,
          excedente: unitValue - LIMITS.jantar
        });
      }
      
      if (item.id === 'lanche' && unitValue > LIMITS.lanche) {
        exceptions.push({
          tipo: 'VALOR_LANCHE',
          solicitado: unitValue,
          limite: LIMITS.lanche,
          excedente: unitValue - LIMITS.lanche
        });
      }
    });
    
    return exceptions;
  }, [participantesAprovados, projecaoAprovada]);

  const hasExceptions = detectedExceptions.length > 0;

  // Handler for requesting authorization - opens tramitação modal
  const handleRequestAuthorization = () => {
    // Open tramitação modal for SOSFU to send to AJSEFIN
    if (viewerRole === 'SOSFU') {
      setShowTramitarModal(true);
    } else {
      showToast({ 
        type: 'info', 
        title: 'Ação não disponível', 
        message: 'Apenas SOSFU pode encaminhar para autorização excepcional.'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Scale size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black">Ajuste de Quantidades Aprovadas</h2>
              <p className="text-amber-100 text-sm">
                Revise e ajuste as quantidades antes de iniciar a execução da despesa
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-amber-100 text-xs uppercase tracking-wider">Processo</p>
            <p className="font-bold">{processData.nup}</p>
            <p className="text-amber-200 text-sm">{solicitacao?.subtipo || processData.tipo}</p>
          </div>
        </div>
      </div>

      {/* Last Update Info */}
      {lastUpdate && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <Clock size={16} className="text-slate-400" />
          <span className="text-sm text-slate-600">
            Última alteração: <span className="font-medium">{lastUpdate.at}</span> por <span className="font-medium">{lastUpdate.by}</span>
          </span>
        </div>
      )}

      {/* Contextual Exception Banner - adapts to user role and authorization status */}
      {hasExceptions && (
        <ContextualExceptionBanner
          exceptions={detectedExceptions}
          currentRole={viewerRole}
          authorizationStatus="PENDING"
          hasOficioAttached={false}
          hasCertidaoAttached={false}
          hasAutorizacaoAttached={false}
          onPrimaryAction={handleRequestAuthorization}
        />
      )}

      {/* ========== PARTICIPANTES TABLE ========== */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-800">Participantes</h3>
            <p className="text-xs text-slate-500">Compare as quantidades solicitadas com as aprovadas</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria</th>
                <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Qtd Solicitada</th>
                <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50">
                  <div className="flex items-center justify-center gap-1">
                    <Edit3 size={10} /> Qtd Aprovada
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Diferença</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(PARTICIPANT_LABELS).map(([key, label]) => {
                const solicitado = participantesSolicitados[key] || 0;
                const aprovado = participantesAprovados[key] || 0;
                const diff = aprovado - solicitado;
                
                return (
                  <tr key={key} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{label}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-600 font-bold text-lg">{solicitado}</span>
                    </td>
                    <td className="px-6 py-4 bg-blue-50/30">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          min="0"
                          value={aprovado}
                          onChange={(e) => setParticipantesAprovados(prev => ({
                            ...prev,
                            [key]: parseInt(e.target.value) || 0
                          }))}
                          className="w-20 px-3 py-2 border-2 border-blue-200 rounded-lg text-center font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {diff !== 0 ? (
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          diff < 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== ITENS DA PROJEÇÃO TABLE ========== */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Utensils size={18} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-800">Itens da Projeção</h3>
            <p className="text-xs text-slate-500">Quantidades de refeições calculadas automaticamente com base no painel acima. Outros itens são editáveis manualmente.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Elemento de Despesa</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">VL. UNIT.</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">QTD SOLIC.</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50">
                  <div className="flex items-center justify-center gap-1">
                    <Edit3 size={10} /> VL. UNIT. APROV.
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50">
                  <div className="flex items-center justify-center gap-1">
                    <Edit3 size={10} /> QTD APROV.
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">TOTAL SOLIC.</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50">TOTAL APROV.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projecaoAprovada.map((item, index) => {
                const originalItem = projecaoSolicitada[index] || item;
                const approvedQty = item.approvedQty ?? item.quantity;
                const approvedUnitVal = item.approvedUnitValue ?? item.unitValue;
                const approvedTotal = approvedQty * approvedUnitVal;
                const solicitadoTotal = originalItem.quantity * originalItem.unitValue;
                
                return (
                  <tr key={item.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{item.description}</span>
                        {item.isAuto && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">AUTO</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{item.element}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-500 font-medium">{formatCurrency(originalItem.unitValue)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-600 font-bold">{originalItem.quantity}</span>
                    </td>
                    <td className="px-4 py-3 bg-blue-50/30">
                      <div className="flex justify-center">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-400 text-xs">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={approvedUnitVal}
                            onChange={(e) => updateApprovedUnitValue(index, parseFloat(e.target.value) || 0)}
                            className="w-24 pl-7 pr-2 py-1.5 border-2 border-blue-200 rounded-lg text-center font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 bg-blue-50/30">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          min="0"
                          value={approvedQty}
                          onChange={(e) => updateApprovedQty(index, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 border-2 border-blue-200 rounded-lg text-center font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-slate-500">{formatCurrency(solicitadoTotal)}</span>
                    </td>
                    <td className="px-4 py-3 text-right bg-blue-50/30">
                      <span className="font-black text-blue-700">{formatCurrency(approvedTotal)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={6} className="px-4 py-4 text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase">Totais:</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="font-bold text-slate-600">{formatCurrency(totalSolicitado)}</span>
                </td>
                <td className="px-4 py-4 text-right bg-blue-50">
                  <span className="font-black text-blue-700 text-lg">{formatCurrency(totalAprovado)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Totals Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-100 rounded-2xl p-6 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Solicitado</p>
          <p className="text-2xl font-black text-slate-700">{formatCurrency(totalSolicitado)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-center text-white shadow-lg shadow-blue-200">
          <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-2">Total Aprovado</p>
          <p className="text-2xl font-black">{formatCurrency(totalAprovado)}</p>
        </div>
        
        <div className={`rounded-2xl p-6 text-center ${
          totalAprovado <= totalSolicitado 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-amber-100 text-amber-800'
        }`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Diferença</p>
          <p className="text-2xl font-black">
            {totalAprovado <= totalSolicitado ? '' : '+'}
            {formatCurrency(totalAprovado - totalSolicitado)}
          </p>
          <p className="text-xs font-medium mt-1">
            {totalAprovado < totalSolicitado && '↓ Economia'}
            {totalAprovado > totalSolicitado && '↑ Acréscimo'}
            {totalAprovado === totalSolicitado && '= Sem alteração'}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-500" />
          <p className="text-sm text-slate-600">
            Salve os ajustes antes de iniciar a execução da despesa.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Save size={20} />
          )}
          Salvar Ajustes
        </button>
      </div>

      {/* Tramitação Modal - for sending to AJSEFIN for exceptional authorization */}
      {showTramitarModal && (
        <TramitarModal
          isOpen={showTramitarModal}
          onClose={() => setShowTramitarModal(false)}
          processId={processData.id}
          processNup={processData.nup || 'N/A'}
          currentStatus={processData.status || 'EM ANÁLISE SOSFU'}
          currentModule="SOSFU"
          onSuccess={() => {
            setShowTramitarModal(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default JuriAdjustmentTab;

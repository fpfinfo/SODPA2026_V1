import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, 
  Utensils, 
  Save, 
  Loader2, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  DollarSign,
  Scale,
  Send
} from 'lucide-react';
import { TramitarModal } from './TramitarModal';

interface JuriParticipants {
  [key: string]: number;
  servidores: number;
  reus: number;
  jurados: number;
  testemunhas: number;
  defensor: number;
  promotor: number;
  policias: number;
}

interface ProjectionItem {
  id: string;
  description: string;
  element: string;
  unitValue: number;
  quantity: number;
  total: number;
  isAuto?: boolean;
  approvedQty?: number;
  approvedUnitValue?: number;
}

interface JuriReviewPanelProps {
  solicitacaoId: string;
  onClose: () => void;
  onSave?: () => void;
}

export const JuriReviewPanel: React.FC<JuriReviewPanelProps> = ({ 
  solicitacaoId, 
  onClose, 
  onSave 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [solicitacao, setSolicitacao] = useState<any>(null);
  const [showTramitar, setShowTramitar] = useState(false);
  
  // Requested values (read-only)
  const [participantesSolicitados, setParticipantesSolicitados] = useState<JuriParticipants>({
    servidores: 0, reus: 0, jurados: 0, testemunhas: 0, defensor: 0, promotor: 0, policias: 0
  });
  const [projecaoSolicitada, setProjecaoSolicitada] = useState<ProjectionItem[]>([]);
  
  // Approved values (editable by SOSFU)
  const [participantesAprovados, setParticipantesAprovados] = useState<JuriParticipants>({
    servidores: 0, reus: 0, jurados: 0, testemunhas: 0, defensor: 0, promotor: 0, policias: 0
  });
  const [projecaoAprovada, setProjecaoAprovada] = useState<ProjectionItem[]>([]);

  useEffect(() => {
    const fetchSolicitacao = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('solicitacoes')
          .select('*')
          .eq('id', solicitacaoId)
          .single();

        if (error) throw error;
        if (data) {
          setSolicitacao(data);
          
          // Set requested values
          const participantes = data.juri_participantes || {};
          setParticipantesSolicitados(participantes);
          
          const projecao = data.juri_projecao_custos || [];
          setProjecaoSolicitada(projecao);
          
          // Set approved values (or default to requested if not yet set)
          const aprovados = data.juri_participantes_aprovados || {};
          if (Object.keys(aprovados).length > 0) {
            setParticipantesAprovados(aprovados);
          } else {
            setParticipantesAprovados(participantes);
          }
          
          const projecaoAprov = data.juri_projecao_aprovados || [];
          if (projecaoAprov.length > 0) {
            setProjecaoAprovada(projecaoAprov);
          } else {
            // Initialize with requested values but add approved fields
            setProjecaoAprovada(projecao.map((item: ProjectionItem) => ({
              ...item,
              approvedQty: item.quantity,
              approvedUnitValue: item.unitValue
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching solicitacao:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolicitacao();
  }, [solicitacaoId]);

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
        .eq('id', solicitacaoId);

      if (error) throw error;
      
      alert('Valores aprovados salvos com sucesso!');
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving approved values:', error);
      alert('Erro ao salvar valores aprovados: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const totalSolicitado = projecaoSolicitada.reduce((acc, item) => acc + item.total, 0);
  const totalAprovado = projecaoAprovada.reduce((acc, item) => 
    acc + ((item.approvedQty || item.quantity) * (item.approvedUnitValue || item.unitValue)), 0
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Scale size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Análise de Sessão de Júri</h2>
              <p className="text-slate-300 text-sm">{solicitacao?.nup || 'NUP não disponível'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-bold text-blue-900">Modo de Análise SOSFU</h5>
              <p className="text-xs text-blue-700 mt-1">
                Você pode ajustar as quantidades aprovadas e valores unitários. As alterações serão salvas na solicitação.
              </p>
            </div>
          </div>

          {/* Participantes Section */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <Users size={20} className="text-blue-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Pessoas Envolvidas</h4>
                <p className="text-xs text-slate-500">Ajuste as quantidades aprovadas pela SOSFU</p>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Categoria</th>
                    <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Qtd Solicitada</th>
                    <th className="p-3 text-center text-xs font-bold text-blue-600 uppercase bg-blue-50">Qtd Aprovada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { key: 'servidores', label: 'Servidor do Fórum' },
                    { key: 'reus', label: 'Réus' },
                    { key: 'jurados', label: 'Jurados' },
                    { key: 'testemunhas', label: 'Testemunhas' },
                    { key: 'defensor', label: 'Defensor Público' },
                    { key: 'promotor', label: 'Promotor' },
                    { key: 'policias', label: 'Polícias' },
                  ].map((cat) => (
                    <tr key={cat.key} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-700">{cat.label}</td>
                      <td className="p-3 text-center text-slate-600">
                        {participantesSolicitados[cat.key as keyof JuriParticipants] || 0}
                      </td>
                      <td className="p-3 text-center bg-blue-50/50">
                        <input 
                          type="number"
                          min="0"
                          className="w-20 p-2 text-center font-bold border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          value={participantesAprovados[cat.key as keyof JuriParticipants] || 0}
                          onChange={(e) => setParticipantesAprovados(prev => ({
                            ...prev,
                            [cat.key]: parseInt(e.target.value) || 0
                          }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Projeção de Custos Section */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-amber-50 flex items-center gap-3">
              <Utensils size={20} className="text-amber-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Itens da Projeção de Custos</h4>
                <p className="text-xs text-slate-500">Ajuste valores unitários e quantidades aprovadas</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Descrição</th>
                    <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Vl. Solic.</th>
                    <th className="p-3 text-center text-xs font-bold text-blue-600 uppercase bg-blue-50">Vl. Aprovado</th>
                    <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Qtd Solic.</th>
                    <th className="p-3 text-center text-xs font-bold text-blue-600 uppercase bg-blue-50">Qtd Aprovada</th>
                    <th className="p-3 text-right text-xs font-bold text-slate-500 uppercase">Total Aprov.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projecaoAprovada.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-700">
                        {item.description}
                        {item.isAuto && <span className="ml-2 bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded">AUTO</span>}
                      </td>
                      <td className="p-3 text-center text-slate-600">{formatCurrency(item.unitValue)}</td>
                      <td className="p-3 text-center bg-blue-50/50">
                        <div className="relative inline-block">
                          <span className="absolute left-2 top-2.5 text-slate-400 text-xs">R$</span>
                          <input 
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-24 pl-7 p-2 text-right font-bold border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={item.approvedUnitValue || item.unitValue}
                            onChange={(e) => {
                              const newProjecao = [...projecaoAprovada];
                              newProjecao[idx].approvedUnitValue = parseFloat(e.target.value) || 0;
                              setProjecaoAprovada(newProjecao);
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="p-3 text-center bg-blue-50/50">
                        <input 
                          type="number"
                          min="0"
                          className="w-20 p-2 text-center font-bold border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          value={item.approvedQty ?? item.quantity}
                          onChange={(e) => {
                            const newProjecao = [...projecaoAprovada];
                            newProjecao[idx].approvedQty = parseInt(e.target.value) || 0;
                            setProjecaoAprovada(newProjecao);
                          }}
                        />
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        {formatCurrency((item.approvedQty ?? item.quantity) * (item.approvedUnitValue ?? item.unitValue))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-500 uppercase">Total Solicitado</span>
              </div>
              <p className="text-2xl font-black text-slate-700">{formatCurrency(totalSolicitado)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <span className="text-xs font-bold text-green-600 uppercase">Total Aprovado</span>
              </div>
              <p className="text-2xl font-black text-green-700">{formatCurrency(totalAprovado)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={() => setShowTramitar(true)}
            className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center gap-2"
          >
            <AlertTriangle size={18} /> Diligenciar
          </button>
          <button 
            onClick={() => setShowTramitar(true)}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle2 size={18} /> Aprovar e Conceder
          </button>
        </div>

        {/* Tramitar Modal Integration */}
        <TramitarModal 
          isOpen={showTramitar}
          onClose={() => setShowTramitar(false)}
          processId={solicitacaoId}
          processNup={solicitacao?.nup || ''}
          currentStatus={solicitacao?.status || ''}
          currentModule="SOSFU"
          onSuccess={() => {
            setShowTramitar(false);
            if (onSave) onSave();
            onClose();
          }}
        />
      </div>
    </div>
  );
};

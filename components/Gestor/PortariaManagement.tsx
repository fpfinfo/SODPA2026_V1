import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  FileText,
  UserCheck,
  Users,
  Building2,
  Calendar,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  History,
  Loader2
} from 'lucide-react';
import { useToast } from '../ui/ToastProvider';

interface FundoCard {
  id: string;
  tipo: 'ORDINARIO' | 'JURI';
  titular_id: string | null;
  titular_nome: string | null;
  titular_email: string | null;
  portaria_numero: string | null;
  portaria_data: string | null;
  status: string;
}

interface ServidorOption {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  cpf?: string;
  lotacao_text?: string;
}

interface PortariaManagementProps {
  comarcaId: string;
  comarcaNome: string;
  currentUserId: string;
  onClose?: () => void;
}

export const PortariaManagement: React.FC<PortariaManagementProps> = ({
  comarcaId,
  comarcaNome,
  currentUserId,
  onClose
}) => {
  const { showToast } = useToast();
  const [fundos, setFundos] = useState<FundoCard[]>([]);
  const [servidores, setServidores] = useState<ServidorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNomeacaoModal, setShowNomeacaoModal] = useState(false);
  const [selectedFundo, setSelectedFundo] = useState<FundoCard | null>(null);
  const [selectedServidor, setSelectedServidor] = useState<string>('');
  const [portariaNumero, setPortariaNumero] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch fundos (titulares) for this comarca
  const fetchFundos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('unidade_titulares')
        .select(`
          id,
          tipo_suprimento,
          suprido_atual_id,
          portaria_numero,
          portaria_data,
          status,
          profiles!unidade_titulares_suprido_atual_id_fkey (
            id,
            nome,
            email
          )
        `)
        .eq('comarca_id', comarcaId);

      if (error) throw error;

      const transformed: FundoCard[] = (data || []).map((item: any) => ({
        id: item.id,
        tipo: item.tipo_suprimento,
        titular_id: item.suprido_atual_id,
        titular_nome: item.profiles?.nome || null,
        titular_email: item.profiles?.email || null,
        portaria_numero: item.portaria_numero,
        portaria_data: item.portaria_data,
        status: item.status
      }));

      // Add JURI if not exists
      if (!transformed.find(f => f.tipo === 'JURI')) {
        transformed.push({
          id: 'new-juri',
          tipo: 'JURI',
          titular_id: null,
          titular_nome: null,
          titular_email: null,
          portaria_numero: null,
          portaria_data: null,
          status: 'SEM_TITULAR'
        });
      }

      setFundos(transformed);
    } catch (error) {
      console.error('Error fetching fundos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch servidores from this comarca for selection
  const fetchServidores = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, cargo, cpf, lotacao_text')
        .eq('lotacao_id', comarcaId)
        .order('nome', { ascending: true });

      if (error) throw error;
      setServidores(data || []);
    } catch (error) {
      console.error('Error fetching servidores:', error);
    }
  };

  useEffect(() => {
    fetchFundos();
    fetchServidores();
  }, [comarcaId]);

  // Open nomeação modal
  const handleNomearClick = (fundo: FundoCard) => {
    // Extra-Emergencial não tem titular fixo
    if (fundo.tipo !== 'ORDINARIO' && fundo.tipo !== 'JURI') {
      showToast({ type: 'warning', title: 'Não permitido', message: 'Extra-Emergencial não possui titular fixo' });
      return;
    }
    setSelectedFundo(fundo);
    setSelectedServidor('');
    setPortariaNumero(`PORTARIA Nº ${new Date().getFullYear()}/`);
    setShowNomeacaoModal(true);
  };

  // Save nomeação
  const handleSaveNomeacao = async () => {
    if (!selectedFundo || !selectedServidor || !portariaNumero) {
      showToast({ type: 'warning', title: 'Campos obrigatórios', message: 'Preencha todos os campos' });
      return;
    }

    setIsSaving(true);
    try {
      const titularAnterior = selectedFundo.titular_id;

      // 1. Update unidade_titulares
      if (selectedFundo.id.startsWith('new-')) {
        // Create new record
        const { error } = await supabase
          .from('unidade_titulares')
          .insert({
            comarca_id: comarcaId,
            tipo_suprimento: selectedFundo.tipo,
            suprido_atual_id: selectedServidor,
            portaria_numero: portariaNumero,
            portaria_data: new Date().toISOString().split('T')[0],
            status: 'REGULAR',
            created_by: currentUserId
          });
        if (error) throw error;
      } else {
        // Update existing
        const { error } = await supabase
          .from('unidade_titulares')
          .update({
            suprido_atual_id: selectedServidor,
            portaria_numero: portariaNumero,
            portaria_data: new Date().toISOString().split('T')[0],
            status: 'REGULAR',
            updated_by: currentUserId
          })
          .eq('id', selectedFundo.id);
        if (error) throw error;
      }

      // 2. Create historico_titulares entry
      if (!selectedFundo.id.startsWith('new-')) {
        await supabase.from('historico_titulares').insert({
          unidade_titular_id: selectedFundo.id,
          titular_anterior_id: titularAnterior,
          titular_novo_id: selectedServidor,
          portaria_numero: portariaNumero,
          motivo: 'Nomeação via sistema',
          registrado_por: currentUserId
        });
      }

      // 3. Create Portaria document
      const servidorSelecionado = servidores.find(s => s.id === selectedServidor);
      await supabase.from('documentos').insert({
        tipo: 'PORTARIA',
        nome: portariaNumero,
        titulo: `Portaria de Nomeação - ${selectedFundo.tipo}`,
        conteudo: `PORTARIA DE NOMEAÇÃO DE SUPRIDO\n\nO Gestor da Comarca de ${comarcaNome}, no uso de suas atribuições legais,\n\nRESOLVE:\n\nArt. 1º - Nomear o(a) servidor(a) ${servidorSelecionado?.nome}, portador(a) do CPF nº ${servidorSelecionado?.cpf || '000.000.XXX-XX'}, lotado(a) na ${servidorSelecionado?.lotacao_text || comarcaNome}, como Suprido Titular para o Fundo de Suprimento ${selectedFundo.tipo} desta Comarca.\n\nArt. 2º - Esta Portaria entra em vigor na data de sua publicação.\n\n${comarcaNome}, ${new Date().toLocaleDateString('pt-BR')}.`,
        status: 'MINUTA',
        created_by: currentUserId
      });

      showToast({ type: 'success', title: 'Nomeação realizada!', message: 'Portaria gerada com sucesso' });
      setShowNomeacaoModal(false);
      fetchFundos();
    } catch (error) {
      console.error('Error saving nomeação:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao salvar nomeação' });
    } finally {
      setIsSaving(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIO': return 'Suprimento Ordinário';
      case 'JURI': return 'Suprimento de Júri';
      default: return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIO': return 'from-blue-500 to-indigo-600';
      case 'JURI': return 'from-purple-500 to-violet-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Administração da Unidade</h2>
            <p className="text-sm text-slate-500">{comarcaNome} - Gestão de Portarias</p>
          </div>
        </div>
        
        <button
          onClick={fetchFundos}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Fundos Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={32} className="text-amber-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fundos.map((fundo) => (
            <div
              key={fundo.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${getTipoColor(fundo.tipo)} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      {fundo.tipo === 'ORDINARIO' ? <Building2 size={20} /> : <Users size={20} />}
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-wider text-sm">{getTipoLabel(fundo.tipo)}</p>
                      <p className="text-xs text-white/80">Fundo Ativo</p>
                    </div>
                  </div>
                  {fundo.status === 'REGULAR' ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold">
                      <CheckCircle2 size={12} /> Regular
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-500/50 rounded-lg text-[10px] font-bold">
                      <AlertCircle size={12} /> Sem Titular
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Suprido Atual</p>
                  {fundo.titular_nome ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {fundo.titular_nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{fundo.titular_nome}</p>
                        <p className="text-xs text-slate-400">{fundo.titular_email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-sm">Nenhum servidor designado</p>
                  )}
                </div>

                {fundo.portaria_numero && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-xl">
                    <FileText size={16} className="text-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">{fundo.portaria_numero}</p>
                      <p className="text-[10px] text-slate-400">
                        {fundo.portaria_data ? new Date(fundo.portaria_data).toLocaleDateString('pt-BR') : '--'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleNomearClick(fundo)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-sm transition-all border border-amber-200"
                >
                  <Plus size={16} />
                  {fundo.titular_id ? 'Substituir Suprido (Nova Portaria)' : 'Nomear Suprido (Portaria)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nomeação Modal */}
      {showNomeacaoModal && selectedFundo && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Nomear Novo Suprido</h3>
                  <p className="text-sm text-slate-500">{getTipoLabel(selectedFundo.tipo)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowNomeacaoModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Servidor Select */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Servidor
                </label>
                <select
                  value={selectedServidor}
                  onChange={(e) => setSelectedServidor(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                >
                  <option value="">Selecione um servidor...</option>
                  {servidores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} - {s.cargo || 'Servidor'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Portaria Número */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Número da Portaria
                </label>
                <input
                  type="text"
                  value={portariaNumero}
                  onChange={(e) => setPortariaNumero(e.target.value)}
                  placeholder="PORTARIA Nº 001/2026"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                />
              </div>

              {/* Info */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700">
                  <strong>Atenção:</strong> Esta ação irá gerar uma Portaria de Nomeação e atualizar o titular do fundo na base central (SOSFU).
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNomeacaoModal(false)}
                className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNomeacao}
                disabled={isSaving || !selectedServidor || !portariaNumero}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 font-black text-white rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Gerar Portaria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortariaManagement;


import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Plus, 
  MoreHorizontal, 
  UserPlus, 
  Plane,
  Search,
  ChevronDown,
  X,
  Calendar,
  Save
} from 'lucide-react';
import { useSODPAProcesses } from '../../hooks/useSODPAProcesses';
import { useToast } from '../ui/ToastProvider';
import { DashboardFilterModal } from './DashboardFilterModal';

interface GestaoPassagensPanelProps {
  onOpenProcess?: (processId: string, tipo: 'DIARIA' | 'PASSAGEM') => void;
}

type FilterType = 'TODAS' | 'AGUARD_COTACAO' | 'EM_EMISSAO' | 'EMITIDAS';

export function GestaoPassagensPanel({ onOpenProcess }: GestaoPassagensPanelProps) {
  const { 
    passagens, 
    loading, 
    updateStatus, 
    assignToUser, 
    currentUserId,
    createPassagem // Ensure this is destructured
  } = useSODPAProcesses() as any; // Casting to any to avoid TS error until types are updated

  const [activeFilter, setActiveFilter] = useState<FilterType>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  // Filter Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: [] as string[],
    dateRange: { start: '', end: '' },
    setor: ''
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nomeInteressado: '',
    setor: '',
    categoria: 'Ordinário',
    destino: '',
    dataViagem: '',
    valorEstimado: '',
    motivo: ''
  });

  const handleOpenModal = () => {
      setFormData({
        nomeInteressado: '',
        setor: '',
        categoria: 'Ordinário',
        destino: '',
        dataViagem: '',
        valorEstimado: '',
        motivo: ''
      });
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
        showToast({ type: 'error', title: 'Erro', message: 'Usuário não identificado.' });
        return;
    }

    // Basic validation
    if (!formData.nomeInteressado || !formData.setor || !formData.destino || !formData.dataViagem) {
         showToast({ type: 'error', title: 'Campos Obrigatórios', message: 'Preencha todos os campos obrigatórios (*)' });
         return;
    }

    try {
        const result = await createPassagem({
            nomeInteressado: formData.nomeInteressado,
            setor: formData.setor,
            categoria: formData.categoria.toUpperCase(),
            destino: formData.destino,
            dataViagem: formData.dataViagem,
            valorEstimado: parseFloat(formData.valorEstimado.replace(',', '.')) || 0,
            motivo: formData.motivo,
            solicitanteId: currentUserId // using current user as simplified proxy for requester logic
        });

        if (result.success) {
            showToast({ type: 'success', title: 'Solicitação Criada', message: 'Nova passagem solicitada com sucesso!' });
            setIsModalOpen(false);
        } else {
            throw result.error;
        }
    } catch (err: any) {
        showToast({ type: 'error', title: 'Erro', message: err.message || 'Falha ao criar solicitação.' });
    }
  };

  // ... existing stats calculation ... 
  const stats = useMemo(() => {
    // "COTAÇÃO PENDENTE": 1 novos pedidos
    const cotacaoPendente = passagens.filter(p => ['SOLICITADA', 'COTACAO'].includes(p.status)).length;
    
    // "BILHETES EMITIDOS": 1 voos confirmados
    const emitidos = passagens.filter(p => ['EMITIDA', 'CONCLUIDA', 'UTILIZADA'].includes(p.status)).length;
    
    // "CUSTO TOTAL": Valor consolidado em passagens
    const totalValue = passagens.reduce((acc, curr) => acc + (curr.valorFinal || curr.valorEstimado || 0), 0);

    return { cotacaoPendente, emitidos, totalValue };
  }, [passagens]);

  // Filtering Logic
  const filteredPassagens = useMemo(() => {
    return passagens.filter(passagem => {
      // 1. Text Search
      const searchMatch = 
        passagem.servidorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        passagem.nup.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      // 2. Tab Filter
      if (activeFilter !== 'TODAS') {
        switch (activeFilter) {
          case 'AGUARD_COTACAO':
            if (!['SOLICITADA', 'COTACAO'].includes(passagem.status)) return false;
            break;
          case 'EM_EMISSAO':
            if (!['APROVADA', 'AGUARDANDO_EMISSAO', 'EM_ANALISE'].includes(passagem.status)) return false;
            break;
          case 'EMITIDAS':
             if (!['EMITIDA', 'CONCLUIDA', 'UTILIZADA'].includes(passagem.status)) return false;
             break;
        }
      }

       // 3. Advanced Filters
      // Status
      if (advancedFilters.status.length > 0) {
        if (!advancedFilters.status.includes(passagem.status)) return false;
      }

      // Date Range
      if (advancedFilters.dateRange.start) {
        const startDate = new Date(advancedFilters.dateRange.start);
        const itemDate = new Date(passagem.createdAt);
        if (itemDate < startDate) return false;
      }
      if (advancedFilters.dateRange.end) {
        const endDate = new Date(advancedFilters.dateRange.end);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
        const itemDate = new Date(passagem.createdAt);
        if (itemDate > endDate) return false;
      }

       // Setor
      if (advancedFilters.setor) {
         const subString = `Setor: ${advancedFilters.setor}`;
         // Check both standard field (future proof) and observacoes (current hack)
         if (!passagem.observacoes?.includes(subString)) { 
             return false;
         }
      }

      return true;
    });
  }, [passagens, activeFilter, searchTerm, advancedFilters]);

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Helper for Status Badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'AGUARDANDO_SOSFU': 'text-blue-600 font-bold',
      'SOLICITADA': 'text-blue-600 font-bold',
      'COTACAO': 'text-purple-600 font-bold',
      'AGUARDANDO_COTACAO': 'text-purple-600 font-bold',
      'PENDENTE_ASSINATURA': 'text-amber-600 font-bold',
      'APROVADA': 'text-emerald-600 font-bold',
      'EM_ANALISE': 'text-amber-600 font-bold',
      'REJEITADO': 'text-red-600 font-bold',
      'DEVOLVIDA': 'text-red-600 font-bold',
      'EMITIDA': 'text-emerald-600 font-bold',
      'CONCLUIDA': 'text-emerald-600 font-bold',
      'AGUARDANDO_EMISSAO': 'text-purple-600 font-bold'
    };

    // Default formatting if status not in map
    const displayStatus = status.replace(/_/g, ' ');
    const className = styles[status] || 'text-gray-600 font-bold';

    return <span className={`text-[11px] uppercase tracking-wide ${className}`}>{displayStatus}</span>;
  };

  const getCategoryColor = (category?: string) => {
    switch(category) {
      case 'MAGISTRADO': return 'text-orange-600';
      case 'ORDINÁRIO': return 'text-orange-600';
      case 'TÉCNICO': return 'text-orange-600';
      case 'EXTRAORDINÁRIO': return 'text-orange-600';
      default: return 'text-orange-600'; // Default to orange as per image pattern
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestão de Passagens</h2>
          <p className="text-sm text-gray-500">Emissão, cotação e reservas de bilhetes aéreos.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsFilterModalOpen(true)}
             className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                (advancedFilters.status.length > 0 || advancedFilters.dateRange.start || advancedFilters.setor) 
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
             }`}
           >
             <Filter className="h-4 w-4" />
             Filtros Avançados
             {(advancedFilters.status.length > 0 || advancedFilters.dateRange.start || advancedFilters.setor) && (
               <div className="w-2 h-2 rounded-full bg-blue-600 ml-1" />
             )}
           </button>
           <button 
             className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg text-sm font-medium text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20"
             onClick={handleOpenModal}
           >
             <Plus className="h-4 w-4" />
             Nova Passagem
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cotação Pendente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">COTAÇÃO PENDENTE</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold text-purple-600">{stats.cotacaoPendente}</h3>
                <span className="text-sm text-gray-400 font-medium">novos pedidos</span>
              </div>
            </div>
          </div>
          <div className="h-1 w-24 bg-purple-500 rounded-full mt-2"></div>
        </div>

        {/* Bilhetes Emitidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">BILHETES EMITIDOS</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold text-emerald-500">{stats.emitidos}</h3>
                <span className="text-sm text-gray-400 font-medium">voos confirmados</span>
              </div>
            </div>
          </div>
          <div className="h-1 w-48 bg-emerald-500 rounded-full mt-2"></div>
        </div>

        {/* Custo Total */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">CUSTO TOTAL</p>
              <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Valor consolidado em passagens</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto mobile-scroll">
          {[
            { id: 'TODAS', label: 'Todas' },
            { id: 'AGUARD_COTACAO', label: 'Aguard. Cotação' },
            { id: 'EM_EMISSAO', label: 'Em Emissão' },
            { id: 'EMITIDAS', label: 'Emitidas' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Listagem de Passagens</h3>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium border border-blue-100">
            {filteredPassagens.length} Processos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Protocolo / Interessado</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo / Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Valor / Prazo</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                     Carregando passagens...
                   </td>
                 </tr>
              ) : filteredPassagens.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                     Nenhum registro encontrado para este filtro.
                   </td>
                 </tr>
              ) : (
                filteredPassagens.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors uppercase">
                          {item.servidorNome}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {item.nup}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600">Passagem</span>
                        <span className={`text-[11px] font-bold uppercase ${getCategoryColor(item.classeTarifa || 'ORDINÁRIO')}`}>
                          {item.classeTarifa || 'ORDINÁRIO'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.valorFinal || item.valorEstimado || 0)}
                        </span>
                        <span className="text-xs text-gray-400">
                          Vence: {formatDate(item.updatedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        {getStatusBadge(item.status)}
                        <span className="text-[11px] text-gray-400 italic">
                          {item.assignedToId ? 'Atribuído' : 'Não atribuído'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100">
                        <button 
                          onClick={() => onOpenProcess?.(item.id, 'PASSAGEM')}
                          className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-1"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                          Detalhes
                        </button>
                        <button 
                          onClick={() => {
                             if(currentUserId) {
                               assignToUser(item.id, currentUserId, 'PASSAGEM')
                                 .then(() => showToast({ type: 'success', title: 'Successo', message: 'Processo atribuído com sucesso!' }))
                                 .catch(err => showToast({ type: 'error', title: 'Erro', message: 'Erro ao atribuir: ' + err.message }));
                             }
                          }}
                          className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                        >
                          <UserPlus className="h-3 w-3" />
                          Atribuir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-500">
                Mostrando {filteredPassagens.length} de {passagens.length} resultados
            </span>
            <div className="flex gap-1">
                <button className="px-2 py-1 border border-gray-200 rounded bg-white text-xs text-gray-500 disabled:opacity-50" disabled>Anterior</button>
                <button className="px-2 py-1 border border-gray-200 rounded bg-white text-xs text-gray-500 disabled:opacity-50" disabled>Próxima</button>
            </div>
        </div>
      </div>

      {/* NEW PASSAGEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Plane className="h-6 w-6 text-white" />
                 <h3 className="text-lg font-bold text-white">Nova Solicitação de Passagem</h3>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nome do Interessado */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Interessado <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      value={formData.nomeInteressado}
                      onChange={e => setFormData({...formData, nomeInteressado: e.target.value})}
                    />
                  </div>
                  
                  {/* Setor / Unidade */}
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Setor / Unidade <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Secretaria Geral"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      value={formData.setor}
                      onChange={e => setFormData({...formData, setor: e.target.value})}
                    />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Categoria */}
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      value={formData.categoria}
                      onChange={e => setFormData({...formData, categoria: e.target.value})}
                    >
                      <option value="Ordinário">Ordinário</option>
                      <option value="Magistrado">Magistrado</option>
                      <option value="Técnico">Técnico</option>
                      <option value="Extraordinário">Extraordinário</option>
                    </select>
                  </div>

                  {/* Destino */}
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Destino <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Brasília - DF"
                      className="w-full px-4 py-2 border border-blue-gray-200 border-gray-300 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      style={{ backgroundColor: '#374151' }}
                      value={formData.destino}
                      onChange={e => setFormData({...formData, destino: e.target.value})}
                    />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   {/* Data */}
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Data da Viagem / Prazo <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input 
                        type="date"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#374151] text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all [&::-webkit-calendar-picker-indicator]:invert"
                        value={formData.dataViagem}
                        onChange={e => setFormData({...formData, dataViagem: e.target.value})}
                        />
                    </div>
                  </div>

                  {/* Valor */}
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado (R$)</label>
                    <input 
                      type="text" // using text to handle currency format if needed, simplistic for now
                      placeholder="0,00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#374151] text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      value={formData.valorEstimado}
                      onChange={e => setFormData({...formData, valorEstimado: e.target.value})}
                    />
                  </div>
               </div>

               {/* Motivo */}
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Motivo / Descrição <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Descreva o motivo da solicitação..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#374151] text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                    value={formData.motivo}
                    onChange={e => setFormData({...formData, motivo: e.target.value})}
                  />
               </div>

               {/* Footer Buttons */}
               <div className="flex justify-end gap-3 pt-2">
                 <button 
                   type="button" 
                   onClick={handleCloseModal}
                   className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                   type="submit"
                   className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-lg shadow-purple-600/20"
                 >
                   <Save size={18} />
                   Salvar Solicitação
                 </button>
               </div>

            </form>
          </div>
        </div>
      )}
      {/* FILTER MODAL */}
      <DashboardFilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentFilters={advancedFilters}
        onApplyFilters={setAdvancedFilters}
      />
    </div>
  );
}

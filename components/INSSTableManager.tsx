
import React, { useState } from 'react';
import { INSSTable } from '../types';
import { useINSSTables } from '../hooks/useINSSTables';
import { useToast } from './ui/ToastProvider';
import { 
  ArrowLeft, 
  Plus, 
  Info, 
  Edit3, 
  Trash2, 
  Power, 
  PowerOff,
  Calendar,
  Loader2
} from 'lucide-react';

interface INSSTableManagerProps {
  onBack: () => void;
}

export const INSSTableManager: React.FC<INSSTableManagerProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const { tables, isLoading, toggleActive, deleteTable, refresh } = useINSSTables();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  const handleToggleActive = async (year: number) => {
    try {
      await toggleActive(year);
      showToast({ type: 'success', title: 'Tabela ativada!', message: `Tabela INSS ${year} agora está ativa.` });
    } catch (err) {
      showToast({ type: 'error', title: 'Erro', message: (err as Error).message });
    }
  };

  const handleDelete = async (year: number) => {
    if (!confirm(`Confirma exclusão da Tabela INSS ${year}?`)) return;
    
    setIsDeleting(year);
    try {
      await deleteTable(year);
      showToast({ type: 'success', title: 'Excluída!', message: `Tabela INSS ${year} removida.` });
    } catch (err) {
      showToast({ type: 'error', title: 'Erro', message: (err as Error).message });
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto custom-scrollbar pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gerenciar Tabelas INSS</h2>
            <p className="text-slate-500 text-sm">Configure as faixas e alíquotas progressivas do INSS por ano</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
          <Plus size={18} /> Nova Tabela
        </button>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-blue-800 leading-relaxed font-medium">
          <strong>Importante:</strong> As tabelas INSS são usadas para calcular automaticamente a retenção progressiva de INSS sobre serviços PF. 
          Mantenha as tabelas atualizadas anualmente conforme portarias publicadas.
        </p>
      </div>

      {/* Tables List */}
      <div className="space-y-4">
        {tables.sort((a, b) => b.year - a.year).map((table) => (
          <div key={table.year} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-700">Tabela INSS {table.year}</h3>
                {table.active && (
                  <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Ativa</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleToggleActive(table.year)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors ${
                    table.active 
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                    : 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {table.active ? <PowerOff size={14} /> : <Power size={14} />}
                  {table.active ? 'Desativar' : 'Ativar'}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                  <Edit3 size={14} /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(table.year)}
                  disabled={isDeleting === table.year}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {isDeleting === table.year ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Excluir
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-8 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="text-slate-400" size={16} />
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Vigência:</span>
                  <span className="text-sm font-bold text-slate-800">{table.year}</span>
                </div>
                <div>
                   <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Teto de Contribuição: </span>
                   <span className="text-sm font-bold text-slate-800">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(table.ceiling)}
                   </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {table.ranges.map((range, idx) => (
                  <div key={idx} className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">{range.label}</p>
                    <p className="text-xs text-slate-500 mb-2">
                      R$ {range.min.toLocaleString('pt-BR')} até {range.max >= table.ceiling ? 'Teto' : `R$ ${range.max.toLocaleString('pt-BR')}`}
                    </p>
                    <p className="text-xl font-extrabold text-blue-900">{range.rate}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

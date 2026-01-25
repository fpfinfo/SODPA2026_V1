import React, { useState } from 'react';
import { Send, Loader2, X, CheckSquare } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onTramitar: () => void;
  isProcessing: boolean;
  label?: string; // e.g. "Enviar para SOSFU"
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  onClear,
  onTramitar,
  isProcessing,
  label = "Tramitar Selecionados"
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-[#0f172a] text-white p-2 pl-6 pr-2 rounded-full shadow-2xl ring-4 ring-slate-900/10 flex items-center gap-6 min-w-[320px]">
        
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
            {selectedCount}
          </div>
          <span className="text-sm font-bold text-slate-300">
            {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
        </div>

        <div className="h-6 w-px bg-slate-700"></div>

        <div className="flex items-center gap-2">
            <button
                onClick={onTramitar}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-white text-slate-900 rounded-full text-xs font-black uppercase tracking-wider hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Send size={16} />
                )}
                {label}
            </button>
            
            <button
                onClick={onClear}
                disabled={isProcessing}
                className="p-2.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                title="Cancelar Seleção"
            >
                <X size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Search, Loader2, User, ChevronRight } from 'lucide-react';
import { SupridoProfile } from '../../../hooks/useSupridoCRM';

interface SupridoSearchProps {
  onSearch: (query: string) => void;
  onSelect: (suprido: SupridoProfile) => void;
  results: SupridoProfile[];
  isLoading: boolean;
}

export const SupridoSearch: React.FC<SupridoSearchProps> = ({ 
  onSearch, 
  onSelect, 
  results, 
  isLoading 
}) => {
  const [query, setQuery] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        onSearch(query);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque por nome, CPF ou e-mail..."
          className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-blue-900/5 text-lg font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
           {isLoading ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <Search size={24} />}
        </div>
      </div>

      {/* Results Dropdown */}
      {query.length >= 3 && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="max-h-[400px] overflow-y-auto">
                {results.map((suprido) => (
                    <div 
                        key={suprido.id}
                        onClick={() => {
                            onSelect(suprido);
                            setQuery(''); // Clear search on select? Optional.
                        }}
                        className="p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer flex items-center justify-between group transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                <User size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{suprido.nome}</h4>
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                                    {suprido.lotacao} 
                                    {suprido.cpf && <span className="w-1 h-1 bg-slate-300 rounded-full"></span>}
                                    {suprido.cpf}
                                </p>
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
                {results.length} resultados encontrados
            </div>
        </div>
      )}
    </div>
  );
};

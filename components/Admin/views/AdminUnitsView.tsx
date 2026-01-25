import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, MapPin } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export const AdminUnitsView: React.FC = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('comarcas').select('*').order('nome').then(({ data }) => {
       setUnits(data || []);
       setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
       <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Unidades</h2>
            <p className="text-slate-500 text-sm">Estrutura organizacional e comarcas.</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 transition-all">
             <Plus size={18} /> Nova Unidade
          </button>
       </div>

       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex gap-4">
             <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar unidade..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
             </div>
          </div>
          
          <div className="divide-y divide-slate-100">
             {loading ? (
                <div className="p-8 text-center text-slate-400">Carregando...</div>
             ) : units.map((unit: any) => (
                <div key={unit.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                         <MapPin size={20} />
                      </div>
                      <div>
                         <p className="font-bold text-slate-800">{unit.nome}</p>
                         <p className="text-xs text-slate-500">Entrância: {unit.entrancia || 'N/A'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="text-right">
                         <p className="text-xs font-bold text-slate-400 uppercase">Gestor Titular</p>
                         <p className="text-sm font-bold text-slate-700">{unit.gestor_nome || 'Vacante'}</p>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

import React from 'react';

export const AdminConfigView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
       <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Configurações Globais</h2>
          <p className="text-slate-500">Parâmetros do sistema SOSFU.</p>
       </div>

       <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Limites Financeiros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Limite Máximo (Convencional)</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                   <input 
                     type="number" 
                     defaultValue={15000} 
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>
                <p className="text-xs text-slate-400 mt-2">Valor teto para suprimentos comuns (CNJ).</p>
             </div>

             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Limite (Cartão Corporativo)</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                   <input 
                     type="number" 
                     defaultValue={30000} 
                     disabled
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-400 cursor-not-allowed bg-slate-50"
                   />
                </div>
                <p className="text-xs text-slate-400 mt-2">Definido por convênio bancário (Bloqueado).</p>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Prazos Legais</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 mb-1">Aplicação (Dias)</label>
                <input type="number" defaultValue={90} className="w-full bg-transparent font-black text-2xl text-slate-800 outline-none" />
             </div>
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 mb-1">Prestação (Dias)</label>
                <input type="number" defaultValue={30} className="w-full bg-transparent font-black text-2xl text-slate-800 outline-none" />
             </div>
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 mb-1">Análise Gestor (SLA)</label>
                <input type="number" defaultValue={15} className="w-full bg-transparent font-black text-2xl text-slate-800 outline-none" />
             </div>
          </div>
       </div>
       
       <div className="flex justify-end pt-4">
          <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 transform">
             Salvar Alterações Globais
          </button>
       </div>
    </div>
  );
};

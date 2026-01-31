import React from 'react';
import { Briefcase, Users, FileText, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface GestorCockpitProps {}

export const GestorCockpit: React.FC<GestorCockpitProps> = () => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Briefcase size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Painel do Gestor</h1>
              <p className="text-slate-500">Homologação e controle de suprimentos da sua unidade</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-xs text-slate-500 uppercase font-medium">Pendentes de Atesto</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-xs text-slate-500 uppercase font-medium">Atestados Enviados</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-xs text-slate-500 uppercase font-medium">Devoluções</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl shadow-sm text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-lg">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ 0,00</p>
                <p className="text-xs text-slate-300 uppercase font-medium">Total Pendente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={40} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Módulo Gestor</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Este módulo está em desenvolvimento. Em breve você poderá gerenciar atestados e homologações da sua unidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GestorCockpit;

import React from 'react';
import { UserCog, Users, FileText, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SgpDashboardProps {}

export const SgpDashboard: React.FC<SgpDashboardProps> = () => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
              <UserCog size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Painel SGP</h1>
              <p className="text-slate-500">Secretaria de Gestão de Pessoas</p>
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
                <p className="text-xs text-slate-500 uppercase font-medium">Caixa de Entrada</p>
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
                <p className="text-xs text-slate-500 uppercase font-medium">Processados Hoje</p>
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
                <p className="text-xs text-slate-500 uppercase font-medium">Glosas Pendentes</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-red-700 p-5 rounded-xl shadow-sm text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-lg">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ 0,00</p>
                <p className="text-xs text-orange-200 uppercase font-medium">Em Averbação</p>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCog size={40} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Módulo SGP</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Este módulo está em desenvolvimento. Em breve você poderá gerenciar glosas e averbações.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SgpDashboard;

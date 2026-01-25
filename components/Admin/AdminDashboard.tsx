import React, { useEffect, useState } from 'react';
import { fetchAdminMetrics, AdminMetrics } from '../../hooks/useAdminMetrics';
import { 
  Users, Building2, TrendingUp, AlertTriangle, 
  Database, HardDrive, Globe, RefreshCw 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminMetrics().then(setMetrics).finally(() => setIsLoading(false));
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', compactDisplay: 'short', notation: 'compact' }).format(val);

  if (isLoading) return <div className="p-12 text-center text-slate-400 animate-pulse">Carregando painel de controle...</div>;
  if (!metrics) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       
       {/* Welcome */}
       <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Visão Geral do Sistema</h2>
          <p className="text-slate-500">Monitoramento em tempo real da infraestrutura SOSFU.</p>
       </div>

       {/* KPIs Principais */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KpiCard 
             title="Usuários Ativos" 
             value={metrics.totalUsers} 
             icon={Users} 
             color="blue" 
          />
          <KpiCard 
             title="Comarcas / Unidades" 
             value={metrics.totalComarcas} 
             icon={Building2} 
             color="indigo" 
          />
          <KpiCard 
             title="Volume Processado" 
             value={formatCurrency(metrics.totalFinanceiro)} 
             icon={TrendingUp} 
             color="emerald" 
          />
          <KpiCard 
             title="Alertas de Sistema" 
             value={metrics.alertasSistema} 
             icon={AlertTriangle} 
             color={metrics.alertasSistema > 0 ? "red" : "slate"} 
          />
       </div>

       {/* System Health */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Globe size={20} className="text-slate-400"/>
                Status dos Serviços
             </h3>
             <div className="space-y-4">
                <ServiceStatus label="Database (PostgreSQL)" status={metrics.servicesStatus.database} icon={Database} />
                <ServiceStatus label="Storage (S3/Supabase)" status={metrics.servicesStatus.storage} icon={HardDrive} />
                <ServiceStatus label="Integração SEFAZ/SIAFE" status={metrics.servicesStatus.apiSefaz} icon={RefreshCw} />
             </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Manutenção Programada</h3>
                <p className="text-slate-400 text-sm mb-6">
                   Próxima janela de atualização do sistema prevista para:
                </p>
                <div className="inline-block bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10 mb-6">
                   <span className="font-mono font-bold text-emerald-400">30 JAN 2026 - 02:00 AM</span>
                </div>
                <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-colors">
                   Ver Logs de Sistema
                </button>
             </div>
          </div>
       </div>

    </div>
  );
};

// Sub-components
const KpiCard = ({ title, value, icon: Icon, color }: any) => {
   const colors = {
      blue: 'bg-blue-50 text-blue-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      red: 'bg-red-50 text-red-600',
      slate: 'bg-slate-50 text-slate-600'
   };
   
   return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-lg transition-all">
         <div className={`p-4 rounded-xl ${colors[color] || colors.slate}`}>
            <Icon size={24} />
         </div>
         <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-black text-slate-800">{value}</p>
         </div>
      </div>
   );
};

const ServiceStatus = ({ label, status, icon: Icon }: any) => (
   <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-3">
         <Icon size={18} className="text-slate-400" />
         <span className="font-bold text-slate-700 text-sm">{label}</span>
      </div>
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold
         ${status === 'ONLINE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
      `}>
         <span className={`w-2 h-2 rounded-full ${status === 'ONLINE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
         {status}
      </div>
   </div>
);


import React from 'react';
import { User, MapPin, Mail, ShieldAlert, BadgeCheck, FileText, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { SupridoProfile } from '../../../hooks/useSupridoCRM';
import { getRiskColor, getRiskLabel } from '../../../utils/riskScoring';

interface SupridoProfileCardProps {
  profile: SupridoProfile;
  isLoadingStats?: boolean;
}

export const SupridoProfileCard: React.FC<SupridoProfileCardProps> = ({ profile, isLoadingStats }) => {
  const risk = profile.stats?.risk;
  const riskColor = risk ? getRiskColor(risk.level) : '';

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Cover / Header */}
        <div className="h-32 bg-slate-900 relative">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-900"></div>
             {profile.status === 'BLOCKED' && (
                 <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <Lock size={12} /> Bloqueado
                 </div>
             )}
        </div>

        <div className="px-8 pb-8 relative">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-[32px] bg-white p-2 absolute -top-12 left-8 shadow-sm">
                <div className="w-full h-full bg-slate-100 rounded-[28px] flex items-center justify-center text-slate-400 overflow-hidden">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.nome} className="w-full h-full object-cover" />
                    ) : (
                        <User size={40} />
                    )}
                </div>
            </div>

            {/* Risk Badge (Top Right) */}
            <div className="flex justify-end pt-4 mb-4 min-h-[48px]">
               {isLoadingStats ? (
                   <div className="w-24 h-6 bg-slate-100 rounded-full animate-pulse"></div>
               ) : risk ? (
                   <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${riskColor}`}>
                       <ShieldAlert size={16} />
                       <span className="text-xs font-black uppercase tracking-wider">{getRiskLabel(risk.level)}</span>
                       <span className="w-px h-3 bg-current opacity-30 mx-1"></span>
                       <span className="text-sm font-black">{risk.score}</span>
                   </div>
               ) : null}
            </div>
            
            {/* Basic Info */}
            <div className="mt-4">
                <h2 className="text-2xl font-black text-slate-900">{profile.nome}</h2>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-blue-500" />
                        {profile.lotacao}
                    </div>
                    {profile.email && (
                        <div className="flex items-center gap-2">
                            <Mail size={16} className="text-blue-500" />
                            {profile.email}
                        </div>
                    )}
                    {profile.cpf && (
                        <div className="flex items-center gap-2">
                           <span className="font-bold bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600">CPF</span>
                           {profile.cpf}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Processos</p>
                    <div className="flex items-center gap-2">
                         <span className="text-2xl font-black text-slate-800">{isLoadingStats ? '-' : profile.stats?.total_processes}</span>
                         <FileText size={16} className="text-slate-300"/>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Concedido</p>
                    <p className="text-xl font-black text-slate-800 tracking-tight">
                        {isLoadingStats ? '-' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profile.stats?.total_value || 0)}
                    </p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 hidden md:block">
                     <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Tempo Médio PC</p>
                     <p className="text-xl font-black">{isLoadingStats ? '-' : profile.stats?.avg_pc_days + ' dias'}</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-800">
                     <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Em Aberto</p>
                     <p className="text-2xl font-black">{isLoadingStats ? '-' : profile.stats?.open_processes}</p>
                </div>
            </div>

            {/* Risk Details / Penalties */}
            {!isLoadingStats && risk && risk.penalties.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
                    <h4 className="flex items-center gap-2 text-xs font-black text-red-700 uppercase tracking-widest mb-3">
                        <AlertTriangle size={14} /> Fatores de Risco Detectados
                    </h4>
                    <ul className="space-y-2">
                        {risk.penalties.map((penalty, idx) => (
                            <li key={idx} className="text-sm text-red-600/80 font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                {penalty}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    </div>
  );
};

import React, { useState } from 'react';
import { User, LogOut, ChevronDown, UserCircle, Settings as SettingsIcon } from 'lucide-react';
import { NotificationBell } from '../ui/NotificationBell';
import { AppRole } from '../../types';

interface AppNavbarProps {
  userProfile: any;
  currentUserEmail?: string;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  onSignOut: () => void;
  onNavigateHome: () => void;
  onProfileClick: () => void;
  onPreferencesClick: () => void;
  isInSosfuModule: boolean;
  brasaoUrl: string;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  userProfile,
  currentUserEmail,
  activeRole,
  setActiveRole,
  onSignOut,
  onNavigateHome,
  onProfileClick,
  onPreferencesClick,
  isInSosfuModule,
  brasaoUrl
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 h-16 flex items-center px-8 sticky top-0 z-[100] shadow-sm">
      <div className="flex items-center gap-4">
        <img 
          src={brasaoUrl} 
          className="w-12 h-12 object-contain cursor-pointer hover:scale-105 transition-transform"
          onClick={onNavigateHome}
          alt="Brasão TJPA"
        />
        <div>
          <span className="font-extrabold text-lg tracking-tight text-slate-800">SCS <span className="text-blue-600">TJPA</span></span>
          <div className="flex items-center gap-1.5 -mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistema de Concessão de Suprimentos</span>
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-6">
        {/* Role Switcher - Only for test user (teste@tjpa.jus.br) */}
        {currentUserEmail === 'teste@tjpa.jus.br' && (
        <div className="relative">
          <button 
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <User size={14} />
            Perfil: {activeRole}
            <ChevronDown size={14} />
          </button>
          
          {showRoleMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-[110] animate-in fade-in slide-in-from-top-2">
               <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mudar Visão</p>
               {Object.values(AppRole).map(role => (
                 <button 
                  key={role}
                  onClick={() => { setActiveRole(role); setShowRoleMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 ${activeRole === role ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                 >
                   Módulo {role}
                 </button>
               ))}
            </div>
          )}
        </div>
        )}

        <div className="h-8 w-px bg-slate-200"></div>

        <NotificationBell />

        {/* User Account Menu */}
        <div className="relative">
          <div 
            className="flex items-center gap-3 pl-2 group cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-800 leading-none">{userProfile?.nome || 'Carregando...'}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">Mat. {userProfile?.matricula || '...'}</p>
            </div>
            <img 
              src={userProfile?.avatar_url ? `${userProfile.avatar_url}?t=${Date.now()}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.nome || 'User'}`} 
              className="w-10 h-10 rounded-xl border-2 border-slate-100 group-hover:border-blue-400 transition-all shadow-sm bg-blue-50" 
              alt="Avatar" 
            />
          </div>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-[110] animate-in fade-in slide-in-from-top-2 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800">Minha Conta</p>
                <p className="text-[10px] text-slate-400 truncate">{userProfile?.email || 'suprido@tjpa.jus.br'}</p>
              </div>
              <button 
                onClick={() => { onProfileClick(); setShowUserMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-3"
              >
                <UserCircle size={16} /> Meus Dados Cadastrais
              </button>
              <button 
                onClick={() => { onPreferencesClick(); setShowUserMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3"
              >
                <SettingsIcon size={16} /> {isInSosfuModule ? 'Configurações do Sistema' : 'Preferências'}
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              <button 
                onClick={onSignOut}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-all flex items-center gap-3"
              >
                <LogOut size={16} /> Sair do Sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

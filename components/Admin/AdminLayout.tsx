import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  ShieldAlert, 
  LogOut,
  Menu,
  Bell
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePage: 'dashboard' | 'users' | 'units' | 'config';
  onNavigate: (page: 'dashboard' | 'users' | 'units' | 'config') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activePage, onNavigate }) => {
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'users', label: 'Gestão de Usuários', icon: Users },
    { id: 'units', label: 'Estrutura / Comarcas', icon: Building2 },
    { id: 'config', label: 'Configurações', icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased text-slate-900">
      {/* Sidebar - Dark Mode */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/50">
                A
              </div>
              <div>
                 <h1 className="font-black tracking-tight text-lg">Admin</h1>
                 <p className="text-xs text-slate-400 font-medium">SOSFU Control Panel</p>
              </div>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
           <p className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Módulos</p>
           {navItems.map(item => (
             <button
               key={item.id}
               onClick={() => onNavigate(item.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                 ${activePage === item.id 
                   ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                   : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
               `}
             >
               <item.icon size={20} />
               {item.label}
             </button>
           ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={handleSignOut}
             className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-xl transition-colors font-medium text-sm"
           >
             <LogOut size={20} />
             Sair do Sistema
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
           <div className="flex items-center gap-4 text-slate-500">
              <Menu size={20} className="lg:hidden" />
              <span className="text-sm font-medium">
                {navItems.find(i => i.id === activePage)?.label}
              </span>
           </div>
           <div className="flex items-center gap-6">
              <div className="relative cursor-pointer hover:text-indigo-600 transition-colors">
                 <Bell size={20} className="text-slate-400" />
                 <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </div>
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                 <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-800">Administrador</p>
                    <p className="text-xs text-slate-500">Superuser</p>
                 </div>
                 <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold border-2 border-indigo-200">
                    SU
                 </div>
              </div>
           </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8 custom-scrollbar relative">
           {children}
        </main>
      </div>
    </div>
  );
};

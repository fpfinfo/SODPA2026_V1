import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminConfigView } from './views/AdminConfigView';
import { AdminUnitsView } from './views/AdminUnitsView';
import { Building2, Settings } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [activePage, setActivePage] = useState<'dashboard' | 'users' | 'units' | 'config'>('dashboard');

  return (
    <AdminLayout activePage={activePage} onNavigate={setActivePage}>
       
       <div className="animate-in fade-in zoom-in-95 duration-300">
          {activePage === 'dashboard' && <AdminDashboard />}
          {activePage === 'users' && <AdminUsersView />}
          {activePage === 'units' && <AdminUnitsView />}
          {activePage === 'config' && <AdminConfigView />}
       </div>

    </AdminLayout>
  );
};

// Placeholder temporário enquanto implemento as próximas views
const PlaceholderView = ({ title, icon: Icon, description }: any) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
     <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
        <Icon size={48} />
     </div>
     <h2 className="text-3xl font-black text-slate-800 mb-2">{title}</h2>
     <p className="text-slate-500 max-w-md">{description}</p>
     <div className="mt-8 px-4 py-2 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 text-sm">
        Em Desenvolvimento
     </div>
  </div>
);

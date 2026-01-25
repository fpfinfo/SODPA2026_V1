import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreVertical, Shield, UserCog, Mail, Lock, CheckCircle2, XCircle, Loader2 
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useToast } from '../../ui/ToastProvider';

interface UserProfile {
  id: string;
  email: string; // Buscar de auth.users via Function ou View segura (ou assumir que profile tem email)
  nome: string;
  role: 'SUPRIDO' | 'GESTOR' | 'FINANCEIRO' | 'ADMIN';
  lotacao: string;
  created_at: string;
  status: 'ACTIVE' | 'SUSPENDED'; // Mock field se não existir
}

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    // Idealmente usar uma View que faça join com auth.users para pegar email
    // Por enquanto, assumindo que `profiles` tem os dados necessários
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) {
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar usuários' });
    } else {
      setUsers((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      showToast({ type: 'success', title: 'Perfil Atualizado', message: `Usuário agora é ${newRole}` });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
       showToast({ type: 'error', title: 'Erro', message: 'Permissão negada ou erro de rede.' });
    }
  };

  const handlePasswordReset = async (email: string) => {
     // Enviar email de reset
     const { error } = await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: window.location.origin + '/update-password',
     });
     
     if (error) {
       showToast({ type: 'error', title: 'Erro', message: error.message });
     } else {
       showToast({ type: 'success', title: 'Email Enviado', message: 'Instruções de recuperação enviadas para o email.' });
     }
  };

  // Filter Logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.nome?.toLowerCase().includes(search.toLowerCase()) || 
                          u.lotacao?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Usuários</h2>
            <p className="text-slate-500 text-sm">Controle de acesso e atribuições de perfil.</p>
         </div>
         <button 
           onClick={() => fetchUsers()} 
           className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-sm shadow-sm transition-all"
         >
            Atualizar Lista
         </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou lotação..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
         </div>
         <div className="flex items-center gap-2">
            <Filter size={20} className="text-slate-400" />
            <select 
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
               <option value="ALL">Todos os Perfis</option>
               <option value="SUPRIDO">Suprido</option>
               <option value="GESTOR">Gestor</option>
               <option value="FINANCEIRO">Financeiro</option>
               <option value="ADMIN">Admin</option>
            </select>
         </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-black text-slate-500">
                  <tr>
                     <th className="px-6 py-4">Usuário</th>
                     <th className="px-6 py-4">Perfil (Role)</th>
                     <th className="px-6 py-4">Lotação</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                           <Loader2 className="animate-spin mx-auto mb-2" />
                           Carregando usuários...
                        </td>
                     </tr>
                  ) : filteredUsers.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                           Nenhum usuário encontrado.
                        </td>
                     </tr>
                  ) : (
                     filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600">
                                    {user.nome?.charAt(0) || 'U'}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-800">{user.nome}</p>
                                    <p className="text-xs text-slate-500">{user.email || 'Sem email visível'}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold border
                                 ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                   user.role === 'FINANCEIRO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                   user.role === 'GESTOR' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                   'bg-emerald-50 text-emerald-700 border-emerald-200'}
                              `}>
                                 {user.role}
                              </span>
                           </td>
                           <td className="px-6 py-4 font-medium">
                              {user.lotacao || '-'}
                           </td>
                           <td className="px-6 py-4">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                 ATIVO
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => setEditingUser(user)}
                                   className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"
                                   title="Editar Perfil"
                                 >
                                    <UserCog size={18} />
                                 </button>
                                 {/* Mock Reset Password assumes we have email */}
                                 {user.email && (
                                   <button 
                                     onClick={() => handlePasswordReset(user.email)}
                                     className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg"
                                     title="Enviar Email de Reset de Senha"
                                   >
                                      <Lock size={18} />
                                   </button>
                                 )}
                              </div>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95">
               <h3 className="text-lg font-black text-slate-800 mb-4">Editar Usuário</h3>
               <div className="mb-4">
                  <p className="text-sm font-bold text-slate-700">{editingUser.nome}</p>
                  <p className="text-xs text-slate-500">{editingUser.lotacao}</p>
               </div>
               
               <div className="space-y-2 mb-6">
                  <label className="text-xs font-bold uppercase text-slate-400">Novo Perfil</label>
                  <div className="grid grid-cols-2 gap-2">
                     {['SUPRIDO', 'GESTOR', 'FINANCEIRO', 'ADMIN'].map(role => (
                        <button
                          key={role}
                          onClick={() => handleUpdateRole(editingUser.id, role)}
                          className={`p-3 rounded-xl border text-sm font-bold transition-all
                            ${editingUser.role === role 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}
                          `}
                        >
                           {role}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="flex justify-end">
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

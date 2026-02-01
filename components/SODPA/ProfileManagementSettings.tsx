import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  ShieldPlus, 
  ShieldMinus,
  Search, 
  Users,
  Crown,
  Building,
  DollarSign,
  Scale,
  UserCheck,
  ClipboardList,
  User,
  X,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useRBAC, Role, UserWithRoles } from '../../hooks/useRBAC';
import { useToast } from '../ui/ToastProvider';

// Role badge colors and icons
const ROLE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'ADMIN': { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', icon: Crown },
  'PRESIDENCIA': { color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200', icon: Building },
  'SEFIN': { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200', icon: DollarSign },
  'AJSEFIN': { color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-200', icon: Scale },
  'SGP': { color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', icon: UserCheck },
  'SODPA': { color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200', icon: ClipboardList },
  'SERVIDOR': { color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', icon: User },
};

interface GrantRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
  users: UserWithRoles[];
  currentUserId: string;
  onGrant: (userId: string, roleCode: string, justification?: string) => Promise<void>;
}

const GrantRoleModal: React.FC<GrantRoleModalProps> = ({ 
  isOpen, onClose, roles, users, currentUserId, onGrant 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return users.filter(u => 
      u.nome?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.matricula?.includes(term)
    ).slice(0, 20);
  }, [users, searchTerm]);

  const handleSubmit = async () => {
    if (!selectedUser || !selectedRole) return;
    setSubmitting(true);
    try {
      await onGrant(selectedUser.id, selectedRole, justification || undefined);
      onClose();
      setSelectedUser(null);
      setSelectedRole('');
      setJustification('');
      setSearchTerm('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldPlus className="h-5 w-5 text-blue-600" />
            Conceder Novo Papel
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Servidor</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Nome, matrícula ou e-mail..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            {searchTerm && !selectedUser && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => { setSelectedUser(user); setSearchTerm(''); }}
                    className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                      {user.nome?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{user.nome}</div>
                      <div className="text-xs text-gray-500">{user.email} • Mat. {user.matricula}</div>
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">Nenhum servidor encontrado</div>
                )}
              </div>
            )}
          </div>

          {/* Selected User */}
          {selectedUser && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                {selectedUser.nome?.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{selectedUser.nome}</div>
                <div className="text-xs text-gray-600">{selectedUser.email}</div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-blue-100 rounded"
              >
                <X size={16} className="text-blue-600" />
              </button>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Papel a Conceder</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Selecione um papel...</option>
              {roles.filter(r => r.code !== 'SERVIDOR').map(role => (
                <option key={role.id} value={role.code}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Justificativa (opcional)</label>
            <textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Ex: Designação via Portaria Nº 123/2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!selectedUser || !selectedRole || submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Conceder
          </button>
        </div>
      </div>
    </div>
  );
};

interface RevokeModalProps {
  isOpen: boolean;
  user: UserWithRoles | null;
  roleCode: string;
  onClose: () => void;
  onRevoke: (userId: string, roleCode: string, reason?: string) => Promise<void>;
}

const RevokeModal: React.FC<RevokeModalProps> = ({ isOpen, user, roleCode, onClose, onRevoke }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await onRevoke(user.id, roleCode, reason || undefined);
      onClose();
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  const config = ROLE_CONFIG[roleCode] || ROLE_CONFIG['SERVIDOR'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <ShieldMinus className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Revogar Papel</h3>
            <p className="text-sm text-gray-500">Esta ação pode ser desfeita posteriormente</p>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800">
                Você está prestes a revogar o papel <strong>{roleCode}</strong> de <strong>{user.nome}</strong>.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Revogação</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ex: Término da substituição, Exoneração..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldMinus size={16} />}
            Confirmar Revogação
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
export const ProfileManagementSettings: React.FC = () => {
  const { roles, usersWithRoles, loading, error, grantRole, revokeRole, getRoleStats } = useRBAC();
  const { showToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{ user: UserWithRoles; roleCode: string } | null>(null);

  // Get current user ID (placeholder - would come from auth context)
  const currentUserId = usersWithRoles[0]?.id || '';

  const roleStats = useMemo(() => getRoleStats(), [usersWithRoles, roles]);

  const filteredUsers = useMemo(() => {
    let result = usersWithRoles;
    
    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.nome?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.matricula?.includes(term)
      );
    }
    
    // Filter by role
    if (filterRole) {
      result = result.filter(u => 
        u.roles.some(r => r.role?.code === filterRole)
      );
    }
    
    return result;
  }, [usersWithRoles, searchTerm, filterRole]);

  const handleGrant = async (userId: string, roleCode: string, justification?: string) => {
    const result = await grantRole(userId, roleCode, currentUserId, justification);
    if (result.success) {
      showToast({ type: 'success', title: 'Papel Concedido', message: `O papel ${roleCode} foi atribuído com sucesso.` });
    } else {
      showToast({ type: 'error', title: 'Erro', message: result.error || 'Falha ao conceder papel.' });
    }
  };

  const handleRevoke = async (userId: string, roleCode: string, reason?: string) => {
    const result = await revokeRole(userId, roleCode, currentUserId, reason);
    if (result.success) {
      showToast({ type: 'success', title: 'Papel Revogado', message: `O papel ${roleCode} foi revogado.` });
    } else {
      showToast({ type: 'error', title: 'Erro', message: result.error || 'Falha ao revogar papel.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando dados de perfis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-700">
        <AlertCircle className="inline h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Gestão de Perfis (RBAC)
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie os papéis e permissões dos usuários do sistema</p>
        </div>
        <button 
          onClick={() => setIsGrantModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ShieldPlus size={16} />
          Conceder Papel
        </button>
      </div>

      {/* Role Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {roles.map(role => {
          const config = ROLE_CONFIG[role.code] || ROLE_CONFIG['SERVIDOR'];
          const Icon = config.icon;
          const count = roleStats[role.code] || 0;
          const isActive = filterRole === role.code;
          
          return (
            <button
              key={role.id}
              onClick={() => setFilterRole(isActive ? null : role.code)}
              className={`p-3 rounded-xl border transition-all ${
                isActive 
                  ? `${config.bg} ${config.border} ring-2 ring-offset-1 ring-blue-500` 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className={`text-xs font-bold ${config.color}`}>{role.code}</span>
              </div>
              <div className="text-2xl font-black text-gray-900">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input 
          type="text"
          placeholder="Buscar por nome, e-mail ou matrícula..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
        />
        {filterRole && (
          <button 
            onClick={() => setFilterRole(null)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Papéis Ativos</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Nenhum usuário encontrado</p>
                  <p className="text-sm">Ajuste os filtros ou busca</p>
                </td>
              </tr>
            ) : filteredUsers.slice(0, 50).map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.nome} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                        {user.nome?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{user.nome}</div>
                      <div className="text-xs text-gray-500">{user.email} • Mat. {user.matricula}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.length === 0 ? (
                      <span className="text-gray-400 text-sm italic">Sem papéis atribuídos</span>
                    ) : user.roles.map(ur => {
                      const roleCode = ur.role?.code || 'UNKNOWN';
                      const config = ROLE_CONFIG[roleCode] || ROLE_CONFIG['SERVIDOR'];
                      const Icon = config.icon;
                      
                      return (
                        <div 
                          key={ur.id}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color} ${config.border} border group`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{roleCode}</span>
                          {roleCode !== 'SERVIDOR' && (
                            <button
                              onClick={() => setRevokeTarget({ user, roleCode })}
                              className="ml-0.5 p-0.5 rounded-full hover:bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Revogar papel"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    user.ativo 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length > 50 && (
          <div className="p-3 bg-gray-50 text-center text-sm text-gray-500 border-t">
            Mostrando 50 de {filteredUsers.length} usuários. Use a busca para refinar.
          </div>
        )}
      </div>

      {/* Modals */}
      <GrantRoleModal
        isOpen={isGrantModalOpen}
        onClose={() => setIsGrantModalOpen(false)}
        roles={roles}
        users={usersWithRoles}
        currentUserId={currentUserId}
        onGrant={handleGrant}
      />

      <RevokeModal
        isOpen={!!revokeTarget}
        user={revokeTarget?.user || null}
        roleCode={revokeTarget?.roleCode || ''}
        onClose={() => setRevokeTarget(null)}
        onRevoke={handleRevoke}
      />
    </div>
  );
};

export default ProfileManagementSettings;

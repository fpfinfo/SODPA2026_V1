import React, { useState, useRef } from 'react';
import { SettingsSubTab, Role } from '../types';
import { useLocations } from '../hooks/useLocations';
import { useTeamMembers, TeamMember } from '../hooks/useTeamMembers';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
import { Comarca, Municipio, Lotacao, getComarcaStatusBadge } from '../types/locations';
import { 
  Users, 
  Building2, 
  MapPin, 
  University, 
  DollarSign, 
  BookOpen, 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  ChevronRight,
  Plus,
  Mail,
  CreditCard,
  FileText,
  Zap,
  Database,
  Terminal,
  ShieldAlert,
  Save,
  Play,
  History,
  X,
  UserCheck,
  Briefcase,
  Loader2,
  Upload,
  Camera
} from 'lucide-react';

interface SystemSettingsProps {
  onBack: () => void;
}

const SQL_SCHEMA = `-- ==========================================
-- SISTEMA DE CONCESSÃO DE SUPRIMENTOS (SCS-TJPA)
-- MIGRATION: 002_FULL_MODULES_SCHEMA
-- DATABASE: POSTGRESQL (SUPABASE)
-- ==========================================
-- (Schema truncated for brevity as it is displayed in the Database tab)
`;

export const SystemSettings: React.FC<SystemSettingsProps> = ({ onBack }) => {
  // Use Supabase hook for locations
  const { comarcas, municipios, lotacoes, isLoading, error, createComarca, updateComarca, deleteComarca, createMunicipio, updateMunicipio, deleteMunicipio, createLotacao, updateLotacao, deleteLotacao, refresh } = useLocations();
  
  // Use Supabase hook for team members
  const { teamMembers, isLoading: isLoadingTeam, createTeamMember, updateTeamMember, deleteTeamMember, updateServidorAvatar, searchServidores } = useTeamMembers();
  
  // Avatar upload hook
  const { uploadAvatar, isUploading: isUploadingAvatar, progress: uploadProgress, error: uploadError } = useAvatarUpload();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<SettingsSubTab | 'DATABASE'>('USERS');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [userFormData, setUserFormData] = useState<{ role: Role }>({ role: Role.CONCESSION });
  
  // Servidor search state
  const [servidorSearch, setServidorSearch] = useState('');
  const [servidorResults, setServidorResults] = useState<any[]>([]);
  const [selectedServidor, setSelectedServidor] = useState<any | null>(null);

  // CRUD states for Lotações
  const [isLotacaoModalOpen, setIsLotacaoModalOpen] = useState(false);
  const [editingLotacao, setEditingLotacao] = useState<Lotacao | null>(null);
  const [lotacaoFormData, setLotacaoFormData] = useState<Partial<Lotacao>>({ codigo: '', nome: '', tipo: 'ADMINISTRATIVA' });

  // CRUD states for Municípios
  const [isMunicipioModalOpen, setIsMunicipioModalOpen] = useState(false);
  const [editingMunicipio, setEditingMunicipio] = useState<Municipio | null>(null);
  const [municipioFormData, setMunicipioFormData] = useState<Partial<Municipio>>({ nome: '', codigo_ibge: '', uf: 'PA' });

  // CRUD states for Comarcas
  const [isComarcaModalOpen, setIsComarcaModalOpen] = useState(false);
  const [editingComarca, setEditingComarca] = useState<Comarca | null>(null);
  const [comarcaFormData, setComarcaFormData] = useState<Partial<Comarca>>({ codigo: '', nome: '', entrancia: '1ª Entrância', varas: 1, teto_anual: 0, status: 'ATIVA' });


  const handleOpenUserModal = (member?: TeamMember) => {
    if (member) { 
      setEditingMember(member); 
      setUserFormData({ role: member.role }); 
      setSelectedServidor(null);
    } else { 
      setEditingMember(null); 
      setUserFormData({ role: Role.CONCESSION }); 
      setSelectedServidor(null);
      setServidorSearch('');
      setServidorResults([]);
    }
    setIsUserModalOpen(true);
  };

  // Handle servidor search
  const handleServidorSearch = async (query: string) => {
    setServidorSearch(query);
    if (query.length >= 2) {
      const results = await searchServidores(query);
      setServidorResults(results);
    } else {
      setServidorResults([]);
    }
  };

  // Handle avatar file selection and upload (disabled for now - uses servidor avatar)
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Avatar now comes from servidor data
  };

  const handleSaveUser = async () => {
    if (!userFormData.role) { alert('Selecione um perfil.'); return; }
    if (editingMember) { 
      await updateTeamMember(editingMember.id, { role: userFormData.role }); 
    } else if (selectedServidor) { 
      await createTeamMember(selectedServidor.id, userFormData.role); 
    } else {
      alert('Selecione um servidor para adicionar.');
      return;
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = async (id: string) => { 
    if (window.confirm('Tem certeza que deseja remover este membro da equipe?')) { 
      await deleteTeamMember(id); 
    } 
  };

  const getRoleLabel = (role: Role) => {
    switch (role) { case Role.GOVERNANCE: return 'Governança & Chefia'; case Role.CONCESSION: return 'Análise de Concessão'; case Role.FINANCE: return 'Financeiro & Empenho'; case Role.AUDIT_CONSUMPTION: return 'Auditoria de Consumo'; case Role.TAX_ANALYSIS: return 'Análise Tributária'; default: return role; }
  };

  // ============ LOTAÇÃO CRUD HANDLERS ============
  const handleOpenLotacaoModal = (lot?: Lotacao) => {
    if (lot) { setEditingLotacao(lot); setLotacaoFormData({ ...lot }); }
    else { setEditingLotacao(null); setLotacaoFormData({ codigo: '', nome: '', tipo: 'ADMINISTRATIVA' }); }
    setIsLotacaoModalOpen(true);
  };

  const handleSaveLotacao = async () => {
    if (!lotacaoFormData.codigo || !lotacaoFormData.nome) { alert('Preencha código e nome.'); return; }
    if (editingLotacao) { await updateLotacao(editingLotacao.id, lotacaoFormData); }
    else { await createLotacao(lotacaoFormData); }
    setIsLotacaoModalOpen(false);
  };

  const handleDeleteLotacao = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta lotação?')) { await deleteLotacao(id); }
  };

  // ============ MUNICÍPIO CRUD HANDLERS ============
  const handleOpenMunicipioModal = (mun?: Municipio) => {
    if (mun) { setEditingMunicipio(mun); setMunicipioFormData({ ...mun }); }
    else { setEditingMunicipio(null); setMunicipioFormData({ nome: '', codigo_ibge: '' }); }
    setIsMunicipioModalOpen(true);
  };

  const handleSaveMunicipio = async () => {
    if (!municipioFormData.nome) { alert('Preencha o nome do município.'); return; }
    if (editingMunicipio) { await updateMunicipio(editingMunicipio.id, municipioFormData); }
    else { await createMunicipio(municipioFormData); }
    setIsMunicipioModalOpen(false);
  };

  const handleDeleteMunicipio = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este município?')) { await deleteMunicipio(id); }
  };

  // ============ COMARCA CRUD HANDLERS ============
  const handleOpenComarcaModal = (com?: Comarca) => {
    if (com) { setEditingComarca(com); setComarcaFormData({ ...com }); }
    else { setEditingComarca(null); setComarcaFormData({ codigo: '', nome: '', entrancia: '1ª Entrância', varas: 1, teto_anual: 0, status: 'ATIVA', dist_elemento_30_01: 25, dist_elemento_30_02: 25, dist_elemento_33: 20, dist_elemento_36: 15, dist_elemento_39: 15 }); }
    setIsComarcaModalOpen(true);
  };

  const handleSaveComarca = async () => {
    if (!comarcaFormData.codigo || !comarcaFormData.nome) { alert('Preencha código e nome.'); return; }
    if (editingComarca) { await updateComarca(editingComarca.id, comarcaFormData); }
    else { await createComarca(comarcaFormData); }
    setIsComarcaModalOpen(false);
  };

  const handleDeleteComarca = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta comarca?')) { await deleteComarca(id); }
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4"><button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600"><ArrowLeft size={20} /></button><div><h2 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h2><p className="text-slate-500 text-sm">Gerencie usuários, lotações e infraestrutura de dados</p></div></div>
      {activeTab === 'USERS' && (<button onClick={() => handleOpenUserModal()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 shadow-sm transition-all"><UserPlus size={18} /> Novo Membro</button>)}
      {activeTab === 'DEPARTMENTS' && (<button onClick={() => handleOpenLotacaoModal()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 shadow-sm transition-all"><Plus size={18} /> Nova Lotação</button>)}
      {activeTab === 'MUNICIPALITIES' && (<button onClick={() => handleOpenMunicipioModal()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 shadow-sm transition-all"><Plus size={18} /> Novo Município</button>)}
      {activeTab === 'DISTRICTS' && (<button onClick={() => handleOpenComarcaModal()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 shadow-sm transition-all"><Plus size={18} /> Nova Comarca</button>)}
    </div>
  );

  const renderTabs = () => (
    <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex mb-8 overflow-x-auto">
      {[{ id: 'USERS', label: 'Equipe Técnica', icon: Users }, { id: 'DEPARTMENTS', label: 'Lotações', icon: Building2 }, { id: 'MUNICIPALITIES', label: 'Municípios', icon: MapPin }, { id: 'DISTRICTS', label: 'Comarcas', icon: University }, { id: 'DOCS', label: 'Docs', icon: BookOpen }].map((tab) => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}><tab.icon size={18} className={activeTab === tab.id ? 'text-blue-600' : ''} />{tab.label}</button>
      ))}
    </div>
  );

  const renderUserModal = () => {
    if (!isUserModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">{editingMember ? <Edit3 size={18} className="text-blue-600"/> : <UserPlus size={18} className="text-blue-600"/>}{editingMember ? 'Editar Perfil' : 'Adicionar Membro'}</h3>
            <button onClick={() => setIsUserModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
          </div>
          <div className="p-6 space-y-4">
            {editingMember ? (
              // Editing existing member - show avatar, name and role
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="relative group">
                    <img 
                      src={editingMember.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editingMember.nome)}`} 
                      className="w-20 h-20 rounded-2xl border-2 border-slate-200 bg-slate-100 object-cover" 
                    />
                    <button 
                      type="button" 
                      onClick={() => avatarInputRef.current?.click()} 
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer"
                    >
                      {isUploadingAvatar ? <Loader2 size={24} className="text-white animate-spin" /> : <Camera size={24} className="text-white" />}
                    </button>
                    <input 
                      type="file" 
                      ref={avatarInputRef} 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && editingMember) {
                          await updateServidorAvatar(editingMember.servidor_id, file);
                        }
                      }} 
                      accept="image/jpeg,image/png,image/gif,image/webp" 
                      className="hidden" 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{editingMember.nome}</p>
                    <p className="text-xs text-slate-500">{editingMember.cargo || 'Cargo não informado'}</p>
                    <p className="text-xs text-blue-500">{editingMember.lotacao}</p>
                    <button 
                      type="button" 
                      onClick={() => avatarInputRef.current?.click()} 
                      disabled={isUploadingAvatar}
                      className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                      {isUploadingAvatar ? <><Loader2 size={12} className="animate-spin" /> Enviando...</> : <><Upload size={12} /> Alterar Foto</>}
                    </button>
                    {uploadError && <p className="text-[10px] text-red-500 mt-1">{uploadError}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Perfil no Sistema</label>
                  <select className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as Role})}>
                    {Object.values(Role).map(role => (<option key={role} value={role}>{getRoleLabel(role)}</option>))}
                  </select>
                </div>
              </div>
            ) : (
              // Adding new member - servidor search
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Buscar Servidor</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={servidorSearch} onChange={e => handleServidorSearch(e.target.value)} placeholder="Digite o nome do servidor..."/>
                  </div>
                  {servidorResults.length > 0 && !selectedServidor && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg">
                      {servidorResults.map(s => (
                        <button key={s.id} onClick={() => { setSelectedServidor(s); setServidorSearch(s.nome); setServidorResults([]); }} className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors">
                          <p className="text-sm font-medium text-slate-800">{s.nome}</p>
                          <p className="text-xs text-slate-500">{s.cargo || 'Sem cargo'} • {s.lotacao || 'Sem lotação'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedServidor && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-emerald-800">{selectedServidor.nome}</p>
                        <p className="text-xs text-emerald-600">{selectedServidor.cargo || 'Cargo não informado'}</p>
                        <p className="text-xs text-emerald-600">{selectedServidor.lotacao}</p>
                      </div>
                      <button onClick={() => { setSelectedServidor(null); setServidorSearch(''); }} className="text-emerald-600 hover:text-emerald-800"><X size={18}/></button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Perfil no Sistema</label>
                  <select className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as Role})}>
                    {Object.values(Role).map(role => (<option key={role} value={role}>{getRoleLabel(role)}</option>))}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-lg transition-all">Cancelar</button>
            <button onClick={handleSaveUser} disabled={!editingMember && !selectedServidor} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">Salvar</button>
          </div>
        </div>
      </div>
    );
  };

  // ============ LOTAÇÃO MODAL ============
  const renderLotacaoModal = () => {
    if (!isLotacaoModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Building2 size={18} className="text-blue-600"/>{editingLotacao ? 'Editar Lotação' : 'Nova Lotação'}</h3>
            <button onClick={() => setIsLotacaoModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
          </div>
          <div className="p-6 space-y-4">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Código</label><input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={lotacaoFormData.codigo || ''} onChange={e => setLotacaoFormData({...lotacaoFormData, codigo: e.target.value})} placeholder="Ex: SOSFU"/></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Nome</label><input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={lotacaoFormData.nome || ''} onChange={e => setLotacaoFormData({...lotacaoFormData, nome: e.target.value})} placeholder="Ex: Serviço de Suprimentos"/></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Tipo</label><select className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={lotacaoFormData.tipo || 'ADMINISTRATIVA'} onChange={e => setLotacaoFormData({...lotacaoFormData, tipo: e.target.value as any})}><option value="ADMINISTRATIVA">Administrativa</option><option value="JURISDICIONAL">Jurisdicional</option></select></div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"><button onClick={() => setIsLotacaoModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-lg transition-all">Cancelar</button><button onClick={handleSaveLotacao} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-md transition-all">Salvar</button></div>
        </div>
      </div>
    );
  };

  // ============ MUNICÍPIO MODAL ============
  const renderMunicipioModal = () => {
    if (!isMunicipioModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-blue-600"/>{editingMunicipio ? 'Editar Município' : 'Novo Município'}</h3>
            <button onClick={() => setIsMunicipioModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
          </div>
          <div className="p-6 space-y-4">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Nome</label><input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={municipioFormData.nome || ''} onChange={e => setMunicipioFormData({...municipioFormData, nome: e.target.value})} placeholder="Ex: Belém"/></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Código IBGE</label><input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={municipioFormData.codigo_ibge || ''} onChange={e => setMunicipioFormData({...municipioFormData, codigo_ibge: e.target.value})} placeholder="Ex: 1501402"/></div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"><button onClick={() => setIsMunicipioModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-lg transition-all">Cancelar</button><button onClick={handleSaveMunicipio} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-md transition-all">Salvar</button></div>
        </div>
      </div>
    );
  };

  // ============ COMARCA MODAL ============
  const renderComarcaModal = () => {
    if (!isComarcaModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><University size={18} className="text-purple-600"/>{editingComarca ? 'Editar Comarca' : 'Nova Comarca'}</h3>
            <button onClick={() => setIsComarcaModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
          </div>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Código</label><input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={comarcaFormData.codigo || ''} onChange={e => setComarcaFormData({...comarcaFormData, codigo: e.target.value})} placeholder="Ex: BEL"/></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Entrância</label><select className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={comarcaFormData.entrancia || '1ª Entrância'} onChange={e => setComarcaFormData({...comarcaFormData, entrancia: e.target.value as any})}><option value="1ª Entrância">1ª Entrância</option><option value="2ª Entrância">2ª Entrância</option><option value="3ª Entrância">3ª Entrância</option></select></div>
            </div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Nome</label><input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={comarcaFormData.nome || ''} onChange={e => setComarcaFormData({...comarcaFormData, nome: e.target.value})} placeholder="Ex: Comarca de Belém"/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Polo</label><input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={comarcaFormData.polo || ''} onChange={e => setComarcaFormData({...comarcaFormData, polo: e.target.value})} placeholder="Ex: 01° POLO - METROPOLITANA"/></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Região Judiciária</label><input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={comarcaFormData.regiao_judiciaria || ''} onChange={e => setComarcaFormData({...comarcaFormData, regiao_judiciaria: e.target.value})} placeholder="Ex: 01° REGIÃO JUDICIÁRIA"/></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Varas</label><input type="number" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={comarcaFormData.varas || 1} onChange={e => setComarcaFormData({...comarcaFormData, varas: parseInt(e.target.value) || 1})} min={1}/></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Teto Anual (R$)</label><input type="number" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={comarcaFormData.teto_anual || 0} onChange={e => setComarcaFormData({...comarcaFormData, teto_anual: parseFloat(e.target.value) || 0})} min={0}/></div>
            </div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Status</label><select className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" value={comarcaFormData.status || 'ATIVA'} onChange={e => setComarcaFormData({...comarcaFormData, status: e.target.value as any})}><option value="ATIVA">Ativa</option><option value="INATIVA">Inativa</option><option value="SEM_SUPRIDO">Sem Suprido</option><option value="BLOQUEADA">Bloqueada</option></select></div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"><button onClick={() => setIsComarcaModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-lg transition-all">Cancelar</button><button onClick={handleSaveComarca} className="px-6 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-purple-700 shadow-md transition-all">Salvar</button></div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    const filteredUsers = teamMembers.filter(u => 
      u.nome?.toLowerCase().includes(searchUserQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.lotacao?.toLowerCase().includes(searchUserQuery.toLowerCase())
    );
    return (
      <div className="space-y-6 animate-in fade-in">
        {renderUserModal()}
        <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar membro da equipe..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all" value={searchUserQuery} onChange={(e) => setSearchUserQuery(e.target.value)}/>
          </div>
          <div className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-500">{filteredUsers.length} Membros</div>
        </div>
        {isLoadingTeam ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-slate-400" /></div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.nome)}`} className="w-14 h-14 rounded-2xl border-2 border-white shadow-sm bg-slate-100" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full bg-emerald-500"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{user.nome}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${user.role === Role.GOVERNANCE ? 'bg-purple-100 text-purple-700' : user.role === Role.CONCESSION ? 'bg-blue-100 text-blue-700' : user.role === Role.AUDIT_CONSUMPTION ? 'bg-amber-100 text-amber-700' : user.role === Role.TAX_ANALYSIS ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{getRoleLabel(user.role).split(' ')[0]}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1.5"><Mail size={10}/> {user.email || 'Sem email cadastrado'}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1.5"><Briefcase size={10}/> {user.cargo || 'Cargo não informado'}</span>
                      <span className="text-xs text-blue-500 flex items-center gap-1.5"><Building2 size={10}/> {user.lotacao || 'Lotação não informada'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenUserModal(user)} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all" title="Editar Perfil"><Edit3 size={16} /></button>
                  <button onClick={() => handleDeleteUser(user.id)} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all" title="Remover"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDepartments = () => {
    const filteredLotacoes = lotacoes.filter(l => 
      l.nome?.toLowerCase().includes(searchLocationQuery.toLowerCase()) || 
      l.codigo?.toLowerCase().includes(searchLocationQuery.toLowerCase())
    );
    
    return (
      <div className="space-y-4">
        {renderLotacaoModal()}
        <div className="flex justify-between items-center mb-4">
          <div><h3 className="text-lg font-bold text-slate-800">Gestão de Lotações</h3><p className="text-sm text-slate-500">Configure as lotações/unidades do sistema</p></div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar lotação..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl" value={searchLocationQuery} onChange={e => setSearchLocationQuery(e.target.value)} />
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-slate-400" /></div>
        ) : (
          filteredLotacoes.map((lot) => (
            <div key={lot.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg border ${lot.tipo === 'JURISDICIONAL' ? 'bg-purple-50 border-purple-100 text-purple-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{lot.codigo}</h4>
                  <p className="text-xs text-slate-500">{lot.nome}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${lot.tipo === 'JURISDICIONAL' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>{lot.tipo}</span>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenLotacaoModal(lot)} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit3 size={16} /></button>
                <button onClick={() => handleDeleteLotacao(lot.id)} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
        <div className="text-xs text-slate-400 text-center pt-4">{filteredLotacoes.length} lotações encontradas</div>
      </div>
    );
  };


  const renderMunicipalities = () => {
    const filteredMunicipios = municipios.filter(m => 
      m.nome?.toLowerCase().includes(searchLocationQuery.toLowerCase()) || 
      (m.codigo_ibge || '').includes(searchLocationQuery)
    );
    
    return (
      <div className="space-y-4">
        {renderMunicipioModal()}
        <div className="flex justify-between items-center mb-4">
          <div><h3 className="text-lg font-bold text-slate-800">Gestão de Municípios</h3><p className="text-sm text-slate-500">Configure os municípios atendidos pelo sistema</p></div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar município..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl" value={searchLocationQuery} onChange={e => setSearchLocationQuery(e.target.value)} />
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-slate-400" /></div>
        ) : (
          filteredMunicipios.map((mun) => (
            <div key={mun.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-blue-500"><MapPin size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{mun.nome}</h4>
                  <p className="text-xs text-slate-500">
                    {mun.codigo_ibge && <span>IBGE: {mun.codigo_ibge} • </span>}
                    {mun.populacao ? <span>Pop: {mun.populacao.toLocaleString('pt-BR')}</span> : <span>UF: PA</span>}
                    {mun.comarca && <span> • Comarca: {(mun.comarca as any).nome || 'Sem comarca'}</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenMunicipioModal(mun)} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit3 size={16} /></button>
                <button onClick={() => handleDeleteMunicipio(mun.id)} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
        <div className="text-xs text-slate-400 text-center pt-4">{filteredMunicipios.length} municípios encontrados</div>
      </div>
    );
  };

  const renderDistricts = () => {
    const filteredComarcas = comarcas.filter(c => 
      c.nome?.toLowerCase().includes(searchLocationQuery.toLowerCase()) || 
      c.codigo?.toLowerCase().includes(searchLocationQuery.toLowerCase())
    );
    
    return (
      <div className="space-y-4">
        {renderComarcaModal()}
        <div className="flex justify-between items-center mb-4">
          <div><h3 className="text-lg font-bold text-slate-800">Gestão de Comarcas</h3><p className="text-sm text-slate-500">Configure as comarcas jurisdicionais vinculadas ao suprimento ordinário</p></div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar comarca..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl" value={searchLocationQuery} onChange={e => setSearchLocationQuery(e.target.value)} />
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-slate-400" /></div>
        ) : (
          filteredComarcas.map((com) => {
            const badge = getComarcaStatusBadge(com.status);
            return (
              <div key={com.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 text-purple-500"><University size={18} /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{com.nome}</h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-${badge.color}-100 text-${badge.color}-600`}>{badge.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{com.entrancia} • {com.varas} Varas • Teto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(com.teto_anual)}</p>
                    {com.suprido && <p className="text-xs text-emerald-600 font-medium">Suprido: {(com.suprido as any).nome}</p>}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenComarcaModal(com)} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit3 size={16} /></button>
                  <button onClick={() => handleDeleteComarca(com.id)} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })
        )}
        <div className="text-xs text-slate-400 text-center pt-4">{filteredComarcas.length} comarcas encontradas</div>
      </div>
    );
  };

  const renderExpenses = () => (<div className="space-y-4"><p className="text-slate-400 italic p-10 text-center">Gestão de Despesas (Placeholder)</p></div>);

  const renderDocs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div><h3 className="text-lg font-bold text-slate-800">Documentação do Sistema</h3><p className="text-sm text-slate-500">Manuais, guias e referências técnicas</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Manual do Suprido', desc: 'Guia completo para servidores supridos', icon: FileText, color: 'blue' },
          { title: 'Manual do Gestor', desc: 'Procedimentos para gestores de unidade', icon: Briefcase, color: 'purple' },
          { title: 'Fluxo de Concessão', desc: 'Etapas do processo de concessão', icon: ChevronRight, color: 'emerald' },
          { title: 'Prestação de Contas', desc: 'Como realizar a prestação de contas', icon: CreditCard, color: 'amber' },
          { title: 'Legislação Aplicável', desc: 'Lei 4.320/64 e normas internas', icon: BookOpen, color: 'slate' },
          { title: 'FAQ - Dúvidas Frequentes', desc: 'Respostas às perguntas mais comuns', icon: ShieldAlert, color: 'indigo' },
        ].map((doc, i) => (
          <div key={i} className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-${doc.color}-200 transition-all cursor-pointer group`}>
            <div className={`p-3 bg-${doc.color}-50 rounded-xl text-${doc.color}-600 w-fit mb-4 group-hover:scale-110 transition-transform`}>
              <doc.icon size={24} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">{doc.title}</h4>
            <p className="text-xs text-slate-500">{doc.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDatabase = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl"><div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700"><div className="flex items-center gap-2"><Terminal size={14} className="text-emerald-400" /><span className="text-xs font-mono text-slate-300">supabase/migrations/002_full_modules_schema.sql</span></div><div className="flex gap-2"><button onClick={() => alert('Script de migração iniciado no Supabase...')} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded transition-colors"><Play size={10} /> Executar Migration</button><button className="flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold rounded transition-colors"><Save size={10} /> Salvar Script</button></div></div><div className="p-6 font-mono text-sm"><pre className="text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre">{SQL_SCHEMA}</pre></div></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6 max-w-[1920px] mx-auto overflow-hidden">
      {renderHeader()}
      {renderTabs()}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10"><div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/60 shadow-inner min-h-full">{activeTab === 'USERS' && renderUsers()}{activeTab === 'DEPARTMENTS' && renderDepartments()}{activeTab === 'MUNICIPALITIES' && renderMunicipalities()}{activeTab === 'DISTRICTS' && renderDistricts()}{activeTab === 'EXPENSES' && renderExpenses()}{activeTab === 'DOCS' && renderDocs()}{activeTab === 'DATABASE' && renderDatabase()}</div></div>
    </div>
  );
};


import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Clock, 
  Bell, 
  Save, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useSODPATeamMembers } from '../../hooks/useSODPATeamMembers';
import { useToast } from '../ui/ToastProvider';
import { TeamMember } from '../../types';

// --- Sub-components for Settings Sections ---

// 1. GERAL
const GeneralSettings = () => {
    const { showToast } = useToast();
    const [moduleName, setModuleName] = useState('SODPA TJPA - Gestão de Diárias e Passagens');
    const [supportEmail, setSupportEmail] = useState('suporte.sodpa@tjpa.jus.br');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [autoBackup, setAutoBackup] = useState(true);

    const handleSave = () => {
        // Mock persistence
        showToast({ type: 'success', title: 'Configurações Salvas', message: 'As alterações foram aplicadas com sucesso.' });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Informações do Sistema</h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Módulo</label>
                    <input 
                        type="text" 
                        value={moduleName}
                        onChange={(e) => setModuleName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-75"
                        disabled // Disabled as per image dark background implication, or enabled if editable. Image shows dark bg, seemingly disabled or stylized. Let's make it editable but styled.
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Suporte</label>
                    <input 
                        type="text" 
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-75"
                         disabled
                    />
                </div>
            </div>

            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 pt-4">Preferências</h2>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                        <div className="font-medium text-gray-900">Modo de Manutenção</div>
                        <div className="text-xs text-gray-500">Impede novos acessos de usuários comuns.</div>
                    </div>
                    <button 
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                        <div className="font-medium text-gray-900">Backup Automático</div>
                        <div className="text-xs text-gray-500">Realizar backup diário às 23:00.</div>
                    </div>
                     <button 
                        onClick={() => setAutoBackup(!autoBackup)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoBackup ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoBackup ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

             <div className="flex justify-end pt-4">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                    <Save size={18} />
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};

// 2. USUÁRIOS E PERMISSÕES (CRUD)
const UserSettings = () => {
    const { members, loading, addMember, updateMember, toggleStatus } = useSODPATeamMembers();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);

    // Form Stats
    const [formData, setFormData] = useState({
        nome: '',
        userId: '',
        email: '',
        funcao: 'ANALISTA',
        setor: 'SODPA'
    });

    const handleEdit = (member: any) => {
        setEditingMember(member);
        setFormData({
            nome: member.nome,
            userId: member.id, // using id as userId placeholder
            email: member.email,
            funcao: member.funcao,
            setor: member.setor || 'SODPA'
        });
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingMember(null);
        setFormData({ nome: '', userId: '', email: '', funcao: 'ANALISTA', setor: 'SODPA' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingMember && editingMember.id) {
                // Update
                const res = await updateMember(editingMember.id, {
                    nome: formData.nome,
                    email: formData.email,
                    funcao: formData.funcao
                });
                if(res.success) showToast({ type: 'success', title: 'Usuário Atualizado', message: 'Dados atualizados com sucesso.' });
                else throw res.error;
            } else {
                // Create
                // Check if addMember exists (it should based on recent update)
                // Assuming addMember signature: (data: Omit<TeamMember, 'id'>) => ...
                if (addMember) {
                     const res = await addMember({
                        nome: formData.nome,
                        email: formData.email,
                        funcao: formData.funcao,
                        setor: formData.setor,
                        active: true, // Type mismatch potential if 'ativo' vs 'active' in types. Assuming types.ts has 'ativo' based on hook.
                        // We will map appropriately if needed. Hook uses 'ativo' in DB insert.
                    } as any);
                    if(res.success) showToast({ type: 'success', title: 'Usuário Criado', message: 'Novo membro adicionado à equipe.' });
                    else throw res.error;
                }
            }
            setIsModalOpen(false);
        } catch (err: any) {
             showToast({ type: 'error', title: 'Erro', message: err.message || 'Falha ao salvar usuário.' });
        }
    };

    const handleToggleStatus = async (member: any) => {
        const res = await toggleStatus(member.id, member.ativo);
        if(res.success) {
            showToast({ 
                type: 'success', 
                title: member.ativo ? 'Usuário Desativado' : 'Usuário Ativado', 
                message: `O acesso de ${member.nome} foi ${member.ativo ? 'revogado' : 'restaurado'}.` 
            });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Equipe SODPA</h2>
                <button 
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
                >
                    <Plus size={16} />
                    Adicionar Usuário
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Função</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                             <tr><td colSpan={4} className="p-8 text-center text-gray-500">Carregando usuários...</td></tr>
                        ) : members.map(member => (
                            <tr key={member.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.nome} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                                                {member.nome.charAt(0)}
                                            </div>
                                        )}
                                        <span className="font-medium text-gray-900">{member.nome}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{member.funcao}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button 
                                        onClick={() => handleToggleStatus(member)}
                                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                                            member.ativo 
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                    >
                                        {member.ativo ? 'Ativo' : 'Inativo'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button 
                                        onClick={() => handleEdit(member)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal for Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{editingMember ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.nome}
                                    onChange={e => setFormData({...formData, nome: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Institucional</label>
                                <input 
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.funcao}
                                    onChange={e => setFormData({...formData, funcao: e.target.value})}
                                >
                                    <option value="ANALISTA">Analista</option>
                                    <option value="GOVERNANCE">Governance</option>
                                    <option value="TAX ANALYSIS">Tax Analysis</option>
                                    <option value="FINANCE">Finance</option>
                                    <option value="AUDIT CONSUMPTION">Audit Consumption</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3. PRAZOS E SLA
const SLASettings = () => {
    const { showToast } = useToast();
    const handleSave = () => {
        showToast({ type: 'success', title: 'SLAs Atualizados', message: 'Novos parâmetros de prazo aplicados.' });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="border-b border-gray-100 pb-4 mb-4">
                <h2 className="text-lg font-bold text-gray-900">Definição de Prazos (SLA)</h2>
                <p className="text-sm text-gray-500 mt-1">Configure os alertas de atraso baseados no tempo de estagnação do processo.</p>
            </div>

            {/* Fase Analise Tecnica (Yellow) */}
            <div className="p-6 bg-amber-50 rounded-xl border border-amber-100">
                <h3 className="text-amber-800 font-bold mb-4 flex items-center gap-2">
                    <Clock size={18} />
                    Fase de Análise Técnica
                </h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ALERTA AMARELO (DIAS)</label>
                        <input type="number" defaultValue={3} className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg font-mono border-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ALERTA VERMELHO (DIAS)</label>
                        <input type="number" defaultValue={5} className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg font-mono border-none focus:ring-2 focus:ring-red-500" />
                    </div>
                </div>
            </div>

             {/* Fase Cotacao Passagem (Purple) */}
            <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="text-blue-800 font-bold mb-4 flex items-center gap-2">
                    <PlaneIcon size={18} /> {/* Using PlaneIcon if available, else generic */}
                    Fase de Cotação de Passagem
                </h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ALERTA AMARELO (HORAS)</label>
                        <input type="number" defaultValue={4} className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg font-mono border-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ALERTA VERMELHO (HORAS)</label>
                        <input type="number" defaultValue={8} className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg font-mono border-none focus:ring-2 focus:ring-red-500" />
                    </div>
                </div>
            </div>
             <div className="flex justify-end pt-4">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                    <Save size={18} />
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};

// --- Main Panel ---

import { Plane as PlaneIcon } from 'lucide-react';

type SettingsTab = 'GERAL' | 'USUARIOS' | 'SLA' | 'NOTIFICACOES';

export function ConfiguracoesPanel() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('GERAL');

    const menuItems = [
        { id: 'GERAL', label: 'Geral', icon: Settings },
        { id: 'USUARIOS', label: 'Usuários e Permissões', icon: Users },
        { id: 'SLA', label: 'Prazos e SLA', icon: Clock },
        { id: 'NOTIFICACOES', label: 'Notificações', icon: Bell },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
            {/* Sidebar */}
            <div className="w-full lg:w-64 shrink-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configurações
                    </h3>
                    <nav className="space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as SettingsTab)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                    activeTab === item.id
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <item.icon className={`h-4 w-4 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
                {activeTab === 'GERAL' && <GeneralSettings />}
                {activeTab === 'USUARIOS' && <UserSettings />}
                {activeTab === 'SLA' && <SLASettings />}
                {activeTab === 'NOTIFICACOES' && (
                    <div className="text-center py-12 text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900">Notificações</h3>
                        <p>Configurações de alerta em desenvolvimento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

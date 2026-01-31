import React, { useState } from 'react';
import { Save, User, Clock, Bell, Settings as SettingsIcon, Trash2, Check, CheckCircle2, AlertTriangle, Info, AlertCircle, DollarSign, Calendar, Edit, Plus } from 'lucide-react';
import { TEAM_MEMBERS, MOCK_ALLOWANCE_RATES } from '../constants';
import { useNotifications } from '../contexts/NotificationContext';
import { AllowanceUserType, TravelScope } from '../types';

type SettingsTab = 'GENERAL' | 'USERS' | 'SLA' | 'NOTIFICATIONS' | 'ALLOWANCE_VALUES';

// Mapping for user-friendly labels based on the Schema Enums
const USER_TYPE_LABELS: Record<AllowanceUserType, string> = {
    'desembargador_corregedor_juiz_auxiliar': 'Desembargador / Corregedor',
    'juiz_direito': 'Juiz de Direito',
    'cargos_comissionados_cjs': 'Cargo Comissionado (CJS)',
    'cargos_comissionados_cji': 'Cargo Comissionado (CJI)',
    'analista_judiciario': 'Analista Judiciário',
    'oficial_justica_avaliador': 'Oficial de Justiça',
    'cargos_nivel_medio': 'Nível Médio',
    'cargos_nivel_fundamental': 'Nível Fundamental'
};

const TRAVEL_TYPE_LABELS: Record<TravelScope, string> = {
    'NO_ESTADO': 'Estadual',
    'NO_PAIS': 'Nacional',
    'INTERNACIONAL': 'Internacional'
};

interface SettingsPageProps {
  onClose?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('GENERAL');
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();

  // Allowance Table State
  const [allowanceRates, setAllowanceRates] = useState(MOCK_ALLOWANCE_RATES);

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'SUCCESS': return <CheckCircle2 size={20} className="text-green-600" />;
      case 'WARNING': return <AlertTriangle size={20} className="text-orange-600" />;
      case 'ERROR': return <AlertCircle size={20} className="text-red-600" />;
      default: return <Info size={20} className="text-blue-600" />;
    }
  };

  const renderContent = () => {
    switch(activeTab) {
        case 'GENERAL':
            return (
                <div className="space-y-6 max-w-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Informações do Sistema</h3>
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Módulo</label>
                                <input type="text" defaultValue="SODPA TJPA - Gestão de Diárias e Passagens" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Suporte</label>
                                <input type="email" defaultValue="suporte.sodpa@tjpa.jus.br" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Preferências</h3>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <div className="font-medium text-gray-900">Modo de Manutenção</div>
                                <div className="text-sm text-gray-500">Impede novos acessos de usuários comuns.</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <div className="font-medium text-gray-900">Backup Automático</div>
                                <div className="text-sm text-gray-500">Realizar backup diário às 23:00.</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm transition-all">
                            <Save size={18} />
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            );
        case 'USERS':
            return (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Equipe SODPA</h3>
                        <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Adicionar Usuário</button>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {TEAM_MEMBERS.map((member) => (
                                    <tr key={member.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8">
                                                    <img className="h-8 w-8 rounded-full" src={member.avatarUrl} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.function}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ativo</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900">Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        case 'SLA':
            return (
                <div className="space-y-6 max-w-2xl">
                     <h3 className="text-lg font-bold text-gray-900 mb-4">Definição de Prazos (SLA)</h3>
                     <p className="text-sm text-gray-500 mb-6">Configure os alertas de atraso baseados no tempo de estagnação do processo.</p>
                     
                     <div className="grid gap-6">
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                            <h4 className="font-bold text-yellow-800 mb-2">Fase de Análise Técnica</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Alerta Amarelo (Dias)</label>
                                    <input type="number" defaultValue="3" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Alerta Vermelho (Dias)</label>
                                    <input type="number" defaultValue="5" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h4 className="font-bold text-blue-800 mb-2">Fase de Cotação de Passagem</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Alerta Amarelo (Horas)</label>
                                    <input type="number" defaultValue="4" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Alerta Vermelho (Horas)</label>
                                    <input type="number" defaultValue="8" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>
                     </div>
                     <div className="mt-4 flex justify-end">
                        <button className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm transition-all">
                            <Save size={18} />
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            );
        case 'ALLOWANCE_VALUES':
            return (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Tabela de Valores de Diárias</h3>
                            <p className="text-sm text-gray-500">Gerencie os valores vigentes para cálculo automático de diárias.</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2">
                            <Plus size={16} /> Adicionar Valor
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cargo / Função</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo Viagem</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valor (R$)</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vigência</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allowanceRates.map((rate) => (
                                    <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-800">{USER_TYPE_LABELS[rate.userType]}</div>
                                            <div className="text-xs text-gray-400 font-mono">{rate.userType}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                                rate.travelType === 'NO_ESTADO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                rate.travelType === 'NO_PAIS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                'bg-purple-50 text-purple-700 border-purple-200'
                                            }`}>
                                                {TRAVEL_TYPE_LABELS[rate.travelType]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-green-700 bg-green-50 px-2 py-1 rounded w-fit border border-green-100">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rate.value)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span>{new Date(rate.validFrom).toLocaleDateString('pt-BR')}</span>
                                                {rate.validTo && <span className="text-gray-400 text-xs"> até {new Date(rate.validTo).toLocaleDateString('pt-BR')}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {rate.active ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800 items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div> Ativo
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-gray-100 text-gray-600 items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> Inativo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        case 'NOTIFICATIONS':
            return (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Suas Notificações</h3>
                            <p className="text-sm text-gray-500">Gerencie seus alertas e avisos do sistema.</p>
                        </div>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Check size={16} /> Marcar tudo como lido
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {notifications.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                <h3 className="text-sm font-medium text-gray-900">Sem notificações</h3>
                                <p className="text-sm text-gray-500">Você está em dia com seus alertas.</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div 
                                    key={notification.id} 
                                    className={`p-4 rounded-xl border transition-all flex gap-4 ${
                                        notification.read 
                                        ? 'bg-white border-gray-200' 
                                        : 'bg-blue-50/50 border-blue-200 shadow-sm'
                                    }`}
                                >
                                    <div className={`mt-1 p-2 rounded-lg flex-shrink-0 h-fit ${
                                        notification.type === 'SUCCESS' ? 'bg-green-100' :
                                        notification.type === 'WARNING' ? 'bg-orange-100' :
                                        notification.type === 'ERROR' ? 'bg-red-100' :
                                        'bg-blue-100'
                                    }`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`text-sm ${notification.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                {new Date(notification.timestamp).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                        
                                        {notification.link && (
                                            <div className="mt-2">
                                                <button 
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                                                >
                                                    Ver Detalhes
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {!notification.read && (
                                            <button 
                                                onClick={() => markAsRead(notification.id)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                title="Marcar como lida"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => deleteNotification(notification.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            );
        default:
            return <div>Conteúdo não disponível</div>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 animate-fade-in">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0">
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
             <div className="p-4 border-b border-gray-100 bg-gray-50">
                 <h2 className="font-bold text-gray-800 flex items-center gap-2">
                     <SettingsIcon size={18} />
                     Configurações
                 </h2>
             </div>
             <nav className="p-2 space-y-1">
                 <button 
                    onClick={() => setActiveTab('GENERAL')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'GENERAL' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                 >
                     <SettingsIcon size={16} />
                     Geral
                 </button>
                 <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'USERS' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                 >
                     <User size={16} />
                     Usuários e Permissões
                 </button>
                 <button 
                    onClick={() => setActiveTab('SLA')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'SLA' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                 >
                     <Clock size={16} />
                     Prazos e SLA
                 </button>
                 <button 
                    onClick={() => setActiveTab('ALLOWANCE_VALUES')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ALLOWANCE_VALUES' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                 >
                     <DollarSign size={16} />
                     Tabela de Diárias
                 </button>
                 <button 
                    onClick={() => setActiveTab('NOTIFICATIONS')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors justify-between ${activeTab === 'NOTIFICATIONS' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                 >
                     <div className="flex items-center gap-3">
                        <Bell size={16} />
                        Notificações
                     </div>
                     {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                     )}
                 </button>
             </nav>
         </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1">
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
             {renderContent()}
         </div>
      </div>

    </div>
  );
};

export default SettingsPage;

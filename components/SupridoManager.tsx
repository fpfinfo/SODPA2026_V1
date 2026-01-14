import React, { useState } from 'react';
import { MOCK_COMARCAS } from '../constants';
import { 
  Users, 
  Search, 
  MapPin, 
  UserCheck, 
  Replace, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Building2,
  Calendar,
  Clock,
  Play,
  XCircle,
  Edit3,
  Save,
  X,
  ArrowRightLeft,
  Printer,
  Download
} from 'lucide-react';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

interface SupridoChangeRequest {
  id: string;
  unitId: string;
  unitName: string;
  currentHolder: string;
  newHolder: string;
  requestDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface ChangeLogEntry {
  id: string;
  unitName: string;
  previousHolder: string;
  newHolder: string;
  date: string;
  type: 'REQUEST' | 'MANUAL';
  user: string;
}

const MOCK_REQUESTS: SupridoChangeRequest[] = [
  {
    id: 'REQ-001',
    unitId: 'C003',
    unitName: 'Comarca de Marabá',
    currentHolder: 'Ana Beatriz Lima',
    newHolder: 'Carlos Eduardo Souza',
    requestDate: new Date().toISOString(),
    reason: 'Férias regulamentares do titular (30 dias).',
    status: 'PENDING'
  }
];

export const SupridoManager: React.FC = () => {
  const [requests, setRequests] = useState<SupridoChangeRequest[]>(MOCK_REQUESTS);
  const [units, setUnits] = useState(MOCK_COMARCAS);
  const [logs, setLogs] = useState<ChangeLogEntry[]>([]);
  
  const [searchUnit, setSearchUnit] = useState('');
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'UNITS' | 'HISTORY'>('REQUESTS');
  
  // Edit & View Modal States
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [viewingDoc, setViewingDoc] = useState<SupridoChangeRequest | null>(null);
  const [newHolderName, setNewHolderName] = useState('');

  // --- Actions ---

  const handleSimulateRequest = () => {
    // 1. Pick a random unit that doesn't have a pending request
    const availableUnits = units.filter(u => !requests.find(r => r.unitId === u.id));
    
    if (availableUnits.length === 0) {
      alert("Todas as unidades já possuem solicitações pendentes!");
      return;
    }

    const randomUnit = availableUnits[Math.floor(Math.random() * availableUnits.length)];
    const mockNames = ['Roberto Almeida', 'Fernanda Lima', 'Patricia Abravanel', 'Silvio Santos', 'Fausto Silva', 'Ana Maria'];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];

    const newReq: SupridoChangeRequest = {
        id: `REQ-${Date.now()}`,
        unitId: randomUnit.id,
        unitName: randomUnit.name,
        currentHolder: randomUnit.holder,
        newHolder: randomName,
        requestDate: new Date().toISOString(),
        reason: 'Solicitação simulada pelo Gestor da unidade para fins de teste.',
        status: 'PENDING'
    };

    setRequests(prev => [newReq, ...prev]);
    setActiveTab('REQUESTS');
  };

  const handleApproveRequest = (request: SupridoChangeRequest) => {
    // 1. Update Unit
    setUnits(prev => prev.map(u => 
        u.id === request.unitId ? { ...u, holder: request.newHolder } : u
    ));
    
    // 2. Add to Log
    const newLog: ChangeLogEntry = {
        id: `LOG-${Date.now()}`,
        unitName: request.unitName,
        previousHolder: request.currentHolder,
        newHolder: request.newHolder,
        date: new Date().toISOString(),
        type: 'REQUEST',
        user: 'Técnico SOSFU'
    };
    setLogs(prev => [newLog, ...prev]);

    // 3. Remove Request
    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const handleRejectRequest = (id: string) => {
      if(confirm('Tem certeza que deseja rejeitar esta solicitação?')) {
          setRequests(prev => prev.filter(r => r.id !== id));
      }
  };

  const openEditModal = (unit: any) => {
      setEditingUnit(unit);
      setNewHolderName(unit.holder);
  };

  const handleManualUpdate = () => {
      if (!editingUnit) return;
      
      const previous = editingUnit.holder;
      
      // Update Unit
      setUnits(prev => prev.map(u => u.id === editingUnit.id ? { ...u, holder: newHolderName } : u));

      // Log
      const newLog: ChangeLogEntry = {
        id: `LOG-${Date.now()}`,
        unitName: editingUnit.name,
        previousHolder: previous,
        newHolder: newHolderName,
        date: new Date().toISOString(),
        type: 'MANUAL',
        user: 'Admin (Manual)'
    };
    setLogs(prev => [newLog, ...prev]);
    
    setEditingUnit(null);
  };

  // --- Filtering ---
  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchUnit.toLowerCase()) ||
    u.holder.toLowerCase().includes(searchUnit.toLowerCase())
  );

  const renderDocumentModal = () => {
    if (!viewingDoc) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white h-[90vh] w-[800px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={18} className="text-slate-500"/> Documento Anexo
                    </h3>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors" title="Imprimir"><Printer size={18}/></button>
                        <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors" title="Baixar PDF"><Download size={18}/></button>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors"><X size={20}/></button>
                    </div>
                </div>

                {/* Document Body */}
                <div className="flex-1 overflow-y-auto bg-slate-200 p-8 flex justify-center custom-scrollbar">
                    <div className="bg-white w-[650px] min-h-[850px] shadow-lg p-16 text-slate-900 font-serif relative">
                        {/* Header */}
                        <div className="flex flex-col items-center mb-12 space-y-2">
                            <img src={BRASAO_TJPA_URL} className="w-20 grayscale opacity-80" alt="Brasão" />
                            <div className="text-center uppercase font-bold text-xs tracking-widest leading-relaxed">
                                <p>Poder Judiciário do Estado do Pará</p>
                                <p>Secretaria de Planejamento, Coordenação e Finanças</p>
                                <p>{viewingDoc.unitName}</p>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-10">
                            <h2 className="text-lg font-black uppercase underline decoration-2 decoration-slate-400 underline-offset-4">Portaria Nº {Math.floor(Math.random() * 100)}/2026-GP</h2>
                        </div>

                        {/* Content */}
                        <div className="text-justify text-sm leading-8 space-y-6">
                            <p>
                                O <strong>MAGISTRADO/GESTOR</strong> da {viewingDoc.unitName}, no uso de suas atribuições legais e regimentais, e considerando a necessidade de manter a regularidade na execução financeira das despesas de pequeno vulto desta unidade;
                            </p>
                            
                            <p>
                                <strong>RESOLVE:</strong>
                            </p>

                            <p>
                                <strong>Art. 1º</strong> DESIGNAR o(a) servidor(a) <strong>{viewingDoc.newHolder.toUpperCase()}</strong>, matrícula funcional nº 55.XXX-X, ocupante do cargo de Técnico Judiciário, para atuar como <strong>Suprido(a)</strong> responsável pela gestão do Suprimento de Fundos Ordinário desta unidade.
                            </p>

                            <p>
                                <strong>Art. 2º</strong> DISPENSAR da referida função o(a) servidor(a) <strong>{viewingDoc.currentHolder.toUpperCase()}</strong>, matrícula funcional nº 55.YYY-Y, que deverá prestar contas dos valores sob sua responsabilidade no prazo legal.
                            </p>

                            <p>
                                <strong>Art. 3º</strong> Esta Portaria entra em vigor na data de sua publicação, revogando-se as disposições em contrário.
                            </p>
                        </div>

                        {/* Date and Signature */}
                        <div className="mt-24 text-center">
                            <p className="mb-12">{viewingDoc.unitName.replace('Comarca de ', '')}, {new Date(viewingDoc.requestDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
                            
                            <div className="w-64 h-px bg-black mx-auto mb-2"></div>
                            <p className="font-bold uppercase text-xs">Juiz de Direito / Gestor Administrativo</p>
                            <p className="text-[10px] uppercase">Diretor do Fórum</p>
                        </div>

                        {/* Footer Watermark */}
                        <div className="absolute bottom-8 left-0 right-0 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                            Documento Assinado Digitalmente • Sistema de Concessão de Suprimentos
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in h-full flex flex-col">
        {renderDocumentModal()}

        {/* Header */}
        <div className="flex justify-between items-end mb-4 shrink-0">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                    Gestão de Supridos <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium tracking-normal border border-orange-200">Ordinário</span>
                </h1>
                <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
                    <UserCheck size={16} className="text-orange-500" />
                    Controle de responsáveis pelo suprimento de fundos nas unidades.
                </p>
            </div>
            
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleSimulateRequest}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 shadow-lg transition-all"
                >
                    <Play size={14} /> Simular Solicitação do Gestor
                </button>

                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                    <button 
                        onClick={() => setActiveTab('REQUESTS')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'REQUESTS' ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Replace size={16} /> Pendentes
                        {requests.length > 0 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{requests.length}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('UNITS')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'UNITS' ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Building2 size={16} /> Unidades
                    </button>
                    <button 
                        onClick={() => setActiveTab('HISTORY')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <History size={16} /> Histórico
                    </button>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
            
            {activeTab === 'REQUESTS' && (
                <div className="space-y-6">
                    {requests.length === 0 ? (
                        <div className="bg-white rounded-[32px] border border-slate-200 p-20 text-center opacity-50">
                            <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4" />
                            <p className="text-xl font-black uppercase text-slate-900">Tudo Atualizado</p>
                            <p className="text-sm">Não há solicitações de troca pendentes.</p>
                            <button onClick={handleSimulateRequest} className="mt-6 text-blue-600 font-bold hover:underline">Simular nova solicitação</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {requests.map(req => (
                                <div key={req.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all group relative overflow-hidden animate-in slide-in-from-bottom-2">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="text-[10px] font-black bg-orange-50 text-orange-700 px-2 py-1 rounded uppercase tracking-widest mb-2 inline-block">Solicitação do Gestor</span>
                                            <h3 className="text-xl font-black text-slate-800">{req.unitName}</h3>
                                            <p className="text-xs text-slate-500 font-mono mt-1">Solicitado em: {new Date(req.requestDate).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-orange-600 transition-colors">
                                            <Replace size={24} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex-1 text-center border-r border-slate-200 pr-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Sai (Atual)</p>
                                            <p className="text-sm font-bold text-slate-700 truncate">{req.currentHolder}</p>
                                        </div>
                                        <div className="text-orange-500"><History size={16}/></div>
                                        <div className="flex-1 text-center pl-4">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Entra (Novo)</p>
                                            <p className="text-sm font-black text-slate-800 truncate">{req.newHolder}</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Motivo</p>
                                        <p className="text-sm text-slate-600 italic">"{req.reason}"</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setViewingDoc(req)}
                                            className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FileText size={16}/> Ver Documento
                                        </button>
                                        <button 
                                            onClick={() => handleApproveRequest(req)}
                                            className="flex-[2] py-3 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={16}/> Aprovar Troca
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'UNITS' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <Search className="text-slate-400 ml-2" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar unidade ou suprido..." 
                            className="flex-1 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                            value={searchUnit}
                            onChange={(e) => setSearchUnit(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/3">Unidade Organizacional</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Suprido Responsável</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUnits.map((unit) => (
                                    <tr key={unit.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <MapPin size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{unit.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{unit.code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold border border-orange-200">
                                                    {unit.holder.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{unit.holder}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                Ativo
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => openEditModal(unit)}
                                                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group-hover:shadow-md" 
                                                title="Editar Manualmente"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'HISTORY' && (
                <div className="space-y-6">
                    {logs.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 italic">
                            Nenhuma alteração registrada ainda.
                        </div>
                    ) : (
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Unidade</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Alteração</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Autor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-8 py-4 text-xs font-mono text-slate-500">
                                                {new Date(log.date).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-8 py-4 font-bold text-slate-700">{log.unitName}</td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-slate-400 line-through">{log.previousHolder}</span>
                                                    <ArrowRightLeft size={12} className="text-slate-300"/>
                                                    <span className="font-bold text-slate-800">{log.newHolder}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${log.type === 'REQUEST' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                                    {log.user}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Edit Modal */}
        {editingUnit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-slate-800">Alterar Suprido Manualmente</h3>
                        <button onClick={() => setEditingUnit(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Unidade</p>
                            <p className="text-sm font-bold text-slate-800">{editingUnit.name}</p>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Novo Responsável</label>
                            <input 
                                type="text" 
                                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newHolderName}
                                onChange={(e) => setNewHolderName(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setEditingUnit(null)} className="flex-1 py-3 text-slate-500 font-bold text-xs hover:bg-slate-50 rounded-xl">Cancelar</button>
                            <button onClick={handleManualUpdate} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-md flex items-center justify-center gap-2">
                                <Save size={16}/> Salvar Alteração
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Process, AccountStatus } from '../types';
import { Building2, Search, FileCheck, CheckCircle2, Clock, Calendar, Key, X, Save, Loader2 } from 'lucide-react';

interface SiafeManagerProps {
  processes: Process[]; 
  onUpdateStatus: (processId: string, nl: string, date: string) => void;
  isLoading?: boolean;
}

type Tab = 'PENDING' | 'HISTORY';

interface BaixaSiafeRecord {
  id: string;
  solicitacao_id: string;
  prestacao_contas_id: string;
  nup: string;
  suprido_nome: string;
  unidade: string;
  valor_aprovado: number;
  status_pc: string;
  status_baixa: 'PENDENTE' | 'BAIXADO';
  nl?: string;
  data_baixa?: string;
  created_at: string;
}

export const SiafeManager: React.FC<SiafeManagerProps> = ({ processes, onUpdateStatus, isLoading = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  // const [records, setRecords] = useState<BaixaSiafeRecord[]>([]); // Derived from props now
  // const [isLoading, setIsLoading] = useState(false); // Controlled by parent -> Now props
  
  const [selectedRecord, setSelectedRecord] = useState<BaixaSiafeRecord | null>(null);
  const [nlNumber, setNlNumber] = useState('');
  const [writeOffDate, setWriteOffDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map processes prop to BaixaSiafeRecord structure
  const records: BaixaSiafeRecord[] = processes.map(p => {
    const workflow = (p as any).status_workflow;
    const isBaixado = workflow === 'PC_SIAFE_DONE' || (p.status as string)?.includes('BAIXADO');
    return {
      id: p.id,
      solicitacao_id: p.id,
      prestacao_contas_id: p.id, // Placeholder, not critical for list
      nup: p.protocolNumber,
      suprido_nome: p.interestedParty,
      unidade: 'TJPA', // Generic for now, or extract from p
      valor_aprovado: p.value,
      status_pc: p.status as string,
      status_baixa: isBaixado ? 'BAIXADO' : 'PENDENTE',
      nl: (p as any).siafe_nl,
      data_baixa: (p as any).siafe_date,
      created_at: p.createdAt
    };
  });

  const filteredRecords = records.filter(r => {
    // Tab Filter
    if (activeTab === 'PENDING' && r.status_baixa !== 'PENDENTE') return false;
    if (activeTab === 'HISTORY' && r.status_baixa !== 'BAIXADO') return false;

    // Search Filter
    return (
      r.nup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.suprido_nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenModal = (record: BaixaSiafeRecord) => {
    setSelectedRecord(record);
    setNlNumber('');
    setWriteOffDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async () => {
    if (!selectedRecord || !nlNumber || !writeOffDate) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Propagate to parent to update solicitacoes workflow
      // Note: selectedRecord.solicitacao_id maps to Process ID
      await onUpdateStatus(selectedRecord.solicitacao_id, nlNumber, writeOffDate);

      setSelectedRecord(null);
    } catch (err: any) {
      alert('Erro ao realizar baixa: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="h-full flex flex-col p-6 max-w-[1600px] mx-auto overflow-hidden animate-in fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            Integração SIAFE <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-lg text-xs font-medium tracking-normal border border-sky-200">SEFA/PA</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
            <Building2 size={16} className="text-sky-500" />
            Gestão de Baixa de Responsabilidade de Suprimento de Fundos.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          <button onClick={() => setActiveTab('PENDING')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PENDING' ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-100' : 'text-slate-400 hover:text-slate-600'}`}>
            <Clock size={16} /> Pendentes
          </button>
          <button onClick={() => setActiveTab('HISTORY')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-100' : 'text-slate-400 hover:text-slate-600'}`}>
            <FileCheck size={16} /> Histórico de Baixas
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 mb-6">
        <Search className="text-slate-400 ml-2" size={20} />
        <input type="text" placeholder="Buscar por protocolo, suprido ou unidade..." className="flex-1 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-[32px] border border-slate-200 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Protocolo / Suprido</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Unidade</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Aprovado</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status PC</th>
              {activeTab === 'HISTORY' && <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Dados Baixa</th>}
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
               <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" />Carregando...</td></tr>
            ) : filteredRecords.length === 0 ? (
              <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><Building2 size={48} className="text-slate-200"/><p className="font-medium text-sm">Nenhum registro encontrado nesta visão.</p></div></td></tr>
            ) : filteredRecords.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-6"><p className="text-sm font-black text-slate-800">{r.suprido_nome}</p><p className="text-[10px] font-mono text-slate-500 mt-0.5">{r.nup}</p></td>
                <td className="px-8 py-6 text-sm text-slate-600 font-medium">{r.unidade || 'Não informada'}</td>
                <td className="px-8 py-6"><span className="font-black text-slate-700">{formatCurrency(r.valor_aprovado)}</span></td>
                <td className="px-8 py-6"><span className={`inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide border ${activeTab === 'PENDING' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{r.status_pc}</span></td>
                {activeTab === 'HISTORY' && <td className="px-8 py-6">{r.nl ? <div className="flex flex-col"><span className="text-xs font-bold text-slate-700">NL: {r.nl}</span><span className="text-[10px] text-slate-500">{r.data_baixa && new Date(r.data_baixa).toLocaleDateString('pt-BR')}</span></div> : <span className="text-xs text-slate-400">-</span>}</td>}
                <td className="px-8 py-6 text-right">{activeTab === 'PENDING' ? <button onClick={() => handleOpenModal(r)} className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sky-700 shadow-md transition-all"><Building2 size={14}/> Baixar no SIAFE</button> : <span className="text-xs font-bold text-slate-400 flex items-center justify-end gap-1"><CheckCircle2 size={14}/> Concluído</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 overflow-hidden">
            <div className="bg-sky-600 px-6 py-4 flex justify-between items-center"><h3 className="font-black text-white flex items-center gap-2"><Building2 size={20}/> Baixa de Responsabilidade</h3><button onClick={() => setSelectedRecord(null)} className="text-white/80 hover:text-white"><X size={20}/></button></div>
            <div className="p-6 space-y-6">
              <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl"><p className="text-[10px] font-black text-sky-700 uppercase tracking-widest mb-1">Processo</p><p className="text-sm font-bold text-sky-900 mb-2">{selectedRecord.nup}</p><p className="text-[10px] font-black text-sky-700 uppercase tracking-widest mb-1">Responsável</p><p className="text-sm font-medium text-sky-800">{selectedRecord.suprido_nome}</p></div>
              <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Número da NL (Nota de Lançamento)</label><div className="relative"><Key className="absolute left-3 top-2.5 text-slate-400" size={16}/><input type="text" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase" placeholder="Ex: 2026NL000123" value={nlNumber} onChange={(e) => setNlNumber(e.target.value)}/></div></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Data da Baixa</label><div className="relative"><Calendar className="absolute left-3 top-2.5 text-slate-400" size={16}/><input type="date" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500" value={writeOffDate} onChange={(e) => setWriteOffDate(e.target.value)}/></div></div>
              </div>
              <div className="flex gap-3 pt-2"><button onClick={() => setSelectedRecord(null)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50">Cancelar</button><button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-sky-700 shadow-lg transition-all flex items-center justify-center gap-2">{isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Confirmar Baixa</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Send, FileText, Bookmark, Printer, Scale, ArrowLeft, Bold, Italic, List, AlignLeft, Calendar, User, MapPin, Copy } from 'lucide-react';
import { AjsefinRequest } from './types';

interface LegalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AjsefinRequest | null;
  onConfirm: (requestId: string, opinion: string) => void;
}

const LegalAnalysisModal: React.FC<LegalAnalysisModalProps> = ({ isOpen, onClose, request, onConfirm }) => {
  const [opinionText, setOpinionText] = useState('');

  useEffect(() => {
    if (isOpen) {
        setOpinionText(''); // Reset on open
    }
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const templates = {
      national: `MINUTA DE AUTORIZAÇÃO (Viagem Nacional)\n\nReferência: Processo ${request.protocol}\nInteressado: ${request.requesterName} (${request.requesterSector})\nDestino: ${request.destination}\n\n1. Trata-se de solicitação de passagens aéreas e/ou diárias para deslocamento a serviço em território nacional.\n\n2. A despesa está em conformidade com a Resolução nº 01/2023-TJPA, havendo disponibilidade orçamentária para o exercício vigente.\n\n3. Diante do exposto, OPINO pelo DEFERIMENTO do pedido, encaminhando-se os autos à Secretaria de Finanças para autorização do Ordenador de Despesas.\n\nBelém, ${new Date().toLocaleDateString('pt-BR')}.`,
      
      magistrate: `MINUTA DE AUTORIZAÇÃO (Magistratura)\n\nReferência: Processo ${request.protocol}\nExcelentíssimo Senhor Magistrado: ${request.requesterName}\n\n1. Certifico a regularidade do pedido de deslocamento institucional do magistrado solicitante.\n\n2. A concessão ampara-se no Art. 5º do Regimento Interno e na Lei Orgânica da Magistratura (LOMAN).\n\n3. Encaminhe-se para providências imediatas de emissão e pagamento.\n\nBelém, ${new Date().toLocaleDateString('pt-BR')}.`,
      
      return: `DESPACHO DE DEVOLUÇÃO (Solicitação de Informações)\n\nReferência: Processo ${request.protocol}\nAo Setor: ${request.requesterSector}\n\n1. Em análise preliminar, verificou-se a ausência de informações essenciais para o prosseguimento do feito.\n\n2. Solicitamos a complementação da documentação, especificamente: [Inserir documento pendente ou justificativa necessária].\n\n3. Retorne-se à unidade de origem para saneamento.\n\nBelém, ${new Date().toLocaleDateString('pt-BR')}.`
  };

  const applyTemplate = (key: keyof typeof templates) => {
      setOpinionText(templates[key]);
  };

  const insertVariable = (text: string) => {
      setOpinionText(prev => prev + text);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
            <div className="flex items-center gap-4">
                <div className="bg-amber-500/20 p-2.5 rounded-lg border border-amber-500/50 shadow-inner">
                    <Scale className="text-amber-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold leading-none tracking-tight">Editor de Minuta Jurídica</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-200 font-mono">PROCESSO: {request.protocol}</span>
                        <span className="text-xs text-slate-400 border-l border-slate-600 pl-2">Fluxo de Aprovação AJSEFIN</span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors text-slate-300 hover:text-white"><X size={24} /></button>
        </div>

        {/* Split View Content */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Left Panel: Request Details (Read Only) */}
            <div className="w-[35%] bg-slate-50 border-r border-gray-200 overflow-y-auto">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} /> Dados dos Autos
                         </h4>
                         <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">ANÁLISE PENDENTE</span>
                    </div>
                    
                    {/* Main Info Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide block mb-1">Interessado</span>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                    {request.requesterName.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800 text-base leading-tight">{request.requesterName}</div>
                                    <div className="text-xs text-gray-500 font-medium">{request.requesterSector}</div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 w-full"></div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide block mb-1">Categoria</span>
                                <div className="font-medium text-gray-700 text-sm bg-gray-50 px-2 py-1 rounded border border-gray-100 inline-block">
                                    {request.category || 'Ordinário'}
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide block mb-1">Valor Est.</span>
                                <div className="font-mono font-bold text-gray-800 text-sm">R$ {request.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                    </div>

                    {/* Description Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide block mb-2">Objeto da Solicitação</span>
                        <div className="p-3 bg-yellow-50/50 rounded-lg border border-yellow-100">
                            <p className="text-sm text-gray-700 leading-relaxed italic">"{request.description}"</p>
                        </div>
                    </div>

                    {/* Logistics Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <div className="flex items-start gap-3">
                            <MapPin className="text-red-500 mt-0.5" size={16} />
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide block">Destino</span>
                                <span className="font-bold text-gray-800 text-sm">{request.destination}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Calendar className="text-blue-500 mt-0.5" size={16} />
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide block">Data Prevista</span>
                                <span className="font-bold text-gray-800 text-sm">
                                    {request.deadline ? new Date(request.deadline).toLocaleDateString('pt-BR') : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Rich Editor (Editable) */}
            <div className="w-[65%] flex flex-col bg-white">
                
                {/* 1. Quick Variables Toolbar */}
                <div className="h-12 border-b border-gray-100 flex items-center px-4 gap-2 bg-white overflow-x-auto">
                    <span className="text-[10px] font-bold text-gray-400 uppercase mr-2 whitespace-nowrap">Inserir Variável:</span>
                    <button onClick={() => insertVariable(` ${request.requesterName} `)} className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1 transition-colors whitespace-nowrap"><User size={10} /> Nome</button>
                    <button onClick={() => insertVariable(` ${request.protocol} `)} className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1 transition-colors whitespace-nowrap"><Copy size={10} /> Protocolo</button>
                    <button onClick={() => insertVariable(` ${request.destination} `)} className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1 transition-colors whitespace-nowrap"><MapPin size={10} /> Destino</button>
                    <button onClick={() => insertVariable(` ${new Date().toLocaleDateString('pt-BR')} `)} className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1 transition-colors whitespace-nowrap"><Calendar size={10} /> Data Hoje</button>
                </div>

                {/* 2. Main Toolbar with Templates */}
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4 overflow-x-auto">
                        
                        {/* Templates Button Group */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
                            <span className="text-[10px] font-bold text-gray-400 uppercase px-2">Templates:</span>
                            <button 
                                onClick={() => applyTemplate('national')}
                                title="Minuta Padrão - Viagem Nacional"
                                className="px-3 py-1.5 text-blue-700 bg-blue-50 border border-blue-100 text-xs font-bold rounded hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                            >
                                <FileText size={14} /> Nacional
                            </button>
                            <div className="w-px h-4 bg-gray-200"></div>
                            <button 
                                onClick={() => applyTemplate('magistrate')}
                                title="Minuta Padrão - Magistratura"
                                className="px-3 py-1.5 text-amber-700 bg-amber-50 border border-amber-100 text-xs font-bold rounded hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                            >
                                <Bookmark size={14} /> Magistratura
                            </button>
                            <div className="w-px h-4 bg-gray-200"></div>
                            <button 
                                onClick={() => applyTemplate('return')}
                                title="Despacho de Devolução / Diligência"
                                className="px-3 py-1.5 text-red-700 bg-red-50 border border-red-100 text-xs font-bold rounded hover:bg-red-100 transition-colors flex items-center gap-1.5"
                            >
                                <ArrowLeft size={14} /> Devolução
                            </button>
                        </div>

                        {/* Formatting Tools (Visual Mock) */}
                        <div className="flex items-center gap-1 text-gray-400 border-l border-gray-200 pl-4 hidden md:flex">
                             <button className="p-1.5 hover:text-gray-700 hover:bg-gray-200 rounded"><Bold size={16} /></button>
                             <button className="p-1.5 hover:text-gray-700 hover:bg-gray-200 rounded"><Italic size={16} /></button>
                             <button className="p-1.5 hover:text-gray-700 hover:bg-gray-200 rounded"><List size={16} /></button>
                             <button className="p-1.5 hover:text-gray-700 hover:bg-gray-200 rounded"><AlignLeft size={16} /></button>
                        </div>
                    </div>
                    
                    <button className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white transition-colors flex-shrink-0" title="Imprimir Rascunho">
                        <Printer size={18} />
                    </button>
                </div>

                {/* 3. Text Area (Paper) */}
                <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
                    <textarea 
                        className="w-full min-h-[500px] p-12 bg-white shadow-sm border border-gray-200 rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-200 font-serif text-gray-800 leading-8 text-lg selection:bg-blue-100 selection:text-blue-900"
                        placeholder="Selecione um template acima ou comece a redigir o parecer jurídico..."
                        value={opinionText}
                        onChange={(e) => setOpinionText(e.target.value)}
                        spellCheck={false}
                    ></textarea>
                </div>

                {/* 4. Footer Actions */}
                <div className="h-20 border-t border-gray-200 px-8 flex items-center justify-between bg-white z-20">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${opinionText ? 'bg-amber-400 animate-pulse' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-bold text-gray-500 uppercase">
                            {opinionText ? 'Edição em andamento...' : 'Aguardando início'}
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            Salvar Rascunho
                        </button>
                        <button 
                            onClick={() => onConfirm(request.id, opinionText)}
                            disabled={!opinionText}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:scale-95"
                        >
                            <Send size={16} />
                            Finalizar e Enviar p/ SEFIN
                        </button>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default LegalAnalysisModal;

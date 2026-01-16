import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Process, ProcessType, ConcessionStatus, ProcessDocument, DocType } from '../types';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  ArrowRight, 
  Briefcase,
  Zap,
  ChevronRight,
  TrendingUp,
  Ban,
  FileSignature,
  Building2,
  CalendarDays,
  FileCheck,
  Printer,
  Eye,
  Key,
  Landmark,
  Send,
  Loader2,
  X,
  CreditCard,
  Lock,
  Unlock
} from 'lucide-react';

interface ConcessionManagerProps {
  processes: Process[];
  onUpdateStatus: (processId: string, newStatus: string) => void;
  onUpdateExecutionNumbers: (processId: string, numbers: { ne_numero?: string; dl_numero?: string; ob_numero?: string }) => Promise<void>;
  onTramitToSefin: (processId: string) => Promise<void>;
  onCompleteExecution: (processId: string) => Promise<void>;
  refresh: () => void;
  budgetCap?: number; // Mocked Total Budget
}

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

export const ConcessionManager: React.FC<ConcessionManagerProps> = ({ 
    processes, 
    onUpdateStatus, 
    onUpdateExecutionNumbers,
    onTramitToSefin,
    onCompleteExecution,
    refresh,
    budgetCap = 500000 
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'DOCS'>('ANALYSIS');

  // Input States for Finance
  const [inputs, setInputs] = useState({
      ne: '',
      dl: '',
      ob: '',
      siafe_nl: '',
      siafe_date: ''
  });

  const [previewDoc, setPreviewDoc] = useState<ProcessDocument | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter processes for Concession only
  const concessionProcesses = useMemo(() => {
    return processes.filter(p => 
      (p.type === ProcessType.CONCESSION || p.type === ProcessType.ACCOUNTABILITY) &&
      (statusFilter === 'ALL' || p.status === statusFilter) &&
      (p.protocolNumber.toLowerCase().includes(filterText.toLowerCase()) || 
       p.interestedParty?.toLowerCase().includes(filterText.toLowerCase()))
    );
  }, [processes, filterText, statusFilter]);

  const selectedProcess = useMemo(() => 
    concessionProcesses.find(p => p.id === selectedId) || concessionProcesses[0] || null
  , [concessionProcesses, selectedId]);

  // Calculate Budget Impact
  const budgetUsed = 320000; 
  const percentUsed = (budgetUsed / budgetCap) * 100;
  const currentImpact = selectedProcess ? selectedProcess.value : 0;
  const percentImpact = (currentImpact / budgetCap) * 100;

  // --- Actions ---


  const handleGenerateDoc = async (type: DocType) => {
      if (!selectedProcess) return;

      // Validation
      if (type === 'NOTA_EMPENHO' && !inputs.ne) { alert('Informe o número da Nota de Empenho.'); return; }
      if (type === 'LIQUIDACAO' && !inputs.dl) { alert('Informe o número do Documento de Liquidação.'); return; }
      if (type === 'ORDEM_BANCARIA' && !inputs.ob) { alert('Informe o número da Ordem Bancária.'); return; }
      if (type === 'PORTARIA_ACCOUNTABILITY' && (!inputs.siafe_nl || !inputs.siafe_date)) { 
          alert('Informe a Nota de Lançamento (NL) e a Data da Baixa no SIAFE.'); return; 
      }

      try {
          // Persistence in DB
          if (type === 'NOTA_EMPENHO') await onUpdateExecutionNumbers(selectedProcess.id, { ne_numero: inputs.ne });
          if (type === 'LIQUIDACAO') await onUpdateExecutionNumbers(selectedProcess.id, { dl_numero: inputs.dl });
          if (type === 'ORDEM_BANCARIA') await onUpdateExecutionNumbers(selectedProcess.id, { ob_numero: inputs.ob });

          const newDoc: ProcessDocument = {
              id: `DOC-${Date.now()}`,
              type,
              title: getDocTitle(type),
              generatedAt: new Date().toISOString(),
              metadata: {
                  neNumber: type === 'NOTA_EMPENHO' ? inputs.ne : undefined,
                  dlNumber: type === 'LIQUIDACAO' ? inputs.dl : undefined,
                  obNumber: type === 'ORDEM_BANCARIA' ? inputs.ob : undefined,
                  siafeNl: type === 'PORTARIA_ACCOUNTABILITY' ? inputs.siafe_nl : undefined,
                  siafeDate: type === 'PORTARIA_ACCOUNTABILITY' ? inputs.siafe_date : undefined,
              }
          };

          // In production, we would also insert this into the 'documentos' table
          // For now, updating numbers is the priority persistence
          setPreviewDoc(newDoc);
          refresh();
      } catch (err) {
          alert('Erro ao persistir documento: ' + (err as Error).message);
      }
  };

  const getDocTitle = (type: DocType) => {
      switch(type) {
          case 'PORTARIA': return 'Portaria de Autorização';
          case 'CERTIDAO_REGULARIDADE': return 'Certidão de Regularidade';
          case 'NOTA_EMPENHO': return 'Nota de Empenho (NE)';
          case 'LIQUIDACAO': return 'Documento de Liquidação (DL)';
          case 'ORDEM_BANCARIA': return 'Ordem Bancária (OB)';
          case 'PORTARIA_ACCOUNTABILITY': return 'Portaria de Regularidade de PC';
          default: return 'Documento';
      }
  };

  const hasDoc = (type: DocType) => selectedProcess?.generatedDocuments?.some(d => d.type === type);

  const handleTramitarSefin = async () => {
      if (!hasDoc('PORTARIA') || !hasDoc('CERTIDAO_REGULARIDADE') || !hasDoc('NOTA_EMPENHO')) {
          alert('Gere a Portaria, a Certidão e a NE antes de tramitar.');
          return;
      }
      
      try {
          await onTramitToSefin(selectedProcess!.id);
          setSuccessMessage(`✅ Processo ${selectedProcess!.protocolNumber} tramitado para SEFIN! O processo agora aguarda assinatura do Ordenador de Despesas.`);
          setTimeout(() => setSuccessMessage(null), 10000);
          refresh();
      } catch (err) {
          alert('Erro ao tramitar para SEFIN: ' + (err as Error).message);
      }
  };

  // Simulates Return from SEFIN
  const handleSimulateSefinReturn = async () => {
      if(confirm('Simular assinatura e retorno da SEFIN?')) {
          const { error } = await supabase.from('solicitacoes').update({ status: ConcessionStatus.FINANCE }).eq('id', selectedProcess!.id);
          if (error) alert('Erro ao simular: ' + error.message);
          else refresh();
      }
  };

  const handleFinalizePayment = async () => {
      if (!hasDoc('LIQUIDACAO') || !hasDoc('ORDEM_BANCARIA')) {
          alert('Gere a DL e a OB para concluir o pagamento.');
          return;
      }
      try {
          await onCompleteExecution(selectedProcess!.id);
          alert('Pagamento Concluído! O processo agora aguarda prestação de contas.');
          refresh();
      } catch (err) {
          alert('Erro ao concluir execução: ' + (err as Error).message);
      }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- Render Helpers ---

  const renderDocPreview = () => {
      if (!previewDoc || !selectedProcess) return null;

      return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-[800px] h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                  <div className="bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18}/> {previewDoc.title}</h3>
                      <button onClick={() => setPreviewDoc(null)}><X size={20} className="text-slate-500 hover:text-red-500"/></button>
                  </div>
                  <div className="flex-1 bg-slate-50 p-8 overflow-y-auto custom-scrollbar">
                      <div className="bg-white shadow-lg p-12 min-h-full text-slate-900 font-sans leading-relaxed relative print:shadow-none">
                          
                          {previewDoc.type === 'PORTARIA' ? (() => {
                              // Helper: valor por extenso
                              const valorPorExtenso = (valor: number): string => {
                                  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
                                  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
                                  const dezenasEspeciais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
                                  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
                                  
                                  const inteiro = Math.floor(valor);
                                  const centavos = Math.round((valor - inteiro) * 100);
                                  
                                  const porExtensoNumero = (n: number): string => {
                                      if (n === 0) return 'zero';
                                      if (n < 10) return unidades[n];
                                      if (n >= 10 && n < 20) return dezenasEspeciais[n - 10];
                                      if (n < 100) return dezenas[Math.floor(n / 10)] + (n % 10 ? ' e ' + unidades[n % 10] : '');
                                      if (n === 100) return 'cem';
                                      if (n < 1000) return centenas[Math.floor(n / 100)] + (n % 100 ? ' e ' + porExtensoNumero(n % 100) : '');
                                      if (n < 1000000) {
                                          const milhares = Math.floor(n / 1000);
                                          const resto = n % 1000;
                                          return (milhares === 1 ? 'mil' : porExtensoNumero(milhares) + ' mil') + (resto ? (resto < 100 ? ' e ' : ' ') + porExtensoNumero(resto) : '');
                                      }
                                      return n.toString();
                                  };
                                  
                                  let resultado = porExtensoNumero(inteiro) + ' reais';
                                  if (centavos > 0) {
                                      resultado += ' e ' + porExtensoNumero(centavos) + ' centavos';
                                  }
                                  return resultado;
                              };

                              // Determinar tipo de suprimento
                              const getTipoSuprimento = () => {
                                  if (selectedProcess.supplyCategory === 'ORDINARY') return 'ORDINÁRIO';
                                  if (selectedProcess.priority === 'CRITICAL') return 'EXTRA-JÚRI'; // Júri tem prioridade crítica
                                  return 'EXTRA-EMERGENCIAL';
                              };

                              const tipoSuprimento = getTipoSuprimento();
                              const isOrdinaryOrJuri = tipoSuprimento === 'ORDINÁRIO' || tipoSuprimento === 'EXTRA-JÚRI';
                              
                              // Dados Bancários mock (em produção viriam da base)
                              const dadosBancariosComarca = { banco: '037 - BANPARÁ', agencia: '0026', conta: '1212-1' };
                              const dadosBancariosSuprido = { banco: '104 - CAIXA ECONÔMICA FEDERAL', agencia: '2350', conta: '00012345-6' };
                              const dadosBancarios = isOrdinaryOrJuri ? dadosBancariosComarca : dadosBancariosSuprido;
                              
                              // Lotação mock (em produção viria do perfil do suprido)
                              const lotacao = selectedProcess.city || 'CMCMR - CENTRAL DE MANDADOS DA COMARCA DE MÃE DO RIO';

                              return (
                              <>
                                  {/* Header Oficial */}
                                  <div className="flex flex-col items-center text-center space-y-1 mb-4">
                                      <img src={BRASAO_TJPA_URL} className="w-20 mb-2" alt="Brasão TJPA" />
                                      <h1 className="font-bold text-sm uppercase text-slate-900">Poder Judiciário</h1>
                                      <h2 className="font-bold text-sm uppercase text-slate-900">Tribunal de Justiça do Estado do Pará</h2>
                                      <h3 className="text-xs text-slate-700 font-medium">Secretaria de Finanças</h3>
                                      <p className="text-[10px] text-slate-500 font-medium">Av. Almirante Barroso, 3089 - CEP 66.613-710 - Fone/Fax (091) 3205-3241</p>
                                  </div>
                                  
                                  {/* Divisória Azul Oficial */}
                                  <div className="w-full h-0.5 bg-[#1e40af] mb-8"></div>

                                  {/* Título da Portaria */}
                                  <div className="text-center mb-10">
                                      <h2 className="text-[#1e40af] font-bold text-lg uppercase tracking-tight">
                                          PORTARIA DE SUPRIMENTO DE FUNDOS Nº {Math.floor(Math.random()*100)}/2026-SEFIN/TJE
                                      </h2>
                                  </div>

                                  <div className="text-center mb-8">
                                      <p className="font-bold text-slate-800">RESOLVE:</p>
                                  </div>

                                  <div className="space-y-6 text-justify text-sm leading-7">
                                      {/* Artigo 1 - Concessão com Tipo de Suprimento */}
                                      <p>
                                          <span className="font-bold text-[#1e40af]">Art. 1º</span> &nbsp;&nbsp;&nbsp;
                                          Conceder suprimento de fundos do tipo <span className="font-bold uppercase bg-yellow-100 px-1">{tipoSuprimento}</span> ao servidor(a):
                                      </p>

                                      {/* Dados do Suprido */}
                                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 space-y-2">
                                          <div className="grid grid-cols-2 gap-4 text-xs">
                                              <div>
                                                  <span className="text-slate-500 font-medium">Nome Completo:</span>
                                                  <p className="font-bold uppercase text-slate-800">{selectedProcess.interestedParty}</p>
                                              </div>
                                              <div>
                                                  <span className="text-slate-500 font-medium">CPF:</span>
                                                  <p className="font-bold text-slate-800">{selectedProcess.providerCpf || '000.000.000-00'}</p>
                                              </div>
                                              <div className="col-span-2">
                                                  <span className="text-slate-500 font-medium">Lotação:</span>
                                                  <p className="font-bold uppercase text-slate-800">{lotacao}</p>
                                              </div>
                                          </div>
                                      </div>

                                      {/* Artigo 2 - Valor Total */}
                                      <p>
                                          <span className="font-bold text-[#1e40af]">Art. 2º</span> &nbsp;&nbsp;&nbsp;
                                          O valor do suprimento de fundos corresponde a:
                                      </p>

                                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 my-4 text-center">
                                          <p className="text-2xl font-black text-emerald-700">{formatMoney(selectedProcess.value)}</p>
                                          <p className="text-xs text-emerald-600 font-medium mt-1 italic">({valorPorExtenso(selectedProcess.value)})</p>
                                      </div>

                                      <p className="text-sm text-slate-600">
                                          O valor deverá atender às despesas miúdas de pronto pagamento, a ser creditado na conta corrente abaixo especificada:
                                      </p>

                                      {/* Dados Bancários Condicionais */}
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                                          <div className="flex items-center gap-2 mb-2">
                                              <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-wider ${isOrdinaryOrJuri ? 'bg-blue-200 text-blue-700' : 'bg-amber-200 text-amber-700'}`}>
                                                  {isOrdinaryOrJuri ? 'Conta da Comarca' : 'Conta do Suprido'}
                                              </span>
                                          </div>
                                          <div className="font-mono text-xs space-y-1 text-slate-700">
                                              <p><span className="text-slate-500">Banco:</span> <strong>{dadosBancarios.banco}</strong></p>
                                              <p><span className="text-slate-500">Agência:</span> <strong>{dadosBancarios.agencia}</strong></p>
                                              <p><span className="text-slate-500">Conta Corrente:</span> <strong>{dadosBancarios.conta}</strong></p>
                                          </div>
                                      </div>

                                      {/* Artigo 3 - Elementos de Despesa */}
                                      <p>
                                          <span className="font-bold text-[#1e40af]">Art. 3º</span> &nbsp;&nbsp;&nbsp;
                                          Os recursos deverão ser aplicados nos seguintes elementos de despesa:
                                      </p>

                                      <div className="border border-slate-200 rounded-lg overflow-hidden my-4">
                                          <table className="w-full text-xs">
                                              <thead className="bg-slate-100">
                                                  <tr>
                                                      <th className="text-left px-4 py-2 font-bold text-slate-600">Elemento</th>
                                                      <th className="text-left px-4 py-2 font-bold text-slate-600">Descrição</th>
                                                      <th className="text-right px-4 py-2 font-bold text-slate-600">Valor</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100">
                                                  {selectedProcess.items && selectedProcess.items.length > 0 ? (
                                                      selectedProcess.items.map((item, idx) => (
                                                          <tr key={idx} className="hover:bg-slate-50">
                                                              <td className="px-4 py-2 font-mono text-slate-700">{item.element}</td>
                                                              <td className="px-4 py-2 text-slate-600">{item.description || 'Despesa Corrente'}</td>
                                                              <td className="px-4 py-2 text-right font-bold text-slate-800">{formatMoney(item.value)}</td>
                                                          </tr>
                                                      ))
                                                  ) : (
                                                      <tr>
                                                          <td className="px-4 py-2 font-mono text-slate-700">3.3.90.30.99</td>
                                                          <td className="px-4 py-2 text-slate-600">Despesas Miúdas de Pronto Pagamento</td>
                                                          <td className="px-4 py-2 text-right font-bold text-slate-800">{formatMoney(selectedProcess.value)}</td>
                                                      </tr>
                                                  )}
                                              </tbody>
                                              <tfoot className="bg-slate-50">
                                                  <tr>
                                                      <td colSpan={2} className="px-4 py-2 text-right font-bold text-slate-600">TOTAL:</td>
                                                      <td className="px-4 py-2 text-right font-black text-slate-900">{formatMoney(selectedProcess.value)}</td>
                                                  </tr>
                                              </tfoot>
                                          </table>
                                      </div>

                                      {/* Artigo 4 - Prazos */}
                                      <p>
                                          <span className="font-bold text-[#1e40af]">Art. 4º</span> &nbsp;&nbsp;&nbsp;
                                          A aplicação e a prestação de contas do valor referido no Art. 2º desta Portaria deverão observar os prazos a seguir:
                                      </p>

                                      <div className="pl-4 space-y-2">
                                          <p>I - Prazo de Aplicação: Data desta Portaria até o encerramento do Evento;</p>
                                          <p>II - Prazo de Prestação de Contas: até 07 (sete) dias, a contar do encerramento do prazo previsto no inciso anterior.</p>
                                      </div>

                                      <p className="mt-8">Registre-se e Cumpra-se.</p>
                                      
                                      <p className="mt-6 font-medium">Belém, {new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                  </div>

                                  {/* Área reservada para assinatura (sem assinatura - será gerada na tramitação) */}
                                  <div className="mt-16 pt-8 border-t border-dashed border-slate-300 text-center">
                                      <div className="inline-block bg-amber-50 border border-amber-200 rounded-lg px-6 py-4">
                                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">⚠️ Documento Minuta</p>
                                          <p className="text-[9px] text-amber-600 mt-1">Assinatura será gerada após tramitação para SEFIN</p>
                                      </div>
                                  </div>
                              </>
                              );
                          })() : (
                              // Fallback para outros documentos (Certidão, NE, etc) mantendo estilo simples
                              <div className="space-y-6">
                                  <div className="text-center mb-8 pb-4 border-b border-slate-200">
                                      <h2 className="font-black text-xl uppercase">{previewDoc.title}</h2>
                                      <p className="text-xs text-slate-500 mt-2">{new Date().toLocaleDateString()}</p>
                                  </div>
                                  
                                  {previewDoc.type === 'CERTIDAO_REGULARIDADE' && (
                                      <div className="space-y-4 text-justify text-sm">
                                          <p>Certificamos, para os devidos fins, que consultando o Sistema de Suprimento de Fundos (SISUP) e o Sistema Integrado de Administração Financeira (SIAFE), <strong>NÃO CONSTAM</strong> pendências em nome do servidor:</p>
                                          <div className="bg-slate-50 p-6 border border-slate-200 rounded-xl my-6">
                                              <p className="mb-2"><strong>Nome:</strong> {selectedProcess.interestedParty}</p>
                                              <p><strong>CPF:</strong> {selectedProcess.providerCpf || '000.000.000-00'}</p>
                                          </div>
                                          <p>O servidor encontra-se APTO a receber novos adiantamentos.</p>
                                      </div>
                                  )}

                                  {previewDoc.type === 'NOTA_EMPENHO' && (
                                      <div className="space-y-4 text-sm">
                                          <div className="border-2 border-slate-800 p-6 rounded-sm">
                                              <div className="grid grid-cols-2 gap-6 text-xs font-mono">
                                                  <div><strong>NÚMERO:</strong> {previewDoc.metadata?.neNumber}</div>
                                                  <div><strong>EMISSÃO:</strong> {new Date().toLocaleDateString()}</div>
                                                  <div className="col-span-2"><strong>FAVORECIDO:</strong> {selectedProcess.interestedParty}</div>
                                                  <div className="col-span-2"><strong>VALOR:</strong> {formatMoney(selectedProcess.value)}</div>
                                                  <div className="col-span-2"><strong>FONTE:</strong> 0101 - TESOURO DO ESTADO</div>
                                              </div>
                                          </div>
                                          <p className="text-justify pt-4">Valor que se empenha para fazer face a despesas com suprimento de fundos, conforme solicitação em anexo.</p>
                                      </div>
                                  )}

                                  {(previewDoc.type === 'LIQUIDACAO' || previewDoc.type === 'ORDEM_BANCARIA') && (
                                      <div className="space-y-4 text-sm">
                                          <div className="bg-slate-100 p-6 rounded border border-slate-300 font-mono text-xs">
                                              <p><strong>REF. NE:</strong> {selectedProcess.neNumber}</p>
                                              <p><strong>DOCUMENTO:</strong> {previewDoc.type === 'LIQUIDACAO' ? previewDoc.metadata?.dlNumber : previewDoc.metadata?.obNumber}</p>
                                              <p><strong>VALOR:</strong> {formatMoney(selectedProcess.value)}</p>
                                          </div>
                                          <p className="text-justify mt-4">
                                              {previewDoc.type === 'LIQUIDACAO' 
                                                ? 'Atesto a regularidade da despesa para fins de liquidação, conforme art. 63 da Lei 4.320/64.' 
                                                : 'Autorizo o pagamento mediante crédito em conta bancária do favorecido.'}
                                          </p>
                                      </div>
                                  )}

                                  {previewDoc.type === 'PORTARIA_ACCOUNTABILITY' && (
                                      <div className="space-y-6 text-justify text-sm leading-7">
                                          <div className="flex flex-col items-center text-center space-y-1 mb-8">
                                              <img src={BRASAO_TJPA_URL} className="w-16 mb-2" alt="Brasão TJPA" />
                                              <h1 className="font-bold text-xs uppercase text-slate-900 underline underline-offset-4">Tribunal de Justiça do Pará</h1>
                                              <h2 className="text-[10px] uppercase text-slate-700">Secretaria de Finanças</h2>
                                          </div>
                                          
                                          <div className="text-center mb-10">
                                              <h2 className="font-black text-lg uppercase tracking-tight text-slate-900 border-y-2 border-slate-900 py-2 inline-block px-12">
                                                  Portaria de Regularidade de PC
                                              </h2>
                                          </div>

                                          <p>
                                              A Secretaria de Finanças do Tribunal de Justiça do Estado do Pará, no uso de suas atribuições legais, e considerando a análise técnica realizada pela equipe de Auditoria do SOSFU,
                                          </p>
                                          
                                          <p className="font-bold text-slate-800">RESOLVE:</p>
                                          
                                          <p>
                                              <span className="font-bold">Art. 1º</span> - Declarar <span className="font-black text-emerald-600 bg-emerald-50 px-1">REGULAR</span> a prestação de contas do suprimento de fundos concedido ao servidor(a) <strong className="uppercase">{selectedProcess.interestedParty}</strong>, referente ao protocolo <strong className="font-mono">{selectedProcess.protocolNumber}</strong>.
                                          </p>
                                          
                                          <p>
                                              <span className="font-bold">Art. 2º</span> - Informar que a baixa da responsabilidade do servidor foi devidamente efetuada no Sistema de Administração Financeira (SIAFE), sob a Nota de Lançamento (NL) <strong>{previewDoc.metadata?.siafeNl}</strong> em <strong>{previewDoc.metadata?.siafeDate}</strong>.
                                          </p>
                                          
                                          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center">
                                              <p className="font-medium text-slate-800">Belém, {new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                              <div className="mt-8 text-center opacity-40">
                                                  <p className="text-[10px] font-bold uppercase tracking-widest">Assinado Eletronicamente</p>
                                                  <p className="text-[9px]">Ordenador de Despesa / Coordenador SOSFU</p>
                                              </div>
                                          </div>
                                      </div>
                                  )}
                                  
                                  <div className="absolute bottom-12 left-12 right-12 text-center border-t border-slate-300 pt-4">
                                      <p className="font-bold text-xs uppercase">Assinado Eletronicamente</p>
                                      <p className="text-[10px] text-slate-400">Sistema SOSFU - TJPA</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  // Logic to check if ready to tramit - docs must be generated
  const isReadyToTramit = hasDoc('PORTARIA') && hasDoc('CERTIDAO_REGULARIDADE') && hasDoc('NOTA_EMPENHO');
  // Editable if not already sent for signature, in finance phase, or already granted
  const isEditableStatus = selectedProcess?.status !== ConcessionStatus.AWAITING_SIGNATURE && 
                           selectedProcess?.status !== ConcessionStatus.FINANCE && 
                           selectedProcess?.status !== ConcessionStatus.COMPLETE;

  return (
    <div className="h-full flex flex-col bg-slate-50/50 overflow-hidden animate-in fade-in">
        {renderDocPreview()}
        
        {/* Success Banner - shows after tramitation */}
        {successMessage && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
                <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-2xl">
                    <div className="p-2 bg-white/20 rounded-xl">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm">{successMessage}</p>
                        <p className="text-xs text-emerald-100 mt-1">Acesse o módulo SEFIN para visualizar na caixa de assinaturas.</p>
                    </div>
                    <button 
                        onClick={() => setSuccessMessage(null)} 
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        )}
        
        {/* Top KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6 px-6 pt-2">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={20}/></div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Solicitações</p>
                    <p className="text-2xl font-black text-slate-800">{concessionProcesses.length}</p>
                </div>
            </div>
            {/* ... Other KPIs same as before ... */}
            <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-lg flex items-center gap-4 col-span-2">
                <div className="p-3 bg-white/10 rounded-xl"><TrendingUp size={20}/></div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Orçamentário</p>
                    <p className="text-2xl font-black text-emerald-400">{formatMoney(budgetCap - budgetUsed)}</p>
                </div>
            </div>
        </div>

        {/* Main Workstation */}
        <div className="flex-1 flex overflow-hidden px-6 pb-6 gap-6">
            
            {/* Left: Process List */}
            <div className="w-1/3 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Filtrar processos..."
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                        />
                    </div>
                    <select 
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as ConcessionStatus | 'ALL')}
                    >
                        <option value="ALL">Todos os Status</option>
                        <option value={ConcessionStatus.TRIAGE}>Triagem</option>
                        <option value={ConcessionStatus.ANALYSIS}>Análise Técnica</option>
                        <option value={ConcessionStatus.AWAITING_SIGNATURE}>Assinaturas</option>
                        <option value={ConcessionStatus.FINANCE}>Financeiro</option>
                        <option value={ConcessionStatus.COMPLETE}>Concedido</option>
                    </select>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {concessionProcesses.map(p => (
                        <div 
                            key={p.id}
                            onClick={() => { setSelectedId(p.id); setInputs({ ne: p.neNumber || '', dl: p.dlNumber || '', ob: p.obNumber || '' }); }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md group ${
                                selectedProcess?.id === p.id 
                                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                : 'bg-white border-slate-100 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                    p.supplyCategory === 'EXTRAORDINARY' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {p.supplyCategory === 'EXTRAORDINARY' ? 'Extra' : 'Ordinário'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-1">{p.interestedParty}</h4>
                            <p className="text-xs text-slate-500 font-mono mb-2">{p.protocolNumber}</p>
                            <div className="flex justify-between items-end border-t border-slate-200/50 pt-2 mt-2">
                                <span className={`text-[10px] font-bold uppercase ${
                                    p.priority === 'CRITICAL' ? 'text-red-500 flex items-center gap-1' : 'text-slate-400'
                                }`}>
                                    {p.status}
                                </span>
                                <span className="text-sm font-black text-slate-700">{formatMoney(p.value)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Action Panel */}
            {selectedProcess ? (
                <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-slate-800">{selectedProcess.protocolNumber}</h2>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    selectedProcess.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                    {selectedProcess.priority === 'CRITICAL' ? 'Alta Prioridade' : 'Normal'}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-slate-500 mt-1">{selectedProcess.interestedParty}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setActiveTab('ANALYSIS')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'ANALYSIS' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>Análise</button>
                            <button onClick={() => setActiveTab('DOCS')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'DOCS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500'}`}>Documentos & Execução</button>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                        
                        {activeTab === 'ANALYSIS' && (
                            <div className="space-y-6">
                                {/* Budget Checker Visualization */}
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-black text-slate-700 uppercase flex items-center gap-2">
                                            <Building2 size={16} className="text-blue-500"/> Pré-Análise Orçamentária
                                        </h3>
                                        <span className="text-xs font-bold text-slate-500">Unidade: {selectedProcess.unitCategory === 'JURISDICTIONAL' ? 'Comarca' : 'Adm'}</span>
                                    </div>
                                    
                                    <div className="relative h-8 bg-slate-200 rounded-full overflow-hidden flex mb-2">
                                        <div className="h-full bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${percentUsed}%` }}>Exec</div>
                                        <div className="h-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white animate-pulse" style={{ width: `${percentImpact}%` }}>Este</div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14}/> Detalhes da Solicitação
                                    </h3>
                                    <div className="p-6 bg-white border border-slate-200 rounded-2xl text-sm text-slate-600 leading-relaxed shadow-sm">
                                        {selectedProcess.purpose || 'Descrição não informada pelo solicitante.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'DOCS' && (
                            <div className="space-y-8">
                                {/* Tree View of Documents */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase size={14}/> Árvore do Processo (Dossiê)</h3>
                                    <div className="space-y-2">
                                        {selectedProcess.generatedDocuments?.length ? (
                                            selectedProcess.generatedDocuments.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={16}/></div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700">{doc.title}</p>
                                                            <p className="text-[10px] text-slate-400">{new Date(doc.generatedAt).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {doc.metadata?.neNumber && <span className="text-[9px] font-mono bg-slate-100 px-2 py-1 rounded">NE: {doc.metadata.neNumber}</span>}
                                                        {doc.metadata?.dlNumber && <span className="text-[9px] font-mono bg-slate-100 px-2 py-1 rounded">DL: {doc.metadata.dlNumber}</span>}
                                                        <button onClick={() => setPreviewDoc(doc)} className="p-2 hover:bg-slate-50 rounded text-slate-400 hover:text-blue-600"><Eye size={16}/></button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : <p className="text-xs text-slate-400 italic pl-2">Nenhum documento gerado.</p>}
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 my-4"></div>

                                {selectedProcess.type === ProcessType.ACCOUNTABILITY ? (
                                    <div className="animate-in slide-in-from-bottom-4">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">A</div>
                                            Finalização de Prestação de Contas
                                        </h4>
                                        <div className="space-y-4">
                                            {/* SIAFE NL Input */}
                                            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nota de Lançamento (NL) - SIAFE</label>
                                                        <div className="relative">
                                                            <Key size={14} className="absolute left-3 top-3 text-slate-400"/>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Ex: 2026NL000999" 
                                                                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                                value={inputs.siafe_nl}
                                                                onChange={e => setInputs({...inputs, siafe_nl: e.target.value})}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data da Baixa no Sistema</label>
                                                        <div className="relative">
                                                            <CalendarDays size={14} className="absolute left-3 top-3 text-slate-400"/>
                                                            <input 
                                                                type="date" 
                                                                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                                value={inputs.siafe_date}
                                                                onChange={e => setInputs({...inputs, siafe_date: e.target.value})}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleGenerateDoc('PORTARIA_ACCOUNTABILITY')}
                                                    disabled={!inputs.siafe_nl || !inputs.siafe_date || hasDoc('PORTARIA_ACCOUNTABILITY')}
                                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <FileCheck size={18}/>
                                                    {hasDoc('PORTARIA_ACCOUNTABILITY') ? 'Portaria de Regularidade Gerada' : 'Gerar Portaria de Regularidade'}
                                                </button>
                                            </div>
                                            
                                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                                                    <Zap size={16}/>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-blue-900">Análise Sentinela Concluída</p>
                                                    <p className="text-[10px] text-blue-700 mt-1 uppercase font-black tracking-tight">Status: REGULAR COM RESSALVA (AUTO)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</div>
                                            Instrução Processual
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Certidão */}
                                            <div className="p-4 rounded-2xl border border-slate-200 flex flex-col justify-between h-32 bg-white">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-bold text-slate-600">1. Certidão de Regularidade</span>
                                                    {hasDoc('CERTIDAO_REGULARIDADE') && <CheckCircle2 size={16} className="text-emerald-500"/>}
                                                </div>
                                                <button 
                                                    onClick={() => handleGenerateDoc('CERTIDAO_REGULARIDADE')}
                                                    disabled={hasDoc('CERTIDAO_REGULARIDADE')}
                                                    className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
                                                >
                                                    {hasDoc('CERTIDAO_REGULARIDADE') ? 'Gerado' : 'Gerar Certidão'}
                                                </button>
                                            </div>

                                            {/* Portaria */}
                                            <div className="p-4 rounded-2xl border border-slate-200 flex flex-col justify-between h-32 bg-white">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-bold text-slate-600">2. Portaria SF</span>
                                                    {hasDoc('PORTARIA') && <CheckCircle2 size={16} className="text-emerald-500"/>}
                                                </div>
                                                <button 
                                                    onClick={() => handleGenerateDoc('PORTARIA')}
                                                    disabled={hasDoc('PORTARIA')}
                                                    className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
                                                >
                                                    {hasDoc('PORTARIA') ? 'Gerado' : 'Minutar Portaria'}
                                                </button>
                                            </div>

                                            {/* Nota de Empenho - Requires Input */}
                                            <div className="col-span-2 p-4 rounded-2xl border border-blue-100 bg-blue-50/50 flex items-center gap-4">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">3. Número da NE (SIAFE)</label>
                                                    <div className="relative">
                                                        <Key size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Ex: 2026NE000123" 
                                                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={inputs.ne}
                                                            onChange={e => setInputs({...inputs, ne: e.target.value})}
                                                            disabled={hasDoc('NOTA_EMPENHO')}
                                                        />
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleGenerateDoc('NOTA_EMPENHO')}
                                                    disabled={!inputs.ne || hasDoc('NOTA_EMPENHO')}
                                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                                >
                                                    {hasDoc('NOTA_EMPENHO') ? 'Emitida' : 'Emitir NE'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Send to SEFIN Action */}
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                onClick={handleTramitarSefin}
                                                disabled={!isReadyToTramit || !isEditableStatus}
                                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all ${
                                                    !isReadyToTramit || !isEditableStatus
                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                                }`}
                                                title={!isReadyToTramit ? "Gere os 3 documentos obrigatórios acima para habilitar." : "Enviar para SEFIN"}
                                                >
                                                    <Send size={16}/> Tramitar para SEFIN (Assinatura Lote)
                                                </button>
                                        </div>
                                    </>
                                )}

                                {/* Wait State for SEFIN */}
                                {selectedProcess.status === ConcessionStatus.AWAITING_SIGNATURE && (
                                    <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-center justify-between animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <Lock size={20} className="text-amber-600"/>
                                            <div>
                                                <h4 className="text-sm font-black text-amber-800 uppercase">Aguardando Assinatura</h4>
                                                <p className="text-xs text-amber-700">Processo em posse do Ordenador de Despesa (SEFIN).</p>
                                            </div>
                                        </div>
                                        {/* Dev Button to Force Return */}
                                        <button onClick={handleSimulateSefinReturn} className="text-[10px] underline text-amber-600 hover:text-amber-800 font-bold">
                                            [DEV: Simular Retorno]
                                        </button>
                                    </div>
                                )}

                                {/* Workflow Phase 2: Payment Execution */}
                                {selectedProcess.status === ConcessionStatus.FINANCE && (
                                    <div className="animate-in slide-in-from-bottom-4">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2 mt-8 border-t border-slate-200 pt-8">
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">2</div>
                                            Execução Financeira (Pagamento)
                                        </h4>
                                        <div className="space-y-4">
                                            {/* DL Input */}
                                            <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-4">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">4. Documento de Liquidação (DL)</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Ex: 2026NL000055" 
                                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        value={inputs.dl}
                                                        onChange={e => setInputs({...inputs, dl: e.target.value})}
                                                        disabled={hasDoc('LIQUIDACAO')}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => handleGenerateDoc('LIQUIDACAO')}
                                                    disabled={!inputs.dl || hasDoc('LIQUIDACAO')}
                                                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 mt-4"
                                                >
                                                    Emitir DL
                                                </button>
                                            </div>

                                            {/* OB Input */}
                                            <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-4">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">5. Ordem Bancária (OB)</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Ex: 2026OB000089" 
                                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        value={inputs.ob}
                                                        onChange={e => setInputs({...inputs, ob: e.target.value})}
                                                        disabled={hasDoc('ORDEM_BANCARIA')}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => handleGenerateDoc('ORDEM_BANCARIA')}
                                                    disabled={!inputs.ob || hasDoc('ORDEM_BANCARIA')}
                                                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 mt-4"
                                                >
                                                    Emitir OB
                                                </button>
                                            </div>

                                            {/* Finalize */}
                                            <button 
                                                onClick={handleFinalizePayment}
                                                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black shadow-xl transition-all flex items-center justify-center gap-2 mt-6"
                                            >
                                                <CreditCard size={18}/> Concluir Pagamento
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-300">
                    <FileText size={64} strokeWidth={1} />
                    <p className="mt-4 font-bold text-sm uppercase tracking-widest">Selecione um processo para análise</p>
                </div>
            )}
        </div>
    </div>
  );
};

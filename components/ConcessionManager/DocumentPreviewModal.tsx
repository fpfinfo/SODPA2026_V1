import React from 'react';
import { FileText, X } from 'lucide-react';
import { Process, ProcessDocument } from '../../types';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

interface DocumentPreviewModalProps {
  doc: ProcessDocument;
  process: Process;
  onClose: () => void;
  formatMoney: (val: number) => string;
}

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

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  doc,
  process,
  onClose,
  formatMoney
}) => {
  // Determinar tipo de suprimento
  const getTipoSuprimento = () => {
    if (process.supplyCategory === 'ORDINARY') return 'ORDINÁRIO';
    if (process.priority === 'CRITICAL') return 'EXTRA-JÚRI';
    return 'EXTRA-EMERGENCIAL';
  };

  const tipoSuprimento = getTipoSuprimento();
  const isOrdinaryOrJuri = tipoSuprimento === 'ORDINÁRIO' || tipoSuprimento === 'EXTRA-JÚRI';
  
  // Dados Bancários mock
  const dadosBancariosComarca = { banco: '037 - BANPARÁ', agencia: '0026', conta: '1212-1' };
  const dadosBancariosSuprido = { banco: '104 - CAIXA ECONÔMICA FEDERAL', agencia: '2350', conta: '00012345-6' };
  const dadosBancarios = isOrdinaryOrJuri ? dadosBancariosComarca : dadosBancariosSuprido;
  
  const lotacao = process.city || 'CMCMR - CENTRAL DE MANDADOS DA COMARCA DE MÃE DO RIO';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-[800px] h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18}/> {doc.title}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-500 hover:text-red-500"/></button>
        </div>
        <div className="flex-1 bg-slate-50 p-8 overflow-y-auto custom-scrollbar">
          <div className="bg-white shadow-lg p-12 min-h-full text-slate-900 font-sans leading-relaxed relative print:shadow-none">
            
            {doc.type === 'PORTARIA' && (
              <>
                {/* Header Oficial */}
                <div className="flex flex-col items-center text-center space-y-1 mb-4">
                  <img src={BRASAO_TJPA_URL} className="w-20 mb-2" alt="Brasão TJPA" />
                  <h1 className="font-bold text-sm uppercase text-slate-900">Poder Judiciário</h1>
                  <h2 className="font-bold text-sm uppercase text-slate-900">Tribunal de Justiça do Estado do Pará</h2>
                  <h3 className="text-xs text-slate-700 font-medium">Secretaria de Finanças</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Av. Almirante Barroso, 3089 - CEP 66.613-710 - Fone/Fax (091) 3205-3241</p>
                </div>
                
                <div className="w-full h-0.5 bg-[#1e40af] mb-8"></div>

                <div className="text-center mb-10">
                  <h2 className="text-[#1e40af] font-bold text-lg uppercase tracking-tight">
                    PORTARIA DE SUPRIMENTO DE FUNDOS Nº {Math.floor(Math.random()*100)}/2026-SEFIN/TJE
                  </h2>
                </div>

                <div className="text-center mb-8">
                  <p className="font-bold text-slate-800">RESOLVE:</p>
                </div>

                <div className="space-y-6 text-justify text-sm leading-7">
                  <p>
                    <span className="font-bold text-[#1e40af]">Art. 1º</span> &nbsp;&nbsp;&nbsp;
                    AUTORIZAR a concessão de suprimento de fundos do tipo <span className="font-bold uppercase bg-yellow-100 px-1">{tipoSuprimento}</span> ao servidor(a) <span className="font-bold uppercase">{process.interestedParty}</span>, portador do CPF <span className="font-bold">{process.providerCpf || '000.000.000-00'}</span>, lotado na <span className="font-bold uppercase">{lotacao}</span>, a ser executado conforme especificações desta Portaria.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Nome Completo:</span>
                        <p className="font-bold uppercase text-slate-800">{process.interestedParty}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">CPF:</span>
                        <p className="font-bold text-slate-800">{process.providerCpf || '000.000.000-00'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 font-medium">Lotação:</span>
                        <p className="font-bold uppercase text-slate-800">{lotacao}</p>
                      </div>
                    </div>
                  </div>

                  <p>
                    <span className="font-bold text-[#1e40af]">Art. 2º</span> &nbsp;&nbsp;&nbsp;
                    O valor do suprimento de fundos corresponde a:
                  </p>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 my-4 text-center">
                    <p className="text-2xl font-black text-emerald-700">{formatMoney(process.value)}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1 italic">({valorPorExtenso(process.value)})</p>
                  </div>

                  <p className="text-sm text-slate-600">
                    O valor deverá atender às despesas miúdas de pronto pagamento, a ser creditado na conta corrente abaixo especificada:
                  </p>

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
                        {process.items && process.items.length > 0 ? (
                          process.items.map((item, idx) => (
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
                            <td className="px-4 py-2 text-right font-bold text-slate-800">{formatMoney(process.value)}</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td colSpan={2} className="px-4 py-2 text-right font-bold text-slate-600">TOTAL:</td>
                          <td className="px-4 py-2 text-right font-black text-slate-900">{formatMoney(process.value)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

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

                <div className="mt-16 pt-8 border-t border-dashed border-slate-300 text-center">
                  <div className="inline-block bg-amber-50 border border-amber-200 rounded-lg px-6 py-4">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">⚠️ Documento Minuta</p>
                    <p className="text-[9px] text-amber-600 mt-1">Assinatura será gerada após tramitação para SEFIN</p>
                  </div>
                </div>
              </>
            )}

            {doc.type !== 'PORTARIA' && (
              <div className="space-y-6">
                <div className="text-center mb-8 pb-4 border-b border-slate-200">
                  <h2 className="font-black text-xl uppercase">{doc.title}</h2>
                  <p className="text-xs text-slate-500 mt-2">{new Date().toLocaleDateString()}</p>
                </div>
                
                {doc.type === 'CERTIDAO_REGULARIDADE' && (
                  <div className="space-y-4 text-justify text-sm">
                    <p>Certificamos, para os devidos fins, que consultando o Sistema de Suprimento de Fundos (SISUP) e o Sistema Integrado de Administração Financeira (SIAFE), <strong>NÃO CONSTAM</strong> pendências em nome do servidor:</p>
                    <div className="bg-slate-50 p-6 border border-slate-200 rounded-xl my-6">
                      <p className="mb-2"><strong>Nome:</strong> {process.interestedParty}</p>
                      <p><strong>CPF:</strong> {process.providerCpf || '000.000.000-00'}</p>
                    </div>
                    <p>O servidor encontra-se APTO a receber novos adiantamentos.</p>
                  </div>
                )}

                {doc.type === 'NOTA_EMPENHO' && (
                  <div className="space-y-4 text-sm">
                    <div className="border-2 border-slate-800 p-6 rounded-sm">
                      <div className="grid grid-cols-2 gap-6 text-xs font-mono">
                        <div><strong>NÚMERO:</strong> {doc.metadata?.neNumber}</div>
                        <div><strong>EMISSÃO:</strong> {new Date().toLocaleDateString()}</div>
                        <div className="col-span-2"><strong>FAVORECIDO:</strong> {process.interestedParty}</div>
                        <div className="col-span-2"><strong>VALOR:</strong> {formatMoney(process.value)}</div>
                        <div className="col-span-2"><strong>FONTE:</strong> 0101 - TESOURO DO ESTADO</div>
                      </div>
                    </div>
                    <p className="text-justify pt-4">Valor que se empenha para fazer face a despesas com suprimento de fundos, conforme solicitação em anexo.</p>
                  </div>
                )}

                {(doc.type === 'LIQUIDACAO' || doc.type === 'ORDEM_BANCARIA') && (
                  <div className="space-y-4 text-sm">
                    <div className="bg-slate-100 p-6 rounded border border-slate-300 font-mono text-xs">
                      <p><strong>REF. NE:</strong> {process.neNumber}</p>
                      <p><strong>DOCUMENTO:</strong> {doc.type === 'LIQUIDACAO' ? doc.metadata?.dlNumber : doc.metadata?.obNumber}</p>
                      <p><strong>VALOR:</strong> {formatMoney(process.value)}</p>
                    </div>
                    <p className="text-justify mt-4">
                      {doc.type === 'LIQUIDACAO' 
                        ? 'Atesto a regularidade da despesa para fins de liquidação, conforme art. 63 da Lei 4.320/64.' 
                        : 'Autorizo o pagamento mediante crédito em conta bancária do favorecido.'}
                    </p>
                  </div>
                )}

                {doc.type === 'PORTARIA_ACCOUNTABILITY' && (
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
                      <span className="font-bold">Art. 1º</span> - Declarar <span className="font-black text-emerald-600 bg-emerald-50 px-1">REGULAR</span> a prestação de contas do suprimento de fundos concedido ao servidor(a) <strong className="uppercase">{process.interestedParty}</strong>, referente ao protocolo <strong className="font-mono">{process.protocolNumber}</strong>.
                    </p>
                    
                    <p>
                      <span className="font-bold">Art. 2º</span> - Informar que a baixa da responsabilidade do servidor foi devidamente efetuada no Sistema de Administração Financeira (SIAFE), sob a Nota de Lançamento (NL) <strong>{doc.metadata?.siafeNl}</strong> em <strong>{doc.metadata?.siafeDate}</strong>.
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

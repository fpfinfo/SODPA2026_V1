import React from 'react';

interface JuriException {
  tipo: 'POLICIAIS' | 'ALMOCO' | 'JANTAR' | 'LANCHE' | 'PRAZO' | 'PC_FORA_PRAZO';
  solicitado: number;
  limite: number;
  excedente: number;
}

interface StaticAutorizacaoOrdenadorProps {
  processData: any;
  documentData?: any;
  exceptions?: JuriException[];
}

/**
 * StaticAutorizacaoOrdenador - Documento de Autorização de Despesa Excepcional
 * Emitido pelo Ordenador de Despesas (SEFIN) para autorizar valores acima dos limites em sessões de júri
 */
export const StaticAutorizacaoOrdenador: React.FC<StaticAutorizacaoOrdenadorProps> = ({ 
  processData, 
  documentData,
  exceptions = []
}) => {
  const formatDate = (date?: string) => {
    if (!date) return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  };

  const formatExceptionType = (tipo: JuriException['tipo']) => {
    switch (tipo) {
      case 'POLICIAIS': return 'Quantidade de Policiais Militares';
      case 'ALMOCO': return 'Valor Unitário de Almoço';
      case 'JANTAR': return 'Valor Unitário de Jantar';
      case 'LANCHE': return 'Valor Unitário de Lanche';
      case 'PRAZO': return 'Prazo de Antecedência';
      case 'PC_FORA_PRAZO': return 'Prestação de Contas Atrasada';
      default: return tipo;
    }
  };

  const formatExceptionValue = (tipo: JuriException['tipo'], value: number) => {
    if (tipo === 'POLICIAIS') return `${value} pessoas`;
    if (tipo === 'PRAZO' || tipo === 'PC_FORA_PRAZO') return `${value} dia${value !== 1 ? 's' : ''}`;
    return formatCurrency(value);
  };

  const supridoNome = processData.suprido_nome || processData.interested || 'Servidor Suprido';
  const unidade = processData.unidade || processData.lotacao || processData.unit || 'Unidade Judiciária';
  const nup = processData.nup || 'N/A';
  const valor = processData.valor_total || processData.value || processData.val || 0;
  const numeroAutorizacao = documentData?.metadata?.numero_autorizacao || String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  const anoAutorizacao = new Date(documentData?.created_at || Date.now()).getFullYear();
  const dataAssinatura = formatDate(documentData?.created_at);

  // Signer info from profiles join or metadata
  const signerName = documentData?.profiles?.nome || documentData?.metadata?.signed_by_name || 'Ordenador de Despesas';
  const signerRole = documentData?.profiles?.cargo || documentData?.metadata?.signer_role || 'Secretário de Finanças';

  // Get exceptions from documentData if not passed directly
  const displayExceptions = exceptions.length > 0 
    ? exceptions 
    : (documentData?.metadata?.exceptions || []);

  return (
    <div className="space-y-8 font-serif text-slate-900 text-sm leading-relaxed">
      {/* Document Title and Number */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wide mb-2">
          Autorização de Despesa Excepcional
        </h3>
        <p className="text-sm text-slate-500">
          Nº {anoAutorizacao}/{numeroAutorizacao}
        </p>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
          Sessão de Tribunal do Júri
        </p>
      </div>

      {/* Body */}
      <div className="space-y-6 text-justify">
        <p className="leading-loose">
          <strong>O ORDENADOR DE DESPESAS DO TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</strong>, no uso de suas 
          atribuições legais conferidas pelo Regimento Interno, e considerando a manifestação técnica da 
          <strong> Assessoria Jurídica da SEFIN (AJSEFIN)</strong>,
        </p>

        <p className="leading-loose">
          <strong>CONSIDERANDO</strong> a necessidade de realização de sessão de Tribunal do Júri, atividade 
          essencial da prestação jurisdicional que demanda estrutura especial de apoio e segurança;
        </p>

        <p className="leading-loose">
          <strong>CONSIDERANDO</strong> a justificativa apresentada pelo Gestor da unidade requisitante, que 
          demonstra a imprescindibilidade dos valores excedentes para o adequado funcionamento da sessão;
        </p>

        <p className="leading-loose">
          <strong>CONSIDERANDO</strong> que os limites regulamentares estabelecidos pela Resolução CNJ nº 169/2013 
          podem ser excepcionados quando devidamente justificados e autorizados pelo Ordenador de Despesas;
        </p>

        {/* Exceptions Table */}
        {displayExceptions.length > 0 && (
          <div className="my-8">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
              Exceções Autorizadas
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Limite Regulamentar</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Valor Autorizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayExceptions.map((exc: JuriException, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatExceptionType(exc.tipo)}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {formatExceptionValue(exc.tipo, exc.limite)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">
                        {formatExceptionValue(exc.tipo, exc.solicitado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Process Reference */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Processo</p>
              <p className="font-bold text-slate-800">{nup}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Servidor Suprido</p>
              <p className="font-bold text-slate-800">{supridoNome}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade</p>
              <p className="font-bold text-slate-800">{unidade}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor Total</p>
              <p className="font-bold text-slate-800">{formatCurrency(valor)}</p>
            </div>
          </div>
        </div>

        <p className="leading-loose font-bold text-slate-800">
          <strong>RESOLVE:</strong>
        </p>

        <p className="leading-loose">
          <strong>Art. 1º</strong> AUTORIZAR, em caráter excepcional, os valores acima dos limites regulamentares 
          para a solicitação de suprimento de fundos referente à sessão de Tribunal do Júri descrita no processo 
          epigrafado, conforme tabela de exceções constante deste documento.
        </p>

        <p className="leading-loose">
          <strong>Art. 2º</strong> A presente autorização não dispensa a regular prestação de contas pelo servidor 
          suprido, que deverá comprovar a aplicação dos recursos conforme os normativos vigentes.
        </p>

        <p className="leading-loose">
          <strong>Art. 3º</strong> O Serviço de Suprimento de Fundos (SOSFU) fica autorizado a prosseguir com a 
          concessão do numerário, observados os demais requisitos regulamentares.
        </p>

        <p className="leading-loose pt-4">
          Encaminhe-se ao <strong>Serviço de Suprimento de Fundos (SOSFU)</strong> para execução.
        </p>

        {/* Location and date */}
        <div className="mt-12 text-center">
          <p>Belém-PA, {dataAssinatura}.</p>
        </div>

        {/* Signature placeholder (shown only if NOT YET SIGNED) */}
        {documentData?.status !== 'ASSINADO' && (
          <div className="mt-16 text-center space-y-4">
            <div className="pt-4 border-t border-dashed border-slate-400 max-w-md mx-auto inline-block px-12">
              <p className="text-sm text-slate-400 font-medium italic">Assinatura Digital do Ordenador de Despesas</p>
            </div>
          </div>
        )}

        {/* Electronic Signature Block (shown only when SIGNED) */}
        {documentData?.status === 'ASSINADO' && (
          <div className="mt-16 pt-8 border-t-2 border-slate-200 break-inside-avoid">
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
              <h5 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ASSINATURA ELETRÔNICA CERTIFICADA
              </h5>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                  OK
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-base font-bold text-emerald-900 uppercase">
                    {signerName}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Secretaria de Planejamento, Coordenação e Finanças
                  </p>
                  <div className="mt-3 text-[11px] font-medium text-emerald-800 space-y-1">
                    <p>
                      <strong>Data:</strong> {dataAssinatura}
                    </p>
                    <p>
                      <strong>Hash de Verificação:</strong> {documentData?.id?.substring(0, 16)?.toUpperCase() || 'N/A'}...
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-emerald-600 mt-4 leading-relaxed border-t border-emerald-200 pt-3">
                A autenticidade deste documento pode ser conferida no sistema SISUP através do ID {documentData?.id || 'N/A'}. 
                Assinado eletronicamente conforme MP 2.200-2/2001.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-12 mt-auto border-t border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest">
          Documento gerado pelo Sistema SISUP - TJPA <br />
          Autorização de Despesa Excepcional • ID: {documentData?.id || 'PREVIEW'} • NUP: {nup}
        </div>
      </div>
    </div>
  );
};

export default StaticAutorizacaoOrdenador;

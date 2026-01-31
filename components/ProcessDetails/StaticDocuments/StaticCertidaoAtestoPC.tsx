import React from 'react';

interface PrestacaoContasData {
  id: string;
  status: string;
  total_gasto?: number;
  total_inss_retido?: number;
  total_iss_retido?: number;
  saldo_devolvido?: number;
  comprovantes_count?: number;
  gdr_inss_numero?: string;
  gdr_saldo_numero?: string;
  submitted_at?: string;
}

interface StaticCertidaoAtestoPCProps {
  processData: any;
  prestacaoData?: PrestacaoContasData;
  documentData?: any;
  comprovantes?: any[];
}

/**
 * StaticCertidaoAtestoPC - Certidão de Atesto específica para Prestação de Contas
 * Emitida pelo Gestor após revisar e aprovar os gastos do Suprido
 */
export const StaticCertidaoAtestoPC: React.FC<StaticCertidaoAtestoPCProps> = ({ 
  processData, 
  prestacaoData,
  documentData,
  comprovantes = []
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

  // Process data
  const supridoNome = processData.suprido_nome || processData.interested || 'Servidor Suprido';
  const supridoCpf = processData.suprido_cpf || processData.servidor_dados?.cpf || '***.***.***-**';
  const unidade = processData.unidade || processData.lotacao || processData.unit || 'Unidade Judiciária';
  const nup = processData.nup || 'N/A';
  const valorConcedido = processData.valor_total || processData.value || 0;
  
  // Prestação de Contas data
  const totalGasto = prestacaoData?.total_gasto || comprovantes.reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalINSS = prestacaoData?.total_inss_retido || 0;
  const totalISS = prestacaoData?.total_iss_retido || 0;
  const saldoDevolvido = prestacaoData?.saldo_devolvido || Math.max(0, valorConcedido - totalGasto);
  const quantidadeComprovantes = prestacaoData?.comprovantes_count || comprovantes.length;
  
  // Document data
  const numeroCertidao = documentData?.metadata?.numero_certidao || String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  const anoCertidao = new Date(documentData?.created_at || Date.now()).getFullYear();
  const dataAssinatura = formatDate(documentData?.created_at);
  
  // Signer info
  const signerName = documentData?.profiles?.nome || documentData?.metadata?.signed_by_name || 'Gestor Responsável';
  const signerRole = documentData?.profiles?.cargo || documentData?.metadata?.signer_role || 'Chefia Imediata';

  return (
    <div className="space-y-8 font-serif text-slate-900 text-sm leading-relaxed">
      {/* Certidão Title */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wide mb-2">
          Certidão de Análise e Aprovação da Prestação de Contas
        </h3>
        <p className="text-sm text-slate-500">
          Nº {anoCertidao}/PC-{numeroCertidao}
        </p>
      </div>

      {/* Body */}
      <div className="space-y-6 text-justify">
        <p className="leading-loose">
          <strong>CERTIFICO</strong>, para os devidos fins de regularidade fiscal e administrativa, que procedi à análise minuciosa 
          da documentação comprobatória apresentada na <strong>Prestação de Contas</strong> do servidor <strong>{supridoNome}</strong> (CPF: {supridoCpf}), 
          relativa à aplicação dos recursos concedidos nos autos do processo <strong>{nup}</strong>.
        </p>

        {/* Resumo Financeiro */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 my-6 space-y-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
            Resumo da Execução Financeira
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">Valor Concedido</p>
              <p className="font-bold text-slate-800">{formatCurrency(valorConcedido)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Gasto (Comprovado)</p>
              <p className="font-bold text-blue-700">{formatCurrency(totalGasto)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm pt-3 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-500 mb-1">INSS Retido</p>
              <p className="font-bold text-purple-700">{formatCurrency(totalINSS)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">ISS Retido</p>
              <p className="font-bold text-purple-700">{formatCurrency(totalISS)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Saldo Devolvido</p>
              <p className="font-bold text-emerald-700">{formatCurrency(saldoDevolvido)}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 text-sm">
            <p className="text-xs text-slate-500 mb-1">Comprovantes Anexados</p>
            <p className="font-bold text-slate-800">{quantidadeComprovantes} documento(s) fiscal(is)</p>
          </div>
        </div>

        <p className="leading-loose">
          <strong>DECLARO</strong> a idoneidade dos documentos fiscais apresentados e a correta aplicação dos recursos 
          nas finalidades institucionais autorizadas, confirmando que não houve desvio de finalidade ou infringência 
          às normas estabelecidas na Resolução nº 15/2013-GP e legislação correlata.
        </p>

        <p className="leading-loose">
          <strong>ATESTO</strong>, diante do exposto, que a presente Prestação de Contas encontra-se <strong>REGULAR</strong> e 
          <strong>APROVADA</strong> no âmbito desta Unidade Gestora, tendo sido verificadas as eventuais retenções tributárias 
          e o recolhimento de saldo remanescente, quando exigível.
        </p>

        <p className="leading-loose pt-4">
          Remetam-se os autos à <strong>Secretaria de Orçamento e Finanças (SEFIN) / SOSFU</strong> para análise técnica conclusiva 
          e providências de baixa contábil/SIAFE.
        </p>

        {/* GDRs info if applicable */}
        {(prestacaoData?.gdr_inss_numero || prestacaoData?.gdr_saldo_numero) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 my-6">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
              Guias de Recolhimento
            </p>
            <div className="flex gap-6 text-sm">
              {prestacaoData?.gdr_inss_numero && (
                <p><strong>GDR INSS:</strong> #{prestacaoData.gdr_inss_numero}</p>
              )}
              {prestacaoData?.gdr_saldo_numero && (
                <p><strong>GDR Saldo:</strong> #{prestacaoData.gdr_saldo_numero}</p>
              )}
            </div>
          </div>
        )}

        {/* Location and date */}
        <div className="mt-12 text-center">
          <p>{unidade}, {dataAssinatura}.</p>
        </div>

        {/* Signature placeholder (shown only if NOT YET SIGNED) */}
        {documentData?.status !== 'ASSINADO' && (
          <div className="mt-16 text-center space-y-4">
            <div className="pt-4 border-t border-dashed border-slate-400 max-w-md mx-auto inline-block px-12">
              <p className="text-sm text-slate-400 font-medium italic">Assinatura Digital do Gestor</p>
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
                    {signerRole}
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
          ID: {documentData?.id || 'PREVIEW'} • NUP: {nup}
        </div>
      </div>
    </div>
  );
};

export default StaticCertidaoAtestoPC;

import React from 'react';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ArrowDown,
  ArrowUp,
  Wallet,
  TrendingDown
} from 'lucide-react';

interface ConciliacaoData {
  totalRecebido: number;       // Valor adiantado/concedido
  totalGasto: number;          // Soma das NFs/Recibos
  totalINSSRetido: number;     // INSS 11% retido de PFs (para GDR)
  totalISSRetido: number;      // ISS 5% retido de PFs
  gdrINSSPaga: boolean;        // GDR de INSS foi anexada
  gdrSaldoPaga: boolean;       // GDR de Saldo foi anexada
}

interface ConciliacaoPanelProps {
  data: ConciliacaoData;
  onEmitirGDRINSS?: () => void;
  onEmitirGDRSaldo?: () => void;
  compact?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const ConciliacaoPanel: React.FC<ConciliacaoPanelProps> = ({
  data,
  onEmitirGDRINSS,
  onEmitirGDRSaldo,
  compact = false
}) => {
  const saldoDevolver = data.totalRecebido - data.totalGasto;
  
  // Validações
  const temINSSParaRecolher = data.totalINSSRetido > 0;
  const temSaldoParaDevolver = saldoDevolver > 0;
  const precisaDuasGDRs = temINSSParaRecolher && temSaldoParaDevolver;
  
  // Status de conciliação
  const inssOk = !temINSSParaRecolher || data.gdrINSSPaga;
  const saldoOk = !temSaldoParaDevolver || data.gdrSaldoPaga;
  const conciliacaoValida = inssOk && saldoOk && data.totalGasto > 0;
  
  // Total que deve bater (gasto + devolvido = recebido)
  const totalDevolvido = saldoDevolver > 0 && data.gdrSaldoPaga ? saldoDevolver : 0;
  const contaFecha = Math.abs((data.totalGasto + totalDevolvido) - data.totalRecebido) < 0.01;

  if (compact) {
    return (
      <div className={`rounded-2xl p-4 ${conciliacaoValida ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {conciliacaoValida ? (
              <CheckCircle2 size={24} className="text-emerald-600" />
            ) : (
              <AlertTriangle size={24} className="text-amber-600" />
            )}
            <span className={`font-bold ${conciliacaoValida ? 'text-emerald-700' : 'text-amber-700'}`}>
              {conciliacaoValida ? 'Conciliação válida' : 'Pendências na conciliação'}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Saldo</p>
            <p className={`font-bold ${saldoDevolver > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(saldoDevolver)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerta de Duas GDRs */}
      {precisaDuasGDRs && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h4 className="text-lg font-black text-red-800 uppercase tracking-tight">
                ⚠️ Atenção: Necessárias DUAS GDRs Distintas
              </h4>
              <p className="text-sm text-red-700 mt-2">
                Sua prestação de contas exige <strong>DUAS GDRs</strong>:
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                <li>
                  <strong>GDR de INSS:</strong> {formatCurrency(data.totalINSSRetido)} - recolhimento do imposto retido
                </li>
                <li>
                  <strong>GDR de Saldo:</strong> {formatCurrency(saldoDevolver)} - devolução de recursos não utilizados
                </li>
              </ul>
              <p className="text-sm text-red-800 font-bold mt-3">
                Certifique-se de emitir e anexar AMBAS as guias!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Painel Principal de Conciliação */}
      <div className={`rounded-3xl border-2 p-6 ${
        conciliacaoValida 
          ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300' 
          : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              conciliacaoValida ? 'bg-emerald-100' : 'bg-amber-100'
            }`}>
              <Calculator size={24} className={conciliacaoValida ? 'text-emerald-600' : 'text-amber-600'} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Conciliação Financeira
              </h3>
              <p className="text-xs text-slate-500">Atualização em tempo real</p>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${
            conciliacaoValida 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-amber-100 text-amber-700'
          }`}>
            {conciliacaoValida ? '✓ Válida' : '⏳ Pendente'}
          </div>
        </div>

        {/* Linhas de Conciliação */}
        <div className="space-y-4">
          {/* Total Recebido */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ArrowDown size={16} className="text-blue-600" />
              </div>
              <span className="font-medium text-slate-700">(+) Total Recebido (Adiantamento)</span>
            </div>
            <span className="text-xl font-black text-blue-600">{formatCurrency(data.totalRecebido)}</span>
          </div>

          {/* Total Gasto */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wallet size={16} className="text-purple-600" />
              </div>
              <span className="font-medium text-slate-700">(-) Total Gasto Comprovado</span>
            </div>
            <span className="text-xl font-black text-purple-600">- {formatCurrency(data.totalGasto)}</span>
          </div>

          {/* INSS Retido (se houver) */}
          {temINSSParaRecolher && (
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  data.gdrINSSPaga ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {data.gdrINSSPaga ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <AlertTriangle size={16} className="text-red-600" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-slate-700">INSS Retido (Recolher via GDR)</span>
                  <p className="text-xs text-slate-400">
                    {data.gdrINSSPaga ? '✓ GDR anexada' : '⚠️ Pendente anexar GDR'}
                  </p>
                </div>
              </div>
              <span className={`text-lg font-bold ${data.gdrINSSPaga ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(data.totalINSSRetido)}
              </span>
            </div>
          )}

          {/* Linha Divisória */}
          <div className="border-t-2 border-slate-300 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  saldoDevolver > 0 ? 'bg-red-100' : 'bg-emerald-100'
                }`}>
                  <TrendingDown size={20} className={saldoDevolver > 0 ? 'text-red-600' : 'text-emerald-600'} />
                </div>
                <span className="text-lg font-black text-slate-800">(=) Saldo a Devolver</span>
              </div>
              <span className={`text-2xl font-black ${
                saldoDevolver > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {formatCurrency(saldoDevolver)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ações de GDR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GDR INSS */}
        {temINSSParaRecolher && (
          <div className={`rounded-2xl p-5 ${
            data.gdrINSSPaga 
              ? 'bg-emerald-50 border-2 border-emerald-200' 
              : 'bg-amber-50 border-2 border-amber-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`font-black uppercase tracking-tight ${
                data.gdrINSSPaga ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                GDR de INSS
              </h4>
              {data.gdrINSSPaga ? (
                <CheckCircle2 size={20} className="text-emerald-600" />
              ) : (
                <AlertTriangle size={20} className="text-amber-600" />
              )}
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              Valor: <strong>{formatCurrency(data.totalINSSRetido)}</strong>
            </p>
            
            {!data.gdrINSSPaga && (
              <a 
                href="https://apps.tjpa.jus.br/gdr-publico/emissao-guia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-all"
              >
                <ExternalLink size={16} />
                Emitir GDR INSS
              </a>
            )}
          </div>
        )}

        {/* GDR Saldo */}
        {temSaldoParaDevolver && (
          <div className={`rounded-2xl p-5 ${
            data.gdrSaldoPaga 
              ? 'bg-emerald-50 border-2 border-emerald-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`font-black uppercase tracking-tight ${
                data.gdrSaldoPaga ? 'text-emerald-700' : 'text-red-700'
              }`}>
                GDR de Devolução
              </h4>
              {data.gdrSaldoPaga ? (
                <CheckCircle2 size={20} className="text-emerald-600" />
              ) : (
                <AlertTriangle size={20} className="text-red-600" />
              )}
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              Valor: <strong>{formatCurrency(saldoDevolver)}</strong>
            </p>
            
            {!data.gdrSaldoPaga && (
              <a 
                href="https://apps.tjpa.jus.br/gdr-publico/emissao-guia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
              >
                <ExternalLink size={16} />
                Emitir GDR Devolução
              </a>
            )}
          </div>
        )}
      </div>

      {/* Mensagem de Sucesso */}
      {conciliacaoValida && contaFecha && (
        <div className="bg-emerald-100 border-2 border-emerald-300 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-700" />
            </div>
            <div>
              <h4 className="text-lg font-black text-emerald-800">
                ✓ Prestação de Contas Conciliada
              </h4>
              <p className="text-sm text-emerald-700">
                Todos os valores foram comprovados e as GDRs necessárias foram anexadas.
                Você pode prosseguir para o envio ao Gestor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConciliacaoPanel;

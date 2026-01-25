import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, BadgeCheck, FileText, DollarSign, Calendar, User, 
  CheckCircle2, AlertTriangle, RefreshCw, Eye, Download,
  QrCode, ShieldCheck, FileWarning, Activity, TrendingUp, AlertOctagon
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { usePrestacaoContas } from '../../hooks/usePrestacaoContas';
import { useToast } from '../ui/ToastProvider';
import { useDossierData } from '../ProcessDetails/hooks/useDossierData';
import { SignatureModal } from '../ui/SignatureModal';
import { useSupridoCRM, fetchSupridoStats } from '../../hooks/useSupridoCRM';
import { calculateRisk, RiskAnalysis } from '../../lib/riskEngine';
import { ConciliacaoPanel } from '../Suprido/ConciliacaoPanel';
import { PendenciaModal } from './PendenciaModal'; // Import Modal

interface PrestacaoAtestoTabProps {
  processId: string;
  processData: any;
  onBack: () => void;
  onSuccess: () => void;
}

export const PrestacaoAtestoTab: React.FC<PrestacaoAtestoTabProps> = ({
  processId,
  processData,
  onBack,
  onSuccess
}) => {
  const { showToast } = useToast();
  const { pc, comprovantes, atestarPC, devolverPC, isLoading: isLoadingPC } = usePrestacaoContas({ solicitacaoId: processId });
  const { dossierDocs, refreshDocs } = useDossierData({ processId, currentUserId: '' });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showPendenciaModal, setShowPendenciaModal] = useState(false); // State for Glosa Modal
  
  // Intelligence Hooks
  const [supridoStats, setSupridoStats] = useState<any>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);

  // Totals
  const totalConcedido = pc?.valor_concedido || 0;
  const totalGasto = pc?.valor_gasto || 0;
  const totalDevolvido = pc?.valor_devolvido || 0;
  const totalINSS = pc?.total_inss_retido || 0;
  const contaFecha = Math.abs(totalConcedido - (totalGasto + totalDevolvido)) < 0.05;

  // Auto-Atesto Check
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  useEffect(() => {
     supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || ''));
  }, []);

  const isSelfAtesto = pc?.submitted_by === currentUserId;

  useEffect(() => {
    if (pc?.submitted_by) {
       fetchSupridoStats(pc.submitted_by).then(stats => {
           setSupridoStats(stats);
           const risk = calculateRisk(pc, comprovantes, stats);
           setRiskAnalysis(risk);
       }).catch(err => console.error("Failed to fetch CRM stats", err));
    }
  }, [pc?.submitted_by, comprovantes, pc]);

  // Check if Atesto exists
  const certidaoAtesto = dossierDocs.find(d => d.tipo === 'CERTIDAO_ATESTO_PC');
  const hasCertidao = !!certidaoAtesto;

  const handleGenerateAtesto = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowSignatureModal(true);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao gerar atesto.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignAndSend = async (pin: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, cargo')
        .eq('id', user?.id)
        .single();
      
      const result = await supabase.from('documentos').insert({
        solicitacao_id: processId,
        nome: `Certidão de Atesto${isSelfAtesto ? ' (Auto)' : ''} - ${processData.nup}.pdf`,
        titulo: isSelfAtesto ? 'Certidão de Auto-Atesto de Regularidade' : 'Certidão de Atesto de Prestação de Contas',
        tipo: 'CERTIDAO_ATESTO_PC',
        status: 'ASSINADO',
        conteudo: isSelfAtesto 
           ? `DECLARAÇÃO DE AUTO-ATESTO: Eu, ${profile?.nome}, na qualidade de Ordenador/Gestor e Suprido, certifico a regularidade desta Prestação de Contas (NUP ${processData.nup}). Total gasto: ${totalGasto}.`
           : `Certificamos que a Prestação de Contas do processo ${processData.nup} foi analisada e encontra-se regular. Total gasto: ${totalGasto}. Total de comprovantes: ${comprovantes.length}.`,
        created_by: user?.id,
        metadata: {
          signed_by: user?.id,
          signed_by_name: profile?.nome || 'Gestor',
          signer_role: profile?.cargo || 'Chefia Imediata',
          is_auto_atesto: isSelfAtesto,
          signed_at: new Date().toISOString(),
          valor_concedido: totalConcedido,
          total_gasto: totalGasto,
          total_inss_retido: totalINSS,
          total_iss_retido: pc?.total_iss_retido || 0,
          saldo_devolvido: totalDevolvido,
          comprovantes_count: comprovantes.length,
          gdr_inss_numero: pc?.gdr_inss_numero,
          gdr_saldo_numero: pc?.gdr_saldo_numero,
          conciliacao_ok: contaFecha
        }
      });

      if (result.error) throw result.error;

      showToast({ type: 'success', title: 'Certidão Gerada', message: 'Documento assinado e anexado com sucesso.' });
      refreshDocs(); // Recarregar documentos para habilitar botão de envio
      return { success: true };

    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', title: 'Erro', message: err.message });
      return { success: false, error: err.message };
    }
  };

  const handleTramitar = async () => {
    if (!hasCertidao) {
      showToast({ type: 'error', title: 'Bloqueado', message: 'É obrigatório gerar e assinar a Certidão de Atesto antes de tramitar.' });
      return;
    }
    
    setIsGenerating(true);
    try {
      const result = await atestarPC(
         isSelfAtesto ? 'Auto-Atesto realizado pelo Gestor/Suprido.' : undefined
      );
      
      if (result.success) {
        showToast({ type: 'success', title: 'Sucesso', message: 'Processo tramitado para SOSFU.' });
        onSuccess();
      }
    } catch(err) {
       console.error(err);
       showToast({ type: 'error', title: 'Erro', message: 'Falha na tramitação.' });
    } finally {
       setIsGenerating(false);
    }
  };

  const handleDevolucao = async (motivo: string) => {
     try {
       const result = await devolverPC(motivo);
       if (result.success) {
          showToast({ type: 'info', title: 'PC Devolvida', message: 'O suprido será notificado para realizar correções.' });
          onSuccess(); // Sai da tela
       } else {
          showToast({ type: 'error', title: 'Erro', message: 'Falha ao devolver PC.' });
       }
     } catch (err: any) {
        console.error(err);
        showToast({ type: 'error', title: 'Erro', message: err.message });
     }
  };

  if (isLoadingPC) {
    return <div className="p-10 text-center"><RefreshCw className="animate-spin mx-auto text-blue-600"/> verificando dados...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Revisão de Prestação de Contas</h2>
          <p className="text-slate-500 max-w-2xl">
            Verifique a aplicação dos recursos e a documentação anexada pelo suprido. 
            Se estiver de acordo, emita a Certidão de Atesto para encaminhar à SOSFU.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Status Atual</p>
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold inline-block">
            AGUARDANDO ATESTO GESTOR
          </div>
        </div>
      </div>

      {/* INTELLIGENCE SCORECARD */}
      {riskAnalysis && supridoStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500 delay-150">
           {/* RISK SCORE */}
           <div className={`rounded-3xl p-6 border-l-8 shadow-sm flex items-center justify-between
              ${riskAnalysis.level === 'CRITICO' ? 'bg-red-50 border-red-500' : 
                riskAnalysis.level === 'ALTO' ? 'bg-orange-50 border-orange-500' :
                riskAnalysis.level === 'MEDIO' ? 'bg-amber-50 border-amber-500' :
                'bg-emerald-50 border-emerald-500'}
           `}>
              <div>
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Análise de Risco Automática</p>
                 <h3 className={`text-3xl font-black mb-1
                    ${riskAnalysis.level === 'CRITICO' ? 'text-red-700' : 
                      riskAnalysis.level === 'ALTO' ? 'text-orange-700' :
                      riskAnalysis.level === 'MEDIO' ? 'text-amber-700' :
                      'text-emerald-700'}
                 `}>
                    {riskAnalysis.score}/100
                 </h3>
                 <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    Nível: {riskAnalysis.level}
                    {riskAnalysis.level === 'BAIXO' ? <CheckCircle2 size={16} className="text-emerald-500"/> : <AlertOctagon size={16} className="text-red-500"/>}
                 </p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                 {riskAnalysis.flags.map((flag, idx) => (
                    <span key={idx} className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                       ${flag.type === 'DANGER' ? 'bg-red-200 text-red-800' : 
                         flag.type === 'WARNING' ? 'bg-amber-200 text-amber-800' : 
                         'bg-blue-200 text-blue-800'}
                    `}>
                       {flag.message}
                    </span>
                 )).slice(0, 3)}
              </div>
           </div>

           {/* CRM SUPRIDO */}
           <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Perfil do Suprido</p>
                 <div className="flex items-center gap-3">
                    <User className="text-blue-500" />
                    <div>
                       <p className="text-sm font-bold text-slate-800">Histórico ({supridoStats.total_processos} PCs)</p>
                       <p className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1
                          ${supridoStats.reputacao === 'EXCELENTE' ? 'bg-emerald-100 text-emerald-700' :
                            supridoStats.reputacao === 'ATENCAO' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'}
                       `}>
                          Reputação: {supridoStats.reputacao}
                       </p>
                    </div>
                 </div>
              </div>
              <div className="text-right space-y-1">
                 <p className="text-xs text-slate-500">
                    <TrendingUp size={12} className="inline mr-1"/>
                    Média Aprovação: <strong className="text-slate-800">{Math.round((supridoStats.total_aprovados / (supridoStats.total_processos || 1)) * 100)}%</strong>
                 </p>
                 <p className="text-xs text-slate-500">
                    <Activity size={12} className="inline mr-1"/>
                    Devoluções: <strong className="text-red-600">{supridoStats.total_devolucoes}</strong>
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <ConciliacaoPanel 
             data={{
               totalRecebido: totalConcedido,
               totalGasto: totalGasto,
               totalINSSRetido: totalINSS,
               totalISSRetido: pc?.total_iss_retido || 0,
               gdrINSSPaga: !!pc?.gdr_inss_paga,
               gdrSaldoPaga: !!pc?.gdr_saldo_paga
             }}
           />
        </div>
        
        {/* Actions Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-slate-200">
          <div>
            <BadgeCheck size={48} className="text-emerald-400 mb-6" />
            <h3 className="text-xl font-black mb-2">{isSelfAtesto ? 'Auto-Atesto (Gestor/Suprido)' : 'Atesto de Regularidade'}</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {isSelfAtesto 
                ? 'Como você é o Gestor e Suprido deste processo, realize o Auto-Atesto para certificar a regularidade e encaminhar à SOSFU.'
                : 'Ao atestar, você confirma que as despesas foram realizadas em benefício do serviço público e dentro dos prazos legais.'}
            </p>
            
            <div className={`p-4 rounded-xl border ${contaFecha ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-red-500/20 border-red-500/50'} mb-6`}>
              <div className="flex items-center gap-3">
                {contaFecha ? <CheckCircle2 className="text-emerald-400"/> : <AlertTriangle className="text-red-400"/>}
                <span className="font-bold text-sm">
                  {contaFecha ? 'Conciliação Financeira OK' : 'Divergência de Valores'}
                </span>
              </div>
            </div>
          </div>

          
          {/* Action Buttons Separated */}
          <div className="flex flex-col gap-3">
             {!hasCertidao ? (
                <button
                  onClick={handleGenerateAtesto}
                  disabled={!contaFecha || isGenerating}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? <RefreshCw className="animate-spin"/> : <FileText />}
                  1. Gerar Certidão
                </button>
             ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 font-bold text-sm">
                   <CheckCircle2 size={18} /> Certidão Gerada com Sucesso
                </div>
             )}

             <button
               onClick={handleTramitar}
               disabled={!hasCertidao || isGenerating}
               className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                  ${hasCertidao 
                     ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                     : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
               `}
             >
               {isGenerating ? <RefreshCw className="animate-spin"/> : <BadgeCheck />}
               2. Tramitar para SOSFU
             </button>
          </div>
          
          <button
             onClick={() => setShowPendenciaModal(true)}
             className="w-full mt-3 py-3 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-xl font-bold uppercase tracking-widest transition-all text-sm flex items-center justify-center gap-2"
          >
             <AlertTriangle size={16} />
             Solicitar Correção
          </button>
        </div>
      </div>

      {/* Documents Review */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <FileText size={20} className="text-slate-400"/>
            Comprovantes e Documentos Anexados
          </h3>
          <span className="text-xs font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-500">
            {comprovantes.length} itens
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {comprovantes.map((comp) => (
            <div key={comp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xs">
                  NF
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {comp.emitente}
                    {(comp.tipo === 'PASSAGEM' || comp.tipo === 'CUPOM_FISCAL') && (
                       <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                         <QrCode size={10} /> Validado SEFAZ
                       </span>
                    )}
                    {(comp.tipo === 'RECIBO' && comp.descricao?.includes('Transporte')) && (
                       <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                         <ShieldCheck size={10} /> Recibo Oficial
                       </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{comp.descricao}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-bold text-slate-700">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comp.valor)}
                </span>
                {comp.storage_url && (
                  <a href={comp.storage_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-blue-600 transition-colors">
                    <Eye size={18}/>
                  </a>
                )}
              </div>
            </div>
          ))}
          {comprovantes.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              Nenhum comprovante listado.
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onConfirm={handleSignAndSend}
          title="Assinar Atesto"
          description="Confirme sua identidade para assinar digitalmente a Certidão de Atesto e encaminhar o processo."
        />
      )}

      {/* Pendencia Modal (Glosa) */}
      <PendenciaModal 
        isOpen={showPendenciaModal}
        onClose={() => setShowPendenciaModal(false)}
        onConfirm={handleDevolucao}
      />
    </div>
  );
};

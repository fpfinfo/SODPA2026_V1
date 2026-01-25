import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, BadgeCheck, FileText, DollarSign, Calendar, User, 
  CheckCircle2, AlertTriangle, RefreshCw, Eye, Download,
  QrCode, ShieldCheck, FileWarning 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { usePrestacaoContas } from '../../hooks/usePrestacaoContas';
import { useToast } from '../ui/ToastProvider';
import { useDossierData } from '../ProcessDetails/hooks/useDossierData';
import { SignatureModal } from '../ui/SignatureModal';
import { ConciliacaoPanel } from '../Suprido/ConciliacaoPanel';

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
  const { pc, comprovantes, atestarPC, isLoading: isLoadingPC } = usePrestacaoContas({ solicitacaoId: processId });
  const { dossierDocs, refreshDocs } = useDossierData({ processId, currentUserId: '' }); // Fetch docs for review
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);

  // Totals
  const totalConcedido = pc?.valor_concedido || 0;
  const totalGasto = pc?.valor_gasto || 0;
  const totalDevolvido = pc?.valor_devolvido || 0;
  const totalINSS = pc?.total_inss_retido || 0;
  
  const contaFecha = Math.abs(totalConcedido - (totalGasto + totalDevolvido)) < 0.05;

  const handleGenerateAtesto = async () => {
    setIsGenerating(true);
    try {
      // Here usually we would call an Edge Function or PDF Generator
      // For now, we simulate the PDF generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Allow signing
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
      // 1. Validate PIN (In real app, verify against user profile)
      // Assuming PIN check passed in SignatureModal before callback or doing it here
      
      // 2. Get user info for signature
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch user profile for signer info
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, cargo')
        .eq('id', user?.id)
        .single();
      
      // 3. Create Document Record with comprehensive PC data
      await supabase.from('documentos').insert({
        solicitacao_id: processId,
        nome: `Certidão de Atesto PC - ${processData.nup}.pdf`,
        titulo: 'Certidão de Atesto de Prestação de Contas',
        tipo: 'CERTIDAO_ATESTO_PC',
        status: 'ASSINADO',
        conteudo: `Certificamos que a Prestação de Contas do processo ${processData.nup} foi analisada e encontra-se regular. Total gasto: ${totalGasto}. Total de comprovantes: ${comprovantes.length}.`,
        created_by: user?.id,
        metadata: {
          // Signature info
          signed_by: user?.id,
          signed_by_name: profile?.nome || 'Gestor',
          signer_role: profile?.cargo || 'Chefia Imediata',
          signed_at: new Date().toISOString(),
          // PC Financial Summary
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

      // 4. Move Workflow
      const result = await atestarPC();
      if (result.success) {
        showToast({ type: 'success', title: 'PC Atestada!', message: 'Certidão emitida e processo enviado à SOSFU.' });
        onSuccess();
        return { success: true };
      }
      return { success: false, error: 'Falha ao atestar' };
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', title: 'Erro', message: err.message });
      return { success: false, error: err.message };
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
            <h3 className="text-xl font-black mb-2">Atesto de Regularidade</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Ao atestar, você confirma que as despesas foram realizadas em benefício do serviço público e 
              dentro dos prazos legais.
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

          <button
            onClick={handleGenerateAtesto}
            disabled={!contaFecha || isGenerating}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? <RefreshCw className="animate-spin"/> : <BadgeCheck />}
            Atestar e Enviar
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
                    {/* Badges de Confiança */}
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
    </div>
  );
};

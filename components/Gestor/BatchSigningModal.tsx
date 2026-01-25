import React, { useState, useEffect } from 'react';
import { BadgeCheck, X, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useUserProfile } from '../../hooks/useUserProfile';
import { generateAtestoContent, generateAtestoTitle } from '../../utils/atestoGenerator';
import { useToast } from '../ui/ToastProvider';

interface BatchSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  currentUserId: string;
  onSuccess: () => void;
}

export const BatchSigningModal: React.FC<BatchSigningModalProps> = ({
  isOpen,
  onClose,
  selectedIds,
  currentUserId,
  onSuccess
}) => {
  const [step, setStep] = useState<'PIN' | 'PROCESSING' | 'RESULT'>('PIN');
  const [pin, setPin] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: selectedIds.length });
  const [results, setResults] = useState<{ successes: number; failures: number }>({ successes: 0, failures: 0 });
  const { userProfile } = useUserProfile({ id: currentUserId });
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
        setStep('PIN');
        setPin('');
        setProgress({ current: 0, total: selectedIds.length });
        setResults({ successes: 0, failures: 0 });
    }
  }, [isOpen, selectedIds.length]);

  if (!isOpen) return null;

  const handleSign = async () => {
    if (!pin) {
        showToast({ type: 'error', title: 'PIN Obrigatório', message: 'Informe seu PIN de assinatura.' });
        return;
    }

    if (pin !== userProfile?.signature_pin) {
        showToast({ type: 'error', title: 'PIN Incorreto', message: 'O PIN informado não confere.' });
        return;
    }

    setStep('PROCESSING');
    let successCount = 0;
    let failureCount = 0;

    // Process each item
    for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i];
        setProgress({ current: i + 1, total: selectedIds.length });

        try {
            // 1. Fetch Process Data needed for the document
            const { data: process, error: fetchErr } = await supabase
                .from('solicitacoes')
                .select('id, nup, suprido_nome, interested:profiles!solicitacoes_user_id_fkey(nome)')
                .eq('id', id)
                .single();

            if (fetchErr) throw fetchErr;

            // 2. Check if already has Atesto?
            const { data: existingDocs } = await supabase
                .from('documentos')
                .select('id')
                .eq('solicitacao_id', id)
                .in('tipo', ['CERTIDAO_ATESTO', 'CERTIDAO_ATESTO_PC']);

            if (existingDocs && existingDocs.length > 0) {
                // Already signed, count as success (idempotent) or skip?
                // Let's count as success but log warning
                successCount++;
                continue;
            }

            // 3. Generate Content
            // Handle relationship structure differences
            const flatProcess = {
                nup: process.nup,
                interested: process.interested?.nome || process.suprido_nome || ''
            };
            
            const content = generateAtestoContent(flatProcess);
            const title = generateAtestoTitle();

            // 4. Insert Document
            const { error: insertErr } = await supabase.from('documentos').insert({
                solicitacao_id: id,
                nome: title,
                titulo: title,
                tipo: 'CERTIDAO_ATESTO',
                status: 'ASSINADO',
                conteudo: content,
                created_by: currentUserId,
                metadata: {
                    signed_at: new Date().toISOString(),
                    signer_id: currentUserId,
                    signer_role: userProfile?.role,
                    batch_id: `BATCH-${Date.now()}`
                }
            });

            if (insertErr) throw insertErr;
            
            // 5. Update process status to 'ATESTADO' (or similar intermediate status if needed)
            // Usually status changes on Tramitation, but maybe we want to flag it?
            // For now, just creating the doc enables the 'Tramitar' button.
            
            successCount++;

        } catch (error) {
            console.error(`Failed to sign ${id}:`, error);
            failureCount++;
        }
    }

    setResults({ successes: successCount, failures: failureCount });
    setStep('RESULT');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <BadgeCheck size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-800">Assinatura em Lote</h3>
                    <p className="text-xs text-slate-500 font-bold">{selectedIds.length} processos selecionados</p>
                </div>
            </div>
            {step !== 'PROCESSING' && (
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                </button>
            )}
        </div>

        {/* Content */}
        <div className="p-8">
            {step === 'PIN' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-800 leading-relaxed">
                            Você está prestes a gerar e assinar digitalmente a <strong>Certidão de Atesto</strong> para <strong>{selectedIds.length} processos</strong>.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Informe seu PIN</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="••••"
                                maxLength={4}
                                autoFocus
                            />
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-right">Sua assinatura digital é pessoal e intransferível.</p>
                    </div>

                    <button 
                        onClick={handleSign}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        Assinar Documentos
                    </button>
                </div>
            )}

            {step === 'PROCESSING' && (
                <div className="py-8 text-center space-y-6">
                    <div className="relative w-20 h-20 mx-auto">
                        <Loader2 size={80} className="text-blue-100 animate-spin" />
                        <Loader2 size={80} className="text-blue-600 animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
                        <div className="absolute inset-0 flex items-center justify-center font-black text-blue-600 text-lg">
                            {Math.round((progress.current / progress.total) * 100)}%
                        </div>
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800">Processando...</h4>
                        <p className="text-sm text-slate-500">
                            Assinando {progress.current} de {progress.total} documentos
                        </p>
                    </div>
                </div>
            )}

            {step === 'RESULT' && (
                <div className="text-center space-y-6">
                     <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                        <CheckCircle2 size={40} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-800 mb-2">Sucesso!</h4>
                        <p className="text-slate-500">
                            Foram assinados <strong>{results.successes}</strong> documentos.
                            {results.failures > 0 && <span className="block text-red-500 mt-1">{results.failures} falhas ocorreram.</span>}
                        </p>
                    </div>
                    <button 
                        onClick={onSuccess}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all"
                    >
                        Concluir
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

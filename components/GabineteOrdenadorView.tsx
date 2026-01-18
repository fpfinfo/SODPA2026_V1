import React, { useState, useEffect } from 'react';
import {
  FileSignature,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  FileText,
  Scale,
  PenTool,
  ArrowLeft,
  Send,
  AlertCircle,
  Eye,
  MessageSquare,
  User,
  RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ui/ToastProvider';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

interface PendingDocument {
  id: string;
  nome: string;
  titulo: string;
  tipo: string;
  status: string;
  signature_status: string;
  conteudo: string;
  created_at: string;
  created_by: string;
  solicitacao_id: string;
  assigned_signer_id: string;
  creator_name?: string;
  process_nup?: string;
}

export const GabineteOrdenadorView: React.FC<{
  onBack?: () => void;
}> = ({ onBack }) => {
  const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PendingDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectObservation, setRejectObservation] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [tokenPin, setTokenPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const { showToast } = useToast();

  // Fetch pending documents
  const fetchPendingDocuments = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch documents with pending_signature status assigned to current user or any SEFIN user
      const { data, error } = await supabase
        .from('documentos')
        .select(`
          *,
          solicitacoes!inner(nup)
        `)
        .eq('signature_status', 'pending_signature')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending documents:', error);
        return;
      }

      if (data) {
        // Fetch creator names
        const docsWithNames = await Promise.all(data.map(async (doc) => {
          let creatorName = 'Desconhecido';
          if (doc.created_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nome')
              .eq('id', doc.created_by)
              .single();
            if (profile) creatorName = profile.nome;
          }
          return {
            ...doc,
            creator_name: creatorName,
            process_nup: doc.solicitacoes?.nup || doc.solicitacao_id
          };
        }));
        setPendingDocs(docsWithNames);
      }
    } catch (err) {
      console.error('Error in fetchPendingDocuments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  // Open PIN modal before signing
  const handleSign = () => {
    if (!selectedDoc) return;
    setShowPinModal(true);
    setTokenPin('');
    setPinError('');
  };

  // Validate PIN and then sign
  const handlePinConfirm = () => {
    if (tokenPin !== '123456') {
      setPinError('Senha do token inválida. Tente novamente.');
      return;
    }
    setPinError('');
    setShowPinModal(false);
    setTokenPin('');
    performSign();
  };

  // Sign and tramit document (actual logic)
  const performSign = async () => {
    if (!selectedDoc) return;
    setIsSigning(true);
    
    try {
      // Update document status to signed
      const { error: docError } = await supabase
        .from('documentos')
        .update({
          status: 'ASSINADO',
          signature_status: 'signed',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDoc.id);

      if (docError) throw docError;

      // Update solicitation status to indicate signed
      const { error: solError } = await supabase
        .from('solicitacoes')
        .update({
          status: 'aprovado',
          destino_atual: 'SOSFU',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDoc.solicitacao_id);

      if (solError) console.warn('Could not update solicitation:', solError);

      // Record in history
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('historico_tramitacao').insert({
        solicitacao_id: selectedDoc.solicitacao_id,
        origem: 'SEFIN',
        destino: 'SOSFU',
        status_anterior: 'em_analise_gabinete',
        status_novo: 'aprovado',
        observacao: `Documento "${selectedDoc.titulo}" assinado digitalmente pelo Ordenador de Despesa.`,
        tramitado_por: user?.id
      });

      showToast({
        type: 'success',
        title: 'Documento Assinado!',
        message: 'O documento foi assinado e o processo tramitado para SOSFU.'
      });

      // Refresh list
      fetchPendingDocuments();
      setSelectedDoc(null);
    } catch (err) {
      console.error('Error signing document:', err);
      showToast({
        type: 'error',
        title: 'Erro ao assinar',
        message: 'Não foi possível assinar o documento.'
      });
    } finally {
      setIsSigning(false);
    }
  };

  // Reject and return to AJSEFIN
  const handleReject = async () => {
    if (!selectedDoc || !rejectObservation.trim()) {
      showToast({
        type: 'error',
        title: 'Observação obrigatória',
        message: 'Por favor, informe o motivo da devolução.'
      });
      return;
    }

    try {
      // Update document status to rejected
      const { error: docError } = await supabase
        .from('documentos')
        .update({
          status: 'DEVOLVIDO',
          signature_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDoc.id);

      if (docError) throw docError;

      // Update solicitation to return to AJSEFIN
      const { error: solError } = await supabase
        .from('solicitacoes')
        .update({
          status: 'devolvido_correcao',
          destino_atual: 'AJSEFIN',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDoc.solicitacao_id);

      if (solError) console.warn('Could not update solicitation:', solError);

      // Record in history
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('historico_tramitacao').insert({
        solicitacao_id: selectedDoc.solicitacao_id,
        origem: 'SEFIN',
        destino: 'AJSEFIN',
        status_anterior: 'em_analise_gabinete',
        status_novo: 'devolvido_correcao',
        observacao: rejectObservation,
        tramitado_por: user?.id
      });

      showToast({
        type: 'success',
        title: 'Documento Devolvido',
        message: 'O documento foi devolvido para AJSEFIN para correções.'
      });

      // Reset and refresh
      setShowRejectModal(false);
      setRejectObservation('');
      fetchPendingDocuments();
      setSelectedDoc(null);
    } catch (err) {
      console.error('Error rejecting document:', err);
      showToast({
        type: 'error',
        title: 'Erro ao devolver',
        message: 'Não foi possível devolver o documento.'
      });
    }
  };

  return (
    <div className="h-full bg-[#f8fafc] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all"
            >
              <ArrowLeft size={20} className="text-slate-500" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              Mesa do Ordenador
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium tracking-normal border border-amber-200">
                SEFIN
              </span>
            </h1>
            <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
              <PenTool size={14} className="text-amber-500" />
              Documentos Aguardando Assinatura
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl">
            <span className="text-2xl font-black text-amber-600">{pendingDocs.length}</span>
            <span className="text-xs font-bold text-amber-500 ml-2">Pendentes</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document List */}
        <div className="w-1/3 bg-white border-r border-slate-200 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Clock size={24} className="mx-auto mb-2 animate-spin" />
              <p>Carregando...</p>
            </div>
          ) : pendingDocs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
              <p className="font-bold">Nenhum documento pendente</p>
              <p className="text-sm mt-1">Todos os documentos foram processados.</p>
            </div>
          ) : (
            pendingDocs.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-all ${
                  selectedDoc?.id === doc.id 
                    ? 'bg-amber-50 border-l-4 border-l-amber-500' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-purple-50 text-purple-600">
                    {doc.tipo}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1 line-clamp-2">
                  {doc.titulo || doc.nome}
                </h4>
                <p className="text-xs text-slate-400 mb-2">
                  {doc.process_nup}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <User size={10} />
                  <span>{doc.creator_name}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Document Preview */}
        <div className="flex-1 flex flex-col bg-slate-100">
          {selectedDoc ? (
            <>
              {/* Preview Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                    {selectedDoc.process_nup}
                  </p>
                  <h2 className="text-lg font-bold text-slate-800">
                    {selectedDoc.titulo || selectedDoc.nome}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                  >
                    <RotateCcw size={14} />
                    Devolver para Ajustes
                  </button>
                  <button
                    onClick={handleSign}
                    disabled={isSigning}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                  >
                    {isSigning ? (
                      <Clock size={16} className="animate-spin" />
                    ) : (
                      <FileSignature size={16} />
                    )}
                    Assinar e Tramitar
                  </button>
                </div>
              </div>

              {/* Document Content Preview */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-sm p-16 min-h-[800px]">
                  {/* Document Header */}
                  <div className="text-center mb-12">
                    <img 
                      src={BRASAO_TJPA_URL} 
                      alt="Brasão TJPA" 
                      className="w-20 mx-auto mb-4 opacity-90"
                    />
                    <h1 className="text-lg font-bold text-slate-900 uppercase tracking-widest">
                      TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ
                    </h1>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                      Secretaria de Finanças
                    </p>
                  </div>

                  {/* Document Title */}
                  <h2 className="text-xl font-bold text-slate-900 text-center mb-8 uppercase">
                    {selectedDoc.tipo} - {selectedDoc.titulo}
                  </h2>

                  {/* Document Content */}
                  <div className="prose prose-slate max-w-none font-serif text-lg leading-relaxed whitespace-pre-wrap">
                    {selectedDoc.conteudo || 'Conteúdo do documento não disponível.'}
                  </div>

                  {/* Signature Line (Preview) */}
                  <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                    <div className="inline-block">
                      <div className="w-64 h-px bg-slate-300 mb-4 mx-auto"></div>
                      <p className="font-bold text-slate-900 uppercase text-sm">
                        [ASSINATURA PENDENTE]
                      </p>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">
                        Ordenador de Despesa - SEFIN
                      </p>
                    </div>
                  </div>

                  {/* Draft Watermark */}
                  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
                    <p className="text-8xl font-black text-slate-900 rotate-[-30deg]">
                      MINUTA
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Eye size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold">Selecione um documento</p>
                <p className="text-sm mt-1">Clique em um documento à esquerda para visualizar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Devolver Documento
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              O documento será devolvido para a AJSEFIN para correções.
            </p>
            
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Observação / Motivo da Devolução *
              </label>
              <textarea
                value={rejectObservation}
                onChange={(e) => setRejectObservation(e.target.value)}
                className="w-full h-32 p-4 border border-slate-200 rounded-xl text-sm resize-none focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                placeholder="Descreva os ajustes necessários..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
              >
                Confirmar Devolução
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal for Signature */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileSignature size={32}/>
              </div>
              <h3 className="text-xl font-black text-slate-800">Assinatura Digital</h3>
              <p className="text-sm text-slate-500 mt-2">
                Digite a senha do token para assinar o documento.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Senha do Token / PIN
                </label>
                <input 
                  type="password" 
                  placeholder="••••••" 
                  value={tokenPin}
                  onChange={(e) => { setTokenPin(e.target.value); setPinError(''); }}
                  className={`w-full p-3 bg-white border rounded-xl text-center text-lg font-black tracking-widest focus:ring-2 focus:ring-blue-500 outline-none ${
                    pinError ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {pinError && (
                  <p className="text-xs text-red-500 mt-2 text-center font-bold">{pinError}</p>
                )}
              </div>
              <button 
                onClick={handlePinConfirm}
                disabled={isSigning}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <FileSignature size={16}/>
                Confirmar Assinatura
              </button>
              <button 
                onClick={() => { setShowPinModal(false); setTokenPin(''); setPinError(''); }}
                className="w-full py-3 text-slate-500 font-bold text-xs hover:text-slate-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

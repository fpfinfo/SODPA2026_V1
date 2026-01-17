import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSignature, 
  Scale, 
  Gavel, 
  FileCheck, 
  MessageSquare, 
  X, 
  ChevronRight, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Save,
  PenTool
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ui/ToastProvider';

interface DocumentCreationWizardProps {
  isOpen: boolean;
  processId: string;
  processNup?: string; // Alias for nup
  nup?: string;
  currentUser?: any;
  onClose: () => void;
  onSuccess?: () => void;
  onDocumentCreated?: () => void; // Alias for onSuccess
}

type DocType = 'DESPACHO' | 'OFICIO' | 'MEMORANDO' | 'CERTIDAO' | 'PARECER' | 'DECISAO';

const DOCUMENT_TYPES = [
  { id: 'DESPACHO', label: 'Despacho', icon: Gavel, desc: 'Ato de impulsionamento processual', color: 'bg-blue-50 text-blue-600' },
  { id: 'OFICIO', label: 'Ofício', icon: FileText, desc: 'Comunicação externa oficial', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'MEMORANDO', label: 'Memorando', icon: MessageSquare, desc: 'Comunicação interna entre setores', color: 'bg-amber-50 text-amber-600' },
  { id: 'CERTIDAO', label: 'Certidão', icon: FileCheck, desc: 'Atestado de fato ou situação', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'PARECER', label: 'Parecer', icon: Scale, desc: 'Opinião técnica ou jurídica', color: 'bg-purple-50 text-purple-600' },
  { id: 'DECISAO', label: 'Decisão', icon: FileSignature, desc: 'Ato decisório de autoridade', color: 'bg-red-50 text-red-600' },
];

export const DocumentCreationWizard: React.FC<DocumentCreationWizardProps> = ({ 
  isOpen, 
  processId, 
  processNup, 
  nup, 
  currentUser, 
  onClose, 
  onSuccess, 
  onDocumentCreated 
}) => {
  // Normalize props (support both nup and processNup, onSuccess and onDocumentCreated)
  const protocolNup = processNup || nup || '';
  const handleSuccess = onSuccess || onDocumentCreated || (() => {});
  
  // Auto-fetch user if not provided
  const [resolvedUser, setResolvedUser] = useState<any>(currentUser || null);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<DocType | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [signatoryId, setSignatoryId] = useState<string>(resolvedUser?.id || '');
  const [signNow, setSignNow] = useState(true);
  const [availableSigners, setAvailableSigners] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // Auto-fetch current user from Supabase if not provided
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (currentUser) {
        setResolvedUser(currentUser);
        setSignatoryId(currentUser.id || '');
        return;
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch profile data for role and other info
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          const userData = { 
            id: user.id, 
            email: user.email,
            role: profile?.role || 'SUPRIDO',
            nome: profile?.nome || user.email,
            cargo: profile?.cargo || 'Servidor'
          };
          setResolvedUser(userData);
          setSignatoryId(user.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    if (isOpen) {
      fetchCurrentUser();
      fetchSigners();
    }
  }, [isOpen, currentUser]);

  // Context-aware Template Loading
  useEffect(() => {
    if (selectedType) {
        let template = '';
        const role = resolvedUser?.role || 'SUPRIDO';

        if (selectedType === 'CERTIDAO' && role === 'GESTOR') {
            // Certidão de Novo Suprido template
            template = `CERTIDÃO DE NOVO SUPRIDO

CERTIFICO, para os devidos fins, que o(a) servidor(a) ${resolvedUser?.nome || '[NOME DO SERVIDOR]'}, matrícula ${resolvedUser?.matricula || '[MATRÍCULA]'}, lotado(a) em ${resolvedUser?.lotacao || '[LOTAÇÃO]'}, encontra-se APTO(A) para receber novo suprimento de fundos, tendo em vista:

1. A comprovação da regular aplicação dos recursos anteriormente recebidos através da prestação de contas devidamente aprovada;

2. A inexistência de pendências administrativas ou financeiras junto a este órgão;

3. O cumprimento integral das normas estabelecidas no Regulamento de Suprimento de Fundos do TJPA;

4. A demonstração de capacidade técnica e responsabilidade na gestão dos recursos públicos confiados.

A presente certidão é emitida para fins de concessão de nova responsabilidade de suprimento de fundos, conforme processo ${protocolNup}.

Por ser verdade, firmo a presente.`;
        } else if (selectedType === 'DECISAO' && role === 'AJSEFIN') {
            template = `Vistos, etc.

Trata-se de solicitação de suprimento de fundos (Protocolo ${protocolNup})...

DECIDO:

1. DEFIRO o pedido...
2. Publique-se.`;
        } else if (selectedType === 'DESPACHO') {
            template = `R.H.

Encaminhe-se à SOSFU para análise técnica.

Cumpra-se.`;
        } else if (selectedType === 'MEMORANDO') {
            template = `Ao Senhor(a) Coordenador(a),

Assunto: Solicitação de Providências

1. Venho por meio deste informar...`;
        } else {
            template = `Digite o conteúdo do documento aqui...`;
        }
        
        setContent(template);
        
        // Set appropriate title based on type
        if (selectedType === 'CERTIDAO' && role === 'GESTOR') {
            setTitle(`Certidão de Novo Suprido - ${new Date().toLocaleDateString()}`);
        } else {
            setTitle(`${DOCUMENT_TYPES.find(t => t.id === selectedType)?.label} - ${new Date().toLocaleDateString()}`);
        }
    }
  }, [selectedType, protocolNup, resolvedUser]);

  // Intelligent Signatory Suggestion
  useEffect(() => {
    if (!resolvedUser) return;
    
    // If I am NOT an authority, I probably can't sign "Decisão" or "Ofício" alone.
    // Logic: If creator role != intended signer role.
    
    if (resolvedUser.role === 'SUPRIDO') {
        setSignNow(false);
        // Try to find Gestor
        const gestor = availableSigners.find(s => s.role === 'GESTOR');
        if (gestor) setSignatoryId(gestor.id);
    } else if (resolvedUser.role === 'AJSEFIN' && selectedType === 'DECISAO') {
        setSignNow(false);
        // Try to find Ordenador
        const ord = availableSigners.find(s => s.role === 'ORDENADOR' || s.role === 'SEFIN');
        if (ord) setSignatoryId(ord.id);
    } else {
        setSignNow(true);
        setSignatoryId(resolvedUser.id);
    }
  }, [selectedType, resolvedUser, availableSigners]);

  const fetchSigners = async () => {
    const { data } = await supabase.from('profiles').select('id, nome, role, cargo');
    if (data) setAvailableSigners(data);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const isSelfSigned = signNow && signatoryId === resolvedUser?.id;
        const status = isSelfSigned ? 'ASSINADO' : 'MINUTA';
        const signature_status = isSelfSigned ? 'signed' : 'pending_signature';
        
        // Prepare insert data with signature workflow fields
        const insertData: Record<string, any> = {
            solicitacao_id: processId,
            nome: title,
            titulo: title,
            tipo: selectedType,
            status: status,
            signature_status: signature_status,
            conteudo: content,
            created_by: resolvedUser?.id,
            url_storage: `mock://documents/${processId}/${Date.now()}.pdf`
        };

        // Only include assigned_signer_id if delegating to another person
        if (!isSelfSigned && signatoryId) {
            insertData.assigned_signer_id = signatoryId;
        }
        
        const { error } = await supabase.from('documentos').insert(insertData);

        if (error) throw error;

        // Provide context-aware feedback
        if (!isSelfSigned) {
            const signerName = availableSigners.find(s => s.id === signatoryId)?.nome;
            showToast({ 
                type: 'success', 
                title: 'Minuta Enviada para Assinatura', 
                message: `Documento encaminhado para: ${signerName}` 
            });
        } else {
            showToast({ type: 'success', title: 'Documento assinado!', message: 'Documento publicado com sucesso.' });
        }

        handleSuccess();
        onClose();
    } catch (e) {
        console.error('Error saving document:', e);
        showToast({ type: 'error', title: 'Erro ao salvar', message: 'Não foi possível salvar o documento.' });
    } finally {
        setIsSaving(false);
    }
  };

  // Early return if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
       <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[1400px] h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Novo Documento</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Protocolo: {protocolNup}</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={20} className="text-slate-500"/></button>
          </div>

          <div className="flex-1 overflow-hidden flex">
             
             {step === 1 && (
                 <div className="flex-1 p-12 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-2xl font-black text-slate-900 mb-8 text-center">Selecione o Tipo de Documento</h3>
                        <div className="grid grid-cols-3 gap-6">
                            {DOCUMENT_TYPES.map(doc => (
                                <button 
                                    key={doc.id}
                                    onClick={() => { setSelectedType(doc.id as DocType); setStep(2); }}
                                    className="p-8 rounded-[32px] border border-slate-100 bg-white hover:border-blue-400 hover:shadow-xl transition-all group text-left flex flex-col gap-4"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${doc.color} group-hover:scale-110 transition-transform`}>
                                        <doc.icon size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-800 uppercase">{doc.label}</h4>
                                        <p className="text-xs font-medium text-slate-400 mt-1">{doc.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
             )}

             {step === 2 && (
                 <div className="flex-1 flex flex-col h-full bg-[#f8fafc]">
                    <div className="flex-1 flex overflow-hidden">
                        {/* Editor Area */}
                        <div className="flex-1 p-10 overflow-y-auto flex justify-center bg-slate-100/50">
                             <div className="w-full max-w-[800px] bg-white min-h-[1000px] shadow-sm border border-slate-200 p-16 flex flex-col shrink-0">
                                 {/* Document Header */}
                                 <div className="flex flex-col items-center justify-center mb-12 space-y-4">
                                     <img 
                                         src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png" 
                                         alt="Brasão TJPA" 
                                         className="w-20 opacity-90"
                                     />
                                     <h1 className="text-lg font-bold text-slate-900 uppercase tracking-widest text-center">
                                         TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ
                                     </h1>
                                 </div>

                                 <input 
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="text-2xl font-bold text-slate-900 mb-8 border-b border-white hover:border-slate-200 focus:border-blue-500 outline-none bg-transparent transition-all"
                                 />
                                 <textarea 
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="flex-1 w-full resize-none outline-none font-serif text-lg leading-relaxed text-slate-800"
                                    placeholder="Comece a redigir aqui..."
                                 />
                                 <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col items-center">
                                     <div className="w-64 h-px bg-slate-800 mb-4"></div>
                                     <p className="font-bold text-slate-900 uppercase">
                                         {availableSigners.find(s => s.id === signatoryId)?.nome || 'Signatário'}
                                     </p>
                                     <p className="text-xs text-slate-500 uppercase tracking-widest">
                                         {availableSigners.find(s => s.id === signatoryId)?.cargo || 'Cargo'}
                                     </p>
                                 </div>
                             </div>
                        </div>

                        {/* Sidebar / Controls */}
                        <div className="w-96 shrink-0 bg-white border-l border-slate-200 p-6 flex flex-col shadow-xl z-10 overflow-y-auto">
                             <div className="mb-8">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Signatário do Documento</label>
                                
                                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={signNow}
                                            disabled={signatoryId !== currentUser?.id}
                                            onChange={e => setSignNow(e.target.checked)}
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className={`text-sm font-bold ${signatoryId === currentUser?.id ? 'text-slate-800' : 'text-slate-400'}`}>Assinar agora</span>
                                    </div>
                                    
                                    {!signNow && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[10px] font-bold text-amber-600 mb-2 flex items-center gap-1"><AlertCircle size={12}/> O documento será salvo como MINUTA</p>
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Solicitar assinatura de:</label>
                                            <select 
                                                value={signatoryId}
                                                onChange={e => {
                                                    setSignatoryId(e.target.value);
                                                    setSignNow(e.target.value === currentUser?.id);
                                                }}
                                                className="w-full mt-1 p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                {availableSigners.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nome} - {s.role}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                             </div>

                             <div className="mt-auto space-y-3">
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl ${signNow ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}`}
                                >
                                    {isSaving ? 'Processando...' : signNow ? <><PenTool size={16}/> Assinar e Publicar</> : <><Save size={16}/> Salvar Minuta</>}
                                </button>
                                <button 
                                    onClick={() => setStep(1)}
                                    className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Voltar
                                </button>
                             </div>
                        </div>
                    </div>
                 </div>
             )}
          </div>
       </div>
    </div>
  );
};

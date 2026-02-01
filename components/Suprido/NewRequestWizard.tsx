import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, Plane, ArrowLeft, ArrowRight, CheckCircle, MapPin, Calendar, 
  FileText, User, Mail, Hash, Phone, Building, CreditCard, Users, 
  Upload, X, Image, File, Send, Edit, Globe, Map, Paperclip, Info, Lock, Key
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';

interface NewRequestWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

type RequestType = 'DIARIA' | 'PASSAGEM';
type DestinationType = 'ESTADO' | 'PAIS' | 'INTERNACIONAL';

interface RequesterData {
  nome: string;
  email: string;
  cpf: string;
  matricula: string;
  cargo: string;
  vinculo: string;
  telefone: string;
  lotacao: string;
  municipio: string;
  gestor_nome: string;
  gestor_email: string;
  banco: string;
  agencia: string;
  conta_corrente: string;
}

interface DestinationData {
  tipoDestino: DestinationType | '';
  origem: string;
  destino: string;
  dataInicio: string;
  dataFim: string;
  motivo: string;
}

interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string;
}

const STEP_LABELS = ['Tipo', 'Solicitante', 'Destino', 'Anexos', 'Confirmar'];

const DESTINATION_TYPE_LABELS: Record<DestinationType, string> = {
  ESTADO: 'No Estado (Pará)',
  PAIS: 'No País (Fora do Pará)',
  INTERNACIONAL: 'Internacional'
};

const NewRequestWizard: React.FC<NewRequestWizardProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile(user);
  const { showToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [requestType, setRequestType] = useState<RequestType | ''>('');
  const [requester, setRequester] = useState<RequesterData>({
    nome: '', email: '', cpf: '', matricula: '', cargo: '', vinculo: '',
    telefone: '', lotacao: '', municipio: '', gestor_nome: '', gestor_email: '',
    banco: '', agencia: '', conta_corrente: ''
  });
  const [destination, setDestination] = useState<DestinationData>({
    tipoDestino: '', origem: '', destino: '', dataInicio: '', dataFim: '', motivo: ''
  });
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // Pre-fill requester data from user profile
  useEffect(() => {
    if (userProfile) {
      setRequester({
        nome: userProfile.nome || '',
        email: userProfile.email || '',
        cpf: userProfile.cpf || '',
        matricula: String(userProfile.matricula || ''),
        cargo: userProfile.cargo || '',
        vinculo: userProfile.vinculo || '',
        telefone: userProfile.telefone || '',
        lotacao: userProfile.lotacao || '',
        municipio: userProfile.municipio || '',
        gestor_nome: userProfile.gestor_nome || '',
        gestor_email: userProfile.gestor_email || '',
        banco: userProfile.banco || '',
        agencia: userProfile.agencia || '',
        conta_corrente: userProfile.conta_corrente || ''
      });
    }
  }, [userProfile]);

  // Calculate days
  const calculateDays = () => {
    if (destination.dataInicio && destination.dataFim) {
      const start = new Date(destination.dataInicio);
      const end = new Date(destination.dataFim);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  const days = calculateDays();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: AttachmentFile[] = [];
    Array.from(files).forEach(file => {
      newAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      });
    });
    setAttachments([...attachments, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    const att = attachments.find(a => a.id === id);
    if (att?.preview) URL.revokeObjectURL(att.preview);
    setAttachments(attachments.filter(a => a.id !== id));
  };

  // Handle PIN validation and signature
  const handlePinSubmit = () => {
    if (pin === '1234') {
      setPinError('');
      setShowPinModal(false);
      handleSubmit();
    } else {
      setPinError('PIN incorreto. Tente novamente.');
    }
  };

  // Open PIN modal before submit
  const handleRequestSignature = () => {
    setPin('');
    setPinError('');
    setShowPinModal(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const { data: newRequest, error } = await supabase
        .from('sodpa_requests')
        .insert({
          tipo: requestType,
          status: 'ENVIADO', // Tramitado para SODPA
          solicitante_id: user.id,
          solicitante_nome: requester.nome,
          solicitante_email: requester.email,
          solicitante_cpf: requester.cpf,
          solicitante_matricula: requester.matricula,
          solicitante_cargo: requester.cargo,
          solicitante_vinculo: requester.vinculo,
          solicitante_telefone: requester.telefone,
          solicitante_lotacao: requester.lotacao,
          solicitante_municipio: requester.municipio,
          gestor_nome: requester.gestor_nome,
          gestor_email: requester.gestor_email,
          banco: requester.banco,
          agencia: requester.agencia,
          conta_corrente: requester.conta_corrente,
          tipo_destino: destination.tipoDestino,
          origem: destination.origem,
          destino: destination.destino,
          data_inicio: destination.dataInicio,
          data_fim: destination.dataFim,
          dias: days,
          motivo: destination.motivo,
          created_at: new Date().toISOString(),
          assinatura_digital: true,
          data_assinatura: new Date().toISOString(),
          destino_atual: 'SODPA' // Tramitado para caixa de entrada SODPA
        })
        .select()
        .single();

      if (error) throw error;

      // Upload attachments
      if (attachments.length > 0 && newRequest?.id) {
        for (const att of attachments) {
          const filePath = `sodpa/${newRequest.id}/${att.name}`;
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, att.file);

          if (!uploadError) {
            await supabase.from('sodpa_attachments').insert({
              request_id: newRequest.id,
              file_name: att.name,
              file_path: filePath,
              file_size: att.size,
              file_type: att.type
            });
          }
        }
      }

      showToast({ type: 'success', title: 'Sucesso!', message: 'Solicitação assinada e enviada para SODPA.' });
      onComplete?.();
    } catch (error: any) {
      console.error('Submit error:', error);
      showToast({ type: 'error', title: 'Erro', message: error.message || 'Falha ao enviar solicitação.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium text-gray-800";
  const inputDisabledClass = "w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed";
  const labelClass = "text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-1.5";

  const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-';

  // Step Indicator Component
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEP_LABELS.map((label, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        return (
          <React.Fragment key={stepNum}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all
                ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 
                  isCurrent ? 'bg-white border-indigo-600 text-indigo-600 shadow-lg' : 
                  'bg-white border-gray-300 text-gray-400'}`}>
                {isCompleted ? <CheckCircle size={18} /> : stepNum}
              </div>
              <span className={`mt-1 text-xs font-medium ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {stepNum < 5 && <div className={`w-8 h-0.5 ${stepNum < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  // Step 1: Type Selection
  const renderStep1 = () => (
    <div className="space-y-6 py-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Tipo de Solicitação</h3>
        <p className="text-gray-500">Selecione o tipo de solicitação que deseja realizar</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
        {[
          { type: 'DIARIA' as RequestType, icon: Briefcase, title: 'Diárias', desc: 'Para custeio de hospedagem e alimentação', color: 'indigo' },
          { type: 'PASSAGEM' as RequestType, icon: Plane, title: 'Passagens Aéreas', desc: 'Solicitação de bilhetes aéreos', color: 'purple' }
        ].map(({ type, icon: Icon, title, desc, color }) => (
          <button
            key={type}
            type="button"
            onClick={() => setRequestType(type)}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-3
              ${requestType === type ? `border-${color}-500 bg-${color}-50` : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center
              ${requestType === type ? `bg-${color}-600 text-white` : 'bg-gray-100 text-gray-400'}`}>
              <Icon size={28} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">{title}</h4>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={() => requestType && setCurrentStep(2)}
          disabled={!requestType}
          className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
            ${requestType ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          Próximo <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  // Step 2: Requester Data
  const renderStep2 = () => (
    <div className="space-y-6 py-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Dados do Solicitante</h3>
        <p className="text-gray-500">Confirme ou edite seus dados pessoais</p>
      </div>
      
      {/* Dados Pessoais */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2"><User size={18} className="text-indigo-600" /> Dados Pessoais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Nome</label>
            <input type="text" className={inputClass} value={requester.nome} onChange={e => setRequester({...requester, nome: e.target.value})} /></div>
          <div><label className={labelClass}><Mail size={14} /> E-mail</label>
            <input type="email" disabled className={inputDisabledClass} value={requester.email} /></div>
          <div><label className={labelClass}><Hash size={14} /> CPF</label>
            <input type="text" className={inputClass} placeholder="000.000.000-00" value={requester.cpf} onChange={e => setRequester({...requester, cpf: e.target.value})} /></div>
          <div><label className={labelClass}><Hash size={14} /> Matrícula</label>
            <input type="text" disabled className={inputDisabledClass} value={requester.matricula} /></div>
          <div><label className={labelClass}><Briefcase size={14} /> Cargo</label>
            <input type="text" className={inputClass} value={requester.cargo} onChange={e => setRequester({...requester, cargo: e.target.value})} /></div>
          <div><label className={labelClass}><Phone size={14} /> Telefone</label>
            <input type="tel" className={inputClass} placeholder="(91) 99999-9999" value={requester.telefone} onChange={e => setRequester({...requester, telefone: e.target.value})} /></div>
        </div>
      </div>

      {/* Localização */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2"><MapPin size={18} className="text-green-600" /> Localização</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}><Building size={14} /> Lotação</label>
            <input type="text" className={inputClass} value={requester.lotacao} onChange={e => setRequester({...requester, lotacao: e.target.value})} /></div>
          <div><label className={labelClass}><MapPin size={14} /> Município</label>
            <input type="text" className={inputClass} value={requester.municipio} onChange={e => setRequester({...requester, municipio: e.target.value})} /></div>
        </div>
      </div>

      {/* Gestor */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2"><Users size={18} className="text-purple-600" /> Gestor Imediato</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Nome do Gestor</label>
            <input type="text" className={inputClass} value={requester.gestor_nome} onChange={e => setRequester({...requester, gestor_nome: e.target.value})} /></div>
          <div><label className={labelClass}>E-mail do Gestor</label>
            <input type="email" className={inputClass} value={requester.gestor_email} onChange={e => setRequester({...requester, gestor_email: e.target.value})} /></div>
        </div>
      </div>

      {/* Dados Bancários */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2"><CreditCard size={18} className="text-amber-600" /> Dados Bancários</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClass}>Banco</label>
            <input type="text" className={inputClass} value={requester.banco} onChange={e => setRequester({...requester, banco: e.target.value})} /></div>
          <div><label className={labelClass}>Agência</label>
            <input type="text" className={inputClass} value={requester.agencia} onChange={e => setRequester({...requester, agencia: e.target.value})} /></div>
          <div><label className={labelClass}>Conta</label>
            <input type="text" className={inputClass} value={requester.conta_corrente} onChange={e => setRequester({...requester, conta_corrente: e.target.value})} /></div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={() => setCurrentStep(1)} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200">
          <ArrowLeft size={20} /> Voltar
        </button>
        <button type="button" onClick={() => setCurrentStep(3)} className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
          Próximo <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  // Step 3: Destination
  const renderStep3 = () => (
    <div className="space-y-6 py-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Destino da Viagem</h3>
        <p className="text-gray-500">Informe os detalhes do deslocamento</p>
      </div>

      {/* Tipo de Destino */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Tipo de Destino</h4>
        <div className="grid grid-cols-3 gap-3">
          {([
            { type: 'ESTADO' as DestinationType, icon: Map, label: 'No Estado' },
            { type: 'PAIS' as DestinationType, icon: MapPin, label: 'No País' },
            { type: 'INTERNACIONAL' as DestinationType, icon: Globe, label: 'Internacional' }
          ]).map(({ type, icon: Icon, label }) => (
            <button key={type} type="button" onClick={() => setDestination({...destination, tipoDestino: type})}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                ${destination.tipoDestino === type ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              <Icon size={24} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trajeto */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2"><Map size={18} className="text-green-600" /> Trajeto</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Origem</label>
            <input type="text" className={inputClass} placeholder="Ex: Belém - PA" value={destination.origem} onChange={e => setDestination({...destination, origem: e.target.value})} /></div>
          <div><label className={labelClass}>Destino</label>
            <input type="text" className={inputClass} placeholder="Ex: São Paulo - SP" value={destination.destino} onChange={e => setDestination({...destination, destino: e.target.value})} /></div>
        </div>
      </div>

      {/* Período */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2"><Calendar size={18} className="text-amber-600" /> Período</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClass}>Data Início</label>
            <input type="date" className={inputClass} value={destination.dataInicio} onChange={e => setDestination({...destination, dataInicio: e.target.value})} /></div>
          <div><label className={labelClass}>Data Término</label>
            <input type="date" className={inputClass} value={destination.dataFim} onChange={e => setDestination({...destination, dataFim: e.target.value})} /></div>
          <div className="flex items-end">
            <div className={`w-full px-4 py-3 rounded-xl font-bold text-center ${days > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
              {days > 0 ? `${days} dia${days > 1 ? 's' : ''}` : 'Selecione datas'}
            </div>
          </div>
        </div>
      </div>

      {/* Motivo */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2"><FileText size={18} className="text-purple-600" /> Objetivo</h4>
        <textarea rows={3} className={`${inputClass} resize-none`} placeholder="Descreva o motivo e objetivo da viagem..."
          value={destination.motivo} onChange={e => setDestination({...destination, motivo: e.target.value})} />
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={() => setCurrentStep(2)} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200">
          <ArrowLeft size={20} /> Voltar
        </button>
        <button type="button" onClick={() => setCurrentStep(4)} 
          disabled={!destination.tipoDestino || !destination.origem || !destination.destino || !destination.dataInicio || !destination.dataFim || !destination.motivo}
          className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
            ${destination.tipoDestino && destination.origem && destination.destino && destination.dataInicio && destination.dataFim && destination.motivo
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          Próximo <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  // Step 4: Attachments
  const renderStep4 = () => (
    <div className="space-y-6 py-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Anexos</h3>
        <p className="text-gray-500">Anexe documentos relevantes (opcional)</p>
        {/* Tooltip informativo */}
        <div className="mt-3 mx-auto max-w-md bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 text-left">
            <strong>Dica:</strong> Você pode anexar documentos como Certidão de Atesto, 
            comprovantes de viagem, convites de eventos, e outros documentos relevantes.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2"><Paperclip size={18} className="text-blue-600" /> Documentos</h4>
        
        <div onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
          <div className="w-14 h-14 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center">
            <Upload size={28} className="text-indigo-600" />
          </div>
          <p className="text-gray-700 font-medium">Clique para selecionar arquivos</p>
          <p className="text-gray-400 text-sm mt-1">PDF, JPG, PNG (máx. 10MB)</p>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
        </div>

        {attachments.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-bold text-gray-600">{attachments.length} arquivo(s)</p>
            {attachments.map(att => (
              <div key={att.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  {att.preview ? <Image size={20} className="text-green-500" /> : <File size={20} className="text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{att.name}</p>
                  <p className="text-sm text-gray-500">{(att.size / 1024).toFixed(1)} KB</p>
                </div>
                <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="p-2 text-gray-400 hover:text-red-500">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={() => setCurrentStep(3)} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200">
          <ArrowLeft size={20} /> Voltar
        </button>
        <button type="button" onClick={() => setCurrentStep(5)} className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
          Próximo <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  // Step 5: Confirmation
  const renderStep5 = () => (
    <div className="space-y-6 py-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar Solicitação</h3>
        <p className="text-gray-500">Revise os dados antes de enviar</p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Tipo */}
        <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-500 uppercase font-bold">Tipo de Solicitação</span>
            <p className="font-bold text-gray-800 flex items-center gap-2">
              {requestType === 'DIARIA' ? <Briefcase size={16} className="text-indigo-600" /> : <Plane size={16} className="text-purple-600" />}
              {requestType === 'DIARIA' ? 'Diárias' : 'Passagens Aéreas'}
            </p>
          </div>
          <button type="button" onClick={() => setCurrentStep(1)} className="text-indigo-600 text-sm font-medium flex items-center gap-1">
            <Edit size={14} /> Editar
          </button>
        </div>

        {/* Solicitante */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-500 uppercase font-bold">Solicitante</span>
            <button type="button" onClick={() => setCurrentStep(2)} className="text-indigo-600 text-sm font-medium flex items-center gap-1">
              <Edit size={14} /> Editar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{requester.nome}</span></div>
            <div><span className="text-gray-500">E-mail:</span> <span className="font-medium">{requester.email}</span></div>
            <div><span className="text-gray-500">Lotação:</span> <span className="font-medium">{requester.lotacao}</span></div>
            <div><span className="text-gray-500">Gestor:</span> <span className="font-medium">{requester.gestor_nome}</span></div>
          </div>
        </div>

        {/* Destino */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-500 uppercase font-bold">Destino</span>
            <button type="button" onClick={() => setCurrentStep(3)} className="text-indigo-600 text-sm font-medium flex items-center gap-1">
              <Edit size={14} /> Editar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Tipo:</span> <span className="font-medium">{DESTINATION_TYPE_LABELS[destination.tipoDestino as DestinationType] || '-'}</span></div>
            <div><span className="text-gray-500">Trajeto:</span> <span className="font-medium">{destination.origem} → {destination.destino}</span></div>
            <div><span className="text-gray-500">Período:</span> <span className="font-medium">{formatDate(destination.dataInicio)} a {formatDate(destination.dataFim)}</span></div>
            <div><span className="text-gray-500">Dias:</span> <span className="font-bold text-indigo-600">{days} dia{days > 1 ? 's' : ''}</span></div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-gray-500 text-sm">Objetivo:</span>
            <p className="text-gray-800 text-sm mt-1">{destination.motivo}</p>
          </div>
        </div>

        {/* Anexos */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 uppercase font-bold">Anexos</span>
            <button type="button" onClick={() => setCurrentStep(4)} className="text-indigo-600 text-sm font-medium flex items-center gap-1">
              <Edit size={14} /> Editar
            </button>
          </div>
          <p className="text-sm text-gray-600">{attachments.length > 0 ? `${attachments.length} arquivo(s) anexado(s)` : 'Nenhum anexo'}</p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={() => setCurrentStep(4)} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200">
          <ArrowLeft size={20} /> Voltar
        </button>
        <button type="button" onClick={handleRequestSignature} disabled={isSubmitting}
          className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 shadow-lg disabled:opacity-50">
          {isSubmitting ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Assinando...</> 
            : <><Lock size={20} /> Assinar e Enviar</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <button onClick={onCancel} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 font-medium">
        <ArrowLeft size={20} /> Voltar ao Portal
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">Nova Solicitação de {requestType === 'PASSAGEM' ? 'Passagem' : 'Diárias'}</h2>
          <p className="text-indigo-200">Preencha os dados do formulário em 5 etapas</p>
        </div>

        <StepIndicator />

        <div className="px-6 pb-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>
      </div>

      {/* PIN Signature Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                <Key size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Assinatura Eletrônica</h3>
              <p className="text-gray-500 mt-2">Digite seu PIN para assinar e enviar a solicitação</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-2">PIN de Assinatura</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-3 text-center text-2xl tracking-widest border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none
                    ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  autoFocus
                />
                {pinError && (
                  <p className="text-red-500 text-sm mt-2 text-center">{pinError}</p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 4}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2
                    ${pin.length === 4 ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  <CheckCircle size={18} /> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewRequestWizard;

import React from 'react';
import { 
  ArrowLeft, Send, Briefcase, Plane, User, MapPin, Calendar, 
  Paperclip, CheckCircle, Edit, FileText, CreditCard 
} from 'lucide-react';
import { WizardFormData, REQUEST_TYPE_LABELS, DESTINATION_TYPE_LABELS, DestinationType } from '../types';

interface Step5Props {
  data: WizardFormData;
  onSubmit: () => void;
  onBack: () => void;
  onEditStep: (step: number) => void;
  isSubmitting: boolean;
}

export const Step5Confirmation: React.FC<Step5Props> = ({ 
  data, 
  onSubmit, 
  onBack, 
  onEditStep,
  isSubmitting 
}) => {
  const isDiaria = data.requestType === 'DIARIA';
  
  // Calculate days
  const calculateDays = () => {
    if (data.destination.dataInicio && data.destination.dataFim) {
      const start = new Date(data.destination.dataInicio);
      const end = new Date(data.destination.dataFim);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  const days = calculateDays();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const SectionCard: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    step: number;
    children: React.ReactNode 
  }> = ({ title, icon, step, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onEditStep(step)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          <Edit size={14} /> Editar
        </button>
      </div>
      {children}
    </div>
  );

  const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 uppercase font-medium">{label}</span>
      <p className="text-gray-800 font-medium">{value || '-'}</p>
    </div>
  );

  return (
    <div className="py-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirmar Solicitação</h2>
        <p className="text-gray-500">Revise os dados antes de enviar</p>
      </div>

      {/* Step 1: Tipo */}
      <SectionCard 
        title="Tipo de Solicitação" 
        icon={isDiaria ? <Briefcase className="text-blue-600" size={20} /> : <Plane className="text-purple-600" size={20} />}
        step={1}
      >
        <div className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold
          ${isDiaria ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
        `}>
          {isDiaria ? <Briefcase size={18} /> : <Plane size={18} />}
          {REQUEST_TYPE_LABELS[data.requestType as 'DIARIA' | 'PASSAGEM']}
        </div>
      </SectionCard>

      {/* Step 2: Dados do Solicitante */}
      <SectionCard 
        title="Dados do Solicitante" 
        icon={<User className="text-blue-600" size={20} />}
        step={2}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <InfoRow label="Nome" value={data.requester.nome} />
          <InfoRow label="E-mail" value={data.requester.email} />
          <InfoRow label="CPF" value={data.requester.cpf} />
          <InfoRow label="Matrícula" value={data.requester.matricula} />
          <InfoRow label="Cargo" value={data.requester.cargo} />
          <InfoRow label="Vínculo" value={data.requester.vinculo} />
          <InfoRow label="Telefone" value={data.requester.telefone} />
          <InfoRow label="Lotação" value={data.requester.lotacao} />
          <InfoRow label="Município" value={data.requester.municipio} />
          <InfoRow label="Gestor" value={data.requester.gestor_nome} />
        </div>
        
        {data.requester.banco && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-bold text-gray-600 flex items-center gap-2 mb-3">
              <CreditCard size={16} /> Dados Bancários
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <InfoRow label="Banco" value={data.requester.banco} />
              <InfoRow label="Agência" value={data.requester.agencia} />
              <InfoRow label="Conta" value={data.requester.conta_corrente} />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Step 3: Destino */}
      <SectionCard 
        title="Destino da Viagem" 
        icon={<MapPin className="text-green-600" size={20} />}
        step={3}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <InfoRow 
            label="Tipo de Destino" 
            value={data.destination.tipoDestino ? DESTINATION_TYPE_LABELS[data.destination.tipoDestino as DestinationType] : '-'} 
          />
          <InfoRow label="Origem" value={data.destination.origem} />
          <InfoRow label="Destino" value={data.destination.destino} />
          <div className="flex gap-4">
            <div className="flex-1">
              <InfoRow label="Data Início" value={formatDate(data.destination.dataInicio)} />
            </div>
            <div className="flex-1">
              <InfoRow label="Data Fim" value={formatDate(data.destination.dataFim)} />
            </div>
          </div>
        </div>
        
        {days > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-center gap-3">
            <Calendar className="text-blue-600" size={20} />
            <span className="text-blue-700 font-bold">{days} dia{days > 1 ? 's' : ''} de viagem</span>
          </div>
        )}

        {data.destination.motivo && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="text-xs text-gray-500 uppercase font-medium">Objetivo</span>
            <p className="text-gray-800 mt-1">{data.destination.motivo}</p>
          </div>
        )}
      </SectionCard>

      {/* Step 4: Anexos */}
      <SectionCard 
        title="Anexos" 
        icon={<Paperclip className="text-amber-600" size={20} />}
        step={4}
      >
        {data.attachments.length > 0 ? (
          <div className="space-y-2">
            {data.attachments.map(att => (
              <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText size={20} className="text-gray-500" />
                <span className="text-gray-800 font-medium">{att.name}</span>
                <span className="text-gray-400 text-sm">({(att.size / 1024).toFixed(1)} KB)</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Nenhum anexo adicionado</p>
        )}
      </SectionCard>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all disabled:opacity-50"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`
            px-8 py-3 rounded-xl font-bold flex items-center gap-2 
            bg-green-600 text-white hover:bg-green-700 
            transition-all shadow-lg shadow-green-200
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send size={20} /> Enviar Solicitação
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step5Confirmation;

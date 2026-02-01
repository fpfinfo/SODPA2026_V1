import React, { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { useToast } from '../../ui/ToastProvider';
import { supabase } from '../../../lib/supabaseClient';

import { StepIndicator } from './StepIndicator';
import { Step1TypeSelection } from './steps/Step1TypeSelection';
import { Step2RequesterData } from './steps/Step2RequesterData';
import { Step3Destination } from './steps/Step3Destination';
import { Step4Attachments } from './steps/Step4Attachments';
import { Step5Confirmation } from './steps/Step5Confirmation';

import { WizardFormData, RequestType, RequesterData, DestinationData, AttachmentFile } from './types';

interface RequestWizardProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const STEP_LABELS = ['Tipo', 'Solicitante', 'Destino', 'Anexos', 'Confirmação'];

const initialRequesterData: RequesterData = {
  nome: '',
  email: '',
  cpf: '',
  matricula: '',
  cargo: '',
  vinculo: '',
  telefone: '',
  lotacao: '',
  municipio: '',
  gestor_nome: '',
  gestor_email: '',
  banco: '',
  agencia: '',
  conta_corrente: ''
};

const initialDestinationData: DestinationData = {
  tipoDestino: '',
  origem: '',
  destino: '',
  dataInicio: '',
  dataFim: '',
  motivo: ''
};

export const RequestWizard: React.FC<RequestWizardProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile(user);
  const { showToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<WizardFormData>({
    requestType: '',
    requester: initialRequesterData,
    destination: initialDestinationData,
    attachments: []
  });

  // Pre-fill requester data from user profile
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        requester: {
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
        }
      }));
    }
  }, [userProfile]);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Calculate days
      const start = new Date(formData.destination.dataInicio);
      const end = new Date(formData.destination.dataFim);
      const dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Create the request in database
      const { data: newRequest, error } = await supabase
        .from('sodpa_requests')
        .insert({
          tipo: formData.requestType,
          status: 'ENVIADO',
          destino_atual: 'SODPA', // Route to SODPA inbox
          solicitante_id: user?.id,
          solicitante_nome: formData.requester.nome,
          solicitante_email: formData.requester.email,
          solicitante_cpf: formData.requester.cpf,
          solicitante_matricula: formData.requester.matricula,
          solicitante_cargo: formData.requester.cargo,
          solicitante_vinculo: formData.requester.vinculo,
          solicitante_telefone: formData.requester.telefone,
          solicitante_lotacao: formData.requester.lotacao,
          solicitante_municipio: formData.requester.municipio,
          gestor_nome: formData.requester.gestor_nome,
          gestor_email: formData.requester.gestor_email,
          banco: formData.requester.banco,
          agencia: formData.requester.agencia,
          conta_corrente: formData.requester.conta_corrente,
          tipo_destino: formData.destination.tipoDestino,
          origem: formData.destination.origem,
          destino: formData.destination.destino,
          data_inicio: formData.destination.dataInicio,
          data_fim: formData.destination.dataFim,
          dias: dias,
          motivo: formData.destination.motivo,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-generate Capa and Requerimento (Virtual Documents)
      if (newRequest?.id) {
        const autoDocs = [
          {
            request_id: newRequest.id,
            file_name: 'CAPA_DO_PROCESSO.pdf',
            file_path: 'AUTO_GENERATED/CAPA',
            file_type: 'AUTO_CAPA',
            file_size: 156000, // Simulated size
            created_at: new Date(Date.now() - 2000).toISOString() // Created before attachments
          },
          {
            request_id: newRequest.id,
            file_name: `REQUERIMENTO_DE_${newRequest.tipo}_${new Date().getFullYear()}.pdf`,
            file_path: 'AUTO_GENERATED/REQUERIMENTO',
            file_type: 'AUTO_REQ',
            file_size: 245000,
            created_at: new Date(Date.now() - 1000).toISOString()
          }
        ];
        
        const { error: autoDocError } = await supabase
          .from('sodpa_attachments')
          .insert(autoDocs);
          
        if (autoDocError) {
          console.error('Error generating auto-docs:', autoDocError);
          showToast({
            type: 'error',
            title: 'Erro na geração automática',
            message: 'Capa e Requerimento não foram criados. Contate o suporte.'
          });
        }
      }

      // Upload attachments if any
      if (formData.attachments.length > 0 && newRequest?.id) {
        for (const attachment of formData.attachments) {
          const filePath = `sodpa/${newRequest.id}/${attachment.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, attachment.file);

          if (uploadError) {
            console.error('Error uploading attachment:', uploadError);
          } else {
            // Save attachment reference
            await supabase.from('sodpa_attachments').insert({
              request_id: newRequest.id,
              file_name: attachment.name,
              file_path: filePath,
              file_size: attachment.size,
              file_type: attachment.type
            });
          }
        }
      }

      showToast({
        type: 'success',
        title: 'Solicitação Enviada!',
        message: `Sua solicitação de ${formData.requestType === 'DIARIA' ? 'diárias' : 'passagem'} foi registrada com sucesso.`
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      showToast({
        type: 'error',
        title: 'Erro ao enviar',
        message: error.message || 'Não foi possível enviar a solicitação. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Nova Solicitação de {formData.requestType === 'PASSAGEM' ? 'Passagem' : 'Diárias'}
            </h1>
            <p className="text-sm text-gray-500">Preencha os dados do formulário</p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </header>

      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-100">
        <StepIndicator 
          currentStep={currentStep} 
          totalSteps={5} 
          stepLabels={STEP_LABELS} 
        />
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6">
        {currentStep === 1 && (
          <Step1TypeSelection
            value={formData.requestType}
            onChange={(type) => setFormData({ ...formData, requestType: type })}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <Step2RequesterData
            value={formData.requester}
            onChange={(data) => setFormData({ ...formData, requester: data })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <Step3Destination
            value={formData.destination}
            onChange={(data) => setFormData({ ...formData, destination: data })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <Step4Attachments
            value={formData.attachments}
            onChange={(files) => setFormData({ ...formData, attachments: files })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 5 && (
          <Step5Confirmation
            data={formData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            onEditStep={handleEditStep}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  );
};

export default RequestWizard;

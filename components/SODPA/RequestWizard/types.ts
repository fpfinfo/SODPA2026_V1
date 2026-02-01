// Types for the Request Wizard

export type RequestType = 'DIARIA' | 'PASSAGEM';

export type DestinationType = 'ESTADO' | 'PAIS' | 'INTERNACIONAL';

export interface RequesterData {
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

export interface DestinationData {
  tipoDestino: DestinationType | '';
  origem: string;
  destino: string;
  dataInicio: string;
  dataFim: string;
  motivo: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string;
}

export interface WizardFormData {
  // Step 1
  requestType: RequestType | '';
  
  // Step 2
  requester: RequesterData;
  
  // Step 3
  destination: DestinationData;
  
  // Step 4
  attachments: AttachmentFile[];
}

export const DESTINATION_TYPE_LABELS: Record<DestinationType, string> = {
  ESTADO: 'No Estado (Pará)',
  PAIS: 'No País (Fora do Pará)',
  INTERNACIONAL: 'Internacional'
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  DIARIA: 'Diárias',
  PASSAGEM: 'Passagens Aéreas'
};

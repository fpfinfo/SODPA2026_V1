// PRESIDENCIA Module Types
import { Request } from '../../types';

export interface PresidencyAdvisor {
  id: string;
  name: string;
  cargo: string;
  email: string;
  avatarUrl: string;
  isActive: boolean;
  activeProcesses: number;
  capacity: number;
}

export interface ActiveTraveler {
  id: string;
  name: string;
  role: string;
  location: string;
  coords: { top: string; left: string };
  status: 'SAFE' | 'RISK' | 'RETURNING';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  since: string;
  riskReason?: string;
  returnDate?: string;
}

// Equipe do Gabinete da Presidência
export const PRESIDENCY_TEAM: PresidencyAdvisor[] = [
  {
    id: 'pres_chief',
    name: 'Des. Maria de Nazaré Silva',
    cargo: 'Presidente do Tribunal',
    email: 'presidencia@tjpa.jus.br',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    isActive: true,
    activeProcesses: 0,
    capacity: 0
  },
  {
    id: 'pres_advisor01',
    name: 'Dr. Fernando Magalhães',
    cargo: 'Assessor Chefe',
    email: 'assessor.chefe@tjpa.jus.br',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop',
    isActive: true,
    activeProcesses: 5,
    capacity: 60
  },
  {
    id: 'pres_advisor02',
    name: 'Dra. Beatriz Souza',
    cargo: 'Assessora de Gabinete',
    email: 'assessor02@tjpa.jus.br',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
    isActive: true,
    activeProcesses: 3,
    capacity: 35
  }
];

// Magistrados/Servidores em Deslocamento (Mapa)
export const ACTIVE_TRAVELERS: ActiveTraveler[] = [
  { 
    id: '1', 
    name: 'Des. Lúcia Fátima', 
    role: 'Vice-Presidência', 
    location: 'Brasília - DF', 
    coords: { top: '55%', left: '38%' },
    status: 'SAFE', 
    riskLevel: 'LOW', 
    since: '20/01/2024' 
  },
  { 
    id: '2', 
    name: 'Juiz Roberto Valente', 
    role: 'Vara Agrária', 
    location: 'São Paulo - SP', 
    coords: { top: '65%', left: '42%' }, 
    status: 'SAFE', 
    riskLevel: 'LOW', 
    since: '04/02/2024' 
  },
  { 
    id: '3', 
    name: 'Des. Antonio Santos', 
    role: 'Gabinete Des.', 
    location: 'Rio de Janeiro - RJ', 
    coords: { top: '62%', left: '44%' }, 
    status: 'RISK', 
    riskLevel: 'HIGH', 
    since: '05/02/2024', 
    riskReason: 'Alerta de Segurança Pública (GSI)' 
  },
  { 
    id: '4', 
    name: 'Dra. Maria Clara', 
    role: 'Corregedoria', 
    location: 'Lisboa - Portugal', 
    coords: { top: '25%', left: '85%' }, 
    status: 'RETURNING', 
    riskLevel: 'LOW', 
    since: '01/02/2024',
    returnDate: '2024-02-10'
  },
];

// Solicitações Interestaduais (Presidência)
export const MOCK_PRESIDENCY_REQUESTS: Request[] = [
  {
    id: 'p1',
    protocol: 'TJPA-EXT-2024-8821',
    type: 'PASSAGEM',
    category: 'MAGISTRADO',
    requesterName: 'Des. Antonio Santos',
    requesterSector: 'Gabinete Desembargador',
    dateCreated: '2024-02-05T10:00:00Z',
    status: 'EM_ANALISE_PRESIDENCIA',
    description: 'Participação na posse da nova diretoria do CNJ.',
    destination: 'Brasília - DF',
    isInterstate: true,
    value: 4500.00,
    deadline: '2024-02-08',
    legalOpinion: 'Regularidade certificada conforme portaria CNJ 23/2023.'
  },
  {
    id: 'p2',
    protocol: 'TJPA-EXT-2024-8840',
    type: 'DIARIA',
    category: 'MAGISTRADO',
    requesterName: 'Juiz Roberto Valente',
    requesterSector: 'Vara Agrária de Altamira',
    dateCreated: '2024-02-04T14:30:00Z',
    status: 'EM_ANALISE_PRESIDENCIA',
    description: 'Workshop Internacional de Direito Ambiental.',
    destination: 'São Paulo - SP',
    isInterstate: true,
    value: 3200.00,
    deadline: '2024-02-20'
  },
  {
    id: 'p3',
    protocol: 'TJPA-EXT-2024-8100',
    type: 'PASSAGEM',
    category: 'MAGISTRADO',
    requesterName: 'Des. Lúcia Fátima',
    requesterSector: 'Vice-Presidência',
    dateCreated: '2024-01-20T09:00:00Z',
    status: 'APROVADO',
    description: 'Visita Institucional ao STF.',
    destination: 'Brasília - DF',
    isInterstate: true,
    value: 2800.00,
    deadline: '2024-02-05'
  },
  {
    id: 'p4',
    protocol: 'TJPA-EXT-2024-8902',
    type: 'PASSAGEM',
    category: 'MAGISTRADO',
    requesterName: 'Des. Carlos Eduardo',
    requesterSector: 'Corregedoria Geral',
    dateCreated: '2024-02-06T08:00:00Z',
    status: 'EM_ANALISE_PRESIDENCIA',
    description: 'Reunião do Conselho Nacional de Corregedores.',
    destination: 'Florianópolis - SC',
    isInterstate: true,
    value: 5200.00,
    deadline: '2024-02-15'
  }
];

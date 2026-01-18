import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export interface ProcessData {
  id: string;
  nup: string;
  tipo: string;
  status: string;
  valor_total: number;
  valor_solicitado?: number;
  descricao: string;
  data_inicio?: string;
  data_fim?: string;
  urgencia?: string;
  comarca_destino?: string;
  processo_judicial?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  
  // Related data
  id_usuario?: string;
  suprido_nome?: string;
  suprido_cargo?: string;
  unidade?: string;
  comarca?: string;
  lotacao?: string | null;
  servidor_dados?: {
    cpf?: string;
    vinculo?: string;
    categoria?: string;
    grau?: string;
    entrancia?: string;
    polo?: string;
    regiao?: string;
  };
  dados_bancarios?: {
    bankName: string;
    bankCode?: string;
    agency: string;
    account: string;
    pix?: string;
  };
  items?: Array<{
    element: string;
    description: string;
    value: number;
    budgetAction?: string;
    allocation?: string;
  }>;
  gestor?: {
    nome: string;
    email: string;
  };
  
  // Júri specific
  juri_participantes?: number;
  juri_dias?: number;
  juri_frequencia_refeicoes?: string;
  juri_projecao_custos?: any[];
}

interface UseProcessDetailsReturn {
  processData: ProcessData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useProcessDetails = (processId: string): UseProcessDetailsReturn => {
  const [processData, setProcessData] = useState<ProcessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProcessData = async () => {
    if (!processId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('solicitacoes')
        .select(`
          *,
          profiles:user_id (
            nome,
            cargo,
            unidade_id,
            comarca_id,
            email,
            banco,
            agencia,
            conta_corrente,
            gestor_nome,
            gestor_email
          )
        `)
        .eq('id', processId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        // Flatten profile data
        const profileData = data.profiles as any;
        let lotacao = null;
        let bankName = null;
        let agency = null;
        let account = null;
        let managerName = null;
        let managerEmail = null;
        let cargo = null;
        let servidorExtras: any = {};

        // Fetch lotacao AND bank data AND manager data from servidores_tj using email
        if (profileData?.email) {
          const { data: servidorData } = await supabase
            .from('servidores_tj')
            .select('lotacao, cargo, banco, agencia, conta_corrente, gestor_nome, gestor_email, cpf, vinculo, categoria, grau, entrancia, polo, regiao')
            .eq('email', profileData.email)
            .maybeSingle();
          
          lotacao = servidorData?.lotacao;
          // Prioritize cargo from servidores_tj if available
          cargo = servidorData?.cargo;
          
          bankName = servidorData?.banco;
          agency = servidorData?.agencia;
          account = servidorData?.conta_corrente;
          managerName = servidorData?.gestor_nome;
          managerEmail = servidorData?.gestor_email;

          // Store extras
          servidorExtras = {
             cpf: servidorData?.cpf,
             vinculo: servidorData?.vinculo,
             categoria: servidorData?.categoria,
             grau: servidorData?.grau,
             entrancia: servidorData?.entrancia,
             polo: servidorData?.polo,
             regiao: servidorData?.regiao
          };
        }

        // Fallback to profile data if not found in servidores_tj
        bankName = bankName || profileData?.banco;
        agency = agency || profileData?.agencia;
        account = account || profileData?.conta_corrente;
        cargo = cargo || profileData?.cargo;
        // lotacao is typically only in servidores_tj or manually mapped in profiles using a different field?
        // Assuming lotacao logic is fine (servidorData?.lotacao or null).

        const flattenedData: ProcessData = {
          ...data,
          suprido_nome: profileData?.nome,
          suprido_cargo: cargo,
          unidade: profileData?.unidade_id,
          comarca: profileData?.comarca_id,
          lotacao: lotacao,
          servidor_dados: servidorExtras, // Adding new object
          dados_bancarios: data.dados_bancarios || (bankName ? {
            bankName: bankName,
            agency: agency || '',
            account: account || ''
          } : undefined),
          gestor: (managerName || profileData?.gestor_nome) ? {
              nome: managerName || profileData?.gestor_nome,
              email: managerEmail || profileData?.gestor_email || 'N/A'
          } : undefined
        };
        
        setProcessData(flattenedData);
      }
    } catch (err) {
      console.error('Error fetching process data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessData();
  }, [processId]);

  return {
    processData,
    isLoading,
    error,
    refetch: fetchProcessData,
  };
};

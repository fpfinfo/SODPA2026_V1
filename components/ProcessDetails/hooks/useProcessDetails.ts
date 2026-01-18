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
  suprido_nome?: string;
  suprido_cargo?: string;
  unidade?: string;
  comarca?: string;
  lotacao?: string;
  
  // Extra fields (Added for SOSFU view parity)
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

        // Fetch lotacao AND bank data AND manager data from servidores_tj using email
        if (profileData?.email) {
          const { data: servidorData } = await supabase
            .from('servidores_tj')
            .select('lotacao, banco, agencia, conta_corrente, gestor_nome, gestor_email')
            .eq('email', profileData.email)
            .maybeSingle();
          
          lotacao = servidorData?.lotacao;
          bankName = servidorData?.banco;
          agency = servidorData?.agencia;
          account = servidorData?.conta_corrente;
          managerName = servidorData?.gestor_nome;
          managerEmail = servidorData?.gestor_email;
        }

        // Fallback to profile data if not found in servidores_tj
        bankName = bankName || profileData?.banco;
        agency = agency || profileData?.agencia;
        account = account || profileData?.conta_corrente;
        
        // Also fallback manager info from profile (if stored there) - note: columns might be different in profiles, checking standard
        // In SupridoDashboard it saves to profiles with SAME keys: gestor_nome, gestor_email.
        // But the VIEW select in line 80 didn't select them yet.
        // Since we didn't add them to line 80, we can't key off profileData for them unless we add them.
        // Assuming they are in profiles if saved there.
        // Let's add them to the select in line 80 too (implied, but I need to modify line 80? No, I am replacing lines 98-146 only).
        // I should probably edit line 80 separately or assume profileData access if I can't edit it here.
        // Actually, if I don't select them in line 80, profileData won't have them.
        // So I must prioritize servidores_tj OR I need to do another edit to select them.
        
        // However, I can try to access them if they ARE returned. `select *` in profiles linked? No, explicit list.
        // I need to add gestor_nome/email to the profiles select.
        
        // Strategy: I'll focus this replacement on the LOGIC. 
        // Then I will do a Second replacement to update the select list (lines 79-90).
        // Or I can force a fetch here? No, better to update the explicit select.
        
        // But wait, replace_file_content is single contiguous block.
        // Line 79-90 is far from 98.
        // I will do TWO replaces. First the logic (this tool call). Then the query.

        const flattenedData: ProcessData = {
          ...data,
          suprido_nome: profileData?.nome,
          suprido_cargo: profileData?.cargo,
          unidade: profileData?.unidade_id,
          comarca: profileData?.comarca_id,
          lotacao: lotacao,
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

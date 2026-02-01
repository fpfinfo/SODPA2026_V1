// ============================================================================
// useModuleInbox - Hook para receber processos tramitados nos módulos destino
// Suporta: SEFIN, SGP, PRESIDENCIA
// ============================================================================

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

export interface TramitadoProcess {
  id: string;
  tipo: 'DIARIA' | 'PASSAGEM';
  status: string;
  nup?: string;
  // Solicitante
  solicitanteId: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  solicitanteCargo?: string;
  solicitanteLotacao?: string;
  // Trip details
  tipoDestino: string;
  origem: string;
  destino: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
  motivo?: string;
  // Values
  valorTotal?: number;
  // Tramitation
  destinoAtual: string;
  historicoTramitacao: any[];
  // Meta
  createdAt: string;
  updatedAt?: string;
}

// Hook for SEFIN inbox (receives PASSAGEM within state)
export function useSEFINInbox() {
  return useModuleInbox('SEFIN');
}

// Hook for SGP inbox (receives DIARIA within state)
export function useSGPInbox() {
  return useModuleInbox('SGP');
}

// Hook for Presidência inbox (receives any request out of state/abroad)
export function usePresidenciaInbox() {
  return useModuleInbox('PRESIDENCIA');
}

// Generic module inbox hook
export function useModuleInbox(moduleName: 'SEFIN' | 'SGP' | 'PRESIDENCIA') {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'DIARIA' | 'PASSAGEM'>('ALL');

  const query = useQuery({
    queryKey: [`${moduleName.toLowerCase()}-inbox`, filter],
    queryFn: async () => {
      let query = supabase
        .from('sodpa_requests')
        .select('*')
        .eq('destino_atual', moduleName)
        .in('status', ['TRAMITADO', 'EM_ANALISE'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filter !== 'ALL') {
        query = query.eq('tipo', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Normalize data
      return (data || []).map(d => ({
        id: d.id,
        tipo: d.tipo as 'DIARIA' | 'PASSAGEM',
        status: d.status,
        nup: d.nup,
        solicitanteId: d.solicitante_id,
        solicitanteNome: d.solicitante_nome,
        solicitanteEmail: d.solicitante_email,
        solicitanteCargo: d.solicitante_cargo,
        solicitanteLotacao: d.solicitante_lotacao,
        tipoDestino: d.tipo_destino,
        origem: d.origem,
        destino: d.destino,
        dataInicio: d.data_inicio,
        dataFim: d.data_fim,
        dias: d.dias,
        motivo: d.motivo,
        valorTotal: d.valor_total,
        destinoAtual: d.destino_atual,
        historicoTramitacao: d.historico_tramitacao || [],
        createdAt: d.created_at,
        updatedAt: d.updated_at
      })) as TramitadoProcess[];
    },
    staleTime: 30 * 1000
  });

  // Approve request (move to next step or complete)
  const aprovar = useCallback(async (requestId: string, observacao?: string) => {
    try {
      // Get current request
      const { data: current, error: fetchError } = await supabase
        .from('sodpa_requests')
        .select('historico_tramitacao')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      const historico = current?.historico_tramitacao || [];
      
      const novaEntrada = {
        timestamp: new Date().toISOString(),
        modulo: moduleName,
        usuario_id: user?.id,
        acao: 'APROVADO',
        observacao: observacao || `Aprovado pelo ${moduleName}`
      };

      // Update request
      const { error: updateError } = await supabase
        .from('sodpa_requests')
        .update({
          status: 'APROVADO',
          historico_tramitacao: [...historico, novaEntrada],
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: [`${moduleName.toLowerCase()}-inbox`] });
      return true;
    } catch (err) {
      console.error(`[${moduleName} Inbox] Error approving:`, err);
      return false;
    }
  }, [user?.id, queryClient, moduleName]);

  // Return request to SODPA (devolver)
  const devolver = useCallback(async (requestId: string, motivo: string) => {
    try {
      const { data: current, error: fetchError } = await supabase
        .from('sodpa_requests')
        .select('historico_tramitacao')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      const historico = current?.historico_tramitacao || [];
      
      const novaEntrada = {
        timestamp: new Date().toISOString(),
        de: moduleName,
        para: 'SODPA',
        usuario_id: user?.id,
        acao: 'DEVOLVIDO',
        observacao: motivo
      };

      const { error: updateError } = await supabase
        .from('sodpa_requests')
        .update({
          status: 'RETORNO',
          destino_atual: 'SODPA',
          historico_tramitacao: [...historico, novaEntrada],
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: [`${moduleName.toLowerCase()}-inbox`] });
      return true;
    } catch (err) {
      console.error(`[${moduleName} Inbox] Error returning:`, err);
      return false;
    }
  }, [user?.id, queryClient, moduleName]);

  // Calculate stats
  const total = query.data?.length || 0;
  const totalDiarias = query.data?.filter(p => p.tipo === 'DIARIA').length || 0;
  const totalPassagens = query.data?.filter(p => p.tipo === 'PASSAGEM').length || 0;

  return {
    processos: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    total,
    totalDiarias,
    totalPassagens,
    filter,
    setFilter,
    aprovar,
    devolver,
    refetch: query.refetch
  };
}

export default useModuleInbox;

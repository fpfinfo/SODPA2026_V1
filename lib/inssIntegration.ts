/**
 * INSS Integration Service
 * Auto-saves PF service data to inss_retencao_records table
 */

import { supabase } from './supabaseClient';
import { InssRetentionRecord, ServiceProviderData, TaxCalculation } from '../types/taxIntegration';

interface SaveInssRecordParams {
  provider: ServiceProviderData;
  taxes: TaxCalculation;
  solicitacaoId: string;
  processoNumero: string;
  portariaSf?: string;
  comarca: string;
  dataPrestacao: string;
}

/**
 * Save INSS retention record to database
 * Called automatically when a PF expense (3.3.90.36) is submitted
 */
export async function saveInssRecord(params: SaveInssRecordParams): Promise<{ data: any; error: any }> {
  const {
    provider,
    taxes,
    solicitacaoId,
    processoNumero,
    portariaSf,
    comarca,
    dataPrestacao
  } = params;

  // Clean CPF (remove formatting)
  const cleanCpf = provider.cpf?.replace(/\D/g, '') || '';
  const cleanPisNit = provider.pisNit?.replace(/\D/g, '') || '';

  const record = {
    cpf: cleanCpf,
    nome_completo: provider.fullName,
    data_nascimento: provider.birthDate,
    pis_nit: cleanPisNit,
    valor_bruto: taxes.grossValue,
    inss_retido: taxes.inssRetained,
    inss_patronal: taxes.inssPatronal,
    iss_retido: taxes.issRetained,
    valor_liquido: taxes.netValue,
    solicitacao_id: solicitacaoId,
    processo_numero: processoNumero,
    portaria_sf: portariaSf || null,
    comarca: comarca,
    atividade: provider.serviceDescription,
    data_prestacao: dataPrestacao,
    status: 'PENDING'
  };

  console.log('[INSS Integration] Saving record:', record);

  const { data, error } = await supabase
    .from('inss_retencao_records')
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error('[INSS Integration] Error saving record:', error);
  } else {
    console.log('[INSS Integration] Record saved successfully:', data);
  }

  return { data, error };
}

/**
 * Update INSS record status (e.g., when GDR is paid)
 */
export async function updateInssRecordStatus(
  recordId: string, 
  status: 'PENDING' | 'PAID' | 'CANCELLED',
  gdrNumero?: string,
  gdrDataPagamento?: string
): Promise<{ data: any; error: any }> {
  const updateData: any = { status };
  
  if (gdrNumero) updateData.gdr_numero = gdrNumero;
  if (gdrDataPagamento) updateData.gdr_data_pagamento = gdrDataPagamento;

  const { data, error } = await supabase
    .from('inss_retencao_records')
    .update(updateData)
    .eq('id', recordId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get all INSS records for a specific solicitation
 */
export async function getInssRecordsBySolicitacao(solicitacaoId: string): Promise<{ data: any[]; error: any }> {
  const { data, error } = await supabase
    .from('inss_retencao_records')
    .select('*')
    .eq('solicitacao_id', solicitacaoId)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Get all pending INSS records (for GDR generation)
 */
export async function getPendingInssRecords(): Promise<{ data: any[]; error: any }> {
  const { data, error } = await supabase
    .from('inss_retencao_records')
    .select('*')
    .eq('status', 'PENDING')
    .order('data_prestacao', { ascending: true });

  return { data: data || [], error };
}

/**
 * Get INSS records with filters for the DataGrid
 */
export async function getInssRecords(filters?: {
  startDate?: string;
  endDate?: string;
  cpf?: string;
  comarca?: string;
  status?: 'PENDING' | 'PAID' | 'CANCELLED';
}): Promise<{ data: any[]; error: any }> {
  let query = supabase
    .from('inss_retencao_records')
    .select('*')
    .order('data_prestacao', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('data_prestacao', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('data_prestacao', filters.endDate);
  }
  if (filters?.cpf) {
    query = query.eq('cpf', filters.cpf.replace(/\D/g, ''));
  }
  if (filters?.comarca) {
    query = query.eq('comarca', filters.comarca);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  return { data: data || [], error };
}

/**
 * Calculate INSS ceiling check for a provider in a given month
 * Returns remaining contribution limit before reaching ceiling
 */
export async function checkProviderInssLimit(
  cpf: string, 
  month: number, 
  year: number,
  inssTetoAnual: number = 908.85 // 2025 ceiling per month
): Promise<{ totalContributed: number; remainingLimit: number; atCeiling: boolean }> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

  const { data, error } = await supabase
    .from('inss_retencao_records')
    .select('inss_retido')
    .eq('cpf', cpf.replace(/\D/g, ''))
    .gte('data_prestacao', startDate)
    .lte('data_prestacao', endDate);

  if (error) {
    console.error('[INSS Ceiling Check] Error:', error);
    return { totalContributed: 0, remainingLimit: inssTetoAnual, atCeiling: false };
  }

  const totalContributed = (data || []).reduce((sum, r) => sum + (r.inss_retido || 0), 0);
  const remainingLimit = Math.max(0, inssTetoAnual - totalContributed);
  const atCeiling = remainingLimit === 0;

  return { totalContributed, remainingLimit, atCeiling };
}

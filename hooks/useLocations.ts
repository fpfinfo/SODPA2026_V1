/**
 * useLocations Hook
 * Supabase CRUD operations for comarcas, municipios, lotacoes
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Comarca, Municipio, Lotacao, ComarcaStatus, LotacaoTipo } from '../types/locations';

interface UseLocationsReturn {
  // Data
  comarcas: Comarca[];
  municipios: Municipio[];
  lotacoes: Lotacao[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // CRUD Comarcas
  createComarca: (data: Partial<Comarca>) => Promise<Comarca | null>;
  updateComarca: (id: string, data: Partial<Comarca>) => Promise<boolean>;
  deleteComarca: (id: string) => Promise<boolean>;
  
  // CRUD Municipios
  createMunicipio: (data: Partial<Municipio>) => Promise<Municipio | null>;
  updateMunicipio: (id: string, data: Partial<Municipio>) => Promise<boolean>;
  deleteMunicipio: (id: string) => Promise<boolean>;
  
  // CRUD Lotações
  createLotacao: (data: Partial<Lotacao>) => Promise<Lotacao | null>;
  updateLotacao: (id: string, data: Partial<Lotacao>) => Promise<boolean>;
  deleteLotacao: (id: string) => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
}

export function useLocations(): UseLocationsReturn {
  const [comarcas, setComarcas] = useState<Comarca[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [lotacoes, setLotacoes] = useState<Lotacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Fetch comarcas (independent)
    try {
      const { data: comarcasData, error: comarcasError } = await supabase
        .from('comarcas')
        .select('*')
        .order('nome');
      
      if (comarcasError) throw comarcasError;
      setComarcas(comarcasData || []);
    } catch (err: any) {
      console.error('Error fetching comarcas:', err);
      setComarcas(MOCK_COMARCAS_FALLBACK);
    }

    // Fetch municipios (independent)
    try {
      const { data: municipiosData, error: municipiosError } = await supabase
        .from('municipios')
        .select('*')
        .order('nome');
      
      if (municipiosError) throw municipiosError;
      setMunicipios(municipiosData || []);
    } catch (err: any) {
      console.error('Error fetching municipios:', err);
      setMunicipios(MOCK_MUNICIPIOS_FALLBACK);
    }

    // Fetch lotações (independent)
    try {
      const { data: lotacoesData, error: lotacoesError } = await supabase
        .from('lotacoes')
        .select('*')
        .order('nome');
      
      if (lotacoesError) throw lotacoesError;
      setLotacoes(lotacoesData || []);
    } catch (err: any) {
      console.error('Error fetching lotacoes:', err);
      setError(err.message || 'Erro ao carregar lotações');
      setLotacoes(MOCK_LOTACOES_FALLBACK);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============ COMARCAS CRUD ============
  const createComarca = async (data: Partial<Comarca>): Promise<Comarca | null> => {
    try {
      const { data: created, error } = await supabase
        .from('comarcas')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      await fetchData();
      return created;
    } catch (err: any) {
      console.error('Error creating comarca:', err);
      setError(err.message);
      return null;
    }
  };

  const updateComarca = async (id: string, data: Partial<Comarca>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('comarcas')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error updating comarca:', err);
      setError(err.message);
      return false;
    }
  };

  const deleteComarca = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('comarcas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error deleting comarca:', err);
      setError(err.message);
      return false;
    }
  };

  // ============ MUNICIPIOS CRUD ============
  const createMunicipio = async (data: Partial<Municipio>): Promise<Municipio | null> => {
    try {
      const { data: created, error } = await supabase
        .from('municipios')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      await fetchData();
      return created;
    } catch (err: any) {
      console.error('Error creating municipio:', err);
      setError(err.message);
      return null;
    }
  };

  const updateMunicipio = async (id: string, data: Partial<Municipio>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('municipios')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error updating municipio:', err);
      setError(err.message);
      return false;
    }
  };

  const deleteMunicipio = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('municipios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error deleting municipio:', err);
      setError(err.message);
      return false;
    }
  };

  // ============ LOTACOES CRUD ============
  const createLotacao = async (data: Partial<Lotacao>): Promise<Lotacao | null> => {
    try {
      const { data: created, error } = await supabase
        .from('lotacoes')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      await fetchData();
      return created;
    } catch (err: any) {
      console.error('Error creating lotacao:', err);
      setError(err.message);
      return null;
    }
  };

  const updateLotacao = async (id: string, data: Partial<Lotacao>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lotacoes')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error updating lotacao:', err);
      setError(err.message);
      return false;
    }
  };

  const deleteLotacao = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lotacoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error deleting lotacao:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    comarcas,
    municipios,
    lotacoes,
    isLoading,
    error,
    createComarca,
    updateComarca,
    deleteComarca,
    createMunicipio,
    updateMunicipio,
    deleteMunicipio,
    createLotacao,
    updateLotacao,
    deleteLotacao,
    refresh: fetchData,
  };
}

// ============ FALLBACK MOCK DATA ============
// Used when Supabase tables don't exist yet

const MOCK_COMARCAS_FALLBACK: Comarca[] = [
  { id: '1', codigo: 'BEL', nome: 'Comarca de Belém', entrancia: '3ª Entrância', varas: 45, teto_anual: 60000, dist_elemento_30_01: 15, dist_elemento_30_02: 30, dist_elemento_33: 20, dist_elemento_36: 20, dist_elemento_39: 15, status: 'ATIVA' },
  { id: '2', codigo: 'ANA', nome: 'Comarca de Ananindeua', entrancia: '3ª Entrância', varas: 8, teto_anual: 48000, dist_elemento_30_01: 20, dist_elemento_30_02: 25, dist_elemento_33: 20, dist_elemento_36: 20, dist_elemento_39: 15, status: 'ATIVA' },
  { id: '3', codigo: 'SAN', nome: 'Comarca de Santarém', entrancia: '3ª Entrância', varas: 12, teto_anual: 48000, dist_elemento_30_01: 25, dist_elemento_30_02: 25, dist_elemento_33: 20, dist_elemento_36: 15, dist_elemento_39: 15, status: 'ATIVA' },
  { id: '4', codigo: 'MAR', nome: 'Comarca de Marabá', entrancia: '3ª Entrância', varas: 10, teto_anual: 42000, dist_elemento_30_01: 25, dist_elemento_30_02: 25, dist_elemento_33: 25, dist_elemento_36: 15, dist_elemento_39: 10, status: 'ATIVA' },
  { id: '5', codigo: 'PAR', nome: 'Comarca de Parauapebas', entrancia: '2ª Entrância', varas: 6, teto_anual: 36000, dist_elemento_30_01: 30, dist_elemento_30_02: 20, dist_elemento_33: 20, dist_elemento_36: 15, dist_elemento_39: 15, status: 'ATIVA' },
  { id: '6', codigo: 'CAS', nome: 'Comarca de Castanhal', entrancia: '2ª Entrância', varas: 5, teto_anual: 36000, dist_elemento_30_01: 25, dist_elemento_30_02: 25, dist_elemento_33: 20, dist_elemento_36: 15, dist_elemento_39: 15, status: 'ATIVA' },
  { id: '7', codigo: 'MDR', nome: 'Comarca de Mãe do Rio', entrancia: '1ª Entrância', varas: 2, teto_anual: 24000, dist_elemento_30_01: 30, dist_elemento_30_02: 25, dist_elemento_33: 20, dist_elemento_36: 15, dist_elemento_39: 10, status: 'SEM_SUPRIDO' },
  { id: '8', codigo: 'TUC', nome: 'Comarca de Tucuruí', entrancia: '2ª Entrância', varas: 4, teto_anual: 30000, dist_elemento_30_01: 25, dist_elemento_30_02: 25, dist_elemento_33: 25, dist_elemento_36: 15, dist_elemento_39: 10, status: 'ATIVA' },
  { id: '9', codigo: 'ALT', nome: 'Comarca de Altamira', entrancia: '2ª Entrância', varas: 5, teto_anual: 36000, dist_elemento_30_01: 30, dist_elemento_30_02: 20, dist_elemento_33: 25, dist_elemento_36: 15, dist_elemento_39: 10, status: 'ATIVA' },
  { id: '10', codigo: 'ABA', nome: 'Comarca de Abaetetuba', entrancia: '2ª Entrância', varas: 4, teto_anual: 30000, dist_elemento_30_01: 25, dist_elemento_30_02: 25, dist_elemento_33: 25, dist_elemento_36: 15, dist_elemento_39: 10, status: 'ATIVA' },
];

const MOCK_MUNICIPIOS_FALLBACK: Municipio[] = [
  { id: '1', codigo_ibge: '1501402', nome: 'Belém', comarca_id: '1', populacao: 1499641 },
  { id: '2', codigo_ibge: '1500800', nome: 'Ananindeua', comarca_id: '2', populacao: 535547 },
  { id: '3', codigo_ibge: '1506807', nome: 'Santarém', comarca_id: '3', populacao: 306480 },
  { id: '4', codigo_ibge: '1504208', nome: 'Marabá', comarca_id: '4', populacao: 283542 },
  { id: '5', codigo_ibge: '1505536', nome: 'Parauapebas', comarca_id: '5', populacao: 212749 },
];

const MOCK_LOTACOES_FALLBACK: Lotacao[] = [
  { id: '1', codigo: 'SOSFU', nome: 'Serviço de Suprimento de Fundos', tipo: 'ADMINISTRATIVA' },
  { id: '2', codigo: 'SEPLAN', nome: 'Secretaria de Planejamento, Coordenação e Finanças', tipo: 'ADMINISTRATIVA' },
  { id: '3', codigo: 'SGP', nome: 'Secretaria de Gestão de Pessoas', tipo: 'ADMINISTRATIVA' },
  { id: '4', codigo: 'AJSEPLAN', nome: 'Assessoria Jurídica da SEPLAN', tipo: 'ADMINISTRATIVA' },
  { id: '5', codigo: 'CMCBEL', nome: 'Central de Mandados de Belém', tipo: 'JURISDICIONAL', comarca_id: '1' },
];

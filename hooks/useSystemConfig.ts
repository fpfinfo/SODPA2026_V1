import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SystemConfigRow {
  id: string;
  chave: string;
  valor: string;
  tipo: 'string' | 'number' | 'boolean';
  descricao: string | null;
  categoria: string;
}

export interface SystemConfig {
  limit_value: number;
  meal_lunch: number;
  meal_dinner: number;
  meal_snack: number;
  juri_servidores: number;
  juri_defensor: number;
  juri_promotor: number;
  juri_policias: number;
  maintenance_mode: boolean;
}

const DEFAULT_CONFIG: SystemConfig = {
  limit_value: 15000,
  meal_lunch: 30,
  meal_dinner: 25,
  meal_snack: 10,
  juri_servidores: 7,
  juri_defensor: 2,
  juri_promotor: 2,
  juri_policias: 5,
  maintenance_mode: false,
};

function parseValue(valor: string, tipo: string): any {
  switch (tipo) {
    case 'number':
      return parseFloat(valor) || 0;
    case 'boolean':
      return valor === 'true';
    default:
      return valor;
  }
}

function serializeValue(value: any): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('system_config')
        .select('*');

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const parsed: Partial<SystemConfig> = {};
        data.forEach((row: SystemConfigRow) => {
          const key = row.chave as keyof SystemConfig;
          if (key in DEFAULT_CONFIG) {
            (parsed as any)[key] = parseValue(row.valor, row.tipo);
          }
        });
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch (err: any) {
      console.error('Erro ao carregar configurações:', err);
      setError(err.message || 'Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = useCallback(async (key: keyof SystemConfig, value: any) => {
    // Atualiza localmente primeiro (optimistic update)
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const saveConfig = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updates = Object.entries(config).map(([chave, valor]) => ({
        chave,
        valor: serializeValue(valor),
        tipo: typeof valor === 'number' ? 'number' : typeof valor === 'boolean' ? 'boolean' : 'string',
      }));

      for (const update of updates) {
        const { error: upsertError } = await supabase
          .from('system_config')
          .update({ valor: update.valor })
          .eq('chave', update.chave);

        if (upsertError) throw upsertError;
      }

      return true;
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err);
      setError(err.message || 'Erro ao salvar configurações');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [config]);

  return {
    config,
    isLoading,
    isSaving,
    error,
    updateConfig,
    saveConfig,
    refresh: fetchConfig,
  };
}

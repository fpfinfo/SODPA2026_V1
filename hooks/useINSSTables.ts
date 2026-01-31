import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { INSSTable } from '../types';
import { INSS_TABLE_2025 } from '../constants';

// Fallback tables when DB connection fails
const FALLBACK_TABLES: INSSTable[] = [
  INSS_TABLE_2025,
  {
    year: 2024,
    ceiling: 7786.02,
    active: false,
    ranges: [
      { label: 'Faixa 1', min: 0, max: 1412.00, rate: 7.5 },
      { label: 'Faixa 2', min: 1412.01, max: 2666.68, rate: 9 },
      { label: 'Faixa 3', min: 2666.69, max: 4000.03, rate: 12 },
      { label: 'Faixa 4', min: 4000.04, max: 7786.02, rate: 14 },
    ]
  }
];

export const useINSSTables = () => {
  const [tables, setTables] = useState<INSSTable[]>(FALLBACK_TABLES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch INSS tables from database
  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('inss_tables')
        .select('*')
        .order('year', { ascending: false });

      if (fetchError) {
        // If table doesn't exist, use fallback
        console.warn('INSS tables not found in DB, using fallback:', fetchError.message);
        setTables(FALLBACK_TABLES);
        return;
      }

      if (data && data.length > 0) {
        const mapped: INSSTable[] = data.map((t: any) => ({
          year: t.year,
          ceiling: t.ceiling,
          active: t.active,
          ranges: t.ranges || []
        }));
        setTables(mapped);
      } else {
        setTables(FALLBACK_TABLES);
      }
    } catch (err) {
      console.error('Error fetching INSS tables:', err);
      setError((err as Error).message);
      setTables(FALLBACK_TABLES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Toggle active status (only one table can be active)
  const toggleActive = async (year: number) => {
    // Optimistic update
    setTables(prev => prev.map(t => ({
      ...t,
      active: t.year === year ? !t.active : false
    })));

    try {
      // First, deactivate all
      await supabase
        .from('inss_tables')
        .update({ active: false })
        .neq('year', 0);

      // Then activate the selected one
      await supabase
        .from('inss_tables')
        .update({ active: true })
        .eq('year', year);
    } catch (err) {
      console.error('Error toggling INSS table:', err);
      // State already updated optimistically
    }
  };

  // Create new table
  const createTable = async (table: INSSTable) => {
    try {
      const { data, error } = await supabase
        .from('inss_tables')
        .insert({
          year: table.year,
          ceiling: table.ceiling,
          active: false,
          ranges: table.ranges
        })
        .select()
        .single();

      if (error) throw error;

      setTables(prev => [{ ...table, active: false }, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating INSS table:', err);
      throw err;
    }
  };

  // Update existing table
  const updateTable = async (year: number, updates: Partial<INSSTable>) => {
    try {
      const { error } = await supabase
        .from('inss_tables')
        .update(updates)
        .eq('year', year);

      if (error) throw error;

      setTables(prev => prev.map(t => 
        t.year === year ? { ...t, ...updates } : t
      ));
    } catch (err) {
      console.error('Error updating INSS table:', err);
      throw err;
    }
  };

  // Delete table
  const deleteTable = async (year: number) => {
    try {
      const { error } = await supabase
        .from('inss_tables')
        .delete()
        .eq('year', year);

      if (error) throw error;

      setTables(prev => prev.filter(t => t.year !== year));
    } catch (err) {
      console.error('Error deleting INSS table:', err);
      throw err;
    }
  };

  // Get active table
  const getActiveTable = (): INSSTable | undefined => {
    return tables.find(t => t.active);
  };

  return {
    tables,
    isLoading,
    error,
    // Actions
    toggleActive,
    createTable,
    updateTable,
    deleteTable,
    getActiveTable,
    refresh: fetchTables
  };
};

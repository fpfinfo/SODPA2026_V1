-- Script para corrigir status do processo TJPA-EXT-2026-1519
-- Execute este script no Supabase SQL Editor ou via psql

UPDATE solicitacoes 
SET 
  status = 'Baixado no SIAFE',
  status_workflow = 'PC_SIAFE_DONE',
  updated_at = NOW()
WHERE nup = 'TJPA-EXT-2026-1519';

-- Verificar resultado
SELECT id, nup, status, status_workflow, updated_at 
FROM solicitacoes 
WHERE nup = 'TJPA-EXT-2026-1519';

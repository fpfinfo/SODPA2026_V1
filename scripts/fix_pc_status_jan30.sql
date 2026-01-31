-- DATA REPAIR SCRIPT: FIX PC STATUS AMBIGUITY (JAN 30)
-- Reverts processes that were incorrectly marked as 'ATESTADO' via Quick Action back to 'AGUARDANDO_ATESTO_GESTOR'
-- so the manager can perform the correct Conscious Analysis.

BEGIN;

-- 1. Identify and fix processes that are in PC Phase but have Concession Status 'ATESTADO'
UPDATE solicitacoes
SET 
  status = 'AGUARDANDO_ATESTO_GESTOR',
  status_workflow = 'PC_SUBMITTED', -- Reset workflow to pre-atesto state
  updated_at = NOW()
WHERE 
  status = 'ATESTADO' 
  AND (
    status_workflow = 'AGUARDANDO_ATESTO_GESTOR' 
    OR status_workflow = 'PC_SUBMITTED'
    OR status_workflow LIKE 'PC_%' -- Catch any PC workflow state that got reverted to ATESTADO status
  )
  AND tipo != 'JURI'; -- Extra safety, though Juri follows different flow

-- 2. Log reparation
INSERT INTO historico_tramitacao (solicitacao_id, origem, destino, status_anterior, status_novo, observacao)
SELECT 
  id, 
  'SYSTEM', 
  'GESTOR', 
  'ATESTADO', 
  'AGUARDANDO_ATESTO_GESTOR', 
  'Correção Automática: Revertendo atesto rápido incorreto para permitir Análise Consciente de PC'
FROM solicitacoes
WHERE status = 'ATESTADO' AND (status_workflow LIKE 'PC_%' OR status_workflow = 'AGUARDANDO_ATESTO_GESTOR');

COMMIT;

-- Verification
SELECT id, nup, status, status_workflow FROM solicitacoes WHERE status_workflow LIKE 'PC_%';

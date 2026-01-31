-- Fix PC Categorization
-- Updates processes that are in 'EM ANÁLISE SOSFU' but are actually Accountabilities
-- Logic: If they have ever been 'CONCEDIDO', 'PAGO', or 'ORDEM BANCARIA', they are past the Solicitation phase.

UPDATE solicitacoes
SET 
  status = 'EM ANÁLISE DE PC',
  updated_at = NOW()
WHERE 
  status = 'EM ANÁLISE SOSFU'
  AND EXISTS (
    SELECT 1 FROM historico_tramitacao ht 
    WHERE ht.solicitacao_id = solicitacoes.id 
    AND (
      ht.status_anterior ILIKE '%CONCEDIDO%' 
      OR ht.status_anterior ILIKE '%PAGO%'
      OR ht.status_anterior ILIKE '%EM EXEC%'
    )
  );

-- Also ensure assigned_to_id is set/cleared as needed? 
-- User said: "apos atribuir ele deveria ir para a mesa de prestação de contas"
-- So we keep assignment if it exists, just changing status fixes the "Mesa" (Table) it appears in.

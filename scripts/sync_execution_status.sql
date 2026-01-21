-- =====================================================
-- SYNC EXECUTION_DOCUMENTS STATUS AFTER SEFIN SIGNATURE
-- Execute this in Supabase SQL Editor
-- =====================================================

-- 1. First, check how many records need syncing
SELECT 
  COUNT(*) as records_to_sync
FROM execution_documents ed
JOIN documentos d 
  ON ed.solicitacao_id::text = d.solicitacao_id::text 
  AND ed.tipo = d.tipo
WHERE d.status = 'ASSINADO'
  AND ed.status != 'ASSINADO';

-- 2. View details of what will be updated
SELECT 
  ed.id as exec_doc_id,
  ed.tipo,
  ed.status as current_exec_status,
  d.status as dossie_status,
  d.solicitacao_id
FROM execution_documents ed
JOIN documentos d 
  ON ed.solicitacao_id::text = d.solicitacao_id::text 
  AND ed.tipo = d.tipo
WHERE d.status = 'ASSINADO'
  AND ed.status != 'ASSINADO';

-- 3. EXECUTE THE SYNC (uncomment to run)
UPDATE execution_documents ed
SET status = 'ASSINADO'
FROM documentos d
WHERE ed.solicitacao_id::text = d.solicitacao_id::text
  AND ed.tipo = d.tipo
  AND d.status = 'ASSINADO'
  AND ed.status != 'ASSINADO';

-- 4. Verify the sync worked
SELECT 
  ed.tipo,
  ed.status as exec_status,
  d.status as dossie_status,
  CASE WHEN ed.status = d.status THEN '✓ SYNCED' ELSE '✗ MISMATCH' END as sync_status
FROM execution_documents ed
JOIN documentos d 
  ON ed.solicitacao_id::text = d.solicitacao_id::text 
  AND ed.tipo = d.tipo
WHERE d.status = 'ASSINADO';

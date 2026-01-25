-- Script para sincronizar status de execution_documents com sefin_tasks
-- Execute isso para corrigir documentos que já foram assinados pela SEFIN 
-- mas não tiveram o status atualizado em execution_documents

-- 1. Atualizar execution_documents baseado em sefin_tasks que já foram assinadas
UPDATE execution_documents ed
SET status = 'ASSINADO'
FROM sefin_tasks st
WHERE ed.solicitacao_id = st.solicitacao_id
  AND ed.tipo = st.tipo
  AND st.status = 'SIGNED'
  AND ed.status != 'ASSINADO';

-- 2. Verificar se a atualização funcionou
SELECT 
  ed.solicitacao_id,
  s.nup,
  ed.tipo,
  ed.status as exec_status,
  st.status as sefin_status,
  st.assinado_em
FROM execution_documents ed
JOIN solicitacoes s ON s.id = ed.solicitacao_id
LEFT JOIN sefin_tasks st ON st.solicitacao_id = ed.solicitacao_id AND st.tipo = ed.tipo
ORDER BY ed.solicitacao_id, ed.ordem;

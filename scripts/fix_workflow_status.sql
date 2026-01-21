-- Script para atualizar manualmente os documentos do Bloco A como ASSINADOS
-- Processo: TJPA-EXT-2026-2698

-- 1. Primeiro, encontrar o ID da solicitação
-- SELECT id, nup, status, status_workflow FROM solicitacoes WHERE nup LIKE 'TJPA-EXT-2026-2698';

-- 2. Atualizar os documentos do Bloco A para ASSINADO
UPDATE execution_documents 
SET status = 'ASSINADO'
WHERE solicitacao_id IN (
  SELECT id FROM solicitacoes WHERE nup LIKE 'TJPA-EXT-2026-2698%'
)
AND tipo IN ('PORTARIA', 'CERTIDAO_REGULARIDADE', 'NOTA_EMPENHO');

-- 3. Atualizar o workflow status da solicitação
UPDATE solicitacoes 
SET status_workflow = 'SIGNED_BY_SEFIN',
    destino_atual = 'SOSFU',
    status = 'APROVADO',
    updated_at = NOW()
WHERE nup LIKE 'TJPA-EXT-2026-2698%';

-- 4. Atualizar as sefin_tasks relacionadas como SIGNED
UPDATE sefin_tasks 
SET status = 'SIGNED',
    signed_at = NOW()
WHERE solicitacao_id IN (
  SELECT id FROM solicitacoes WHERE nup LIKE 'TJPA-EXT-2026-2698%'
);

-- 5. Verificar resultado
SELECT s.nup, s.status, s.status_workflow, s.destino_atual,
       ed.tipo, ed.status as doc_status
FROM solicitacoes s
LEFT JOIN execution_documents ed ON s.id = ed.solicitacao_id
WHERE s.nup LIKE 'TJPA-EXT-2026-2698%';

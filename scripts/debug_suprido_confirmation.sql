-- ==== PASSO 1: APLICAR MIGRATION (EXECUTAR PRIMEIRO) ====
-- Adiciona as colunas necessárias para o fluxo de confirmação

ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS data_credito TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_confirmacao_recebimento TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prazo_prestacao TIMESTAMPTZ;

-- ==== PASSO 2: VERIFICAR STATUS DO PROCESSO ====

SELECT id, nup, status, status_workflow, user_id
FROM solicitacoes 
WHERE nup LIKE 'TJPA-EXT-2026-3089%';

-- ==== PASSO 3: FORÇAR STATUS PARA TESTE ====
-- Descomente e execute se precisar forçar o status

UPDATE solicitacoes 
SET status_workflow = 'AWAITING_SUPRIDO_CONFIRMATION',
    data_credito = NOW()
WHERE nup = 'TJPA-EXT-2026-3089';

-- ==== PASSO 4: VERIFICAR RESULTADO ====

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'system_notifications';

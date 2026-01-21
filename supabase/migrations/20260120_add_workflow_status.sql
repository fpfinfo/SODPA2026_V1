-- =====================================================
-- SCS 4.0: WORKFLOW STATUS MACHINE
-- Esteira de Execução Visual com fases bloqueantes
-- =====================================================

-- 1. Adicionar coluna status_workflow (usando TEXT para flexibilidade)
-- Valores permitidos:
--   EXECUTION_DRAFT      - SOSFU gera docs iniciais
--   WAITING_SEFIN        - SOSFU enviou, SEFIN vê na mesa
--   SIGNED_BY_SEFIN      - SEFIN assinou, SOSFU vê botões liberados
--   PAYMENT_PROCESSING   - SOSFU gerou OB, na Análise Técnica
--   FUNDS_RELEASED       - Técnico confirmou crédito
--   ACCOUNTABILITY_OPEN  - Suprido pode gastar

ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS status_workflow TEXT DEFAULT 'EXECUTION_DRAFT';

-- 2. Adicionar coluna para data de liberação do recurso
ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS data_liberacao TIMESTAMPTZ;

-- 3. Adicionar coluna para controle de análise técnica
ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS analise_tecnica_concluida BOOLEAN DEFAULT FALSE;

-- 4. Índice para queries rápidas por status
CREATE INDEX IF NOT EXISTS idx_solicitacoes_workflow 
ON solicitacoes(status_workflow);

-- 5. Atualizar processos existentes que já foram enviados para SEFIN
UPDATE solicitacoes
SET status_workflow = 'WAITING_SEFIN'
WHERE status = 'AGUARDANDO ASSINATURA SEFIN'
  AND status_workflow = 'EXECUTION_DRAFT';

-- 6. Atualizar processos que já foram assinados pela SEFIN
UPDATE solicitacoes
SET status_workflow = 'SIGNED_BY_SEFIN'
WHERE status = 'APROVADO'
  AND destino_atual = 'SOSFU'
  AND status_workflow IN ('EXECUTION_DRAFT', 'WAITING_SEFIN');

-- 7. Verificar resultado
SELECT 
  status_workflow,
  COUNT(*) as total
FROM solicitacoes
GROUP BY status_workflow
ORDER BY status_workflow;

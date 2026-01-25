-- ============================================================================
-- Migration: Set SLA Deadlines per Portaria SEFIN/TJPA Art. 4°
-- ============================================================================
-- Art. 4°, I - Prazo de Aplicação = Data emissão Portaria até data final do evento
-- Art. 4°, II - Prazo de Prestação de Contas = Prazo de Aplicação + 7 dias
-- Prazo Recursal TCE = 10 dias
-- Prazo Resposta Pendências = 10 dias
-- ============================================================================

-- 1. Adicionar colunas de prazo se não existirem
ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS data_evento_fim DATE,         -- Data final do evento (Art. 4°, I)
ADD COLUMN IF NOT EXISTS prazo_aplicacao DATE,         -- = data_evento_fim
ADD COLUMN IF NOT EXISTS prazo_prestacao DATE,         -- = prazo_aplicacao + 7 dias
ADD COLUMN IF NOT EXISTS sla_internal DATE,            -- Prazo interno SOSFU (10 dias)
ADD COLUMN IF NOT EXISTS data_portaria DATE,           -- Data de emissão da Portaria
ADD COLUMN IF NOT EXISTS data_concessao DATE;          -- Data da concessão (crédito na conta)

-- 2. Função para calcular prazos automaticamente
CREATE OR REPLACE FUNCTION calculate_sla_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando a data do evento é definida, calcular prazos
  IF NEW.data_evento_fim IS NOT NULL AND (OLD.data_evento_fim IS NULL OR OLD.data_evento_fim IS DISTINCT FROM NEW.data_evento_fim) THEN
    -- Art. 4°, I - Prazo de Aplicação = até a data final do evento
    NEW.prazo_aplicacao := NEW.data_evento_fim;
    
    -- Art. 4°, II - Prazo de Prestação de Contas = 7 dias após aplicação
    NEW.prazo_prestacao := NEW.prazo_aplicacao + INTERVAL '7 days';
    
    RAISE NOTICE 'SLA Deadlines set for %: Aplicação=%, PC=%', 
      NEW.nup, NEW.prazo_aplicacao, NEW.prazo_prestacao;
  END IF;
  
  -- Quando o processo é concedido, registrar a data
  IF NEW.status IN ('CONCEDIDO', 'Concedido', 'GRANTED', 'Em Execução') AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.data_concessao := COALESCE(NEW.data_concessao, CURRENT_DATE);
  END IF;
  
  -- SLA interno SOSFU: 10 dias para análise (quando entra na fila)
  IF NEW.destino_atual = 'SOSFU' AND OLD.destino_atual IS DISTINCT FROM 'SOSFU' THEN
    NEW.sla_internal := CURRENT_DATE + INTERVAL '10 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para cálculo automático
DROP TRIGGER IF EXISTS trg_calculate_sla_deadlines ON solicitacoes;
CREATE TRIGGER trg_calculate_sla_deadlines
  BEFORE UPDATE ON solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sla_deadlines();

-- 4. Para processos existentes sem data_evento_fim, usar created_at + 30 dias como fallback
-- (Isso é apenas para processos legados sem a data do evento definida)
UPDATE solicitacoes
SET 
  data_evento_fim = COALESCE(data_evento_fim, (created_at AT TIME ZONE 'America/Sao_Paulo')::date + INTERVAL '30 days'),
  prazo_aplicacao = COALESCE(prazo_aplicacao, (created_at AT TIME ZONE 'America/Sao_Paulo')::date + INTERVAL '30 days'),
  prazo_prestacao = COALESCE(prazo_prestacao, (created_at AT TIME ZONE 'America/Sao_Paulo')::date + INTERVAL '37 days') -- 30 + 7
WHERE status IN ('CONCEDIDO', 'Concedido', 'GRANTED', 'Em Execução', 'EM_EXECUCAO', 'AGUARDANDO_PC')
  AND prazo_aplicacao IS NULL;

-- 5. Atualizar processos de PC em análise com SLA interno
UPDATE solicitacoes
SET sla_internal = COALESCE(sla_internal, CURRENT_DATE + INTERVAL '10 days')
WHERE destino_atual = 'SOSFU'
  AND assigned_to_id IS NOT NULL
  AND sla_internal IS NULL;

-- 6. Criar processos de teste atrasados para validar alertas SLA
UPDATE solicitacoes
SET 
  data_evento_fim = CURRENT_DATE - INTERVAL '10 days',
  prazo_aplicacao = CURRENT_DATE - INTERVAL '10 days',
  prazo_prestacao = CURRENT_DATE - INTERVAL '3 days'  -- 10 - 7 = 3 dias atrás
WHERE nup IN ('TJPA-EXT-2026-5214', 'TJPA-EXT-2026-1519');

-- 7. Criar índices para consultas de SLA
CREATE INDEX IF NOT EXISTS idx_solicitacoes_prazo_aplicacao ON solicitacoes(prazo_aplicacao);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_prazo_prestacao ON solicitacoes(prazo_prestacao);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_sla_internal ON solicitacoes(sla_internal);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data_evento_fim ON solicitacoes(data_evento_fim);

-- 8. View para monitoramento de SLA
CREATE OR REPLACE VIEW v_sla_monitoring AS
SELECT 
  s.id,
  s.nup,
  s.status,
  s.destino_atual,
  su.nome AS suprido_nome,
  s.data_portaria,
  s.data_evento_fim,
  s.data_concessao,
  s.prazo_aplicacao,
  s.prazo_prestacao,
  s.sla_internal,
  s.assigned_to_id,
  -- Indicadores de atraso
  CASE 
    WHEN s.prazo_aplicacao < CURRENT_DATE AND s.status IN ('Em Execução', 'CONCEDIDO', 'Concedido') THEN true
    ELSE false
  END AS aplicacao_atrasada,
  CASE 
    WHEN s.prazo_prestacao < CURRENT_DATE AND s.status NOT IN ('Baixado no SIAFE', 'Arquivado', 'SIAFE_DONE') THEN true
    ELSE false
  END AS pc_atrasada,
  CASE 
    WHEN s.sla_internal < CURRENT_DATE AND s.assigned_to_id IS NOT NULL THEN true
    ELSE false
  END AS sla_interno_atrasado,
  -- Dias até/após vencimento
  s.prazo_aplicacao - CURRENT_DATE AS dias_ate_aplicacao,
  s.prazo_prestacao - CURRENT_DATE AS dias_ate_pc,
  s.sla_internal - CURRENT_DATE AS dias_ate_sla_interno
FROM solicitacoes s
LEFT JOIN profiles su ON su.id = s.user_id
WHERE s.status NOT IN ('Baixado no SIAFE', 'Arquivado', 'SIAFE_DONE', 'Cancelado');

-- 9. Comentários nas colunas para documentação
COMMENT ON COLUMN solicitacoes.data_evento_fim IS 'Data final do evento - base para prazo de aplicação (Art. 4°, I)';
COMMENT ON COLUMN solicitacoes.prazo_aplicacao IS 'Prazo para aplicação dos recursos = data_evento_fim (Art. 4°, I)';
COMMENT ON COLUMN solicitacoes.prazo_prestacao IS 'Prazo para prestação de contas = prazo_aplicacao + 7 dias (Art. 4°, II)';
COMMENT ON COLUMN solicitacoes.sla_internal IS 'Prazo interno SOSFU para análise (SLA operacional - 10 dias)';
COMMENT ON COLUMN solicitacoes.data_portaria IS 'Data de emissão da Portaria de concessão';
COMMENT ON COLUMN solicitacoes.data_concessao IS 'Data da concessão do crédito ao suprido';

-- Saída de verificação
SELECT 
  nup, 
  status, 
  destino_atual,
  data_evento_fim,
  prazo_aplicacao,
  prazo_prestacao,
  CASE WHEN prazo_prestacao < CURRENT_DATE THEN '⚠️ ATRASADO' ELSE '✓ No prazo' END AS situacao_pc
FROM solicitacoes
WHERE assigned_to_id IS NOT NULL
ORDER BY prazo_prestacao ASC NULLS LAST
LIMIT 10;

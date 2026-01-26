-- Migration: Create Financial Analytics Views
-- Date: 2026-01-27
-- Description: Aggregated views for SEFIN Intelligence Dashboard

-- 1. Daily Financial Flow (Cash Flow Trend)
-- Aggregates total value of processes by day
CREATE OR REPLACE VIEW v_finance_daily_flow AS
SELECT 
  DATE(created_at) as date,
  SUM(COALESCE(valor_total, 0)) as total_value,
  COUNT(*) as process_count
FROM solicitacoes
WHERE status NOT IN ('RASCUNHO', 'CANCELADO', 'EXCLUIDO')
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) ASC; -- ASC for chart trend line

-- 2. Location Execution Stats (Budget vs Execution)
-- Aggregates execution by location (Lotação)
-- Only considers approved/paid processes as "Executed"
CREATE OR REPLACE VIEW v_finance_location_stats AS
SELECT 
  COALESCE(lotacao_nome, 'Outros') as location,
  SUM(COALESCE(valor_total, 0)) as executed_value,
  COUNT(*) as process_count
FROM solicitacoes
WHERE status IN ('CONCEDIDO', 'PAGO', 'PRESTANDO CONTAS', 'FINALIZADO', 'FUNDS_RELEASED')
GROUP BY lotacao_nome
ORDER BY executed_value DESC
LIMIT 20;

-- 3. Grant access to authenticated users
GRANT SELECT ON v_finance_daily_flow TO authenticated;
GRANT SELECT ON v_finance_location_stats TO authenticated;

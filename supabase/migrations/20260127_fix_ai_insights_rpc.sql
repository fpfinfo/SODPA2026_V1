-- Migration: Fix AI Insights RPC Logic
-- Date: 2026-01-27
-- Description: Ensures robust return of insights, handling multiple query checks correctly.

CREATE OR REPLACE FUNCTION get_sefin_ai_insights()
RETURNS TABLE (
  insight_type TEXT,
  severity TEXT, -- 'CRITICAL', 'WARNING', 'INFO'
  title TEXT,
  description TEXT,
  metric_value NUMERIC,
  related_id TEXT
) AS $$
DECLARE
  v_count INTEGER := 0;
  v_found_any BOOLEAN := FALSE;
BEGIN
  -- 1. Check for Spending Anomalies (Locations spending > 50% more than average)
  RETURN QUERY
  WITH avg_spending AS (
    SELECT AVG(total) as global_avg 
    FROM (
        SELECT SUM(valor_total) as total 
        FROM solicitacoes 
        WHERE status IN ('CONCEDIDO', 'PAGO') 
        GROUP BY lotacao_nome
    ) t 
    WHERE t.total > 0
  ),
  location_spending AS (
     SELECT lotacao_nome, SUM(valor_total) as total
     FROM solicitacoes
     WHERE status IN ('CONCEDIDO', 'PAGO')
     GROUP BY lotacao_nome
  )
  SELECT 
    'SPENDING_ANOMALY'::TEXT,
    'WARNING'::TEXT,
    'Anomalia de Gastos'::TEXT,
    FORMAT('A comarca de %s está gastando %s%% acima da média estadual.', 
           ls.lotacao_nome, 
           ROUND(((ls.total - av.global_avg) / av.global_avg * 100), 0))::TEXT,
    ls.total,
    ls.lotacao_nome::TEXT
  FROM location_spending ls, avg_spending av
  WHERE ls.total > (av.global_avg * 1.5)
  LIMIT 1;

  -- Check if rows were returned by the previous query
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_found_any := TRUE; END IF;

  -- 2. Check for Stuck High Value Processes
  RETURN QUERY
  SELECT 
    'STUCK_PROCESS'::TEXT,
    'CRITICAL'::TEXT,
    'Processos Críticos Travados'::TEXT,
    FORMAT('Atenção: %s processos acima de R$ 10k aguardam assinatura há +24h.', COUNT(*))::TEXT,
    COUNT(*)::NUMERIC,
    NULL::TEXT
  FROM solicitacoes
  WHERE valor_total > 10000 
    AND status IN ('PENDENTE_ASSINATURA', 'AWAITING_APPROVAL')
    AND created_at < NOW() - INTERVAL '24 hours'
  HAVING COUNT(*) > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN v_found_any := TRUE; END IF;

  -- 3. Default Positive State
  -- Only return this if NO other insights were found to avoid clutter
  IF NOT v_found_any THEN
    RETURN QUERY SELECT 
      'POSITIVE_TREND'::TEXT, 
      'INFO'::TEXT, 
      'Operação Normal'::TEXT, 
      'O monitoramento de IA não detectou anomalias financeiras ou gargalos operacionais nas últimas 24 horas.'::TEXT,
      0::NUMERIC,
      NULL::TEXT;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

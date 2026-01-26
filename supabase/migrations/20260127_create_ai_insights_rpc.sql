-- Migration: Create Data Analysis Function for AI Insights
-- Date: 2026-01-27
-- Description: Analyzes financial patterns to generate real-time insights for SEFIN Dashboard

CREATE OR REPLACE FUNCTION get_sefin_ai_insights()
RETURNS TABLE (
  insight_type TEXT,
  severity TEXT, -- 'CRITICAL', 'WARNING', 'INFO'
  title TEXT,
  description TEXT,
  metric_value NUMERIC,
  related_id TEXT
) AS $$
BEGIN
  -- 1. Check for Spending Anomalies (Locations spending > 20% more than average of others)
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
    'Aumento de Gastos Detectado'::TEXT,
    FORMAT('A comarca de %s apresenta um volume de gastos %s%% acima da média das demais unidades.', 
           ls.lotacao_nome, 
           ROUND(((ls.total - av.global_avg) / av.global_avg * 100), 0))::TEXT,
    ls.total,
    ls.lotacao_nome::TEXT
  FROM location_spending ls, avg_spending av
  WHERE ls.total > (av.global_avg * 1.5) -- 50% above average
  LIMIT 1;

  -- 2. Check for Stuck High Value Processes (> 10k waiting > 24h)
  RETURN QUERY
  SELECT 
    'STUCK_PROCESS'::TEXT,
    'CRITICAL'::TEXT,
    'Processos Críticos Parados'::TEXT,
    FORMAT('Existem %s processos de alto valor (>R$ 10k) aguardando assinatura há mais de 24 horas.', COUNT(*))::TEXT,
    COUNT(*)::NUMERIC,
    NULL::TEXT
  FROM solicitacoes
  WHERE valor_total > 10000 
    AND status IN ('PENDENTE_ASSINATURA', 'AWAITING_APPROVAL')
    AND created_at < NOW() - INTERVAL '24 hours'
  HAVING COUNT(*) > 0;

  -- 3. Check for Refund Rate Spikes (Devoluções)
  -- Placeholder logistics (assumes status 'REJECTED' exists)
  
  -- If no critical insights found, return a positive default
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'POSITIVE_TREND'::TEXT, 
      'INFO'::TEXT, 
      'Operação Normal'::TEXT, 
      'O fluxo de pagamentos está operando dentro dos parâmetros de normalidade nas últimas 24 horas.'::TEXT,
      0::NUMERIC,
      NULL::TEXT;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution
GRANT EXECUTE ON FUNCTION get_sefin_ai_insights TO authenticated;

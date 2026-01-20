-- ============================================================================
-- SCS 3.0 Batch Processing Test Script
-- Purpose: Validate the complete batch concession flow
-- ============================================================================

-- Test Case 1: Verify unidade_titulares structure and data
DO $$
DECLARE
  v_count INT;
BEGIN
  -- Check table exists with correct columns
  SELECT COUNT(*) INTO v_count 
  FROM information_schema.columns 
  WHERE table_name = 'unidade_titulares' 
    AND column_name IN ('comarca_id', 'tipo_suprimento', 'suprido_atual_id', 'valor_mensal_custeio', 'valor_mensal_capital', 'ptres');
  
  IF v_count < 6 THEN
    RAISE EXCEPTION 'unidade_titulares missing required columns (found %)', v_count;
  END IF;
  
  -- Check at least 100 records exist
  SELECT COUNT(*) INTO v_count FROM unidade_titulares;
  IF v_count < 100 THEN
    RAISE NOTICE 'Warning: Only % unidade_titulares records found (expected 100+)', v_count;
  ELSE
    RAISE NOTICE 'OK: % unidade_titulares records found', v_count;
  END IF;
END $$;

-- Test Case 2: Verify ORDINARIO records with titulars
SELECT 
  'ORDINARIO Titulars' AS test_case,
  COUNT(*) AS total,
  COUNT(suprido_atual_id) AS com_titular,
  COUNT(*) - COUNT(suprido_atual_id) AS sem_titular
FROM unidade_titulares
WHERE tipo_suprimento = 'ORDINARIO';

-- Test Case 3: Verify historico_titulares structure
SELECT 
  'historico_titulares' AS table_name,
  CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'EMPTY TABLE' END AS status
FROM information_schema.columns 
WHERE table_name = 'historico_titulares';

-- Test Case 4: Verify concessao_lotes structure
SELECT 
  'concessao_lotes' AS table_name,
  CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'EMPTY TABLE' END AS status
FROM information_schema.columns 
WHERE table_name = 'concessao_lotes';

-- Test Case 5: Check for existing ORDINARIO solicitacoes this month
SELECT 
  'ORDINARIO Solicitacoes' AS test_case,
  TO_CHAR(NOW(), 'YYYY-MM') AS competencia_atual,
  COUNT(*) AS total_ordinarios,
  COUNT(CASE WHEN status = 'CONCEDIDO' THEN 1 END) AS concedidos
FROM solicitacoes
WHERE tipo = 'ORDINARIO'
  AND competencia = TO_CHAR(NOW(), 'YYYY-MM');

-- Test Case 6: Verify documentos are created for each ORDINARIO process
SELECT 
  'Documentos por Solicitacao' AS test_case,
  s.id AS solicitacao_id,
  s.nup,
  COUNT(d.id) AS doc_count,
  STRING_AGG(d.tipo, ', ' ORDER BY d.tipo) AS tipos_doc
FROM solicitacoes s
LEFT JOIN documentos d ON d.solicitacao_id = s.id
WHERE s.tipo = 'ORDINARIO'
  AND s.competencia = TO_CHAR(NOW(), 'YYYY-MM')
GROUP BY s.id, s.nup
ORDER BY s.created_at DESC
LIMIT 10;

-- Test Case 7: Verify notifications are created
SELECT 
  'Notifications' AS test_case,
  COUNT(*) AS total,
  COUNT(CASE WHEN type = 'SUCCESS' THEN 1 END) AS success_count,
  COUNT(CASE WHEN category = 'FINANCE' THEN 1 END) AS finance_count
FROM system_notifications
WHERE created_at > NOW() - INTERVAL '1 day'
  AND (metadata->>'origem')::TEXT = 'ORDINARY_PROCESS_FACTORY';

-- Test Case 8: Verify RLS policies exist
SELECT 
  'RLS Policies' AS test_case,
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename IN ('unidade_titulares', 'historico_titulares', 'concessao_lotes', 'concessao_lote_itens')
GROUP BY tablename
ORDER BY tablename;

-- Test Case 9: Data Integrity Check - No orphan records
SELECT 
  'Orphan Documents' AS test_case,
  COUNT(*) AS orphan_count
FROM documentos d
WHERE NOT EXISTS (SELECT 1 FROM solicitacoes s WHERE s.id = d.solicitacao_id);

-- Test Case 10: Performance check - Index usage
SELECT 
  'Index Coverage' AS test_case,
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('unidade_titulares', 'solicitacoes', 'documentos')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- Summary Report
-- ============================================================================
SELECT 
  '=== SCS 3.0 TEST SUMMARY ===' AS report,
  (SELECT COUNT(*) FROM unidade_titulares WHERE tipo_suprimento = 'ORDINARIO') AS ordinario_units,
  (SELECT COUNT(*) FROM unidade_titulares WHERE suprido_atual_id IS NOT NULL) AS with_titular,
  (SELECT COUNT(*) FROM solicitacoes WHERE tipo = 'ORDINARIO') AS total_solicitacoes,
  (SELECT COUNT(*) FROM documentos) AS total_documentos,
  (SELECT COUNT(*) FROM system_notifications WHERE type = 'SUCCESS') AS success_notifications;

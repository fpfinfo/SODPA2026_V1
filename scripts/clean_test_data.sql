-- ================================================================
-- SCRIPT DE LIMPEZA: Remove todas as solicitações e documentos
-- Mantém: usuários, perfis, unidades, comarcas, elementos de despesa
-- ================================================================

-- 1. Deletar histórico de tramitação
DELETE FROM historico_tramitacao;

-- 2. Deletar documentos (incluindo Capa e Requerimento auto-criados)
DELETE FROM documentos;

-- 3. Deletar tabelas vinculadas
DELETE FROM sefin_tasks;

-- 4. Deletar solicitações
DELETE FROM solicitacoes;

-- 4. Resetar sequences (opcional - para IDs começarem do 1)
-- Descomente se quiser IDs começando do 1 novamente
-- ALTER SEQUENCE solicitacoes_id_seq RESTART WITH 1;
-- ALTER SEQUENCE documentos_id_seq RESTART WITH 1;
-- ALTER SEQUENCE historico_tramitacao_id_seq RESTART WITH 1;

-- ================================================================
-- RESULTADO: Sistema limpo e pronto para testes do zero!
-- ================================================================

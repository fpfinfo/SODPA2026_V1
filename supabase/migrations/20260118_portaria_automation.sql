-- Migration: Portaria Automation System
-- Criado: 2026-01-18
-- Descrição: Sistema de geração automática de portarias com numeração sequencial
--            e validação de pendências de servidor

-- ==================================================
-- 1. TABELA DE SEQUENCIAIS DE PORTARIA
-- ==================================================

CREATE TABLE IF NOT EXISTS public.portarias_sequencial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  sequencial INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ano, sequencial)
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_portarias_sequencial_ano ON portarias_sequencial(ano);

-- Comentários
COMMENT ON TABLE portarias_sequencial IS 'Controle de numeração sequencial de portarias por ano';
COMMENT ON COLUMN portarias_sequencial.ano IS 'Ano da portaria';
COMMENT ON COLUMN portarias_sequencial.sequencial IS 'Número sequencial dentro do ano';

-- ==================================================
-- 2. FUNÇÃO: PRÓXIMO NÚMERO DE PORTARIA
-- ==================================================

CREATE OR REPLACE FUNCTION get_next_portaria_number(p_ano INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_sequencial INTEGER;
BEGIN
  -- Busca o último sequencial do ano ou inicia em 1
  SELECT COALESCE(MAX(sequencial), 0) + 1 INTO v_sequencial
  FROM portarias_sequencial
  WHERE ano = p_ano;
  
  -- Insere o novo sequencial
  INSERT INTO portarias_sequencial (ano, sequencial)
  VALUES (p_ano, v_sequencial);
  
  -- Retorna formatado: 00001/2026-SEFIN
  RETURN LPAD(v_sequencial::TEXT, 5, '0') || '/' || p_ano || '-SEFIN';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_portaria_number(INTEGER) IS 'Gera próximo número de portaria no formato 00001/2026-SEFIN';

-- ==================================================
-- 3. FUNÇÃO: VALIDAÇÃO DE PENDÊNCIAS DO SERVIDOR
-- ==================================================

CREATE OR REPLACE FUNCTION check_servidor_pendencias(servidor_id UUID)
RETURNS TABLE (
  has_pendencias BOOLEAN,
  detalhes TEXT[]
) AS $$
DECLARE
  v_pendencias TEXT[] := ARRAY[]::TEXT[];
  v_count INTEGER;
BEGIN
  -- Verifica processos em execução sem prestação de contas
  SELECT COUNT(*) INTO v_count
  FROM solicitacoes
  WHERE suprido_id = servidor_id
    AND status IN ('EM_EXECUCAO', 'AGUARDANDO_PC', 'EXECUCAO_INICIADA')
    AND deleted_at IS NULL;
  
  IF v_count > 0 THEN
    v_pendencias := array_append(v_pendencias, 
      format('%s processo(s) em execução sem prestação de contas', v_count));
  END IF;
  
  -- Verifica devoluções (GDR) em aberto
  -- Nota: Tabela pode não existir ainda, usar verificação condicional
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devolucoes_gdr') THEN
    SELECT COUNT(*) INTO v_count
    FROM devolucoes_gdr
    WHERE servidor_id = check_servidor_pendencias.servidor_id
      AND status = 'PENDENTE';
    
    IF v_count > 0 THEN
      v_pendencias := array_append(v_pendencias,
        format('%s devolução(ões) pendente(s)', v_count));
    END IF;
  END IF;
  
  -- Verifica INSS não recolhido
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inss_records') THEN
    SELECT COUNT(*) INTO v_count
    FROM inss_records
    WHERE servidor_id = check_servidor_pendencias.servidor_id
      AND status = 'PENDENTE';
    
    IF v_count > 0 THEN
      v_pendencias := array_append(v_pendencias,
        format('%s registro(s) de INSS pendente(s)', v_count));
    END IF;
  END IF;
  
  -- Retorna resultado
  RETURN QUERY SELECT 
    (array_length(v_pendencias, 1) > 0),
    v_pendencias;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_servidor_pendencias(UUID) IS 'Verifica se servidor possui pendências que impedem emissão de certidão de regularidade';

-- ==================================================
-- 4. ATUALIZAR TABELA execution_documents
-- ==================================================

-- Adicionar colunas para dados orçamentários e numeração
ALTER TABLE execution_documents 
  ADD COLUMN IF NOT EXISTS ptres_code TEXT,
  ADD COLUMN IF NOT EXISTS dotacao_code TEXT,
  ADD COLUMN IF NOT EXISTS fonte_recurso TEXT,
  ADD COLUMN IF NOT EXISTS numero_formatado TEXT,
  ADD COLUMN IF NOT EXISTS numero_siafe TEXT,
  ADD COLUMN IF NOT EXISTS data_emissao DATE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_execution_documents_ptres ON execution_documents(ptres_code);
CREATE INDEX IF NOT EXISTS idx_execution_documents_dotacao ON execution_documents(dotacao_code);
CREATE INDEX IF NOT EXISTS idx_execution_documents_fonte ON execution_documents(fonte_recurso);
CREATE INDEX IF NOT EXISTS idx_execution_documents_numero ON execution_documents(numero_formatado);

-- Comentários
COMMENT ON COLUMN execution_documents.ptres_code IS 'Código PTRES do orçamento (para Portaria)';
COMMENT ON COLUMN execution_documents.dotacao_code IS 'Código da dotação orçamentária (para Portaria)';
COMMENT ON COLUMN execution_documents.fonte_recurso IS 'Fonte de recurso (6 dígitos) para NE/DL/OB';
COMMENT ON COLUMN execution_documents.numero_formatado IS 'Número completo formatado (ex: 00001/2026-SEFIN ou 2026040102NE000111)';
COMMENT ON COLUMN execution_documents.numero_siafe IS 'Número SIAFE (6 dígitos) para NE/DL/OB';
COMMENT ON COLUMN execution_documents.data_emissao IS 'Data de emissão do documento';

-- ==================================================
-- 5. VERIFICAR ESTRUTURA orcamento_sosfu
-- ==================================================

-- Garantir que a tabela orcamento_sosfu existe e tem as colunas necessárias
DO $$
BEGIN
  -- Verificar se tabela existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orcamento_sosfu') THEN
    RAISE NOTICE 'Tabela orcamento_sosfu não encontrada. Criar após esta migration.';
  ELSE
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orcamento_sosfu' AND column_name = 'fonte_recurso') THEN
      ALTER TABLE orcamento_sosfu ADD COLUMN fonte_recurso TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orcamento_sosfu' AND column_name = 'fonte_descricao') THEN
      ALTER TABLE orcamento_sosfu ADD COLUMN fonte_descricao TEXT;
    END IF;
  END IF;
END $$;

-- ==================================================
-- 6. DADOS DE TESTE (OPCIONAL)
-- ==================================================

-- Inserir ano inicial para sequencial
INSERT INTO portarias_sequencial (ano, sequencial)
VALUES (2026, 0)
ON CONFLICT (ano, sequencial) DO NOTHING;

-- ==================================================
-- 7. PERMISSÕES RLS
-- ==================================================

-- Habilitar RLS
ALTER TABLE portarias_sequencial ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem visualizar
CREATE POLICY "Todos podem visualizar sequenciais" ON portarias_sequencial
  FOR SELECT USING (true);

-- Política: Apenas função pode inserir (automática via get_next_portaria_number)
CREATE POLICY "Sistema pode inserir sequenciais" ON portarias_sequencial
  FOR INSERT WITH CHECK (true);

-- ==================================================
-- FIM DA MIGRATION
-- ==================================================

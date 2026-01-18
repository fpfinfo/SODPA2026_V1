-- Migration: Add Execution Workflow
-- Created: 2026-01-18

-- 1. Adicionar campos de execução à tabela solicitacoes
ALTER TABLE solicitacoes
ADD COLUMN IF NOT EXISTS execution_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS execution_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sefin_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sefin_returned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar tabela de documentos de execução
CREATE TABLE IF NOT EXISTS execution_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'GERADO', 'ASSINADO')),
  arquivo_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_at TIMESTAMP WITH TIME ZONE,
  assinado_em TIMESTAMP WITH TIME ZONE,
  assinado_por UUID REFERENCES profiles(id),
  UNIQUE(solicitacao_id, tipo)
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_execution_documents_solicitacao 
ON execution_documents(solicitacao_id);

CREATE INDEX IF NOT EXISTS idx_execution_documents_status 
ON execution_documents(status);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_execution_status 
ON solicitacoes(execution_status);

-- 4. Enable RLS
ALTER TABLE execution_documents ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "SOSFU e SEFIN podem ver documentos de execução" 
ON execution_documents FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('SOSFU', 'SEFIN', 'ADMIN')
  )
);

CREATE POLICY "SOSFU pode criar documentos de execução" 
ON execution_documents FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SOSFU'
  )
);

CREATE POLICY "SEFIN pode atualizar documentos (assinatura)" 
ON execution_documents FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('SEFIN', 'ADMIN')
  )
);

-- 6. Function para gerar todos os documentos de execução
CREATE OR REPLACE FUNCTION generate_execution_documents(p_solicitacao_id UUID)
RETURNS TABLE(
  id UUID,
  tipo VARCHAR(50),
  titulo TEXT,
  status VARCHAR(20)
) AS $$
DECLARE
  v_doc RECORD;
  v_documents JSONB := '[
    {"tipo": "PORTARIA", "titulo": "Portaria de Concessão", "ordem": 1},
    {"tipo": "CERTIDAO_REGULARIDADE", "titulo": "Certidão de Regularidade", "ordem": 2},
    {"tipo": "NOTA_EMPENHO", "titulo": "Nota de Empenho", "ordem": 3},
    {"tipo": "NOTA_LIQUIDACAO", "titulo": "Nota de Liquidação", "ordem": 4},
    {"tipo": "ORDEM_BANCARIA", "titulo": "Ordem Bancária", "ordem": 5}
  ]'::JSONB;
BEGIN
  -- Gerar documentos
  FOR v_doc IN SELECT * FROM jsonb_to_recordset(v_documents) AS x(tipo TEXT, titulo TEXT, ordem INT)
  LOOP
    INSERT INTO execution_documents (
      solicitacao_id,
      tipo,
      titulo,
      ordem,
      status,
      generated_at
    ) VALUES (
      p_solicitacao_id,
      v_doc.tipo,
      v_doc.titulo,
      v_doc.ordem,
      'GERADO',
      NOW()
    )
    ON CONFLICT (solicitacao_id, tipo) 
    DO UPDATE SET 
      status = 'GERADO',
      generated_at = NOW();
  END LOOP;
  
  -- Atualizar status da solicitação
  UPDATE solicitacoes
  SET 
    execution_status = 'EXECUCAO_DESPESA',
    execution_started_at = COALESCE(execution_started_at, NOW())
  WHERE id = p_solicitacao_id;
  
  -- Retornar documentos criados
  RETURN QUERY
  SELECT 
    ed.id,
    ed.tipo,
    ed.titulo,
    ed.status
  FROM execution_documents ed
  WHERE ed.solicitacao_id = p_solicitacao_id
  ORDER BY ed.ordem;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Comments
COMMENT ON TABLE execution_documents IS 'Documentos gerados durante a fase de execução da despesa';
COMMENT ON COLUMN execution_documents.tipo IS 'Tipo do documento: PORTARIA, CERTIDAO_REGULARIDADE, NOTA_EMPENHO, NOTA_LIQUIDACAO, ORDEM_BANCARIA';
COMMENT ON COLUMN execution_documents.status IS 'Status: PENDENTE, GERADO, ASSINADO';
COMMENT ON COLUMN execution_documents.ordem IS 'Ordem de exibição/geração do documento';

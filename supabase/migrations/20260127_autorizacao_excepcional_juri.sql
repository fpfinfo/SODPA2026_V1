-- Migration: Autorização Excepcional para Extra-Júri
-- Fluxo: Suprido > Gestor > SOSFU > AJSEFIN > SEFIN > SOSFU

-- ============================================================
-- 1. TABELA DE AUTORIZAÇÕES EXCEPCIONAIS
-- ============================================================

CREATE TABLE IF NOT EXISTS autorizacoes_excepcionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID REFERENCES solicitacoes(id) NOT NULL,
  
  -- Tipo de exceção
  tipo_excecao TEXT NOT NULL CHECK (tipo_excecao IN ('POLICIAIS', 'VALOR_REFEICAO', 'MULTIPLO')),
  
  -- Detalhes da exceção
  excecoes_detalhes JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [{"tipo": "POLICIAIS", "solicitado": 8, "limite": 5}, {"tipo": "ALMOCO", "solicitado": 45, "limite": 30}]
  
  -- Valores financeiros
  valor_adicional_solicitado NUMERIC(14,2) DEFAULT 0,
  
  -- Documentação
  justificativa TEXT,
  oficio_justificativa_url TEXT, -- URL do ofício anexado pelo Gestor
  
  -- Status do fluxo
  status TEXT DEFAULT 'PENDENTE' CHECK (status IN (
    'PENDENTE',
    'AGUARDANDO_AJSEFIN',
    'EM_ANALISE_AJSEFIN', 
    'AGUARDANDO_ORDENADOR',
    'AUTORIZADO',
    'NEGADO'
  )),
  
  -- Pareceres
  parecer_sosfu TEXT,
  parecer_ajsefin TEXT,
  parecer_ordenador TEXT,
  
  -- Documento de autorização
  documento_autorizacao_url TEXT,
  
  -- Auditoria
  encaminhado_ajsefin_por UUID REFERENCES profiles(id),
  encaminhado_ajsefin_em TIMESTAMP WITH TIME ZONE,
  preparado_por UUID REFERENCES profiles(id),
  preparado_em TIMESTAMP WITH TIME ZONE,
  autorizado_por UUID REFERENCES profiles(id),
  autorizado_em TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_autorizacoes_solicitacao ON autorizacoes_excepcionais(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_status ON autorizacoes_excepcionais(status);

-- ============================================================
-- 2. LIMITES CONFIGURÁVEIS
-- ============================================================

-- Inserir limites padrão na tabela system_settings (se existir)
DO $$
BEGIN
  -- Verificar se a tabela existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_settings') THEN
    -- Limites de Júri
    INSERT INTO system_settings (key, value, category, description)
    VALUES 
      ('juri_limite_policiais', '5', 'LIMITES_JURI', 'Quantidade máxima de policiais sem autorização especial'),
      ('juri_limite_valor_almoco', '30.00', 'LIMITES_JURI', 'Valor máximo por almoço (R$)'),
      ('juri_limite_valor_jantar', '30.00', 'LIMITES_JURI', 'Valor máximo por jantar (R$)'),
      ('juri_limite_valor_lanche', '11.00', 'LIMITES_JURI', 'Valor máximo por lanche (R$)')
    ON CONFLICT (key) DO UPDATE SET 
      value = EXCLUDED.value,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

ALTER TABLE autorizacoes_excepcionais ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT
CREATE POLICY "autorizacoes_select_policy" ON autorizacoes_excepcionais
  FOR SELECT USING (
    -- Usuário envolvido no processo
    EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = solicitacao_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Ou tem perfil autorizado
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.perfil IN ('SOSFU', 'AJSEFIN', 'SEFIN', 'ADMIN')
    )
  );

-- Policy para INSERT (SOSFU cria)
CREATE POLICY "autorizacoes_insert_policy" ON autorizacoes_excepcionais
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.perfil IN ('SOSFU', 'ADMIN')
    )
  );

-- Policy para UPDATE (SOSFU, AJSEFIN, SEFIN podem atualizar)
CREATE POLICY "autorizacoes_update_policy" ON autorizacoes_excepcionais
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.perfil IN ('SOSFU', 'AJSEFIN', 'SEFIN', 'ADMIN')
    )
  );

-- ============================================================
-- 4. FUNÇÃO PARA DETECTAR EXCEÇÕES
-- ============================================================

CREATE OR REPLACE FUNCTION detect_juri_exceptions(p_solicitacao_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_solicitacao RECORD;
  v_limites RECORD;
  v_exceptions JSONB := '[]'::jsonb;
  v_projecao JSONB;
  v_participantes JSONB;
  v_policiais INT;
  v_almoco_valor NUMERIC;
  v_jantar_valor NUMERIC;
  v_lanche_valor NUMERIC;
BEGIN
  -- Buscar dados da solicitação
  SELECT 
    juri_participantes_aprovados,
    juri_projecao_aprovados,
    COALESCE(juri_participantes_aprovados, juri_participantes) as participantes,
    COALESCE(juri_projecao_aprovados, juri_projecao_custos) as projecao
  INTO v_solicitacao
  FROM solicitacoes
  WHERE id = p_solicitacao_id;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Solicitação não encontrada"}'::jsonb;
  END IF;
  
  -- Buscar limites configurados
  SELECT 
    COALESCE((SELECT value::int FROM system_settings WHERE key = 'juri_limite_policiais'), 5) as policiais,
    COALESCE((SELECT value::numeric FROM system_settings WHERE key = 'juri_limite_valor_almoco'), 30.00) as almoco,
    COALESCE((SELECT value::numeric FROM system_settings WHERE key = 'juri_limite_valor_jantar'), 30.00) as jantar,
    COALESCE((SELECT value::numeric FROM system_settings WHERE key = 'juri_limite_valor_lanche'), 11.00) as lanche
  INTO v_limites;
  
  -- Extrair dados
  v_participantes := v_solicitacao.participantes;
  v_projecao := v_solicitacao.projecao;
  
  -- Verificar policiais
  v_policiais := COALESCE((v_participantes->>'policiais')::int, 0);
  IF v_policiais > v_limites.policiais THEN
    v_exceptions := v_exceptions || jsonb_build_object(
      'tipo', 'POLICIAIS',
      'solicitado', v_policiais,
      'limite', v_limites.policiais,
      'excedente', v_policiais - v_limites.policiais
    );
  END IF;
  
  -- Verificar valores de refeição (percorrer array de projeção)
  IF jsonb_typeof(v_projecao) = 'array' THEN
    FOR i IN 0..jsonb_array_length(v_projecao)-1 LOOP
      DECLARE
        v_item JSONB := v_projecao->i;
        v_item_id TEXT := v_item->>'id';
        v_unit_value NUMERIC := COALESCE((v_item->>'approvedUnitValue')::numeric, (v_item->>'unitValue')::numeric, 0);
      BEGIN
        IF v_item_id = 'almoco' AND v_unit_value > v_limites.almoco THEN
          v_exceptions := v_exceptions || jsonb_build_object(
            'tipo', 'VALOR_ALMOCO',
            'solicitado', v_unit_value,
            'limite', v_limites.almoco,
            'excedente', v_unit_value - v_limites.almoco
          );
        ELSIF v_item_id = 'jantar' AND v_unit_value > v_limites.jantar THEN
          v_exceptions := v_exceptions || jsonb_build_object(
            'tipo', 'VALOR_JANTAR',
            'solicitado', v_unit_value,
            'limite', v_limites.jantar,
            'excedente', v_unit_value - v_limites.jantar
          );
        ELSIF v_item_id = 'lanche' AND v_unit_value > v_limites.lanche THEN
          v_exceptions := v_exceptions || jsonb_build_object(
            'tipo', 'VALOR_LANCHE',
            'solicitado', v_unit_value,
            'limite', v_limites.lanche,
            'excedente', v_unit_value - v_limites.lanche
          );
        END IF;
      END;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'has_exceptions', jsonb_array_length(v_exceptions) > 0,
    'exceptions', v_exceptions,
    'limites', jsonb_build_object(
      'policiais', v_limites.policiais,
      'almoco', v_limites.almoco,
      'jantar', v_limites.jantar,
      'lanche', v_limites.lanche
    )
  );
END;
$$;

-- Grant para uso
GRANT EXECUTE ON FUNCTION detect_juri_exceptions(UUID) TO authenticated;

-- ============================================================
-- 5. TRIGGER PARA UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_autorizacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_autorizacoes_updated_at
  BEFORE UPDATE ON autorizacoes_excepcionais
  FOR EACH ROW
  EXECUTE FUNCTION update_autorizacoes_updated_at();

-- ============================================================
-- 6. COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE autorizacoes_excepcionais IS 'Registra autorizações especiais para processos Extra-Júri que excedem limites padrão';
COMMENT ON COLUMN autorizacoes_excepcionais.tipo_excecao IS 'POLICIAIS = excedeu limite de policiais, VALOR_REFEICAO = excedeu valor de refeição, MULTIPLO = ambos';
COMMENT ON COLUMN autorizacoes_excepcionais.status IS 'Fluxo: PENDENTE -> AGUARDANDO_AJSEFIN -> EM_ANALISE_AJSEFIN -> AGUARDANDO_ORDENADOR -> AUTORIZADO/NEGADO';

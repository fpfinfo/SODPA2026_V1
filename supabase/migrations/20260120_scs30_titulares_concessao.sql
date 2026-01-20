-- =====================================================
-- SCS 3.0 - GESTÃO DE TITULARES E CONCESSÃO EM LOTE
-- =====================================================
-- Tabela central para controle de supridos titulares por comarca/tipo
-- Atualizada automaticamente quando Gestor cria Portarias

-- 1. Tabela de Titulares por Unidade
CREATE TABLE IF NOT EXISTS unidade_titulares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  comarca_id UUID REFERENCES comarcas(id) ON DELETE SET NULL,
  lotacao_id UUID REFERENCES lotacoes(id) ON DELETE SET NULL,
  
  -- Tipo de Suprimento (Ordinário tem titular fixo, Júri também)
  tipo_suprimento TEXT NOT NULL CHECK (tipo_suprimento IN ('ORDINARIO', 'JURI')),
  
  -- Suprido Atual (titular designado)
  suprido_atual_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  servidor_tj_id UUID REFERENCES servidores_tj(id) ON DELETE SET NULL,
  
  -- Portaria que designou este titular
  portaria_vigente_id UUID REFERENCES documentos(id) ON DELETE SET NULL,
  portaria_numero TEXT,
  portaria_data DATE,
  
  -- Status do titular
  status TEXT DEFAULT 'REGULAR' CHECK (status IN ('REGULAR', 'IRREGULAR', 'SUSPENSO', 'SEM_TITULAR')),
  motivo_irregularidade TEXT,
  
  -- Valores padrão mensais para Ordinário
  valor_mensal_custeio NUMERIC(12,2) DEFAULT 0,
  valor_mensal_capital NUMERIC(12,2) DEFAULT 0,
  
  -- Orçamento
  ptres TEXT DEFAULT '8193',
  dotacao_id UUID,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  -- Garantir unicidade: uma comarca só pode ter um titular por tipo
  UNIQUE(comarca_id, tipo_suprimento)
);

-- 2. Histórico de Trocas de Titular
CREATE TABLE IF NOT EXISTS historico_titulares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_titular_id UUID REFERENCES unidade_titulares(id) ON DELETE CASCADE,
  
  -- Quem era e quem virou
  titular_anterior_id UUID REFERENCES profiles(id),
  titular_novo_id UUID REFERENCES profiles(id),
  
  -- Portaria que autorizou
  portaria_id UUID REFERENCES documentos(id),
  portaria_numero TEXT,
  
  -- Metadados
  motivo TEXT,
  data_troca TIMESTAMPTZ DEFAULT now(),
  registrado_por UUID REFERENCES profiles(id)
);

-- 3. Lotes de Concessão (para processamento em massa do Ordinário)
CREATE TABLE IF NOT EXISTS concessao_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação do lote
  competencia TEXT NOT NULL, -- Formato: '2026-01'
  ano INT NOT NULL,
  mes INT NOT NULL,
  
  -- Status do processamento
  status TEXT DEFAULT 'RASCUNHO' CHECK (status IN (
    'RASCUNHO',      -- Em edição
    'PROCESSANDO',   -- Gerando documentos
    'CONCLUIDO',     -- Todos os processos criados
    'PARCIAL',       -- Alguns falharam
    'CANCELADO'      -- Cancelado
  )),
  
  -- Totalizadores
  total_unidades INT DEFAULT 0,
  unidades_processadas INT DEFAULT 0,
  unidades_erro INT DEFAULT 0,
  valor_total NUMERIC(14,2) DEFAULT 0,
  
  -- Responsável
  criado_por UUID REFERENCES profiles(id),
  processado_por UUID REFERENCES profiles(id),
  processado_em TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unicidade: um lote por competência
  UNIQUE(competencia)
);

-- 4. Itens do Lote (cada unidade no lote)
CREATE TABLE IF NOT EXISTS concessao_lote_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID REFERENCES concessao_lotes(id) ON DELETE CASCADE,
  
  -- Unidade/Titular
  unidade_titular_id UUID REFERENCES unidade_titulares(id),
  comarca_id UUID REFERENCES comarcas(id),
  suprido_id UUID REFERENCES profiles(id),
  
  -- Valores definidos para este lote
  valor_custeio NUMERIC(12,2) DEFAULT 0,
  valor_capital NUMERIC(12,2) DEFAULT 0,
  valor_total NUMERIC(12,2) GENERATED ALWAYS AS (valor_custeio + valor_capital) STORED,
  
  -- Orçamento
  ptres TEXT DEFAULT '8193',
  dotacao_id UUID,
  dotacao_codigo TEXT,
  
  -- Processo gerado
  solicitacao_id UUID REFERENCES solicitacoes(id),
  
  -- Status individual
  status TEXT DEFAULT 'PENDENTE' CHECK (status IN (
    'PENDENTE',
    'PROCESSANDO', 
    'SUCESSO',
    'ERRO'
  )),
  erro_mensagem TEXT,
  
  -- Auditoria
  processado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_unidade_titulares_comarca ON unidade_titulares(comarca_id);
CREATE INDEX IF NOT EXISTS idx_unidade_titulares_suprido ON unidade_titulares(suprido_atual_id);
CREATE INDEX IF NOT EXISTS idx_unidade_titulares_tipo ON unidade_titulares(tipo_suprimento);
CREATE INDEX IF NOT EXISTS idx_unidade_titulares_status ON unidade_titulares(status);

CREATE INDEX IF NOT EXISTS idx_concessao_lotes_competencia ON concessao_lotes(competencia);
CREATE INDEX IF NOT EXISTS idx_concessao_lotes_status ON concessao_lotes(status);

CREATE INDEX IF NOT EXISTS idx_concessao_lote_itens_lote ON concessao_lote_itens(lote_id);
CREATE INDEX IF NOT EXISTS idx_concessao_lote_itens_status ON concessao_lote_itens(status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE unidade_titulares ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_titulares ENABLE ROW LEVEL SECURITY;
ALTER TABLE concessao_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE concessao_lote_itens ENABLE ROW LEVEL SECURITY;

-- Políticas para unidade_titulares (leitura para todos autenticados, escrita para SOSFU/ADMIN)
CREATE POLICY "unidade_titulares_select" ON unidade_titulares
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "unidade_titulares_insert" ON unidade_titulares
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND UPPER(role) IN ('SOSFU', 'ADMIN', 'GESTOR'))
  );

CREATE POLICY "unidade_titulares_update" ON unidade_titulares
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND UPPER(role) IN ('SOSFU', 'ADMIN', 'GESTOR'))
  );

-- Políticas para concessao_lotes (apenas SOSFU/ADMIN)
CREATE POLICY "concessao_lotes_select" ON concessao_lotes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "concessao_lotes_all" ON concessao_lotes
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND UPPER(role) IN ('SOSFU', 'ADMIN'))
  );

CREATE POLICY "concessao_lote_itens_select" ON concessao_lote_itens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "concessao_lote_itens_all" ON concessao_lote_itens
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND UPPER(role) IN ('SOSFU', 'ADMIN'))
  );

-- Políticas para historico_titulares
CREATE POLICY "historico_titulares_select" ON historico_titulares
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "historico_titulares_insert" ON historico_titulares
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND UPPER(role) IN ('SOSFU', 'ADMIN', 'GESTOR'))
  );

-- =====================================================
-- TRIGGER: Atualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_unidade_titulares_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_unidade_titulares_updated
  BEFORE UPDATE ON unidade_titulares
  FOR EACH ROW EXECUTE FUNCTION update_unidade_titulares_timestamp();

CREATE TRIGGER trigger_concessao_lotes_updated
  BEFORE UPDATE ON concessao_lotes
  FOR EACH ROW EXECUTE FUNCTION update_unidade_titulares_timestamp();

-- =====================================================
-- SEED: Popular com comarcas existentes
-- =====================================================

-- Inserir registro para cada comarca existente (sem titular inicialmente)
INSERT INTO unidade_titulares (comarca_id, tipo_suprimento, status)
SELECT id, 'ORDINARIO', 'SEM_TITULAR'
FROM comarcas
WHERE NOT EXISTS (
  SELECT 1 FROM unidade_titulares ut 
  WHERE ut.comarca_id = comarcas.id AND ut.tipo_suprimento = 'ORDINARIO'
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE unidade_titulares IS 'Tabela mestre de titulares de suprimento por comarca/tipo. Fonte da verdade para concessão em lote.';
COMMENT ON TABLE concessao_lotes IS 'Lotes de concessão mensal do Ordinário. SOSFU processa em massa.';
COMMENT ON TABLE concessao_lote_itens IS 'Itens individuais de cada lote, com valores e status de processamento.';

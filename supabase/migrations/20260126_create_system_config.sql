-- ==========================================
-- SISTEMA DE CONCESSÃO DE SUPRIMENTOS (SCS-TJPA)
-- MIGRATION: CREATE SYSTEM_CONFIG TABLE
-- ==========================================

-- Tabela para armazenar configurações globais do sistema
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'string', -- string, number, boolean
  descricao TEXT,
  categoria TEXT DEFAULT 'GERAL',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.system_config IS 'Configurações globais do sistema SCS';
COMMENT ON COLUMN public.system_config.chave IS 'Chave única do parâmetro';
COMMENT ON COLUMN public.system_config.valor IS 'Valor do parâmetro (armazenado como texto)';
COMMENT ON COLUMN public.system_config.tipo IS 'Tipo de dado: string, number, boolean';
COMMENT ON COLUMN public.system_config.categoria IS 'Categoria: FINANCEIRO, ALIMENTACAO, JURI, SISTEMA';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW EXECUTE FUNCTION update_system_config_updated_at();

-- RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer autenticado pode ler
CREATE POLICY "system_config_select_authenticated" ON public.system_config
  FOR SELECT TO authenticated USING (true);

-- Política: Apenas GOVERNANCA/ADMIN pode modificar
CREATE POLICY "system_config_modify_admin" ON public.system_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_sistema us
      WHERE us.user_id = auth.uid() AND us.role = 'GOVERNANCE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios_sistema us
      WHERE us.user_id = auth.uid() AND us.role = 'GOVERNANCE'
    )
  );

-- Inserir valores padrão
INSERT INTO public.system_config (chave, valor, tipo, descricao, categoria) VALUES
  ('limit_value', '15000', 'number', 'Limite máximo para suprimento extraordinário (R$)', 'FINANCEIRO'),
  ('meal_lunch', '30', 'number', 'Valor unitário - Almoço (R$)', 'ALIMENTACAO'),
  ('meal_dinner', '25', 'number', 'Valor unitário - Jantar (R$)', 'ALIMENTACAO'),
  ('meal_snack', '10', 'number', 'Valor unitário - Lanche (R$)', 'ALIMENTACAO'),
  ('juri_servidores', '7', 'number', 'Limite máximo de servidores por sessão de júri', 'JURI'),
  ('juri_defensor', '2', 'number', 'Limite máximo de defensores públicos por sessão de júri', 'JURI'),
  ('juri_promotor', '2', 'number', 'Limite máximo de promotores por sessão de júri', 'JURI'),
  ('juri_policias', '5', 'number', 'Limite máximo de policiais (escolta) por sessão de júri', 'JURI'),
  ('maintenance_mode', 'false', 'boolean', 'Modo de manutenção do sistema', 'SISTEMA')
ON CONFLICT (chave) DO NOTHING;

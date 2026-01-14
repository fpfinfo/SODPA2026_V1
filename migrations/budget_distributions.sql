-- ==========================================
-- SCS-TJPA - MIGRAÇÃO: BUDGET_DISTRIBUTIONS
-- Tabela para Matriz de Distribuição Orçamentária por Comarca
-- ==========================================

-- Criar tabela de distribuições orçamentárias
CREATE TABLE IF NOT EXISTS public.budget_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comarca_id UUID NOT NULL REFERENCES public.comarcas(id) ON DELETE CASCADE,
  annual_value NUMERIC(12,2) DEFAULT 6000.00,
  split_consumption NUMERIC(5,2) DEFAULT 20,  -- 3.3.90.30.01 Material de Consumo
  split_fuel NUMERIC(5,2) DEFAULT 20,         -- 3.3.90.30.02 Combustível
  split_transport NUMERIC(5,2) DEFAULT 20,    -- 3.3.90.33 Passagens e Locomoção
  split_service_pf NUMERIC(5,2) DEFAULT 20,   -- 3.3.90.36 Serviços Terceiros PF
  split_service_pj NUMERIC(5,2) DEFAULT 20,   -- 3.3.90.39 Serviços Terceiros PJ
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comarca_id)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_budget_dist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_budget_dist_updated_at
BEFORE UPDATE ON public.budget_distributions
FOR EACH ROW EXECUTE FUNCTION public.handle_budget_dist_updated_at();

-- RLS Policy (acesso livre para SOSFU)
ALTER TABLE public.budget_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SOSFU Full Access" ON public.budget_distributions
FOR ALL USING (true);

-- Comentários
COMMENT ON TABLE public.budget_distributions IS 'Matriz de distribuição orçamentária por comarca para geração de lotes ordinários';
COMMENT ON COLUMN public.budget_distributions.annual_value IS 'Teto anual em R$ para a comarca';
COMMENT ON COLUMN public.budget_distributions.split_consumption IS 'Percentual para Material de Consumo (30.01)';
COMMENT ON COLUMN public.budget_distributions.split_fuel IS 'Percentual para Combustível (30.02)';
COMMENT ON COLUMN public.budget_distributions.split_transport IS 'Percentual para Passagens e Locomoção (33)';
COMMENT ON COLUMN public.budget_distributions.split_service_pf IS 'Percentual para Serviços Terceiros PF (36)';
COMMENT ON COLUMN public.budget_distributions.split_service_pj IS 'Percentual para Serviços Terceiros PJ (39)';

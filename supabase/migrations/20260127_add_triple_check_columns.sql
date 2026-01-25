-- ============================================================
-- MIGRATION: Triple Check Columns
-- Date: 2026-01-27
-- Description: Adds value columns for NE, DL, and OB to enable
-- rigorous financial validation (Triple Check).
-- ============================================================

-- Add value columns to solicitacoes
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS ne_valor DECIMAL(15,2);
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS dl_valor DECIMAL(15,2);
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS ob_valor DECIMAL(15,2);

-- Add comments
COMMENT ON COLUMN solicitacoes.ne_valor IS 'Valor monetário registrado na Nota de Empenho';
COMMENT ON COLUMN solicitacoes.dl_valor IS 'Valor monetário registrado no Documento de Liquidação';
COMMENT ON COLUMN solicitacoes.ob_valor IS 'Valor monetário registrado na Ordem Bancária';

-- Create a function to check integrity
CREATE OR REPLACE FUNCTION check_financial_integrity(
  p_ne DECIMAL, 
  p_dl DECIMAL, 
  p_ob DECIMAL, 
  p_total DECIMAL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Returns TRUE only if all values match exactly
  RETURN (
    p_ne IS NOT NULL AND 
    p_dl IS NOT NULL AND 
    p_ob IS NOT NULL AND 
    p_ne = p_dl AND 
    p_dl = p_ob AND 
    p_ob = p_total
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

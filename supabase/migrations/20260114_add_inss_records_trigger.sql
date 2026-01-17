-- ============================================
-- Migration: Create trigger for INSS retention records
-- Applied via: MCP on 2026-01-14
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

-- Create function to track INSS retention records
CREATE OR REPLACE FUNCTION create_inss_retention_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert INSS retention record when a process is finalized
  IF NEW.status = 'CONCLUIDO' AND OLD.status != 'CONCLUIDO' THEN
    INSERT INTO retencoes_inss (
      solicitacao_id,
      valor_base,
      aliquota_empregado,
      valor_retido_empregado,
      aliquota_patronal,
      valor_retido_patronal,
      gdr_numero,
      status_pagamento
    ) VALUES (
      NEW.id,
      NEW.valor_total,
      0.11, -- Default 11%
      NEW.valor_total * 0.11,
      0.20, -- Default 20%
      NEW.valor_total * 0.20,
      NULL,
      'PENDENTE'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_create_inss_record ON solicitacoes;
CREATE TRIGGER trigger_create_inss_record
  AFTER UPDATE ON solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION create_inss_retention_record();

COMMENT ON FUNCTION create_inss_retention_record IS 'Automatically creates INSS retention record when process is finalized';

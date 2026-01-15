-- Migration: Create INSS Retention Records Table
-- Description: Table for storing PF service tax retention data (element 3.3.90.36)
-- Author: SISUP Tax Integration Module
-- Date: 2026-01-14

-- Create table for INSS retention records (PF services - element 3.3.90.36)
CREATE TABLE IF NOT EXISTS inss_retencao_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider data (required for eSocial/EFD-Reinf)
  cpf VARCHAR(14) NOT NULL,
  nome_completo TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  pis_nit VARCHAR(20) NOT NULL,
  
  -- Financial data
  valor_bruto DECIMAL(15,2) NOT NULL,
  inss_retido DECIMAL(15,2) NOT NULL,  -- 11% retained from provider
  inss_patronal DECIMAL(15,2) NOT NULL, -- 20% employer contribution
  iss_retido DECIMAL(15,2) DEFAULT 0,   -- 5% municipal tax
  valor_liquido DECIMAL(15,2) NOT NULL, -- Net value to pay
  
  -- Process reference
  solicitacao_id UUID REFERENCES solicitacoes(id) ON DELETE SET NULL,
  processo_numero TEXT NOT NULL,
  portaria_sf TEXT,
  
  -- Location and service info
  comarca TEXT NOT NULL,
  atividade TEXT NOT NULL,
  data_prestacao DATE NOT NULL,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  gdr_numero TEXT,
  gdr_data_pagamento DATE,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inss_records_cpf ON inss_retencao_records(cpf);
CREATE INDEX IF NOT EXISTS idx_inss_records_solicitacao ON inss_retencao_records(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_inss_records_status ON inss_retencao_records(status);
CREATE INDEX IF NOT EXISTS idx_inss_records_data_prestacao ON inss_retencao_records(data_prestacao);
CREATE INDEX IF NOT EXISTS idx_inss_records_comarca ON inss_retencao_records(comarca);

-- Add comment for documentation
COMMENT ON TABLE inss_retencao_records IS 'Registros de retenção INSS para serviços de Pessoa Física (elemento 3.3.90.36). Integração automática com prestação de contas.';

-- Enable RLS
ALTER TABLE inss_retencao_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "SOSFU can view all INSS records" ON inss_retencao_records
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "SOSFU can insert INSS records" ON inss_retencao_records
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "SOSFU can update INSS records" ON inss_retencao_records
  FOR UPDATE TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_inss_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inss_records_updated_at ON inss_retencao_records;
CREATE TRIGGER trigger_inss_records_updated_at
  BEFORE UPDATE ON inss_retencao_records
  FOR EACH ROW
  EXECUTE FUNCTION update_inss_records_updated_at();

-- Add missing columns to comprovantes_pc table
ALTER TABLE comprovantes_pc 
ADD COLUMN IF NOT EXISTS file_hash text,
ADD COLUMN IF NOT EXISTS ocr_data jsonb,
ADD COLUMN IF NOT EXISTS ocr_confidence numeric,
ADD COLUMN IF NOT EXISTS sentinela_risk text,
ADD COLUMN IF NOT EXISTS sentinela_alerts jsonb,
ADD COLUMN IF NOT EXISTS validado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS validado_at timestamptz,
ADD COLUMN IF NOT EXISTS validado_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS glosa_valor numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS glosa_motivo text,
ADD COLUMN IF NOT EXISTS prestador_pf_dados jsonb,
ADD COLUMN IF NOT EXISTS inss_retido numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS iss_retido numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_liquido numeric DEFAULT 0;

-- Create index for file_hash to speed up duplicate checks
CREATE INDEX IF NOT EXISTS idx_comprovantes_pc_file_hash ON comprovantes_pc(file_hash);

-- Refresh schema cache
NOTIFY pgrst, 'reload config';

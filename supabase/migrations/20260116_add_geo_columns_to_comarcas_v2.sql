-- Add polo and regiao columns to comarcas table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comarcas' AND column_name = 'polo') THEN
        ALTER TABLE public.comarcas ADD COLUMN polo VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comarcas' AND column_name = 'regiao') THEN
        ALTER TABLE public.comarcas ADD COLUMN regiao VARCHAR(100);
    END IF;
END $$;

-- Update existing comarcas with correct Polo and Regiao data
UPDATE comarcas SET polo = 'Pólo Belém', regiao = '1ª Região (Metropolitana)' WHERE codigo IN ('BEL', 'ANA');
UPDATE comarcas SET polo = 'Pólo Santarém', regiao = '3ª Região (Baixo Amazonas)' WHERE codigo = 'SAN';
UPDATE comarcas SET polo = 'Pólo Marabá', regiao = '4ª Região (Sudeste)' WHERE codigo IN ('MAR', 'PAR');
UPDATE comarcas SET polo = 'Pólo Castanhal', regiao = '2ª Região (Nordeste)' WHERE codigo IN ('CAS', 'MDR');
UPDATE comarcas SET polo = 'Pólo Tucuruí', regiao = '5ª Região (Sudoeste)' WHERE codigo = 'TUC';
UPDATE comarcas SET polo = 'Pólo Altamira', regiao = '6ª Região (Xingu)' WHERE codigo = 'ALT';
UPDATE comarcas SET polo = 'Pólo Abaetetuba', regiao = '7ª Região (Tocantins)' WHERE codigo = 'ABA';

-- Create index for faster analytics grouping
CREATE INDEX IF NOT EXISTS idx_comarcas_polo ON comarcas(polo);
CREATE INDEX IF NOT EXISTS idx_comarcas_regiao ON comarcas(regiao);
CREATE INDEX IF NOT EXISTS idx_comarcas_entrancia ON comarcas(entrancia);

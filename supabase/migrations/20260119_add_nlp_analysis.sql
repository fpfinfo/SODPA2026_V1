-- Migration: Add NLP analysis field to solicitacoes table
-- Description: Stores AI-powered justification analysis results from Gemini

ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS nlp_analysis JSONB DEFAULT NULL;

-- Index for filtering by approval status
CREATE INDEX IF NOT EXISTS idx_solicitacoes_nlp_aprovado 
ON solicitacoes ((nlp_analysis->>'aprovado'));

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_solicitacoes_nlp_categoria 
ON solicitacoes ((nlp_analysis->>'categoria'));

-- Comments for documentation
COMMENT ON COLUMN solicitacoes.nlp_analysis IS 'AI analysis result from Gemini: {
  "aprovado": boolean,
  "categoria": "CONSUMO"|"SERVICO_PF"|"SERVICO_PJ"|"VIAGEM"|"OUTRA",
  "confianca": 0-100,
  "motivo_rejeicao": string|null,
  "sugestao_analista": string,
  "elementos_detectados": string[],
  "analyzed_at": timestamp
}';

-- Add scheduling columns to solicitacoes for task planning
-- Run this migration after creating the solicitacoes table

ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS data_planejada date;
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS prioridade_usuario smallint DEFAULT 2 CHECK (prioridade_usuario >= 1 AND prioridade_usuario <= 3);
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS notas_planejamento text;

-- Add user capacity setting to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS capacidade_diaria integer DEFAULT 20;

-- Index for efficient queries by scheduled date
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data_planejada ON solicitacoes(data_planejada);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_assigned_scheduled ON solicitacoes(assigned_to, data_planejada);

COMMENT ON COLUMN solicitacoes.data_planejada IS 'Data agendada pelo membro SOSFU para atender o processo';
COMMENT ON COLUMN solicitacoes.prioridade_usuario IS 'Prioridade definida pelo usuário (1=Alta, 2=Média, 3=Baixa)';
COMMENT ON COLUMN solicitacoes.notas_planejamento IS 'Notas de planejamento do membro SOSFU';
COMMENT ON COLUMN profiles.capacidade_diaria IS 'Capacidade diária de processos do usuário (configurável)';

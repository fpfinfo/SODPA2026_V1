-- Índices de Performance para Tabelas Críticas
-- Otimização de Joins e Filtros Frequentes

-- 1. Tabela: nomeacoes_responsaveis (Recém criada)
CREATE INDEX IF NOT EXISTS idx_nomeacoes_unidade_id ON nomeacoes_responsaveis(unidade_id);
CREATE INDEX IF NOT EXISTS idx_nomeacoes_gestor_id ON nomeacoes_responsaveis(gestor_id);
CREATE INDEX IF NOT EXISTS idx_nomeacoes_status ON nomeacoes_responsaveis(status);

-- 2. Tabela: unidade_titulares (Tabela central de gestão)
CREATE INDEX IF NOT EXISTS idx_unidade_titulares_comarca_id ON unidade_titulares(comarca_id);
CREATE INDEX IF NOT EXISTS idx_unidade_titulares_suprido_atual_id ON unidade_titulares(suprido_atual_id);
CREATE INDEX IF NOT EXISTS idx_unidade_titulares_status ON unidade_titulares(status);
CREATE INDEX IF NOT EXISTS idx_unidade_titulares_tipo ON unidade_titulares(tipo_suprimento);

-- 3. Tabela: documentos (Volume alto, busca por timeline)
-- Assumindo existência baseada em migrations anteriores
CREATE INDEX IF NOT EXISTS idx_documentos_processo_id ON documentos(processo_id); -- ou tabela relacionada
CREATE INDEX IF NOT EXISTS idx_documentos_created_at ON documentos(created_at DESC);

-- 4. Tabela: comarcas (Buscas parciais por nome)
-- Habilita busca trigram se extensão pg_trgm estiver ativa, senão btree normal
CREATE INDEX IF NOT EXISTS idx_comarcas_nome_search ON comarcas USING btree (nome);

-- 5. Solicitacoes / Processos (Busca por NUP e Status)
-- Ajustar nome da tabela se for 'processos' ou 'solicitacoes'
-- Baseado em '20260118_add_ptres_to_solicitacoes.sql' a tabela é 'solicitacoes'
CREATE INDEX IF NOT EXISTS idx_solicitacoes_nup ON solicitacoes(nup);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_responsavel_id ON solicitacoes(responsavel_id);

-- 6. Perfis (Profiles) e Servidores
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_servidores_tj_email ON servidores_tj(email);

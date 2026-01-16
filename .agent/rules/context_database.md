---
description: Regras de validação para trabalho em migrations/ e schema SQL
applies_to: ["**/migrations/**", "**/supabase/**/*.sql", "database.sql"]
---

# Modo Database - Validação SQL Supabase

## Quando Ativo
Esta regra se aplica automaticamente quando você está trabalhando em:
- `supabase/migrations/*.sql`
- `database.sql`
- Qualquer arquivo SQL no projeto

## Validações Obrigatórias

### 1. Integridade Referencial
✅ **SEMPRE verifique:**
- Foreign keys apontam para tabelas existentes
- Tipos de dados são compatíveis entre FK e PK
- ON DELETE e ON UPDATE estão definidos adequadamente

### 2. RLS Policies (Row Level Security)
✅ **SEMPRE inclua:**
```sql
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Users can view their own data"
ON nome_tabela FOR SELECT
USING (auth.uid() = user_id);

-- Política para INSERT/UPDATE/DELETE conforme necessário
```

### 3. Índices de Performance
✅ **SEMPRE crie índices para:**
- Chaves estrangeiras: `CREATE INDEX idx_tabela_fk ON tabela(fk_column);`
- Campos de filtro frequente: `status`, `tipo`, `active`
- Campos de ordenação: `created_at`, `data_solicitacao`

### 4. Triggers e Timestamps
✅ **SEMPRE adicione:**
```sql
CREATE TRIGGER update_updated_at
BEFORE UPDATE ON nome_tabela
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 5. Dados de Referência (Master Data)
✅ **Para tabelas NE, DL, OB:**
- Valide que códigos seguem padrão institucional (ex: "3390.30")
- Mantenha `ativo = true` para registros em uso
- Preserve hierarquia (Natureza → Despesa → Obs Econômica → Elemento)

## Checklist Pré-Commit
Antes de aplicar migração:
- [ ] RLS habilitado e políticas criadas
- [ ] Índices nas FKs e campos de filtro
- [ ] Trigger de `updated_at` configurado
- [ ] Dados de seed preparados (se aplicável)
- [ ] Testado localmente antes de push

## Padrões SOSFU Específicos

### Tabelas Financeiras
```sql
-- SEMPRE inclua campos de auditoria
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
created_by UUID REFERENCES auth.users(id),
ativo BOOLEAN DEFAULT true
```

### Tabelas de Solicitações
```sql
-- SEMPRE mantenha histórico completo
status VARCHAR(50) NOT NULL,
historico_status JSONB DEFAULT '[]'::jsonb,
metadata JSONB DEFAULT '{}'::jsonb
```

## ⚠️ NUNCA FAÇA
- ❌ DROP TABLE em produção sem backup
- ❌ ALTER COLUMN sem verificar impacto em queries existentes
- ❌ Remover RLS de tabelas com dados sensíveis
- ❌ Criar FKs sem ON DELETE/ON UPDATE

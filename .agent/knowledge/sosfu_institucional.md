# Conhecimento Institucional SOSFU - TJPA

## 🎯 Diretrizes de Atuação

### Posicionamento Estratégico
Atue como **parceiro de pensamento sênior** para o Diretor de Finanças do TJPA. Sua expertise está focada em:
- Conformidade legal e institucional
- Otimização de processos financeiros
- Validação de documentação fiscal (NE, DL, OB)
- Governança em suprimento de fundos

### Pilares Centrais do Projeto
As seguintes estruturas organizacionais são fundamentais para o ecossistema SISUP:
- **SEFIN** - Secretaria-mãe que coordena toda a área financeira
- **DEFIN** - Execução da despesa pública
- **SOSFU** - Core do sistema de suprimento de fundos
- **AJSEFIN** - Validação jurídica de processos financeiros
- **ASSEFIN** - Assessoria técnica de planejamento
- **COORC** - Controle orçamentário
- **CODAR** - Arrecadação de receitas
- **SODPA** - Gestão de diárias e passagens

### Foco Técnico
**Prioridade absoluta:** Módulo de Suprimento de Fundos
- Validação rigorosa de **NE** (Notas de Empenho)
- Conformidade de **DL** (Documentos de Liquidação)
- Verificação de **OB** (Ordens Bancárias)
- Integridade da trilha de auditoria completa

### Arquitetura de Dados
- **Persistência Principal:** Supabase (PostgreSQL)
- **Analytics/Dashboard:** Firebase
- **Escala:** 144 comarcas do estado do Pará
- **Princípio:** Preservação absoluta de dados históricos

## Dicionário de Siglas Institucionais

### Diretorias e Coordenadorias
- **DEFIN**: Diretoria de Execução Financeira (Departamento Financeiro) - responsável pela execução orçamentária
- **SEFIN**: Secretaria de Planejamento, Coordenação e Finanças - secretaria-mãe que coordena todas as áreas financeiras
- **SOSFU**: Seção de Suprimento de Fundos (Serviço de Suprimento de Fundos) - gerencia fundos especiais e prestações de contas
- **SEFIN**: Secretaria de Finanças - responsável por planejamento orçamentário
- **COORC**: Coordenadoria de Orçamento (Coordenadoria Orçamentária) - coordena o orçamento institucional
- **CODAR**: Coordenadoria de Arrecadação - responsável pela arrecadação de receitas
- **AJSEFIN**: Assessoria Jurídica da Secretaria de Planejamento - suporte jurídico para SEFIN
- **ASSEFIN**: Assessoria de Planejamento - assessoria técnica de planejamento financeiro
- **SODPA**: Serviço de Diárias e Passagens Aéreas - gerencia despesas com diárias e viagens
- **SGP**: Sistema de Gestão de Pessoas - módulo de RH do SISUP

### Conceitos Financeiros
- **PC**: Prestação de Contas - documento final do ciclo de suprimento
- **NE**: Natureza de Despesa - classificação orçamentária (ex: 3.3.90.30)
- **DL**: Desdobramento da Natureza de Despesa
- **OB**: Observação Econômica - classificação econômica da despesa
- **ED**: Elemento de Despesa - último nível da classificação orçamentária
- **TCE**: Tribunal de Contas do Estado - órgão de controle externo
- **INSS**: Instituto Nacional do Seguro Social - retenção previdenciária

### Status de Processo
- **EM_ELABORACAO**: Processo sendo criado pelo suprido
- **AGUARDANDO_AUTORIZACAO**: Aguardando aprovação do gestor
- **AGUARDANDO_AJSEFIN**: Na fila da assessoria jurídica
- **AGUARDANDO_SOSFU**: Na mesa técnica SOSFU
- **AGUARDANDO_SEFIN**: Aguardando análise orçamentária
- **DEFERIDO**: Aprovado e pronto para execução
- **INDEFERIDO**: Negado por não conformidade
- **EM_EXECUCAO**: Sendo executado pelo suprido
- **AGUARDANDO_PC**: Aguardando prestação de contas
- **PC_EM_ANALISE**: PC em análise técnica
- **CONCLUIDO**: Processo finalizado e regular

## Regras de Negócio - Suprimento de Fundos

### Limites Legais (Resolução CNJ nº 169/2013)
```typescript
const LIMITES_LEGAIS = {
  // Limite individual por suprimento
  LIMITE_INDIVIDUAL: 15000.00, // R$ 15.000,00
  
  // Prazo máximo para aplicação
  PRAZO_APLICACAO_DIAS: 90, // 90 dias corridos
  
  // Prazo para prestação de contas
  PRAZO_PRESTACAO_DIAS: 30, // 30 dias após fim da aplicação
  
  // Tipos permitidos
  TIPOS_PERMITIDOS: [
    'ORDINARIO', // Despesa prevista
    'EXTRA', // Despesa imprevista
    'EMERGENCIAL', // Urgência comprovada
    'JURI' // Júri popular
  ]
}
```

### Validações Obrigatórias

#### 1. Natureza de Despesa Permitida
✅ **Apenas elementos autorizados:**
- 3.3.90.30 - Material de Consumo
- 3.3.90.36 - Outros Serviços de Terceiros - Pessoa Física
- 3.3.90.39 - Outros Serviços de Terceiros - Pessoa Jurídica
- 3.3.90.47 - Obrigações Tributárias e Contributivas

❌ **NUNCA autorize:**
- Despesas de pessoal (categoria 3.1.x.x)
- Investimentos permanentes (categoria 4.4.x.x)

#### 2. Separação de Poderes
```typescript
// ✅ NUNCA permita que um usuário seja simultaneamente:
const INCOMPATIBILIDADES = {
  SUPRIDO_GESTOR: false, // Suprido não pode ser seu próprio gestor
  GESTOR_ANALISTA_SOSFU: false, // Gestor não pode analisar no SOSFU
  AJSEFIN_SUPRIDO: false // Jurídico não pode ser suprido do mesmo processo
}
```

#### 3. Workflow Obrigatório
```
SUPRIDO (cria) 
  → GESTOR (autoriza) 
    → AJSEFIN (valida legalidade) 
      → SOSFU (emite autorização) 
        → SEFIN (libera orçamento)
          → SUPRIDO (executa)
            → SOSFU (analisa PC)
              → TCE (homologa)
```

### Documentos Obrigatórios

#### Para Autorização
1. **Portaria de Concessão** (gerada pelo sistema)
2. **Termo de Compromisso** (assinado pelo suprido)
3. **Justificativa** (obrigatória para EXTRA e EMERGENCIAL)

#### Para Prestação de Contas
1. **Certidão de Regularidade** (se dentro do prazo)
2. **Notas Fiscais** (todas as despesas)
3. **Comprovantes de Pagamento** (transferências/depósitos)
4. **Guias INSS** (se houver retenção)
5. **Planilha de Execução** (valores aplicados)

## Regras de Interface - Sentinela Audit

### Alertas por Severidade
```typescript
const ALERTAS_CLASSIFICACAO = {
  CRITICO: {
    color: 'red',
    exemplos: [
      'Valor acima do limite legal',
      'Prazo de PC vencido há mais de 30 dias',
      'Elemento de despesa não permitido'
    ]
  },
  ALTO: {
    color: 'orange', 
    exemplos: [
      'Prazo de aplicação próximo do vencimento (< 10 dias)',
      'Notas fiscais com divergências de valor',
      'Ausência de retenção INSS obrigatória'
    ]
  },
  MEDIO: {
    color: 'yellow',
    exemplos: [
      'Dossiê incompleto',
      'Justificativa genérica',
      'Falta assinatura digital'
    ]
  },
  BAIXO: {
    color: 'blue',
    exemplos: [
      'Recomendação de melhoria',
      'Sugestão de otimização'
    ]
  }
}
```

### Gatilhos de IA (OCR + Validação)
```typescript
// Quando upload de nota fiscal é feito:
const validarNotaFiscal = async (arquivo: File) => {
  // 1. OCR extrai dados
  const dados = await ocrService.extrair(arquivo)
  
  // 2. Valida campos obrigatórios
  if (!dados.cnpj || !dados.valor || !dados.data) {
    return { alerta: 'CRITICO', msg: 'Nota fiscal ilegível ou incompleta' }
  }
  
  // 3. Valida limite por item (15% do total)
  if (dados.valor > processo.valor_total * 0.15) {
    return { alerta: 'ALTO', msg: 'Item acima de 15% do total do PC' }
  }
  
  // 4. Valida data dentro do período de aplicação
  if (dados.data < processo.data_inicio || dados.data > processo.data_fim) {
    return { alerta: 'CRITICO', msg: 'Nota fora do período de aplicação' }
  }
  
  return { alerta: 'OK' }
}
```

## Perfis RBAC

### Permissões por Módulo
```typescript
const PERMISSOES_POR_PERFIL = {
  SUPRIDO: {
    modulos: ['SUPRIDO_DASHBOARD'],
    acoes: ['criar_solicitacao', 'prestar_contas', 'visualizar_proprio']
  },
  GESTOR: {
    modulos: ['GESTOR_DASHBOARD'],
    acoes: ['autorizar', 'indeferir', 'visualizar_subordinados']
  },
  AJSEFIN: {
    modulos: ['AJSEFIN_DASHBOARD'],
    acoes: ['analisar_juridico', 'solicitar_ajustes', 'visualizar_todos']
  },
  SOSFU: {
    modulos: ['SOSFU_DASHBOARD'],
    acoes: ['emitir_portaria', 'analisar_pc', 'gerar_certidao', 'visualizar_todos']
  },
  SEFIN: {
    modulos: ['SEFIN_DASHBOARD'],
    acoes: ['liberar_orcamento', 'bloquear_verba', 'visualizar_todos']
  },
  SGP: {
    modulos: ['SGP_DASHBOARD'],
    acoes: ['gerenciar_equipe', 'atribuir_papeis', 'visualizar_todos']
  },
  ADMIN: {
    modulos: ['*'],
    acoes: ['*']
  }
}
```

## Boas Práticas de Performance

### Cache de Dados Mestres
```typescript
// ✅ Carregar uma vez e cachear em sessão
const DADOS_PARA_CACHEAR = [
  'comarcas', // 144 registros
  'unidades', // ~300 registros
  'elementos_despesa', // ~50 registros ativos
  'naturezas_despesa', // ~20 registros
  'tipos_solicitacao', // 4 registros
  'status_workflow' // 12 registros
]
```

### Otimização de Queries SOSFU
```sql
-- ✅ SEMPRE use índices nas queries mais comuns
CREATE INDEX idx_solicitacoes_status ON solicitacoes(status) WHERE ativo = true;
CREATE INDEX idx_solicitacoes_suprido ON solicitacoes(suprido_id) WHERE ativo = true;
CREATE INDEX idx_solicitacoes_created ON solicitacoes(created_at DESC);
CREATE INDEX idx_pc_status ON prestacoes_contas(status) WHERE ativo = true;
```

## Glossário Técnico

- **Suprido**: Servidor responsável por executar o suprimento
- **Gestor**: Superior hierárquico que autoriza o suprimento
- **Mesa Técnica**: Equipe SOSFU que analisa solicitações
- **Portaria**: Ato administrativo que autoriza o suprimento
- **Certidão**: Documento que atesta regularidade da PC
- **Dossiê Digital**: Conjunto de documentos anexados ao processo
- **Tramitação**: Movimentação do processo entre setores
- **RLS (Row Level Security)**: Política de segurança a nível de linha no banco
- **RBAC (Role-Based Access Control)**: Controle de acesso baseado em papéis

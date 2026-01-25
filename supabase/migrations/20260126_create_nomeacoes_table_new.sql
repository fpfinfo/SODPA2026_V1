-- Nova tabela para rastrear nomeações de supridos
CREATE TABLE IF NOT EXISTS nomeacoes_responsaveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID NOT NULL REFERENCES comarcas(id),
  gestor_id UUID REFERENCES profiles(id), -- Gestor que fez a nomeação
  
  -- Dados do Suprido Atual (Snapshot)
  suprido_atual_id UUID REFERENCES profiles(id),
  suprido_atual_nome TEXT,
  
  -- Dados do Novo Suprido
  novo_suprido_nome TEXT NOT NULL,
  novo_suprido_cpf TEXT NOT NULL,
  novo_suprido_matricula TEXT NOT NULL,
  novo_suprido_email TEXT, -- Opcional, para contato
  novo_suprido_cargo TEXT,
  
  -- Detalhes da Portaria
  tipo_suprimento TEXT[] DEFAULT '{ORDINARIO,JURI}', -- PTRES 8193, 8163
  motivo_troca TEXT,
  data_efeito DATE DEFAULT CURRENT_DATE,
  
  -- Documento Gerado
  portaria_conteudo TEXT, -- Texto completo da portaria
  portaria_numero_gerado TEXT, -- Ex: 001/2026-GAB
  
  -- Controle de Assinatura
  assinado_por_gestor BOOLEAN DEFAULT FALSE,
  assinado_em TIMESTAMP WITH TIME ZONE,
  signature_hash TEXT, -- Hash da assinatura digital
  
  -- Fluxo SOSFU
  status TEXT DEFAULT 'PENDENTE_SOSFU', -- PENDENTE_SOSFU, APROVADO, REJEITADO
  analisado_por UUID REFERENCES profiles(id),
  analisado_em TIMESTAMP WITH TIME ZONE,
  analise_obs TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE nomeacoes_responsaveis ENABLE ROW LEVEL SECURITY;

-- Gestor pode ver e criar para sua unidade
CREATE POLICY "Gestores podem ver suas nomeacoes" ON nomeacoes_responsaveis
  FOR ALL USING (
    auth.uid() = gestor_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('GESTOR', 'SOSFU', 'ADMIN', 'SEFIN')
    )
  );

-- Garantir que unidade_titulares tenha coluna para flag de pendencia (para performance da UI)
ALTER TABLE unidade_titulares ADD COLUMN IF NOT EXISTS nomeacao_pendente_id UUID REFERENCES nomeacoes_responsaveis(id);

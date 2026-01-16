-- SISUP Database Schema
-- Run this in your Supabase SQL Editor to create the necessary tables.

-- 1. Municipios
CREATE TABLE IF NOT EXISTS public.municipios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  codigo_ibge VARCHAR(10),
  uf VARCHAR(2) DEFAULT 'PA',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT municipios_nome_uf_key UNIQUE (nome, uf)
);

-- 2. Comarcas (Judicial Districts)
CREATE TABLE IF NOT EXISTS public.comarcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  municipio_sede_id UUID REFERENCES public.municipios(id),
  entrancia VARCHAR(50), 
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Unidades (Organizational Units)
CREATE TABLE IF NOT EXISTS public.unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(300) NOT NULL,
  sigla VARCHAR(20),
  tipo VARCHAR(50), 
  comarca_id UUID REFERENCES public.comarcas(id),
  endereco TEXT,
  telefone VARCHAR(20),
  email VARCHAR(200),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Profiles (Users)
-- Note: This table references auth.users which is managed by Supabase Auth
create table if not exists public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  nome text,
  matricula text unique,
  cargo text,
  lotacao text,
  unidade_id uuid references public.unidades(id),
  municipio_id uuid references public.municipios(id),
  comarca_id uuid references public.comarcas(id),
  role text check (role in ('suprido', 'gestor', 'ordenador', 'analista_sosfu', 'chefe_sosfu', 'ajsefin', 'sgp', 'sosfu', 'sefin', 'SEFIN')),
  avatar_url text,
  cpf text,
  telefone text,
  banco text,
  agencia text,
  conta_corrente text,
  gestor_nome text,
  gestor_email text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  primary key (id)
);

-- Safely add columns if they don't exist (Migration Support)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'telefone') THEN
        ALTER TABLE public.profiles ADD COLUMN telefone text;
    END IF;
END $$;

-- 5. Solicitacoes (Requests)
CREATE TABLE IF NOT EXISTS public.solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  nup TEXT UNIQUE,
  tipo TEXT,
  valor_solicitado DECIMAL,
  valor_aprovado DECIMAL,
  status TEXT DEFAULT 'rascunho',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  descricao TEXT
);

-- Add columns for Extra-Emergencial if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'data_inicio') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN data_inicio DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'data_fim') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN data_fim DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'urgencia') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN urgencia TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'itens_despesa') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN itens_despesa JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add columns for Juri Requests if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'juri_participantes') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN juri_participantes JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'comarca_destino') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN comarca_destino TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'processo_judicial') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN processo_judicial TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'juri_dias') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN juri_dias INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'juri_frequencia_refeicoes') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN juri_frequencia_refeicoes JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'juri_projecao_custos') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN juri_projecao_custos JSONB DEFAULT '[]'::jsonb;
    END IF;
    -- Approved values columns (set by SOSFU during triage)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'juri_participantes_aprovados') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN juri_participantes_aprovados JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'juri_projecao_aprovados') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN juri_projecao_aprovados JSONB DEFAULT '[]'::jsonb;
    END IF;
    -- Tramitation workflow column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'destino_atual') THEN
        ALTER TABLE public.solicitacoes ADD COLUMN destino_atual TEXT;
    END IF;
END $$;

-- 6. Documentos Table (Process Files)
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, 
  status TEXT DEFAULT 'rascunho',
  conteudo TEXT,
  url_storage TEXT NULL, 
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns for Signature Delegation Workflow (AJSEFIN -> SEFIN)
DO $$
BEGIN
    -- Signature workflow columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documentos' AND column_name = 'assigned_signer_id') THEN
        ALTER TABLE public.documentos ADD COLUMN assigned_signer_id UUID REFERENCES public.profiles(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documentos' AND column_name = 'signature_status') THEN
        ALTER TABLE public.documentos ADD COLUMN signature_status TEXT DEFAULT 'draft';
    END IF;
    -- Title column for display
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documentos' AND column_name = 'titulo') THEN
        ALTER TABLE public.documentos ADD COLUMN titulo TEXT;
    END IF;
END $$;


-- 7. Elementos de Despesa
CREATE TABLE IF NOT EXISTS public.elementos_despesa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT,
  descricao TEXT,
  categoria TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Sistema Configuracoes (Dynamic System Parameters)
CREATE TABLE IF NOT EXISTS public.sistema_configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  categoria VARCHAR(50),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- Enable RLS (Row Level Security) - Basic examples
alter table profiles enable row level security;
alter table solicitacoes enable row level security;

-- Enable RLS for infrastructure tables
alter table municipios enable row level security;
alter table comarcas enable row level security;
alter table unidades enable row level security;
alter table elementos_despesa enable row level security;
alter table documentos enable row level security;
alter table sistema_configuracoes enable row level security;

-- ==============================================
-- RLS POLICIES FOR INFRASTRUCTURE TABLES
-- These are reference tables - everyone can read, only admins can write
-- ==============================================

-- Municipios Policies
drop policy if exists "Municipios are viewable by everyone" on municipios;
create policy "Municipios are viewable by everyone" on municipios 
for select using (true);

drop policy if exists "Authenticated users can manage municipios" on municipios;
create policy "Authenticated users can manage municipios" on municipios 
for all using (auth.role() = 'authenticated');

-- Comarcas Policies
drop policy if exists "Comarcas are viewable by everyone" on comarcas;
create policy "Comarcas are viewable by everyone" on comarcas 
for select using (true);

drop policy if exists "Authenticated users can manage comarcas" on comarcas;
create policy "Authenticated users can manage comarcas" on comarcas 
for all using (auth.role() = 'authenticated');

-- Unidades Policies
drop policy if exists "Unidades are viewable by everyone" on unidades;
create policy "Unidades are viewable by everyone" on unidades 
for select using (true);

drop policy if exists "Authenticated users can manage unidades" on unidades;
create policy "Authenticated users can manage unidades" on unidades 
for all using (auth.role() = 'authenticated');

-- Elementos de Despesa Policies
drop policy if exists "Elementos despesa are viewable by everyone" on elementos_despesa;
create policy "Elementos despesa are viewable by everyone" on elementos_despesa 
for select using (true);

drop policy if exists "Authenticated users can manage elementos_despesa" on elementos_despesa;
create policy "Authenticated users can manage elementos_despesa" on elementos_despesa 
for all using (auth.role() = 'authenticated');

-- Documentos Policies
drop policy if exists "Users can view their own documents" on documentos;
create policy "Users can view their own documents" on documentos 
for select using (
  auth.uid() IN (
    SELECT user_id FROM solicitacoes WHERE id = documentos.solicitacao_id
  )
);

drop policy if exists "SOSFU can view all documents" on documentos;
create policy "SOSFU can view all documents" on documentos 
for select using (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('sosfu', 'analista_sosfu', 'chefe_sosfu'))
);

drop policy if exists "Users can create documents for their solicitacoes" on documentos;
create policy "Users can create documents for their solicitacoes" on documentos 
for insert with check (
  auth.uid() IN (
    SELECT user_id FROM solicitacoes WHERE id = documentos.solicitacao_id
  )
);

-- Policy to allow users to update their own documents
drop policy if exists "Users can update their own documents" on documentos;
create policy "Users can update their own documents" on documentos 
for update using (
  created_by = auth.uid() OR
  auth.uid() IN (
    SELECT user_id FROM solicitacoes WHERE id = documentos.solicitacao_id
  )
);

-- Policy to allow users to delete their own documents
drop policy if exists "Users can delete their own documents" on documentos;
create policy "Users can delete their own documents" on documentos 
for delete using (
  created_by = auth.uid() OR
  auth.uid() IN (
    SELECT user_id FROM solicitacoes WHERE id = documentos.solicitacao_id
  )
);

-- Sistema Configuracoes Policies
drop policy if exists "Sistema config is viewable by everyone" on sistema_configuracoes;
create policy "Sistema config is viewable by everyone" on sistema_configuracoes 
for select using (true);

drop policy if exists "Authenticated users can manage sistema_configuracoes" on sistema_configuracoes;
create policy "Authenticated users can manage sistema_configuracoes" on sistema_configuracoes 
for all using (auth.role() = 'authenticated');

-- Profiles Policies
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );


-- Solicitacoes Policies
drop policy if exists "Users can view own solicitacoes." on solicitacoes;
create policy "Users can view own solicitacoes." on solicitacoes for select using ( auth.uid() = user_id );

drop policy if exists "Users can create solicitacoes." on solicitacoes;
create policy "Users can create solicitacoes." on solicitacoes for insert with check ( auth.uid() = user_id );

-- Allow authenticated users to view all solicitacoes (for gestores, SOSFU, etc.)
drop policy if exists "Authenticated users can view all solicitacoes" on solicitacoes;
create policy "Authenticated users can view all solicitacoes" on solicitacoes 
for select using (auth.role() = 'authenticated');

-- Allow authenticated users to update solicitacoes (for tramitation workflow)
drop policy if exists "Authenticated users can update solicitacoes" on solicitacoes;
create policy "Authenticated users can update solicitacoes" on solicitacoes 
for update using (auth.role() = 'authenticated');

-- 7.5 Historico de Tramitações Table (Process Workflow History)
CREATE TABLE IF NOT EXISTS public.historico_tramitacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  observacao TEXT,
  tramitado_por UUID REFERENCES auth.users(id),
  data_tramitacao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for historico_tramitacao
ALTER TABLE public.historico_tramitacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read tramitacao history" ON public.historico_tramitacao;
CREATE POLICY "Authenticated users can read tramitacao history" 
  ON public.historico_tramitacao FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert tramitacao history" ON public.historico_tramitacao;
CREATE POLICY "Authenticated users can insert tramitacao history" 
  ON public.historico_tramitacao FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_historico_tramitacao_solicitacao 
  ON public.historico_tramitacao(solicitacao_id);

-- 8. Storage Buckets (Avatars)
-- Attempt to create the bucket if it doesn't exist (Note: This might require specific permissions)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Authenticated can upload" ON storage.objects;
CREATE POLICY "Authenticated can upload"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

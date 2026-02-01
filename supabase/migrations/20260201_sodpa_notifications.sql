-- ============================================================================
-- Migration: SODPA Notifications System
-- Purpose: System for automatic notifications about process updates
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.sodpa_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('TRAMITACAO', 'APROVACAO', 'DEVOLUCAO', 'PRAZO', 'SISTEMA')),
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT,
  referencia_id UUID, -- sodpa_requests.id or solicitacoes.id
  referencia_tipo VARCHAR(30) DEFAULT 'SODPA', -- SODPA, SISUP, SISTEMA
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sodpa_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.sodpa_notifications;
CREATE POLICY "Users can read own notifications" ON public.sodpa_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.sodpa_notifications;
CREATE POLICY "Users can update own notifications" ON public.sodpa_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications (via trigger or service)
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.sodpa_notifications;
CREATE POLICY "Service role can insert notifications" ON public.sodpa_notifications
  FOR INSERT WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sodpa_notifications_user 
  ON public.sodpa_notifications(user_id, lida, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sodpa_notifications_referencia
  ON public.sodpa_notifications(referencia_id);

-- ============================================================================
-- Function to create notification when process is tramitated
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_on_tramitacao()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_titulo TEXT;
  v_mensagem TEXT;
  v_destino TEXT;
BEGIN
  -- Get the destination from the new record
  v_destino := COALESCE(NEW.destino_atual, NEW.destino, 'SISTEMA');
  
  -- Find users who should be notified based on destination
  -- For SODPA, notify all SODPA analysts
  IF v_destino = 'SODPA' THEN
    INSERT INTO public.sodpa_notifications (user_id, tipo, titulo, mensagem, referencia_id, referencia_tipo)
    SELECT 
      p.id,
      'TRAMITACAO',
      'Nova solicitação recebida',
      COALESCE(NEW.observacao, 'Uma solicitação foi tramitada para sua análise.'),
      COALESCE(NEW.solicitacao_id, NEW.id),
      'SODPA'
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE r.name IN ('SODPA', 'sodpa_analyst');
  END IF;
  
  -- For other destinations, find matching role users
  IF v_destino IN ('SEFIN', 'SGP', 'PRESIDENCIA', 'AJSEFIN') THEN
    INSERT INTO public.sodpa_notifications (user_id, tipo, titulo, mensagem, referencia_id, referencia_tipo)
    SELECT 
      p.id,
      CASE 
        WHEN NEW.status_novo ILIKE '%APROVADO%' THEN 'APROVACAO'
        WHEN NEW.status_novo ILIKE '%DEVOLVIDO%' THEN 'DEVOLUCAO'
        ELSE 'TRAMITACAO'
      END,
      CASE 
        WHEN NEW.status_novo ILIKE '%APROVADO%' THEN 'Processo aprovado'
        WHEN NEW.status_novo ILIKE '%DEVOLVIDO%' THEN 'Processo devolvido'
        ELSE 'Processo recebido para análise'
      END,
      COALESCE(NEW.observacao, 'Um processo foi tramitado para sua caixa de entrada.'),
      COALESCE(NEW.solicitacao_id, NEW.id),
      'SODPA'
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE LOWER(r.name) ILIKE '%' || LOWER(v_destino) || '%';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on historico_tramitacao
DROP TRIGGER IF EXISTS trg_notify_tramitacao ON public.historico_tramitacao;
CREATE TRIGGER trg_notify_tramitacao
  AFTER INSERT ON public.historico_tramitacao
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_tramitacao();

-- ============================================================================
-- Function to cleanup old notifications (older than 30 days)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.sodpa_notifications
  WHERE created_at < NOW() - INTERVAL '30 days' AND lida = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.sodpa_notifications IS 'System notifications for SODPA workflow updates';

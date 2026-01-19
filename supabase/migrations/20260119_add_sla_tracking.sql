-- Migration: Add SLA tracking to solicitacoes
-- Description: Implements dynamic SLA management with automatic status updates

ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_status TEXT DEFAULT 'NORMAL' 
  CHECK (sla_status IN ('NORMAL', 'WARNING', 'CRITICAL', 'OVERDUE'));

-- Function to calculate SLA deadline (5 business days)
CREATE OR REPLACE FUNCTION calculate_sla_deadline()
RETURNS TRIGGER AS $$
DECLARE
  deadline_date TIMESTAMPTZ;
  days_added INTEGER := 0;
BEGIN
  deadline_date := NEW.created_at;
  
  -- Add 5 business days (excluding weekends)
  WHILE days_added < 5 LOOP
    deadline_date := deadline_date + INTERVAL '1 day';
    
    -- Skip Saturdays (6) and Sundays (0)
    IF EXTRACT(DOW FROM deadline_date) NOT IN (0, 6) THEN
      days_added := days_added + 1;
    END IF;
  END LOOP;
  
  NEW.sla_deadline := deadline_date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sla_deadline
  BEFORE INSERT ON solicitacoes
  FOR EACH ROW
  WHEN (NEW.sla_deadline IS NULL)
  EXECUTE FUNCTION calculate_sla_deadline();

-- Function to update SLA status based on time remaining
CREATE OR REPLACE FUNCTION update_sla_status()
RETURNS TRIGGER AS $$
DECLARE
  time_remaining INTERVAL;
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    RETURN NEW;
  END IF;
  
  time_remaining := NEW.sla_deadline - NOW();
  
  IF time_remaining < INTERVAL '0 hours' THEN
    NEW.sla_status := 'OVERDUE';
  ELSIF time_remaining < INTERVAL '4 hours' THEN
    NEW.sla_status := 'CRITICAL';
  ELSIF time_remaining < INTERVAL '1 day' THEN
    NEW.sla_status := 'WARNING';
  ELSE
    NEW.sla_status := 'NORMAL';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_sla_status
  BEFORE UPDATE ON solicitacoes
  FOR EACH ROW
  WHEN (OLD.sla_deadline IS NOT NULL)
  EXECUTE FUNCTION update_sla_status();

-- Indexes for SLA queries
CREATE INDEX IF NOT EXISTS idx_solicitacoes_sla_deadline ON solicitacoes(sla_deadline) 
  WHERE sla_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_solicitacoes_sla_status ON solicitacoes(sla_status);

-- Function to notify coordinator on critical SLA
CREATE OR REPLACE FUNCTION notify_coordinator_on_critical_sla()
RETURNS void AS $$
DECLARE
  critical_process RECORD;
BEGIN
  FOR critical_process IN
    SELECT s.id, s.nup, s.sla_deadline, s.created_at
    FROM solicitacoes s
    WHERE s.sla_status = 'CRITICAL'
      AND s.status IN ('AGUARDANDO ASSINATURA SEFIN', 'EM ANÁLISE SOSFU')
      -- Don't notify if already notified in last 4 hours
      AND NOT EXISTS (
        SELECT 1 FROM system_notifications sn
        WHERE sn.metadata->>'solicitacao_id' = s.id::text
          AND sn.tipo = 'ALERT'
          AND sn.created_at > NOW() - INTERVAL '4 hours'
      )
  LOOP
    -- Notify SOSFU coordinators
    INSERT INTO system_notifications (
      user_id,
      tipo,
      titulo,
      mensagem,
      criticidade,
      metadata
    )
    SELECT 
      p.id,
      'ALERT',
      'SLA Crítico ⏰',
      'Processo ' || critical_process.nup || ' vence em menos de 4 horas',
      'CRITICAL',
      jsonb_build_object(
        'solicitacao_id', critical_process.id,
        'sla_deadline', critical_process.sla_deadline
      )
    FROM profiles p
    WHERE p.role = 'SOSFU' 
      AND (p.cargo ILIKE '%Coordenador%' OR p.cargo ILIKE '%Gestor%');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing records with SLA deadline
UPDATE solicitacoes
SET sla_deadline = (
  SELECT deadline_date
  FROM (
    SELECT 
      created_at,
      created_at + (
        SELECT SUM(CASE WHEN EXTRACT(DOW FROM created_at + (n || ' days')::INTERVAL) NOT IN (0, 6) THEN 1 ELSE 0 END)
        FROM generate_series(1, 10) n
        HAVING SUM(CASE WHEN EXTRACT(DOW FROM created_at + (n || ' days')::INTERVAL) NOT IN (0, 6) THEN 1 ELSE 0 END) >= 5
        LIMIT 1
      ) || ' days')::INTERVAL AS deadline_date
    FROM solicitacoes s2
    WHERE s2.id = solicitacoes.id
  ) calc
)
WHERE sla_deadline IS NULL;

-- Update status for existing records
UPDATE solicitacoes
SET sla_status = CASE
  WHEN sla_deadline < NOW() THEN 'OVERDUE'
  WHEN sla_deadline < NOW() + INTERVAL '4 hours' THEN 'CRITICAL'
  WHEN sla_deadline < NOW() + INTERVAL '1 day' THEN 'WARNING'
  ELSE 'NORMAL'
END
WHERE sla_deadline IS NOT NULL;

-- Comments
COMMENT ON COLUMN solicitacoes.sla_deadline IS 'Deadline for completing analysis (5 business days from created_at)';
COMMENT ON COLUMN solicitacoes.sla_status IS 'Current SLA status: NORMAL (>1d), WARNING (1d), CRITICAL (<4h), OVERDUE (expired)';

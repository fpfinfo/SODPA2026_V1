-- ============================================================
-- MIGRATION: Automatic Load Balancer (Robô Distribuidor)
-- Date: 2026-01-27
-- 
-- Description:
-- Automatically assigns incoming processes (status='PENDENTE')
-- to SOSFU analysts based on current workload.
-- ============================================================

-- Function to find the best available analyst
CREATE OR REPLACE FUNCTION fn_get_next_analyst()
RETURNS UUID AS $$
DECLARE
    v_analyst_id UUID;
BEGIN
    -- Select analyst with fewest active processes
    -- Active processes = PENDENTE, EM ANALISE
    SELECT us.id
    INTO v_analyst_id
    FROM usuarios_sistema us
    LEFT JOIN solicitacoes s ON 
        s.assigned_to_id = us.id AND 
        s.status NOT IN ('CONCEDIDO', 'ARQUIVADO', 'RASCUNHO', 'PRESTANDO CONTAS')
    WHERE 
        us.ativo = true AND
        us.role IN ('FINANCE', 'CONCESSION') -- Technical roles
    GROUP BY us.id
    ORDER BY COUNT(s.id) ASC, random() -- Random tie-breaker
    LIMIT 1;

    RETURN v_analyst_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function to assign analyst
CREATE OR REPLACE FUNCTION fn_auto_assign_process()
RETURNS TRIGGER AS $$
DECLARE
    v_analyst_id UUID;
BEGIN
    -- Only assign if:
    -- 1. Status changed to PENDENTE (arrived at SOSFU)
    -- 2. No analyst assigned yet
    IF (NEW.status = 'PENDENTE' AND (OLD.status IS DISTINCT FROM 'PENDENTE')) THEN
        
        IF (NEW.assigned_to_id IS NULL) THEN
            v_analyst_id := fn_get_next_analyst();
            
            IF (v_analyst_id IS NOT NULL) THEN
                NEW.assigned_to_id := v_analyst_id;
                
                -- Log assignment (Optional, good for debugging)
                -- We can rely on system audit logs trigger if exists
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS tg_auto_assign_process ON solicitacoes;

CREATE TRIGGER tg_auto_assign_process
BEFORE UPDATE ON solicitacoes
FOR EACH ROW
EXECUTE FUNCTION fn_auto_assign_process();

-- Comment
COMMENT ON FUNCTION fn_get_next_analyst IS 'Load balancer: Returns ID of analyst with lowest workload';
COMMENT ON TRIGGER tg_auto_assign_process ON solicitacoes IS 'Automatically assigns incoming processes to analysts';

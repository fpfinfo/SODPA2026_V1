-- ============================================================
-- MIGRATION: Audit Sentinel System (O Auditor Residente)
-- Date: 2026-01-27
-- 
-- Description:
-- Creates tables and functions for automated system auditing.
-- Detects anomalies, deadlocks, and missed deadlines.
-- ============================================================

-- 1. Create Audit Findings Table
CREATE TABLE IF NOT EXISTS audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    category TEXT NOT NULL CHECK (category IN ('FINANCIAL', 'COMPLIANCE', 'DEADLINE', 'WORKFLOW')),
    title TEXT NOT NULL,
    description TEXT,
    affected_resource_id UUID REFERENCES solicitacoes(id),
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'IGNORED')),
    detected_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for efficient dashboards
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(status);
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity ON audit_findings(severity);

-- RLS
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins seeing everything" ON audit_findings
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SOSFU'))
    );

-- 2. Scan Function (The Sentinel)
CREATE OR REPLACE FUNCTION fn_run_audit_scan()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Rule 1: Missed PC Deadlines
    -- Find processes where status is 'PRESTANDO CONTAS' and deadline passed
    INSERT INTO audit_findings (severity, category, title, description, affected_resource_id)
    SELECT 
        'HIGH',
        'DEADLINE',
        'Prazo de PC Expirado',
        'O prazo legal para prestação de contas expirou em ' || to_char(deadline_pc, 'DD/MM/YYYY'),
        id
    FROM solicitacoes
    WHERE 
        status = 'PRESTANDO CONTAS' AND
        deadline_pc < CURRENT_DATE AND
        NOT EXISTS (
            SELECT 1 FROM audit_findings 
            WHERE affected_resource_id = solicitacoes.id 
            AND title = 'Prazo de PC Expirado' 
            AND status = 'OPEN'
        );
        
    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Rule 2: Stagnant Workflow (Bottlenecks)
    -- Processes in same status for > 5 days (excluding finished states)
    INSERT INTO audit_findings (severity, category, title, description, affected_resource_id)
    SELECT 
        'MEDIUM',
        'WORKFLOW',
        'Gargalo Detectado',
        'Processo parado na fase ' || status || ' há mais de 5 dias.',
        id
    FROM solicitacoes
    WHERE 
        updated_at < (CURRENT_DATE - INTERVAL '5 days') AND
        status NOT IN ('CONCEDIDO', 'ARQUIVADO', 'RASCUNHO') AND
        NOT EXISTS (
            SELECT 1 FROM audit_findings 
            WHERE affected_resource_id = solicitacoes.id 
            AND title = 'Gargalo Detectado' 
            AND status = 'OPEN'
        );

    -- Rule 3: Financial Integrity Sum Check
    -- Sum of items vs Total Value
    -- Note: Doing this via CTE for cleaner logic
    WITH calc_sums AS (
        SELECT 
            s.id, 
            s.nup,
            s.valor_total as claimed_total,
            COALESCE(SUM((elem->>'val')::numeric), 0) as items_total
        FROM solicitacoes s
        CROSS JOIN LATERAL jsonb_array_elements(s.items) as elem
        WHERE s.status NOT IN ('RASCUNHO')
        GROUP BY s.id, s.nup, s.valor_total
    )
    INSERT INTO audit_findings (severity, category, title, description, affected_resource_id)
    SELECT 
        'CRITICAL',
        'FINANCIAL',
        'Divergência Financeira',
        'Soma dos itens (' || items_total || ') diverge do valor total (' || claimed_total || ')',
        id
    FROM calc_sums
    WHERE 
        claimed_total <> items_total AND
        NOT EXISTS (
            SELECT 1 FROM audit_findings 
            WHERE affected_resource_id = calc_sums.id 
            AND category = 'FINANCIAL'
            AND status = 'OPEN'
        );

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE audit_findings IS 'Anomalies and issues detected by automated sentinel';
COMMENT ON FUNCTION fn_run_audit_scan IS 'Runs audit rules and populates findings table';

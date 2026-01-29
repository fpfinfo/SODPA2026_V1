-- =============================================
-- SGP Tasks Table Migration
-- Created: 2026-01-29
-- Description: Dedicated task management for SGP module
-- =============================================

-- Create sgp_tasks table
CREATE TABLE IF NOT EXISTS public.sgp_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    solicitacao_id UUID REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
    documento_id UUID REFERENCES public.documentos(id) ON DELETE SET NULL,
    
    -- Task Details
    tipo TEXT NOT NULL CHECK (tipo IN ('GLOSA', 'ALCANCE', 'DEDUCAO', 'FOLHA_PAGAMENTO', 'RESSARCIMENTO')),
    titulo TEXT,
    descricao TEXT,
    valor DECIMAL(12,2),
    origem TEXT CHECK (origem IN ('SOSFU', 'AJSEFIN', 'SEFIN', 'TCE')),
    observacoes TEXT,
    
    -- Status Flow
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_REVIEW', 'SIGNED', 'RETURNED', 'CANCELLED')),
    
    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ,
    assigned_by UUID REFERENCES auth.users(id),
    
    -- Signature
    assinado_por UUID REFERENCES auth.users(id),
    assinado_em TIMESTAMPTZ,
    
    -- Return (if task is sent back)
    returned_to TEXT, -- 'SOSFU', 'AJSEFIN'
    returned_at TIMESTAMPTZ,
    return_reason TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add comment
COMMENT ON TABLE public.sgp_tasks IS 'Task management for SGP (Secretaria de Gestão de Pessoas) - handles deductions, reimbursements, and payroll adjustments';

-- =============================================
-- Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_sgp_tasks_status ON public.sgp_tasks(status);
CREATE INDEX IF NOT EXISTS idx_sgp_tasks_assigned_to ON public.sgp_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sgp_tasks_solicitacao_id ON public.sgp_tasks(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_sgp_tasks_tipo ON public.sgp_tasks(tipo);
CREATE INDEX IF NOT EXISTS idx_sgp_tasks_origem ON public.sgp_tasks(origem);
CREATE INDEX IF NOT EXISTS idx_sgp_tasks_created_at ON public.sgp_tasks(created_at DESC);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE public.sgp_tasks ENABLE ROW LEVEL SECURITY;

-- SGP members can view all tasks
CREATE POLICY "sgp_tasks_select_policy" ON public.sgp_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('SGP', 'ADMIN', 'SOSFU', 'AJSEFIN', 'SEFIN', 'ORDENADOR')
        )
    );

-- SGP members can insert tasks
CREATE POLICY "sgp_tasks_insert_policy" ON public.sgp_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('SGP', 'ADMIN', 'SOSFU', 'AJSEFIN')
        )
    );

-- SGP members can update tasks
CREATE POLICY "sgp_tasks_update_policy" ON public.sgp_tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('SGP', 'ADMIN')
        )
    );

-- =============================================
-- Updated_at Trigger
-- =============================================

CREATE OR REPLACE FUNCTION update_sgp_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sgp_tasks_updated_at ON public.sgp_tasks;
CREATE TRIGGER trigger_sgp_tasks_updated_at
    BEFORE UPDATE ON public.sgp_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_sgp_tasks_updated_at();

-- =============================================
-- Grant permissions
-- =============================================

GRANT SELECT, INSERT, UPDATE ON public.sgp_tasks TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Trigger Function para Notificações Automáticas de PC
-- Data: 2026-01-26
-- Autor: Antigravity

CREATE OR REPLACE FUNCTION public.trigger_notify_pc_status()
RETURNS TRIGGER AS $$
DECLARE
    v_suprido_user_id UUID;
BEGIN
    -- Determinar ID do Suprido (assumindo user_id ou suprido_id)
    -- Ajuste conforme schema real. Se for 'suprido_id' que aponta para profiles, e profiles tem id = auth.uid(), então ok.
    -- Se a tabela tem 'user_id', use NEW.user_id.
    -- O código será atualizado após verificação do hook. Por padrão, tenteamos user_id.
    v_suprido_user_id := NEW.submitted_by; 

    -- 1. PC ENVIADA (Rascunho -> Pendente) => Notificar GESTOR
    IF (OLD.status = 'RASCUNHO' OR OLD.status = 'CORRECAO_SOLICITADA') AND NEW.status = 'PENDENTE_GESTOR' THEN
        INSERT INTO system_notifications (
            role_target, 
            type, 
            category, 
            title, 
            message, 
            link_action,
            created_at
        ) VALUES (
            'GESTOR', 
            'INFO', 
            'PROCESS', 
            'Nova PC Pendente', 
            format('NUP %s enviada para análise.', NEW.nup),
            format('/gestor/analise/%s', NEW.id),
            NOW()
        );
    END IF;

    -- 2. PC DEVOLVIDA (Pendente -> Correcao) => Notificar SUPRIDO
    IF (OLD.status = 'PENDENTE_GESTOR') AND NEW.status = 'CORRECAO_SOLICITADA' THEN
        INSERT INTO system_notifications (
            user_id, 
            type, 
            category, 
            title, 
            message, 
            link_action,
            created_at,
            metadata
        ) VALUES (
            v_suprido_user_id,
            'WARNING', 
            'PROCESS', 
            'Correção Solicitada', 
            format('Gestor solicitou ajustes na PC %s.', NEW.nup),
            format('/suprido/prestacao/%s', NEW.nup),
            NOW(),
            jsonb_build_object('motivo', NEW.motivo_pendencia)
        );
    END IF;
  
    -- 3. PC APROVADA (Pendente -> Aprovada) => Notificar SUPRIDO
    IF NEW.status = 'APROVADA' AND OLD.status != 'APROVADA' THEN
        INSERT INTO system_notifications (
            user_id, 
            type, 
            category, 
            title, 
            message, 
            link_action,
            created_at
        ) VALUES (
            v_suprido_user_id,
            'SUCCESS', 
            'FINANCE', 
            'Prestação Aprovada!', 
            format('PC %s foi validada com sucesso.', NEW.nup),
            '/suprido/processos', 
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop Trigger
DROP TRIGGER IF EXISTS trg_notify_pc_status ON prestacao_contas;

-- Create Trigger
CREATE TRIGGER trg_notify_pc_status
AFTER UPDATE ON prestacao_contas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notify_pc_status();

-- Trigger Function para Notificações Automáticas de PC (CORRIGIDO STATUS)
-- Data: 2026-01-26
-- Objetivo: Corrigir trigger que esperava 'CORRECAO_SOLICITADA' para 'PENDENCIA'

CREATE OR REPLACE FUNCTION public.trigger_notify_pc_status()
RETURNS TRIGGER AS $$
DECLARE
    v_suprido_user_id UUID;
    v_user_role TEXT;
BEGIN
    v_suprido_user_id := NEW.submitted_by; 

    -- 1. PC ENVIADA (Rascunho -> Pendencia/Submetida) => Notificar GESTOR
    -- O schema diz 'SUBMETIDA' ou 'EM_ANALISE'.
    -- Assumindo fluxo: RASCUNHO -> EM_ANALISE (quando suprido envia)
    IF (OLD.status = 'RASCUNHO') AND (NEW.status = 'EM_ANALISE' OR NEW.status = 'SUBMETIDA') THEN
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
            format('NUP %s enviada para análise.', coalesce(NEW.observacoes, 'Processo')), -- NUP está em solicitacoes, aqui só temos prestacao. Ajustar se puder.
            format('/gestor/analise/%s', NEW.solicitacao_id), -- Link para Dashboard Gestor
            NOW()
        );
    END IF;

    -- 2. PC DEVOLVIDA (Em Analise -> Pendencia) => Notificar SUPRIDO
    -- Schema usa 'PENDENCIA'
    IF NEW.status = 'PENDENCIA' AND OLD.status != 'PENDENCIA' THEN
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
            'O Gestor solicitou ajustes na Prestação de Contas.',
            '/suprido/prestacao', -- Link genérico ou específico
            NOW(),
            jsonb_build_object('motivo', NEW.motivo_pendencia)
        );
    END IF;
  
    -- 3. PC APROVADA (Qualquer -> Aprovada) => Notificar SUPRIDO
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
            'Sua prestação de contas foi validada com sucesso pelo Gestor.',
            '/suprido/processos', 
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

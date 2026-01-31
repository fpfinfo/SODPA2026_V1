-- Arquivo: scripts/fix_magistrado_role.sql
-- Descrição: Corrige o role dos magistrados para 'suprido' 
-- Isso faz com que eles acessem o Portal do Servidor/Magistrado
-- Executar no SQL Editor do projeto bnlgogjdoqaqcjjunevu (SODPA-TJPA)

BEGIN;

-- Atualizar role nos profiles
UPDATE public.profiles 
SET role = 'suprido'
WHERE email LIKE 'juiz%@tjpa.jus.br' 
   OR email LIKE 'desembargador%@tjpa.jus.br';

-- Atualizar raw_user_meta_data no auth.users
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "suprido"}'::jsonb
WHERE email LIKE 'juiz%@tjpa.jus.br' 
   OR email LIKE 'desembargador%@tjpa.jus.br';

COMMIT;

-- Verificar atualização
SELECT email, nome, cargo, role 
FROM public.profiles 
WHERE email LIKE 'juiz%@tjpa.jus.br' 
   OR email LIKE 'desembargador%@tjpa.jus.br'
ORDER BY email;

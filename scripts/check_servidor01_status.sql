-- Check status of servidor01
SELECT 
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data 
FROM auth.users 
WHERE email = 'servidor01@tjpa.jus.br';

-- Check identities
SELECT * 
FROM auth.identities 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'servidor01@tjpa.jus.br');

-- Check profile
SELECT * 
FROM public.profiles 
WHERE email = 'servidor01@tjpa.jus.br';

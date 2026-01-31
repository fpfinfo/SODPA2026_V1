-- Comprehensive Auth Diagnostic for servidor01
-- Run this in Supabase SQL Editor to diagnose 500 errors

-- 1. Check if user exists in auth.users
SELECT 'AUTH.USERS' as table_name, id, email, encrypted_password IS NOT NULL as has_password, 
       email_confirmed_at IS NOT NULL as email_confirmed, 
       raw_app_meta_data, raw_user_meta_data
FROM auth.users WHERE email = 'servidor01@tjpa.jus.br';

-- 2. Check if identity exists (CRITICAL FOR LOGIN)
SELECT 'AUTH.IDENTITIES' as table_name, id, user_id, provider, provider_id, 
       identity_data, created_at
FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'servidor01@tjpa.jus.br');

-- 3. Check profiles table
SELECT 'PROFILES' as table_name, id, email, nome, role, matricula
FROM public.profiles WHERE email = 'servidor01@tjpa.jus.br';

-- 4. List ALL triggers in auth schema
SELECT 'AUTH TRIGGERS' as check_type, trigger_name, event_object_table, event_manipulation, action_statement
FROM information_schema.triggers WHERE event_object_schema = 'auth';

-- 5. Check for auth hooks/functions that might be failing
SELECT 'AUTH HOOKS' as check_type, proname as function_name, prosrc as source_preview
FROM pg_proc 
WHERE proname LIKE '%auth%' OR proname LIKE '%user%' OR proname LIKE '%profile%'
LIMIT 20;

-- 6. Check if there's a handle_new_user trigger function
SELECT 'HANDLE_NEW_USER FUNCTION' as check_type, 
       pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 7. Check role constraint on profiles
SELECT 'PROFILES CONSTRAINTS' as check_type, conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

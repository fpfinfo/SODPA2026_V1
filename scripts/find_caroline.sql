-- Script para encontrar Caroline em TODAS as tabelas relevantes
-- Execute no Supabase SQL Editor

-- 1. Busca ampla em profiles (todos os AJSEFIN)
SELECT 
    id,
    nome,
    email,
    role,
    avatar_url
FROM profiles 
WHERE role = 'AJSEFIN'
ORDER BY nome;

-- 2. Busca ampla em servidores_tj
SELECT 
    id,
    nome,
    email,
    avatar_url
FROM servidores_tj 
WHERE nome ILIKE '%caroline%' 
   OR nome ILIKE '%valeati%'
   OR email ILIKE '%ajsefin%';

-- 3. Lista TODOS os avatars no storage (para encontrar a foto)
SELECT 
    name, 
    bucket_id,
    created_at
FROM storage.objects 
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 30;

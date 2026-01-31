-- Script para verificar e corrigir o avatar da Caroline Valeati da Rocha
-- Execute CADA PARTE separadamente no Supabase SQL Editor

-- ============================================
-- PARTE 1: Verificar estado atual
-- ============================================
SELECT 
    id,
    nome,
    email,
    role,
    avatar_url,
    CASE 
        WHEN avatar_url IS NULL THEN '❌ NULL'
        WHEN avatar_url = '' THEN '❌ VAZIO'
        ELSE '✅ TEM AVATAR'
    END as status_avatar
FROM profiles 
WHERE nome ILIKE '%caroline%' 
   OR nome ILIKE '%valeati%'
   OR email ILIKE '%caroline%';

-- ============================================
-- PARTE 2: Buscar fotos no storage bucket
-- ============================================
SELECT 
    name, 
    bucket_id, 
    created_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'avatars' 
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- PARTE 3: Se encontrar a foto, atualize com a URL correta
-- Substitua 'NOME_DO_ARQUIVO' pela string do campo 'name' retornado acima
-- ============================================
-- UPDATE profiles 
-- SET avatar_url = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/avatars/NOME_DO_ARQUIVO',
--     updated_at = now()
-- WHERE nome ILIKE '%caroline%valeati%';

-- ============================================
-- PARTE 4: Verificar update
-- ============================================
-- SELECT id, nome, avatar_url FROM profiles WHERE nome ILIKE '%caroline%';

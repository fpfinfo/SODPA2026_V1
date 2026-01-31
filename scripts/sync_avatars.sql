-- Script para sincronizar avatar_url entre profiles e servidores_tj
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, veja o estado atual dos avatares da equipe AJSEFIN
SELECT 
    p.id,
    p.nome,
    p.email,
    p.role,
    p.avatar_url as profile_avatar,
    s.avatar_url as servidor_avatar,
    COALESCE(p.avatar_url, s.avatar_url) as avatar_efetivo
FROM profiles p
LEFT JOIN servidores_tj s ON LOWER(p.email) = LOWER(s.email)
WHERE p.role = 'AJSEFIN'
ORDER BY p.nome;

-- 2. Sincronizar: copiar avatar_url de profiles para servidores_tj
-- (se profiles tem avatar e servidores_tj não tem)
UPDATE servidores_tj s
SET avatar_url = p.avatar_url
FROM profiles p
WHERE LOWER(s.email) = LOWER(p.email)
  AND p.avatar_url IS NOT NULL 
  AND p.avatar_url != ''
  AND (s.avatar_url IS NULL OR s.avatar_url = '');

-- 3. Verificar o resultado após sincronização
SELECT 
    p.id,
    p.nome,
    p.email,
    p.avatar_url as profile_avatar,
    s.avatar_url as servidor_avatar
FROM profiles p
LEFT JOIN servidores_tj s ON LOWER(p.email) = LOWER(s.email)
WHERE p.role = 'AJSEFIN'
ORDER BY p.nome;

-- 4. Se você sabe a URL específica do avatar da Caroline, pode atualizar diretamente:
-- (Descomente e ajuste a URL conforme necessário)

-- UPDATE profiles 
-- SET avatar_url = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/avatars/NOME_DO_ARQUIVO'
-- WHERE nome ILIKE '%caroline%valeati%';

-- UPDATE servidores_tj 
-- SET avatar_url = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/avatars/NOME_DO_ARQUIVO'
-- WHERE nome ILIKE '%caroline%valeati%';

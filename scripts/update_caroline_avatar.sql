-- Script para atualizar avatar da Caroline Valeati da Rocha
-- Execute este script no Supabase SQL Editor

-- Primeiro, veja o estado atual:
SELECT id, nome, email, role, avatar_url 
FROM profiles 
WHERE nome ILIKE '%caroline%' 
   OR nome ILIKE '%valeati%'
   OR email ILIKE '%caroline%';

-- Se ela tiver avatar_url NULL, precisamos atualizar com a URL correta
-- A URL da foto dela deve estar no storage do Supabase

-- Para encontrar a URL correta, verifique o bucket de avatars:
-- SELECT * FROM storage.objects WHERE bucket_id = 'avatars' AND name ILIKE '%caroline%';

-- Depois de encontrar a URL, atualize:
-- UPDATE profiles 
-- SET avatar_url = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/avatars/SEU_PATH_AQUI'
-- WHERE nome ILIKE '%caroline%valeati%';

-- OU, se a foto já está em algum lugar, copie a URL da foto que aparece no perfil dela
-- e use neste UPDATE:

-- Exemplo (substitua pela URL real):
-- UPDATE profiles 
-- SET avatar_url = 'URL_DA_FOTO_AQUI'
-- WHERE nome ILIKE '%caroline%valeati%';

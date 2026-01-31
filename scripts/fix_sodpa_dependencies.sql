-- Arquivo: scripts/fix_sodpa_dependencies.sql
-- Descrição: Cria bucket avatars e tabela system_notifications

BEGIN;

-- 1. Create 'avatars' bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policies for avatars (simplificado para dev)
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Avatar Upload Access" ON storage.objects;
CREATE POLICY "Avatar Upload Access" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Avatar Update Access" ON storage.objects;
CREATE POLICY "Avatar Update Access" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' );

-- 3. Create 'system_notifications' table if not exists (Schema Minimal)
CREATE TABLE IF NOT EXISTS system_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    title text,
    message text,
    type text, -- 'INFO', 'WARNING', 'ERROR'
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    action_link text
);

-- Enable RLS on notifications
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own notifications" ON system_notifications;
CREATE POLICY "Users see own notifications" ON system_notifications 
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Check DIARIAS foreign keys (just to be sure)
-- This block is just for structure validation, if FK exists it will error on create, so we skip

COMMIT;

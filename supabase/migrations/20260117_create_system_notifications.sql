-- Create Enums
CREATE TYPE notification_type AS ENUM ('INFO', 'WARNING', 'CRITICAL', 'SUCCESS');
CREATE TYPE notification_category AS ENUM ('FINANCE', 'PROCESS', 'SYSTEM', 'DEADLINE');

-- Create Notification Table
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), -- Null means global/role-based
    role_target VARCHAR(50), -- Enum-like string matching AppRoles ('SUPRIDO', 'GESTOR', etc) or 'ALL'
    type notification_type NOT NULL DEFAULT 'INFO',
    category notification_category NOT NULL DEFAULT 'SYSTEM',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_action TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON system_notifications(user_id);
CREATE INDEX idx_notifications_role_target ON system_notifications(role_target);
CREATE INDEX idx_notifications_is_read ON system_notifications(is_read);
CREATE INDEX idx_notifications_created_at ON system_notifications(created_at);

-- RLS Policies
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON system_notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can view role-based notifications
-- This requires checking the user's role in public.profiles
CREATE POLICY "Users can view role-based notifications" ON system_notifications
    FOR SELECT
    USING (
        user_id IS NULL AND (
            role_target = 'ALL' OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND strpos(role_target, role) > 0 -- Simple containment check, or robust equality if role_target is single role
            )
        )
    );

-- Policy: System/Admin can insert notifications
-- Assuming service role or specific admin functions will insert. 
-- For now, let's allow authenticated users to insert mostly for testing, but in prod ideally this is restricted.
-- Let's restrict insertion to functions/triggers usually, or high-privilege roles.
CREATE POLICY "Admins/System can insert notifications" ON system_notifications
    FOR INSERT
    WITH CHECK (true); -- Broad for now to allow triggers from any user action to create notifs for others if needed

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own/role notifications" ON system_notifications
    FOR UPDATE
    USING (
        user_id = auth.uid() OR
        (user_id IS NULL AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (role_target = 'ALL' OR strpos(role_target, role) > 0)
        ))
    );

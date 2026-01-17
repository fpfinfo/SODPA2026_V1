-- ============================================
-- Migration: Add role request columns to profiles
-- Applied via: MCP on 2026-01-15
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

-- Add columns for role change request workflow
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requested_role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS request_status TEXT CHECK (request_status IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS request_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS request_created_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS request_reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS request_reviewed_at TIMESTAMPTZ;

-- Create index for pending requests
CREATE INDEX IF NOT EXISTS idx_profiles_request_status ON profiles(request_status) WHERE request_status = 'PENDING';

COMMENT ON COLUMN profiles.requested_role IS 'Role being requested by user';
COMMENT ON COLUMN profiles.request_status IS 'Status of role change request';
COMMENT ON COLUMN profiles.request_reason IS 'Justification for role change';
COMMENT ON COLUMN profiles.request_created_at IS 'When request was created';
COMMENT ON COLUMN profiles.request_reviewed_by IS 'Admin who reviewed the request';
COMMENT ON COLUMN profiles.request_reviewed_at IS 'When request was reviewed';

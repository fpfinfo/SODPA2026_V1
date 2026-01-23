-- Add signature_pin column to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'signature_pin') THEN
        ALTER TABLE profiles ADD COLUMN signature_pin TEXT;
    END IF;
END $$;

-- Optional: Add constraint to ensure it's numeric and 4-6 digits if not null (soft validation for now, enforced in UI)
-- ALTER TABLE profiles ADD CONSTRAINT check_signature_pin_format CHECK (signature_pin ~ '^\d{4,6}$');

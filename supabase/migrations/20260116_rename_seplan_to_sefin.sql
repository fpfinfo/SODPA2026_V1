-- Rename SEPLAN to SEFIN in the database

-- 1. Update requested_role in profiles
UPDATE profiles 
SET requested_role = 'sefin' 
WHERE requested_role = 'seplan' OR requested_role = 'SEPLAN';

-- 2. Update role in profiles
UPDATE profiles 
SET role = 'sefin' 
WHERE role = 'seplan';

-- 3. Drop existing constraint if it exists (names may vary, checking standard naming)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 4. Add new constraint with 'SEFIN'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['suprido'::text, 'gestor'::text, 'ordenador'::text, 'analista_sosfu'::text, 'chefe_sosfu'::text, 'ajsefin'::text, 'sgp'::text, 'sosfu'::text, 'sefin'::text, 'SEFIN'::text]));

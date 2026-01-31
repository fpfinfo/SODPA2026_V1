-- Update Ordenador PINs to 4-digit '1234' to match new UI constraints
UPDATE public.profiles
SET signature_pin = '1234'
WHERE email IN ('ordenador01@tjpa.jus.br', 'ordenador02@tjpa.jus.br');

-- Also ensure Suprido users have a default PIN if missing
UPDATE public.profiles
SET signature_pin = '1234'
WHERE signature_pin IS NULL AND email LIKE '%@tjpa.jus.br';

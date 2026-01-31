-- Inspect columns of servidores_tj and profiles
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('servidores_tj', 'profiles')
ORDER BY table_name, ordinal_position;

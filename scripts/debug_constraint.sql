DO $$
DECLARE
  v_con text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_con
  FROM pg_constraint
  WHERE conname = 'profiles_role_check';
  
  RAISE NOTICE 'Constraint Definition: %', v_con;
END $$;

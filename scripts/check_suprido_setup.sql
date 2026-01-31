DO $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_servidor record;
BEGIN
  RAISE NOTICE '--- DIAGNOSTICO SUPRIDO ---';
  
  -- 1. Check Auth User
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'servidor01@tjpa.jus.br';
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ auth.users: User NOT FOUND';
  ELSE
    RAISE NOTICE '✅ auth.users: Found ID %', v_user_id;
    
    -- 2. Check Profile
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
    IF v_profile IS NULL THEN
      RAISE NOTICE '❌ public.profiles: User NOT FOUND';
    ELSE
      RAISE NOTICE '✅ public.profiles: Found. Role: %', v_profile.role;
    END IF;

    -- 3. Check Servidor
    SELECT * INTO v_servidor FROM public.servidores_tj WHERE id = v_user_id; -- Assuming ID matches
    IF v_servidor IS NULL THEN
       -- Try finding by email
       SELECT * INTO v_servidor FROM public.servidores_tj WHERE email = 'servidor01@tjpa.jus.br';
       IF v_servidor IS NULL THEN
         RAISE NOTICE '❌ public.servidores_tj: User NOT FOUND';
       ELSE
         RAISE NOTICE '⚠️ public.servidores_tj: Found by EMAIL but ID mismatch? ID: %', v_servidor.id;
       END IF;
    ELSE
      RAISE NOTICE '✅ public.servidores_tj: Found.';
    END IF;
    
  END IF;
  
  RAISE NOTICE '--- FIM DIAGNOSTICO ---';
END $$;

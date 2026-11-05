-- =====================================================================
--  HORMyMET · PASO 2: DEJAR A TU USUARIO COMO ADMINISTRADOR
--
--  Antes de ejecutar esto:
--   1) Crea tu usuario en Supabase > Authentication > Users > Add user
--      (correo + contraseña, marcando "Auto Confirm User").
--   2) Cambia el correo de abajo (entre comillas) por ESE MISMO correo.
--   3) Pega todo en SQL Editor y presiona "Run".
-- =====================================================================

do $$
declare
  v_email text := 'gol120664@gmail.com';   -- <<<<< CAMBIA SOLO ESTO
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(v_email);

  if v_id is null then
    raise exception 'No encontré ese correo en Authentication > Users. Revisa que esté escrito igual.';
  end if;

  insert into public.perfiles (id, email, nombre, rol)
  values (v_id, v_email, 'Administrador', 'admin')
  on conflict (id) do update set rol = 'admin';
end $$;

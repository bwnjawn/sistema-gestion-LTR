-- Avisos en tiempo real (SCRUM-273): la app del administrador se entera al instante cuando cambia una reserva,
-- un pago o las comidas de una reserva. Los avisos respetan las reglas de acceso (RLS): solo un administrador
-- con sesión los recibe; el público no recibe nada.

do $$
declare t text;
begin
  foreach t in array array['reservas', 'pagos', 'reserva_comidas'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

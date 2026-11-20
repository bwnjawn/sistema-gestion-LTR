-- Fotos del inicio editables por el administrador (SCRUM-271).
-- La clave `fotos_inicio` de `ajustes` guarda la foto de cada una de las cinco tarjetas del inicio y pasa a ser
-- de lectura pública, porque el cliente las ve sin iniciar sesión. Escribir sigue siendo solo del administrador.

drop policy "lectura_publica_de_claves_permitidas" on public.ajustes;
create policy "lectura_publica_de_claves_permitidas" on public.ajustes for select to anon, authenticated
  using (
    clave in ('contacto', 'transferencia', 'parametros', 'horarios_restaurante', 'horarios_camping', 'horarios_cabana', 'limites_aforo', 'reglamento_camping', 'fotos_inicio')
    or (select private.es_admin())
  );

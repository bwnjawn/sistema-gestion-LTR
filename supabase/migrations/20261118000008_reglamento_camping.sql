-- Reglamento del camping en PDF (SCRUM-51).
-- Un bucket público `documentos` (cualquiera con el enlace abre el archivo, como pide el cliente) donde solo un
-- administrador puede subir, reemplazar o borrar, y la clave `reglamento_camping` de `ajustes` pasa a ser de
-- lectura pública para que el cliente encuentre el enlace.

-- 1. Bucket: solo PDF, hasta 10 MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', true, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- 2. Solo un administrador escribe en el bucket (la lectura pública no necesita política: el bucket es público)
create policy "admin_sube_documentos" on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (select private.es_admin()));
create policy "admin_actualiza_documentos" on storage.objects for update to authenticated
  using (bucket_id = 'documentos' and (select private.es_admin()))
  with check (bucket_id = 'documentos' and (select private.es_admin()));
create policy "admin_elimina_documentos" on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (select private.es_admin()));

-- 3. El cliente lee la clave del reglamento (el resto de los ajustes públicos no cambia)
drop policy "lectura_publica_de_claves_permitidas" on public.ajustes;
create policy "lectura_publica_de_claves_permitidas" on public.ajustes for select to anon, authenticated
  using (
    clave in ('contacto', 'transferencia', 'parametros', 'horarios_restaurante', 'horarios_camping', 'horarios_cabana', 'limites_aforo', 'reglamento_camping')
    or (select private.es_admin())
  );

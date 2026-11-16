alter table public.perfiles_admin add column correo text;
update public.perfiles_admin p set correo = u.email from auth.users u where u.id = p.id;

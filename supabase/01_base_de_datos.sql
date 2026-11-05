-- =====================================================================
--  HORMyMET · PASO 1: CREAR TODA LA BASE DE DATOS
--  Pega este archivo completo en Supabase > SQL Editor > New query
--  y presiona "Run". Se ejecuta una sola vez (si lo repites no pasa nada).
-- =====================================================================

-- ---------- 1. TABLAS ----------

create table if not exists public.perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  nombre     text default '',
  rol        text not null default 'sin_acceso'
             check (rol in ('admin','empleado','sin_acceso')),
  creado_en  timestamptz default now()
);

create table if not exists public.categorias (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  nombre      text not null,
  descripcion text default '',
  orden       int  default 0,
  activo      boolean default true,
  creado_en   timestamptz default now()
);

create table if not exists public.productos (
  id           uuid primary key default gen_random_uuid(),
  categoria_id uuid references public.categorias(id) on delete set null,
  nombre       text not null,
  descripcion  text default '',
  precio       text default '',
  icono        text default '▦',
  imagen_url   text,
  orden        int  default 0,
  activo       boolean default true,
  creado_en    timestamptz default now()
);

create table if not exists public.ajustes (
  clave text primary key,
  valor text default ''
);

-- ---------- 2. FUNCIONES DE AYUDA ----------

create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin')
$$;

create or replace function public.es_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol in ('admin','empleado'))
$$;

-- Cada vez que se crea un usuario en Authentication se crea su perfil (sin acceso al panel
-- hasta que un administrador le asigne un rol).
create or replace function public.nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, email, nombre, rol)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre',''), 'sin_acceso')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.nuevo_usuario();

-- Perfiles de usuarios que ya existieran
insert into public.perfiles (id, email, rol)
select id, email, 'sin_acceso' from auth.users
on conflict (id) do nothing;

-- Funciones que usa el botón "Crear usuario" dentro del programa (solo administradores)
create or replace function public.admin_asignar_rol(p_id uuid, p_rol text, p_nombre text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede hacer esto';
  end if;
  if p_rol not in ('admin','empleado','sin_acceso') then
    raise exception 'Rol no válido';
  end if;
  if p_id = auth.uid() and p_rol <> 'admin' then
    raise exception 'No puedes quitarte a ti mismo el rol de administrador';
  end if;
  update public.perfiles
     set rol = p_rol,
         nombre = coalesce(p_nombre, nombre)
   where id = p_id;
end;
$$;

create or replace function public.admin_eliminar_usuario(p_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede hacer esto';
  end if;
  if p_id = auth.uid() then
    raise exception 'No puedes eliminar tu propio usuario';
  end if;
  delete from auth.users where id = p_id;
end;
$$;

-- ---------- 3. SEGURIDAD (quién puede ver y modificar cada cosa) ----------

alter table public.perfiles   enable row level security;
alter table public.categorias enable row level security;
alter table public.productos  enable row level security;
alter table public.ajustes    enable row level security;

-- perfiles: cada uno ve el suyo; el administrador ve todos. Los cambios se hacen con las funciones de arriba.
drop policy if exists perfiles_ver on public.perfiles;
create policy perfiles_ver on public.perfiles for select
  using (id = auth.uid() or public.es_admin());

-- categorías y productos: el público ve solo lo activo; el personal ve y modifica todo
drop policy if exists categorias_ver on public.categorias;
create policy categorias_ver on public.categorias for select
  using (activo or public.es_staff());
drop policy if exists categorias_editar on public.categorias;
create policy categorias_editar on public.categorias for all
  using (public.es_staff()) with check (public.es_staff());

drop policy if exists productos_ver on public.productos;
create policy productos_ver on public.productos for select
  using (activo or public.es_staff());
drop policy if exists productos_editar on public.productos;
create policy productos_editar on public.productos for all
  using (public.es_staff()) with check (public.es_staff());

-- ajustes: todos pueden leer (WhatsApp, teléfono...); solo el administrador cambia
drop policy if exists ajustes_ver on public.ajustes;
create policy ajustes_ver on public.ajustes for select using (true);
drop policy if exists ajustes_editar on public.ajustes;
create policy ajustes_editar on public.ajustes for all
  using (public.es_admin()) with check (public.es_admin());

-- ---------- 4. ALMACENAMIENTO DE FOTOS (bucket "productos", público) ----------

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do update set public = true;

drop policy if exists productos_fotos_ver on storage.objects;
create policy productos_fotos_ver on storage.objects for select
  using (bucket_id = 'productos');

drop policy if exists productos_fotos_subir on storage.objects;
create policy productos_fotos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and public.es_staff());

drop policy if exists productos_fotos_cambiar on storage.objects;
create policy productos_fotos_cambiar on storage.objects for update to authenticated
  using (bucket_id = 'productos' and public.es_staff());

drop policy if exists productos_fotos_borrar on storage.objects;
create policy productos_fotos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'productos' and public.es_staff());

-- ---------- 5. DATOS INICIALES (los de tu tienda actual) ----------

insert into public.ajustes (clave, valor) values
  ('empresa',          'HORMyMET'),
  ('whatsapp',         '59164601072'),
  ('telefono_visible', '+591 64601072'),
  ('pie',              'Bolivia · Prefabricados de hormigón')
on conflict (clave) do nothing;

insert into public.categorias (slug, nombre, descripcion, orden) values
  ('paneles',  'PANELES',  'Placas termoaislantes y bloques prefabricados: corrientes, complementarios, para machones y antepechos.', 1),
  ('columnas', 'COLUMNAS', 'Elementos prefabricados de hormigón para proyectos constructivos. Consulta disponibilidad y especificaciones.', 2)
on conflict (slug) do nothing;

insert into public.productos (categoria_id, nombre, descripcion, icono, orden)
select c.id, v.nombre, v.descripcion, v.icono, v.orden
from (values
  ('paneles',  'Placa termoaislante',       'Placa prefabricada para aplicaciones de aislamiento.',          '▤', 1),
  ('paneles',  'Bloque corriente de pared', 'Elemento prefabricado para soluciones de cerramiento.',         '▦', 2),
  ('paneles',  'Medio bloque de pared',     'Formato complementario para la construcción.',                  '▥', 3),
  ('paneles',  'Bloque complementario',     'Elemento para completar soluciones de pared.',                  '▤', 4),
  ('paneles',  'Bloque para machón',        'Elemento prefabricado para encuentros y machones.',             '▦', 5),
  ('paneles',  'Bloque para antepecho',     'Elemento prefabricado para antepechos de ventanas.',            '▥', 6),
  ('columnas', 'Columna prefabricada',      'Ficha técnica y dimensiones por confirmar.',                    '▯', 7)
) as v(cat, nombre, descripcion, icono, orden)
join public.categorias c on c.slug = v.cat
where not exists (select 1 from public.productos);

-- Listo. Ahora ejecuta el archivo 02_administrador.sql

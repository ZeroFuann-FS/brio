-- Comentarios de usuarios, administradores y estadísticas.
-- El correo del administrador NO va en este archivo: se agrega directo en la tabla `admins`.

create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;   -- sin políticas: nadie la lee desde la app

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- Comentarios
create table if not exists public.comentarios (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users on delete set null,
  tipo text not null check (tipo in ('idea', 'error', 'gusta', 'otro')),
  texto text not null check (char_length(texto) between 3 and 2000),
  calificacion smallint check (calificacion between 1 and 5),
  contacto text check (contacto is null or char_length(contacto) <= 120),
  seccion text check (seccion is null or char_length(seccion) <= 40),
  dispositivo text check (dispositivo is null or char_length(dispositivo) <= 60),
  estado text not null default 'nuevo' check (estado in ('nuevo', 'visto', 'hecho', 'descartado')),
  nota text check (nota is null or char_length(nota) <= 1000),
  creado timestamptz not null default now()
);
alter table public.comentarios enable row level security;
create policy "cualquiera comenta" on public.comentarios for insert to anon, authenticated
  with check (estado = 'nuevo' and nota is null and (user_id is null or user_id = (select auth.uid())));
create policy "admin lee" on public.comentarios for select to authenticated using ((select public.es_admin()));
create policy "admin edita" on public.comentarios for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "admin borra" on public.comentarios for delete to authenticated using ((select public.es_admin()));

-- Freno anti-spam: máximo 5 comentarios por usuario por hora y 30 por hora en total sin cuenta.
create or replace function public.freno_comentarios()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is not null and (select count(*) from public.comentarios where user_id = new.user_id and creado > now() - interval '1 hour') >= 5 then
    raise exception 'Demasiados comentarios, intenta más tarde';
  end if;
  if new.user_id is null and (select count(*) from public.comentarios where user_id is null and creado > now() - interval '1 hour') >= 30 then
    raise exception 'Demasiados comentarios, intenta más tarde';
  end if;
  return new;
end;
$$;
drop trigger if exists freno_comentarios on public.comentarios;
create trigger freno_comentarios before insert on public.comentarios for each row execute function public.freno_comentarios();

-- Estadísticas para el panel (solo admin)
create or replace function public.estadisticas_admin()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare r jsonb;
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  select jsonb_build_object(
    'usuarios', (select count(*) from auth.users),
    'nuevos7', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'nuevos30', (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'activos7', (select count(distinct user_id) from public.dias where actualizado > now() - interval '7 days'),
    'activos30', (select count(distinct user_id) from public.dias where actualizado > now() - interval '30 days'),
    'conPerfil', (select count(*) from public.perfiles),
    'diasRegistrados', (select count(*) from public.dias),
    'comidas', (select coalesce(sum(jsonb_array_length(comidas)), 0) from public.dias),
    'pesos', (select count(*) from public.pesos),
    'entrenos', (select count(*) from public.entrenos),
    'despensa', (select count(*) from public.despensa),
    'push', (select count(distinct user_id) from public.push_suscripciones),
    'alimentosComunidad', (select count(*) from public.alimentos_comunidad),
    'comentarios', (select jsonb_build_object('total', count(*), 'nuevos', count(*) filter (where estado = 'nuevo'), 'promedio', round(avg(calificacion)::numeric, 1)) from public.comentarios),
    'funciones', (select jsonb_build_object(
        'menu', (select count(*) from public.menus),
        'planNutriologo', count(*) filter (where datos #>> '{plan,activo}' = 'true'),
        'rutinas', count(*) filter (where jsonb_array_length(coalesce(datos #> '{entreno,rutinas}', '[]'::jsonb)) > 0),
        'horario', count(*) filter (where datos ? 'agenda'),
        'avisos', count(*) filter (where datos ? 'recordatorios'),
        'metas', count(*) filter (where jsonb_array_length(coalesce(datos -> 'metas', '[]'::jsonb)) > 0),
        'gustos', count(*) filter (where jsonb_array_length(coalesce(datos #> '{prefsComida,gustos}', '[]'::jsonb)) > 0)
      ) from public.perfiles),
    'registrosPorDia', (select coalesce(jsonb_agg(jsonb_build_object('fecha', d, 'n', n) order by d), '[]'::jsonb) from (
        select g::date as d, (select count(*) from auth.users u where u.created_at::date = g::date) as n
        from generate_series(current_date - 29, current_date, interval '1 day') g) x),
    'activosPorDia', (select coalesce(jsonb_agg(jsonb_build_object('fecha', d, 'n', n) order by d), '[]'::jsonb) from (
        select g::date as d, (select count(distinct user_id) from public.dias di where di.fecha = g::date) as n
        from generate_series(current_date - 29, current_date, interval '1 day') g) x)
  ) into r;
  return r;
end;
$$;
revoke all on function public.estadisticas_admin() from public, anon;
grant execute on function public.estadisticas_admin() to authenticated;

-- Lista de usuarios para el panel (solo admin)
create or replace function public.usuarios_admin()
returns table (id uuid, email text, nombre text, creado timestamptz, ultimo_acceso timestamptz, dias bigint, ultimo_dia date, entrenos bigint, pesos bigint, push boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  return query
    select u.id, u.email::text, (p.datos ->> 'nombre')::text, u.created_at, u.last_sign_in_at,
      (select count(*) from public.dias d where d.user_id = u.id),
      (select max(d.fecha) from public.dias d where d.user_id = u.id),
      (select count(*) from public.entrenos e where e.user_id = u.id),
      (select count(*) from public.pesos w where w.user_id = u.id),
      exists (select 1 from public.push_suscripciones s where s.user_id = u.id)
    from auth.users u left join public.perfiles p on p.user_id = u.id
    order by u.created_at desc;
end;
$$;
revoke all on function public.usuarios_admin() from public, anon;
grant execute on function public.usuarios_admin() to authenticated;

-- Números generales públicos (sin datos personales) para insignias del README
create or replace function public.estadisticas_publicas()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'usuarios', (select count(*) from auth.users),
    'activos_semana', (select count(distinct user_id) from public.dias where actualizado > now() - interval '7 days'),
    'comidas_registradas', (select coalesce(sum(jsonb_array_length(comidas)), 0) from public.dias),
    'entrenos', (select count(*) from public.entrenos),
    'recetas', 129,
    'ejercicios', 169
  );
$$;
revoke all on function public.estadisticas_publicas() from public;
grant execute on function public.estadisticas_publicas() to anon, authenticated;

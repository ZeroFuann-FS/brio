-- Límite diario de uso de IA por usuario y menú semanal guardado.

create table public.uso_ia (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  fecha date not null default (now() at time zone 'America/Mexico_City')::date,
  tipo text not null check (tipo in ('analizar', 'menu')),
  conteo integer not null default 0,
  primary key (user_id, fecha, tipo)
);
alter table public.uso_ia enable row level security;
create policy "dueño lee" on public.uso_ia for select to authenticated using ((select auth.uid()) = user_id);

-- Suma 1 al uso de hoy y devuelve false si ya se pasó del límite (atómico).
create or replace function public.usar_ia(p_tipo text, p_limite integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v integer;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  insert into public.uso_ia (user_id, tipo, conteo) values (auth.uid(), p_tipo, 1)
  on conflict (user_id, fecha, tipo) do update set conteo = public.uso_ia.conteo + 1
  returning conteo into v;
  return v <= p_limite;
end;
$$;
revoke all on function public.usar_ia(text, integer) from public, anon;
grant execute on function public.usar_ia(text, integer) to authenticated;

create table public.menus (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now()
);
alter table public.menus enable row level security;
create policy "dueño lee" on public.menus for select to authenticated using ((select auth.uid()) = user_id);
create policy "dueño crea" on public.menus for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dueño edita" on public.menus for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dueño borra" on public.menus for delete to authenticated using ((select auth.uid()) = user_id);

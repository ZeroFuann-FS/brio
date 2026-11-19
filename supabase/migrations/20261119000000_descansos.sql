-- Aviso de fin de descanso por push (en iPhone el service worker no puede esperar con la pantalla bloqueada).
-- La app guarda cuándo termina el descanso; pg_cron revisa cada 3 segundos y, si alguno ya terminó, llama a la función `descanso`.

create table if not exists public.descansos (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  fin timestamptz not null,
  titulo text not null default 'Se acabó el descanso' check (char_length(titulo) <= 80),
  cuerpo text not null default 'Vamos con la siguiente serie.' check (char_length(cuerpo) <= 160),
  creado timestamptz not null default now()
);
alter table public.descansos enable row level security;
create policy "dueño lee" on public.descansos for select to authenticated using ((select auth.uid()) = user_id);
create policy "dueño crea" on public.descansos for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dueño edita" on public.descansos for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dueño borra" on public.descansos for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists descansos_fin on public.descansos (fin);

-- Toma (y borra) los descansos que ya terminaron; así cada aviso se manda una sola vez aunque la función corra dos veces.
create or replace function public.tomar_descansos()
returns table (user_id uuid, titulo text, cuerpo text, fin timestamptz)
language sql
security definer
set search_path = ''
as $$
  delete from public.descansos d where d.fin <= now() + interval '1 second'
  returning d.user_id, d.titulo, d.cuerpo, d.fin;
$$;
revoke all on function public.tomar_descansos() from public, anon, authenticated;
grant execute on function public.tomar_descansos() to service_role;

-- Cada 3 segundos, pero solo llama a la función si hay algún descanso vencido (casi siempre no hace nada).
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('brio-descansos', '3 seconds', $cron$
  select net.http_post(
    url := 'https://vdvmeloqgguujnrjrdxi.supabase.co/functions/v1/descanso',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  )
  where exists (select 1 from public.descansos where fin <= now() + interval '1 second');
$cron$);

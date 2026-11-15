-- Notificaciones push: suscripciones por dispositivo, registro de avisos enviados y tarea programada.

create table if not exists public.push_suscripciones (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  p256dh text not null,
  auth text not null,
  zona text not null default 'America/Mexico_City',
  actualizado timestamptz not null default now()
);
alter table public.push_suscripciones enable row level security;
create policy "dueño lee" on public.push_suscripciones for select to authenticated using ((select auth.uid()) = user_id);
create policy "dueño crea" on public.push_suscripciones for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dueño edita" on public.push_suscripciones for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dueño borra" on public.push_suscripciones for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists push_suscripciones_usuario on public.push_suscripciones (user_id);

-- Solo el servidor (llave de servicio) escribe aquí; sin políticas = nadie más puede leer ni escribir.
create table if not exists public.push_enviados (
  user_id uuid not null references auth.users on delete cascade,
  clave text not null,
  enviado timestamptz not null default now(),
  primary key (user_id, clave)
);
alter table public.push_enviados enable row level security;

-- Freno para que la función corra como máximo una vez cada 2 minutos.
create table if not exists public.cron_turnos (nombre text primary key, ultimo timestamptz not null);
alter table public.cron_turnos enable row level security;
create or replace function public.tomar_turno_recordatorios()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare ok boolean;
begin
  insert into public.cron_turnos (nombre, ultimo) values ('recordatorios', now())
  on conflict (nombre) do update set ultimo = now()
  where public.cron_turnos.ultimo < now() - interval '2 minutes'
  returning true into ok;
  return coalesce(ok, false);
end;
$$;
revoke all on function public.tomar_turno_recordatorios() from public, anon, authenticated;
grant execute on function public.tomar_turno_recordatorios() to service_role;

-- Tarea cada 5 minutos que llama a la función (pública; no requiere llave porque solo envía lo que toca y tiene freno).
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('brio-recordatorios', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://vdvmeloqgguujnrjrdxi.supabase.co/functions/v1/recordatorios',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$cron$);
select cron.schedule('brio-limpiar-avisos', '15 4 * * *', $cron$
  delete from public.push_enviados where enviado < now() - interval '10 days';
$cron$);

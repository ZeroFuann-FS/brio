-- Sesiones de entrenamiento terminadas (las rutinas viven en perfiles.datos).
create table if not exists public.entrenos (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  fecha date not null,
  datos jsonb not null,
  actualizado timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.entrenos enable row level security;
create policy "dueño lee" on public.entrenos for select to authenticated using ((select auth.uid()) = user_id);
create policy "dueño crea" on public.entrenos for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dueño edita" on public.entrenos for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dueño borra" on public.entrenos for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists entrenos_fecha on public.entrenos (user_id, fecha);

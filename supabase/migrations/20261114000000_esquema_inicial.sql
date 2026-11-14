-- Brío: esquema inicial. Cada usuario solo ve y edita sus propios datos (RLS).

create table public.perfiles (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now()
);

create table public.dias (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  fecha date not null,
  comidas jsonb not null default '[]'::jsonb,
  agua_ml integer not null default 0 check (agua_ml between 0 and 20000),
  habitos jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now(),
  primary key (user_id, fecha)
);

create table public.pesos (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  fecha date not null,
  kg numeric(5,1) not null check (kg between 20 and 400),
  actualizado timestamptz not null default now(),
  primary key (user_id, fecha)
);

create table public.medidas (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  fecha date not null,
  valores jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now(),
  primary key (user_id, fecha)
);

create table public.despensa (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  nombre text not null check (char_length(nombre) between 1 and 60),
  cantidad numeric(10,2) not null default 0 check (cantidad >= 0),
  unidad text not null default 'pzas',
  actualizado timestamptz not null default now(),
  primary key (user_id, id)
);

-- RLS: solo el dueño
do $$
declare t text;
begin
  foreach t in array array['perfiles','dias','pesos','medidas','despensa'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "dueño lee" on public.%I for select to authenticated using ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "dueño crea" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "dueño edita" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)$p$, t);
    execute format($p$create policy "dueño borra" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)$p$, t);
  end loop;
end $$;

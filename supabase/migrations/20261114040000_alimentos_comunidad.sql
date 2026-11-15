-- Alimentos que capturan los usuarios de Brío (marcas que no están en otras bases).
-- Todos pueden buscarlos; solo usuarios con cuenta los crean; cada quien edita los suyos.
create table public.alimentos_comunidad (
  id uuid primary key default gen_random_uuid(),
  codigo text unique check (codigo is null or codigo ~ '^[0-9]{6,14}$'),
  nombre text not null check (char_length(nombre) between 2 and 80),
  marca text check (marca is null or char_length(marca) <= 60),
  porcion_t text not null default 'porción' check (char_length(porcion_t) <= 40),
  porcion_g numeric(7,1) not null check (porcion_g > 0 and porcion_g <= 5000),
  kcal numeric(7,1) not null check (kcal >= 0 and kcal <= 900),
  proteina numeric(6,1) not null default 0 check (proteina >= 0 and proteina <= 100),
  carbos numeric(6,1) not null default 0 check (carbos >= 0 and carbos <= 100),
  grasa numeric(6,1) not null default 0 check (grasa >= 0 and grasa <= 100),
  creado_por uuid not null default auth.uid() references auth.users on delete cascade,
  creado timestamptz not null default now()
);
-- valores nutricionales guardados por 100 g
create index alimentos_comunidad_busqueda on public.alimentos_comunidad using gin (to_tsvector('spanish', nombre || ' ' || coalesce(marca, '')));

alter table public.alimentos_comunidad enable row level security;
create policy "todos leen" on public.alimentos_comunidad for select to anon, authenticated using (true);
create policy "con cuenta crea" on public.alimentos_comunidad for insert to authenticated with check ((select auth.uid()) = creado_por);
create policy "autor edita" on public.alimentos_comunidad for update to authenticated using ((select auth.uid()) = creado_por) with check ((select auth.uid()) = creado_por);
create policy "autor borra" on public.alimentos_comunidad for delete to authenticated using ((select auth.uid()) = creado_por);

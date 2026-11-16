-- Tablas del portafolio (zerofuann). Viven en este proyecto porque el plan gratis permite 2 proyectos.
-- No tocan nada de Brío.

-- Reseñas del libro de visitas: cualquiera puede dejar una; solo se ven las aprobadas.
create table if not exists public.portafolio_comentarios (
  id bigint generated always as identity primary key,
  nombre text not null check (char_length(nombre) between 1 and 60),
  rol text check (rol is null or char_length(rol) <= 60),
  mensaje text not null check (char_length(mensaje) between 3 and 500),
  estrellas smallint check (estrellas is null or estrellas between 1 and 5),
  aprobado boolean not null default false,
  creado timestamptz not null default now()
);
alter table public.portafolio_comentarios enable row level security;
create policy "portafolio: leer aprobados" on public.portafolio_comentarios
  for select to anon, authenticated using (aprobado = true);
create policy "portafolio: dejar resena" on public.portafolio_comentarios
  for insert to anon, authenticated with check (aprobado = false);

-- Mensajes de contacto y cotizaciones: se guardan aquí además de llegar al correo. Nadie los puede leer desde la web.
create table if not exists public.portafolio_mensajes (
  id bigint generated always as identity primary key,
  origen text not null check (origen in ('portafolio', 'servicios')),
  tipo text check (tipo is null or char_length(tipo) <= 40),
  nombre text not null check (char_length(nombre) between 1 and 80),
  contacto text not null check (char_length(contacto) between 3 and 120),
  empresa text check (empresa is null or char_length(empresa) <= 80),
  mensaje text not null check (char_length(mensaje) between 3 and 2000),
  atendido boolean not null default false,
  creado timestamptz not null default now()
);
alter table public.portafolio_mensajes enable row level security;
create policy "portafolio: enviar mensaje" on public.portafolio_mensajes
  for insert to anon, authenticated with check (atendido = false);
-- Sin select/update/delete para visitantes: solo el dueño desde el panel de Supabase (o el panel privado más adelante).

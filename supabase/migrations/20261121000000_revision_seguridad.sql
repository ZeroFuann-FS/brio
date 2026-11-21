-- Revisión de seguridad (2026-11-21)
-- 1) Freno anti-spam para las reseñas y mensajes que llegan desde el portafolio (se insertan sin cuenta).
-- 2) Quita permisos de ejecución que nadie usa desde la app (avisos del Security Advisor).

-- 1) Freno: máximo 10 reseñas y 20 mensajes por hora en total, y textos repetidos rechazados.
create or replace function public.freno_portafolio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  limite int;
  recientes int;
begin
  if tg_table_name = 'portafolio_comentarios' then
    limite := 10;
    select count(*) into recientes from public.portafolio_comentarios where creado > now() - interval '1 hour';
    if exists (select 1 from public.portafolio_comentarios
               where mensaje = new.mensaje and creado > now() - interval '1 day') then
      raise exception 'Esa reseña ya la recibimos';
    end if;
  else
    limite := 20;
    select count(*) into recientes from public.portafolio_mensajes where creado > now() - interval '1 hour';
    if exists (select 1 from public.portafolio_mensajes
               where mensaje = new.mensaje and contacto = new.contacto and creado > now() - interval '1 day') then
      raise exception 'Ese mensaje ya lo recibimos';
    end if;
  end if;
  if recientes >= limite then
    raise exception 'Demasiados envíos, intenta más tarde';
  end if;
  return new;
end;
$$;

drop trigger if exists freno_portafolio on public.portafolio_comentarios;
create trigger freno_portafolio before insert on public.portafolio_comentarios
  for each row execute function public.freno_portafolio();
drop trigger if exists freno_portafolio on public.portafolio_mensajes;
create trigger freno_portafolio before insert on public.portafolio_mensajes
  for each row execute function public.freno_portafolio();

-- Las funciones de trigger no se llaman desde la app: nadie necesita ejecutarlas directo.
revoke all on function public.freno_portafolio() from public, anon, authenticated;
revoke all on function public.freno_comentarios() from public, anon, authenticated;

-- 2) estadisticas_publicas solo la llama la función `estadisticas` con la llave de servicio.
revoke all on function public.estadisticas_publicas() from public, anon, authenticated;
grant execute on function public.estadisticas_publicas() to service_role;

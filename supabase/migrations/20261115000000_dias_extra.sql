-- Datos extra del día (ajustes manuales de equivalentes del plan del nutriólogo).
alter table public.dias add column if not exists extra jsonb not null default '{}'::jsonb;

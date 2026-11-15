-- Cantidad mínima para avisar que un producto se está acabando
alter table public.despensa add column if not exists minimo numeric(10,2) check (minimo is null or minimo >= 0);

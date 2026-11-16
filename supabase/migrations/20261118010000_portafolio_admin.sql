-- Panel privado del portafolio: solo los administradores (tabla admins / es_admin()) pueden ver, aprobar y borrar.
create policy "portafolio: admin lee resenas" on public.portafolio_comentarios
  for select to authenticated using ((select public.es_admin()));
create policy "portafolio: admin edita resenas" on public.portafolio_comentarios
  for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "portafolio: admin borra resenas" on public.portafolio_comentarios
  for delete to authenticated using ((select public.es_admin()));

create policy "portafolio: admin lee mensajes" on public.portafolio_mensajes
  for select to authenticated using ((select public.es_admin()));
create policy "portafolio: admin edita mensajes" on public.portafolio_mensajes
  for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "portafolio: admin borra mensajes" on public.portafolio_mensajes
  for delete to authenticated using ((select public.es_admin()));

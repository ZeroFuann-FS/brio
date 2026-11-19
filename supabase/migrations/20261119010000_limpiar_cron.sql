-- brio-descansos corre cada 3 segundos y pg_cron guarda un registro por corrida (~28,800 al día):
-- cada hora se borran los registros de más de un día para que la tabla no crezca sin control.
select cron.schedule('brio-limpiar-cron', '7 * * * *', $cron$
  delete from cron.job_run_details where end_time < now() - interval '1 day';
$cron$);

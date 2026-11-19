/**
 * Manda el push de "se acabó el descanso" a quien ya le terminó. La llama pg_cron (cada 3 s, solo si hay alguno vencido).
 * Es pública (sin JWT) como `recordatorios`: solo envía lo que ya tocaba y cada aviso se toma una sola vez.
 */
// deno-lint-ignore-file no-explicit-any
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const VAPID_PUBLICA = "BE8kKlQUSvqTugneUs16KcKH0Vv78tX_kwqDHiSZ8CD0DnG8fw0OtLzyBzKKxiB8ieAwB6uVgLRLwG-ec5N2nLM";

Deno.serve(async () => {
  const privada = Deno.env.get("VAPID_PRIVADA");
  if (!privada) return new Response("Falta VAPID_PRIVADA", { status: 500 });
  webpush.setVapidDetails("https://mi-brio.vercel.app", VAPID_PUBLICA, privada);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const { data: vencidos, error } = await sb.rpc("tomar_descansos");
  if (error) return new Response(error.message, { status: 500 });
  if (!vencidos?.length) return Response.json({ enviados: 0 });

  const ids = [...new Set(vencidos.map((v: any) => v.user_id))];
  const { data: subs } = await sb.from("push_suscripciones").select("endpoint, user_id, p256dh, auth").in("user_id", ids);

  let enviados = 0;
  await Promise.all(vencidos.map(async (v: any) => {
    // Si se atrasó mucho (por ejemplo, el servidor estuvo caído), ya no sirve avisar
    if (Date.now() - new Date(v.fin).getTime() > 60_000) return;
    const lista = (subs ?? []).filter((s: any) => s.user_id === v.user_id);
    await Promise.all(lista.map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ titulo: v.titulo, cuerpo: v.cuerpo, url: "/", tag: "descanso" }),
          { TTL: 60, urgency: "high" },
        );
        enviados++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) await sb.from("push_suscripciones").delete().eq("endpoint", s.endpoint);
      }
    }));
  }));
  return Response.json({ vencidos: vencidos.length, enviados });
});

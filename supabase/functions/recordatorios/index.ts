/**
 * Envía las notificaciones push que tocan ahora. La llama pg_cron cada 5 minutos.
 * Usa la llave de servicio (variable del entorno de Supabase) para leer los datos de quienes activaron avisos.
 */
// deno-lint-ignore-file no-explicit-any
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { avisosDelMinuto } from "../_shared/avisos.ts";

const VAPID_PUBLICA = "BE8kKlQUSvqTugneUs16KcKH0Vv78tX_kwqDHiSZ8CD0DnG8fw0OtLzyBzKKxiB8ieAwB6uVgLRLwG-ec5N2nLM";

function ahoraEn(zona: string) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { hoy: `${p.year}-${p.month}-${p.day}`, minuto: (Number(p.hour) % 24) * 60 + Number(p.minute) };
}

Deno.serve(async () => {
  const privada = Deno.env.get("VAPID_PRIVADA");
  if (!privada) return new Response("Falta VAPID_PRIVADA", { status: 500 });
  webpush.setVapidDetails("https://mi-brio.vercel.app", VAPID_PUBLICA, privada);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // Freno: máximo una corrida cada 2 minutos aunque alguien la llame de más
  const { data: freno } = await sb.rpc("tomar_turno_recordatorios");
  if (freno === false) return new Response("Muy pronto", { status: 429 });

  const { data: subs, error } = await sb.from("push_suscripciones").select("endpoint, user_id, p256dh, auth, zona");
  if (error) return new Response(error.message, { status: 500 });
  const porUsuario = new Map<string, any[]>();
  for (const s of subs ?? []) porUsuario.set(s.user_id, [...(porUsuario.get(s.user_id) ?? []), s]);

  let enviados = 0;
  for (const [uid, lista] of porUsuario) {
    const zona = lista[0].zona || "America/Mexico_City";
    const { hoy, minuto } = ahoraEn(zona);
    const [pf, de, dia, peso] = await Promise.all([
      sb.from("perfiles").select("datos").eq("user_id", uid).maybeSingle(),
      sb.from("despensa").select("nombre, cantidad, minimo").eq("user_id", uid),
      sb.from("dias").select("agua_ml, habitos").eq("user_id", uid).eq("fecha", hoy).maybeSingle(),
      sb.from("pesos").select("kg").eq("user_id", uid).order("fecha", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const perfil = pf.data?.datos;
    if (!perfil?.recordatorios) continue;
    const baja = (de.data ?? []).filter((i: any) => i.minimo != null && Number(i.cantidad) <= Number(i.minimo)).map((i: any) => i.nombre);
    const habitosHechos = Object.values(dia.data?.habitos ?? {}).filter(Boolean).length;
    const avisos = avisosDelMinuto({ perfil, hoy, minuto, despensaBaja: baja, habitosHechos, aguaMl: dia.data?.agua_ml ?? 0, pesoKg: Number(peso.data?.kg ?? perfil.pesoInicial ?? 0) });

    for (const a of avisos) {
      // Solo una vez por clave
      const { data: nuevo } = await sb.from("push_enviados").insert({ user_id: uid, clave: a.clave }).select("clave").maybeSingle();
      if (!nuevo) continue;
      for (const s of lista) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ titulo: a.titulo, cuerpo: a.cuerpo, url: a.url, tag: a.clave }), { TTL: 3600 });
          enviados++;
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) await sb.from("push_suscripciones").delete().eq("endpoint", s.endpoint);
        }
      }
    }
  }
  return Response.json({ usuarios: porUsuario.size, enviados });
});

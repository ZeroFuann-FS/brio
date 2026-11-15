/** Notificaciones push (Web Push). La llave pública VAPID es pública por diseño. */
import { supabase } from "./supabase";

export const VAPID_PUBLICA = "BE8kKlQUSvqTugneUs16KcKH0Vv78tX_kwqDHiSZ8CD0DnG8fw0OtLzyBzKKxiB8ieAwB6uVgLRLwG-ec5N2nLM";

export const soportaPush = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const instalada = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function registrarSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => { /* sin SW */ }); });
}

function base64AUint8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export type EstadoPush = "activo" | "inactivo" | "denegado" | "sin-soporte" | "instalar";

export async function estadoPush(): Promise<EstadoPush> {
  if (esIOS() && !instalada()) return "instalar";
  if (!soportaPush()) return "sin-soporte";
  if (Notification.permission === "denied") return "denegado";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "activo" : "inactivo";
}

/** Pide permiso, se suscribe y guarda la suscripción en la nube (si hay cuenta). */
export async function activarPush(): Promise<{ ok: boolean; motivo?: string }> {
  if (esIOS() && !instalada()) return { ok: false, motivo: "instalar" };
  if (!soportaPush()) return { ok: false, motivo: "sin-soporte" };
  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") return { ok: false, motivo: "denegado" };
  let sub: PushSubscription;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64AUint8(VAPID_PUBLICA) }));
  } catch {
    return { ok: false, motivo: "suscripcion" };
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { ok: true, motivo: "sin-cuenta" };
  const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const { error } = await supabase.from("push_suscripciones").upsert({
    endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth,
    zona: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City", actualizado: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  return error ? { ok: false, motivo: "error" } : { ok: true };
}

export async function desactivarPush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await supabase.from("push_suscripciones").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

/** Notificación local inmediata (sirve para probar y para avisos con la app abierta). */
export async function notificarLocal(titulo: string, cuerpo: string, tag?: string) {
  if (!soportaPush() || Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification(titulo, { body: cuerpo, icon: "/icono-192.png", badge: "/icono-badge.png", tag, data: { url: "/" } });
  return true;
}

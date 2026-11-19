/** Notificaciones push (Web Push). La llave pública VAPID es pública por diseño. */
import { supabase } from "./supabase";

export const VAPID_PUBLICA = "BE8kKlQUSvqTugneUs16KcKH0Vv78tX_kwqDHiSZ8CD0DnG8fw0OtLzyBzKKxiB8ieAwB6uVgLRLwG-ec5N2nLM";

export const soportaPush = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const instalada = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function registrarSW() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => reg.active?.postMessage({ tipo: "actualizar" })) // deja lista la versión actual para usarla sin internet
      .catch(() => { /* sin SW */ });
  });
}

/** Manda un mensaje al service worker activo (si hay). */
async function alSW(msg: object) {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg?.active) return false;
  reg.active.postMessage(msg);
  return true;
}

/** Guarda estas imágenes para verlas sin internet (por ejemplo, las fotos de los ejercicios de tus rutinas). */
export const guardarSinRed = (urls: string[]) => { if (urls.length) void alSW({ tipo: "guardar", urls }); };

/**
 * Programa el aviso de fin de descanso.
 * 1) Por push desde el servidor: llega con la pantalla bloqueada también en iPhone (necesita internet).
 * 2) Si no se pudo (sin red o sin cuenta), con el service worker: funciona sin internet en Android y computadora.
 */
let ultimoDescanso = 0;
export async function avisarDescanso(fin: number, siguiente?: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const titulo = "Se acabó el descanso", cuerpo = siguiente ? `Sigue: ${siguiente}` : "Vamos con la siguiente serie.";
  const yo = ++ultimoDescanso;
  let enServidor = false;
  if (navigator.onLine) {
    const { data } = await supabase.auth.getSession();
    const tieneSub = await navigator.serviceWorker?.getRegistration().then((r) => r?.pushManager.getSubscription()).catch(() => null);
    if (data.session && tieneSub) {
      const { error } = await supabase.from("descansos").upsert({ user_id: data.session.user.id, fin: new Date(fin).toISOString(), titulo, cuerpo: cuerpo.slice(0, 160) }, { onConflict: "user_id" });
      enServidor = !error;
    }
  }
  if (yo !== ultimoDescanso) return; // ya se reprogramó o canceló mientras tanto
  if (enServidor) void alSW({ tipo: "cancelar-descanso" });
  else void alSW({ tipo: "descanso", fin, titulo, cuerpo });
}
export async function cancelarAvisoDescanso() {
  ultimoDescanso++;
  void alSW({ tipo: "cancelar-descanso" });
  if (!navigator.onLine) return;
  const { data } = await supabase.auth.getSession();
  if (data.session) await supabase.from("descansos").delete().eq("user_id", data.session.user.id);
}

/**
 * Deja listo el aviso del descanso al marcar una serie (debe llamarse desde un toque):
 * pide permiso la primera vez y activa el push del dispositivo si aún no está.
 */
let preparado = false;
export function pedirPermisoDescanso() {
  if (preparado || typeof Notification === "undefined" || !soportaPush() || (esIOS() && !instalada())) return;
  preparado = true;
  if (Notification.permission === "denied") return;
  if (Notification.permission === "default") {
    try { if (localStorage.getItem("brio:pidio-descanso")) return; localStorage.setItem("brio:pidio-descanso", "1"); } catch { /* sin storage */ }
    void activarPush(); // directo en el toque: Safari no deja pedir permiso después de esperar otra cosa
    return;
  }
  void estadoPush().then((e) => { if (e === "inactivo") void activarPush(); });
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

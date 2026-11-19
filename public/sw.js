/*
 * Service worker de Brío:
 * - Deja la app lista sin internet (la app, sus archivos y las fotos que ya viste o que usan tus rutinas).
 * - Avisa cuando termina el descanso aunque la pantalla esté bloqueada.
 * - Recibe notificaciones push y abre la app al tocarlas.
 */
const APP = "brio-app-v1";
const IMG = "brio-img-v1";
const EXTERNAS = new Set(["fonts.googleapis.com", "fonts.gstatic.com", "www.themealdb.com", "images.openfoodfacts.org", "static.openfoodfacts.org"]);
/** Rutas de la app de una sola página (todas sirven el mismo index.html). */
const esSpa = (u) => !/\.[a-z0-9]+$/i.test(u.pathname) && !u.pathname.startsWith("/conoce");

/** Guarda la app y sus archivos; borra los archivos de versiones viejas. */
async function actualizar() {
  const cache = await caches.open(APP);
  const r = await fetch("/precache.json", { cache: "no-store" });
  if (!r.ok) return;
  const { archivos } = await r.json();
  const html = await fetch("/", { cache: "no-store" });
  if (html.ok) await cache.put("/", html);
  const guardados = await cache.keys();
  const ya = new Set(guardados.map((q) => new URL(q.url).pathname));
  await Promise.all(archivos.filter((f) => !ya.has(f)).map((f) => cache.add(f).catch(() => {})));
  const vigentes = new Set(archivos);
  await Promise.all(guardados.filter((q) => { const p = new URL(q.url).pathname; return p.startsWith("/assets/") && !vigentes.has(p); }).map((q) => cache.delete(q)));
}

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(actualizar().catch(() => {}));
});
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  const nombres = await caches.keys();
  await Promise.all(nombres.filter((n) => n.startsWith("brio-") && n !== APP && n !== IMG).map((n) => caches.delete(n)));
  await self.clients.claim();
})()));

async function cachePrimero(req, nombre) {
  const cache = await caches.open(nombre);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const r = await fetch(req);
    if (r.ok || r.type === "opaque") cache.put(req, r.clone()).catch(() => {});
    return r;
  } catch {
    return Response.error();
  }
}

/** Red primero, pero si tarda (señal mala) responde con lo guardado. */
async function redPrimero(req, clave, ms) {
  const cache = await caches.open(APP);
  const red = fetch(req).then((r) => { if (r.ok) cache.put(clave, r.clone()).catch(() => {}); return r; });
  const guardada = await cache.match(clave);
  if (!guardada) {
    try { return await red; } catch { return (await cache.match("/")) || Response.error(); }
  }
  return Promise.race([red.catch(() => guardada), new Promise((ok) => setTimeout(() => ok(guardada), ms))]);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (u.pathname === "/sw.js" || u.pathname === "/precache.json") return;
    if (req.mode === "navigate") return e.respondWith(redPrimero(req, esSpa(u) ? "/" : req, 3500));
    if (u.pathname.startsWith("/assets/")) return e.respondWith(cachePrimero(req, APP));
    if (/\.(webp|png|jpe?g|svg|gif|avif)$/i.test(u.pathname)) return e.respondWith(cachePrimero(req, IMG));
    return e.respondWith(redPrimero(req, req, 3500));
  }
  if (EXTERNAS.has(u.hostname)) e.respondWith(cachePrimero(req, IMG));
});

/* ---------- Mensajes de la app ---------- */
let descanso = null; // { timer, fin }

function cancelarDescanso() {
  if (!descanso) return;
  clearTimeout(descanso.timer);
  descanso.fin();
  descanso = null;
}

self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.tipo === "actualizar") e.waitUntil(actualizar().catch(() => {}));
  else if (d.tipo === "guardar" && Array.isArray(d.urls)) {
    e.waitUntil(caches.open(IMG).then(async (c) => {
      for (const url of d.urls) if (!(await c.match(url))) await c.add(url).catch(() => {});
    }));
  } else if (d.tipo === "cancelar-descanso") cancelarDescanso();
  else if (d.tipo === "descanso") {
    cancelarDescanso();
    // waitUntil mantiene vivo el service worker hasta que termine el descanso (los navegadores lo permiten unos minutos).
    e.waitUntil(new Promise((fin) => {
      const ms = Math.max(0, Number(d.fin) - Date.now());
      descanso = {
        fin,
        timer: setTimeout(async () => {
          descanso = null;
          try {
            const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
            // Con la app en pantalla ya suena y vibra ahí; la notificación es para cuando no la estás viendo.
            if (!ventanas.some((v) => v.visibilityState === "visible")) {
              await self.registration.showNotification(d.titulo || "Se acabó el descanso", {
                body: d.cuerpo || "Vamos con la siguiente serie.",
                icon: "/icono-192.png", badge: "/icono-badge.png", tag: "descanso", renotify: true,
                vibrate: [300, 120, 300, 120, 300], data: { url: "/" },
              });
            }
          } finally { fin(); }
        }, ms),
      };
    }));
  }
});

/* ---------- Push ---------- */
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { titulo: "Brío", cuerpo: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Brío", {
    body: d.cuerpo || "",
    icon: "/icono-192.png",
    badge: "/icono-badge.png",
    tag: d.tag,
    data: { url: d.url || "/" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const v of ventanas) { if ("focus" in v) { if (new URL(v.url).pathname !== new URL(url, self.location.origin).pathname) v.navigate(url).catch(() => {}); return v.focus(); } }
    return self.clients.openWindow(url);
  })());
});

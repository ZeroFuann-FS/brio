/**
 * Capturas de Brío con Firefox sin ventana (WebDriver BiDi) y los datos de demostración.
 *
 * Uso:
 *   npx vite --port 5199 &                          (la app corriendo)
 *   npx tsx herramientas/demo/datos-demo.ts > /tmp/demo.json
 *   node herramientas/capturas/capturar.mjs --datos /tmp/demo.json --escenas herramientas/capturas/escenas-laptop.json --salida /tmp/capturas
 *
 * Opciones: --ancho 1440 --alto 900 --escala 2 --oscuro --url http://localhost:5199 --completa (página completa)
 * Cada escena: { "nombre": "hoy", "tab": "hoy", "pasos": [ {"clic": "Texto del botón"}, {"esperar": 800}, {"bajar": 600} ] }
 */
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true]);
  return acc;
}, []));
const ANCHO = Number(args.ancho ?? 1440), ALTO = Number(args.alto ?? 900), ESCALA = Number(args.escala ?? 2);
const URL_APP = args.url ?? "http://localhost:5199";
const PUERTO = 9300 + Math.floor(Math.random() * 90);
const estado = JSON.parse(readFileSync(args.datos, "utf8"));
const escenas = JSON.parse(readFileSync(args.escenas, "utf8"));
mkdirSync(args.salida, { recursive: true });

// Firefox con perfil limpio (si se reusa un perfil viejo, localStorage puede quedar dañado)
const perfil = mkdtempSync(join(tmpdir(), "brio-ff-"));
writeFileSync(join(perfil, "user.js"), [
  `user_pref("ui.prefersReducedMotion", ${args.animado ? 0 : 1});`,
  `user_pref("ui.systemUsesDarkTheme", ${args.oscuro ? 1 : 0});`,
  `user_pref("layout.css.prefers-color-scheme.content-override", ${args.oscuro ? 0 : 1});`,
].join("\n"));
const ff = spawn("firefox", ["--headless", "--remote-debugging-port", String(PUERTO), "--profile", perfil, "--no-remote"], { stdio: "ignore" });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const cerrar = () => { try { ff.kill(); } catch { /* ya cerrado */ } setTimeout(() => rmSync(perfil, { recursive: true, force: true }), 1500); };
process.on("exit", cerrar);

let ws;
for (let i = 0; i < 40 && !ws; i++) {
  await dormir(500);
  try { const s = new WebSocket(`ws://127.0.0.1:${PUERTO}/session`); await new Promise((ok, mal) => { s.onopen = ok; s.onerror = mal; }); ws = s; } catch { /* aún no */ }
}
if (!ws) { console.error("Firefox no arrancó"); process.exit(1); }
let id = 0; const pendientes = new Map();
ws.onmessage = (m) => { const r = JSON.parse(m.data); if (r.id && pendientes.has(r.id)) { pendientes.get(r.id)(r); pendientes.delete(r.id); } };
const cmd = (method, params = {}) => new Promise((ok, mal) => { const i = ++id; pendientes.set(i, (r) => (r.type === "error" ? mal(new Error(`${method}: ${r.message}`)) : ok(r.result))); ws.send(JSON.stringify({ id: i, method, params })); });

await cmd("session.new", { capabilities: {} });
const { contexts } = await cmd("browsingContext.getTree", {});
const ctx = contexts[0].context;
await cmd("browsingContext.setViewport", { context: ctx, viewport: { width: ANCHO, height: ALTO }, devicePixelRatio: ESCALA });
const ev = async (expression) => (await cmd("script.evaluate", { expression, target: { context: ctx }, awaitPromise: true })).result?.value;
const ir = (url) => cmd("browsingContext.navigate", { context: ctx, url, wait: "complete" });

// Cargar los datos de demostración (a veces la primera carga se queda en blanco: reintentar)
for (let i = 0; i < 5; i++) {
  await ir(URL_APP).catch(() => {});
  if ((await ev(`location.origin`)) === new URL(URL_APP).origin) break;
  await dormir(1500);
}
const ok = await ev(`(() => { try {
  localStorage.clear();
  localStorage.setItem("brio:intro-visto-v3", "1"); localStorage.setItem("brio:sin-cuenta", "1");
  localStorage.setItem("brio:tutorial", JSON.stringify({ hoy: true, comida: true, entreno: true, progreso: true }));
  localStorage.setItem("brio:llama-fecha", new Date().toLocaleDateString("en-CA"));
  localStorage.setItem("brio:tema", ${JSON.stringify(args.oscuro ? "oscuro" : "claro")});
  localStorage.setItem("brio:datos-v3", ${JSON.stringify(JSON.stringify({ state: estado, version: 4 }))});
  return "ok"; } catch (e) { return String(e); } })()`);
if (ok !== "ok") { console.error("No se pudieron cargar los datos:", ok); process.exit(1); }

const clic = (texto) => ev(`(() => {
  const t = ${JSON.stringify(texto)};
  const els = [...document.querySelectorAll("button, a, [role=tab]")];
  const b = els.find((x) => x.textContent.trim() === t) ?? els.find((x) => x.getAttribute("aria-label") === t) ?? els.find((x) => x.textContent.trim().startsWith(t));
  if (!b) return false; b.scrollIntoView({ block: "center" }); b.click(); return true; })()`);
const contenedorScroll = `(() => { const h = [...document.querySelectorAll("*")].filter((x) => { const c = getComputedStyle(x); return /auto|scroll/.test(c.overflowY) && x.scrollHeight > x.clientHeight + 20; }).pop(); return h ?? document.scrollingElement; })()`;

for (const e of escenas) {
  await ir(`${URL_APP}/${e.tab ? `?tab=${e.tab}` : ""}`);
  // Esperar a que la app esté lista (la barra de navegación) y a que pase la animación de entrada
  for (let i = 0; i < 40 && !(await ev(`!!document.querySelector("nav")`)); i++) await dormir(500);
  await dormir(e.carga ?? 1800);
  if (args.depurar) console.log("  storage:", await ev(`[localStorage.length, localStorage.getItem("brio:intro-visto-v3"), location.href].join(" | ")`));
  for (const p of e.pasos ?? []) {
    if (p.clic && !(await clic(p.clic))) console.warn(`  [${e.nombre}] no encontré: ${p.clic}`);
    if (p.escribir) await ev(`(() => { const i = document.querySelector(${JSON.stringify(p.en)}); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, ${JSON.stringify(p.escribir)}); i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
    if (p.bajar !== undefined) await ev(`(() => { const h = ${contenedorScroll}; h.scrollTop = ${p.bajar}; return h.scrollTop; })()`);
    if (p.js) await ev(p.js);
    await dormir(p.esperar ?? 700);
  }
  const { data } = await cmd("browsingContext.captureScreenshot", { context: ctx, origin: args.completa || e.completa ? "document" : "viewport" });
  writeFileSync(join(args.salida, `${e.nombre}.png`), Buffer.from(data, "base64"));
  console.log("ok", e.nombre);
}
ws.close();
cerrar();
process.exit(0);

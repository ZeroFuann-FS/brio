/**
 * Graba los videos de Brío (página /conoce y contenido) con Playwright + Chromium y los datos de demostración.
 *
 * Uso (desde la raíz del repo, con la app corriendo en el puerto 5199):
 *   npx vite --port 5199 &
 *   npx tsx herramientas/demo/datos-demo.ts > /tmp/demo.json
 *   node herramientas/videos/grabar.mjs celular /tmp/demo.json salida/
 *   (videos: celular, computadora, corto, o cualquiera definido en guiones.mjs)
 *
 * Resultado: salida/brio-<video>.mp4 y salida/brio-<video>.jpg (portada para el reproductor).
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GUIONES } from "./guiones.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const [nombre, rutaDatos, salida = "salida"] = process.argv.slice(2);
const g = GUIONES[nombre];
if (!g) { console.error(`Video desconocido: ${nombre}. Opciones: ${Object.keys(GUIONES).join(", ")}`); process.exit(1); }
const URL_APP = process.env.URL_APP ?? "http://localhost:5199";
const estado = JSON.parse(readFileSync(rutaDatos, "utf8"));
const tmp = join(salida, `.tmp-${nombre}`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const navegador = await chromium.launch();
const ctx = await navegador.newContext({
  viewport: g.viewport, deviceScaleFactor: g.escala, reducedMotion: "no-preference", colorScheme: g.oscuro ? "dark" : "light",
  locale: "es-MX", timezoneId: "America/Mexico_City", hasTouch: g.tactil ?? false, isMobile: g.tactil ?? false,
  recordVideo: { dir: tmp, size: g.video },
});
// Datos de demostración antes de que cargue la app (solo la primera vez: lo que pase en el video se queda)
await ctx.addInitScript(({ estado, oscuro }) => {
  if (sessionStorage.getItem("demo-cargada")) return;
  sessionStorage.setItem("demo-cargada", "1");
  localStorage.clear();
  localStorage.setItem("brio:intro-visto-v3", "1");
  localStorage.setItem("brio:sin-cuenta", "1");
  localStorage.setItem("brio:tutorial", JSON.stringify({ hoy: true, comida: true, entreno: true, progreso: true }));
  localStorage.setItem("brio:tema", oscuro ? "oscuro" : "claro");
  localStorage.setItem("brio:vista-dia", "lista");
  localStorage.setItem("brio:datos-v3", JSON.stringify({ state: estado, version: 4 }));
}, { estado, oscuro: !!g.oscuro });

const t0 = Date.now();
const page = await ctx.newPage();
page.setDefaultTimeout(6000);
await page.goto(URL_APP, { waitUntil: "networkidle" });
await page.waitForFunction(() => [...document.querySelectorAll("[data-tour=nav]")].some((e) => e.getBoundingClientRect().width > 0), null, { timeout: 20000 });
await page.waitForTimeout(2200); // pasa la animación del logo al entrar

// Capa del video: subtítulo arriba, círculo de toque y cortinillas
await page.evaluate(({ compacto }) => {
  const css = document.createElement("style");
  css.textContent = `
    #v-sub { position: fixed; left: 50%; top: ${compacto ? 10 : 18}px; transform: translate(-50%, -12px); z-index: 99998; max-width: 92%;
      background: rgba(21,22,20,.92); color: #f3f1ea; font: 500 ${compacto ? 13 : 16}px/1.3 "Inter Tight", system-ui; text-align: center;
      padding: ${compacto ? "9px 14px" : "11px 20px"}; border-radius: 14px; opacity: 0; transition: opacity .35s, transform .35s; pointer-events: none; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
    #v-sub.on { opacity: 1; transform: translate(-50%, 0); }
    #v-sub b { color: #c8f135; font-weight: 600; }
    #v-dedo { position: fixed; z-index: 99999; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%;
      background: rgba(200,241,53,.55); border: 2px solid #1a1c17; opacity: 0; pointer-events: none;
      transition: left .45s cubic-bezier(.3,.7,.3,1), top .45s cubic-bezier(.3,.7,.3,1), opacity .25s, transform .15s; }
    #v-dedo.on { opacity: 1; } #v-dedo.toca { transform: scale(.75); }
    #v-cortina { position: fixed; inset: 0; z-index: 100000; display: grid; place-items: center; text-align: center; color: #f3f1ea;
      background: radial-gradient(60% 50% at 50% 45%, rgba(200,241,53,.16), transparent 70%), #0f110d; opacity: 0; transition: opacity .5s; pointer-events: none; padding: 24px; }
    #v-cortina.on { opacity: 1; }
    /* Latido invisible: obliga a dibujar cuadros aunque la pantalla esté quieta (si no, el video se acorta) */
    #v-latido { position: fixed; right: 0; bottom: 0; width: 2px; height: 2px; z-index: 100001; pointer-events: none; animation: v-latido 0.5s steps(2) infinite; }
    @keyframes v-latido { 0% { background: rgba(0,0,0,.004); } 100% { background: rgba(0,0,0,.008); } }
    #v-cortina .num { font: 600 ${compacto ? 14 : 18}px "Barlow Condensed", system-ui; letter-spacing: .3em; color: #c8f135; }
    #v-cortina h2 { font: 500 ${compacto ? 30 : 46}px/1.08 "Fraunces", Georgia, serif; margin: 10px 0 8px; }
    #v-cortina p { font: 400 ${compacto ? 14 : 18}px/1.4 "Inter Tight", system-ui; color: #b9b8ae; max-width: 30ch; margin: 0 auto; }
    #v-cortina .logo { font: 700 ${compacto ? 64 : 96}px "Sora", system-ui; letter-spacing: -.04em; }
    #v-cortina .logo i { font-style: normal; color: #c8f135; }
  `;
  document.head.appendChild(css);
  for (const id of ["v-sub", "v-dedo", "v-cortina", "v-latido"]) { const d = document.createElement("div"); d.id = id; document.body.appendChild(d); }
}, { compacto: g.viewport.width < 500 });

const dormir = (ms) => page.waitForTimeout(ms);
const capa = (fn, arg) => page.evaluate(fn, arg);

/** Encuentra un elemento visible por su texto (dentro de la hoja abierta si hay una). */
async function buscar(texto, en) {
  const h = await page.evaluateHandle(({ texto, en }) => {
    const visibleRaiz = (sel) => [...document.querySelectorAll(sel)].find((e) => e.getBoundingClientRect().width > 0);
    const raiz = (en && visibleRaiz(en)) || document.querySelector("[role=dialog]") || document;
    const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
    const todos = [...raiz.querySelectorAll("button, a, [role=tab], label, li, h2, h3, p, span")].filter(visible);
    const limpio = (e) => e.textContent.replace(/\s+/g, " ").trim().toLowerCase();
    texto = texto.toLowerCase();
    return todos.find((e) => e.matches("button,a,[role=tab]") && limpio(e) === texto)
      ?? todos.find((e) => e.getAttribute("aria-label")?.toLowerCase() === texto)
      ?? todos.find((e) => e.matches("button,a,[role=tab]") && limpio(e).startsWith(texto))
      ?? todos.find((e) => limpio(e) === texto) ?? null;
  }, { texto, en });
  const el = h.asElement();
  if (!el) throw new Error(`No encontré "${texto}"`);
  return el;
}

/** Mueve el "dedo" al elemento, lo toca y hace clic. */
async function tocar(el) {
  await el.scrollIntoViewIfNeeded();
  await dormir(250);
  const r = await el.boundingBox();
  if (!r) throw new Error("Elemento sin tamaño");
  await capa(({ x, y }) => { const d = document.getElementById("v-dedo"); d.style.left = `${x}px`; d.style.top = `${y}px`; d.classList.add("on"); }, { x: r.x + r.width / 2, y: r.y + r.height / 2 });
  await dormir(550);
  await capa(() => document.getElementById("v-dedo").classList.add("toca"));
  await dormir(120);
  // Si algo lo tapa (por ejemplo la barra del descanso), el clic va directo al elemento
  try { await el.click({ timeout: 2500 }); } catch { await el.evaluate((e) => e.click()); }
  await capa(() => document.getElementById("v-dedo").classList.remove("toca"));
  await dormir(260);
  await capa(() => document.getElementById("v-dedo").classList.remove("on"));
}

const sub = (html) => capa((html) => { const s = document.getElementById("v-sub"); if (html) { s.innerHTML = html; s.classList.add("on"); } else s.classList.remove("on"); }, html ?? null);
const cortina = (html) => capa((html) => { const c = document.getElementById("v-cortina"); if (html) { c.innerHTML = `<div>${html}</div>`; c.classList.add("on"); } else c.classList.remove("on"); }, html ?? null);
const bajar = (px) => capa((px) => {
  const d = document.querySelector("[role=dialog]");
  const h = d ?? document.scrollingElement;
  h.scrollBy({ top: px, behavior: "smooth" });
}, px);

/** Cierra cualquier hoja que haya quedado abierta (para empezar cada capítulo limpio). */
async function cerrarHojas() {
  for (let i = 0; i < 3 && (await page.$("[role=dialog]")); i++) {
    await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].find((b) => b.textContent.trim() === "Cerrar")?.click());
    await page.waitForTimeout(500);
  }
}

let tInicio = null;
for (const [i, p] of g.pasos.entries()) {
  try {
    if (p.portada) {
      await cortina(`<div class="logo">br<i>í</i>o</div><p style="margin-top:8px">Ponle brío a tu vida.</p>`);
      await dormir(600);
      tInicio ??= (Date.now() - t0) / 1000;
      await dormir(p.dur ?? 2200);
      await cortina(null); await dormir(600);
    } else if (p.capitulo) {
      await sub(null);
      await cerrarHojas();
      await cortina(`<div class="num">${p.capitulo}</div><h2>${p.titulo}</h2>${p.sub ? `<p>${p.sub}</p>` : ""}`);
      await dormir(600);
      tInicio ??= (Date.now() - t0) / 1000;
      if (p.antes) for (const q of p.antes) await correr(q);   // cambiar de pantalla mientras está la cortina
      await dormir(p.dur ?? 1800);
      await cortina(null); await dormir(600);
    } else if (p.final) {
      await sub(null);
      await cortina(`<div class="logo">br<i>í</i>o</div><p style="margin-top:10px">Gratis, sin anuncios.<br><b style="color:#c8f135">mi-brio.vercel.app</b></p>`);
      await dormir(p.dur ?? 3200);
    } else await correr(p);
  } catch (e) {
    console.warn(`  paso ${i} (${JSON.stringify(p).slice(0, 70)}): ${e.message}`);
  }
}

async function correr(p) {
  if ("texto" in p) await sub(p.texto);
  if (p.tab) await tocar(await buscar(p.tab, "[data-tour=nav]"));
  if (p.tocar) {
    let el = null;
    for (const t of [].concat(p.tocar)) { try { el = await buscar(t, p.en); break; } catch { /* probar la siguiente */ } }
    if (!el) throw new Error(`No encontré ${[].concat(p.tocar).join(" / ")}`);
    await tocar(el);
  }
  if (p.tocarSel) {
    const els = await page.$$(p.tocarSel);
    const el = els[p.n ?? 0];
    if (!el) throw new Error(`No encontré ${p.tocarSel}`);
    await tocar(el);
  }
  if (p.escribir) {
    const el = await page.$(p.en ?? "[role=dialog] input");
    if (!el) throw new Error(`No encontré ${p.en}`);
    await el.click();
    await page.keyboard.type(p.escribir, { delay: 90 });
  }
  if (p.bajar) await bajar(p.bajar);
  if (p.irA) await capa((t) => { const e = [...document.querySelectorAll("h2,h3,p,span")].find((x) => x.textContent.trim() === t); e?.scrollIntoView({ behavior: "smooth", block: "start" }); }, p.irA);
  if (p.arriba) await capa(() => (document.querySelector("[role=dialog]") ?? document.scrollingElement).scrollTo({ top: 0, behavior: "smooth" }));
  if (p.cerrar) { await tocar(await buscar("Cerrar")); }
  await dormir(p.esperar ?? 900);
}

await sub(null);
const duracion = (Date.now() - t0) / 1000;
await page.close();
await ctx.close();
await navegador.close();

// Video: quitar lo que se grabó antes de la portada, pasar a MP4 y poner música
const webm = readdirSync(tmp).find((f) => f.endsWith(".webm"));
const crudo = join(tmp, webm);
const durCrudo = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", crudo]).toString().trim());
console.log(`  grabación cruda: ${durCrudo.toFixed(1)} s · tiempo real: ${duracion.toFixed(1)} s · portada en ${(tInicio ?? 0).toFixed(1)} s`);
const destino = join(salida, `brio-${nombre}.mp4`);
// El reloj de la grabación no va igual que el real: se escalan los tiempos a la duración del video crudo
const escalaT = durCrudo / duracion;
const inicio = Math.max(0, (tInicio ?? 0) * escalaT - 0.4);
const dur = durCrudo - inicio - 0.2;
const musica = join(AQUI, "audio", "musica.m4a");
const conMusica = g.musica !== false;
execFileSync("ffmpeg", [
  "-v", "error", "-y", "-ss", inicio.toFixed(2), "-i", crudo,
  ...(conMusica ? ["-stream_loop", "-1", "-i", musica] : []),
  "-t", dur.toFixed(2),
  "-vf", `fps=30,scale=${g.video.width}:${g.video.height}:flags=lanczos,format=yuv420p`,
  "-c:v", "libx264", "-preset", "slow", "-crf", String(g.crf ?? 24), "-movflags", "+faststart",
  ...(conMusica ? ["-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "128k", "-af", `volume=0.8,afade=t=in:d=1,afade=t=out:st=${Math.max(0, dur - 2.5).toFixed(2)}:d=2.5`] : ["-an"]),
  destino,
]);
// Portada del reproductor
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(g.portadaEn ?? 1.2), "-i", destino, "-frames:v", "1", "-q:v", "4", destino.replace(/\.mp4$/, ".jpg")]);
rmSync(tmp, { recursive: true, force: true });
console.log(`listo: ${destino} (${dur.toFixed(1)} s)`);

/** Capturas de página completa (p. ej. /conoce/index.html) en celular, celular oscuro, laptop y tablet, para revisar el diseño.
 *  Uso: node herramientas/videos/capturar-pagina.mjs http://localhost:5199/conoce/index.html /tmp/capturas */
import { chromium } from "playwright";
const [url, salida] = process.argv.slice(2);
const b = await chromium.launch();
for (const [n, w, h, tema] of [["cel", 390, 844, "light"], ["cel-osc", 390, 844, "dark"], ["lap", 1440, 900, "light"], ["tab", 768, 1024, "light"]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: tema });
  const p = await c.newPage();
  await p.goto(url, { waitUntil: "networkidle" });
  await p.evaluate(async () => { document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager")); for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } scrollTo(0, 0); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${salida}/pag-${n}.png`, fullPage: true });
  const ancho = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  console.log(n, ancho);
  await c.close();
}
await b.close();

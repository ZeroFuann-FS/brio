import { useEffect, useRef } from "react";

/** Evento que dispara la llama: se manda al completar el día con brío. */
export const RACHA_SUBE = "brio:racha-sube";
const K_FECHA = "brio:llama-fecha";

/** Avisa que hoy se completó el día con brío; la llama sale solo una vez por día. */
export function celebrarRacha(fechaHoy: string) {
  try {
    if (localStorage.getItem(K_FECHA) === fechaHoy) return;
    localStorage.setItem(K_FECHA, fechaHoy);
  } catch { /* sin storage: igual celebramos */ }
  window.dispatchEvent(new Event(RACHA_SUBE));
}

const DURACION = 2100; // ms
const PICO = 0.42;     // momento (0–1) en que la llama llega arriba y el chip salta

/**
 * Llama verde que sube desde abajo de la pantalla y se apaga.
 * Simulación de calor en una cuadrícula chica (cada celda toma el promedio de las de abajo
 * y se enfría), pintada en lima con transparencia y agrandada con desenfoque para que se vea orgánica.
 */
export default function LlamaRacha({ onPico, onFin }: { onPico: () => void; onFin: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = ref.current;
    if (!lienzo) return;
    const ctx = lienzo.getContext("2d");
    if (!ctx) { onPico(); onFin(); return; }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ajustar = () => { lienzo.width = innerWidth * dpr; lienzo.height = innerHeight * dpr; };
    ajustar();
    window.addEventListener("resize", ajustar);

    // Cuadrícula de calor: ~60 columnas, filas según la forma de la pantalla
    const W = 60;
    const H = Math.max(60, Math.round(W * (innerHeight / innerWidth) * 0.9));
    const calor = new Float32Array(W * (H + 2));
    const chica = document.createElement("canvas");
    chica.width = W; chica.height = H;
    const cctx = chica.getContext("2d")!;
    const img = cctx.createImageData(W, H);

    // Paleta: transparente → verde oscuro → lima → casi blanco (con alfa creciente)
    const paleta = new Uint8ClampedArray(256 * 4);
    const paradas: [number, number, number, number, number][] = [
      [0, 120, 170, 20, 0], [0.22, 110, 165, 15, 0], [0.34, 120, 190, 20, 150], [0.5, 170, 225, 35, 215],
      [0.7, 198, 244, 50, 240], [0.88, 236, 255, 170, 252], [1, 255, 255, 235, 255],
    ];
    for (let i = 0; i < 256; i++) {
      const p = i / 255;
      let k = 0;
      while (k < paradas.length - 2 && p > paradas[k + 1][0]) k++;
      const [p0, r0, g0, b0, a0] = paradas[k];
      const [p1, r1, g1, b1, a1] = paradas[k + 1];
      const f = Math.min(1, Math.max(0, (p - p0) / (p1 - p0)));
      paleta.set([r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f, a0 + (a1 - a0) * f], i * 4);
    }

    // Chispas que vuelan hacia el chip de racha
    const chip = document.querySelector("[data-racha]")?.getBoundingClientRect();
    const meta = chip ? { x: chip.left + chip.width / 2, y: chip.top + chip.height / 2 } : { x: innerWidth / 2, y: 40 };
    const chispas = Array.from({ length: 26 }, (_, i) => ({
      x: Math.random() * innerWidth, y: innerHeight * (0.75 + Math.random() * 0.3),
      sale: 0.12 + (i / 26) * 0.22, r: 1.5 + Math.random() * 2.5,
    }));
    let inicio = 0, raf = 0, pico = false;
    const cuadro = (ts: number) => {
      if (!inicio) inicio = ts;
      const t = (ts - inicio) / DURACION;
      if (t >= 1) { onFin(); return; }
      if (!pico && t >= PICO) { pico = true; onPico(); }

      // Fuerza del fuego: sube rápido, se sostiene y se apaga
      const fuerza = t < 0.12 ? t / 0.12 : t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / 0.35);
      // Enfriamiento: poco al principio (la llama llega alto), mucho al final
      const frio = (0.32 + (t > 0.55 ? (t - 0.55) * 7 : 0)) / H;

      // Base (dos filas escondidas abajo): puntos calientes al azar = lenguas de fuego
      for (let x = 0; x < W; x++) {
        const v = Math.random() < 0.5 ? 1.45 * fuerza : 0;
        calor[(H + 1) * W + x] = v;
        calor[H * W + x] = (calor[H * W + x] + v) * 0.5;
      }
      // El calor sube promediando a sus vecinos de abajo y se enfría
      for (let y = 0; y < H; y++) {
        const fila = y * W, a1 = (y + 1) * W, a2 = Math.min(H + 1, y + 2) * W;
        for (let x = 0; x < W; x++) {
          const iz = x > 0 ? x - 1 : x, de = x < W - 1 ? x + 1 : x;
          const v = (calor[a1 + iz] + calor[a1 + x] + calor[a1 + de] + calor[a2 + x]) * 0.25
            - frio * (0.4 + Math.random() * 1.2);
          calor[fila + x] = v > 0 ? v : 0;
        }
      }
      // A la imagen chica
      const d = img.data;
      for (let i = 0; i < W * H; i++) {
        const c = Math.min(255, Math.round(calor[i] * 255)) * 4;
        d[i * 4] = paleta[c]; d[i * 4 + 1] = paleta[c + 1]; d[i * 4 + 2] = paleta[c + 2]; d[i * 4 + 3] = paleta[c + 3];
      }
      cctx.putImageData(img, 0, 0);

      // Agrandada y suave
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.filter = `blur(${Math.round(4 * dpr)}px)`;
      ctx.globalAlpha = t > 0.85 ? Math.max(0, (1 - t) / 0.15) : 1;
      ctx.drawImage(chica, -lienzo.width * 0.05, 0, lienzo.width * 1.1, lienzo.height * 1.04);
      ctx.restore();
      // Chispas: salen de la llama y se juntan en el chip (curva suave)
      for (const c of chispas) {
        const p = (t - c.sale) / 0.3;
        if (p <= 0 || p >= 1) continue;
        const e = p * p * (3 - 2 * p);
        const x = c.x + (meta.x - c.x) * e + Math.sin(p * 9 + c.r) * 18 * (1 - e);
        const y = c.y + (meta.y - c.y) * e;
        ctx.globalAlpha = Math.min(1, (1 - p) * 2.2);
        ctx.fillStyle = p > 0.6 ? "#f4ffd0" : "#c6f432";
        ctx.beginPath(); ctx.arc(x * dpr, y * dpr, c.r * dpr * (1 - e * 0.5), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", ajustar); };
  }, [onPico, onFin]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[70] h-full w-full" />;
}

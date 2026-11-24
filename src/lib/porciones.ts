/* ---------- Cantidades del texto según la porción ---------- */
const FRAC: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };
const aFrac = (v: number) => {
  const r = v < 1 ? Math.max(0.25, Math.round(v * 4) / 4) : Math.round(v * 2) / 2;
  const e = Math.floor(r), d = r - e;
  const f = d === 0.5 ? "½" : d === 0.25 ? "¼" : d === 0.75 ? "¾" : "";
  return e ? `${e}${f}` : f;
};
/** Ajusta la primera cantidad del texto ("125 g de pechuga", "2 tortillas", "½ taza") a la porción elegida. */
export function escalarTexto(t: string, factor: number, gramos: number) {
  if (factor === 1 && !DECIMAL.test(t)) return t;
  const s = t.replace(/(^|\s)(\d+(?:[.,]\d+)?)?([½¼¾])?(?=\s)(\s(?:g|ml)\b)?/, (m, pre: string, num?: string, fr?: string, unidad?: string) => {
    if (!num && !fr) return m;
    const v = (num ? Number(num.replace(",", ".")) : 0) + (fr ? FRAC[fr] : 0);
    if (unidad) return `${pre}${gramos > 0 && Math.abs(v - gramos) < 1 ? Math.round(gramos * factor) : Math.round((v * factor) / 5) * 5}${unidad}`;
    return `${pre}${aFrac(v * factor)}`;
  });
  // "1 tostadas" → "1 tostada"
  return s.replace(/^(\s*(?:1|½|¼|¾) )(\p{L}+[ao])s\b/u, "$1$2");
}

/* ---------- Piezas enteras ---------- */
/** Cosas que se comen completas: nadie quiere "1½ pan" o "2½ huevos". */
const PIEZA = /^(tortilla|tostada|huevo|clara|rebanada|pan|bolillo|telera|lata|milanesa|filete|chuleta|pieza|salchicha|vasito|sope|gordita|empanada|hot ?cake|plátano|platano|manzana|pera|naranja|mandarina|durazno|kiwi|guayaba|toronja|tuna|ciruela|elote|taco|tamal|galleta|barra)s?$/i;

/** "panes" → "pan", "tamales" → "tamal", "huevos" → "huevo", "elotes" → "elote". */
const singular = (w: string) => (/[lnrdzj]es$/i.test(w) ? w.slice(0, -2) : /[aeiouáéíóú]s$/i.test(w) ? w.slice(0, -1) : w);

/**
 * Escala un ingrediente a la porción. Si es una pieza contable con número entero ("2 rebanadas de pan"),
 * redondea a piezas enteras (mínimo 1) y ajusta los gramos a esas piezas, para que lo que comes y lo que se registra cuadren.
 */
export function escalarIngrediente(g: number, t: string, factor: number): { g: number; t: string } {
  if (factor === 1 && !DECIMAL.test(t)) return { g, t };
  const m = t.match(/^(\s*)(\d+(?:\.\d+)?)\s+(\p{L}+)/u);
  if (m && PIEZA.test(m[3])) {
    const v = Number(m[2]);
    const n = Math.max(1, Math.round(v * factor));
    const palabra = n === 1 ? singular(m[3]) : /s$/i.test(m[3]) ? m[3] : /[aeiouáéíóú]$/i.test(m[3]) ? `${m[3]}s` : `${m[3]}es`;
    return { g: v ? (g * n) / v : g * factor, t: `${m[1]}${n} ${palabra}${t.slice(m[0].length)}` };
  }
  return { g: g * factor, t: escalarTexto(t, factor, g) };
}

/* ---------- Ajuste fino por ingrediente ---------- */
/** Texto con cantidad decimal intermedia ("2.5 tortillas"): viene de un ajuste y siempre hay que redondearlo al mostrarlo. */
const DECIMAL = /^\s*\d+\.\d/;
const MEDIDA = (v: number) => (v < 1 ? Math.max(0.25, Math.round(v * 4) / 4) : Math.round(v * 2) / 2);

/** Cantidad al inicio del texto ("5 tortillas", "1½ taza", "2 cucharadas"); null si va en gramos o no trae número. */
function leerCuenta(t: string) {
  const m = t.match(/^(\s*)(\d+(?:[.,]\d+)?)?([½¼¾])?(?=\s)/);
  if (!m || (!m[2] && !m[3])) return null;
  const resto = t.slice(m[0].length);
  if (/^\s(?:g|ml)\b/.test(resto)) return null;
  const v = (m[2] ? Number(m[2].replace(",", ".")) : 0) + (m[3] ? FRAC[m[3]] : 0);
  return { v, pre: m[1], resto, pieza: PIEZA.test(resto.match(/^\s+(\p{L}+)/u)?.[1] ?? "") };
}

/**
 * Aplica un ajuste (×m) a la receta base SIN redondear: la cantidad queda decimal ("3.333 tortillas")
 * y se redondea una sola vez al escalar por la porción, para que lo que ves sea exacto.
 */
export function ajustarIngrediente(g: number, t: string, m: number): { g: number; t: string } {
  const c = leerCuenta(t);
  const v = c ? c.v * m : 0;
  // Sin número, en gramos o con resultado entero: el escalado normal ya es exacto (y arregla "1 tortillas" → "1 tortilla").
  if (!c || Math.abs(v - Math.round(v)) < 0.001) return escalarIngrediente(g, t, m);
  return { g: g * m, t: `${c.pre}${+v.toFixed(3)}${c.resto}` };
}

/**
 * Siguiente multiplicador al tocar − o + en un ingrediente: piezas de una en una (5 → 4 tortillas),
 * medidas de ¼, ½ o 1 (tazas, cucharadas) y gramos de 5, 10 o 25. Bajar del mínimo lo quita (0). Tope ×3.
 */
export function pasoAjuste(g: number, t: string, m: number, factor: number, dir: 1 | -1): number {
  const c = leerCuenta(t);
  let base: number, actual: number, paso: number, minimo: number;
  if (c && c.v > 0) {
    base = c.v * factor;
    if (c.pieza) { actual = Math.max(1, Math.round(base * m)); paso = 1; minimo = 1; }
    else {
      actual = MEDIDA(base * m);
      const ref = dir === 1 ? actual : actual - 0.01;
      paso = ref < 1 ? 0.25 : ref < 2 ? 0.5 : 1; minimo = 0.25;
    }
  } else {
    base = g * factor;
    actual = Math.round(base * m);
    const ref = dir === 1 ? actual : actual - 1;
    paso = ref >= 100 ? 25 : ref >= 30 ? 10 : 5; minimo = 5;
  }
  if (base <= 0) return m;
  const objetivo = actual + dir * paso;
  if (objetivo < minimo) return 0;
  const sig = Math.min(3, objetivo / base);
  return Math.abs(sig - 1) < 0.001 ? 1 : Math.round(sig * 10000) / 10000;
}

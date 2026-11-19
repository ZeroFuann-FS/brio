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
  if (factor === 1) return t;
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
  if (factor === 1) return { g, t };
  const m = t.match(/^(\s*)(\d+)\s+(\p{L}+)/u);
  if (m && PIEZA.test(m[3])) {
    const v = Number(m[2]);
    const n = Math.max(1, Math.round(v * factor));
    const palabra = n === 1 ? singular(m[3]) : /s$/i.test(m[3]) ? m[3] : /[aeiouáéíóú]$/i.test(m[3]) ? `${m[3]}s` : `${m[3]}es`;
    return { g: v ? (g * n) / v : g * factor, t: `${m[1]}${n} ${palabra}${t.slice(m[0].length)}` };
  }
  return { g: g * factor, t: escalarTexto(t, factor, g) };
}

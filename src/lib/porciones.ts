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

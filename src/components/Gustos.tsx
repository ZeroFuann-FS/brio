import { ALIMENTOS } from "../data/alimentos";
import { fotoDe } from "../data/fotos";

/** Alimentos para elegir gustos, por grupo. */
const GRUPOS: { t: string; ids: string[] }[] = [
  { t: "Proteínas", ids: ["huevo", "pechuga-cocida", "muslo", "bistec", "molida-90", "chuleta", "atun-agua", "sardina", "tilapia", "camaron", "jamon-pavo", "salchicha-pavo"] },
  { t: "Lácteos", ids: ["leche-light", "yogur-griego", "queso-panela", "queso-fresco", "queso-oaxaca", "crema"] },
  { t: "Leguminosas", ids: ["frijol-negro", "frijol-bayo", "lentejas", "garbanzos"] },
  { t: "Cereales y tubérculos", ids: ["tortilla-maiz", "tortilla-harina", "tostada-horneada", "pan-integral", "arroz-blanco", "avena", "pasta", "papa", "granola"] },
  { t: "Verduras", ids: ["jitomate", "cebolla", "nopales", "calabacita", "zanahoria", "espinaca", "champinones", "lechuga", "pepino", "aguacate"] },
  { t: "Frutas", ids: ["platano", "manzana", "papaya", "fresas"] },
  { t: "Otros", ids: ["crema-cacahuate", "cacahuates", "miel", "palomitas"] },
];
const POR_ID = new Map(ALIMENTOS.map((a) => [a.id, a]));

/** Cada toque cambia: neutral → me gusta → no lo como → neutral. */
export default function Gustos({ gustos, evitar, onCambio }: { gustos: string[]; evitar: string[]; onCambio: (g: string[], e: string[]) => void }) {
  const tocar = (id: string) => {
    if (gustos.includes(id)) onCambio(gustos.filter((x) => x !== id), [...evitar, id]);
    else if (evitar.includes(id)) onCambio(gustos, evitar.filter((x) => x !== id));
    else onCambio([...gustos, id], evitar);
  };
  return (
    <div>
      <p className="text-sm text-muted">Toca una vez lo que <b className="text-ink">te gusta</b>, dos veces lo que <b className="text-ember">no comes</b>. Brío lo usa para tu menú y tu lista del súper.</p>
      {GRUPOS.map((g) => (
        <div key={g.t} className="mt-4">
          <p className="lab mb-2">{g.t}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {g.ids.map((id) => {
              const a = POR_ID.get(id);
              if (!a) return null;
              const gusta = gustos.includes(id), no = evitar.includes(id);
              const foto = fotoDe(id);
              return (
                <button key={id} onClick={() => tocar(id)} aria-pressed={gusta}
                  className={`relative flex flex-col items-center gap-1 rounded-[14px] border p-2 text-center text-xs transition ${gusta ? "border-lime bg-lime/15 dark:bg-lime/10" : no ? "border-ember/60 bg-ember/10 text-muted" : "border-line bg-surface"}`}>
                  {foto ? <img src={foto} alt="" loading="lazy" className={`h-10 w-10 object-contain ${no ? "opacity-40 grayscale" : ""}`} /> : <span className="num grid h-10 w-10 place-items-center text-lg">{a.n.charAt(0)}</span>}
                  <span className={`leading-tight ${no ? "line-through" : ""}`}>{a.n.replace(/ \(.*\)| cocid[oa]s?| entero/g, "")}</span>
                  {gusta && <span className="absolute right-1.5 top-1 text-[11px] font-bold text-lime-ink">♥</span>}
                  {no && <span className="absolute right-1.5 top-1 text-[11px] font-bold text-ember">✕</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

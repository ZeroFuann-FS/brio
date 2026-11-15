import { ALIMENTOS } from "../data/alimentos";
import { fotoDe } from "../data/fotos";
import { GRUPOS_GUSTOS } from "../data/gustos";

const POR_ID = new Map(ALIMENTOS.map((a) => [a.id, a]));
/** Nombre corto para la tarjeta de gustos. */
export const nombreGusto = (n: string) => n.replace(/ \((en agua|en tomate|tortillería|paquete|lo cueces tú|sin empanizar|con más grasa|tilapia o basa|diezmillo o aguayón)\)/g, "").replace(/ \/ .*/, "");

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
      {GRUPOS_GUSTOS.map((g) => (
        <div key={g.t} className="mt-5">
          <p className="lab mb-2">{g.t}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {g.ids.map((id) => {
              const a = POR_ID.get(id);
              if (!a) return null;
              const gusta = gustos.includes(id), no = evitar.includes(id);
              const foto = fotoDe(id);
              return (
                <button key={id} onClick={() => tocar(id)} aria-pressed={gusta}
                  className={`relative flex flex-col items-center gap-1.5 rounded-[14px] border p-1.5 pb-2 text-center text-xs transition ${gusta ? "border-lime bg-lime/15 dark:bg-lime/10" : no ? "border-ember/60 bg-ember/10 text-muted" : "border-line bg-surface"}`}>
                  {foto
                    ? <img src={foto} alt="" loading="lazy" className={`aspect-square w-full rounded-[10px] bg-white object-cover ${no ? "opacity-40 grayscale" : ""}`} />
                    : <span className="num grid aspect-square w-full place-items-center rounded-[10px] bg-t-food text-lg">{a.n.charAt(0)}</span>}
                  <span className={`leading-tight ${no ? "line-through" : ""}`}>{nombreGusto(a.n)}</span>
                  {gusta && <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-lime text-[11px] font-bold text-on-lime">♥</span>}
                  {no && <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-ember text-[11px] font-bold text-white">✕</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

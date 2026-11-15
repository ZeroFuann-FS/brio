import { useState } from "react";
import { crearAlimento } from "../lib/comunidad";
import type { Alimento } from "../data/alimentos";
import { btnPrimario, btnSecundario, inputCls } from "./ui";

const n = (s: string) => Number(s.replace(",", "."));

/** Captura de un producto desde su etiqueta nutrimental. Se guarda para todos los usuarios de Brío. */
export default function CrearAlimento({ inicial, codigo, onCreado, onCancelar }: {
  inicial?: string; codigo?: string; onCreado: (a: Alimento) => void; onCancelar: () => void;
}) {
  const [f, setF] = useState({ nombre: inicial ?? "", marca: "", porcion_t: "porción", porcion_g: "", kcal: "", proteina: "", carbos: "", grasa: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const valido = f.nombre.trim().length >= 2 && n(f.porcion_g) > 0 && n(f.kcal) >= 0 && f.kcal !== "";

  const guardar = async () => {
    setGuardando(true); setError(null);
    try {
      onCreado(await crearAlimento({
        nombre: f.nombre, marca: f.marca, codigo, porcion_t: f.porcion_t, porcion_g: n(f.porcion_g),
        kcal: n(f.kcal), proteina: n(f.proteina || "0"), carbos: n(f.carbos || "0"), grasa: n(f.grasa || "0"),
      }));
    } catch (e) { setError((e as Error).message); setGuardando(false); }
  };

  return (
    <div>
      <p className="font-serif text-xl font-medium">Captúralo desde la etiqueta</p>
      <p className="mt-1 text-sm text-muted">Busca la tabla "Información nutrimental" del empaque. Lo guardamos para que a ti y a otros les aparezca la próxima vez.</p>
      {codigo && <p className="lab mt-2">Código de barras: {codigo}</p>}

      <div className="mt-4 space-y-3">
        <input className={inputCls} placeholder="Nombre. Ej. Atún en agua" value={f.nombre} onChange={set("nombre")} maxLength={80} />
        <input className={inputCls} placeholder="Marca. Ej. Mar Alta" value={f.marca} onChange={set("marca")} maxLength={60} />
        <div>
          <p className="lab mb-1.5">Tamaño de la porción (como dice la etiqueta)</p>
          <div className="grid grid-cols-[1fr_110px] gap-2">
            <input className={inputCls} placeholder="Ej. 1 lata, 2 rebanadas" value={f.porcion_t} onChange={set("porcion_t")} maxLength={40} />
            <div className="relative">
              <input className={`${inputCls} num pr-8 text-lg`} inputMode="decimal" placeholder="100" value={f.porcion_g} onChange={set("porcion_g")} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">g</span>
            </div>
          </div>
        </div>
        <div>
          <p className="lab mb-1.5">Por porción</p>
          <div className="grid grid-cols-2 gap-2">
            <input className={`${inputCls} num text-lg`} inputMode="decimal" placeholder="kcal" value={f.kcal} onChange={set("kcal")} />
            <input className={`${inputCls} num text-lg`} inputMode="decimal" placeholder="Proteína g" value={f.proteina} onChange={set("proteina")} />
            <input className={`${inputCls} num text-lg`} inputMode="decimal" placeholder="Carbos g" value={f.carbos} onChange={set("carbos")} />
            <input className={`${inputCls} num text-lg`} inputMode="decimal" placeholder="Grasa g" value={f.grasa} onChange={set("grasa")} />
          </div>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-ember">{error}</p>}
      <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
        <button onClick={onCancelar} className={btnSecundario}>Cancelar</button>
        <button onClick={guardar} disabled={!valido || guardando} className={btnPrimario}>{guardando ? "Guardando…" : "Guardar alimento"}</button>
      </div>
    </div>
  );
}

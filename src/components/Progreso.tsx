import { useState } from "react";
import type { Metas, Perfil } from "../lib/calc";
import Peso from "./Peso";
import MetasCrecimiento from "./progreso/Metas";
import ResumenSemana from "./progreso/ResumenSemana";

type Vista = "resumen" | "metas" | "cuerpo";
const VISTAS: { id: Vista; t: string }[] = [{ id: "resumen", t: "Resumen" }, { id: "metas", t: "Metas" }, { id: "cuerpo", t: "Cuerpo" }];

export default function Progreso({ perfil, metas, actual }: { perfil: Perfil; metas: Metas; actual: number }) {
  const [vista, setVista] = useState<Vista>("resumen");
  return (
    <div>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Progreso</h1>
      <p className="mt-1.5 text-muted">Tu semana, tus metas y tu cuerpo.</p>
      <div className="mt-4 flex max-w-md gap-1 rounded-[14px] border border-line bg-surface p-1">
        {VISTAS.map((v) => (
          <button key={v.id} onClick={() => setVista(v.id)} aria-pressed={vista === v.id}
            className={`h-10 flex-1 rounded-[10px] font-display text-sm font-semibold uppercase tracking-[0.08em] transition ${vista === v.id ? "bg-ink text-bg dark:bg-lime dark:text-on-lime" : "text-muted"}`}>{v.t}</button>
        ))}
      </div>
      <div className="mt-5">
        {vista === "resumen" && <ResumenSemana perfil={perfil} metas={metas} />}
        {vista === "metas" && <MetasCrecimiento perfil={perfil} />}
        {vista === "cuerpo" && <Peso perfil={perfil} metas={metas} actual={actual} sinTitulo />}
      </div>
    </div>
  );
}

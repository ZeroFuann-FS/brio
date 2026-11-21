import { useState } from "react";
import type { Metas, Perfil } from "../lib/calc";
import Peso from "./Peso";
import MetasCrecimiento from "./progreso/Metas";
import ResumenSemana from "./progreso/ResumenSemana";
import { BarraPestanas, PanelPestana, type Pestana } from "./Pestanas";

type Vista = "resumen" | "metas" | "cuerpo";
const VISTAS: Pestana<Vista>[] = [{ id: "resumen", t: "Resumen" }, { id: "metas", t: "Metas" }, { id: "cuerpo", t: "Cuerpo" }];

export default function Progreso({ perfil, metas, actual }: { perfil: Perfil; metas: Metas; actual: number }) {
  const [vista, setVista] = useState<Vista>("resumen");
  return (
    <div>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Progreso</h1>
      <p className="mt-1.5 text-muted">Tu semana, tus metas y tu cuerpo.</p>
      <BarraPestanas pestanas={VISTAS} actual={vista} onCambiar={setVista} grupo="progreso" tour="progreso-tabs" />
      <PanelPestana pestanas={VISTAS} actual={vista} grupo="progreso">
        {vista === "resumen" && <ResumenSemana perfil={perfil} metas={metas} />}
        {vista === "metas" && <MetasCrecimiento perfil={perfil} />}
        {vista === "cuerpo" && <Peso perfil={perfil} metas={metas} actual={actual} sinTitulo />}
      </PanelPestana>
    </div>
  );
}

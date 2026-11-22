import { useEffect, useState } from "react";
import type { Metas, Perfil } from "../lib/calc";
import { useBrio } from "../lib/store";
import ComidasDia from "./ComidasDia";
import Despensa from "./Despensa";
import MenuSemanal from "./MenuSemanal";
import Recetas from "./Recetas";
import { TarjetaPlan } from "./PlanNutriologo";
import { BarraPestanas, PanelPestana, type Pestana } from "./Pestanas";

type Vista = "hoy" | "menu" | "recetas" | "despensa";
/** Evento para saltar a "Hoy" desde otra pestaña (por ejemplo, el menú al registrar una comida). */
export const VER_COMIDAS_HOY = "brio:ver-comidas-hoy";

export default function Comida({ perfil, metas }: { perfil: Perfil; metas: Metas }) {
  const [vista, setVista] = useState<Vista>("hoy");
  const acabando = useBrio((s) => s.despensa.some((i) => i.minimo != null && i.cantidad <= i.minimo));
  const vistas: Pestana<Vista>[] = [
    { id: "hoy", t: "Hoy" }, { id: "menu", t: "Menú" }, { id: "recetas", t: "Recetas" },
    { id: "despensa", t: "Despensa", aviso: acabando },
  ];

  useEffect(() => {
    const ir = () => { setVista("hoy"); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" })); };
    window.addEventListener(VER_COMIDAS_HOY, ir);
    return () => window.removeEventListener(VER_COMIDAS_HOY, ir);
  }, []);

  return (
    <div>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Comida</h1>
      <p className="mt-1.5 text-muted">Lo que comes hoy, tu menú, recetas y lo que tienes en casa.</p>
      <BarraPestanas pestanas={vistas} actual={vista} onCambiar={setVista} grupo="comida" tour="comida-tabs" />
      <PanelPestana pestanas={vistas} actual={vista} grupo="comida">
        {vista === "hoy" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
            <div id="comidas-dia" data-tour="comidas-hoy" className="min-w-0 scroll-mt-4 md:col-span-7"><ComidasDia /></div>
            <div className="min-w-0 md:col-span-5"><TarjetaPlan perfil={perfil} metas={metas} enComida delay={0.04} /></div>
          </div>
        )}
        {vista === "menu" && <div className="max-w-3xl lg:max-w-none"><MenuSemanal perfil={perfil} metas={metas} /></div>}
        {vista === "recetas" && <Recetas />}
        {vista === "despensa" && <div className="max-w-2xl lg:max-w-none"><Despensa /></div>}
      </PanelPestana>
    </div>
  );
}

import type { Metas, Perfil } from "../lib/calc";
import ComidasDia from "./ComidasDia";
import Despensa from "./Despensa";
import MenuSemanal from "./MenuSemanal";
import Recetas from "./Recetas";

export default function Comida({ perfil, metas }: { perfil: Perfil; metas: Metas }) {
  return (
    <div>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Comida</h1>
      <p className="mt-1.5 text-muted">Lo que comes hoy, tu menú, recetas y lo que tienes en casa.</p>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
        <div className="min-w-0 space-y-3 md:col-span-7">
          <div id="comidas-dia" className="scroll-mt-4"><ComidasDia /></div>
          <MenuSemanal perfil={perfil} metas={metas} />
        </div>
        <div className="min-w-0 md:col-span-5"><Despensa /></div>
      </div>
      <Recetas />
    </div>
  );
}

import type { Metas, Perfil } from "../lib/calc";
import ComidasDia from "./ComidasDia";
import Despensa from "./Despensa";
import MenuSemanal from "./MenuSemanal";

export default function Comida({ perfil, metas }: { perfil: Perfil; metas: Metas }) {
  return (
    <div>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Comida</h1>
      <p className="mt-1.5 text-muted">Lo que comes hoy, tu menú de la semana y lo que tienes en casa.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-12 md:gap-4">
        <div className="space-y-3 md:col-span-7">
          <ComidasDia />
          <MenuSemanal perfil={perfil} metas={metas} />
        </div>
        <div className="md:col-span-5"><Despensa /></div>
      </div>
    </div>
  );
}

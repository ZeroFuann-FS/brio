import ComidasDia from "./ComidasDia";
import Despensa from "./Despensa";
import { Tarjeta } from "./ui";

export default function Comida() {
  return (
    <div>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Comida</h1>
      <p className="mt-1.5 text-muted">Lo que comes hoy y lo que tienes en casa.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-12 md:gap-4">
        <div className="space-y-3 md:col-span-7">
          <ComidasDia />
          <Tarjeta tono="food" delay={0.05}>
            <p className="lab">Próximamente</p>
            <h2 className="mt-1 font-serif text-xl font-medium">Tu menú de la semana</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Brío armará tu menú usando primero lo que tienes en tu despensa, dentro de tu presupuesto, con recetas y tu lista del súper.
            </p>
          </Tarjeta>
        </div>
        <div className="md:col-span-5"><Despensa /></div>
      </div>
    </div>
  );
}

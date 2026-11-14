import { motion } from "motion/react";
import { Tarjeta, ease } from "./ui";

const VIENE = [
  { t: "Tus rutinas", d: "Arma tus días de entreno o usa una plantilla." },
  { t: "Series y peso", d: "Registra cada serie en segundos y copia la sesión anterior." },
  { t: "Ejercicios con imagen", d: "Cómo se hace cada ejercicio y qué músculos trabaja." },
  { t: "Mapa muscular", d: "Ve qué zonas entrenaste en la semana." },
  { t: "Récords", d: "Brío te avisa cuando superas tu mejor marca." },
];

export default function Entreno() {
  return (
    <div>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Entreno</h1>
      <p className="mt-1.5 text-muted">Tu gym en Brío. Estamos construyéndolo.</p>
      <Tarjeta tono="habit" className="mt-5 md:max-w-2xl">
        <p className="lab">Próximamente</p>
        <ul className="mt-2">
          {VIENE.map((v, i) => (
            <motion.li
              key={v.t}
              className="grid grid-cols-[36px_1fr] gap-2 border-b border-line py-3 last:border-b-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07, ease }}
            >
              <span className="num text-xl text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span><b className="font-medium">{v.t}</b><span className="block text-sm text-muted">{v.d}</span></span>
            </motion.li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  );
}

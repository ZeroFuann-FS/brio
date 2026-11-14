import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useBrio } from "../lib/store";
import { Tarjeta, btnPrimario, inputCls } from "./ui";

const SUGERENCIAS: { n: string; u: string }[] = [
  { n: "Huevo", u: "pzas" },
  { n: "Atún en lata", u: "latas" },
  { n: "Pan integral", u: "rebanadas" },
  { n: "Tostadas", u: "pzas" },
  { n: "Pechuga de pollo", u: "g" },
  { n: "Aguacate", u: "pzas" },
  { n: "Jitomate", u: "pzas" },
  { n: "Papa", u: "pzas" },
  { n: "Avena", u: "g" },
  { n: "Café", u: "frasco" },
];

const inicial = (nombre: string) => nombre.trim().charAt(0).toUpperCase();
const paso = (u: string) => (u === "g" ? 50 : 1);

export default function Despensa() {
  const despensa = useBrio((s) => s.despensa);
  const { addItem, cambiarCantidad, removeItem } = useBrio();
  const [f, setF] = useState({ nombre: "", cantidad: "", unidad: "pzas" });

  const agregar = (nombre: string, cantidad: number, unidad: string) => {
    if (!nombre.trim() || !(cantidad > 0)) return;
    addItem({ nombre: nombre.trim(), cantidad, unidad });
  };

  const conStock = despensa.filter((i) => i.cantidad > 0);
  const agotados = despensa.filter((i) => i.cantidad === 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl font-medium">Despensa</h2>
        <p className="mt-1 text-muted">Lo que tienes en casa. Brío lo usa primero al armar tu menú y tu lista del súper.</p>
      </div>

      <Tarjeta>
        <form
          className="space-y-2"
          onSubmit={(e) => { e.preventDefault(); agregar(f.nombre, Number(f.cantidad), f.unidad); setF({ nombre: "", cantidad: "", unidad: f.unidad }); }}
        >
          <input className={inputCls} placeholder="¿Qué tienes? Ej. Atún en lata" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} maxLength={40} />
          <div className="flex gap-2">
            <input className={`${inputCls} w-24`} inputMode="decimal" placeholder="Cant." value={f.cantidad} onChange={(e) => setF({ ...f, cantidad: e.target.value })} />
            <select className={inputCls} value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })}>
              {["pzas", "latas", "rebanadas", "g", "kg", "L", "paquete", "frasco"].map((u) => <option key={u}>{u}</option>)}
            </select>
            <button type="submit" className={btnPrimario} disabled={!f.nombre.trim() || !f.cantidad}>+</button>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGERENCIAS.filter((s) => !despensa.some((i) => i.nombre.toLowerCase() === s.n.toLowerCase())).map((s) => (
            <button key={s.n} onClick={() => setF({ nombre: s.n, cantidad: "", unidad: s.u })} className="rounded-full border border-line bg-bg px-3 py-1.5 text-sm hover:border-lime">
              {s.n}
            </button>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta delay={0.05}>
        <h2 className="font-serif text-xl font-medium">En casa <span className="text-sm font-normal text-muted">· {conStock.length}</span></h2>
        <ul className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {conStock.map((i) => (
              <motion.li key={i.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 rounded-2xl bg-bg px-3 py-2.5">
                <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-t-food text-lg">{inicial(i.nombre)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.nombre}</p>
                  <p className="text-xs text-muted">{i.cantidad} {i.unidad}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => cambiarCantidad(i.id, -paso(i.unidad))} className="grid h-9 w-9 place-items-center rounded-xl border border-line text-lg" aria-label={`Quitar ${i.nombre}`}>−</button>
                  <button onClick={() => cambiarCantidad(i.id, paso(i.unidad))} className="grid h-9 w-9 place-items-center rounded-xl border border-line text-lg" aria-label={`Agregar ${i.nombre}`}>+</button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
          {!conStock.length && <p className="py-2 text-sm text-muted">Tu despensa está vacía. Agrega lo que te quedó de tus compras.</p>}
        </ul>
      </Tarjeta>

      {agotados.length > 0 && (
        <Tarjeta delay={0.1}>
          <h2 className="font-serif text-xl font-medium">Se acabó · para tu lista</h2>
          <ul className="mt-3 space-y-2">
            {agotados.map((i) => (
              <li key={i.id} className="flex items-center justify-between rounded-2xl bg-bg px-3 py-2.5">
                <span className="text-muted line-through">{i.nombre}</span>
                <span className="flex gap-3 text-sm">
                  <button onClick={() => cambiarCantidad(i.id, paso(i.unidad))} className="text-lime-ink">Lo compré</button>
                  <button onClick={() => removeItem(i.id)} className="text-muted hover:text-ember">Quitar</button>
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      <p className="px-2 text-center text-xs text-muted">Próximamente: Brío arma tu menú de la semana usando primero lo que hay aquí, y te da la lista del súper dentro de tu presupuesto.</p>
    </div>
  );
}

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { hoyISO, type Metas, type Perfil, type PrefsComida } from "../lib/calc";
import { useBrio } from "../lib/store";
import { useSync } from "../lib/sync";
import { generarMenu, ErrorIA, useIA } from "../lib/ia";
import { Tarjeta, Toast, btnPrimario, btnSecundario, ease, inputCls, useToast } from "./ui";

const EQUIPO = ["Estufa", "Microondas", "Air fryer", "Horno", "Refrigerador", "Licuadora"];
const COMIDAS = ["Desayuno", "Comida", "Cena", "Snack"];
const DIAS_CORTOS: Record<string, string> = { lunes: "Lun", martes: "Mar", miércoles: "Mié", miercoles: "Mié", jueves: "Jue", viernes: "Vie", sábado: "Sáb", sabado: "Sáb", domingo: "Dom" };
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const PREFS_BASE: PrefsComida = { presupuesto: 500, comidas: ["Desayuno", "Comida", "Cena"], equipo: ["Estufa", "Microondas"], preferencias: "" };
const dinero = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`;

function Chip({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${on ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>
      {children}
    </button>
  );
}

export default function MenuSemanal({ perfil, metas }: { perfil: Perfil; metas: Metas }) {
  const { menu, setMenu, marcarComprado, setPrefsComida, despensa, addComida, addItem } = useBrio();
  const conCuenta = useSync((s) => s.estado) !== "sin-cuenta";
  const iaEst = useIA();
  const [prefs, setPrefs] = useState<PrefsComida>(perfil.prefsComida ?? PREFS_BASE);
  const [editando, setEditando] = useState(!menu);
  const [estado, setEstado] = useState<"idle" | "pensando" | "error">("idle");
  const [error, setError] = useState("");
  const [dia, setDia] = useState(0);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [toast, setToast] = useToast();

  const toggle = (k: "comidas" | "equipo", v: string) =>
    setPrefs((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));

  const generar = async () => {
    setPrefsComida(prefs);
    setEstado("pensando");
    try {
      const enCasa = despensa.filter((i) => i.cantidad > 0).map((i) => `${i.nombre} (${i.cantidad} ${i.unidad})`).join(", ");
      const equipo = prefs.equipo.includes("Refrigerador") ? prefs.equipo.join(", ") : `${prefs.equipo.join(", ")}. NO tengo refrigerador`;
      const r = await generarMenu({
        dias: 7, inicio: DIAS[new Date().getDay()], kcal: metas.kcal, proteina: metas.proteina,
        comidas: prefs.comidas.join(", ").toLowerCase(), presupuesto: prefs.presupuesto, equipo,
        preferencias: prefs.preferencias || "ninguna", despensa: enCasa || "nada",
      });
      setMenu({ creado: hoyISO(), menu: r, comprado: [] });
      setDia(0); setEditando(false); setEstado("idle");
    } catch (e) {
      setError(e instanceof ErrorIA ? e.message : "Algo salió mal. Intenta de nuevo.");
      setEstado("error");
    }
  };

  const pasarADespensa = () => {
    if (!menu) return;
    let n = 0;
    for (const it of menu.menu.lista_super) {
      if (!menu.comprado.includes(it.producto)) continue;
      const m = it.cantidad.match(/^([\d.,]+)\s*(.*)$/);
      addItem({ nombre: it.producto, cantidad: m ? Number(m[1].replace(",", ".")) || 1 : 1, unidad: (m?.[2] || "pzas").slice(0, 12) });
      n++;
    }
    setMenu({ ...menu, comprado: [] });
    setToast(n ? `${n} productos agregados a tu despensa` : "Marca primero lo que compraste");
  };

  if (!iaEst.disponible) {
    return (
      <Tarjeta tono="food">
        <p className="lab">Menú semanal con IA</p>
        <h2 className="mt-1 font-serif text-xl font-medium">Tu menú de la semana</h2>
        <p className="mt-1.5 text-sm text-muted">Conecta tu propia IA de Claude en Perfil y Brío armará tu menú usando primero lo que tienes en tu despensa, dentro de tu presupuesto, con recetas y tu lista del súper.</p>
      </Tarjeta>
    );
  }

  if (iaEst.requiereCuenta && !conCuenta) {
    return (
      <Tarjeta tono="food">
        <p className="lab">Menú semanal con IA</p>
        <h2 className="mt-1 font-serif text-xl font-medium">Tu menú de la semana</h2>
        <p className="mt-1.5 text-sm text-muted">Crea tu cuenta gratis en Perfil y Brío armará tu menú usando primero lo que tienes en casa, dentro de tu presupuesto.</p>
      </Tarjeta>
    );
  }

  /* ---------- Formulario ---------- */
  if (editando || !menu) {
    return (
      <Tarjeta tono="food">
        <p className="lab">Menú semanal con IA</p>
        <h2 className="mt-1 font-serif text-xl font-medium">Arma tu menú de la semana</h2>
        <p className="mt-1 text-sm text-muted">Con tu meta de {metas.kcal.toLocaleString("es-MX")} kcal y {metas.proteina} g de proteína. Usa primero lo que tienes en tu despensa ({despensa.filter((i) => i.cantidad > 0).length} productos).</p>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="lab mb-1.5 block">Presupuesto para el súper (semana)</span>
            <div className="relative">
              <span className="num pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted">$</span>
              <input className={`${inputCls} num h-[54px] pl-8 text-2xl`} inputMode="numeric" value={prefs.presupuesto || ""}
                onChange={(e) => setPrefs((p) => ({ ...p, presupuesto: Number(e.target.value.replace(/\D/g, "")) }))} />
            </div>
          </label>
          <div>
            <p className="lab mb-2">Comidas al día</p>
            <div className="flex flex-wrap gap-2">{COMIDAS.map((c) => <Chip key={c} on={prefs.comidas.includes(c)} onClick={() => toggle("comidas", c)}>{c}</Chip>)}</div>
          </div>
          <div>
            <p className="lab mb-2">¿Con qué cocinas?</p>
            <div className="flex flex-wrap gap-2">{EQUIPO.map((c) => <Chip key={c} on={prefs.equipo.includes(c)} onClick={() => toggle("equipo", c)}>{c}</Chip>)}</div>
            {!prefs.equipo.includes("Refrigerador") && <p className="mt-2 text-xs text-muted">Sin refri: Brío evitará guardar carne o pollo cocinado para otro día.</p>}
          </div>
          <label className="block">
            <span className="lab mb-1.5 block">Gustos o alimentos que no comes (opcional)</span>
            <input className={inputCls} placeholder="Ej. no me gusta el brócoli, me encanta el atún" maxLength={300} value={prefs.preferencias}
              onChange={(e) => setPrefs((p) => ({ ...p, preferencias: e.target.value }))} />
          </label>
        </div>

        {estado === "pensando" ? (
          <div className="mt-5">
            <div className="grid grid-cols-7 gap-1.5">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <motion.div key={i} className="num grid h-11 place-items-center rounded-[10px] border border-line bg-surface text-muted"
                  animate={{ backgroundColor: ["var(--surface)", "var(--lime)", "var(--surface)"], color: ["var(--muted)", "var(--on-lime)", "var(--muted)"] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}>{d}</motion.div>
              ))}
            </div>
            <p className="mt-3 text-center text-sm text-muted">Armando tu semana… tarda alrededor de un minuto.</p>
          </div>
        ) : (
          <div className="mt-5 flex gap-2">
            {menu && <button onClick={() => setEditando(false)} className={btnSecundario}>Cancelar</button>}
            <button onClick={generar} disabled={!prefs.comidas.length || !prefs.equipo.length || prefs.presupuesto < 50} className={`${btnPrimario} flex-1`}>
              {menu ? "Generar nuevo menú" : "Generar mi menú"}
            </button>
          </div>
        )}
        {estado === "error" && <p className="mt-3 text-sm text-ember">{error}</p>}
      </Tarjeta>
    );
  }

  /* ---------- Menú ---------- */
  const m = menu.menu;
  const d = m.dias[Math.min(dia, m.dias.length - 1)];
  const kcalDia = d.platillos.reduce((a, p) => a + p.kcal, 0);
  const protDia = d.platillos.reduce((a, p) => a + p.proteina, 0);

  return (
    <>
      <Tarjeta tono="food">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-medium">Tu menú de la semana</h2>
          <button onClick={() => setEditando(true)} className="lab !text-lime-ink hover:underline">Cambiar</button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {m.dias.map((x, i) => (
            <button key={i} onClick={() => { setDia(i); setAbierto(null); }} aria-pressed={i === dia}
              className={`num h-11 rounded-[10px] border text-[15px] uppercase transition ${i === dia ? "border-ink bg-ink text-bg dark:border-lime dark:bg-lime dark:text-on-lime" : "border-line bg-surface text-muted"}`}>
              {DIAS_CORTOS[x.dia.toLowerCase()] ?? x.dia.slice(0, 3)}
            </button>
          ))}
        </div>

        <div className="mt-3 flex justify-between"><span className="lab first-letter:uppercase">{d.dia}</span><span className="lab">{kcalDia.toLocaleString("es-MX")} kcal · {protDia} g proteína</span></div>

        <AnimatePresence mode="wait">
          <motion.ul key={dia} className="mt-1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2, ease }}>
            {d.platillos.map((p, i) => {
              const id = `${dia}-${i}`;
              const open = abierto === id;
              return (
                <li key={id} className="border-b border-line last:border-b-0">
                  <button onClick={() => setAbierto(open ? null : id)} className="grid w-full grid-cols-[72px_1fr_auto] items-center gap-2 py-3 text-left">
                    <span className="lab !tracking-[0.08em]">{p.tipo}</span>
                    <span className="font-medium">{p.nombre}</span>
                    <span className="num text-[17px]">{p.kcal}</span>
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pb-3 pl-[80px] text-sm">
                          <p className="lab mb-1">Ingredientes</p>
                          <ul className="list-disc pl-4 text-ink/90">{p.ingredientes.map((x, j) => <li key={j}>{x}</li>)}</ul>
                          <p className="lab mb-1 mt-2">Cómo se hace</p>
                          <p className="leading-relaxed text-ink/90">{p.preparacion}</p>
                          {p.usa_despensa.length > 0 && <p className="mt-2 text-xs text-lime-ink">De tu despensa: {p.usa_despensa.join(", ")}</p>}
                          <button
                            onClick={() => { addComida(hoyISO(), { nombre: p.nombre, kcal: p.kcal, proteina: p.proteina, tipo: p.tipo }); setToast(`${p.nombre} registrado hoy`); }}
                            className={`${btnSecundario} mt-3 h-10 text-sm`}>
                            Registrar hoy
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </Tarjeta>

      <Tarjeta delay={0.05}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-medium">Lista del súper</h2>
          <span className={`num text-xl ${m.total_estimado > prefs.presupuesto ? "text-ember" : ""}`}>
            {dinero(m.total_estimado)}<small className="text-sm font-medium text-muted"> / {dinero(prefs.presupuesto)}</small>
          </span>
        </div>
        <ul className="mt-2">
          {m.lista_super.map((it) => {
            const ok = menu.comprado.includes(it.producto);
            return (
              <li key={it.producto} className="border-b border-line last:border-b-0">
                <button onClick={() => marcarComprado(it.producto)} className="grid w-full grid-cols-[22px_1fr_auto] items-center gap-3 py-2.5 text-left">
                  <span className={`grid h-[22px] w-[22px] place-items-center rounded-[7px] border-[1.5px] text-[13px] font-extrabold ${ok ? "border-lime bg-lime text-on-lime" : "border-line-strong"}`}>{ok ? "✓" : ""}</span>
                  <span className={ok ? "text-muted line-through" : ""}>{it.producto} <span className="text-muted">· {it.cantidad}</span><span className="lab mt-0.5 block !tracking-[0.06em]">{it.donde}</span></span>
                  <span className="num text-[17px]">{dinero(it.precio_estimado)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button onClick={pasarADespensa} className={`${btnSecundario} mt-3 w-full`}>Pasar lo comprado a mi despensa</button>
        <p className="mt-2 text-xs text-muted">Precios estimados; pueden variar según la tienda.</p>
      </Tarjeta>

      {m.consejos.length > 0 && (
        <Tarjeta delay={0.1} tono="habit">
          <h2 className="font-serif text-xl font-medium">Consejos para esta semana</h2>
          <ul className="mt-2">{m.consejos.map((c, i) => <li key={i} className="border-b border-line py-2.5 text-sm leading-relaxed last:border-b-0">{c}</li>)}</ul>
        </Tarjeta>
      )}
      <Toast texto={toast} />
    </>
  );
}

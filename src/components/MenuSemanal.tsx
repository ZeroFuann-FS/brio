import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { tienePlanMenu, type Metas, type Perfil, type PrefsComida, type QuienCocina } from "../lib/calc";
import { configurarRecetas, etiquetas, nutricion, recetaPorId, type Receta, type TipoReceta, resumenAjustes } from "../data/recetas";
import { opcionesCambio as calcularOpciones, generarMenuReglas, kcalCasa, recetaDeComida, listaSuper, polloDelDia, quienCocina, reemplazarComida, textoPechugas, totalesDia, unidadDespensa, type OpcionesMenu } from "../lib/menu";
import { useBrio } from "../lib/store";
import Gustos from "./Gustos";
import RecetaDetalle, { MiniReceta, useRegistrarReceta } from "./RecetaDetalle";
import { Hoja, Tarjeta, Toast, btnPrimario, btnSecundario, ease, inputCls, useToast, chipOn } from "./ui";
import { VER_COMIDAS_HOY } from "./Comida";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
/** Nombre del día de hoy en el formato del menú ("Miércoles"). */
const hoyNombre = () => DIAS[(new Date().getDay() + 6) % 7];
/** Índice del día de hoy en el menú; si hoy no tiene menú, el siguiente que sí. */
const indiceHoy = (dias: { dia: string }[]) => {
  const h = DIAS.indexOf(hoyNombre());
  for (let k = 0; k < 7; k++) { const i = dias.findIndex((x) => x.dia === DIAS[(h + k) % 7]); if (i !== -1) return i; }
  return 0;
};
const CORTO: Record<string, string> = { Lunes: "Lun", Martes: "Mar", Miércoles: "Mié", Jueves: "Jue", Viernes: "Vie", Sábado: "Sáb", Domingo: "Dom" };
const COMIDAS: { id: TipoReceta; t: string }[] = [{ id: "desayuno", t: "Desayuno" }, { id: "comida", t: "Comida" }, { id: "cena", t: "Cena" }];
const EQUIPO = ["Estufa", "Microondas", "Air fryer", "Horno", "Licuadora", "Refrigerador"];
const NOMBRE_TIPO: Record<TipoReceta, string> = { desayuno: "Desayuno", comida: "Comida", cena: "Cena", colacion: "Colación" };
const BASE: PrefsComida = { presupuesto: 500, comidas: ["desayuno", "comida", "cena"], equipo: ["Estufa", "Microondas", "Refrigerador"], preferencias: "", colaciones: 1, dias: DIAS.slice(0, 7), gustos: [], evitar: [] };
const SIGUIENTE: Record<QuienCocina, QuienCocina> = { yo: "casa", casa: "no", no: "yo" };
const CELDA: Record<QuienCocina, { t: string; cls: string }> = {
  yo: { t: "Yo", cls: "border-line bg-surface font-semibold text-ink" },
  casa: { t: "Casa", cls: "border-water/60 bg-t-water text-ink" },
  no: { t: "—", cls: "border-dashed border-line bg-transparent text-muted" },
};
const dinero = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`;
const CUARTO: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾" };
const cant = (n: number) => { const e = Math.floor(n), r = Math.round((n - e) * 4) / 4; return r && CUARTO[r] ? `${e || ""}${CUARTO[r]}` : String(Math.round(n)); };
/** Qué tomar con cada comida para que no sea solo el plato (bebidas sin azúcar, casi sin calorías). */
const BEBIDA: Record<TipoReceta, string | null> = {
  desayuno: "Acompaña con café o té sin azúcar (o con canela).",
  comida: "Acompaña con agua natural, de jamaica o de limón sin azúcar.",
  cena: "Acompaña con un té de manzanilla, canela o hierbabuena.",
  colacion: null,
};

function Chip({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${on ? chipOn : "border-line bg-surface text-muted"}`}>
      {children}
    </button>
  );
}

export default function MenuSemanal({ perfil, metas }: { perfil: Perfil; metas: Metas }) {
  const { menu, setMenu, marcarComprado, setPrefsComida, despensa, addItem } = useBrio();
  const prefsGuardadas: PrefsComida = { ...BASE, ...(perfil.prefsComida ?? {}) };
  if (!["desayuno", "comida", "cena"].some((c) => prefsGuardadas.comidas.includes(c))) prefsGuardadas.comidas = BASE.comidas;
  const [p, setP] = useState<PrefsComida>(prefsGuardadas);
  const menuValido = menu && Array.isArray(menu.dias) ? menu : null;
  const [editando, setEditando] = useState(!menuValido);
  const [gustosAbierto, setGustosAbierto] = useState(false);
  const [dia, setDia] = useState(() => (menuValido ? indiceHoy(menuValido.dias) : 0));
  const [receta, setReceta] = useState<{ r: Receta; factor: number; ci: number; di: number } | null>(null);
  const [cambio, setCambio] = useState<{ ci: number; n: number } | null>(null);
  const [buscar, setBuscar] = useState("");
  const [verMas, setVerMas] = useState<{ otros: number; evitados: number }>({ otros: 6, evitados: 6 });
  const [toast, setToast] = useToast();
  const registrar = useRegistrarReceta();

  const opciones = (): OpcionesMenu => ({
    dias: p.dias ?? DIAS, comidas: p.comidas as TipoReceta[], colaciones: p.colaciones ?? 0, kcal: metas.kcal, proteina: metas.proteina,
    presupuesto: p.presupuesto, equipo: p.equipo, gustos: p.gustos ?? [], evitar: p.evitar ?? [], favoritas: perfil.prefsComida?.favoritas ?? [], despensa, horario: p.horario,
  });
  const cambiarCelda = (dia: string, tipo: TipoReceta) => setP((x) => {
    const actual = quienCocina(x, dia, tipo);
    return { ...x, horario: { ...(x.horario ?? {}), [dia]: { ...(x.horario?.[dia] ?? {}), [tipo]: SIGUIENTE[actual] } } };
  });
  const toggle = (k: "comidas" | "equipo" | "dias", v: string) => setP((x) => {
    const lista = (x[k] ?? []) as string[];
    const nueva = lista.includes(v) ? lista.filter((y) => y !== v) : [...lista, v];
    return { ...x, [k]: k === "dias" ? DIAS.filter((d) => nueva.includes(d)) : nueva };
  });

  const generar = () => {
    setPrefsComida({ ...p, favoritas: perfil.prefsComida?.favoritas });
    configurarRecetas({ sinAceite: p.sinAceite });
    const nuevo = generarMenuReglas(opciones());
    setMenu(nuevo);
    setDia(indiceHoy(nuevo.dias)); setEditando(false);
  };

  /* ---------- Configuración ---------- */
  if (editando || !menuValido) {
    const nGustos = (p.gustos ?? []).length, nEvitar = (p.evitar ?? []).length;
    return (
      <>
        <Tarjeta tono="food" tour="menu">
          <p className="lab">Menú semanal</p>
          <h2 className="mt-1 font-serif text-xl font-medium">Arma tu menú</h2>
          {tienePlanMenu(perfil.plan) && <p className="mt-1 rounded-[10px] bg-surface px-3 py-2 text-xs text-muted">Ya sigues el menú de tu nutriólogo. Usa este solo si quieres ideas para días libres.</p>}
          <p className="mt-1 text-sm text-muted">Con tu meta de {metas.kcal.toLocaleString("es-MX")} kcal y {metas.proteina} g de proteína. Brío elige recetas que te gustan, usa primero tu despensa y ajusta las porciones.</p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="lab mb-2">¿Qué días?</p>
              <div className="grid grid-cols-7 gap-1.5">
                {DIAS.map((d) => {
                  const on = (p.dias ?? []).includes(d);
                  return <button key={d} onClick={() => toggle("dias", d)} aria-pressed={on}
                    className={`num h-11 rounded-[10px] border text-[15px] uppercase transition ${on ? chipOn : "border-line bg-surface text-muted"}`}>{CORTO[d]}</button>;
                })}
              </div>
            </div>
            <div>
              <p className="lab mb-2">Comidas</p>
              <div className="flex flex-wrap gap-2">{COMIDAS.map((c) => <Chip key={c.id} on={p.comidas.includes(c.id)} onClick={() => toggle("comidas", c.id)}>{c.t}</Chip>)}</div>
            </div>
            <div>
              <p className="lab mb-2">Colaciones al día</p>
              <div className="flex gap-2">{[0, 1, 2].map((n) => <Chip key={n} on={(p.colaciones ?? 0) === n} onClick={() => setP((x) => ({ ...x, colaciones: n }))}>{n === 0 ? "Ninguna" : String(n)}</Chip>)}</div>
            </div>
            {(p.dias ?? []).length > 0 && p.comidas.length > 0 && (() => {
              const cols: TipoReceta[] = [...COMIDAS.map((c) => c.id).filter((c) => p.comidas.includes(c)), ...((p.colaciones ?? 0) > 0 ? ["colacion" as TipoReceta] : [])];
              return (
                <div>
                  <p className="lab mb-1">¿Quién cocina?</p>
                  <p className="mb-2 text-xs text-muted">Toca para cambiar: <b className="text-ink">Yo</b> = Brío te da receta y compras · <b className="text-ink">Casa</b> = comes lo que hacen en casa o fuera · <b className="text-ink">—</b> = no la haces.</p>
                  <div className="grid gap-1" style={{ gridTemplateColumns: `44px repeat(${cols.length}, minmax(0, 1fr))` }}>
                    <span />
                    {cols.map((c) => <span key={c} className="lab truncate text-center !text-[11px]">{NOMBRE_TIPO[c]}</span>)}
                    {(p.dias ?? []).map((d) => (
                      <div key={d} className="contents">
                        <span className="num self-center text-[15px] uppercase text-muted">{CORTO[d]}</span>
                        {cols.map((c) => {
                          const q = quienCocina(p, d, c);
                          return (
                            <button key={c} type="button" onClick={() => cambiarCelda(d, c)} aria-label={`${d}, ${NOMBRE_TIPO[c]}: ${CELDA[q].t}`}
                              className={`h-9 rounded-[9px] border text-xs font-medium transition ${CELDA[q].cls}`}>{CELDA[q].t}</button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div>
              <p className="lab mb-2">¿Con qué cocinas?</p>
              <div className="flex flex-wrap gap-2">{EQUIPO.map((c) => <Chip key={c} on={p.equipo.includes(c)} onClick={() => toggle("equipo", c)}>{c}</Chip>)}</div>
              {!p.equipo.includes("Refrigerador") && <p className="mt-2 text-xs text-muted">Sin refri: Brío evita lácteos y embutidos, y te avisa cuándo comprar la carne el mismo día.</p>}
            </div>
            <div>
              <p className="lab mb-2">¿Cómo cocinas?</p>
              <div className="flex flex-wrap gap-2">
                <Chip on={!!p.sinAceite} onClick={() => setP((x) => ({ ...x, sinAceite: !x.sinAceite }))}>No cocino con aceite</Chip>
              </div>
            </div>
            <label className="block">
              <span className="lab mb-1.5 block">Presupuesto para el súper</span>
              <div className="relative">
                <span className="num pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted">$</span>
                <input className={`${inputCls} num h-[54px] pl-8 text-2xl`} inputMode="numeric" value={p.presupuesto || ""}
                  onChange={(e) => setP((x) => ({ ...x, presupuesto: Number(e.target.value.replace(/\D/g, "")) }))} />
              </div>
            </label>
            <button onClick={() => setGustosAbierto(true)} className="flex w-full items-center justify-between rounded-[14px] border border-line bg-surface px-4 py-3 text-left">
              <span><span className="block font-medium">Tus gustos</span><span className="lab !tracking-[0.06em]">{nGustos || nEvitar ? `${nGustos} te gustan · ${nEvitar} no comes` : "Elige lo que te gusta y lo que no comes"}</span></span>
              <span className="lab">Elegir →</span>
            </button>
          </div>

          <div className="mt-5 flex gap-2">
            {menuValido && <button onClick={() => setEditando(false)} className={btnSecundario}>Cancelar</button>}
            <button onClick={generar} disabled={!p.comidas.length || !(p.dias ?? []).length} className={`${btnPrimario} flex-1`}>{menuValido ? "Generar nuevo menú" : "Generar mi menú"}</button>
          </div>
        </Tarjeta>

        <Hoja abierta={gustosAbierto} onClose={() => setGustosAbierto(false)} titulo="Tus gustos">
          <Gustos gustos={p.gustos ?? []} evitar={p.evitar ?? []} onCambio={(g, e) => setP((x) => ({ ...x, gustos: g, evitar: e }))} />
          <button onClick={() => setGustosAbierto(false)} className={`${btnPrimario} mt-5 w-full`}>Listo</button>
        </Hoja>
      </>
    );
  }

  /* ---------- Menú ---------- */
  const m = menuValido;
  const d = m.dias[Math.min(dia, m.dias.length - 1)];
  const tot = totalesDia(d.comidas);
  const enCasa = d.comidas.reduce((a, c) => a + kcalCasa(c), 0);
  const pollo = polloDelDia(d.comidas);
  const opc = cambio ? calcularOpciones(m, dia, cambio.ci, opciones()) : null;
  const q = buscar.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const coincide = (r: Receta) => !q || `${r.nombre} ${r.ing.map((x) => x[2]).join(" ")}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q);
  const abrirCambio = (ci: number) => { setBuscar(""); setVerMas({ otros: 6, evitados: 6 }); setCambio({ ci, n: 8 }); };
  const elegir = (r: Receta) => { if (!cambio) return; setMenu(reemplazarComida(m, dia, cambio.ci, r.id)); setCambio(null); setToast(`Cambiado por ${r.nombre}`); };
  const opcion = (r: Receta, nota?: string) => {
    const n = nutricion(r);
    return (
      <li key={r.id} className="border-b border-line last:border-b-0">
        <button onClick={() => elegir(r)} className="flex w-full min-w-0 items-center gap-3 py-2.5 text-left">
          <MiniReceta r={r} size={44} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{r.nombre}</span>
            <span className="lab !tracking-[0.06em]">{n.kcal} kcal · {n.proteina} g prot · {r.min} min{etiquetas(r).includes("Sin refri") ? " · sin refri" : ""}</span>
            {nota && <span className="block truncate text-xs text-ember">{nota}</span>}
          </span>
        </button>
      </li>
    );
  };
  const lista = listaSuper(m, despensa);
  const porComprar = lista.items.filter((i) => i.unidades > 0);
  const yaTienes = lista.items.filter((i) => i.unidades === 0);

  const pasarADespensa = () => {
    let n = 0;
    for (const it of porComprar) {
      if (!m.comprado.includes(it.nombre)) continue;
      const u = unidadDespensa(it);
      addItem({ nombre: it.nombre, cantidad: u.cantidad, unidad: u.unidad });
      n++;
    }
    setMenu({ ...m, comprado: [] });
    setToast(n ? `${n} productos agregados a tu despensa` : "Marca primero lo que compraste");
  };

  return (
    <>
      <Tarjeta tono="food" tour="menu">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-medium">Tu menú</h2>
          <button onClick={() => setEditando(true)} className="lab !text-lime-ink hover:underline">Ajustar</button>
        </div>
        <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(7, m.dias.length)}, 1fr)` }}>
          {m.dias.map((x, i) => (
            <button key={x.dia} onClick={() => setDia(i)} aria-pressed={i === dia}
              className={`num relative h-11 rounded-[10px] border text-[15px] uppercase transition ${i === dia ? "border-ink bg-ink text-bg dark:border-lime dark:bg-lime dark:text-on-lime" : "border-line bg-surface text-muted"}`}>
              {CORTO[x.dia] ?? x.dia.slice(0, 3)}
              {x.dia === hoyNombre() && <i aria-label="hoy" className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-lime ring-2 ring-[var(--color-t-food)]" />}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-between">
          <span className="lab">{d.dia}{d.dia === hoyNombre() ? " · hoy" : ""}</span>
          <span className="lab">{(tot.kcal + enCasa).toLocaleString("es-MX")} / {metas.kcal.toLocaleString("es-MX")} kcal{enCasa ? ` · ~${enCasa.toLocaleString("es-MX")} en casa` : ` · ${tot.proteina} g prot`}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.ul key={dia} className="mt-1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2, ease }}>
            {d.comidas.map((c, ci) => {
              if (c.casa) return (
                <li key={ci} className="border-b border-line py-2.5 last:border-b-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="lab grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-t-water !text-[11px] !text-ink">Casa</span>
                    <span className="min-w-0">
                      <span className="lab block !tracking-[0.08em]">{NOMBRE_TIPO[c.tipo]}</span>
                      <span className="block font-medium">Lo que hagan en casa o fuera</span>
                      <span className="lab !tracking-[0.06em]">Te tocan ~{c.factor.toLocaleString("es-MX")} kcal</span>
                    </span>
                  </div>
                  <p className="mt-1.5 pl-[56px] text-xs leading-relaxed text-muted">
                    {c.tipo === "colacion" ? "Una fruta, un puño de cacahuates o un yogur." : "Arma tu plato: la mitad verdura, un cuarto proteína (del tamaño de tu palma) y un cuarto tortilla, arroz o pan. Evita repetir y bebe agua."}
                  </p>
                  <div className="mt-2 pl-[56px]">
                    <button onClick={() => window.dispatchEvent(new Event(VER_COMIDAS_HOY))}
                      className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-ink">Registrar lo que comí</button>
                  </div>
                </li>
              );
              const r = recetaPorId(c.receta);
              const rAj = recetaDeComida(c);
              if (!r || !rAj) return null;
              const n = nutricion(rAj, c.factor);
              const cambios = resumenAjustes(r, c.ajustes);
              return (
                <li key={ci} className="border-b border-line py-2.5 last:border-b-0">
                  <button onClick={() => setReceta({ r, factor: c.factor, ci, di: dia })} className="flex w-full min-w-0 items-center gap-3 text-left">
                    <MiniReceta r={r} size={44} />
                    <span className="min-w-0">
                      <span className="lab block !tracking-[0.08em]">{NOMBRE_TIPO[c.tipo]}{c.factor !== 1 ? ` · porción ×${c.factor.toFixed(1)}` : ""}</span>
                      <span className="block truncate font-medium">{r.nombre}</span>
                      <span className="lab !tracking-[0.06em]">{n.kcal} kcal · {n.proteina} g prot</span>
                      {cambios && <span className="block truncate text-xs text-lime-ink">{cambios}</span>}
                    </span>
                  </button>
                  {BEBIDA[c.tipo] && <p className="mt-1 pl-[56px] text-xs text-muted">{BEBIDA[c.tipo]}</p>}
                  <div className="mt-2 flex gap-2 pl-[56px]">
                    <button onClick={() => abrirCambio(ci)} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-ink">Cambiar</button>
                    <button onClick={() => { const k = registrar(rAj, c.factor, c.tipo === "colacion" ? "snack" : c.tipo, cambios); setToast(k ? "Registrado y descontado de tu despensa" : "Registrado hoy"); }}
                      className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-ink">Registrar hoy</button>
                  </div>
                </li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
        {pollo && (
          <p className="mt-2 rounded-[10px] bg-surface px-3 py-2 text-xs leading-relaxed text-muted">
            <b className="text-ink">Pollo del día: ~{pollo.gramos} g.</b> En la pollería pide {textoPechugas(pollo.medias)}
            {pollo.sobra >= 40 ? `; te sobran ~${pollo.sobra} g: agrégalos a otra comida de hoy${p.equipo.includes("Refrigerador") ? " o guárdalos en el refri" : ", sin refri no duran para mañana"}.` : ", te alcanza justo."}
          </p>
        )}
      </Tarjeta>

      <Tarjeta delay={0.05}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-medium">Lista del súper</h2>
          <span className={`num text-xl ${lista.total > p.presupuesto ? "text-ember" : ""}`}>{dinero(lista.total)}<small className="text-sm font-medium text-muted"> / {dinero(p.presupuesto)}</small></span>
        </div>
        <p className="mt-1 text-xs text-muted">Lo que comes esta semana vale <b className="text-ink">{dinero(lista.usado)}</b>. El resto de la compra (aceite, frascos, bolsas) te dura más semanas.</p>
        {lista.usado > p.presupuesto && <p className="mt-1 text-xs text-ember">Tu menú se pasa del presupuesto. Prueba con menos días, quitar una colación o "Cambiar" platillos caros.</p>}
        <ul className="mt-2">
          {porComprar.map((it) => {
            const ok = m.comprado.includes(it.nombre);
            return (
              <li key={it.nombre} className="border-b border-line last:border-b-0">
                <button onClick={() => marcarComprado(it.nombre)} className="grid w-full grid-cols-[22px_1fr_auto] items-center gap-3 py-2.5 text-left">
                  <span className={`grid h-[22px] w-[22px] place-items-center rounded-[7px] border-[1.5px] text-[13px] font-extrabold ${ok ? "border-lime bg-lime text-on-lime" : "border-line-strong"}`}>{ok ? "✓" : ""}</span>
                  <span className={ok ? "text-muted line-through" : ""}>{it.nombre}<span className="lab mt-0.5 block !tracking-[0.06em]">{it.unidad.startsWith("kg") ? `${cant(it.unidades)} kg${it.unidad.slice(2)}` : `${it.unidades} ${it.unidad}`}{it.enCasa > 0 ? ` · necesitas ${cant(it.necesitaU)}, ya tienes ${cant(it.enCasaU)}` : ""}</span></span>
                  <span className="num text-[17px]">{dinero(it.costo)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {yaTienes.length > 0 && <p className="mt-2 text-xs text-muted">Ya lo tienes en tu despensa, no lo compres: {yaTienes.map((i) => i.nombre.toLowerCase()).join(", ")}.</p>}
        <button onClick={pasarADespensa} className={`${btnSecundario} mt-3 w-full`}>Pasar lo comprado a mi despensa</button>
        <p className="mt-2 text-xs text-muted">Precios aproximados de tiendas como 3B, Aurrera y mercados; pueden variar.</p>
      </Tarjeta>

      <Hoja abierta={!!receta} onClose={() => setReceta(null)} titulo="Receta">
        {receta && <RecetaDetalle r={receta.r} factorInicial={receta.factor} ajustesIniciales={m.dias[receta.di]?.comidas[receta.ci]?.ajustes}
          onAjustes={(a) => {
            const actual = useBrio.getState().menu;
            if (!actual) return;
            setMenu({ ...actual, dias: actual.dias.map((d, i) => i !== receta.di ? d : { ...d, comidas: d.comidas.map((c, j) => {
              if (j !== receta.ci) return c;
              const { ajustes: _viejo, ...resto } = c;
              return a ? { ...resto, ajustes: a } : resto;
            }) }) });
          }}
          onRegistrado={(msg) => { setReceta(null); setToast(msg); }} />}
      </Hoja>
      <Hoja abierta={!!cambio} onClose={() => setCambio(null)} titulo="Cambiar por…">
        {cambio && opc && (() => {
          const rec = opc.recomendadas.filter(coincide), otros = opc.otrosTiempos.filter(coincide), evit = opc.conEvitados.filter((x) => coincide(x.r));
          const tipo = NOMBRE_TIPO[d.comidas[cambio.ci]?.tipo ?? "comida"].toLowerCase();
          return (
            <>
              <input className={`${inputCls} mb-3`} placeholder="Buscar: pollo, huevo, atún…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
              {opc.nEvitar >= 15 && !q && (
                <div className="mb-3 rounded-[14px] border border-ember/40 bg-ember/5 p-3 text-sm">
                  Marcaste <b>{opc.nEvitar} alimentos</b> como "no lo como", por eso salen pocas opciones.{" "}
                  <button onClick={() => { setCambio(null); setEditando(true); }} className="font-medium text-lime-ink hover:underline">Revisar mis gustos</button>
                </div>
              )}
              <p className="lab mb-1">Para tu {tipo} · {rec.length}</p>
              {rec.length ? <ul>{rec.slice(0, cambio.n).map((r) => opcion(r))}</ul> : <p className="py-2 text-sm text-muted">{q ? "Nada con esa búsqueda." : "No hay más con tus gustos y tu equipo."}</p>}
              {rec.length > cambio.n && <button onClick={() => setCambio({ ...cambio, n: cambio.n + 12 })} className={`${btnSecundario} mt-2 w-full`}>Ver más</button>}

              {otros.length > 0 && (
                <>
                  <p className="lab mb-1 mt-5">De otros tiempos de comida · {otros.length}</p>
                  <p className="mb-1 text-xs text-muted">También sirven de {tipo}; la porción se ajusta a tus calorías.</p>
                  <ul>{otros.slice(0, verMas.otros).map((r) => opcion(r))}</ul>
                  {otros.length > verMas.otros && <button onClick={() => setVerMas({ ...verMas, otros: verMas.otros + 12 })} className={`${btnSecundario} mt-2 w-full`}>Ver más</button>}
                </>
              )}

              {evit.length > 0 && (
                <>
                  <p className="lab mb-1 mt-5">Llevan algo que marcaste · {evit.length}</p>
                  <p className="mb-1 text-xs text-muted">Por si hoy sí se te antoja. Al abrir la receta puedes quitar ese ingrediente.</p>
                  <ul>{evit.slice(0, verMas.evitados).map((x) => opcion(x.r, `Lleva ${x.lleva.join(" y ")}`))}</ul>
                  {evit.length > verMas.evitados && <button onClick={() => setVerMas({ ...verMas, evitados: verMas.evitados + 12 })} className={`${btnSecundario} mt-2 w-full`}>Ver más</button>}
                </>
              )}
            </>
          );
        })()}
      </Hoja>
      <Toast texto={toast} />
    </>
  );
}

import { useState } from "react";
import { GRUPOS_EQ, sumarEq, totalesEq, type Equivalentes, type GrupoEq } from "../data/equivalentes";
import { TIEMPOS_PLAN, calcularMetas, hoyISO, menuPlan, tieneEquivalentes, tienePlanMenu, type Metas, type Perfil, type PlanNutriologo, type TiempoPlan } from "../lib/calc";
import { pesoActual, useBrio, type TipoComida } from "../lib/store";
import { Hoja, Tarjeta, Toast, btnPrimario, btnSecundario, inputCls, useToast } from "./ui";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const CORTO: Record<string, string> = { Lunes: "Lun", Martes: "Mar", Miércoles: "Mié", Jueves: "Jue", Viernes: "Vie", Sábado: "Sáb", Domingo: "Dom" };
const COMUNES: GrupoEq[] = ["verduras", "frutas", "cereal-sg", "leguminosas", "aoa-mb", "aoa-b", "aoa-m", "leche-d", "grasa-sp", "grasa-cp"];
const PARTE: Record<TiempoPlan, number> = { desayuno: 0.25, colacion1: 0.1, comida: 0.35, colacion2: 0.1, cena: 0.2 };
const TIPO: Record<TiempoPlan, TipoComida> = { desayuno: "desayuno", colacion1: "snack", comida: "comida", colacion2: "snack", cena: "cena" };
const VACIO: PlanNutriologo = { activo: true, usarMetas: false };

function Paso({ valor, onCambio, paso = 0.5 }: { valor: number; onCambio: (v: number) => void; paso?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onCambio(Math.max(0, Math.round((valor - paso) * 2) / 2))} aria-label="Menos" className="grid h-8 w-8 place-items-center rounded-[9px] border border-line">−</button>
      <span className="num w-9 text-center text-lg">{valor % 1 ? valor.toFixed(1) : valor}</span>
      <button type="button" onClick={() => onCambio(Math.round((valor + paso) * 2) / 2)} aria-label="Más" className="grid h-8 w-8 place-items-center rounded-[9px] border border-line">+</button>
    </div>
  );
}

function Pestana({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`flex-1 rounded-[10px] px-3 py-2 text-sm font-medium transition ${on ? "bg-ink text-bg dark:bg-lime dark:text-on-lime" : "text-muted"}`}>{children}</button>
  );
}

/** Editor del plan del nutriólogo: metas, equivalentes y menú fijo. */
export function EditorPlan({ perfil, onListo }: { perfil: Perfil; onListo: (msg: string) => void }) {
  const setPlan = useBrio((s) => s.setPlan);
  const pesos = useBrio((s) => s.pesos);
  const [p, setP] = useState<PlanNutriologo>({ ...VACIO, ...perfil.plan, activo: true });
  const [tab, setTab] = useState<"metas" | "eq" | "menu">(tienePlanMenu(perfil.plan) && !tieneEquivalentes(perfil.plan) ? "menu" : perfil.plan?.metas ? "metas" : "eq");
  const [masGrupos, setMasGrupos] = useState(false);
  const [dia, setDia] = useState("Lunes");
  const brio = calcularMetas(perfil, pesoActual(pesos, perfil.pesoInicial));
  const m = p.metas ?? { kcal: 0, proteina: 0, carbos: 0, grasa: 0 };
  const eq = p.equivalentes ?? {};
  const tEq = totalesEq(eq as Equivalentes);
  const clave = p.mismoMenu ? "todos" : dia;

  const setMeta = (k: keyof typeof m, v: string) => setP((x) => ({ ...x, metas: { ...m, [k]: Number(v.replace(/\D/g, "")) || 0 } }));
  const setEq = (g: GrupoEq, v: number) => setP((x) => ({ ...x, equivalentes: { ...(x.equivalentes ?? {}), [g]: v } }));
  const setTexto = (t: TiempoPlan, v: string) => setP((x) => ({ ...x, menu: { ...(x.menu ?? {}), [clave]: { ...(x.menu?.[clave] ?? {}), [t]: v } } }));
  const copiarATodos = () => setP((x) => ({ ...x, menu: { ...(x.menu ?? {}), ...Object.fromEntries(DIAS.map((d) => [d, { ...(x.menu?.[dia] ?? {}) }])) } }));
  const usarKcalEq = () => setP((x) => ({ ...x, usarMetas: true, metas: { kcal: tEq.kcal, proteina: tEq.proteina, carbos: tEq.carbos, grasa: tEq.grasa } }));

  const guardar = () => {
    const limpio: PlanNutriologo = { ...p, usarMetas: p.usarMetas && !!p.metas?.kcal };
    if (limpio.equivalentes) limpio.equivalentes = Object.fromEntries(Object.entries(limpio.equivalentes).filter(([, v]) => (v ?? 0) > 0));
    setPlan(limpio);
    onListo("Plan guardado. Brío lo sigue desde hoy.");
  };
  const desactivar = () => { setPlan({ ...p, activo: false }); onListo("Dejaste de seguir el plan. Brío vuelve a sus metas."); };

  return (
    <div>
      <p className="text-sm text-muted">Captura lo que te dio tu nutriólogo. Puedes usar una parte o todo: metas, equivalentes o el menú de cada día.</p>
      <div className="mt-4 flex gap-1 rounded-[13px] border border-line bg-surface p-1">
        <Pestana on={tab === "metas"} onClick={() => setTab("metas")}>Metas</Pestana>
        <Pestana on={tab === "eq"} onClick={() => setTab("eq")}>Equivalentes</Pestana>
        <Pestana on={tab === "menu"} onClick={() => setTab("menu")}>Menú</Pestana>
      </div>

      {tab === "metas" && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {([["kcal", "Calorías (kcal)"], ["proteina", "Proteína (g)"], ["carbos", "Carbohidratos (g)"], ["grasa", "Grasa (g)"]] as const).map(([k, t]) => (
              <label key={k} className="block">
                <span className="lab mb-1 block">{t}</span>
                <input className={`${inputCls} num text-xl`} inputMode="numeric" value={m[k] || ""} placeholder={String(brio[k])} onChange={(e) => setMeta(k, e.target.value)} />
              </label>
            ))}
          </div>
          <p className="text-xs text-muted">Brío te calculaba {brio.kcal.toLocaleString("es-MX")} kcal y {brio.proteina} g de proteína.</p>
          <button type="button" onClick={() => setP((x) => ({ ...x, usarMetas: !x.usarMetas }))} aria-pressed={p.usarMetas}
            className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-sm ${p.usarMetas ? "border-lime bg-lime/15" : "border-line bg-surface"}`}>
            <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] text-[13px] font-extrabold ${p.usarMetas ? "border-lime bg-lime text-on-lime" : "border-line-strong"}`}>{p.usarMetas ? "✓" : ""}</span>
            Usar estas metas en lugar de las de Brío (en Hoy, en tu menú y en tus porciones)
          </button>
        </div>
      )}

      {tab === "eq" && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between rounded-[14px] border border-line bg-surface px-4 py-3">
            <span className="lab">Tu plan da</span>
            <span className="num text-lg">~{tEq.kcal.toLocaleString("es-MX")} kcal · {tEq.proteina} P · {tEq.carbos} C · {tEq.grasa} G</span>
          </div>
          <p className="mt-2 text-xs text-muted">Pon cuántos equivalentes de cada grupo te tocan <b className="text-ink">al día</b>. Brío los cuenta solos cuando registras recetas o alimentos.</p>
          <ul className="mt-2">
            {GRUPOS_EQ.filter((g) => masGrupos || COMUNES.includes(g.id) || (eq[g.id] ?? 0) > 0).map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
                <span className="min-w-0"><b className="block text-sm font-medium">{g.t}</b><span className="block text-xs text-muted">{g.ejemplo}</span></span>
                <Paso valor={eq[g.id] ?? 0} onCambio={(v) => setEq(g.id, v)} />
              </li>
            ))}
          </ul>
          {!masGrupos && <button type="button" onClick={() => setMasGrupos(true)} className="lab mt-2 !text-lime-ink hover:underline">Ver más grupos</button>}
          {tEq.kcal > 0 && (
            <button type="button" onClick={usarKcalEq} className={`${btnSecundario} mt-3 w-full`}>Usar ~{tEq.kcal.toLocaleString("es-MX")} kcal como mi meta</button>
          )}
        </div>
      )}

      {tab === "menu" && (
        <div className="mt-4">
          <div className="flex gap-2">
            {([[true, "El mismo todos los días"], [false, "Cambia por día"]] as const).map(([v, t]) => (
              <button key={t} type="button" onClick={() => setP((x) => ({ ...x, mismoMenu: v }))} aria-pressed={!!p.mismoMenu === v}
                className={`rounded-full border px-3.5 py-1.5 text-sm ${!!p.mismoMenu === v ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>{t}</button>
            ))}
          </div>
          {!p.mismoMenu && (
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {DIAS.map((d) => {
                const lleno = Object.values(p.menu?.[d] ?? {}).some((x) => x?.trim());
                return (
                  <button key={d} type="button" onClick={() => setDia(d)} aria-pressed={dia === d}
                    className={`num relative h-10 rounded-[10px] border text-[15px] uppercase ${dia === d ? "border-ink bg-ink text-bg dark:border-lime dark:bg-lime dark:text-on-lime" : "border-line bg-surface text-muted"}`}>
                    {CORTO[d]}{lleno && <i className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-lime" />}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-3 space-y-2.5">
            {TIEMPOS_PLAN.map((t) => (
              <label key={t.id} className="block">
                <span className="lab mb-1 block">{t.t}</span>
                <textarea rows={2} className={`${inputCls} resize-none text-[15px]`} value={p.menu?.[clave]?.[t.id] ?? ""} onChange={(e) => setTexto(t.id, e.target.value)}
                  placeholder={t.id.startsWith("colacion") ? "Ej. 1 manzana y 10 almendras (o déjalo vacío)" : t.id === "desayuno" ? "Ej. 2 huevos con nopales, 1 tortilla, ½ taza de papaya" : "Ej. 90 g de pechuga, ½ taza de arroz, ensalada"} />
              </label>
            ))}
          </div>
          {!p.mismoMenu && <button type="button" onClick={copiarATodos} className="lab mt-2 !text-lime-ink hover:underline">Copiar el {dia.toLowerCase()} a todos los días</button>}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {perfil.plan?.activo && <button type="button" onClick={desactivar} className={`${btnSecundario} text-sm`}>Dejar el plan</button>}
        <button type="button" onClick={guardar} className={`${btnPrimario} flex-1`}>Guardar plan</button>
      </div>
    </div>
  );
}

/** Tarjeta del plan: lo que te toca hoy y tus equivalentes. */
export function TarjetaPlan({ perfil, metas, enComida = false, delay = 0, className = "" }: { perfil: Perfil; metas: Metas; enComida?: boolean; delay?: number; className?: string }) {
  const hoy = hoyISO();
  const d = useBrio((s) => s.dias[hoy]);
  const { addComida, ajustarEq } = useBrio();
  const [editar, setEditar] = useState(false);
  const [toast, setToast] = useToast();
  const pl = perfil.plan;
  const conMenu = tienePlanMenu(pl), conEq = tieneEquivalentes(pl);

  const hoja = (
    <>
      <Hoja abierta={editar} onClose={() => setEditar(false)} titulo="Mi plan del nutriólogo" ancha>
        <div className="md:max-w-xl"><EditorPlan perfil={perfil} onListo={(msg) => { setEditar(false); setToast(msg); }} /></div>
      </Hoja>
      <Toast texto={toast} />
    </>
  );

  // Sin plan: invitación (solo en Comida, o en Hoy si dijo que tiene plan pero no lo ha capturado)
  if (!pl?.activo || (!conMenu && !conEq && !pl.usarMetas)) {
    if (!enComida && !pl?.activo) return null;
    return (
      <>
        <Tarjeta delay={delay} className={className}>
          <p className="lab">Mi plan del nutriólogo</p>
          <h2 className="mt-1 font-serif text-xl font-medium">¿Te dio un plan tu nutriólogo?</h2>
          <p className="mt-1 text-sm text-muted">Captura su menú, tus equivalentes o tus metas y Brío lo sigue en lugar de inventarte uno.</p>
          <button onClick={() => setEditar(true)} className={`${btnSecundario} mt-3 w-full`}>Capturar mi plan</button>
        </Tarjeta>
        {hoja}
      </>
    );
  }

  const ahora = new Date();
  const hora = ahora.getHours() + ahora.getMinutes() / 60;
  const tiempos = TIEMPOS_PLAN.map((t) => ({ ...t, texto: menuPlan(pl, ahora, t.id), hecho: !!d?.comidas.some((c) => c.plan === t.id) })).filter((t) => t.texto);
  const proximo = tiempos.find((t) => !t.hecho && t.hora + 1.5 >= hora) ?? tiempos.find((t) => !t.hecho);
  const totalParte = tiempos.reduce((a, t) => a + PARTE[t.id], 0) || 1;

  const comi = (t: (typeof tiempos)[number]) => {
    const kcal = Math.round((metas.kcal * PARTE[t.id]) / totalParte);
    const prot = Math.round((metas.proteina * PARTE[t.id]) / totalParte);
    addComida(hoy, { nombre: t.texto!.length > 60 ? `${t.texto!.slice(0, 57)}…` : t.texto!, kcal, proteina: prot, tipo: TIPO[t.id], plan: t.id });
    setToast(`${t.t} registrado (~${kcal} kcal)`);
  };

  // Equivalentes consumidos: de las comidas + ajustes manuales
  let consumidos: Equivalentes = {};
  for (const c of d?.comidas ?? []) consumidos = sumarEq(consumidos, c.eq);
  consumidos = sumarEq(consumidos, d?.extra?.eq);
  const metaEq = (pl.equivalentes ?? {}) as Equivalentes;

  return (
    <>
      <Tarjeta tono="habit" delay={delay} className={className}>
        <div className="flex items-baseline justify-between">
          <p className="lab">Mi plan del nutriólogo</p>
          <button onClick={() => setEditar(true)} className="lab !text-lime-ink hover:underline">Editar</button>
        </div>

        {conMenu && proximo && (
          <div className="mt-2">
            <p className="font-serif text-xl font-medium">{proximo.hora + 1.5 >= hora ? "Te toca" : "Te faltó registrar"}: {proximo.t.toLowerCase()}</p>
            <p className="mt-1 text-[15px] leading-snug">{proximo.texto}</p>
            <button onClick={() => comi(proximo)} className={`${btnPrimario} mt-3 w-full`}>Ya lo comí</button>
          </div>
        )}
        {conMenu && !proximo && tiempos.length > 0 && <p className="mt-2 font-serif text-xl font-medium">Cumpliste tu menú de hoy.</p>}
        {conMenu && tiempos.length > 0 && (
          <ul className="mt-3">
            {tiempos.map((t) => (
              <li key={t.id} className="flex items-start gap-2.5 border-b border-line py-2 text-sm last:border-b-0">
                <span className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border-[1.5px] text-[11px] font-extrabold ${t.hecho ? "border-lime bg-lime text-on-lime" : "border-line-strong"}`}>{t.hecho ? "✓" : ""}</span>
                <span className="min-w-0"><span className="lab block !tracking-[0.06em]">{t.t}</span><span className={t.hecho ? "text-muted line-through" : ""}>{t.texto}</span></span>
              </li>
            ))}
          </ul>
        )}

        {conEq && (
          <div className={conMenu ? "mt-4 border-t border-line pt-3" : "mt-2"}>
            <p className="lab mb-2">Equivalentes de hoy</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {GRUPOS_EQ.filter((g) => (metaEq[g.id] ?? 0) > 0).map((g) => {
                const lleva = consumidos[g.id] ?? 0, meta = metaEq[g.id] ?? 0;
                const ok = lleva >= meta, pasado = lleva > meta;
                return (
                  <div key={g.id} className="flex items-center justify-between gap-2 rounded-[12px] border border-line bg-surface px-3 py-1.5">
                    <span className="min-w-0 truncate text-sm">{g.corto}</span>
                    <span className="flex items-center gap-1.5">
                      <button onClick={() => ajustarEq(hoy, g.id, -0.5)} aria-label={`Quitar ${g.corto}`} className="grid h-7 w-7 place-items-center rounded-[8px] text-muted hover:text-ink">−</button>
                      <span className={`num w-12 text-center text-[17px] ${pasado ? "text-ember" : ok ? "text-lime-ink" : ""}`}>{lleva % 1 ? lleva.toFixed(1) : lleva}/{meta}</span>
                      <button onClick={() => ajustarEq(hoy, g.id, 0.5)} aria-label={`Sumar ${g.corto}`} className="grid h-7 w-7 place-items-center rounded-[8px] border border-line">+</button>
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">Se suman solos al registrar recetas o alimentos de la base; usa + y − para lo demás.</p>
          </div>
        )}

        {!conMenu && !conEq && pl.usarMetas && (
          <p className="mt-2 text-sm">Brío usa las metas de tu nutriólogo: <b>{metas.kcal.toLocaleString("es-MX")} kcal</b> y <b>{metas.proteina} g</b> de proteína.</p>
        )}
      </Tarjeta>
      {hoja}
    </>
  );
}

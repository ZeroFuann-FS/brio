import { useState } from "react";
import type { Habito, Perfil } from "../lib/calc";
import { CATALOGO_HABITOS, MAX_HABITOS, habitosDe, useBrio } from "../lib/store";
import { btnPrimario, inputCls } from "./ui";

const PASOS = [4000, 6000, 8000, 10000, 12000, 15000];
const textoPasos = (n: number) => `Caminar ${n.toLocaleString("es-MX")} pasos`;

/** Elegir hábitos (del catálogo o propios) y ajustar la meta de pasos. */
export default function EditorHabitos({ perfil, onListo }: { perfil: Perfil; onListo: () => void }) {
  const setPerfil = useBrio((s) => s.setPerfil);
  const [lista, setLista] = useState<Habito[]>(habitosDe(perfil));
  const [nuevo, setNuevo] = useState("");
  const actualPasos = Number((lista.find((h) => h.id === "pasos")?.t.match(/[\d,]+/)?.[0] ?? "10000").replace(/,/g, "")) || 10000;
  const tiene = (id: string) => lista.some((h) => h.id === id);
  const alternar = (h: Habito) => setLista((l) => (l.some((x) => x.id === h.id) ? l.filter((x) => x.id !== h.id) : l.length >= MAX_HABITOS ? l : [...l, h.id === "pasos" ? { ...h, t: textoPasos(actualPasos) } : h]));
  const setPasos = (n: number) => setLista((l) => l.map((h) => (h.id === "pasos" ? { ...h, t: textoPasos(n) } : h)));
  const propios = lista.filter((h) => !CATALOGO_HABITOS.some((c) => c.id === h.id));

  return (
    <div>
      <p className="text-sm text-muted">Elige hasta {MAX_HABITOS}. Cuentan para tu racha junto con el agua: necesitas cumplir la mayoría cada día.</p>
      <ul className="mt-3 space-y-1.5">
        {[...CATALOGO_HABITOS, ...propios].map((c) => {
          const on = tiene(c.id);
          const h = lista.find((x) => x.id === c.id) ?? c;
          return (
            <li key={c.id}>
              <button onClick={() => alternar(c)} aria-pressed={on}
                className={`flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-2.5 text-left ${on ? "border-lime bg-lime/15" : "border-line bg-surface"} ${!on && lista.length >= MAX_HABITOS ? "opacity-50" : ""}`}>
                <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] text-[13px] font-extrabold ${on ? "border-lime bg-lime text-on-lime" : "border-line-strong"}`}>{on ? "✓" : ""}</span>
                <span className="flex-1">{h.t}</span>
              </button>
              {c.id === "pasos" && on && (
                <div className="mt-1.5 flex flex-wrap gap-1.5 pl-9">
                  {PASOS.map((n) => (
                    <button key={n} onClick={() => setPasos(n)} aria-pressed={actualPasos === n}
                      className={`rounded-full border px-3 py-1 text-sm ${actualPasos === n ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>{n.toLocaleString("es-MX")}</button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); const t = nuevo.trim(); if (t && lista.length < MAX_HABITOS) { setLista((l) => [...l, { id: `p-${Date.now().toString(36)}`, e: "", t }]); setNuevo(""); } }} className="mt-3 flex gap-2">
        <input className={`${inputCls} py-2.5`} maxLength={40} value={nuevo} placeholder="Agregar uno propio: Tender la cama…" onChange={(e) => setNuevo(e.target.value)} />
        <button disabled={!nuevo.trim() || lista.length >= MAX_HABITOS} className="h-12 shrink-0 rounded-[14px] border border-line px-4">+</button>
      </form>
      <p className="lab mt-2">{lista.length}/{MAX_HABITOS} elegidos · el agua se cuenta sola</p>
      <button disabled={!lista.length} onClick={() => { setPerfil({ ...perfil, habitos: lista }); onListo(); }} className={`${btnPrimario} mt-4 w-full`}>Guardar hábitos</button>
    </div>
  );
}

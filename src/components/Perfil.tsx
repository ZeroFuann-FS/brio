import { useState } from "react";
import type { Metas, Perfil as TPerfil } from "../lib/calc";
import { useBrio } from "../lib/store";
import { Tarjeta, btnSecundario } from "./ui";
import Logo from "./Logo";

export default function Perfil({ perfil, metas, onEditar, onVerIntro }: { perfil: TPerfil; metas: Metas; onEditar: () => void; onVerIntro: () => void }) {
  const reset = useBrio((s) => s.reset);
  const [confirmar, setConfirmar] = useState(false);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Perfil</h1>

      <Tarjeta>
        <p className="font-display text-xl font-bold">{perfil.nombre}</p>
        <p className="text-sm text-muted">{perfil.edad} años · {perfil.estatura} cm · meta {perfil.pesoMeta} kg · entrenas {perfil.diasEntreno} días</p>
        <button onClick={onEditar} className={`${btnSecundario} mt-4 w-full`}>Editar mis datos</button>
      </Tarjeta>

      <Tarjeta delay={0.05}>
        <h2 className="font-display text-lg font-bold">Cómo calculamos tus metas</h2>
        <dl className="mt-3 space-y-2 text-sm">
          {[
            ["Metabolismo en reposo", `${metas.bmr} kcal`, "Mifflin-St Jeor"],
            ["Gasto diario estimado", `${metas.tdee} kcal`, "reposo × tu actividad"],
            ["Tu meta diaria", `${metas.kcal} kcal`, `déficit para −${perfil.ritmo}% de peso/sem`],
            ["Proteína", `${metas.proteina} g`, "~2 g por kg de tu peso meta"],
            ["Carbohidratos / grasa", `${metas.carbos} g / ${metas.grasa} g`, "grasa ≈ 27 % de kcal"],
            ["Agua", `${(metas.aguaMl / 1000).toFixed(1)} L`, "35 ml por kg"],
          ].map(([t, v, d]) => (
            <div key={t} className="flex items-start justify-between gap-3 rounded-2xl bg-bg px-4 py-2.5">
              <div><dt>{t}</dt><dd className="text-xs text-muted">{d}</dd></div>
              <b className="shrink-0 tabular-nums">{v}</b>
            </div>
          ))}
        </dl>
      </Tarjeta>

      <Tarjeta delay={0.1} className="text-center">
        <Logo className="text-4xl" />
        <p className="mt-2 text-sm text-muted">Pujanza, espíritu, valor, resolución.</p>
        <button onClick={onVerIntro} className={`${btnSecundario} mt-4 w-full`}>¿Por qué Brío?</button>
      </Tarjeta>

      <Tarjeta delay={0.15}>
        <p className="text-sm text-muted">Tus datos se guardan solo en este dispositivo por ahora. Pronto: cuenta para sincronizar entre celular y compu.</p>
        {!confirmar ? (
          <button onClick={() => setConfirmar(true)} className="mt-3 text-sm text-ember hover:underline">Borrar todos mis datos</button>
        ) : (
          <div className="mt-3 flex gap-2">
            <button onClick={reset} className="h-11 flex-1 rounded-2xl bg-ember font-bold text-bg">Sí, borrar todo</button>
            <button onClick={() => setConfirmar(false)} className={`${btnSecundario} h-11 flex-1`}>Cancelar</button>
          </div>
        )}
      </Tarjeta>
      <p className="text-center text-xs text-muted">Brío v0.2 · Ponle brío a tu vida.</p>
    </div>
  );
}

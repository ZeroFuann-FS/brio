import { useEffect, useState } from "react";
import { cerrarSesion, eliminarCuenta } from "../lib/sync";
import { nubeDisponible, supabase } from "../lib/supabase";
import { useTema, type Tema } from "../lib/tema";
import type { Metas, Perfil as TPerfil } from "../lib/calc";
import { useBrio } from "../lib/store";
import { Hoja, Tarjeta, btnSecundario } from "./ui";
import { CREDITOS } from "../data/creditos";
import Logo from "./Logo";
import MiIA from "./MiIA";
import Recordatorios from "./dia/Recordatorios";
import Comentarios from "./Comentarios";
import PanelAdmin from "./admin/PanelAdmin";

const TEXTO_SYNC: Record<string, string> = {
  ok: "Todo guardado en la nube",
  sincronizando: "Sincronizando…",
  pendiente: "⏳ Cambios por subir (se suben al tener internet)",
  error: "No se pudo sincronizar. Lo reintentamos solos.",
  "sin-cuenta": "",
};

type Props = {
  perfil: TPerfil; metas: Metas; onEditar: () => void; onVerIntro: () => void; onVerTutorial: () => void;
  email: string | null; estadoSync: string; onCrearCuenta: () => void;
  /** Después de "Borrar todo": la app vuelve a ofrecer crear cuenta o iniciar sesión. */
  onBorrado?: () => void;
};

export default function Perfil({ perfil, metas, onEditar, onVerIntro, onVerTutorial, email, estadoSync, onCrearCuenta, onBorrado }: Props) {
  const [creditos, setCreditos] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [panel, setPanel] = useState(false);
  useEffect(() => { if (email) supabase.rpc("es_admin").then(({ data }) => setAdmin(data === true)); else setAdmin(false); }, [email]);
  const [saliendo, setSaliendo] = useState(false);
  const { tema, setTema } = useTema();
  const [eliminar, setEliminar] = useState<"no" | "confirmar" | "eliminando" | "error">("no");
  const reset = useBrio((s) => s.reset);
  const [confirmar, setConfirmar] = useState(false);

  return (
    // En laptop: dos columnas tipo mosaico (cada tarjeta entera en una columna)
    <div className="space-y-4 md:max-w-3xl lg:max-w-none lg:columns-2 lg:gap-4 lg:space-y-0 lg:[&>*]:mb-4 lg:[&>*]:break-inside-avoid">
      <h1 className="font-serif text-4xl font-medium tracking-tight lg:[column-span:all]">Perfil</h1>

      <Tarjeta>
        <p className="font-serif text-xl font-medium">{perfil.nombre}</p>
        <p className="text-sm text-muted">{perfil.edad} años · {perfil.estatura} cm · meta {perfil.pesoMeta} kg · entrenas {perfil.diasEntreno} días</p>
        <button onClick={onEditar} className={`${btnSecundario} mt-4 w-full`}>Editar mis datos</button>
      </Tarjeta>

      <Tarjeta delay={0.05}>
        <h2 className="font-serif text-xl font-medium">Cómo calculamos tus metas</h2>
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
        <p className="mt-2 text-sm text-muted">Energía, ganas, valor y decisión.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onVerIntro} className={btnSecundario}>¿Por qué Brío?</button>
          <button onClick={onVerTutorial} className={btnSecundario}>Ver tutorial</button>
        </div>
      </Tarjeta>

      <Tarjeta delay={0.12}>
        <h2 className="font-serif text-xl font-medium">Apariencia</h2>
        <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-[14px] border border-line bg-bg p-1">
          {([["claro", "Claro"], ["oscuro", "Oscuro"], ["sistema", "Automático"]] as [Tema, string][]).map(([id, t]) => (
            <button key={id} onClick={() => setTema(id)} aria-pressed={tema === id}
              className={`h-10 rounded-[10px] font-display text-sm font-semibold uppercase tracking-[0.08em] transition ${tema === id ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]" : "text-muted"}`}>
              {t}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Automático usa el modo de tu teléfono o compu.</p>
      </Tarjeta>

      {perfil && (
        <Tarjeta delay={0.13}>
          <h2 className="font-serif text-xl font-medium">Avisos</h2>
          <p className="mt-1 mb-3 text-sm text-muted">Pago del gym, despensa, comidas, entreno, hábitos y agua.</p>
          <Recordatorios perfil={perfil} />
        </Tarjeta>
      )}

      <Tarjeta delay={0.14}>
        <h2 className="font-serif text-xl font-medium">Ayúdame a mejorar Brío</h2>
        <p className="mb-3 mt-1 text-sm text-muted">¿Una idea, algo que falla o algo que te encanta? Lo leo todo.</p>
        <Comentarios />
      </Tarjeta>

      {admin && (
        <Tarjeta delay={0.14} tono="habit">
          <h2 className="font-serif text-xl font-medium">Administrador</h2>
          <p className="mt-1 text-sm text-muted">Usuarios, estadísticas y comentarios.</p>
          <button onClick={() => setPanel(true)} className={`${btnSecundario} mt-3 w-full`}>Abrir el panel</button>
        </Tarjeta>
      )}
      <Hoja abierta={panel} onClose={() => setPanel(false)} titulo="Panel de administrador" ancha>
        {panel && <PanelAdmin />}
      </Hoja>

      <MiIA />

      {nubeDisponible && (
        <Tarjeta delay={0.15}>
          <h2 className="font-serif text-xl font-medium">Cuenta</h2>
          {email ? (
            <>
              <p className="mt-1 text-sm text-muted">{email}</p>
              <p className="mt-3 rounded-2xl bg-bg px-4 py-2.5 text-sm">{TEXTO_SYNC[estadoSync] ?? ""}</p>
              <button
                onClick={async () => { setSaliendo(true); await cerrarSesion(); setSaliendo(false); }}
                disabled={saliendo}
                className={`${btnSecundario} mt-3 w-full`}
              >
                {saliendo ? "Cerrando…" : "Cerrar sesión"}
              </button>
              <p className="mt-2 text-xs text-muted">Al cerrar sesión se limpia este dispositivo; tus datos siguen seguros en tu cuenta.</p>
              <div className="mt-5 border-t border-line pt-4">
                {eliminar === "no" && (
                  <button onClick={() => setEliminar("confirmar")} className="text-sm text-ember hover:underline">Eliminar mi cuenta</button>
                )}
                {eliminar !== "no" && (
                  <>
                    <p className="text-sm">¿Eliminar tu cuenta <b>{email}</b>?</p>
                    <p className="mt-1 text-xs text-muted">Se borran tu cuenta y todos tus datos de la nube y de este dispositivo. No se puede deshacer. Podrás crear una cuenta nueva con el mismo correo cuando quieras.</p>
                    {eliminar === "error" && <p className="mt-2 text-xs text-ember">No se pudo eliminar. Revisa tu internet e intenta de nuevo.</p>}
                    <div className="mt-3 flex gap-2">
                      <button
                        disabled={eliminar === "eliminando"}
                        onClick={async () => { setEliminar("eliminando"); try { await eliminarCuenta(); } catch { setEliminar("error"); } }}
                        className="h-11 flex-1 rounded-2xl bg-ember font-bold text-on-lime disabled:opacity-60"
                      >
                        {eliminar === "eliminando" ? "Eliminando…" : "Sí, eliminar"}
                      </button>
                      <button onClick={() => setEliminar("no")} className={`${btnSecundario} h-11 flex-1`}>Cancelar</button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">Tus datos solo están en este dispositivo. Si borras el navegador o cambias de cel, se pierden.</p>
              <button onClick={onCrearCuenta} className="mt-3 h-12 w-full rounded-2xl bg-lime font-display font-bold text-on-lime">Crear cuenta gratis</button>
            </>
          )}
        </Tarjeta>
      )}

      <Tarjeta delay={0.2}>
        {!confirmar ? (
          <button onClick={() => setConfirmar(true)} className="text-sm text-ember hover:underline">Borrar todos mis datos</button>
        ) : (
          <>
            <p className="text-sm text-muted">{email ? "Se borrará todo, también de la nube. No se puede deshacer." : "Se borrará todo de este dispositivo."}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { reset(); onBorrado?.(); }} className="h-11 flex-1 rounded-2xl bg-ember font-bold text-on-lime">Sí, borrar todo</button>
              <button onClick={() => setConfirmar(false)} className={`${btnSecundario} h-11 flex-1`}>Cancelar</button>
            </div>
          </>
        )}
      </Tarjeta>
      <p className="text-center text-xs text-muted lg:[column-span:all]">
        Brío v0.4 · Ponle brío a tu vida. · <a href="/conoce/" className="underline">Conoce Brío</a> · <a href="/privacidad.html" className="underline">Privacidad</a> · <a href="/terminos.html" className="underline">Términos</a> · <button onClick={() => setCreditos(true)} className="underline">Créditos de fotos</button>
      </p>
      <Hoja abierta={creditos} onClose={() => setCreditos(false)} titulo="Créditos de fotos">
        <p className="text-sm text-muted">Las fotos de platillos e ingredientes vienen de Wikimedia Commons con licencias libres, y algunas de TheMealDB. Datos de productos de Open Food Facts (ODbL). Gracias a sus autores.</p>
        <ul className="mt-3 text-xs">
          {CREDITOS.map((c) => (
            <li key={c.tipo + c.id} className="border-b border-line py-1.5 last:border-b-0">
              <a href={c.pagina} target="_blank" rel="noreferrer" className="hover:underline">{c.titulo}</a>
              <span className="block text-muted">{c.autor} · {c.licencia}</span>
            </li>
          ))}
        </ul>
      </Hoja>
    </div>
  );
}

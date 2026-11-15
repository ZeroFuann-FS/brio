import { useState } from "react";
import { MODELOS, probarKey, useMiIA, type ModeloId } from "../lib/miIA";
import { Tarjeta, btnPrimario, btnSecundario, inputCls } from "./ui";

/** "Trae tu propia IA": el usuario conecta su API key de Claude; se queda solo en este dispositivo. */
export default function MiIA() {
  const { key, modelo, guardar, borrar } = useMiIA();
  const [abierto, setAbierto] = useState(false);
  const [nueva, setNueva] = useState("");
  const [mod, setMod] = useState<ModeloId>(modelo);
  const [estado, setEstado] = useState<"idle" | "probando" | "error">("idle");
  const [error, setError] = useState("");

  const conectar = async () => {
    const k = (nueva.trim() || key || "").trim();
    if (!k) return;
    setEstado("probando");
    const err = await probarKey(k, mod);
    if (err) { setError(err); setEstado("error"); return; }
    guardar(k, mod); setNueva(""); setEstado("idle"); setAbierto(false);
  };

  return (
    <Tarjeta delay={0.13}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-xl font-medium">Tu IA <span className="text-sm font-normal text-muted">· opcional</span></h2>
        {key && <span className="lab !text-lime-ink">Conectada</span>}
      </div>
      <p className="mt-1 text-sm text-muted">
        Con tu propia key de Claude, Brío calcula tus comidas escribiendo normal y arma tu menú semanal. Tú pagas solo lo que usas, directo a Anthropic.
      </p>

      {key && !abierto && (
        <div className="mt-3 rounded-[14px] border border-line bg-bg px-4 py-3 text-sm">
          <p><b>{MODELOS.find((m) => m.id === modelo)?.t}</b> · key terminada en <span className="num">…{key.slice(-4)}</span></p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => { setMod(modelo); setAbierto(true); }} className={`${btnSecundario} h-10 text-sm`}>Cambiar</button>
            <button onClick={borrar} className="h-10 rounded-[14px] border border-line text-sm text-ember">Desconectar</button>
          </div>
        </div>
      )}

      {(!key || abierto) && (
        <div className="mt-3 space-y-3">
          {!key && !abierto ? (
            <button onClick={() => setAbierto(true)} className={`${btnSecundario} w-full`}>Conectar mi IA</button>
          ) : (
            <>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
                <li>Entra a <a className="underline" href="https://platform.claude.com" target="_blank" rel="noreferrer">platform.claude.com</a> y crea tu cuenta.</li>
                <li>En Billing carga saldo (mínimo $5 USD, es prepago).</li>
                <li>En API Keys crea una key y pégala aquí.</li>
              </ol>
              <input className={inputCls} type="password" autoComplete="off" spellCheck={false} placeholder={key ? "Deja vacío para conservar tu key actual" : "sk-ant-…"}
                value={nueva} onChange={(e) => { setNueva(e.target.value); setEstado("idle"); }} />
              <div className="space-y-1.5">
                {MODELOS.map((m) => (
                  <button key={m.id} onClick={() => setMod(m.id)} aria-pressed={mod === m.id}
                    className={`w-full rounded-[14px] border bg-surface px-4 py-2.5 text-left transition ${mod === m.id ? "border-line-strong shadow-[inset_0_0_0_1px_var(--line-strong)] dark:border-lime dark:shadow-[inset_0_0_0_1px_var(--lime)]" : "border-line"}`}>
                    <p className="font-medium">{m.t} <span className="text-sm font-normal text-muted">· {m.d}</span></p>
                    <p className="lab mt-0.5 !tracking-[0.06em]">{m.costo} (USD aprox.)</p>
                  </button>
                ))}
              </div>
              {estado === "error" && <p className="text-sm text-ember">{error}</p>}
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <button onClick={() => { setAbierto(false); setNueva(""); setEstado("idle"); }} className={btnSecundario}>Cancelar</button>
                <button onClick={conectar} disabled={estado === "probando" || (!nueva.trim() && !key)} className={btnPrimario}>
                  {estado === "probando" ? "Probando…" : "Guardar y probar"}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                Tu key se guarda solo en este dispositivo y Brío la usa para hablar directo con Claude; nunca la subimos a la nube. Úsala solo en dispositivos de confianza. Una suscripción de claude.ai (Pro/Max) no incluye API: es un servicio aparte.
              </p>
            </>
          )}
        </div>
      )}
    </Tarjeta>
  );
}

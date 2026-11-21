import { useState } from "react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
import { btnPrimario, ease, inputCls } from "./ui";
import Logo from "./Logo";
import { guardarConsentimiento } from "../lib/consentimiento";

function IconoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function Cuenta({ onOmitir, puedeOmitir = true }: { onOmitir: () => void; puedeOmitir?: boolean }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "google">("idle");
  const [error, setError] = useState<string | null>(null);
  const [acepto, setAcepto] = useState(false);

  const google = async () => {
    setError(null);
    guardarConsentimiento();
    setEstado("google");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) {
      setEstado("idle");
      setError(/provider is not enabled|Unsupported provider/i.test(error.message)
        ? "El acceso con Google aún no está activo. Usa tu correo por ahora."
        : "No pudimos conectar con Google. Intenta de nuevo.");
    }
  };

  const enviar = async () => {
    setError(null);
    guardarConsentimiento();
    setEstado("enviando");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    if (error) {
      setEstado("idle");
      setError(/rate limit|security purposes|seconds/i.test(error.message)
        ? "Se enviaron muchos correos. Espera unos minutos e intenta de nuevo."
        : "No pudimos enviar el correo. Revisa que esté bien escrito.");
    } else setEstado("enviado");
  };

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <motion.div className="mx-auto flex h-full max-w-[440px] flex-col px-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pt-[max(env(safe-area-inset-top),1.25rem)]"><Logo className="text-[30px]" /></div>

      <div className="flex flex-1 flex-col justify-center py-8">
        <motion.h1 className="font-serif text-[clamp(36px,10vw,48px)] font-medium leading-[1.02] tracking-tight" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ease }}>
          Guarda tu <em className="resalta font-normal">progreso.</em>
        </motion.h1>
        <motion.p className="mt-3 text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          Crea tu cuenta gratis para no perder nada y usar Brío en el celular y en la compu.
        </motion.p>

        {estado === "enviado" ? (
          <motion.div className="mt-8 rounded-[20px] border border-line bg-surface p-5" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="font-serif text-2xl font-medium">Revisa tu correo</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Te mandamos un link a <b className="text-ink">{email.trim()}</b>. Ábrelo en este dispositivo y entrarás directo. Si no lo ves, revisa spam.
            </p>
            <button onClick={() => setEstado("idle")} className="mt-4 text-sm text-lime-ink hover:underline">Usar otro correo</button>
          </motion.div>
        ) : (
          <motion.div className="mt-8 space-y-4" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, ease }}>
            <label htmlFor="acepto-privacidad" className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-line bg-surface px-4 py-3 text-sm leading-snug text-muted">
              <input id="acepto-privacidad" type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-lime" />
              <span>
                Acepto el <a href="/privacidad.html" target="_blank" rel="noopener" className="text-ink underline">aviso de privacidad</a> y
                los <a href="/terminos.html" target="_blank" rel="noopener" className="text-ink underline">términos</a>, y doy mi consentimiento
                para que Brío guarde mis datos de salud (peso, medidas, comidas y entrenos).
              </span>
            </label>
            <button
              onClick={google}
              disabled={!acepto || estado === "google"}
              className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[14px] border border-line-strong bg-surface font-semibold text-ink transition active:scale-[0.98] disabled:opacity-60 dark:border-white dark:bg-white dark:text-[#1f1f1f]"
            >
              <IconoGoogle /> {estado === "google" ? "Abriendo Google…" : "Continuar con Google"}
            </button>

            <div className="lab flex items-center gap-3"><span className="h-px flex-1 bg-line" />o con tu correo<span className="h-px flex-1 bg-line" /></div>

            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (emailValido) enviar(); }}>
              <input className={inputCls} type="email" inputMode="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" disabled={!acepto || !emailValido || estado === "enviando"} className={`${btnPrimario} h-[54px] w-full`}>
                {estado === "enviando" ? "Enviando…" : "Enviarme un link de acceso"}
              </button>
            </form>
            {error && <p className="rounded-2xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p>}
          </motion.div>
        )}
      </div>

      <div className="pb-[max(env(safe-area-inset-bottom),1.5rem)] text-center">
        {puedeOmitir && (
          <button onClick={onOmitir} className="py-2 text-sm text-muted hover:text-ink">Ahora no, seguir sin cuenta</button>
        )}
        <p className="mt-2 text-[11px] text-muted">Sin contraseñas. Tus datos son privados: solo tú puedes verlos. <a href="/privacidad.html" className="underline">Privacidad</a> · <a href="/terminos.html" className="underline">Términos</a></p>
      </div>
    </motion.div>
  );
}

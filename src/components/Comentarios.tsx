import { useEffect, useState } from "react";
import { nubeDisponible, supabase } from "../lib/supabase";
import { btnPrimario, inputCls } from "./ui";

const TIPOS = [
  { id: "idea", t: "Tengo una idea" },
  { id: "error", t: "Algo falla" },
  { id: "gusta", t: "Algo me gusta" },
  { id: "otro", t: "Otro" },
] as const;
const SECCIONES = ["Hoy", "Comida", "Entreno", "Progreso", "Perfil", "General"];

function dispositivo() {
  const ua = navigator.userAgent;
  const so = /iphone|ipad/i.test(ua) ? "iPhone/iPad" : /android/i.test(ua) ? "Android" : /mac/i.test(ua) ? "Mac" : /windows/i.test(ua) ? "Windows" : "Otro";
  return `${so} · ${window.innerWidth < 768 ? "celular" : "pantalla grande"}`;
}

/** Formulario para que cualquiera mande sugerencias, errores o lo que le gusta. */
export default function Comentarios() {
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["id"]>("idea");
  const [texto, setTexto] = useState("");
  const [seccion, setSeccion] = useState("General");
  const [estrellas, setEstrellas] = useState(0);
  const [contacto, setContacto] = useState("");
  const [cuenta, setCuenta] = useState(false);
  const [estado, setEstado] = useState<"" | "enviando" | "listo" | "error">("");
  useEffect(() => { if (nubeDisponible) supabase.auth.getSession().then(({ data }) => setCuenta(!!data.session)); }, []);

  const enviar = async () => {
    if (texto.trim().length < 3) return;
    setEstado("enviando");
    const { data } = await supabase.auth.getSession();
    const { error } = await supabase.from("comentarios").insert({
      tipo, texto: texto.trim().slice(0, 2000), seccion, calificacion: estrellas || null,
      contacto: contacto.trim() || null, dispositivo: dispositivo(), user_id: data.session?.user.id ?? null,
    });
    if (error) { setEstado("error"); return; }
    setEstado("listo"); setTexto(""); setEstrellas(0); setContacto("");
  };

  if (!nubeDisponible) return <p className="text-sm text-muted">Los comentarios necesitan conexión.</p>;
  if (estado === "listo") return (
    <div className="rounded-[16px] border border-lime/60 bg-lime/10 p-4">
      <p className="font-medium">¡Gracias! Lo voy a leer.</p>
      <p className="mt-1 text-sm text-muted">Cada comentario ayuda a que Brío sea mejor para todos.</p>
      <button onClick={() => setEstado("")} className="lab mt-2 !text-lime-ink hover:underline">Enviar otro</button>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {TIPOS.map((t) => <button key={t.id} onClick={() => setTipo(t.id)} aria-pressed={tipo === t.id}
          className={`rounded-full border px-3.5 py-1.5 text-sm ${tipo === t.id ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>{t.t}</button>)}
      </div>
      <textarea rows={4} maxLength={2000} className={`${inputCls} resize-none`} value={texto} onChange={(e) => setTexto(e.target.value)}
        placeholder={tipo === "error" ? "¿Qué pasó y qué estabas haciendo? Ej. Al registrar una receta no se descontó de la despensa." : tipo === "gusta" ? "¿Qué te gusta? Así sé qué no tocar." : "¿Qué te gustaría que hiciera Brío?"} />
      <div className="grid grid-cols-2 gap-2">
        <label className="block"><span className="lab mb-1 block">Sección</span>
          <select className={`${inputCls} py-2.5`} value={seccion} onChange={(e) => setSeccion(e.target.value)}>{SECCIONES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <div><span className="lab mb-1 block">¿Qué tanto te gusta Brío?</span>
          <div className="flex h-[46px] items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setEstrellas(n === estrellas ? 0 : n)} aria-label={`${n} de 5`}
              className={`text-2xl leading-none transition ${n <= estrellas ? "text-lime-ink" : "text-track"}`}>★</button>)}
          </div>
        </div>
      </div>
      {!cuenta && (
        <label className="block"><span className="lab mb-1 block">¿Cómo te contacto? (opcional)</span>
          <input className={inputCls} maxLength={120} value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Correo o usuario" /></label>
      )}
      {estado === "error" && <p className="text-sm text-ember">No se pudo enviar. Revisa tu conexión o intenta en un rato.</p>}
      <button onClick={enviar} disabled={texto.trim().length < 3 || estado === "enviando"} className={`${btnPrimario} w-full`}>{estado === "enviando" ? "Enviando…" : "Enviar comentario"}</button>
      <p className="text-xs text-muted">{cuenta ? "Se envía con tu cuenta para poder responderte si hace falta." : "Puedes enviarlo sin cuenta."} Se incluye el tipo de dispositivo para entender errores.</p>
    </div>
  );
}

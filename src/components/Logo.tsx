import { motion, useReducedMotion } from "motion/react";

type Props = {
  className?: string;
  animate?: boolean;
  delay?: number;
};

const PARTICULAS = Array.from({ length: 12 }, (_, i) => {
  const ang = (i / 12) * Math.PI * 2;
  const dist = 0.35 + (i % 3) * 0.12;
  return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, s: 0.04 + (i % 2) * 0.03 };
});

/** "brío" donde la tilde de la í es una chispa de energía. */
export default function Logo({ className = "text-7xl", animate = false, delay = 0 }: Props) {
  const reduce = useReducedMotion();
  const anim = animate && !reduce;
  const letras = ["b", "r", "ı", "o"];
  const chispaDelay = delay + 0.55;

  return (
    <span
      className={`relative inline-flex items-baseline font-display font-extrabold leading-none tracking-tight select-none ${className}`}
      aria-label="brío"
      role="img"
    >
      {letras.map((l, i) => (
        <motion.span
          key={i}
          className={i === 2 ? "relative inline-block" : "inline-block"}
          initial={anim ? { y: "0.6em", opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: delay + i * 0.08, type: "spring", stiffness: 260, damping: 18 }}
        >
          {l}
          {i === 2 && (
            <span className="pointer-events-none absolute left-1/2 top-[-0.02em] h-[0.42em] w-[0.3em] -translate-x-[18%]">
              {/* resplandor */}
              <motion.span
                className="absolute inset-[-60%] rounded-full bg-lime/30 blur-xl"
                initial={anim ? { opacity: 0, scale: 0.2 } : false}
                animate={anim ? { opacity: [0, 1, 0.45], scale: [0.2, 1.4, 1] } : { opacity: 0.45 }}
                transition={{ delay: chispaDelay + 0.1, duration: 0.9 }}
              />
              {/* chispa = tilde */}
              <motion.svg
                viewBox="0 0 20 28"
                className="relative h-full w-full drop-shadow-[0_0_10px_rgba(198,244,50,0.7)]"
                initial={anim ? { y: "-1.2em", x: "0.6em", opacity: 0, rotate: -25, scale: 0.4 } : false}
                animate={{ y: 0, x: 0, opacity: 1, rotate: 0, scale: 1 }}
                transition={{ delay: chispaDelay, type: "spring", stiffness: 380, damping: 14 }}
              >
                <path
                  d="M4 26 C1 22 3 17 7 12 L15 2 C17 0 19.5 2 18.5 4 L12.5 20 C10.5 25 7 28 4 26 Z"
                  fill="var(--color-lime)"
                />
              </motion.svg>
              {/* estallido */}
              {anim && PARTICULAS.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 rounded-full bg-lime"
                  style={{ width: `${p.s}em`, height: `${p.s}em` }}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{ x: `${p.x}em`, y: `${p.y}em`, opacity: [0, 1, 0] }}
                  transition={{ delay: chispaDelay + 0.12, duration: 0.8, ease: "easeOut" }}
                />
              ))}
            </span>
          )}
        </motion.span>
      ))}
    </span>
  );
}

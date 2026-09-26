import { useEffect, useRef, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { ASSETS, CONFIG } from "@/lib/content";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Leyendo navegador",
    at: CONFIG.timings.step1,
    progress: 33,
    status: "Leyendo navegador…",
    logs: [
      "› motor: chromium/blink detectado",
      "› idioma: es-ES · zona horaria calculada",
      "› almacenamiento local disponible",
    ],
  },
  {
    title: "Analizando conexión",
    at: CONFIG.timings.step2,
    progress: 66,
    status: "Analizando conexión…",
    logs: [
      "› ping 34 ms · descarga 84.2 Mbps",
      "› latencia estable · sin pérdida de paquetes",
      "› ip verificada contra listas de seguridad",
    ],
  },
  {
    title: "Comparando registro",
    at: CONFIG.timings.step3,
    progress: 100,
    status: "Verificación completa",
    logs: [
      "› buscando registro existente…",
      "› sin bloqueos activos",
      "› acceso autorizado · preparando destino",
    ],
  },
];

export default function VerificationGate({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(6);
  const [status, setStatus] = useState("Iniciando…");
  const [done, setDone] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [hidden, setHidden] = useState(false);
  const finished = useRef(false);
  const timers = useRef<number[]>([]);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach((id) => window.clearTimeout(id));
    setProgress(100);
    setStatus("Listo");
    setDone(3);
    document.body.classList.remove("is-loading");
    setHidden(true);
    window.setTimeout(() => onFinish(), 450);
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setDone(3);
      setLogs(STEPS.flatMap((s) => s.logs));
      finish();
      return;
    }

    STEPS.forEach((step, index) => {
      timers.current.push(
        window.setTimeout(() => {
          setProgress(step.progress);
          setStatus(step.status);
          setDone(index + 1);
          step.logs.forEach((line, i) => {
            timers.current.push(
              window.setTimeout(() => setLogs((prev) => [...prev, line]), i * 220),
            );
          });
        }, step.at),
      );
    });

    timers.current.push(
      window.setTimeout(() => {
        if (CONFIG.autoRedirect) {
          window.location.href = `https://${CONFIG.discordInvite}`;
        } else {
          finish();
        }
      }, CONFIG.timings.step3 + CONFIG.timings.finish),
    );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      timers.current.forEach((id) => window.clearTimeout(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center bg-[#08080e]/88 p-5 backdrop-blur-xl",
        "transition-opacity duration-500 ease-out",
        hidden && "pointer-events-none opacity-0",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,rgba(255,0,66,0.22),transparent_62%)] blur-3xl motion-safe:animate-[float_9s_ease-in-out_infinite]"
      />

      <div className="relative w-full max-w-[460px] animate-[rise_.55s_cubic-bezier(.23,1,.32,1)_both] overflow-hidden rounded-3xl border border-white/8 bg-[linear-gradient(180deg,#14131d_0%,#12111a_100%)] px-7 pb-7 pt-9 text-center shadow-[0_10px_30px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.04)]">
        <span className="absolute inset-x-0 top-0 h-[3px] bg-brand-gradient shadow-[0_0_12px_#ff0042]" />

        <div className="relative mx-auto mb-4 flex h-[78px] w-[78px] items-center justify-center overflow-hidden rounded-full border-2 border-brand bg-brand/10 shadow-[0_0_22px_rgba(255,0,66,.42)] motion-safe:animate-[glow_2.6s_ease-in-out_infinite]">
          <img src={ASSETS.logoMark} alt="Imperio Shop" className="h-full w-full object-cover p-2" />
        </div>

        <p className="font-display text-[11.5px] font-semibold uppercase tracking-[2px] text-white/35">
          Acceso seguro
        </p>
        <h1 id="gate-title" className="mt-2 font-display text-[23px] font-bold tracking-[-0.2px] text-white">
          Verificando tu sesión
        </h1>
        <p className="mt-2.5 mb-5 text-[13.5px] leading-relaxed text-muted-foreground">
          Estamos comprobando tu navegador y tu conexión antes de llevarte al centro de ventas de{" "}
          <strong className="font-medium text-white/80">Imperio Shop</strong>. No cierres esta ventana.
        </p>

        {/* Barra de progreso */}
        <div
          className="h-[5px] w-full overflow-hidden rounded-full bg-white/[0.08]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Progreso de verificación"
        >
          <div
            className="relative h-full rounded-full bg-brand-gradient shadow-[0_0_10px_#ff0042] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <span className="absolute inset-0 -translate-x-full animate-[shine_1.6s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)]" />
          </div>
        </div>

        <div className="mt-2.5 mb-5 flex items-center justify-between font-mono text-[11.5px]">
          <span className="text-white/30">{Math.round(progress)}%</span>
          <span className="text-brand-soft">{status}</span>
        </div>

        {/* Pasos */}
        <div className="mb-4 flex flex-col gap-2.5 text-left">
          {STEPS.map((step, index) => {
            const active = done > index;
            return (
              <div
                key={step.title}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] transition-all duration-300",
                  active
                    ? "translate-x-0.5 border-brand/40 bg-[linear-gradient(90deg,rgba(255,0,66,.14),rgba(255,123,0,.05))] text-white"
                    : "border-white/8 bg-white/[0.02] text-white/30",
                )}
              >
                <span
                  className={cn(
                    "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border transition-all duration-300",
                    active
                      ? "border-transparent bg-brand-gradient shadow-[0_0_14px_rgba(255,0,66,.55)]"
                      : "border-white/15 bg-white/[0.04]",
                  )}
                >
                  <Check
                    className={cn(
                      "h-3 w-3 text-white transition-all duration-300",
                      active ? "scale-100 opacity-100" : "scale-50 opacity-0",
                    )}
                    strokeWidth={3}
                  />
                </span>
                <span>{step.title}</span>
              </div>
            );
          })}
        </div>

        {/* Registro */}
        <pre className="mb-4 min-h-[16px] overflow-hidden whitespace-pre-wrap break-words text-left font-mono text-[11px] leading-[1.7] text-white/30">
          {logs.join("\n")}
          <span className="text-brand-soft motion-safe:animate-[blink_1s_steps(1)_infinite]">▌</span>
        </pre>

        <button
          type="button"
          onClick={finish}
          className="w-full rounded-full bg-brand-gradient px-6 py-3 font-display text-[14.5px] font-semibold text-white shadow-[0_8px_22px_rgba(255,0,66,.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(255,0,66,.42)] active:scale-[.98]"
        >
          Ver la tienda ahora
        </button>

        <p className="mt-4 flex items-center justify-center gap-2 text-[11.5px] text-white/30">
          <ShieldCheck className="h-4 w-4 text-emerald-400" strokeWidth={1.8} />
          Conexión cifrada · Verificación local, no guardamos datos personales
        </p>
      </div>
    </div>
  );
}
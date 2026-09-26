import { useEffect, useMemo, useState } from "react";
import { Bot, Check, Power } from "lucide-react";
import { ASSETS, BOT_FEATURES, CONSOLE_COMMANDS, DISCORD_URL, SERVICES, TICKER } from "@/lib/content";
import { Eyebrow, GlowCard, Icon, Marquee, Reveal, SectionHeading, useInView, type IconName } from "@/components/primitives";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  ok: "text-emerald-400",
  warn: "text-amber-400",
  key: "text-brand-soft",
  dim: "text-white/35",
  plain: "",
};

/* --------------------------------------------------------------- servicios */

export function Services() {
  return (
    <section id="servicios" className="relative py-24">
      <div className="container">
        <SectionHeading
          eyebrow="Servicios"
          title="Todo lo que tu comunidad necesita"
          text="Un solo proveedor para el bot, el hosting y la infraestructura. Menos proveedores, menos problemas, más velocidad."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 80} as="div">
              <GlowCard className="h-full">
                <span className="relative mb-4 grid h-[50px] w-[50px] place-items-center rounded-[15px] border border-brand/35 bg-brand/12 text-brand-soft shadow-[0_0_20px_rgba(255,0,66,.22)]">
                  <Icon name={service.icon as IconName} className="h-6 w-6" />
                </span>
                <h3 className="mb-2 font-display text-[18.5px] font-semibold tracking-[-0.2px] text-white">
                  {service.title}
                </h3>
                <p className="mb-4 text-[14.5px] leading-relaxed text-muted-foreground">{service.text}</p>
                <ul className="grid gap-2 text-[13.5px] text-white/70">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-center gap-2.5">
                      <Check className="h-[15px] w-[15px] shrink-0 text-brand-soft" strokeWidth={2.6} />
                      {point}
                    </li>
                  ))}
                </ul>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ panel del bot */

export function BotPanel() {
  const [active, setActive] = useState(0);
  const [written, setWritten] = useState(0);
  const [started, setStarted] = useState(false);
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  const lines = useMemo(() => CONSOLE_COMMANDS[active].lines, [active]);

  // La animación arranca al ver la consola y se repite al cambiar de comando
  useEffect(() => {
    if (!inView) return;
    setStarted(true);
  }, [inView]);

  useEffect(() => {
    if (!started) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setWritten(lines.length);
      return;
    }
    setWritten(0);
    const timers = lines.map((_, i) =>
      window.setTimeout(() => setWritten((prev) => Math.max(prev, i + 1)), i * 190),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, started, lines.length]);

  return (
    <section
      id="panel"
      className="relative border-y border-white/8 bg-[linear-gradient(180deg,rgba(255,0,66,.045),transparent_60%)] py-24"
    >
      <div className="container grid items-center gap-14 lg:grid-cols-2">
        <div>
          <Reveal>
            <Eyebrow>Panel del bot</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-bold leading-[1.15] tracking-[-0.8px] text-white sm:text-4xl">
              Un bot que se entiende solo
            </h2>
            <p className="mt-3.5 text-[15.5px] leading-relaxed text-muted-foreground">
              Comandos claros, respuestas rápidas y un panel privado para que veas ventas, tickets y
              estado del hosting sin depender de nadie.
            </p>
          </Reveal>

          <ul className="mt-7 grid gap-4">
            {BOT_FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 70} as="li">
                <div className="flex items-start gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/[0.04] text-brand-soft">
                    <Icon name={feature.icon as IconName} className="h-[19px] w-[19px]" />
                  </span>
                  <div>
                    <strong className="block font-display text-[15.5px] font-semibold text-white">
                      {feature.title}
                    </strong>
                    <span className="text-[13.5px] leading-relaxed text-muted-foreground">
                      {feature.text}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120}>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener"
              className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-brand-gradient px-6 py-3 font-display text-[14.5px] font-semibold text-white shadow-[0_8px_22px_rgba(255,0,66,.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(255,0,66,.42)] active:scale-[.97]"
            >
              <Bot className="h-[18px] w-[18px]" strokeWidth={1.8} />
              Probar el bot ahora
            </a>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <div
            ref={ref}
            className="overflow-hidden rounded-2xl border border-white/15 bg-[#0e0d16] shadow-[0_26px_56px_rgba(0,0,0,.55)]"
          >
            <div
              role="tablist"
              aria-label="Comandos de ejemplo"
              className="flex gap-1.5 overflow-x-auto border-b border-white/8 px-3 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {CONSOLE_COMMANDS.map((command, i) => (
                <button
                  key={command.cmd}
                  role="tab"
                  type="button"
                  aria-selected={active === i}
                  onClick={() => setActive(i)}
                  className={cn(
                    "shrink-0 rounded-t-[10px] border border-b-0 px-3.5 py-2.5 font-mono text-[12.5px] transition-colors duration-150",
                    active === i
                      ? "border-white/15 bg-[#131221] text-white shadow-[inset_0_2px_0_0_#ff0042]"
                      : "border-transparent text-white/35 hover:bg-white/[0.04] hover:text-white/70",
                  )}
                >
                  {command.cmd}
                </button>
              ))}
            </div>

            <div className="bg-[#131221]">
              <div className="flex items-center gap-1.5 border-b border-white/8 px-3.5 py-2.5">
                <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
                <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
                <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
                <span className="ml-2 font-mono text-[11px] text-white/35">imperio-bot · consola</span>
              </div>

              <pre className="min-h-[240px] whitespace-pre-wrap break-words px-4 py-4 font-mono text-[12.5px] leading-[1.85] text-[#b9c6d8]">
                {lines.slice(0, written).map((line, i) => (
                  <span key={`${active}-${i}`} className={cn("block", TONE[line.tone ?? "plain"])}>
                    {line.text}
                  </span>
                ))}
              </pre>
            </div>

            <div className="flex flex-wrap gap-4 border-t border-white/8 bg-[#0e0d16] px-4 py-3 font-mono text-[11.5px] text-white/35">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                41.8 ms
              </span>
              <span>shard 1/1</span>
              <span>uptime 27 d</span>
              <span className="ml-auto inline-flex items-center gap-1.5">
                <Power className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
                operativo
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- cinta/CTA */

export function TickerStrip() {
  return (
    <div className="relative border-y border-white/8 bg-[linear-gradient(90deg,rgba(255,0,66,.07),rgba(255,123,0,.05))] py-4">
      <Marquee
        items={TICKER}
        itemClassName="font-display text-sm font-semibold tracking-[3px] text-white/70"
      />
    </div>
  );
}

export function BannerCta() {
  return (
    <section className="border-b border-white/8 bg-[linear-gradient(90deg,rgba(255,0,66,.12),rgba(255,123,0,.07))] py-9">
      <Reveal className="container flex flex-wrap items-center gap-7">
        <img
          src={ASSETS.banner}
          alt="Imperio Shop"
          className="w-full max-w-[340px] rounded-2xl border border-white/15 shadow-[0_8px_22px_rgba(0,0,0,.38)] sm:w-[300px]"
        />
        <div className="min-w-[240px] flex-1">
          <h2 className="font-display text-[clamp(1.3rem,2.4vw,1.85rem)] font-bold tracking-[-0.5px] text-white">
            ¿Listo para montar tu imperio?
          </h2>
          <p className="mt-1.5 text-[14.5px] text-muted-foreground">
            Cuéntanos qué necesitas y te preparamos una propuesta clara en minutos.
          </p>
        </div>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2.5 rounded-full bg-brand-gradient px-7 py-[15px] font-display text-[15.5px] font-semibold text-white shadow-[0_8px_22px_rgba(255,0,66,.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(255,0,66,.42)] active:scale-[.97]"
        >
          <Bot className="h-[18px] w-[18px]" strokeWidth={1.8} />
          Entrar al Discord
        </a>
      </Reveal>
    </section>
  );
}

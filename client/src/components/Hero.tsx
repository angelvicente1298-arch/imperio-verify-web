import { useEffect, useState } from "react";
import { Bot, Clock, ShoppingCart, Ticket, Zap } from "lucide-react";
import { ASSETS, DISCORD_URL, STATS, TRUST } from "@/lib/content";
import { CountUp, Eyebrow, Icon, Reveal, useInView, type IconName } from "@/components/primitives";
import { cn } from "@/lib/utils";

/* --------------------------------------------------- simulador de Discord */

function DiscordMock() {
  const { ref, inView } = useInView<HTMLDivElement>(0.35);
  const [typed, setTyped] = useState("");
  const [showReply, setShowReply] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const command = "!tienda";
    if (reduce) {
      setTyped(command);
      setShowReply(true);
      return;
    }
    let i = 0;
    const interval = window.setInterval(() => {
      i += 1;
      setTyped(command.slice(0, i));
      if (i >= command.length) {
        window.clearInterval(interval);
        window.setTimeout(() => setShowReply(true), 300);
      }
    }, 110);
    return () => window.clearInterval(interval);
  }, [inView]);

  const typing = typed.length > 0 && typed.length < "!tienda".length;

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-white/8 bg-[#0f0e16]"
    >
      <div className="flex items-center gap-2.5 border-b border-white/8 bg-[#131221] px-3.5 py-2.5">
        <img
          src={ASSETS.logoMark}
          alt=""
          className="h-[26px] w-[26px] rounded-full bg-brand/15 p-1"
        />
        <span className="font-display text-[13.5px] font-semibold text-white/90">Imperio Bot</span>
        <span className="rounded bg-[#5865f2] px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.5px] text-white">
          BOT
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] text-white/40 before:h-[7px] before:w-[7px] before:rounded-full before:bg-emerald-400 before:content-['']">
          en línea
        </span>
      </div>

      <div className="flex min-h-[214px] flex-col gap-3 px-3.5 py-4">
        <div className="flex gap-2.5">
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-[#2f2d40] text-[10.5px] font-bold text-white/70">
            tú
          </span>
          <p className="font-mono text-[13px] text-white/80">
            {typed}
            {typing && <span className="text-brand-soft">▍</span>}
          </p>
        </div>

        <div
          className={cn(
            "flex gap-2.5 transition-all duration-500 ease-out",
            showReply ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0",
          )}
        >
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-brand-gradient text-[10.5px] font-bold text-white">
            IB
          </span>
          <div className="min-w-0 text-[13px] leading-relaxed text-white/75">
            <p className="font-medium text-white/90">Bienvenido al Imperio Shop</p>
            <div className="mt-2 rounded-[10px] border-l-[3px] border-brand bg-white/[0.045] px-3.5 py-2.5">
              <span className="mb-1.5 block font-display text-[12.5px] font-semibold text-white">
                Catálogo disponible
              </span>
              <ul className="grid gap-0.5 text-[12px] text-white/55">
                <li className="before:mr-2 before:text-brand-soft before:content-['•']">Bots personalizados</li>
                <li className="before:mr-2 before:text-brand-soft before:content-['•']">Hosting para bots</li>
                <li className="before:mr-2 before:text-brand-soft before:content-['•']">Servidores VPS</li>
              </ul>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="rounded-[7px] bg-brand-gradient px-3 py-1 text-[11.5px] font-semibold text-white">
                  Abrir ticket
                </span>
                <span className="rounded-[7px] border border-white/15 bg-white/[0.06] px-3 py-1 text-[11.5px] font-medium text-white/80">
                  Ver planes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-3.5 mb-3.5 flex items-center gap-2.5 rounded-full border border-white/8 bg-white/5 px-3.5 py-2">
        <span className="flex-1 text-[12.5px] text-white/35">Escribe un comando…</span>
        <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-brand-gradient">
          <ShoppingCart className="h-3.5 w-3.5 text-white" strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ hero */

export default function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden pb-24 pt-[124px] lg:pb-28">
      {/* fondo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-32 -top-40 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(255,0,66,.5),transparent_65%)] opacity-55 blur-[70px] motion-safe:animate-[float_12s_ease-in-out_infinite]" />
        <span className="absolute -bottom-44 -right-28 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,123,0,.36),transparent_65%)] opacity-55 blur-[70px] motion-safe:animate-[float_14s_ease-in-out_infinite_reverse]" />
        <img
          src={ASSETS.logoWatermark}
          alt=""
          className="absolute left-1/2 top-[46%] w-[760px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-[2px]"
        />
      </div>

      <div className="container relative grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
        {/* columna de texto */}
        <div>
          <Eyebrow tone="live">Delivery inmediato · Soporte 24/7</Eyebrow>

          <h1 className="mt-5 font-display text-[clamp(2.15rem,4.6vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-1.2px] text-white">
            Bots, hosting y servidores
            <span className="block text-gradient-brand">con nivel de imperio</span>
          </h1>

          <p className="mt-4 max-w-[560px] text-[16.5px] leading-[1.72] text-muted-foreground">
            Desarrollamos bots personalizados para Discord, montamos tu hosting con panel propio y te
            damos servidores rápidos, estables y listos para escalar. Todo con activación inmediata y
            acompañamiento real.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#planes"
              className="inline-flex items-center gap-2.5 rounded-full bg-brand-gradient px-7 py-[15px] font-display text-[15.5px] font-semibold text-white shadow-[0_8px_22px_rgba(255,0,66,.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(255,0,66,.42)] active:scale-[.97]"
            >
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.8} />
              Ver planes y precios
            </a>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-7 py-[15px] font-display text-[15.5px] font-semibold text-white transition duration-200 ease-out hover:-translate-y-0.5 hover:border-brand/50 hover:bg-white/[0.09] active:scale-[.97]"
            >
              <Bot className="h-[18px] w-[18px]" strokeWidth={1.8} />
              Hablar con soporte
            </a>
          </div>

          <ul className="mt-6 mb-7 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-white/70">
            {TRUST.map((item) => (
              <li key={item.label} className="inline-flex items-center gap-2">
                <Icon name={item.icon as IconName} className="h-[17px] w-[17px] text-brand-soft" />
                {item.label}
              </li>
            ))}
          </ul>

          <Reveal>
            <dl className="grid grid-cols-2 gap-x-3.5 gap-y-5 rounded-2xl border border-white/8 bg-white/[0.025] px-[18px] py-[18px] shadow-[0_8px_22px_rgba(0,0,0,.38)] sm:grid-cols-4">
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className={cn(
                    "border-white/8 px-3.5",
                    i % 2 !== 0 ? "border-l" : "",
                    "sm:border-l sm:first:border-l-0 sm:first:pl-0",
                    i === 2 && "max-sm:border-l-0 max-sm:pl-0",
                  )}
                >
                  <dd className="font-display text-[25px] font-bold tracking-[-0.6px] text-gradient-brand">
                    <CountUp value={stat.value} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
                  </dd>
                  <dt className="mt-0.5 text-[11.5px] leading-[1.35] text-white/35">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* columna visual */}
        <Reveal delay={120} className="relative">
          <div className="group relative overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(180deg,#14131d,#100f18)] shadow-[0_26px_60px_rgba(0,0,0,.55)] transition-transform duration-700 ease-out lg:[transform:perspective(1400px)_rotateY(-4deg)_rotateX(1.5deg)] lg:hover:[transform:perspective(1400px)_rotateY(0deg)_rotateX(0deg)]">
            <div className="flex items-center gap-1.5 border-b border-white/8 bg-white/[0.03] px-3.5 py-2.5">
              <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
              <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
              <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
              <span className="ml-2.5 rounded-full border border-white/8 bg-black/35 px-3 py-0.5 font-mono text-[11px] text-white/35">
                imperioshop.discord.app
              </span>
            </div>

            <img
              src={ASSETS.banner}
              srcSet={`${ASSETS.banner} 680w, ${ASSETS.banner2x} 1360w`}
              sizes="(max-width: 1024px) 100vw, 520px"
              alt="Imperio Shop: bots, hosting y servidores"
              className="w-full border-b border-white/8"
            />

            <div className="p-4">
              <DiscordMock />
            </div>
          </div>

          <div className="absolute left-[-26px] top-[8%] hidden items-center gap-2.5 rounded-2xl border border-white/15 bg-[#14131d]/95 px-4 py-2.5 text-[11.5px] text-white/40 shadow-[0_16px_34px_rgba(0,0,0,.5)] backdrop-blur motion-safe:animate-[bob_5.5s_ease-in-out_infinite] lg:flex">
            <Zap className="h-5 w-5 text-brand-soft" strokeWidth={1.8} />
            <span>
              <strong className="block font-display text-[13px] font-semibold text-white">
                Deploy listo
              </strong>
              en 2 min 41 s
            </span>
          </div>

          <div className="absolute bottom-[6%] right-[-22px] hidden items-center gap-2.5 rounded-2xl border border-white/15 bg-[#14131d]/95 px-4 py-2.5 text-[11.5px] text-white/40 shadow-[0_16px_34px_rgba(0,0,0,.5)] backdrop-blur motion-safe:animate-[bob_6.5s_ease-in-out_infinite_reverse] lg:flex">
            <Ticket className="h-5 w-5 text-brand-soft" strokeWidth={1.8} />
            <span>
              <strong className="block font-display text-[13px] font-semibold text-white">
                Ticket #2481
              </strong>
              resuelto hoy
            </span>
          </div>

          <div className="absolute -bottom-5 left-6 hidden items-center gap-2 rounded-full border border-white/10 bg-[#14131d]/95 px-4 py-2 text-[11.5px] text-white/50 shadow-[0_16px_34px_rgba(0,0,0,.5)] backdrop-blur xl:flex">
            <Clock className="h-4 w-4 text-emerald-400" strokeWidth={1.8} />
            Monitoreo activo 24/7
          </div>
        </Reveal>
      </div>
    </section>
  );
}
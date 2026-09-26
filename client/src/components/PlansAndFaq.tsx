import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Copy,
  Headphones,
  Rocket,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import { ASSETS, CONFIG, DISCORD_URL, FAQ, FOOTER_LINKS, PLANS, TECH } from "@/lib/content";
import { Eyebrow, Reveal, SectionHeading } from "@/components/primitives";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------- tecnología */

export function TechStrip() {
  return (
    <section className="border-y border-white/8 py-8" aria-label="Tecnologías que usamos">
      <div className="container flex flex-wrap justify-center gap-x-9 gap-y-3.5">
        {TECH.map((tech) => (
          <span
            key={tech}
            className="font-display text-sm font-semibold uppercase tracking-[1.6px] text-white/30 transition-colors duration-200 hover:text-white/85"
          >
            {tech}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ planes */

export function Plans() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <section id="planes" className="relative py-24">
      <div className="container">
        <SectionHeading eyebrow="Planes" title="Precios claros, sin sorpresas" text="Elige el punto de partida; puedes cambiar de plan cuando quieras.">
          <div
            role="group"
            aria-label="Ciclo de facturación"
            className="mt-6 inline-flex gap-1 rounded-full border border-white/15 bg-white/[0.035] p-1"
          >
            {(["monthly", "yearly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCycle(value)}
                aria-pressed={cycle === value}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-[13.5px] font-medium transition-all duration-200 ease-out",
                  cycle === value
                    ? "bg-brand-gradient text-white shadow-[0_6px_18px_rgba(255,0,66,.3)]"
                    : "text-muted-foreground hover:text-white",
                )}
              >
                {value === "monthly" ? "Mensual" : "Anual"}
                {value === "yearly" && (
                  <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-semibold">
                    -20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </SectionHeading>

        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 90}>
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-3xl border p-7 transition duration-300 ease-out hover:-translate-y-1.5",
                  plan.featured
                    ? "border-brand/60 bg-[linear-gradient(180deg,rgba(255,0,66,.13),rgba(255,123,0,.03))] shadow-[0_26px_56px_-16px_rgba(255,0,66,.35)]"
                    : "border-white/8 bg-white/[0.035] hover:border-brand/40 hover:shadow-[0_24px_52px_-14px_rgba(0,0,0,.75)]",
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-1.5 font-display text-[11.5px] font-bold uppercase tracking-[0.6px] text-white shadow-[0_8px_20px_rgba(255,0,66,.4)]">
                    <Star className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Más elegido
                  </span>
                )}

                <header className="mb-5 border-b border-white/8 pb-5">
                  <h3 className="font-display text-xl font-bold tracking-[-0.3px] text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] text-muted-foreground">{plan.desc}</p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-xl font-semibold text-brand-soft">$</span>
                    <span className="font-display text-[44px] font-extrabold leading-none tracking-[-1.6px] text-white">
                      {cycle === "yearly" ? plan.yearly : plan.monthly}
                    </span>
                    <span className="ml-1.5 text-[13.5px] text-white/35">
                      {cycle === "yearly" ? "/mes · facturado anual" : "/mes"}
                    </span>
                  </p>
                </header>

                <ul className="mb-6 grid gap-3 text-sm text-white/75">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-soft" strokeWidth={2.6} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener"
                  className={cn(
                    "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-display text-[14.5px] font-semibold transition duration-200 ease-out active:scale-[.98]",
                    plan.featured
                      ? "bg-brand-gradient text-white shadow-[0_8px_22px_rgba(255,0,66,.28)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(255,0,66,.42)]"
                      : "border border-white/15 bg-white/[0.04] text-white hover:-translate-y-0.5 hover:border-brand/50 hover:bg-white/[0.09]",
                  )}
                >
                  {plan.cta}
                </a>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mt-8 flex items-center justify-center gap-2.5 text-center text-[13.5px] text-white/35">
            <ShieldCheck className="h-[17px] w-[17px] text-emerald-400" strokeWidth={1.8} />
            Todos los planes incluyen garantía de 7 días y migración sin costo.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- FAQ */

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24">
      <div className="container max-w-[860px]">
        <SectionHeading eyebrow="Preguntas frecuentes" title="Dudas antes de comprar" />

        <div className="grid gap-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 60}>
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border transition-colors duration-300",
                    isOpen ? "border-brand/40 bg-brand/[0.05]" : "border-white/8 bg-white/[0.028]",
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4.5 px-5.5 py-5 text-left font-display text-base font-semibold text-white"
                  >
                    {item.q}
                    <ChevronDown
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 text-brand-soft transition-transform duration-300",
                        isOpen && "rotate-180",
                      )}
                      strokeWidth={2}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-400 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <p className="overflow-hidden px-5.5 pb-5 text-[14.5px] leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- contacto */

export function Contact() {
  const copyInvite = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(CONFIG.discordInvite);
      } else {
        const helper = document.createElement("textarea");
        helper.value = CONFIG.discordInvite;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.left = "-9999px";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }
      toast.success("Invitación copiada", { description: CONFIG.discordInvite });
    } catch {
      toast.error("No se pudo copiar", { description: `Invitación: ${CONFIG.discordInvite}` });
    }
  };

  const cards = [
    { icon: Headphones, title: "Soporte", text: "Respuesta media: 8 min" },
    { icon: Zap, title: "Entrega", text: "Activación inmediata" },
    { icon: ShieldCheck, title: "Garantía", text: "7 días de cobertura" },
  ];

  return (
    <section id="contacto" className="relative pb-24">
      <Reveal className="container">
        <div className="grid items-center gap-10 rounded-3xl border border-white/15 bg-[linear-gradient(120deg,rgba(255,0,66,.11),rgba(255,123,0,.03)_55%,transparent)] p-10 shadow-[0_10px_30px_rgba(0,0,0,.5)] lg:grid-cols-[1.25fr_1fr] max-sm:p-6">
          <div>
            <Eyebrow>Contacto</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.8px] text-white sm:text-4xl">
              Hablemos de tu proyecto
            </h2>
            <p className="mt-3.5 max-w-lg text-[15.5px] leading-relaxed text-muted-foreground">
              Escríbenos por Discord y un humano del equipo te responde. Sin bots intermedios ni
              respuestas automáticas.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2.5 rounded-full bg-brand-gradient px-6 py-3 font-display text-[14.5px] font-semibold text-white shadow-[0_8px_22px_rgba(255,0,66,.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(255,0,66,.42)] active:scale-[.97]"
              >
                <Bot className="h-[18px] w-[18px]" strokeWidth={1.8} />
                Abrir ticket en Discord
              </a>
              <button
                type="button"
                onClick={copyInvite}
                className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 font-display text-[14.5px] font-semibold text-white transition duration-200 ease-out hover:-translate-y-0.5 hover:border-brand/50 hover:bg-white/[0.09] active:scale-[.97]"
              >
                <Copy className="h-[18px] w-[18px]" strokeWidth={1.8} />
                Copiar invitación
              </button>
            </div>
          </div>

          <ul className="grid gap-3">
            {cards.map((card) => (
              <li
                key={card.title}
                className="flex items-center gap-3.5 rounded-xl border border-white/8 bg-[#0b0b12]/55 px-4.5 py-4"
              >
                <card.icon className="h-5 w-5 shrink-0 text-brand-soft" strokeWidth={1.8} />
                <div>
                  <strong className="block font-display text-[14.5px] font-semibold text-white">
                    {card.title}
                  </strong>
                  <span className="text-[12.5px] text-white/35">{card.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ footer */

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/8 bg-[#09090f]/60 pt-16 pb-7">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,0,66,.7),transparent)]"
      />

      <div className="container grid gap-9 lg:grid-cols-[1.5fr_repeat(3,1fr)] max-sm:grid-cols-1 sm:max-lg:grid-cols-2">
        <div className="max-lg:col-span-full">
          <img src={ASSETS.logo} alt="Imperio Shop" className="mb-4 w-[168px]" />
          <p className="max-w-[320px] text-[13.5px] leading-relaxed text-muted-foreground">
            Bots, hosting y servidores para comunidades que quieren crecer rápido y sin dolores de
            cabeza.
          </p>
        </div>

        {FOOTER_LINKS.map((group) => (
          <nav key={group.title} className="flex flex-col gap-2.5" aria-label={group.title}>
            <h3 className="mb-1 font-display text-[13px] font-semibold uppercase tracking-[1.4px] text-white">
              {group.title}
            </h3>
            {group.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...("external" in link && link.external
                  ? { target: "_blank", rel: "noopener" }
                  : {})}
                className="group inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-all duration-150 hover:text-brand-soft"
              >
                {link.label}
                {"external" in link && link.external && (
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                )}
              </a>
            ))}
          </nav>
        ))}
      </div>

      <div className="container mt-12 flex flex-wrap justify-between gap-2.5 border-t border-white/8 pt-6 text-[12.5px] text-white/35 max-sm:flex-col">
        <p>&copy; {new Date().getFullYear()} Imperio Shop. Todos los derechos reservados.</p>
        <p className="inline-flex items-center gap-1.5">
          <Rocket className="h-3.5 w-3.5 text-brand-soft" strokeWidth={1.8} />
          Hecho con dedicación para la comunidad hispana de Discord.
        </p>
      </div>
    </footer>
  );
}
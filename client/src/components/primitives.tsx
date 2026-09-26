import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUp,
  Bot,
  Check,
  Cloud,
  Code2,
  Gauge,
  Headphones,
  Menu,
  Rocket,
  ScrollText,
  Server,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Ticket,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ iconos */

const ICONS = {
  bot: Bot,
  cloud: Cloud,
  server: Server,
  code: Code2,
  sparkles: Sparkles,
  headphones: Headphones,
  cart: ShoppingCart,
  ticket: Ticket,
  shield: ShieldCheck,
  zap: Zap,
  star: Star,
  check: Check,
  menu: Menu,
  close: X,
  arrow: ArrowRight,
  up: ArrowUp,
  rocket: Rocket,
  gauge: Gauge,
  log: ScrollText,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const Cmp = ICONS[name] ?? Bot;
  return <Cmp className={cn("h-5 w-5", className)} strokeWidth={1.8} aria-hidden="true" />;
}

/* ------------------------------------------------------------- animaciones */

/** Aparición suave al entrar en pantalla, con retardo escalonado. */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/** Escribe un texto letra a letra cuando el contenedor entra en pantalla. */
export function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { threshold },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/** Formato español sin depender de ICU: 1850 -> "1.850" */
export function formatNumber(value: number, decimals = 0) {
  const fixed = decimals ? value.toFixed(decimals) : String(Math.round(value));
  const [int, dec] = fixed.split(".");
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dec ? `${withDots},${dec}` : withDots;
}

/** Contador animado que arranca al verse en pantalla. */
export function CountUp({
  value,
  suffix = "",
  decimals = 0,
  duration = 1500,
  className,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(formatNumber(value, decimals) + suffix);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(formatNumber(value * eased, decimals) + suffix);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, decimals, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/* ------------------------------------------------------------------ bloques */

export function Eyebrow({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "live" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-display text-[11.5px] font-semibold uppercase tracking-[0.9px]",
        tone === "brand"
          ? "border-brand/35 bg-brand/10 text-brand-soft"
          : "border-amber-brand/35 bg-amber-brand/10 font-medium normal-case tracking-normal text-amber-200",
      )}
    >
      {tone === "live" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
      )}
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 font-display text-3xl font-bold leading-[1.15] tracking-[-0.8px] text-white sm:text-4xl">
        {title}
      </h2>
      {text && <p className="mt-3.5 text-[15.5px] leading-relaxed text-muted-foreground">{text}</p>}
      {children}
    </Reveal>
  );
}

/** Tarjeta con luz que sigue al cursor. */
export function GlowCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    node.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035] p-6",
        "transition-[border-color,box-shadow,transform] duration-300 ease-out",
        "hover:-translate-y-1 hover:border-brand/45 hover:shadow-[0_22px_48px_-12px_rgba(0,0,0,0.75)]",
        "before:pointer-events-none before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-300",
        "before:bg-[radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,0%),rgba(255,0,66,0.16),transparent_62%)]",
        "hover:before:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Cinta infinita de texto (se duplica el contenido para el bucle). */
export function Marquee({
  items,
  className,
  itemClassName,
  separator = "|",
}: {
  items: string[];
  className?: string;
  itemClassName?: string;
  separator?: string;
}) {
  const group = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((item) => (
        <span key={`${key}-${item}`} className={cn("flex items-center", itemClassName)}>
          {item}
          <span className="mx-6 text-brand">{separator}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn("marquee-mask overflow-hidden", className)}>
      <div className="marquee-track flex w-max">
        {group("a")}
        {group("b")}
      </div>
    </div>
  );
}
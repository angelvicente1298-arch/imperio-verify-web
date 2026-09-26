import { useEffect, useState } from "react";
import { Bot, Menu, X } from "lucide-react";
import { ASSETS, DISCORD_URL, NAV } from "@/lib/content";
import { cn } from "@/lib/utils";

export default function SiteHeader() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("inicio");
  const [scrollRatio, setScrollRatio] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setStuck(y > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollRatio(max > 0 ? Math.min(1, y / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="fixed left-0 top-0 z-[100] h-[3px] bg-brand-gradient shadow-[0_0_12px_rgba(255,0,66,.6)] transition-[width] duration-150 ease-linear"
        style={{ width: `${scrollRatio * 100}%` }}
      />

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[90] flex items-center transition-all duration-300 ease-out",
          stuck
            ? "h-[66px] border-b border-white/8 bg-[#0b0b12]/85 shadow-[0_12px_30px_rgba(0,0,0,.35)] backdrop-blur-xl"
            : "h-[74px] border-b border-transparent",
        )}
      >
        <div className="container flex items-center gap-4">
          <a href="#inicio" className="mr-auto inline-flex items-center gap-3" aria-label="Imperio Shop, ir al inicio">
            <img
              src={ASSETS.logoMark}
              alt=""
              className="h-10 w-10 rounded-xl border border-brand/45 bg-brand/10 p-1.5 shadow-[0_0_16px_rgba(255,0,66,.32)] transition duration-300 hover:rotate-[-4deg] hover:scale-105 hover:shadow-[0_0_26px_rgba(255,0,66,.55)]"
            />
            <span className="flex flex-col font-display leading-none">
              <strong className="text-[17px] font-extrabold tracking-[1.6px] text-white">IMPERIO</strong>
              <span className="text-[10.5px] font-semibold tracking-[4.6px] text-brand-soft">SHOP</span>
            </span>
          </a>

          <nav
            className={cn(
              "flex items-center gap-1 max-lg:fixed max-lg:inset-x-0 max-lg:top-[74px] max-lg:flex-col max-lg:items-stretch max-lg:gap-1.5 max-lg:overflow-y-auto max-lg:border-b max-lg:border-white/8 max-lg:bg-[#0b0b12]/98 max-lg:px-6 max-lg:pb-6 max-lg:pt-4 max-lg:shadow-[0_22px_40px_rgba(0,0,0,.5)]",
              "max-lg:transition-transform max-lg:duration-300 max-lg:ease-out",
              open ? "max-lg:translate-y-0" : "max-lg:-translate-y-[130%]",
            )}
            aria-label="Navegación principal"
          >
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150",
                  "max-lg:rounded-xl max-lg:px-3.5 max-lg:py-3 max-lg:text-[15px]",
                  active === item.id
                    ? "text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute bottom-[3px] left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-brand-gradient transition-all duration-300",
                    "max-lg:hidden",
                    active === item.id ? "w-[18px]" : "w-0",
                  )}
                />
              </a>
            ))}

            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener"
              className="ml-2.5 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 font-display text-[13.5px] font-semibold text-white shadow-[0_8px_22px_rgba(255,0,66,.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(255,0,66,.42)] active:scale-[.97] max-lg:mt-2 max-lg:ml-0 max-lg:justify-center max-lg:py-2.5"
            >
              <Bot className="h-[18px] w-[18px]" strokeWidth={1.8} />
              Unirse al Discord
            </a>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="hidden h-[42px] w-[42px] place-items-center rounded-xl border border-white/15 bg-white/[0.04] text-white/80 transition duration-200 hover:bg-white/10 active:scale-95 max-lg:grid"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>
    </>
  );
}
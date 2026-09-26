import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import VerificationGate from "@/components/VerificationGate";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import { BannerCta, BotPanel, Services, TickerStrip } from "@/components/Services";
import { Contact, Faq, Plans, SiteFooter, TechStrip } from "@/components/PlansAndFaq";
import { cn } from "@/lib/utils";

export default function Home() {
  const [verified, setVerified] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    // Bloquea el scroll mientras se muestra la verificación
    document.body.classList.add("is-loading");
    const onScroll = () => setShowTop(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("is-loading");
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {!verified && <VerificationGate onFinish={() => setVerified(true)} />}

      <SiteHeader />

      <main>
        <Hero />
        <TickerStrip />
        <Services />
        <BotPanel />
        <BannerCta />
        <Plans />
        <TechStrip />
        <Faq />
        <Contact />
      </main>

      <SiteFooter />

      <button
        type="button"
        aria-label="Volver arriba"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-6 right-6 z-80 grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-[#14131d]/90 text-white/70 shadow-[0_8px_22px_rgba(0,0,0,.38)] backdrop-blur transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-brand/60 hover:text-white hover:shadow-[0_10px_24px_rgba(255,0,66,.28)]",
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <ArrowUp className="h-5 w-5" strokeWidth={1.8} />
      </button>
    </div>
  );
}
/**
 * Contenido y configuración central del sitio de Imperio Shop.
 * Cambia aquí los textos, precios o la invitación de Discord.
 */

export const CONFIG = {
  /** Invitación de Discord usada por todos los botones del sitio. */
  discordInvite: "discord.gg/imperioshop",
  /** true = envía al usuario a Discord al terminar la verificación. */
  autoRedirect: false,
  /** Tiempos de la verificación inicial (ms). */
  timings: { step1: 800, step2: 2000, step3: 3200, finish: 1200 },
};

export const DISCORD_URL = `https://${CONFIG.discordInvite}`;

/** Imágenes alojadas en el almacenamiento del proyecto. */
export const ASSETS = {
  logo: "/manus-storage/logo_f6da9ab2.png",
  logoMark: "/manus-storage/logo-mark_ff18cf74.png",
  logoWatermark: "/manus-storage/logo-patern_5e425264.png",
  banner: "/manus-storage/banner_b38a4033.png",
  banner2x: "/manus-storage/banner@2x_42bc9bbe.png",
  favicon32: "/manus-storage/favicon-32_3844545e.png",
  favicon180: "/manus-storage/favicon-180_7549ff59.png",
  favicon192: "/manus-storage/favicon-192_4be92af9.png",
  favicon512: "/manus-storage/favicon-512_84189e68.png",
  ogImage: "/manus-storage/og-image_6419a5c1.png",
};

export const NAV = [
  { id: "inicio", label: "Inicio" },
  { id: "servicios", label: "Servicios" },
  { id: "panel", label: "Panel del bot" },
  { id: "planes", label: "Planes" },
  { id: "faq", label: "Preguntas" },
];

export const STATS = [
  { label: "Comunidades atendidas", value: 1850, suffix: "+" },
  { label: "Bots entregados", value: 940, suffix: "+" },
  { label: "Uptime del hosting", value: 99.9, suffix: "%", decimals: 1 },
  { label: "Valoración media", value: 4.9, suffix: "/5", decimals: 1 },
];

export const TRUST = [
  { icon: "zap", label: "Activación en minutos" },
  { icon: "shield", label: "Uptime 99.9%" },
  { icon: "headphones", label: "Atención humana" },
];

export const TICKER = [
  "BOTS",
  "HOSTING",
  "SERVIDORES",
  "PANEL PTERODACTYL",
  "SOPORTE 24/7",
  "ACTIVACIÓN INMEDIATA",
];

export const SERVICES = [
  {
    icon: "bot",
    title: "Bots personalizados",
    text: "Moderación, economía, tickets, música y automatizaciones hechas a medida de tu servidor.",
    points: ["Comandos slash", "Panel web incluido", "Código tuyo, sin alquiler"],
  },
  {
    icon: "cloud",
    title: "Hosting para bots",
    text: "Alojamiento continuo para bots de Discord y Node.js con reinicio automático y backups.",
    points: ["Node.js, Python, Java", "Backups programados", "Consola en vivo"],
  },
  {
    icon: "server",
    title: "Servidores VPS",
    text: "Máquinas NVMe con IP dedicada, panel de control y protección anti-DDoS activa.",
    points: ["Discos NVMe", "Anti-DDoS incluido", "Escalado sin migrar"],
  },
  {
    icon: "code",
    title: "Desarrollo web",
    text: "Landings, dashboards y tiendas conectadas a Discord con pagos y entregas automáticas.",
    points: ["Diseño responsive", "SEO y velocidad", "Integración con bots"],
  },
  {
    icon: "sparkles",
    title: "Herramientas premium",
    text: "Nitro, boosts, plugins y recursos para llevar la experiencia de tu comunidad al siguiente nivel.",
    points: ["Entrega inmediata", "Garantía de reemplazo", "Stock verificado"],
  },
  {
    icon: "headphones",
    title: "Soporte y mantenimiento",
    text: "Monitoreo, actualizaciones y ayuda directa por Discord cuando algo necesita atención.",
    points: ["Soporte 24/7", "Monitoreo activo", "Actualizaciones incluidas"],
  },
];

export const BOT_FEATURES = [
  {
    icon: "cart",
    title: "Tienda dentro de Discord",
    text: "Productos, pagos y entrega automática en un mismo flujo.",
  },
  {
    icon: "ticket",
    title: "Tickets ordenados",
    text: "Un canal por caso, con historial y tiempos de respuesta visibles.",
  },
  {
    icon: "shield",
    title: "Moderación inteligente",
    text: "Antispam, automod y registros claros de cada sanción.",
  },
  {
    icon: "server",
    title: "Estado del hosting",
    text: "Uso de CPU, RAM y uptime a un comando de distancia.",
  },
];

export type ConsoleLine = { text: string; tone?: "ok" | "warn" | "key" | "dim" | "plain" };

export const CONSOLE_COMMANDS: { cmd: string; lines: ConsoleLine[] }[] = [
  {
    cmd: "!tienda",
    lines: [
      { text: "imperio-bot › ejecutando  !tienda", tone: "dim" },
      { text: "✔ catálogo sincronizado (12 productos)", tone: "ok" },
      { text: "" },
      { text: "BOTS PERSONALIZADOS ..... desde $19", tone: "key" },
      { text: "HOSTING PARA BOTS ....... desde $7", tone: "key" },
      { text: "SERVIDORES VPS .......... desde $12", tone: "key" },
      { text: "SOPORTE ................. 24/7", tone: "key" },
    ],
  },
  {
    cmd: "!panel",
    lines: [
      { text: "imperio-bot › ejecutando  !panel", tone: "dim" },
      { text: "✔ panel privado generado", tone: "ok" },
      { text: "" },
      { text: "ventas este mes ......... 132", tone: "key" },
      { text: "tickets abiertos ........ 3", tone: "key" },
      { text: "tiempo de 1ª respuesta .. 6 min", tone: "key" },
      { text: "→ enlace enviado por mensaje directo", tone: "dim" },
    ],
  },
  {
    cmd: "!status",
    lines: [
      { text: "imperio-bot › ejecutando  !status", tone: "dim" },
      { text: "✔ todos los servicios operativos", tone: "ok" },
      { text: "" },
      { text: "api .............. 42 ms", tone: "key" },
      { text: "gateway .......... 38 ms", tone: "key" },
      { text: "uptime ........... 99.94%", tone: "key" },
      { text: "shards ........... 1/1", tone: "key" },
    ],
  },
  {
    cmd: "!soporte",
    lines: [
      { text: "imperio-bot › ejecutando  !soporte", tone: "dim" },
      { text: "✔ ticket #2481 creado", tone: "ok" },
      { text: "" },
      { text: "canal ....... #soporte-2481", tone: "key" },
      { text: "prioridad ... normal", tone: "key" },
      { text: "estado ...... esperando equipo", tone: "warn" },
      { text: "→ un humano responde en minutos", tone: "dim" },
    ],
  },
];

export const PLANS = [
  {
    name: "Inicial",
    desc: "Para empezar con tu primera comunidad.",
    monthly: "7",
    yearly: "5.6",
    features: [
      "Bot con comandos esenciales",
      "Hosting 1 GB RAM",
      "Backups semanales",
      "Soporte por tickets",
    ],
    featured: false,
    cta: "Empezar",
  },
  {
    name: "Imperio",
    desc: "El equilibrio ideal entre potencia y precio.",
    monthly: "19",
    yearly: "15.2",
    features: [
      "Bot personalizado completo",
      "Hosting 4 GB RAM + NVMe",
      "Panel web privado",
      "Backups diarios",
      "Soporte prioritario 24/7",
    ],
    featured: true,
    cta: "Contratar Imperio",
  },
  {
    name: "Corporativo",
    desc: "Infraestructura dedicada y desarrollo a medida.",
    monthly: "49",
    yearly: "39.2",
    features: [
      "VPS dedicado 8 GB RAM",
      "Desarrollo a medida",
      "Anti-DDoS avanzado",
      "Monitoreo y alertas",
      "Gestor de cuenta",
    ],
    featured: false,
    cta: "Hablar con ventas",
  },
];

export const FAQ = [
  {
    q: "¿Cuánto tarda la entrega de un bot?",
    a: "Los bots base se entregan en minutos con invitación y configuración incluida. Los desarrollos a medida suelen tomar entre 24 y 72 horas según el alcance.",
  },
  {
    q: "¿El código del bot queda a mi nombre?",
    a: "Sí. En los planes con desarrollo personalizado recibes el código fuente y el repositorio queda bajo tu control, sin dependencias ocultas.",
  },
  {
    q: "¿Puedo migrar mi bot desde otro hosting?",
    a: "Claro. Nuestro equipo revisa tus archivos, bases de datos y variables de entorno, y ejecuta la migración sin costo para que no pierdas datos ni tiempo de actividad.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Aceptamos pagos digitales y transferencias. Dentro del Discord encontrarás un canal de pagos con instrucciones actualizadas y facturación automática.",
  },
  {
    q: "¿Cuál es la garantía y el soporte real?",
    a: "Ofrecemos 7 días de garantía y soporte 24/7 por Discord. Los tiempos de primera respuesta suelen ser menores a 10 minutos en horario habitual.",
  },
];

export const TECH = [
  "Node.js",
  "Python",
  "MySQL",
  "MongoDB",
  "Pterodactyl",
  "Docker",
  "Redis",
  "Cloudflare",
];

export const FOOTER_LINKS = [
  {
    title: "Secciones",
    links: [
      { label: "Inicio", href: "#inicio" },
      { label: "Servicios", href: "#servicios" },
      { label: "Planes", href: "#planes" },
      { label: "Preguntas", href: "#faq" },
    ],
  },
  {
    title: "Servicios",
    links: [
      { label: "Bots para Discord", href: "#servicios" },
      { label: "Hosting de bots", href: "#servicios" },
      { label: "Servidores VPS", href: "#servicios" },
      { label: "Desarrollo web", href: "#servicios" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { label: "Discord oficial", href: DISCORD_URL, external: true },
      { label: "Soporte", href: "#contacto" },
      { label: "Planes y precios", href: "#planes" },
    ],
  },
];
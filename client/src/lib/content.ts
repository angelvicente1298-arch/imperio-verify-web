/** Recursos de marca del proyecto Imperio Shop. */
export const ASSETS = {
  logo: "/manus-storage/logo_f6da9ab2.png",
  logoMark: "/manus-storage/logo-mark_ff18cf74.png",
  logoWatermark: "/manus-storage/logo-patern_5e425264.png",
  banner: "/manus-storage/banner_b38a4033.png",
  favicon: "/manus-storage/favicon-32_3844545e.png",
  ogImage: "/manus-storage/og-image_6419a5c1.png",
};

export const BRAND = {
  name: "Imperio Shop",
  tagline: "Verificación de cuentas de Discord",
};

/** Pasos que se muestran en el panel de progreso. */
export const SCAN_STEPS = [
  { id: "handshake", label: "Conectando con Discord", detail: "Enlace seguro con el Developer Portal" },
  { id: "identity", label: "Leyendo datos de la cuenta", detail: "ID, antigüedad y correo" },
  { id: "network", label: "Modelo de red", detail: "Detección de VPN, proxy y centro de datos" },
  { id: "risk", label: "Antifraude y multicuentas", detail: "Historial por IP y dispositivo" },
  { id: "access", label: "Entrega de acceso", detail: "Unir al servidor y asignar el rol" },
] as const;

export type ScanStepId = (typeof SCAN_STEPS)[number]["id"];
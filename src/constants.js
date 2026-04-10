export const T = {
  950: "#061f1d",
  900: "#0d3d3a",
  800: "#0f4d49",
  700: "#136158",
  600: "#1a7a72",
  500: "#1a9e95",
  400: "#20bdb3",
  300: "#4dd0c8",
  200: "#a0e8e4",
  100: "#d6f5f3",
  50: "#f0fdfb"
};
export const G = {
  900: "#0f1117",
  800: "#1a1f2e",
  700: "#374151",
  600: "#4b5563",
  500: "#6b7280",
  400: "#9ca3af",
  300: "#d1d5db",
  200: "#e5e7eb",
  100: "#f3f4f6",
  50: "#f9fafb"
};
export const serif = "'Cormorant Garamond',Georgia,serif";
export const sans = "'DM Sans',system-ui,sans-serif";
export const s = {
  page: { fontFamily: sans, color: G[900], background: "#fff", minHeight: "100vh" },
  btnPrimary: {
    background: T[500],
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "12px 28px",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: sans,
    cursor: "pointer"
  },
  btnGhost: {
    background: "transparent",
    color: G[700],
    border: `1px solid ${G[200]}`,
    borderRadius: 7,
    padding: "10px 18px",
    fontSize: 13,
    fontFamily: sans,
    cursor: "pointer"
  },
  btnDanger: {
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: 7,
    padding: "10px 18px",
    fontSize: 13,
    fontFamily: sans,
    cursor: "pointer"
  },
  card: {
    background: "#fff",
    border: `1px solid ${G[200]}`,
    borderRadius: 12,
    padding: "20px 22px",
    marginBottom: 14
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: G[400]
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: `1px solid ${G[100]}`,
    fontSize: 13
  }
};
export const TRANSLATIONS = {
  eyebrow: { en: "Medical tourism · Dominican Republic", es: "Turismo médico · República Dominicana" },
  heroTitle: { en: ["World-class surgery,", "Caribbean recovery."], es: ["Cirugía de clase mundial,", "recuperación en el Caribe."] },
  heroBody: {
    en: "Praesenti connects international patients with top-tier surgeons in the Dominican Republic — coordinating every detail so you heal in comfort and style.",
    es: "Praesenti conecta a pacientes internacionales con cirujanos de primer nivel en la República Dominicana, coordinando cada detalle para que te recuperes con comodidad y estilo."
  },
  begin: { en: "Begin your journey", es: "Comienza tu viaje" },
  howItWorks: { en: "How it works", es: "Cómo funciona" },
  signIn: { en: "Sign in", es: "Iniciar sesión" },
  stepHow1T: { en: "Tell us your goals", es: "Cuéntanos tus objetivos" },
  stepHow1B: { en: "Complete a short intake — your procedure, budget, timeline, and health background.", es: "Completa un breve formulario — procedimiento, presupuesto, cronograma y antecedentes de salud." },
  stepHow2T: { en: "We match you", es: "Te emparejamos" },
  stepHow2B: { en: "Our team reviews your profile and pairs you with board-certified surgeons and accredited facilities.", es: "Nuestro equipo revisa tu perfil y te vincula con cirujanos certificados e instalaciones acreditadas." },
  stepHow3T: { en: "All-in-one coordination", es: "Coordinación todo en uno" },
  stepHow3B: { en: "Flights, transfers, accommodation, surgery — handled. You focus on healing.", es: "Vuelos, traslados, alojamiento, cirugía — todo gestionado. Tú concéntrate en sanar." },
  stepHow4T: { en: "Recovery & follow-up", es: "Recuperación y seguimiento" },
  stepHow4B: { en: "Luxury recovery homes, telemedicine check-ins, and lifetime support from your care team.", es: "Casas de recuperación de lujo, teleconsultas y apoyo de por vida de tu equipo médico." },
  whyDR: { en: "Why the Dominican Republic?", es: "¿Por qué República Dominicana?" },
  whyDRBody: {
    en: "The DR combines internationally accredited hospitals, US-trained surgeons, and a 12-month warm climate — at 40–70% less than US prices.",
    es: "La RD combina hospitales con acreditación internacional, cirujanos formados en EE.UU. y un clima cálido durante 12 meses, a un 40–70% menos que los precios de EE.UU."
  },
  footerTag: { en: "Precision care. Caribbean soul.", es: "Cuidado de precisión. Alma caribeña." }
};
export const tr = (key, lang) => {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
};
export const CASES = [
  { id: "C-001", name: "Maria Vasquez", proc: "Rhinoplasty", status: "Recovery", date: "Mar 14", surgeon: "Dr. Peña", budget: "$4,200", country: "USA" },
  { id: "C-002", name: "James Okafor", proc: "Liposuction", status: "Pre-op", date: "Apr 02", surgeon: "Dr. Reyes", budget: "$6,800", country: "UK" },
  { id: "C-003", name: "Sofia Martínez", proc: "Breast Augmentation", status: "Recovery", date: "Mar 20", surgeon: "Dr. Peña", budget: "$5,500", country: "CA" },
  { id: "C-004", name: "Luca Ferreira", proc: "Hair Transplant", status: "Lead", date: "Apr 18", surgeon: "—", budget: "$3,100", country: "BR" },
  { id: "C-005", name: "Anna Kowalski", proc: "Tummy Tuck", status: "Pre-op", date: "Apr 09", surgeon: "Dr. Castro", budget: "$7,200", country: "PL" }
];
export const INIT_MSGS = [
  { side: "them", text: "Hi Maria! Welcome to Praesenti. I'm your personal care coordinator. How are you feeling today?", time: "09:14", date: "March 14" },
  { side: "me", text: "Hi! Feeling a bit nervous about tomorrow's pre-op visit, but excited too.", time: "09:22", date: "March 14" },
  { side: "them", text: "That's completely normal! Dr. Peña's team is wonderful — you're in great hands. Do you have any last-minute questions?", time: "09:25", date: "March 14" },
  { side: "me", text: "Can I eat anything the night before?", time: "09:31", date: "March 14" },
  { side: "them", text: "Nothing after midnight — just water is fine until 6 AM. We'll go over the full pre-op checklist when you arrive.", time: "09:33", date: "March 14" }
];
export const ADMIN_NOTES = [
  { author: "Dr. Peña", date: "March 22 · 10:15", text: "Post-op review completed. Swelling within normal range. Patient cleared for discharge to recovery home." },
  { author: "Coord. Ana", date: "March 20 · 08:45", text: "Patient arrived at Clinica Unión. Surgery scheduled for 10:00 AM. All pre-op labs confirmed." },
  { author: "Coord. Ana", date: "March 14 · 14:00", text: "Pre-op consultation completed. Patient is a good candidate. Consent forms signed." }
];
export const JOURNEY_STEPS = [
  { label: "Application submitted", date: "Feb 28", done: true },
  { label: "Matched with Dr. Peña", date: "Mar 02", done: true },
  { label: "Pre-op consultation", date: "Mar 14", done: true },
  { label: "Surgery day", date: "Mar 20", done: true },
  { label: "Recovery home check-in", date: "Mar 22", done: true },
  { label: "7-day follow-up", date: "Mar 27", done: false },
  { label: "30-day telemedicine", date: "Apr 20", done: false },
  { label: "Final clearance", date: "May 10", done: false }
];
export const DOCS = [
  { name: "Consent Form — Rhinoplasty.pdf", size: "218 KB", date: "Mar 14" },
  { name: "Pre-op Blood Work Results.pdf", size: "94 KB", date: "Mar 17" },
  { name: "Surgery Report — Dr. Peña.pdf", size: "340 KB", date: "Mar 20" },
  { name: "Recovery Instructions.pdf", size: "156 KB", date: "Mar 22" },
  { name: "Invoice & Payment Receipt.pdf", size: "82 KB", date: "Mar 22" }
];
export const RECOVERY_CHECKS = [
  "Verify laboratory results",
  "Initial medication kit delivery",
  "Post-op drainage control tutorial",
  "First clinical follow-up appointment",
  "Recovery home check-in confirmed",
  "Physical therapy initial assessment",
  "Hydration and nutrition plan start",
  "Patient mobility certificate"
];

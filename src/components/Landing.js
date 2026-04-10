import { T, G, serif, sans, s, TRANSLATIONS, tr } from '../constants.js';
import { Icon, SPill } from './shared.js';
import { Wizard } from './Wizard.js';
import { AuthModal, SignUpModal } from './AuthModal.js';

const { React } = window;
const { useState, useRef } = React;

export const Landing = ({ onLogin, lang, setLang }) => {
  const [authOpen, setAuthOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [wizOpen, setWizOpen] = useState(false);
  const [prefillForm, setPrefillForm] = useState(null);
  const howRef = useRef(null);
  const procRef = useRef(null);
  const whyRef = useRef(null);
  const scroll = (ref) => {
    var _a;
    return (_a = ref.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
  };
  const PROCS_LANDING = [
    { name: "Rhinoplasty", iconName: "nose", price: "from $3,200", savings: "Save up to 65%" },
    { name: "Breast Aug.", iconName: "flower", price: "from $4,500", savings: "Save up to 60%" },
    { name: "Liposuction", iconName: "sparkles", price: "from $3,800", savings: "Save up to 55%" },
    { name: "Hair Transplant", iconName: "seedling", price: "from $2,400", savings: "Save up to 70%" },
    { name: "Tummy Tuck", iconName: "stethoscope", price: "from $5,000", savings: "Save up to 58%" },
    { name: "Dental Veneers", iconName: "smile", price: "from $1,800", savings: "Save up to 72%" }
  ];
  const HOW_STEPS = [
    { title: tr("stepHow1T", lang), body: tr("stepHow1B", lang), num: "01", iconName: "clipboard" },
    { title: tr("stepHow2T", lang), body: tr("stepHow2B", lang), num: "02", iconName: "handshake" },
    { title: tr("stepHow3T", lang), body: tr("stepHow3B", lang), num: "03", iconName: "plane" },
    { title: tr("stepHow4T", lang), body: tr("stepHow4B", lang), num: "04", iconName: "heart" }
  ];
  const WHY_ITEMS = [
    { iconName: "hospital", label: "JCI-accredited hospitals" },
    { iconName: "sun", label: "Year-round warm climate" },
    { iconName: "piggyBank", label: "40\u201372% cost savings" },
    { iconName: "plane", label: "2\u20134 hr from major US cities" },
    { iconName: "userMd", label: "US-trained surgeons" },
    { iconName: "palm", label: "Luxury recovery homes" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: s.page }, /* @__PURE__ */ React.createElement(
    Wizard,
    {
      open: wizOpen,
      prefill: prefillForm,
      onClose: () => {
        setWizOpen(false);
        setPrefillForm(null);
      },
      onComplete: (form) => onLogin("patient", { fn: form.fn, ln: form.ln, email: form.email })
    }
  ), /* @__PURE__ */ React.createElement(AuthModal, { open: authOpen, onClose: () => setAuthOpen(false), onLogin: (role, userData) => onLogin(role, userData), onSwitchToSignUp: () => setSignUpOpen(true) }), /* @__PURE__ */ React.createElement(
    SignUpModal,
    {
      open: signUpOpen,
      onClose: () => setSignUpOpen(false),
      onSignUpDone: (form) => {
        setPrefillForm(form);
        setWizOpen(true);
      },
      onSwitchToSignIn: () => setAuthOpen(true)
    }
  ), /* @__PURE__ */ React.createElement("nav", { className: "landing-nav", style: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 60px", height: 68, background: "rgba(6,31,29,.94)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,.06)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 22, fontWeight: 600, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" } }, "Praes", /* @__PURE__ */ React.createElement("span", { style: { color: T[300] } }, "enti")), /* @__PURE__ */ React.createElement("div", { className: "nav-right", style: { display: "flex", alignItems: "center", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "nav-links", style: { display: "flex", gap: 24 } }, [["Process", howRef], ["Procedures", procRef], ["Dominican Republic", whyRef]].map(([lbl, ref]) => /* @__PURE__ */ React.createElement(
    "span",
    {
      key: lbl,
      onClick: () => scroll(ref),
      style: { color: "rgba(255,255,255,.55)", fontSize: 13, cursor: "pointer" },
      onMouseEnter: (e) => e.target.style.color = "#fff",
      onMouseLeave: (e) => e.target.style.color = "rgba(255,255,255,.55)"
    },
    lbl
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, overflow: "hidden" } }, ["EN", "ES"].map((l, i) => /* @__PURE__ */ React.createElement("span", { key: l }, i === 1 && /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 16, background: "rgba(255,255,255,.12)", display: "inline-block", verticalAlign: "middle" } }), /* @__PURE__ */ React.createElement("button", { onClick: () => setLang(l.toLowerCase()), style: { padding: "6px 11px", fontSize: 12, fontWeight: 500, color: lang === l.toLowerCase() ? "#fff" : "rgba(255,255,255,.45)", background: lang === l.toLowerCase() ? "rgba(255,255,255,.12)" : "transparent", border: "none", cursor: "pointer", fontFamily: sans } }, l)))), /* @__PURE__ */ React.createElement("button", { className: "nav-signin", onClick: () => setAuthOpen(true), style: { background: "transparent", color: "rgba(255,255,255,.75)", border: "1px solid rgba(255,255,255,.18)", padding: "8px 18px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: sans } }, tr("signIn", lang)), /* @__PURE__ */ React.createElement("button", { onClick: () => setSignUpOpen(true), style: { background: T[500], color: "#fff", border: "none", padding: "9px 20px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: sans } }, tr("begin", lang)))), /* @__PURE__ */ React.createElement("section", { className: "hero-section", style: { minHeight: "100vh", background: T[950], display: "grid", gridTemplateColumns: "1fr 420px", alignItems: "center", gap: 60, padding: "120px 60px 80px", position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.035) 1px,transparent 0)", backgroundSize: "40px 40px" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "-20%", right: "-10%", width: "55vw", height: "55vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(26,158,149,.14) 0%,transparent 65%)", pointerEvents: "none" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", zIndex: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "inline-block", fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: T[300], marginBottom: 28, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,.1)" } }, tr("eyebrow", lang)), /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: "clamp(46px,5.5vw,76px)", fontWeight: 600, color: "#fff", lineHeight: 1.04, marginBottom: 28 } }, tr("heroTitle", lang)[0], /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("em", { style: { fontStyle: "italic", color: T[300], fontWeight: 400 } }, tr("heroTitle", lang)[1])), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,.55)", lineHeight: 1.8, maxWidth: 480, marginBottom: 48 } }, tr("heroBody", lang)), /* @__PURE__ */ React.createElement("div", { className: "hero-btns", style: { display: "flex", gap: 14, marginBottom: 64 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setSignUpOpen(true), style: { ...s.btnPrimary, padding: "14px 32px" } }, tr("begin", lang)), /* @__PURE__ */ React.createElement("button", { onClick: () => scroll(howRef), style: { ...s.btnGhost, padding: "14px 24px", color: "rgba(255,255,255,.6)", borderColor: "rgba(255,255,255,.15)" } }, tr("howItWorks", lang)))), /* @__PURE__ */ React.createElement("div", { className: "hero-card", style: { position: "relative", zIndex: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "rgba(255,255,255,.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "28px 26px" } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, color: "rgba(255,255,255,.3)", marginBottom: 18 } }, "Current patient"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,.07)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 46, height: 46, borderRadius: "50%", background: T[800], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 20, fontWeight: 600, color: T[200] } }, "M"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { color: "#fff", fontWeight: 500, fontSize: 14 } }, "Maria Vasquez"), /* @__PURE__ */ React.createElement("div", { style: { color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 2 } }, "New York, USA")), /* @__PURE__ */ React.createElement(SPill, { status: "Recovery" })), [["Procedure", "Rhinoplasty"], ["Surgeon", "Dr. Alejandro Pe\u00f1a"], ["Surgery date", "March 20, 2026"], ["Recovery home", "Casa Verde \u00b7 Santo Domingo"], ["Coordinator", "Ana Rodr\u00edguez"]].map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, style: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.05)", fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "rgba(255,255,255,.35)" } }, k), /* @__PURE__ */ React.createElement("span", { style: { color: "rgba(255,255,255,.8)", fontWeight: 500 } }, v))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.3)", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", null, "Recovery progress"), /* @__PURE__ */ React.createElement("span", null, "Day 8 of 14")), /* @__PURE__ */ React.createElement("div", { style: { height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: "57%", background: T[400], borderRadius: 2 } })))))), /* @__PURE__ */ React.createElement("section", { ref: howRef, className: "section-pad", style: { padding: "96px 60px", background: "#fff" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 56 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, color: T[500], marginBottom: 12 } }, "The process"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, color: T[950] } }, tr("howItWorks", lang))), /* @__PURE__ */ React.createElement("div", { className: "grid-4", style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, maxWidth: 1100, margin: "0 auto" } }, HOW_STEPS.map(({ title, body, num, iconName }) => /* @__PURE__ */ React.createElement("div", { key: num }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: T[300], marginBottom: 16 } }, num), /* @__PURE__ */ React.createElement("div", { style: { width: 44, height: 44, borderRadius: 10, background: T[50], border: `1px solid ${T[100]}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 22, color: T[600] })), /* @__PURE__ */ React.createElement("h3", { style: { fontFamily: serif, fontSize: 20, fontWeight: 600, color: T[950], marginBottom: 10 } }, title), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13.5, color: G[500], lineHeight: 1.75, fontWeight: 300 } }, body))))), /* @__PURE__ */ React.createElement("section", { ref: procRef, className: "section-pad", style: { padding: "96px 60px", background: G[50] } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 48 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, color: T[500], marginBottom: 12 } }, "Popular procedures"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, color: T[950] } }, lang === "es" ? "Procedimientos disponibles" : "Available procedures")), /* @__PURE__ */ React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 1100, margin: "0 auto" } }, PROCS_LANDING.map((p) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: p.name,
      style: { background: "#fff", border: `1px solid ${G[200]}`, borderRadius: 14, padding: "24px 22px", cursor: "pointer" },
      onMouseEnter: (e) => e.currentTarget.style.boxShadow = "0 8px 32px rgba(26,158,149,.12)",
      onMouseLeave: (e) => e.currentTarget.style.boxShadow = "none"
    },
/* @__PURE__ */ React.createElement("div", { style: { width: 48, height: 48, borderRadius: 10, background: T[50], border: `1px solid ${T[100]}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Icon, { name: p.iconName, size: 24, color: T[600] })),
/* @__PURE__ */ React.createElement("h3", { style: { fontFamily: serif, fontSize: 20, fontWeight: 600, color: T[950], marginBottom: 6 } }, p.name),
/* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, color: T[600], fontWeight: 500, marginBottom: 4 } }, p.price),
/* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: G[400], fontWeight: 300 } }, p.savings)
  )))), /* @__PURE__ */ React.createElement("section", { ref: whyRef, className: "section-pad", style: { padding: "96px 60px", background: T[950], position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize: "40px 40px" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, color: T[300], marginBottom: 16 } }, "Location"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, color: "#fff", marginBottom: 22 } }, tr("whyDR", lang)), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "rgba(255,255,255,.5)", lineHeight: 1.9, fontWeight: 300, marginBottom: 48 } }, tr("whyDRBody", lang)), /* @__PURE__ */ React.createElement("div", { className: "grid-why", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: "rgba(255,255,255,.06)", borderRadius: 14, overflow: "hidden" } }, WHY_ITEMS.map(({ iconName, label }) => /* @__PURE__ */ React.createElement("div", { key: label, style: { padding: "22px 18px", background: "rgba(255,255,255,.03)", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: 8, background: "rgba(77,208,200,.1)", border: "1px solid rgba(77,208,200,.15)", display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 20, color: T[300] }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,.55)", fontWeight: 300 } }, label))))), /* @__PURE__ */ React.createElement("footer", { style: { background: "#041513", padding: "48px 60px", borderTop: "1px solid rgba(255,255,255,.04)" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,.6)", letterSpacing: "0.06em", textTransform: "uppercase" } }, "Praes", /* @__PURE__ */ React.createElement("span", { style: { color: T[500] } }, "enti")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,.25)", fontStyle: "italic" } }, tr("footerTag", lang))))));
};

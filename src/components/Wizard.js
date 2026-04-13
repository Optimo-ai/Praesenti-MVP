import { T, G, serif, sans, s, TRANSLATIONS } from '../constants.js';
import { WzFi, WzLbl, Modal, Icon, IR, PROCS_LIST, HEALTH_OPTS, WZ_LBLS, WZ_HNTS } from './shared.js';

const { React } = window;
const { useState, useEffect } = React;

// SUPA_URL/KEY read lazily inside async handlers

const C_FLAGS = [
  {n:"United States", c:"us"},{n:"Canada", c:"ca"},{n:"United Kingdom", c:"gb"},{n:"Australia", c:"au"},{n:"Dominican Republic", c:"do"},{n:"Argentina", c:"ar"},{n:"Austria", c:"at"},{n:"Bahamas", c:"bs"},{n:"Belgium", c:"be"},{n:"Bolivia", c:"bo"},{n:"Brazil", c:"br"},{n:"Chile", c:"cl"},{n:"China", c:"cn"},{n:"Colombia", c:"co"},{n:"Costa Rica", c:"cr"},{n:"Croatia", c:"hr"},{n:"Cuba", c:"cu"},{n:"Czech Republic", c:"cz"},{n:"Denmark", c:"dk"},{n:"Ecuador", c:"ec"},{n:"Egypt", c:"eg"},{n:"El Salvador", c:"sv"},{n:"Finland", c:"fi"},{n:"France", c:"fr"},{n:"Germany", c:"de"},{n:"Greece", c:"gr"},{n:"Guatemala", c:"gt"},{n:"Honduras", c:"hn"},{n:"Hong Kong", c:"hk"},{n:"Hungary", c:"hu"},{n:"India", c:"in"},{n:"Indonesia", c:"id"},{n:"Ireland", c:"ie"},{n:"Israel", c:"il"},{n:"Italy", c:"it"},{n:"Jamaica", c:"jm"},{n:"Japan", c:"jp"},{n:"Malaysia", c:"my"},{n:"Mexico", c:"mx"},{n:"Netherlands", c:"nl"},{n:"New Zealand", c:"nz"},{n:"Nicaragua", c:"ni"},{n:"Norway", c:"no"},{n:"Panama", c:"pa"},{n:"Paraguay", c:"py"},{n:"Peru", c:"pe"},{n:"Philippines", c:"ph"},{n:"Poland", c:"pl"},{n:"Portugal", c:"pt"},{n:"Puerto Rico", c:"pr"},{n:"Russia", c:"ru"},{n:"Saudi Arabia", c:"sa"},{n:"Singapore", c:"sg"},{n:"South Africa", c:"za"},{n:"South Korea", c:"kr"},{n:"Spain", c:"es"},{n:"Sweden", c:"se"},{n:"Switzerland", c:"ch"},{n:"Taiwan", c:"tw"},{n:"Thailand", c:"th"},{n:"Turkey", c:"tr"},{n:"United Arab Emirates", c:"ae"},{n:"Uruguay", c:"uy"},{n:"Venezuela", c:"ve"},{n:"Vietnam", c:"vn"},{n:"Other", c:""}
];

export const CountrySelect = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  useEffect(() => {
    const clickOut = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);
  const selected = C_FLAGS.find(c => c.n === value);
  return React.createElement("div", { ref, style: { position: "relative", width: "100%" } },
    React.createElement("div", { onClick: () => setOpen(!open), style: { width: "100%", height: 42, border: `1px solid ${error ? "#fca5a5" : G[200]}`, borderRadius: 7, padding: "0 13px", fontSize: 13.5, fontFamily: sans, color: value ? G[900] : G[500], background: error ? "#fffafb" : "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, selected && selected.c ? React.createElement("img", { src: `https://flagcdn.com/w20/${selected.c}.png`, width: 20, alt: "" }) : null, value || "Select a country"),
      React.createElement(Icon, { name: "arrowLeft", size: 14, color: G[400], style: { transform: open ? "rotate(90deg)" : "rotate(-90deg)" } })
    ),
    open && React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: `1px solid ${G[200]}`, borderRadius: 7, maxHeight: 220, overflowY: "auto", zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } },
      C_FLAGS.map(c => React.createElement("div", { key: c.n, onClick: () => { onChange(c.n); setOpen(false); }, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", cursor: "pointer", fontSize: 13.5, color: G[900], background: value === c.n ? G[50] : "transparent" }, onMouseEnter: e => e.currentTarget.style.background = G[50], onMouseLeave: e => e.currentTarget.style.background = value === c.n ? G[50] : "transparent" },
        c.c ? React.createElement("img", { src: `https://flagcdn.com/w20/${c.c}.png`, width: 20, alt: "" }) : React.createElement("div", { style: { width: 20 } }), c.n
      ))
    )
  );
};

export const Wizard = ({ open, onClose, prefill, onComplete, user }) => {
  const [step, setStep] = useState(1);
  const [proc, setProc] = useState("");
  const [budget, setBudget] = useState(5e3);
  const [health, setHealth] = useState([]);
  const [pref, setPref] = useState({ rh: "", cp: "" });
  const [cons, setCons] = useState({ c1: false, c2: false });
  const [form, setForm] = useState({ fn: "", ln: "", email: "", country: "", lang: "English", phone: "" });
  const [cErr, setCErr] = useState(false);
  const [wizErr, setWizErr] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open && prefill) {
      setForm((f) => ({ ...f, fn: prefill.fn || "", ln: prefill.ln || "", email: prefill.email || "" }));
    }
  }, [open, prefill]);

  const pct = Math.round(Math.min(step, 5) / 5 * 100);

  const next = async () => {
    if (step === 1) {
      if (!form.fn.trim() || !form.ln.trim() || !form.email.includes("@") || !form.country) {
        setWizErr(true);
        return;
      }
    }
    if (step === 2 && !proc) return;
    if (step === 4 && (!pref.rh || !pref.cp)) return;
    if (step === 5) {
      if (!cons.c1 || !cons.c2) {
        setCErr(true);
        return;
      }
      setSubmitted(true);
      if (user && user.id) {
        try {
          const SUPA_URL = window.VITE_SUPABASE_URL || window.SUPA_URL;
          const SUPA_KEY = window.VITE_SUPABASE_KEY || window.SUPA_KEY;
          const pacRes = await fetch(SUPA_URL + '/rest/v1/paciente?auth_user_id=eq.' + user.id + '&select=paciente_id', {
            headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
          }).then(r => r.json());
          if (pacRes && pacRes[0]) {
            const pid = pacRes[0].paciente_id;
            await fetch(SUPA_URL + '/rest/v1/caso', {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Prefer": "return=minimal" },
              body: JSON.stringify({ paciente_id: pid, estado: "lead", procedimiento: proc || "TBD" })
            });
            await fetch(SUPA_URL + '/rest/v1/perfil_medico', {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Prefer": "return=minimal" },
              body: JSON.stringify({ paciente_id: pid, procedimiento_interes: proc, presupuesto_estimado_usd: budget })
            });
          }
        } catch (e) { console.error("Error guardando en Supabase:", e); }
      }
      setStep(6);
      setTimeout(() => {
        setStep(1);
        setProc("");
        setHealth([]);
        setPref({ rh: "", cp: "" });
        setCons({ c1: false, c2: false });
        setSubmitted(false);
        onClose();
        if (onComplete) onComplete(form);
      }, 2200);
      return;
    }
    setStep((s2) => s2 + 1);
  };

  const back = () => setStep((s2) => s2 - 1);
  const togH = (v) => setHealth((h) => h.includes(v) ? h.filter((x) => x !== v) : [...h, v]);
  const close = () => {
    setStep(1);
    setProc("");
    setHealth([]);
    setPref({ rh: "", cp: "" });
    setCons({ c1: false, c2: false });
    setSubmitted(false);
    onClose();
  };

  const body = () => {
    if (submitted) return /* @__PURE__ */ React.createElement("div", { style: { padding: "48px 36px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 64, height: 64, borderRadius: "50%", background: T[50], border: `2px solid ${T[200]}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "leaf", size: 28, color: T[600] })), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 28, color: T[900], marginBottom: 12 } }, "You're on your way"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: G[500], lineHeight: 1.8, marginBottom: 8 } }, "Taking you to your dashboard\u2026"), /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 3, background: T[200], borderRadius: 3, margin: "16px auto 0", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", background: T[500], borderRadius: 3, animation: "progressBar 2.2s linear forwards" } })), /* @__PURE__ */ React.createElement("style", null, `@keyframes progressBar { from { width:0 } to { width:100% } }`));
    if (step === 1) return /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "First name" }), /* @__PURE__ */ React.createElement(WzFi, { ph: "Maria", val: form.fn, err: wizErr && !form.fn, onChange: (e) => { setForm((f) => ({ ...f, fn: e.target.value })); setWizErr(false); } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "Last name" }), /* @__PURE__ */ React.createElement(WzFi, { ph: "Vasquez", val: form.ln, err: wizErr && !form.ln, onChange: (e) => { setForm((f) => ({ ...f, ln: e.target.value })); setWizErr(false); } })), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1/-1" } }, /* @__PURE__ */ React.createElement(WzLbl, { t: "Email address" }), /* @__PURE__ */ React.createElement(WzFi, { type: "email", ph: "you@email.com", val: form.email, err: wizErr && (!form.email || !form.email.includes("@")), onChange: (e) => { setForm((f) => ({ ...f, email: e.target.value })); setWizErr(false); } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "Country of residence" }), /* @__PURE__ */ React.createElement("select", { value: form.country, onChange: (e) => { setForm((f) => ({ ...f, country: e.target.value })); setWizErr(false); }, style: { width: "100%", height: 42, border: `1px solid ${wizErr && !form.country ? "#fca5a5" : G[200]}`, borderRadius: 7, padding: "0 13px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: wizErr && !form.country ? "#fffafb" : "#fff" } }, ["", "United States", "Canada", "United Kingdom", "Australia", "Dominican Republic", "Argentina", "Austria", "Bahamas", "Belgium", "Bolivia", "Brazil", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Czech Republic", "Denmark", "Ecuador", "Egypt", "El Salvador", "Finland", "France", "Germany", "Greece", "Guatemala", "Honduras", "Hong Kong", "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Malaysia", "Mexico", "Netherlands", "New Zealand", "Nicaragua", "Norway", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "United Arab Emirates", "Uruguay", "Venezuela", "Vietnam", "Other"].map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c || "Select a country")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "Phone (optional)" }), /* @__PURE__ */ React.createElement(WzFi, { type: "tel", ph: "+1 555 000 000", val: form.phone, onChange: (e) => setForm((f) => ({ ...f, phone: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1/-1" } }, /* @__PURE__ */ React.createElement(WzLbl, { t: "Preferred language" }), /* @__PURE__ */ React.createElement("select", { value: form.lang, onChange: (e) => setForm((f) => ({ ...f, lang: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 13px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } }, ["English", "Spanish", "Portuguese", "French", "Italian", "German", "Arabic", "Chinese", "Japanese", "Korean", "Russian", "Other"].map((l) => /* @__PURE__ */ React.createElement("option", { key: l, value: l }, l)))));
    if (step === 2) return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "Procedure of interest" }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 } }, PROCS_LIST.map((p) => /* @__PURE__ */ React.createElement("div", { key: p, onClick: () => setProc(p), style: { padding: "10px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1.5px solid ${proc === p ? T[500] : G[200]}`, background: proc === p ? T[50] : "#fff", color: proc === p ? T[700] : G[700], fontWeight: proc === p ? 500 : 400 } }, p))), /* @__PURE__ */ React.createElement(WzLbl, { t: `Estimated budget: $${budget.toLocaleString()}` }), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        min: 1e3,
        max: 3e4,
        step: 500,
        value: budget,
        style: { "--p": `${((budget - 1e3) / 29e3 * 100).toFixed(1)}%` },
        onChange: (e) => setBudget(+e.target.value)
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: G[400] } }, /* @__PURE__ */ React.createElement("span", null, "$1,000"), /* @__PURE__ */ React.createElement("span", null, "$30,000+")));
    if (step === 3) return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "Pre-existing conditions (select all that apply)" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginTop: 8 } }, HEALTH_OPTS.map((h) => /* @__PURE__ */ React.createElement("label", { key: h, style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${health.includes(h) ? T[500] : G[200]}`, background: health.includes(h) ? T[50] : "#fff", cursor: "pointer", fontSize: 13, color: G[700] } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: health.includes(h), onChange: () => togH(h), style: { accentColor: T[500], width: 16, height: 16 } }), h))));
    if (step === 4) return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "Recovery home preference" }), ["Private villa", "Shared recovery home", "Hotel (self-managed)", "No preference"].map((r) => /* @__PURE__ */ React.createElement("label", { key: r, style: { display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, border: `1.5px solid ${pref.rh === r ? T[500] : G[200]}`, background: pref.rh === r ? T[50] : "#fff", cursor: "pointer", fontSize: 13, color: G[700], marginBottom: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "rh", checked: pref.rh === r, onChange: () => setPref((p) => ({ ...p, rh: r })), style: { accentColor: T[500] } }), r))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "Care package" }), ["Standard", "Premium (includes airport transfer + private nurse)", "Concierge (all-inclusive)"].map((c) => /* @__PURE__ */ React.createElement("label", { key: c, style: { display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, border: `1.5px solid ${pref.cp === c ? T[500] : G[200]}`, background: pref.cp === c ? T[50] : "#fff", cursor: "pointer", fontSize: 13, color: G[700], marginBottom: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "cp", checked: pref.cp === c, onChange: () => setPref((p) => ({ ...p, cp: c })), style: { accentColor: T[500] } }), c))));
    if (step === 5) return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { ...s.card, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Summary"), /* @__PURE__ */ React.createElement(IR, { k: "Name", v: `${form.fn} ${form.ln}`.trim() || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Email", v: form.email || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Country", v: form.country || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Procedure", v: proc || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Budget", v: `$${budget.toLocaleString()}` }), /* @__PURE__ */ React.createElement(IR, { k: "Recovery home", v: pref.rh || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Care package", v: pref.cp || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Health", v: health.length ? health.join(", ") : "None listed" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, [["c1", "I consent to Praesenti processing my health information to match me with providers."], ["c2", "I acknowledge that Praesenti is a coordination service and not a medical provider."]].map(([key, text]) => /* @__PURE__ */ React.createElement("label", { key, style: { display: "flex", gap: 12, padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${cons[key] ? T[500] : cErr ? "#fca5a5" : G[200]}`, background: cons[key] ? T[50] : "#fff", cursor: "pointer", fontSize: 12.5, color: G[700], lineHeight: 1.6 } }, /* @__PURE__ */ React.createElement("input", {
      type: "checkbox", checked: cons[key], onChange: () => {
        setCons((c) => ({ ...c, [key]: !c[key] }));
        setCErr(false);
      }, style: { accentColor: T[500], marginTop: 2, flexShrink: 0 }
    }), text)), cErr && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#dc2626" } }, "Please accept both consents to continue.")));
  };

  return /* @__PURE__ */ React.createElement(Modal, { open, onClose: close, wide: true, disableBackdropClose: true }, /* @__PURE__ */ React.createElement("div", { style: { padding: "28px 28px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", null, !submitted && /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 4 } }, "Step ", step, " of 5 \xB7 ", WZ_HNTS[step]), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950] } }, submitted ? "Application received" : WZ_LBLS[step]))), !submitted && /* @__PURE__ */ React.createElement("div", { style: { height: 3, background: G[100], borderRadius: 3, marginBottom: 24, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${pct}%`, background: T[500], borderRadius: 3, transition: "width .35s ease" } }))), /* @__PURE__ */ React.createElement("div", { style: { padding: "0 28px 28px" } }, body(), !submitted && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 28 } }, /* @__PURE__ */ React.createElement("button", { onClick: step === 1 ? close : back, style: { ...s.btnGhost, visibility: step === 1 ? "hidden" : "visible" } }, "Back"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center" } },
    wizErr && React.createElement("p", { style: { fontSize: 12, color: "#dc2626", marginRight: 14, fontWeight: 500 } }, "Incomplete information"),
    React.createElement("button", { onClick: next, style: s.btnPrimary }, step === 5 ? "Submit application" : "Continue")
  ))));
};

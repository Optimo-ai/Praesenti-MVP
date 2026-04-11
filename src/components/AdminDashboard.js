import { T, G, serif, sans, s, CASES, ADMIN_NOTES, RECOVERY_CHECKS, JOURNEY_STEPS } from '../constants.js';
import { fetchChecklist, saveChecklist } from '../supabase.js';
import { HamburgerIcon, Icon, SPill, Toast, Modal, IR } from './shared.js';

const { React } = window;
const { useState, useRef, useEffect } = React;

export const AdminDashboard = ({ onSignOut }) => {
  const [screen, setScreen] = useState("overview");
  const [sidebarItem, setSidebarItem] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [notes, setNotes] = useState(ADMIN_NOTES);
  const [toast, setToast] = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState(CASES[0]);
  const [adminCheckDone, setAdminCheckDone] = useState(Array(RECOVERY_CHECKS.length).fill(false));

  useEffect(() => {
    if (selectedCase && selectedCase.caso_id_uuid) {
      const load = async () => {
        const data = await fetchChecklist(selectedCase.caso_id_uuid);
        if (data && data.items) {
          setAdminCheckDone(data.items);
        } else {
          setAdminCheckDone(Array(RECOVERY_CHECKS.length).fill(false));
        }
      };
      load();
    } else {
      setAdminCheckDone(Array(RECOVERY_CHECKS.length).fill(false));
    }
  }, [selectedCase]);

  const handleToggleCheck = async (i) => {
    const nd = [...adminCheckDone];
    nd[i] = !nd[i];
    setAdminCheckDone(nd);
    if (selectedCase && selectedCase.caso_id_uuid) {
      await saveChecklist(selectedCase.caso_id_uuid, nd, "Admin");
      showToast("Checklist updated as Admin");
    }
  };

  const showToast = (msg) => setToast(msg);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedHome, setSelectedHome] = useState(null);
  const [selectedCoord, setSelectedCoord] = useState(null);

  const filtered = CASES.filter((c) => c.name.toLowerCase().includes(tableSearch.toLowerCase()) || c.proc.toLowerCase().includes(tableSearch.toLowerCase()));
  const navTo = (item, scr) => {
    const newScr = scr || "overview";
    setSidebarItem(item);
    setScreen(newScr);
    history.pushState({ role: "admin", item, scr: newScr, dash: "admin" }, "", "#admin/" + newScr);
  };
  useEffect(() => {
    if (!history.state || history.state.dash !== "admin") {
      history.replaceState({ item: sidebarItem, scr: screen, dash: "admin" }, "", "#admin/" + screen);
    }
    const onPop = (e) => {
      const st = e.state;
      if (!st || st.dash !== "admin") {
        if (!st) { setScreen("overview"); setSidebarItem("Dashboard"); }
        return;
      }
      setSidebarItem(st.item);
      setScreen(st.scr || "overview");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const saveNote = () => {
    if (!noteInput.trim()) return;
    const now = /* @__PURE__ */ new Date();
    setNotes((n) => [{ author: "Admin", date: `March ${now.getDate()} \xB7 ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`, text: noteInput.trim() }, ...n]);
    setNoteInput("");
    showToast("Note saved");
  };
  const ADMIN_GROUPS = [
    ["Operations", [
      ["Dashboard", "chartBar", () => navTo("Dashboard", "overview")],
      ["All Cases", "users", () => navTo("All Cases", "case")],
      ["Pipeline", "trendingUp", () => navTo("Pipeline", "pipeline")],
      ["Incidents", "alertCircle", () => navTo("Incidents", "incidents")]
    ]],
    ["Network", [
      ["Providers", "userMd", () => navTo("Providers", "providers")],
      ["+ New Clinic", "hospital", () => navTo("+ New Clinic", "form-clinic")],
      ["+ New Doctor", "stethoscope", () => navTo("+ New Doctor", "form-doctor")],
      ["Recovery Homes", "home", () => navTo("Recovery Homes", "homes")],
      ["+ New Home", "seedling", () => navTo("+ New Home", "form-home")],
      ["Coordinators", "network", () => navTo("Coordinators", "coordinators")]
    ]],
    ["Finance", [
      ["Payments", "creditCard", () => navTo("Payments", "finance-payments")],
      ["Escrow", "lock", () => navTo("Escrow", "escrow")],
      ["Reports", "fileText", () => navTo("Reports", "reports")]
    ]]
  ];
  const PanelHeader = ({ title, subtitle, actions }) => /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 28 } }, /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, title), subtitle && /* @__PURE__ */ React.createElement("p", { style: { color: G[400], fontSize: 13 } }, subtitle), actions && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 14 } }, actions));
  const Stat = ({ label, value, color, icon }) => /* @__PURE__ */ React.createElement("div", { style: { ...s.card, marginBottom: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: s.label }, label), /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 14, color })), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 32, fontWeight: 600, color } }, value));
  const PIPELINE_COLS = [
    { label: "New Lead", color: "#6b7280", items: [{ name: "Rafael Oliveira", proc: "Hair Transplant", budget: "$3,100", country: "BR" }, { name: "Claire Marchand", proc: "Rhinoplasty", budget: "$3,900", country: "AU" }] },
    { label: "Qualified", color: "#92400e", items: [{ name: "Marcus Webb", proc: "Liposuction", budget: "$6,800", country: "UK" }, { name: "Hanna Bergstr\u00f6m", proc: "Tummy Tuck", budget: "$7,200", country: "PL" }] },
    { label: "Matched", color: "#1a7a72", items: [{ name: "Pietro Lombardi", proc: "Bariatric Surgery", budget: "$11,000", country: "MX" }] },
    { label: "Pre-op", color: "#b45309", items: [{ name: "Marcus Webb", proc: "Liposuction", budget: "$6,800", country: "UK" }] },
    { label: "In Recovery", color: "#1a9e95", items: [{ name: "Emily Thornton", proc: "Rhinoplasty", budget: "$4,200", country: "USA" }, { name: "Sofia Mart\u00ednez", proc: "Breast Aug.", budget: "$5,500", country: "CA" }] },
    { label: "Completed", color: "#059669", items: [{ name: "Yuki Tanaka", proc: "Dental Veneers", budget: "$2,100", country: "US" }] }
  ];
  const PipelineScreen = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement(PanelHeader, { title: "Pipeline", subtitle: "Patient journey status across all active cases" }), /* @__PURE__ */ React.createElement("div", { className: "grid-6", style: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, alignItems: "start" } }, PIPELINE_COLS.map(({ label, color, items }) => /* @__PURE__ */ React.createElement("div", { key: label }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color } }, label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, background: G[100], color: G[500], borderRadius: 10, padding: "1px 7px", fontWeight: 600 } }, items.length)), items.map((it, i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: i,
      style: { ...s.card, marginBottom: 8, padding: "12px 14px", cursor: "pointer" },
      onMouseEnter: (e) => e.currentTarget.style.borderColor = T[300],
      onMouseLeave: (e) => e.currentTarget.style.borderColor = G[200]
    },
/* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900], marginBottom: 3 } }, it.name),
/* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: G[400] } }, it.proc),
/* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: T[600], fontWeight: 500, marginTop: 4 } }, it.budget, " \xB7 ", it.country)
  ))))));
  const [incidents, setIncidents] = useState([
    { id: "INC-001", patient: "Hanna Bergstr\u00f6m", type: "Medical", desc: "Mild post-op fever reported on day 2. Dr. Medina notified. Monitoring underway.", severity: "Medium", date: "Mar 26", resolved: false },
    { id: "INC-002", patient: "Marcus Webb", type: "Logistics", desc: "Airport transfer missed due to flight delay. Rescheduled. No impact on surgery.", severity: "Low", date: "Mar 25", resolved: true },
    { id: "INC-003", patient: "Isabelle Fontaine", type: "Administrative", desc: "Consent form re-signature required after minor procedure change.", severity: "Low", date: "Mar 22", resolved: true },
    { id: "INC-004", patient: "Emily Thornton", type: "Medical", desc: "Patient reported unusual swelling. Surgical team reviewed remotely; deemed normal.", severity: "Low", date: "Mar 23", resolved: true }
  ]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [newInc, setNewInc] = useState({ patient: "", type: "Medical", severity: "Low", desc: "" });

  const resolveIncident = (id) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, resolved: true } : inc));
    showToast("Incident marked as resolved");
  };

  const logIncident = () => {
    if (!newInc.patient.trim() || !newInc.desc.trim()) { showToast("Please fill in patient and description"); return; }
    const id = "INC-" + String(incidents.length + 1).padStart(3, "0");
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setIncidents(prev => [{ id, ...newInc, date: dateStr, resolved: false }, ...prev]);
    setNewInc({ patient: "", type: "Medical", severity: "Low", desc: "" });
    setShowIncidentForm(false);
    showToast("Incident logged: " + id);
  };

  const IncidentsScreen = () => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
    React.createElement(PanelHeader, { title: "Incidents", subtitle: "Active and resolved case incidents requiring attention",
      actions: [React.createElement("button", { key: "new", onClick: () => setShowIncidentForm(o => !o), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, showIncidentForm ? "Cancel" : "+ Log incident")]
    }),
    showIncidentForm && React.createElement("div", { style: { ...s.card, marginBottom: 24, background: T[50], border: `1px solid ${T[100]}` } },
      React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "New incident"),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } },
        React.createElement("div", null,
          React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Patient *"),
          React.createElement("input", { value: newInc.patient, onChange: e => setNewInc(p => ({ ...p, patient: e.target.value })), placeholder: "Patient name", style: { width: "100%", height: 40, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 12px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } })
        ),
        React.createElement("div", null,
          React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Type"),
          React.createElement("select", { value: newInc.type, onChange: e => setNewInc(p => ({ ...p, type: e.target.value })), style: { width: "100%", height: 40, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 12px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } },
            ["Medical", "Logistics", "Administrative", "Other"].map(t => React.createElement("option", { key: t }, t))
          )
        )
      ),
      React.createElement("div", { style: { marginBottom: 12 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Severity"),
        React.createElement("select", { value: newInc.severity, onChange: e => setNewInc(p => ({ ...p, severity: e.target.value })), style: { width: "100%", height: 40, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 12px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } },
          ["Low", "Medium", "High"].map(t => React.createElement("option", { key: t }, t))
        )
      ),
      React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Description *"),
        React.createElement("textarea", { value: newInc.desc, onChange: e => setNewInc(p => ({ ...p, desc: e.target.value })), placeholder: "Describe the incident...", rows: 3, style: { width: "100%", border: `1px solid ${G[200]}`, borderRadius: 7, padding: "10px 12px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], resize: "vertical" } })
      ),
      React.createElement("button", { onClick: logIncident, style: { ...s.btnPrimary, padding: "10px 24px", fontSize: 13 } }, "Log incident")
    ),
    React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
      React.createElement(Stat, { label: "Open", value: incidents.filter(i => !i.resolved).length, color: "#dc2626", icon: "alertCircle" }),
      React.createElement(Stat, { label: "Resolved this month", value: incidents.filter(i => i.resolved).length, color: T[600], icon: "check" }),
      React.createElement(Stat, { label: "Total logged", value: incidents.length, color: G[500], icon: "fileText" })
    ),
    incidents.map((inc) => React.createElement("div", { key: inc.id, style: { ...s.card, marginBottom: 12, borderLeft: `3px solid ${inc.resolved ? T[200] : inc.severity === "High" ? "#dc2626" : inc.severity === "Medium" ? "#f59e0b" : G[300]}` } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } },
        React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } },
          React.createElement("span", { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: G[400] } }, inc.id),
          React.createElement("span", { style: { fontSize: 11, padding: "2px 9px", borderRadius: 10, fontWeight: 500, background: inc.resolved ? T[50] : "#fef2f2", color: inc.resolved ? T[700] : "#dc2626", border: `1px solid ${inc.resolved ? T[100] : "#fca5a5"}` } }, inc.resolved ? "Resolved" : "Open"),
          React.createElement("span", { style: { fontSize: 11, color: G[500], background: G[100], padding: "2px 8px", borderRadius: 10 } }, inc.type),
          React.createElement("span", { style: { fontSize: 11, padding: "2px 8px", borderRadius: 10, color: inc.severity === "High" ? "#dc2626" : inc.severity === "Medium" ? "#92400e" : G[500], background: inc.severity === "High" ? "#fef2f2" : inc.severity === "Medium" ? "#fef3c7" : G[50] } }, inc.severity)
        ),
        React.createElement("span", { style: { fontSize: 11, color: G[400] } }, inc.date)
      ),
      React.createElement("div", { style: { fontSize: 14, fontWeight: 500, color: G[900], marginBottom: 4 } }, inc.patient),
      React.createElement("p", { style: { fontSize: 13, color: G[600], lineHeight: 1.6 } }, inc.desc),
      !inc.resolved && React.createElement("button", { onClick: () => resolveIncident(inc.id), style: { ...s.btnGhost, marginTop: 12, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6 } },
        React.createElement(Icon, { name: "check", size: 13, color: T[600] }),
        "Mark resolved"
      )
    ))
  )
  const PROVIDERS = [
    { name: "Dr. A. Vargas", spec: "Plastic & Reconstructive", hosp: "Cl\u00ednica Vida", cases: 38, rating: "4.9", cert: "ABPS \xB7 JCI", phone: "+1 809 555 0101", email: "vargas@clinicavida.com", langs: "Spanish, English", bio: "Board-certified plastic surgeon with 12 years of experience in aesthetic and reconstructive procedures. Trained at Universidad Aut\u00f3noma de Santo Domingo and completed a fellowship in Miami, FL." },
    { name: "Dr. C. Romero", spec: "Bariatric Surgery", hosp: "Centro M\u00e9dico Central", cases: 21, rating: "4.8", cert: "IFSO \xB7 JCI", phone: "+1 809 555 0202", email: "romero@centromedico.com", langs: "Spanish, English, Portuguese", bio: "Specialist in minimally invasive bariatric surgery with over 400 successful procedures. Member of the International Federation for the Surgery of Obesity." },
    { name: "Dr. M. Medina", spec: "General & Bariatric", hosp: "Hospital del Este", cases: 15, rating: "4.7", cert: "ACS \xB7 JCI", phone: "+1 809 555 0303", email: "medina@hospitaleste.com", langs: "Spanish", bio: "General surgeon specializing in bariatric and laparoscopic procedures. Over 10 years of experience at Hospital del Este." },
    { name: "Dr. I. Castillo", spec: "Hair Restoration", hosp: "Cl\u00ednica del Sol", cases: 29, rating: "5.0", cert: "ISHRS", phone: "+1 809 555 0404", email: "castillo@clinicasol.com", langs: "Spanish, English", bio: "Hair restoration specialist certified by the International Society of Hair Restoration Surgery. Pioneer in FUE technique in the Dominican Republic." },
    { name: "Dr. R. Herrera", spec: "Dental & Maxillofacial", hosp: "DentalPro", cases: 44, rating: "4.9", cert: "IAOMS", phone: "+1 809 555 0505", email: "herrera@dentalpro.com", langs: "Spanish, English, French", bio: "Oral and maxillofacial surgeon with specialty in dental veneers, implants, and jaw surgery. 15 years serving international patients." }
  ];
  // \u2500\u2500 PROVIDER DETAIL SCREEN (full page) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const ProviderDetailScreen = () => {
    const p = selectedProvider;
    if (!p) return null;
    const [photoError, setPhotoError] = React.useState(false);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, overflowY: "auto" } },
      // Hero banner
      React.createElement("div", { style: { background: T[950], padding: "32px 40px 0", position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize: "32px 32px" } }),
        React.createElement("div", { style: { position: "absolute", top: "-30%", right: "-5%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(26,158,149,.12) 0%,transparent 65%)", pointerEvents: "none" } }),
        React.createElement("div", { style: { position: "relative", zIndex: 1 } },
          React.createElement("button", { onClick: () => setSelectedProvider(null), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, marginBottom: 24, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)" } },
            React.createElement(Icon, { name: "arrowLeft", size: 13, color: "rgba(255,255,255,.7)" }), "Providers"
          ),
          React.createElement("div", { style: { display: "flex", gap: 28, alignItems: "flex-end", paddingBottom: 32 } },
            // Photo area
            React.createElement("div", { style: { width: 110, height: 110, borderRadius: 16, background: T[700], border: "3px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", position: "relative" } },
              React.createElement("div", { style: { textAlign: "center" } },
                React.createElement("div", { style: { fontFamily: serif, fontSize: 38, fontWeight: 600, color: T[200] } }, p.name.split(" ")[1][0]),
                React.createElement("div", { style: { fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 2 } }, "Photo")
              )
            ),
            React.createElement("div", { style: { flex: 1, paddingBottom: 4 } },
              React.createElement("div", { style: { fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: T[300], marginBottom: 6 } }, p.spec),
              React.createElement("h1", { style: { fontFamily: serif, fontSize: 32, fontWeight: 600, color: "#fff", marginBottom: 6 } }, p.name),
              React.createElement("div", { style: { fontSize: 14, color: "rgba(255,255,255,.5)" } }, p.hosp),
              React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 14, alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: T[300] } }, p.rating, " \u2605"),
                React.createElement("span", { style: { fontSize: 12, color: "rgba(255,255,255,.35)" } }, p.cases + " cases"),
                React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "rgba(77,208,200,.15)", color: T[300], border: "1px solid rgba(77,208,200,.2)" } }, p.cert)
              )
            )
          )
        )
      ),

      // Body
      React.createElement("div", { style: { padding: "32px 40px", maxWidth: 860 } },

        // Stats row
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 } },
          [["Specialty", p.spec], ["Hospital", p.hosp], ["Languages", p.langs], ["Certifications", p.cert]].map(([k, v]) =>
            React.createElement("div", { key: k, style: { ...s.card, marginBottom: 0 } },
              React.createElement("div", { style: s.label }, k),
              React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900], marginTop: 6, lineHeight: 1.4 } }, v)
            )
          )
        ),

        // Bio
        React.createElement("div", { style: { ...s.card, marginBottom: 20 } },
          React.createElement("div", { style: { ...s.label, marginBottom: 12 } }, "Biography"),
          React.createElement("p", { style: { fontSize: 14, color: G[600], lineHeight: 1.8 } }, p.bio)
        ),

        // Photo gallery placeholder
        React.createElement("div", { style: { ...s.card, marginBottom: 20 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
            React.createElement("div", { style: s.label }, "Photos"),
            React.createElement("button", { onClick: () => showToast("Photo upload coming soon"), style: { ...s.btnGhost, fontSize: 11, padding: "5px 12px" } }, "+ Add photo")
          ),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 } },
            [1,2,3,4].map(i => React.createElement("div", { key: i, style: { aspectRatio: "1", borderRadius: 10, background: G[100], border: `2px dashed ${G[200]}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6 },
              onClick: () => showToast("Photo upload coming soon") },
              React.createElement(Icon, { name: "document", size: 20, color: G[300] }),
              React.createElement("span", { style: { fontSize: 10, color: G[400] } }, "Add photo")
            ))
          )
        ),

        // Contact
        React.createElement("div", { style: s.card },
          React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Contact information"),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
            [["Phone", p.phone], ["Email", p.email]].map(([k, v]) =>
              React.createElement("div", { key: k },
                React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: G[400], letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 } }, k),
                React.createElement("div", { style: { fontSize: 14, color: G[800] } }, v)
              )
            )
          )
        )
      )
    );
  };

  const ProvidersScreen = () => {
    if (selectedProvider) return React.createElement(ProviderDetailScreen, null);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Providers", subtitle: "Board-certified surgeons in the Praesenti network",
        actions: [
          React.createElement("button", { key: "c", onClick: () => navTo("+ New Clinic", "form-clinic"), style: { ...s.btnGhost, fontSize: 13, padding: "9px 18px" } }, "+ Clinic"),
          React.createElement("button", { key: "d", onClick: () => navTo("+ New Doctor", "form-doctor"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 18px" } }, "+ Doctor")
        ]
      }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(Stat, { label: "Active providers", value: PROVIDERS.length, color: T[700], icon: "userMd" }),
        React.createElement(Stat, { label: "Avg. rating", value: "4.86", color: T[500], icon: "activity" }),
        React.createElement(Stat, { label: "Cases this month", value: "12", color: G[500], icon: "users" })
      ),
      PROVIDERS.map((p, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 18, marginBottom: 12, cursor: "pointer" },
        onClick: () => setSelectedProvider(p),
        onMouseEnter: e => e.currentTarget.style.borderColor = T[300],
        onMouseLeave: e => e.currentTarget.style.borderColor = G[200]
      },
        React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: T[800], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 18, fontWeight: 600, color: T[200], flexShrink: 0 } }, p.name.split(" ")[1][0]),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, p.name),
          React.createElement("div", { style: { fontSize: 12, color: G[500], marginTop: 2 } }, p.spec, " \u00b7 ", p.hosp),
          React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 3 } }, p.cert)
        ),
        React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, p.rating, " \u2605"),
          React.createElement("div", { style: { fontSize: 11, color: G[400] } }, p.cases, " cases")
        ),
        React.createElement(Icon, { name: "arrowLeft", size: 14, color: G[300], style: { transform: "rotate(180deg)" } })
      ))
    );
  };

    const HOMES = [
    { name: "Villa Serena", loc: "Piantini, Santo Domingo", beds: 4, occ: 2, amenities: "Pool \xB7 Private nurse \xB7 Chef", rate: "$280/night", rating: "4.9", phone: "+1 809 555 1001", email: "info@villaserena.com", includes: "WiFi, 3 meals/day, AC, Pool, Transport", staff: "Shift nursing 12h + night guard", emergency: "Cl\u00ednica Vida" },
    { name: "Casa Brisa", loc: "Naco, Santo Domingo", beds: 6, occ: 4, amenities: "Pool \xB7 AC \xB7 On-call nurse", rate: "$220/night", rating: "4.8", phone: "+1 809 555 1002", email: "info@casabrisa.com", includes: "WiFi, Breakfast, AC, Pool", staff: "On-call nurse 24h", emergency: "Cl\u00ednica Vida" },
    { name: "Punta Suites", loc: "Punta Cana", beds: 8, occ: 3, amenities: "Medical staff 24/7 \xB7 Meals", rate: "$350/night", rating: "5.0", phone: "+1 809 555 1003", email: "info@puntasuites.com", includes: "WiFi, Full board, AC, Medical staff 24/7, Transport", staff: "Resident medical and nursing staff", emergency: "Cl\u00ednica del Este" },
    { name: "Residencial Sol", loc: "Gazcue, Santo Domingo", beds: 3, occ: 1, amenities: "Shared cook \xB7 Transport", rate: "$160/night", rating: "4.7", phone: "+1 809 555 1004", email: "info@residencialsol.com", includes: "WiFi, Shared cook, AC, Transport", staff: "Day assistant + basic night guard", emergency: "Cl\u00ednica Vida" }
  ];
  // \u2500\u2500 HOME DETAIL SCREEN (full page) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const HomeDetailScreen = () => {
    const h = selectedHome;
    if (!h) return null;
    const occPct = Math.round((h.occ / h.beds) * 100);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, overflowY: "auto" } },
      // Hero
      React.createElement("div", { style: { background: T[950], padding: "32px 40px 0", position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize: "32px 32px" } }),
        React.createElement("div", { style: { position: "relative", zIndex: 1 } },
          React.createElement("button", { onClick: () => setSelectedHome(null), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, marginBottom: 24, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)" } },
            React.createElement(Icon, { name: "arrowLeft", size: 13, color: "rgba(255,255,255,.7)" }), "Recovery Homes"
          ),
          React.createElement("div", { style: { display: "flex", gap: 28, alignItems: "flex-end", paddingBottom: 32 } },
            React.createElement("div", { style: { width: 110, height: 110, borderRadius: 16, background: T[700], border: "3px solid rgba(255,255,255,.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              React.createElement(Icon, { name: "home", size: 36, color: T[200] }),
              React.createElement("div", { style: { fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 4 } }, "Photo")
            ),
            React.createElement("div", { style: { flex: 1, paddingBottom: 4 } },
              React.createElement("div", { style: { fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: T[300], marginBottom: 6 } }, "Recovery Home"),
              React.createElement("h1", { style: { fontFamily: serif, fontSize: 32, fontWeight: 600, color: "#fff", marginBottom: 6 } }, h.name),
              React.createElement("div", { style: { fontSize: 14, color: "rgba(255,255,255,.5)" } }, h.loc),
              React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 14, alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: T[300] } }, h.rating, " \u2605"),
                React.createElement("span", { style: { fontSize: 12, color: "rgba(255,255,255,.35)" } }, h.rate),
                React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, background: occPct > 70 ? "rgba(220,38,38,.2)" : "rgba(77,208,200,.15)", color: occPct > 70 ? "#fca5a5" : T[300], border: "1px solid " + (occPct > 70 ? "rgba(220,38,38,.3)" : "rgba(77,208,200,.2)") } },
                  h.occ + "/" + h.beds + " beds occupied"
                )
              )
            )
          )
        )
      ),

      // Body
      React.createElement("div", { style: { padding: "32px 40px", maxWidth: 860 } },

        // Stats
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 } },
          [["Rate", h.rate], ["Total beds", h.beds], ["Available", h.beds - h.occ], ["Occupancy", occPct + "%"]].map(([k, v]) =>
            React.createElement("div", { key: k, style: { ...s.card, marginBottom: 0 } },
              React.createElement("div", { style: s.label }, k),
              React.createElement("div", { style: { fontFamily: serif, fontSize: 22, fontWeight: 600, color: k === "Occupancy" && occPct > 70 ? "#dc2626" : T[700], marginTop: 6 } }, v)
            )
          )
        ),

        // Occupancy bar
        React.createElement("div", { style: { ...s.card, marginBottom: 20 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } },
            React.createElement("div", { style: s.label }, "Bed occupancy"),
            React.createElement("span", { style: { fontSize: 12, color: G[500] } }, h.occ + " of " + h.beds + " occupied")
          ),
          React.createElement("div", { style: { height: 8, background: G[100], borderRadius: 4, overflow: "hidden" } },
            React.createElement("div", { style: { height: "100%", width: occPct + "%", background: occPct > 70 ? "#dc2626" : T[500], borderRadius: 4, transition: "width .4s" } })
          )
        ),

        // Details
        React.createElement("div", { style: { ...s.card, marginBottom: 20 } },
          React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Facility details"),
          [["What's included", h.includes], ["Staff model", h.staff], ["Emergency clinic", h.emergency], ["Amenities", h.amenities]].map(([k, v]) =>
            React.createElement("div", { key: k, style: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${G[100]}`, fontSize: 13 } },
              React.createElement("span", { style: { color: G[500], flexShrink: 0, marginRight: 16 } }, k),
              React.createElement("span", { style: { fontWeight: 500, color: G[900], textAlign: "right" } }, v)
            )
          )
        ),

        // Photo gallery
        React.createElement("div", { style: { ...s.card, marginBottom: 20 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
            React.createElement("div", { style: s.label }, "Photos"),
            React.createElement("button", { onClick: () => showToast("Photo upload coming soon"), style: { ...s.btnGhost, fontSize: 11, padding: "5px 12px" } }, "+ Add photo")
          ),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 } },
            [1,2,3,4].map(i => React.createElement("div", { key: i, style: { aspectRatio: "4/3", borderRadius: 10, background: G[100], border: `2px dashed ${G[200]}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6 },
              onClick: () => showToast("Photo upload coming soon") },
              React.createElement(Icon, { name: "document", size: 20, color: G[300] }),
              React.createElement("span", { style: { fontSize: 10, color: G[400] } }, "Add photo")
            ))
          )
        ),

        // Contact
        React.createElement("div", { style: s.card },
          React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Contact"),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
            [["Phone", h.phone], ["Email", h.email]].map(([k, v]) =>
              React.createElement("div", { key: k },
                React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: G[400], letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 } }, k),
                React.createElement("div", { style: { fontSize: 14, color: G[800] } }, v)
              )
            )
          )
        )
      )
    );
  };

  const HomesScreen = () => {
    if (selectedHome) return React.createElement(HomeDetailScreen, null);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Recovery Homes", subtitle: "Accredited recovery facilities in the network",
        actions: [React.createElement("button", { key: "add", onClick: () => navTo("+ New Home", "form-home"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add home")]
      }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(Stat, { label: "Total homes", value: HOMES.length, color: T[700], icon: "home" }),
        React.createElement(Stat, { label: "Occupied beds", value: HOMES.reduce((a, h) => a + h.occ, 0), color: T[500], icon: "users" }),
        React.createElement(Stat, { label: "Available beds", value: HOMES.reduce((a, h) => a + (h.beds - h.occ), 0), color: G[500], icon: "check" })
      ),
      React.createElement("div", { className: "grid-2", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
        HOMES.map((h, i) => React.createElement("div", { key: i, style: { ...s.card, cursor: "pointer" },
          onClick: () => setSelectedHome(h),
          onMouseEnter: e => e.currentTarget.style.borderColor = T[300],
          onMouseLeave: e => e.currentTarget.style.borderColor = G[200]
        },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 } },
            React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 15, fontWeight: 600, color: G[900], fontFamily: serif } }, h.name),
              React.createElement("div", { style: { fontSize: 12, color: G[400], marginTop: 2 } }, h.loc)
            ),
            React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, h.rating, " \u2605")
          ),
          React.createElement("div", { style: { display: "flex", gap: 20, fontSize: 12, color: G[600], marginBottom: 10 } },
            React.createElement("span", null, h.occ, "/", h.beds, " beds occupied"),
            React.createElement("span", { style: { color: T[600], fontWeight: 500 } }, h.rate)
          ),
          React.createElement("div", { style: { fontSize: 11, color: G[400], marginBottom: 12 } }, h.amenities),
          React.createElement("div", { style: { height: 4, background: G[100], borderRadius: 2, marginBottom: 12 } },
            React.createElement("div", { style: { height: "100%", width: `${(h.occ / h.beds * 100).toFixed(0)}%`, background: h.occ / h.beds > 0.7 ? "#dc2626" : T[500], borderRadius: 2 } })
          ),
          React.createElement("div", { style: { display: "flex", justifyContent: "flex-end" } },
            React.createElement(Icon, { name: "arrowLeft", size: 14, color: G[300], style: { transform: "rotate(180deg)" } })
          )
        ))
      )
    );
  };

    const COORDS = [
    { name: "Laura Mendez", cases: 8, lang: "EN \xB7 ES", status: "Active", email: "laura@praesenti.com", rating: "4.9", phone: "+1 809 555 2001", joined: "Jan 2024", bio: "Senior care coordinator with expertise in plastic surgery cases. Fluent in English and Spanish." },
    { name: "Carlos Vega", cases: 5, lang: "EN \xB7 ES \xB7 PT", status: "Active", email: "carlos@praesenti.com", rating: "4.8", phone: "+1 809 555 2002", joined: "Mar 2024", bio: "Trilingual coordinator specializing in bariatric and reconstructive cases. Background in healthcare administration." },
    { name: "Nadia Bertrand", cases: 3, lang: "EN \xB7 FR", status: "Active", email: "nadia@praesenti.com", rating: "5.0", phone: "+1 809 555 2003", joined: "Jun 2024", bio: "French-English coordinator focused on European patient experience. Former medical tourism consultant in Paris." },
    { name: "Kevin Osei", cases: 0, lang: "EN", status: "On leave", email: "kevin@praesenti.com", rating: "4.7", phone: "+1 809 555 2004", joined: "Sep 2023", bio: "Experienced coordinator currently on scheduled leave. Returns Q2 2026." }
  ];
  // \u2500\u2500 COORDINATOR DETAIL SCREEN (full page) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const CoordDetailScreen = () => {
    const coord = selectedCoord;
    if (!coord) return null;
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, overflowY: "auto" } },
      React.createElement("div", { style: { background: T[950], padding: "32px 40px 0", position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize: "32px 32px" } }),
        React.createElement("div", { style: { position: "relative", zIndex: 1 } },
          React.createElement("button", { onClick: () => setSelectedCoord(null), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, marginBottom: 24, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)" } },
            React.createElement(Icon, { name: "arrowLeft", size: 13, color: "rgba(255,255,255,.7)" }), "Coordinators"
          ),
          React.createElement("div", { style: { display: "flex", gap: 28, alignItems: "flex-end", paddingBottom: 32 } },
            React.createElement("div", { style: { width: 110, height: 110, borderRadius: "50%", background: T[700], border: "3px solid rgba(255,255,255,.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              React.createElement("div", { style: { fontFamily: serif, fontSize: 38, fontWeight: 600, color: T[200] } }, coord.name[0]),
              React.createElement("div", { style: { fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 2 } }, "Photo")
            ),
            React.createElement("div", { style: { flex: 1, paddingBottom: 4 } },
              React.createElement("div", { style: { fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: T[300], marginBottom: 6 } }, "Care Coordinator"),
              React.createElement("h1", { style: { fontFamily: serif, fontSize: 32, fontWeight: 600, color: "#fff", marginBottom: 6 } }, coord.name),
              React.createElement("div", { style: { fontSize: 14, color: "rgba(255,255,255,.5)" } }, coord.lang),
              React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 14, alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: T[300] } }, coord.rating, " \u2605"),
                React.createElement("span", { style: { fontSize: 12, color: "rgba(255,255,255,.35)" } }, coord.cases + " active cases"),
                React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, background: coord.status === "Active" ? "rgba(77,208,200,.15)" : "rgba(255,255,255,.08)", color: coord.status === "Active" ? T[300] : "rgba(255,255,255,.4)", border: "1px solid " + (coord.status === "Active" ? "rgba(77,208,200,.2)" : "rgba(255,255,255,.1)") } }, coord.status)
              )
            )
          )
        )
      ),
      React.createElement("div", { style: { padding: "32px 40px", maxWidth: 860 } },
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 } },
          [["Active cases", coord.cases], ["Rating", coord.rating + " \u2605"], ["Languages", coord.lang], ["Since", coord.joined]].map(([k, v]) =>
            React.createElement("div", { key: k, style: { ...s.card, marginBottom: 0 } },
              React.createElement("div", { style: s.label }, k),
              React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900], marginTop: 6 } }, v)
            )
          )
        ),
        React.createElement("div", { style: { ...s.card, marginBottom: 20 } },
          React.createElement("div", { style: { ...s.label, marginBottom: 12 } }, "About"),
          React.createElement("p", { style: { fontSize: 14, color: G[600], lineHeight: 1.8 } }, coord.bio)
        ),
        React.createElement("div", { style: { ...s.card, marginBottom: 20 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
            React.createElement("div", { style: s.label }, "Photo"),
            React.createElement("button", { onClick: () => showToast("Photo upload coming soon"), style: { ...s.btnGhost, fontSize: 11, padding: "5px 12px" } }, "+ Add photo")
          ),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 } },
            [1,2].map(i => React.createElement("div", { key: i, style: { aspectRatio: "3/2", borderRadius: 10, background: G[100], border: `2px dashed ${G[200]}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6 },
              onClick: () => showToast("Photo upload coming soon") },
              React.createElement(Icon, { name: "person", size: 22, color: G[300] }),
              React.createElement("span", { style: { fontSize: 10, color: G[400] } }, "Add photo")
            ))
          )
        ),
        React.createElement("div", { style: s.card },
          React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Contact"),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
            [["Phone", coord.phone], ["Email", coord.email]].map(([k, v]) =>
              React.createElement("div", { key: k },
                React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: G[400], letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 } }, k),
                React.createElement("div", { style: { fontSize: 14, color: G[800] } }, v)
              )
            )
          )
        )
      )
    );
  };

  const CoordinatorsScreen = () => {
    if (selectedCoord) return React.createElement(CoordDetailScreen, null);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Coordinators", subtitle: "Patient care coordination team",
        actions: [React.createElement("button", { key: "add", onClick: () => showToast("Coordinator invite coming soon"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add coordinator")]
      }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(Stat, { label: "Active coordinators", value: COORDS.filter(c => c.status === "Active").length, color: T[700], icon: "users" }),
        React.createElement(Stat, { label: "Total active cases", value: COORDS.reduce((a, c) => a + c.cases, 0), color: T[500], icon: "clipboard" }),
        React.createElement(Stat, { label: "Languages covered", value: "4", color: G[500], icon: "globe" })
      ),
      COORDS.map((coord, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 16, marginBottom: 12, cursor: "pointer" },
        onClick: () => setSelectedCoord(coord),
        onMouseEnter: e => e.currentTarget.style.borderColor = T[300],
        onMouseLeave: e => e.currentTarget.style.borderColor = G[200]
      },
        React.createElement("div", { style: { width: 42, height: 42, borderRadius: "50%", background: T[100], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 17, fontWeight: 600, color: T[700], flexShrink: 0 } }, coord.name[0]),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, coord.name),
          React.createElement("div", { style: { fontSize: 12, color: G[500], marginTop: 2 } }, coord.email),
          React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } }, "Languages: ", coord.lang)
        ),
        React.createElement("div", { style: { textAlign: "center", flexShrink: 0 } },
          React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: T[600], fontFamily: serif } }, coord.cases),
          React.createElement("div", { style: { fontSize: 10, color: G[400] } }, "cases")
        ),
        React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 500, background: coord.status === "Active" ? T[50] : G[100], color: coord.status === "Active" ? T[700] : G[500], border: `1px solid ${coord.status === "Active" ? T[100] : G[200]}` } }, coord.status),
        React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, coord.rating, " \u2605"),
          React.createElement(Icon, { name: "arrowLeft", size: 14, color: G[300], style: { transform: "rotate(180deg)", marginTop: 6 } })
        )
      ))
    );
  };

    const FIN_PAYMENTS = [
    { date: "Mar 20", patient: "Emily Thornton", desc: "Rhinoplasty", amount: "$4,200", status: "Settled", method: "Escrow" },
    { date: "Mar 20", patient: "Sofia Mart\u00ednez", desc: "Breast Augmentation", amount: "$5,500", status: "Settled", method: "Escrow" },
    { date: "Mar 25", patient: "Marcus Webb", desc: "Liposuction deposit", amount: "$2,040", status: "Held", method: "Escrow" },
    { date: "Apr 02", patient: "Marcus Webb", desc: "Liposuction balance", amount: "$4,760", status: "Pending", method: "\u2014" },
    { date: "Apr 09", patient: "Hanna Bergstr\u00f6m", desc: "Tummy Tuck deposit", amount: "$2,160", status: "Pending", method: "\u2014" }
  ];
  const FinancePaymentsScreen = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement(PanelHeader, { title: "Payments", subtitle: "All patient transactions across active cases" }), /* @__PURE__ */ React.createElement("div", { className: "grid-4", style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 } }, /* @__PURE__ */ React.createElement(Stat, { label: "Settled this month", value: "$9,700", color: T[700], icon: "check" }), /* @__PURE__ */ React.createElement(Stat, { label: "Held in escrow", value: "$2,040", color: "#b45309", icon: "lock" }), /* @__PURE__ */ React.createElement(Stat, { label: "Pending", value: "$6,920", color: G[500], icon: "calendar" }), /* @__PURE__ */ React.createElement(Stat, { label: "Total pipeline", value: "$28,800", color: T[500], icon: "trendingUp" })), /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Transaction log"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, ["Date", "Patient", "Description", "Method", "Amount", "Status"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: { ...s.label, textAlign: "left", paddingBottom: 10, borderBottom: `1px solid ${G[200]}` } }, h)))), /* @__PURE__ */ React.createElement("tbody", null, FIN_PAYMENTS.map((p, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: `1px solid ${G[100]}` } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 0", color: G[400], fontSize: 11 } }, p.date), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", fontWeight: 500 } }, p.patient), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", color: G[600] } }, p.desc), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", color: G[400] } }, p.method), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", textAlign: "right", fontWeight: 600, color: T[700] } }, p.amount), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px" } }, /* @__PURE__ */ React.createElement("span", {
    style: {
      fontSize: 11,
      padding: "2px 9px",
      borderRadius: 10,
      fontWeight: 500,
      background: p.status === "Settled" ? T[50] : p.status === "Held" ? "#fef3c7" : G[100],
      color: p.status === "Settled" ? T[700] : p.status === "Held" ? "#92400e" : G[500],
      border: `1px solid ${p.status === "Settled" ? T[100] : p.status === "Held" ? "#fde68a" : G[200]}`
    }
  }, p.status))))))));
  const [escrowList, setEscrowList] = useState([
    { patient: "Marcus Webb", proc: "Liposuction", held: "$2,040", total: "$6,800", release: "Apr 02", stage: "Pre-op", released: false },
    { patient: "Hanna Bergstr\u00f6m", proc: "Tummy Tuck", held: "$0", total: "$7,200", release: "Apr 09", stage: "Lead", released: false },
    { patient: "Rafael Oliveira", proc: "Hair Transplant", held: "$0", total: "$3,100", release: "Apr 18", stage: "Lead", released: false }
  ]);
  const [releaseConfirm, setReleaseConfirm] = useState(null);

  const releaseEscrow = (idx) => {
    setEscrowList(prev => prev.map((e, i) => i === idx ? { ...e, released: true, held: "$0" } : e));
    setReleaseConfirm(null);
    showToast("Funds released for " + escrowList[idx].patient);
  };

  const EscrowScreen = () => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
    releaseConfirm !== null && React.createElement(Modal, { open: true, onClose: () => setReleaseConfirm(null) },
      React.createElement("div", { style: { padding: "32px 28px", textAlign: "center" } },
        React.createElement("div", { style: { width: 52, height: 52, borderRadius: "50%", background: "#fef3c7", border: "2px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" } },
          React.createElement(Icon, { name: "lock", size: 22, color: "#92400e" })
        ),
        React.createElement("h2", { style: { fontFamily: serif, fontSize: 20, color: T[950], marginBottom: 8 } }, "Release funds?"),
        React.createElement("p", { style: { fontSize: 13.5, color: G[500], lineHeight: 1.7, marginBottom: 24 } },
          "You are about to release ",
          React.createElement("strong", null, escrowList[releaseConfirm]?.held),
          " held for ",
          React.createElement("strong", null, escrowList[releaseConfirm]?.patient),
          ". This action cannot be undone."
        ),
        React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "center" } },
          React.createElement("button", { onClick: () => setReleaseConfirm(null), style: { ...s.btnGhost, padding: "10px 24px" } }, "Cancel"),
          React.createElement("button", { onClick: () => releaseEscrow(releaseConfirm), style: { ...s.btnPrimary, padding: "10px 24px", background: "#b45309" } }, "Confirm release")
        )
      )
    ),
    React.createElement(PanelHeader, { title: "Escrow", subtitle: "Patient funds held in trust pending surgery confirmation" }),
    React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
      React.createElement(Stat, { label: "Total in escrow", value: "$" + escrowList.filter(e => !e.released).reduce((a, e) => a + parseInt(e.held.replace(/[^0-9]/g, "") || 0), 0).toLocaleString(), color: T[700], icon: "lock" }),
      React.createElement(Stat, { label: "Released this month", value: escrowList.filter(e => e.released).length, color: T[600], icon: "check" }),
      React.createElement(Stat, { label: "Escrow accounts", value: escrowList.filter(e => !e.released).length, color: G[500], icon: "shield" })
    ),
    escrowList.map((e, i) => React.createElement("div", { key: i, style: { ...s.card, marginBottom: 12, opacity: e.released ? 0.6 : 1 } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 } },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, e.patient),
          React.createElement("div", { style: { fontSize: 12, color: G[500], marginTop: 2 } }, e.proc, " \u00b7 Release: ", e.release)
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
          React.createElement(SPill, { status: e.stage }),
          e.released && React.createElement("span", { style: { fontSize: 11, padding: "2px 9px", borderRadius: 10, fontWeight: 500, background: T[50], color: T[700], border: `1px solid ${T[100]}` } }, "Released")
        )
      ),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 } },
        React.createElement("div", null,
          React.createElement("div", { style: s.label }, "Total contract"),
          React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: G[900], fontFamily: serif, marginTop: 4 } }, e.total)
        ),
        React.createElement("div", null,
          React.createElement("div", { style: s.label }, "Held"),
          React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: e.released ? G[400] : T[700], fontFamily: serif, marginTop: 4 } }, e.held)
        ),
        React.createElement("div", null,
          React.createElement("div", { style: s.label }, "Remaining"),
          React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: G[500], fontFamily: serif, marginTop: 4 } },
            "$" + (parseInt(e.total.replace(/[^0-9]/g, "")) - parseInt(e.held.replace(/[^0-9]/g, ""))).toLocaleString()
          )
        )
      ),
      !e.released && React.createElement("button", {
        onClick: () => parseInt(e.held.replace(/[^0-9]/g, "")) > 0 ? setReleaseConfirm(i) : showToast("No funds held for this account"),
        style: { ...s.btnPrimary, width: "100%", fontSize: 12, padding: "8px 0", background: parseInt(e.held.replace(/[^0-9]/g, "")) > 0 ? T[600] : G[300] }
      }, "Release funds")
    ))
  )
  const ReportsScreen = () => {
    const [period, setPeriod] = useState("Q1 2026");
    const METRICS = [
      { label: "Total revenue", value: "$52,400", change: "+18%", up: true },
      { label: "Patients served", value: "14", change: "+4", up: true },
      { label: "Avg. case value", value: "$3,743", change: "+6%", up: true },
      { label: "NPS score", value: "72", change: "+5", up: true },
      { label: "Avg. LOS (days)", value: "10.3", change: "-0.7", up: true },
      { label: "Incident rate", value: "14%", change: "+2%", up: false }
    ];
    const REPORT_DATA = {
      "Q1 2026 \u2014 Patient Outcomes Report": [
        ["Patient","Procedure","Surgeon","Outcome","LOS (days)","NPS"],
        ["Emily Thornton","Rhinoplasty","Dr. A. Vargas","Excellent","14","10"],
        ["Isabelle Fontaine","Breast Augmentation","Dr. A. Vargas","Good","12","9"],
        ["Marcus Webb","Liposuction","Dr. C. Romero","Excellent","10","10"],
        ["Hanna Bergstrom","Tummy Tuck","Dr. M. Medina","Good","14","8"],
        ["Rafael Oliveira","Hair Transplant","Dr. I. Castillo","Excellent","7","10"]
      ],
      "Q1 2026 \u2014 Financial Summary": [
        ["Patient","Procedure","Total (USD)","Status","Payment Method"],
        ["Emily Thornton","Rhinoplasty","4200","Settled","Escrow"],
        ["Isabelle Fontaine","Breast Augmentation","5200","Settled","Escrow"],
        ["Marcus Webb","Liposuction","6500","In progress","Escrow"],
        ["Hanna Bergstrom","Tummy Tuck","7000","Pending","--"],
        ["Rafael Oliveira","Hair Transplant","3300","Pending","--"]
      ],
      "Q1 2026 \u2014 Coordinator Performance": [
        ["Coordinator","Cases Handled","Avg. NPS","Languages","Status"],
        ["Laura Mendez","8","9.4","EN/ES","Active"],
        ["Carlos Vega","5","9.1","EN/ES/PT","Active"],
        ["Nadia Bertrand","3","10.0","EN/FR","Active"],
        ["Kevin Osei","0","4.7","EN","On leave"]
      ],
      "Q4 2024 \u2014 Annual Overview": [
        ["Metric","Value","vs Prior Year"],
        ["Total patients","52","+34%"],
        ["Total revenue","$194,200","+28%"],
        ["Avg NPS","8.9","+0.4"],
        ["Incident rate","11%","-3%"],
        ["Avg LOS","11.2 days","-1.1 days"]
      ],
      "Q4 2024 \u2014 Provider Network Review": [
        ["Provider","Specialty","Cases","Avg Rating","Certifications"],
        ["Dr. A. Vargas","Plastic & Reconstructive","38","4.9","ABPS/JCI"],
        ["Dr. C. Romero","Bariatric Surgery","21","4.8","IFSO/JCI"],
        ["Dr. M. Medina","General & Bariatric","15","4.7","ACS/JCI"],
        ["Dr. I. Castillo","Hair Restoration","29","5.0","ISHRS"],
        ["Dr. R. Herrera","Dental & Maxillofacial","44","4.9","IAOMS"]
      ]
    };
    const downloadCSV = (reportName) => {
      const rows = REPORT_DATA[reportName];
      if (!rows) return;
      const csv = rows.map(r => r.map(cell => `"${cell}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = reportName.replace(/\s+/g, "_").replace(/\u2014/g, "-") + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Downloaded: " + reportName);
    };
    const REPORT_LIST = Object.keys(REPORT_DATA);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 } },
        React.createElement("div", null,
          React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Reports"),
          React.createElement("p", { style: { color: G[400], fontSize: 13 } }, "Operational and financial reports by period")
        ),
        React.createElement("select", { value: period, onChange: (e) => setPeriod(e.target.value), style: { height: 38, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 12px", fontSize: 13, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } },
          ["Q1 2026", "Q4 2024", "Q3 2024"].map((p) => React.createElement("option", { key: p }, p))
        )
      ),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        METRICS.map((m, i) => React.createElement("div", { key: i, style: { ...s.card, marginBottom: 0 } },
          React.createElement("div", { style: s.label }, m.label),
          React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 } },
            React.createElement("span", { style: { fontFamily: serif, fontSize: 28, fontWeight: 600, color: G[900] } }, m.value),
            React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: m.up ? T[600] : "#dc2626" } }, m.change)
          )
        ))
      ),
      React.createElement("div", { style: s.card },
        React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Available reports"),
        REPORT_LIST.map((r, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < REPORT_LIST.length - 1 ? `1px solid ${G[100]}` : "none" } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 13, color: G[700], fontWeight: 500 } }, r),
            React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } }, "CSV \u00b7 " + REPORT_DATA[r].length + " rows")
          ),
          React.createElement("button", { onClick: () => downloadCSV(r), style: { ...s.btnGhost, fontSize: 11, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 } },
            React.createElement(Icon, { name: "download", size: 13, color: G[600] }),
            "Download"
          )
        ))
      )
    );
  };
  const AdminSidebar = () => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "sidebar-overlay" + (sidebarOpen ? " open" : ""), onClick: () => setSidebarOpen(false) }), /* @__PURE__ */ React.createElement("div", { className: "app-sidebar" + (sidebarOpen ? " open" : ""), style: { background: T[950], width: 220, flexShrink: 0, padding: "22px 0", borderRight: "1px solid rgba(255,255,255,.06)" } }, ADMIN_GROUPS.map(([grp, items]) => /* @__PURE__ */ React.createElement("div", { key: grp }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,.2)", padding: "0 20px", marginBottom: 8, marginTop: 18, display: "block" } }, grp), items.map(([lbl, iconName, fn]) => /* @__PURE__ */ React.createElement("div", { key: lbl, onClick: () => { fn(); setSidebarOpen(false); }, style: { padding: "10px 20px", fontSize: 13, color: sidebarItem === lbl ? "#fff" : "rgba(255,255,255,.45)", cursor: "pointer", borderLeft: `2px solid ${sidebarItem === lbl ? T[400] : "transparent"}`, background: sidebarItem === lbl ? "rgba(255,255,255,.07)" : "transparent", display: "flex", alignItems: "center", gap: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 14, color: sidebarItem === lbl ? T[300] : "rgba(255,255,255,.3)" }), lbl))))));
  const AdminOverview = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: 28, color: T[950], marginBottom: 4 } }, "Operations Dashboard"), /* @__PURE__ */ React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "March 28, 2026"), /* @__PURE__ */ React.createElement("div", { className: "grid-4", style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 } }, [
    ["Active cases", "12", T[700], "users"],
    ["In recovery", "5", T[500], "heart"],
    ["Pre-op this week", "3", "#92400e", "calendar"],
    ["New leads", "4", G[500], "trendingUp"]
  ].map(([label, val, color, iconName]) => /* @__PURE__ */ React.createElement("div", { key: label, style: { ...s.card, marginBottom: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: s.label }, label), /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 14, color })), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 36, fontWeight: 600, color } }, val)))), /* @__PURE__ */ React.createElement("div", { style: { ...s.card, marginBottom: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: s.label }, "Recent cases"), /* @__PURE__ */ React.createElement("input", { value: tableSearch, onChange: (e) => setTableSearch(e.target.value), placeholder: "Search...", style: { height: 34, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 12px", fontSize: 12.5, fontFamily: sans, outline: "none", color: G[900], width: 200 } })), /* @__PURE__ */ React.createElement("div", { className: "table-scroll" }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { textAlign: "left" } }, ["ID", "Patient", "Procedure", "Status", "Surgery", "Surgeon", "Budget", "Country"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, className: ["ID", "Surgeon", "Country", "Method"].includes(h) ? "col-hide-xs" : "", style: { ...s.label, paddingBottom: 10, borderBottom: `1px solid ${G[200]}`, fontWeight: 600 } }, h)))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((c) => /* @__PURE__ */ React.createElement(
    "tr",
    {
      key: c.id,
      onClick: () => {
        setSelectedCase(c);
        navTo("All Cases", "case");
      },
      style: { cursor: "pointer", borderBottom: `1px solid ${G[100]}` },
      onMouseEnter: (e) => e.currentTarget.style.background = G[50],
      onMouseLeave: (e) => e.currentTarget.style.background = "transparent"
    },
/* @__PURE__ */ React.createElement("td", { className: "col-hide-xs", style: { padding: "10px 0", color: G[400], fontSize: 11 } }, c.id),
/* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", fontWeight: 500 } }, c.name),
/* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", color: G[600] } }, c.proc),
/* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px" } }, /* @__PURE__ */ React.createElement(SPill, { status: c.status })),
/* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", color: G[500] } }, c.date),
/* @__PURE__ */ React.createElement("td", { className: "col-hide-xs", style: { padding: "10px 8px", color: G[600] } }, c.surgeon),
/* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", color: T[600], fontWeight: 600 } }, c.budget),
/* @__PURE__ */ React.createElement("td", { className: "col-hide-xs", style: { padding: "10px 8px", color: G[500] } }, c.country)
  )))))));
  const AdminCaseDetail = () => React.createElement("div", { className: "case-detail-layout", style: { flex: 1, display: "flex", overflow: "hidden" } },
    React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 28, overflowY: "auto" } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 } },
        React.createElement("button", { onClick: () => navTo("Dashboard", "overview"), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6 } }, React.createElement(Icon, { name: "arrowLeft", size: 13, color: G[600] }), "Back"),
        React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950] } }, selectedCase.name),
        React.createElement(SPill, { status: selectedCase.status })
      ),
      React.createElement("div", { style: { ...s.card, marginBottom: 16 } },
        React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Case details"),
        React.createElement(IR, { k: "Case ID", v: selectedCase.id }),
        React.createElement(IR, { k: "Procedure", v: selectedCase.proc }),
        React.createElement(IR, { k: "Surgeon", v: selectedCase.surgeon }),
        React.createElement(IR, { k: "Budget", v: selectedCase.budget }),
        React.createElement(IR, { k: "Country", v: selectedCase.country }),
        React.createElement(IR, { k: "Surgery date", v: selectedCase.date })
      ),
      React.createElement("div", { style: s.card },
        React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Journey timeline"),
        JOURNEY_STEPS.map((step, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderBottom: i < JOURNEY_STEPS.length - 1 ? `1px solid ${G[100]}` : "none" } },
          React.createElement("div", { style: { width: 20, height: 20, borderRadius: "50%", background: step.done ? T[500] : G[200], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
            step.done && React.createElement(Icon, { name: "check", size: 10, color: "#fff" })
          ),
          React.createElement("div", { style: { flex: 1, fontSize: 13, color: step.done ? G[900] : G[400] } }, step.label),
          React.createElement("div", { style: { fontSize: 11, color: G[400] } }, step.date)
        ))
      ),
      React.createElement("div", { style: { ...s.card, marginTop: 16 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
          React.createElement("div", { style: s.label }, "Recovery checklist"),
          React.createElement("div", { style: { fontSize: 12, color: G[400] } }, adminCheckDone.filter(Boolean).length, " / ", RECOVERY_CHECKS.length, " complete")
        ),
        React.createElement("div", { style: { height: 4, background: G[100], borderRadius: 2, marginBottom: 20, overflow: "hidden" } },
          React.createElement("div", { style: { height: "100%", width: `${(adminCheckDone.filter(Boolean).length / RECOVERY_CHECKS.length * 100).toFixed(0)}%`, background: T[500], borderRadius: 2, transition: "width .3s" } })
        ),
        RECOVERY_CHECKS.map((item, i) => React.createElement("label", { key: i, style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < RECOVERY_CHECKS.length - 1 ? `1px solid ${G[100]}` : "none", cursor: "pointer" } },
          React.createElement("input", { type: "checkbox", checked: adminCheckDone[i] || false, onChange: () => handleToggleCheck(i), style: { accentColor: T[500], width: 16, height: 16 } }),
          React.createElement("span", { style: { fontSize: 13.5, color: adminCheckDone[i] ? G[400] : G[900], textDecoration: adminCheckDone[i] ? "line-through" : "none" } }, item)
        ))
      )
    ),
    React.createElement("div", { className: "case-notes-panel", style: { width: 300, borderLeft: `1px solid ${G[200]}`, padding: 20, background: "#fff", flexShrink: 0, display: "flex", flexDirection: "column" } },
      React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Internal notes"),
      React.createElement("textarea", { value: noteInput, onChange: (e) => setNoteInput(e.target.value), placeholder: "Add a note...", rows: 4, style: { width: "100%", border: `1px solid ${G[200]}`, borderRadius: 8, padding: 12, fontSize: 13, fontFamily: sans, outline: "none", resize: "none", color: G[900], marginBottom: 10 } }),
      React.createElement("button", { onClick: saveNote, style: { ...s.btnPrimary, width: "100%", padding: "10px 0", fontSize: 13 } }, "Save note"),
      React.createElement("div", { style: { marginTop: 20, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" } },
        notes.map((n, i) => React.createElement("div", { key: i, style: { padding: "12px 14px", background: G[50], borderRadius: 8, border: `1px solid ${G[200]}` } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } },
            React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: T[600] } }, n.author),
            React.createElement("span", { style: { fontSize: 10, color: G[400] } }, n.date)
          ),
          React.createElement("p", { style: { fontSize: 12.5, color: G[700], lineHeight: 1.6 } }, n.text)
        ))
      )
    )
  );

  // \u2500\u2500 SHARED FORM HELPERS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const FLbl = ({ t, req }) => React.createElement("label", { style:{ display:"block", fontSize:12, fontWeight:500, color:G[700], marginBottom:5 } }, t, req && React.createElement("span", { style:{ color:"#dc2626", marginLeft:2 } }, "*"));
  const FInput = ({ val, onChange, ph, type="text", err }) => React.createElement("input", { type, value:val, onChange, placeholder:ph, style:{ width:"100%", height:40, border:`1px solid ${err?"#fca5a5":G[200]}`, borderRadius:7, padding:"0 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900] } });
  const FTextarea = ({ val, onChange, ph, rows=3 }) => React.createElement("textarea", { value:val, onChange, placeholder:ph, rows, style:{ width:"100%", border:`1px solid ${G[200]}`, borderRadius:7, padding:"10px 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900], resize:"vertical" } });
  const FSelect = ({ val, onChange, options }) => React.createElement("select", { value:val, onChange, style:{ width:"100%", height:40, border:`1px solid ${G[200]}`, borderRadius:7, padding:"0 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900], background:"#fff" } }, options.map(o => React.createElement("option", { key:o, value:o }, o)));
  const FSec = ({ title }) => React.createElement("div", { style:{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T[500], marginTop:28, marginBottom:14, paddingBottom:8, borderBottom:`1px solid ${G[100]}` } }, title);
  const FRow = ({ children, cols=2 }) => React.createElement("div", { style:{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:14, marginBottom:14 } }, children);
  const FField = ({ label, req, children }) => React.createElement("div", null, React.createElement(FLbl, { t:label, req }), children);
  const FChk = ({ items, checked, toggle, cols=2 }) => React.createElement("div", { style:{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:8 } }, items.map(item => React.createElement("label", { key:item, style:{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:G[700], cursor:"pointer", padding:"5px 0" } }, React.createElement("input", { type:"checkbox", checked:checked.includes(item), onChange:()=>toggle(item), style:{ accentColor:T[500], width:15, height:15 } }), item)));
  const FormSuccess = ({ title, body, onNew, onBack, backLabel }) => React.createElement("div", { style:{ textAlign:"center", padding:"60px 32px" } },
    React.createElement("div", { style:{ width:60, height:60, borderRadius:"50%", background:T[50], border:`2px solid ${T[200]}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" } }, React.createElement(Icon, { name:"check", size:26, color:T[600] })),
    React.createElement("h2", { style:{ fontFamily:serif, fontSize:24, color:T[950], marginBottom:8 } }, title),
    React.createElement("p", { style:{ fontSize:14, color:G[500], lineHeight:1.7, marginBottom:28 } }, body),
    React.createElement("div", { style:{ display:"flex", gap:12, justifyContent:"center" } },
      React.createElement("button", { onClick:onNew, style:{ ...s.btnPrimary, padding:"10px 24px", fontSize:13 } }, "+ Agregar otro"),
      React.createElement("button", { onClick:onBack, style:{ ...s.btnGhost, padding:"10px 24px", fontSize:13 } }, backLabel||"Volver")
    )
  );
  const LANG_OPTS = ["Espa\u00f1ol","Ingl\u00e9s","Portugu\u00e9s","Franc\u00e9s","Italiano","Alem\u00e1n"];
  const PROC_OPTS = ["Rinoplastia","Aumento de busto","Liposucci\u00f3n","Abdominoplastia","Lifting facial","Cirug\u00eda bari\u00e1trica","Trasplante capilar","Veneers dentales","Cirug\u00eda reconstructiva","Reemplazo de cadera","Cirug\u00eda ocular"];
  const INCLUDES_OPTS = ["WiFi","Alimentaci\u00f3n 3 comidas","Desayuno incluido","AC","Piscina","Transporte a cl\u00ednica","Lavander\u00eda","TV","Estacionamiento","Sala com\u00fan"];

  // \u2500\u2500 FORM: RECOVERY HOME \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const FormRecoveryHome = () => {
    const [form, setForm] = React.useState({ name:"", address:"", sector:"", city:"", phone:"", email:"", manager:"", total_beds:"", rate_without:"", rate_with:"", staff_model:"Turno", staff_schedule:"", emergency_clinic:"", emergency_protocol:"" });
    const [includes, setIncludes] = React.useState([]);
    const [langs, setLangs] = React.useState([]);
    const [err, setErr] = React.useState({});
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const validate = () => { const e={}; if(!form.name.trim())e.name=true; if(!form.city.trim())e.city=true; if(!form.phone.trim())e.phone=true; setErr(e); return Object.keys(e).length===0; };
    const handleSave = async () => { if(!validate())return; setSaving(true); await new Promise(r=>setTimeout(r,600)); setSaving(false); setSaved(true); };
    if(saved) return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } }, React.createElement(FormSuccess, { title:"Recovery home registrado", body:`"${form.name}" fue agregado a la red.`, onNew:()=>{ setForm({ name:"", address:"", sector:"", city:"", phone:"", email:"", manager:"", total_beds:"", rate_without:"", rate_with:"", staff_model:"Turno", staff_schedule:"", emergency_clinic:"", emergency_protocol:"" }); setIncludes([]); setLangs([]); setErr({}); setSaved(false); }, onBack:()=>navTo("Recovery Homes","homes"), backLabel:"Ver Recovery Homes" }));
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto", maxWidth:860 } },
      React.createElement(PanelHeader, { title:"Nuevo Recovery Home", subtitle:"Completa la informaci\u00f3n para agregar una instalaci\u00f3n a la red" }),
      React.createElement("div", { style:s.card },
        React.createElement(FSec, { title:"Identificaci\u00f3n" }),
        React.createElement(FRow, null, React.createElement(FField, { label:"Nombre", req:true }, React.createElement(FInput, { val:form.name, onChange:set("name"), ph:"Villa Serena", err:err.name })), React.createElement(FField, { label:"Responsable" }, React.createElement(FInput, { val:form.manager, onChange:set("manager"), ph:"Nombre completo" }))),
        React.createElement(FSec, { title:"Ubicaci\u00f3n" }),
        React.createElement(FRow, null, React.createElement(FField, { label:"Direcci\u00f3n" }, React.createElement(FInput, { val:form.address, onChange:set("address"), ph:"Calle y n\u00famero" })), React.createElement(FField, { label:"Sector" }, React.createElement(FInput, { val:form.sector, onChange:set("sector"), ph:"Piantini" }))),
        React.createElement(FRow, null, React.createElement(FField, { label:"Ciudad", req:true }, React.createElement(FInput, { val:form.city, onChange:set("city"), ph:"Santo Domingo", err:err.city }))),
        React.createElement(FSec, { title:"Contacto" }),
        React.createElement(FRow, null, React.createElement(FField, { label:"Tel\u00e9fono", req:true }, React.createElement(FInput, { val:form.phone, onChange:set("phone"), ph:"+1 809 000 0000", err:err.phone })), React.createElement(FField, { label:"Email" }, React.createElement(FInput, { val:form.email, onChange:set("email"), ph:"info@ejemplo.com", type:"email" }))),
        React.createElement(FSec, { title:"Capacidad y tarifas" }),
        React.createElement(FRow, { cols:3 }, React.createElement(FField, { label:"Camas" }, React.createElement(FInput, { val:form.total_beds, onChange:set("total_beds"), ph:"6", type:"number" })), React.createElement(FField, { label:"Tarifa sin enfermer\u00eda" }, React.createElement(FInput, { val:form.rate_without, onChange:set("rate_without"), ph:"$150/noche" })), React.createElement(FField, { label:"Tarifa con enfermer\u00eda" }, React.createElement(FInput, { val:form.rate_with, onChange:set("rate_with"), ph:"$250/noche" }))),
        React.createElement(FSec, { title:"\u00bfQu\u00e9 incluye?" }),
        React.createElement(FChk, { items:INCLUDES_OPTS, checked:includes, toggle:v=>setIncludes(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]) }),
        React.createElement(FSec, { title:"Personal" }),
        React.createElement(FRow, null, React.createElement(FField, { label:"Modelo" }, React.createElement(FSelect, { val:form.staff_model, onChange:set("staff_model"), options:["Turno","On-call","Residente","Sin personal"] })), React.createElement(FField, { label:"Horario" }, React.createElement(FInput, { val:form.staff_schedule, onChange:set("staff_schedule"), ph:"Enfermera 12h diurnas" }))),
        React.createElement("div", { style:{ marginBottom:14 } }, React.createElement(FLbl, { t:"Idiomas del personal" }), React.createElement(FChk, { items:LANG_OPTS, checked:langs, toggle:v=>setLangs(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]), cols:3 })),
        React.createElement(FSec, { title:"Emergencias" }),
        React.createElement(FRow, null, React.createElement(FField, { label:"Cl\u00ednica de referencia" }, React.createElement(FInput, { val:form.emergency_clinic, onChange:set("emergency_clinic"), ph:"Nombre de la cl\u00ednica" }))),
        React.createElement("div", { style:{ marginBottom:20 } }, React.createElement(FLbl, { t:"Protocolo de emergencias" }), React.createElement(FTextarea, { val:form.emergency_protocol, onChange:set("emergency_protocol"), ph:"Describe qu\u00e9 hace el personal ante una emergencia m\u00e9dica...", rows:4 })),
        Object.keys(err).length>0 && React.createElement("p", { style:{ fontSize:12.5, color:"#dc2626", marginBottom:12 } }, "* Completa los campos obligatorios."),
        React.createElement("div", { style:{ display:"flex", gap:10 } }, React.createElement("button", { onClick:handleSave, disabled:saving, style:{ ...s.btnPrimary, padding:"11px 28px", fontSize:13, opacity:saving?.7:1 } }, saving?"Guardando\u2026":"Guardar recovery home"), React.createElement("button", { onClick:()=>navTo("Recovery Homes","homes"), style:{ ...s.btnGhost, padding:"11px 20px", fontSize:13 } }, "Cancelar"))
      )
    );
  };

  // \u2500\u2500 FORM: CL\u00cdNICA \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const FormClinica = () => {
    const [form, setForm] = React.useState({ name:"", address:"", sector:"", city:"", phone:"", email:"", contact_name:"", contact_title:"", certifications:"" });
    const [specialties, setSpecialties] = React.useState([]);
    const [langs, setLangs] = React.useState([]);
    const [procs, setProcs] = React.useState([{ name:"", price_range:"" }]);
    const [err, setErr] = React.useState({});
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const SPEC_OPTS = ["Cirug\u00eda pl\u00e1stica","Cirug\u00eda bari\u00e1trica","Odontolog\u00eda est\u00e9tica","Oftalmolog\u00eda","Trasplante capilar","Ortopedia","Medicina general"];
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const setProc = (i,k,v) => setProcs(p=>p.map((r,j)=>j===i?{...r,[k]:v}:r));
    const validate = () => { const e={}; if(!form.name.trim())e.name=true; if(!form.city.trim())e.city=true; if(!form.phone.trim())e.phone=true; setErr(e); return Object.keys(e).length===0; };
    const handleSave = async () => { if(!validate())return; setSaving(true); await new Promise(r=>setTimeout(r,600)); setSaving(false); setSaved(true); };
    if(saved) return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } }, React.createElement(FormSuccess, { title:"Cl\u00ednica registrada", body:`"${form.name}" fue agregada a la red de proveedores.`, onNew:()=>{ setForm({ name:"", address:"", sector:"", city:"", phone:"", email:"", contact_name:"", contact_title:"", certifications:"" }); setSpecialties([]); setLangs([]); setProcs([{name:"",price_range:""}]); setErr({}); setSaved(false); }, onBack:()=>navTo("Providers","providers"), backLabel:"Ver Providers" }));
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto", maxWidth:860 } },
      React.createElement(PanelHeader, { title:"Nueva Cl\u00ednica", subtitle:"Registra una cl\u00ednica en la red de proveedores verificados" }),
      React.createElement("div", { style:s.card },
        React.createElement(FSec, { title:"Identificaci\u00f3n" }),
        React.createElement(FRow, null, React.createElement(FField, { label:"Nombre oficial", req:true }, React.createElement(FInput, { val:form.name, onChange:set("name"), ph:"Cl\u00ednica Vida", err:err.name })), React.createElement(FField, { label:"Certificaciones" }, React.createElement(FInput, { val:form.certifications, onChange:set("certifications"), ph:"JCI, ABPS (separadas por comas)" }))),
        React.createElement(FSec, { title:"Ubicaci\u00f3n" }),
        React.createElement(FRow, null, React.createElement(FField, { label:"Direcci\u00f3n" }, React.createElement(FInput, { val:form.address, onChange:set("address"), ph:"Av. Principal 123" })), React.createElement(FField, { label:"Sector" }, React.createElement(FInput, { val:form.sector, onChange:set("sector"), ph:"Piantini" }))),
        React.createElement(FRow, null, React.createElement(FField, { label:"Ciudad", req:true }, React.createElement(FInput, { val:form.city, onChange:set("city"), ph:"Santo Domingo", err:err.city }))),
        React.createElement(FSec, { title:"Contacto" }),
        React.createElement(FRow, null, React.createElement(FField, { label:"Tel\u00e9fono", req:true }, React.createElement(FInput, { val:form.phone, onChange:set("phone"), ph:"+1 809 000 0000", err:err.phone })), React.createElement(FField, { label:"Email" }, React.createElement(FInput, { val:form.email, onChange:set("email"), ph:"admin@clinica.com", type:"email" }))),
        React.createElement(FRow, null, React.createElement(FField, { label:"Nombre del contacto" }, React.createElement(FInput, { val:form.contact_name, onChange:set("contact_name"), ph:"Nombre completo" })), React.createElement(FField, { label:"Cargo" }, React.createElement(FInput, { val:form.contact_title, onChange:set("contact_title"), ph:"Director/a m\u00e9dico/a" }))),
        React.createElement(FSec, { title:"Especialidades" }),
        React.createElement(FChk, { items:SPEC_OPTS, checked:specialties, toggle:v=>setSpecialties(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]) }),
        React.createElement(FSec, { title:"Idiomas" }),
        React.createElement(FChk, { items:LANG_OPTS, checked:langs, toggle:v=>setLangs(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]), cols:3 }),
        React.createElement(FSec, { title:"Procedimientos y precios base" }),
        procs.map((p,i) => React.createElement("div", { key:i, style:{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, marginBottom:10, alignItems:"end" } },
          React.createElement("div", null, i===0&&React.createElement(FLbl,{t:"Procedimiento"}), React.createElement(FSelect, { val:p.name, onChange:e=>setProc(i,"name",e.target.value), options:["\u2014 Seleccionar \u2014",...PROC_OPTS] })),
          React.createElement("div", null, i===0&&React.createElement(FLbl,{t:"Rango de precio"}), React.createElement(FInput, { val:p.price_range, onChange:e=>setProc(i,"price_range",e.target.value), ph:"$3,000 \u2013 $5,500" })),
          React.createElement("button", { onClick:()=>setProcs(p=>p.filter((_,j)=>j!==i)), style:{ height:40, padding:"0 12px", border:`1px solid ${G[200]}`, borderRadius:7, background:"#fff", color:G[500], cursor:"pointer", fontSize:18 } }, "\u00d7")
        )),
        React.createElement("button", { onClick:()=>setProcs(p=>[...p,{name:"",price_range:""}]), style:{ ...s.btnGhost, fontSize:12, padding:"8px 16px", marginBottom:20 } }, "+ Agregar procedimiento"),
        Object.keys(err).length>0 && React.createElement("p", { style:{ fontSize:12.5, color:"#dc2626", marginBottom:12 } }, "* Completa los campos obligatorios."),
        React.createElement("div", { style:{ display:"flex", gap:10 } }, React.createElement("button", { onClick:handleSave, disabled:saving, style:{ ...s.btnPrimary, padding:"11px 28px", fontSize:13, opacity:saving?.7:1 } }, saving?"Guardando\u2026":"Guardar cl\u00ednica"), React.createElement("button", { onClick:()=>navTo("Providers","providers"), style:{ ...s.btnGhost, padding:"11px 20px", fontSize:13 } }, "Cancelar"))
      )
    );
  };

  // \u2500\u2500 FORM: M\u00c9DICO \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const FormDoctor = () => {
    const [form, setForm] = React.useState({ name:"", specialty:"", subspecialty:"", license:"", experience_years:"", bio:"" });
    const [langs, setLangs] = React.useState([]);
    const [procs, setProcs] = React.useState([]);
    const [clinics, setClinics] = React.useState([""]);
    const [err, setErr] = React.useState({});
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const SPEC_OPTS = ["Cirug\u00eda pl\u00e1stica","Cirug\u00eda bari\u00e1trica","Odontolog\u00eda est\u00e9tica","Oftalmolog\u00eda","Trasplante capilar","Ortopedia","Anestesiolog\u00eda","Medicina interna"];
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const validate = () => { const e={}; if(!form.name.trim())e.name=true; if(!form.license.trim())e.license=true; if(!form.specialty)e.specialty=true; setErr(e); return Object.keys(e).length===0; };
    const handleSave = async () => { if(!validate())return; setSaving(true); await new Promise(r=>setTimeout(r,600)); setSaving(false); setSaved(true); };
    if(saved) return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } }, React.createElement(FormSuccess, { title:"M\u00e9dico registrado", body:`"${form.name}" fue agregado a la red de proveedores.`, onNew:()=>{ setForm({ name:"", specialty:"", subspecialty:"", license:"", experience_years:"", bio:"" }); setLangs([]); setProcs([]); setClinics([""]); setErr({}); setSaved(false); }, onBack:()=>navTo("Providers","providers"), backLabel:"Ver Providers" }));
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto", maxWidth:860 } },
      React.createElement(PanelHeader, { title:"Nuevo M\u00e9dico", subtitle:"Registra un m\u00e9dico en la red de proveedores verificados" }),
      React.createElement("div", { style:s.card },
        React.createElement(FSec, { title:"Datos profesionales" }),
        React.createElement(FRow, null, React.createElement(FField, { label:"Nombre completo", req:true }, React.createElement(FInput, { val:form.name, onChange:set("name"), ph:"Dr. / Dra. Nombre Apellido", err:err.name })), React.createElement(FField, { label:"Licencia m\u00e9dica", req:true }, React.createElement(FInput, { val:form.license, onChange:set("license"), ph:"Ej: 123-45", err:err.license }))),
        React.createElement(FRow, null, React.createElement(FField, { label:"Especialidad", req:true }, React.createElement(FSelect, { val:form.specialty, onChange:set("specialty"), options:["\u2014 Seleccionar \u2014",...SPEC_OPTS] })), React.createElement(FField, { label:"Subespecialidad" }, React.createElement(FInput, { val:form.subspecialty, onChange:set("subspecialty"), ph:"Ej: Cirug\u00eda est\u00e9tica facial" }))),
        React.createElement(FRow, null, React.createElement(FField, { label:"A\u00f1os de experiencia" }, React.createElement(FInput, { val:form.experience_years, onChange:set("experience_years"), ph:"6", type:"number" }))),
        React.createElement(FSec, { title:"Cl\u00ednicas donde opera" }),
        clinics.map((c,i) => React.createElement("div", { key:i, style:{ display:"grid", gridTemplateColumns:"1fr auto", gap:10, marginBottom:10 } },
          React.createElement(FInput, { val:c, onChange:e=>setClinics(p=>p.map((x,j)=>j===i?e.target.value:x)), ph:"Nombre de la cl\u00ednica" }),
          clinics.length>1 && React.createElement("button", { onClick:()=>setClinics(p=>p.filter((_,j)=>j!==i)), style:{ height:40, padding:"0 12px", border:`1px solid ${G[200]}`, borderRadius:7, background:"#fff", color:G[500], cursor:"pointer", fontSize:18 } }, "\u00d7")
        )),
        React.createElement("button", { onClick:()=>setClinics(p=>[...p,""]), style:{ ...s.btnGhost, fontSize:12, padding:"8px 16px", marginBottom:20 } }, "+ Agregar cl\u00ednica"),
        React.createElement(FSec, { title:"Idiomas" }),
        React.createElement(FChk, { items:LANG_OPTS, checked:langs, toggle:v=>setLangs(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]), cols:3 }),
        React.createElement(FSec, { title:"Procedimientos que realiza" }),
        React.createElement(FChk, { items:PROC_OPTS, checked:procs, toggle:v=>setProcs(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]) }),
        React.createElement(FSec, { title:"Biograf\u00eda profesional" }),
        React.createElement("div", { style:{ marginBottom:20 } }, React.createElement(FLbl, { t:"Bio breve (visible para pacientes)" }), React.createElement(FTextarea, { val:form.bio, onChange:set("bio"), ph:"Describe la trayectoria y enfoque del m\u00e9dico...", rows:4 })),
        Object.keys(err).length>0 && React.createElement("p", { style:{ fontSize:12.5, color:"#dc2626", marginBottom:12 } }, "* Completa los campos obligatorios."),
        React.createElement("div", { style:{ display:"flex", gap:10 } }, React.createElement("button", { onClick:handleSave, disabled:saving, style:{ ...s.btnPrimary, padding:"11px 28px", fontSize:13, opacity:saving?.7:1 } }, saving?"Guardando\u2026":"Guardar m\u00e9dico"), React.createElement("button", { onClick:()=>navTo("Providers","providers"), style:{ ...s.btnGhost, padding:"11px 20px", fontSize:13 } }, "Cancelar"))
      )
    );
  };

  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: sans, background: G[50], minHeight: "100vh" } }, toast && /* @__PURE__ */ React.createElement(Toast, { msg: toast, onDone: () => setToast(null) }), /* @__PURE__ */ React.createElement("div", { className: "dash-header", style: { height: 60, background: "#fff", borderBottom: `1px solid ${G[200]}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 19, fontWeight: 600, color: T[900], letterSpacing: "0.06em", textTransform: "uppercase" } }, "Praes", /* @__PURE__ */ React.createElement("span", { style: { color: T[500] } }, "enti")), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 500, color: T[500], letterSpacing: "0.08em", textTransform: "uppercase", marginLeft: 6 } }, "Admin")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: G[700] } }, /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T[700], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 14, fontWeight: 600, color: T[200] } }, "P"), "Admin"), /* @__PURE__ */ React.createElement("button", { onClick: onSignOut, style: { background: "none", border: `1px solid ${G[200]}`, color: G[500], padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: sans } }, "Sign out"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", minHeight: "calc(100vh - 60px)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(AdminSidebar, null), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" } }, screen === "overview" && /* @__PURE__ */ React.createElement(AdminOverview, null), screen === "case" && /* @__PURE__ */ React.createElement(AdminCaseDetail, null), screen === "pipeline" && /* @__PURE__ */ React.createElement(PipelineScreen, null), screen === "incidents" && /* @__PURE__ */ React.createElement(IncidentsScreen, null), screen === "providers" && /* @__PURE__ */ React.createElement(ProvidersScreen, null), screen === "form-clinic" && React.createElement(FormClinica, null), screen === "form-doctor" && React.createElement(FormDoctor, null), screen === "homes" && /* @__PURE__ */ React.createElement(HomesScreen, null), screen === "form-home" && React.createElement(FormRecoveryHome, null), screen === "coordinators" && /* @__PURE__ */ React.createElement(CoordinatorsScreen, null), screen === "finance-payments" && /* @__PURE__ */ React.createElement(FinancePaymentsScreen, null), screen === "escrow" && /* @__PURE__ */ React.createElement(EscrowScreen, null), screen === "reports" && /* @__PURE__ */ React.createElement(ReportsScreen, null))));
};
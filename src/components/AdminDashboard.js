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
      ["Recovery Homes", "home", () => navTo("Recovery Homes", "homes")],
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
    { label: "New Lead", color: "#6b7280", items: [{ name: "Luca Ferreira", proc: "Hair Transplant", budget: "$3,100", country: "BR" }, { name: "Sophie Wright", proc: "Rhinoplasty", budget: "$3,900", country: "AU" }] },
    { label: "Qualified", color: "#92400e", items: [{ name: "James Okafor", proc: "Liposuction", budget: "$6,800", country: "UK" }, { name: "Anna Kowalski", proc: "Tummy Tuck", budget: "$7,200", country: "PL" }] },
    { label: "Matched", color: "#1a7a72", items: [{ name: "Carlos Reyes", proc: "Bariatric Surgery", budget: "$11,000", country: "MX" }] },
    { label: "Pre-op", color: "#b45309", items: [{ name: "James Okafor", proc: "Liposuction", budget: "$6,800", country: "UK" }] },
    { label: "In Recovery", color: "#1a9e95", items: [{ name: "Maria Vasquez", proc: "Rhinoplasty", budget: "$4,200", country: "USA" }, { name: "Sofia Mart\u00ednez", proc: "Breast Aug.", budget: "$5,500", country: "CA" }] },
    { label: "Completed", color: "#059669", items: [{ name: "Daniel Park", proc: "Dental Veneers", budget: "$2,100", country: "US" }] }
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
  const [incidents] = useState([
    { id: "INC-001", patient: "Anna Kowalski", type: "Medical", desc: "Mild post-op fever reported on day 2. Dr. Castro notified. Monitoring underway.", severity: "Medium", date: "Mar 26", resolved: false },
    { id: "INC-002", patient: "James Okafor", type: "Logistics", desc: "Airport transfer missed due to flight delay. Rescheduled. No impact on surgery.", severity: "Low", date: "Mar 25", resolved: true },
    { id: "INC-003", patient: "Sofia Mart\u00ednez", type: "Administrative", desc: "Consent form re-signature required after minor procedure change.", severity: "Low", date: "Mar 22", resolved: true },
    { id: "INC-004", patient: "Maria Vasquez", type: "Medical", desc: "Patient reported unusual swelling. Dr. Pe\u00f1a reviewed remotely; deemed normal.", severity: "Low", date: "Mar 23", resolved: true }
  ]);
  const IncidentsScreen = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement(
    PanelHeader,
    {
      title: "Incidents",
      subtitle: "Active and resolved case incidents requiring attention",
      actions: [/* @__PURE__ */ React.createElement("button", { key: "new", onClick: () => showToast("New incident form"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Log incident")]
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } }, /* @__PURE__ */ React.createElement(Stat, { label: "Open", value: incidents.filter((i) => !i.resolved).length, color: "#dc2626", icon: "alertCircle" }), /* @__PURE__ */ React.createElement(Stat, { label: "Resolved this month", value: incidents.filter((i) => i.resolved).length, color: T[600], icon: "check" }), /* @__PURE__ */ React.createElement(Stat, { label: "Total logged", value: incidents.length, color: G[500], icon: "fileText" })), incidents.map((inc, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { ...s.card, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: G[400] } }, inc.id), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, padding: "2px 9px", borderRadius: 10, fontWeight: 500, background: inc.resolved ? T[50] : "#fef2f2", color: inc.resolved ? T[700] : "#dc2626", border: `1px solid ${inc.resolved ? T[100] : "#fca5a5"}` } }, inc.resolved ? "Resolved" : "Open"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: G[500], background: G[100], padding: "2px 8px", borderRadius: 10 } }, inc.type)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: G[400] } }, inc.date)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 500, color: G[900], marginBottom: 4 } }, inc.patient), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: G[600], lineHeight: 1.6 } }, inc.desc), !inc.resolved && /* @__PURE__ */ React.createElement("button", { onClick: () => showToast("Incident marked resolved"), style: { ...s.btnGhost, marginTop: 12, fontSize: 12, padding: "7px 14px" } }, "Mark resolved"))));
  const PROVIDERS = [
    { name: "Dr. Alejandro Pe\u00f1a", spec: "Plastic & Reconstructive", hosp: "Cl\u00ednica Uni\u00f3n", cases: 38, rating: "4.9", cert: "ABPS \xB7 JCI" },
    { name: "Dr. Carmen Reyes", spec: "Bariatric Surgery", hosp: "Centro M\u00e9dico CEDIMAT", cases: 21, rating: "4.8", cert: "IFSO \xB7 JCI" },
    { name: "Dr. Marcos Castro", spec: "General & Bariatric", hosp: "Hospital General Plaza", cases: 15, rating: "4.7", cert: "ACS \xB7 JCI" },
    { name: "Dr. Isabel Montero", spec: "Hair Restoration", hosp: "Cl\u00ednica Punta Cana", cases: 29, rating: "5.0", cert: "ISHRS" },
    { name: "Dr. Ram\u00f3n Fern\u00e1ndez", spec: "Dental & Maxillofacial", hosp: "Dental Arte", cases: 44, rating: "4.9", cert: "IAOMS" }
  ];
  const ProvidersScreen = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement(
    PanelHeader,
    {
      title: "Providers",
      subtitle: "Board-certified surgeons in the Praesenti network",
      actions: [/* @__PURE__ */ React.createElement("button", { key: "add", onClick: () => showToast("Add provider form"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add provider")]
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } }, /* @__PURE__ */ React.createElement(Stat, { label: "Active providers", value: PROVIDERS.length, color: T[700], icon: "userMd" }), /* @__PURE__ */ React.createElement(Stat, { label: "Avg. rating", value: "4.86", color: T[500], icon: "activity" }), /* @__PURE__ */ React.createElement(Stat, { label: "Cases this month", value: "12", color: G[500], icon: "users" })), PROVIDERS.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 18, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: T[800], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 18, fontWeight: 600, color: T[200], flexShrink: 0 } }, p.name.split(" ")[1][0]), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, p.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: G[500], marginTop: 2 } }, p.spec, " \xB7 ", p.hosp), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 3 } }, p.cert)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, p.rating, " \u2605"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: G[400] } }, p.cases, " cases")), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast(`Viewing ${p.name}`), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px" } }, "View"))));
  const HOMES = [
    { name: "Casa Verde", loc: "Piantini, Santo Domingo", beds: 4, occ: 2, amenities: "Pool \xB7 Private nurse \xB7 Chef", rate: "$280/night", rating: "4.9" },
    { name: "Villa Palma", loc: "Naco, Santo Domingo", beds: 6, occ: 4, amenities: "Pool \xB7 AC \xB7 On-call nurse", rate: "$220/night", rating: "4.8" },
    { name: "Cl\u00ednica Suites", loc: "Punta Cana", beds: 8, occ: 3, amenities: "Medical staff 24/7 \xB7 Meals", rate: "$350/night", rating: "5.0" },
    { name: "Residencial Mar", loc: "Gazcue, Santo Domingo", beds: 3, occ: 1, amenities: "Shared cook \xB7 Transport", rate: "$160/night", rating: "4.7" }
  ];
  const HomesScreen = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement(
    PanelHeader,
    {
      title: "Recovery Homes",
      subtitle: "Accredited recovery facilities in the network",
      actions: [/* @__PURE__ */ React.createElement("button", { key: "add", onClick: () => showToast("Add recovery home"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add home")]
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } }, /* @__PURE__ */ React.createElement(Stat, { label: "Total homes", value: HOMES.length, color: T[700], icon: "home" }), /* @__PURE__ */ React.createElement(Stat, { label: "Occupied beds", value: HOMES.reduce((a, h) => a + h.occ, 0), color: T[500], icon: "users" }), /* @__PURE__ */ React.createElement(Stat, { label: "Available beds", value: HOMES.reduce((a, h) => a + (h.beds - h.occ), 0), color: G[500], icon: "check" })), /* @__PURE__ */ React.createElement("div", { className: "grid-2", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, HOMES.map((h, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 600, color: G[900], fontFamily: serif } }, h.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: G[400], marginTop: 2 } }, h.loc)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, h.rating, " \u2605")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 20, fontSize: 12, color: G[600], marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", null, h.occ, "/", h.beds, " beds occupied"), /* @__PURE__ */ React.createElement("span", { style: { color: T[600], fontWeight: 500 } }, h.rate)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: G[400], marginBottom: 12 } }, h.amenities), /* @__PURE__ */ React.createElement("div", { style: { height: 4, background: G[100], borderRadius: 2, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${(h.occ / h.beds * 100).toFixed(0)}%`, background: h.occ / h.beds > 0.7 ? "#dc2626" : T[500], borderRadius: 2 } })), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast(`Viewing ${h.name}`), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px" } }, "View")))));
  const COORDS = [
    { name: "Ana Rodr\u00edguez", cases: 8, lang: "EN \xB7 ES", status: "Active", email: "ana@praesenti.com", rating: "4.9" },
    { name: "Miguel Santos", cases: 5, lang: "EN \xB7 ES \xB7 PT", status: "Active", email: "miguel@praesenti.com", rating: "4.8" },
    { name: "Claire Dubois", cases: 3, lang: "EN \xB7 FR", status: "Active", email: "claire@praesenti.com", rating: "5.0" },
    { name: "Thomas Nguyen", cases: 0, lang: "EN", status: "On leave", email: "thomas@praesenti.com", rating: "4.7" }
  ];
  const CoordinatorsScreen = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement(
    PanelHeader,
    {
      title: "Coordinators",
      subtitle: "Patient care coordination team",
      actions: [/* @__PURE__ */ React.createElement("button", { key: "add", onClick: () => showToast("Add coordinator"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add coordinator")]
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } }, /* @__PURE__ */ React.createElement(Stat, { label: "Active coordinators", value: COORDS.filter((c) => c.status === "Active").length, color: T[700], icon: "users" }), /* @__PURE__ */ React.createElement(Stat, { label: "Total active cases", value: COORDS.reduce((a, c) => a + c.cases, 0), color: T[500], icon: "clipboard" }), /* @__PURE__ */ React.createElement(Stat, { label: "Languages covered", value: "4", color: G[500], icon: "globe" })), COORDS.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 16, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 42, height: 42, borderRadius: "50%", background: T[100], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 17, fontWeight: 600, color: T[700], flexShrink: 0 } }, c.name[0]), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, c.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: G[500], marginTop: 2 } }, c.email), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } }, "Languages: ", c.lang)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: T[600], fontFamily: serif } }, c.cases), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: G[400] } }, "cases")), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 500, background: c.status === "Active" ? T[50] : G[100], color: c.status === "Active" ? T[700] : G[500], border: `1px solid ${c.status === "Active" ? T[100] : G[200]}` } }, c.status), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, c.rating, " \u2605"), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast(`Viewing ${c.name}`), style: { ...s.btnGhost, fontSize: 12, padding: "6px 12px", marginTop: 4 } }, "View")))));
  const FIN_PAYMENTS = [
    { date: "Mar 20", patient: "Maria Vasquez", desc: "Rhinoplasty", amount: "$4,200", status: "Settled", method: "Escrow" },
    { date: "Mar 20", patient: "Sofia Mart\u00ednez", desc: "Breast Augmentation", amount: "$5,500", status: "Settled", method: "Escrow" },
    { date: "Mar 25", patient: "James Okafor", desc: "Liposuction deposit", amount: "$2,040", status: "Held", method: "Escrow" },
    { date: "Apr 02", patient: "James Okafor", desc: "Liposuction balance", amount: "$4,760", status: "Pending", method: "\u2014" },
    { date: "Apr 09", patient: "Anna Kowalski", desc: "Tummy Tuck deposit", amount: "$2,160", status: "Pending", method: "\u2014" }
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
  const ESCROW = [
    { patient: "James Okafor", proc: "Liposuction", held: "$2,040", total: "$6,800", release: "Apr 02", stage: "Pre-op" },
    { patient: "Anna Kowalski", proc: "Tummy Tuck", held: "$0", total: "$7,200", release: "Apr 09", stage: "Lead" },
    { patient: "Luca Ferreira", proc: "Hair Transplant", held: "$0", total: "$3,100", release: "Apr 18", stage: "Lead" }
  ];
  const EscrowScreen = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement(PanelHeader, { title: "Escrow", subtitle: "Patient funds held in trust pending surgery confirmation" }), /* @__PURE__ */ React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } }, /* @__PURE__ */ React.createElement(Stat, { label: "Total in escrow", value: "$2,040", color: T[700], icon: "lock" }), /* @__PURE__ */ React.createElement(Stat, { label: "Awaiting deposit", value: "$10,300", color: "#b45309", icon: "creditCard" }), /* @__PURE__ */ React.createElement(Stat, { label: "Escrow accounts", value: ESCROW.length, color: G[500], icon: "shield" })), ESCROW.map((e, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { ...s.card, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, e.patient), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: G[500], marginTop: 2 } }, e.proc, " \xB7 Release: ", e.release)), /* @__PURE__ */ React.createElement(SPill, { status: e.stage })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.label }, "Total contract"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: G[900], fontFamily: serif, marginTop: 4 } }, e.total)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.label }, "Held"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: T[700], fontFamily: serif, marginTop: 4 } }, e.held)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.label }, "Remaining"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: G[500], fontFamily: serif, marginTop: 4 } }, "$" + (parseInt(e.total.replace(/[^0-9]/g, "")) - parseInt(e.held.replace(/[^0-9]/g, ""))).toLocaleString()))), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast(`Release escrow for ${e.patient}`), style: { ...s.btnPrimary, width: "100%", fontSize: 12, padding: "8px 0" } }, "Release funds"))));
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
    const REPORT_LIST = [
      "Q1 2026 \u2014 Patient Outcomes Report",
      "Q1 2026 \u2014 Financial Summary",
      "Q1 2026 \u2014 Coordinator Performance",
      "Q4 2024 \u2014 Annual Overview",
      "Q4 2024 \u2014 Provider Network Review"
    ];
    return /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Reports"), /* @__PURE__ */ React.createElement("p", { style: { color: G[400], fontSize: 13 } }, "Operational and financial reports by period")), /* @__PURE__ */ React.createElement("select", { value: period, onChange: (e) => setPeriod(e.target.value), style: { height: 38, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 12px", fontSize: 13, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } }, ["Q1 2026", "Q4 2024", "Q3 2024"].map((p) => /* @__PURE__ */ React.createElement("option", { key: p }, p)))), /* @__PURE__ */ React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } }, METRICS.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { ...s.card, marginBottom: 0 } }, /* @__PURE__ */ React.createElement("div", { style: s.label }, m.label), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: serif, fontSize: 28, fontWeight: 600, color: G[900] } }, m.value), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: m.up ? T[600] : "#dc2626" } }, m.change))))), /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Available reports"), REPORT_LIST.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < REPORT_LIST.length - 1 ? `1px solid ${G[100]}` : "none" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: G[700] } }, r), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast(`Downloading ${r}`), style: { ...s.btnGhost, fontSize: 11, padding: "5px 12px" } }, "Download")))));
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

  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: sans, background: G[50], minHeight: "100vh" } }, toast && /* @__PURE__ */ React.createElement(Toast, { msg: toast, onDone: () => setToast(null) }), /* @__PURE__ */ React.createElement("div", { className: "dash-header", style: { height: 60, background: "#fff", borderBottom: `1px solid ${G[200]}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 19, fontWeight: 600, color: T[900], letterSpacing: "0.06em", textTransform: "uppercase" } }, "Praes", /* @__PURE__ */ React.createElement("span", { style: { color: T[500] } }, "enti")), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 500, color: T[500], letterSpacing: "0.08em", textTransform: "uppercase", marginLeft: 6 } }, "Admin")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: G[700] } }, /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T[700], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 14, fontWeight: 600, color: T[200] } }, "P"), "Admin"), /* @__PURE__ */ React.createElement("button", { onClick: onSignOut, style: { background: "none", border: `1px solid ${G[200]}`, color: G[500], padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: sans } }, "Sign out"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", minHeight: "calc(100vh - 60px)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(AdminSidebar, null), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" } }, screen === "overview" && /* @__PURE__ */ React.createElement(AdminOverview, null), screen === "case" && /* @__PURE__ */ React.createElement(AdminCaseDetail, null), screen === "pipeline" && /* @__PURE__ */ React.createElement(PipelineScreen, null), screen === "incidents" && /* @__PURE__ */ React.createElement(IncidentsScreen, null), screen === "providers" && /* @__PURE__ */ React.createElement(ProvidersScreen, null), screen === "homes" && /* @__PURE__ */ React.createElement(HomesScreen, null), screen === "coordinators" && /* @__PURE__ */ React.createElement(CoordinatorsScreen, null), screen === "finance-payments" && /* @__PURE__ */ React.createElement(FinancePaymentsScreen, null), screen === "escrow" && /* @__PURE__ */ React.createElement(EscrowScreen, null), screen === "reports" && /* @__PURE__ */ React.createElement(ReportsScreen, null))));
};

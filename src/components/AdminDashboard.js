import { T, G, serif, sans, s, CASES, ADMIN_NOTES, RECOVERY_CHECKS, JOURNEY_STEPS } from '../constants.js';
import { fetchChecklist, saveChecklist, fetchDocuments } from '../supabase.js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';
import { HamburgerIcon, Icon, SPill, Toast, Modal, IR } from './shared.js';

const { React } = window;
const { useState, useRef, useEffect } = React;

export const AdminDashboard = ({ user, onSignOut }) => {
  // Fallback if user is not provided
  if (!user) {
    return React.createElement("div", { style: { padding: 32, color: "#666" } },
      React.createElement("p", null, "Admin data not available. Please log in again.")
    );
  }
  
  const isDemo = !!user?.isDemo;
  const [screen, setScreen] = useState("overview");
  const [isDemoMode, setIsDemoMode] = useState(isDemo);
  const [isLoadingMode, setIsLoadingMode] = useState(!isDemo); // Loading if not demo
  const [sidebarItem, setSidebarItem] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [demoNotes, setDemoNotes] = useState(ADMIN_NOTES);
  const [dbNotes, setDbNotes] = useState([]);
  const NOTES_TO_USE = isDemoMode ? demoNotes : dbNotes;

  const [toast, setToast] = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState(isDemo ? CASES[0] : null);
  const [adminCheckDone, setAdminCheckDone] = useState(Array(RECOVERY_CHECKS.length).fill(false));
  const [adminDocs, setAdminDocs] = useState([]);
  const [adminCaseTab, setAdminCaseTab] = useState("journey");
  const [notifications, setNotifications] = useState(() => {
    if (isDemo) {
      try {
        const saved = localStorage.getItem("praesenti_notifs_admin");
        if (saved) return JSON.parse(saved);
      } catch(e) {}
      return [
        { id: 1, type: "users", title: "New Coordinator", body: "Carlos Vega joined the platform.", time: "1 hour ago", read: false },
        { id: 2, type: "hospital", title: "New Clinic Registration", body: "Bella Forma Clinic was added to the network.", time: "2 hours ago", read: false },
        { id: 3, type: "fileText", title: "Monthly Report", body: "Financial summary for March is ready.", time: "1 day ago", read: true }
      ];
    }
    return [];
  });

  useEffect(() => {
    if (isDemo) {
      localStorage.setItem("praesenti_notifs_admin", JSON.stringify(notifications));
    }
  }, [notifications, isDemo]);

  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markRead = async id => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    if (!isDemoMode) {
      try {
        const sUrl = SUPABASE_URL || window.SUPA_URL || window.VITE_SUPABASE_URL || "";
        const sKey = SUPABASE_KEY || window.SUPA_KEY || window.VITE_SUPABASE_KEY || "";
        const h = { "Content-Type":"application/json", apikey: sKey, Authorization: "Bearer " + (user.token || sKey) };
        await fetch(sUrl + "/rest/v1/notificaciones?id=eq." + id, {
          method: 'PATCH',
          headers: h,
          body: JSON.stringify({ leida: true })
        });
      } catch(e) {}
    }
  };

  const markAllRead = async () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    if (!isDemoMode) {
      try {
        const sUrl = SUPABASE_URL || window.SUPA_URL || window.VITE_SUPABASE_URL || "";
        const sKey = SUPABASE_KEY || window.SUPA_KEY || window.VITE_SUPABASE_KEY || "";
        const h = { "Content-Type":"application/json", apikey: sKey, Authorization: "Bearer " + (user.token || sKey) };
        await fetch(sUrl + "/rest/v1/notificaciones?leida=eq.false", {
          method: 'PATCH', headers: h, body: JSON.stringify({ leida: true })
        });
      } catch(e) {}
    }
  };

  const DEMO_DOCS = {
    "C-001": [
      { id: "d1", name: "Passport_EmilyThornton.pdf", size: "1.2 MB", req_type: "Passport / ID", url: "#", created_at: "2026-03-01T10:00:00Z" },
      { id: "d2", name: "BloodTest_March2026.pdf", size: "340 KB", req_type: "Blood work", url: "#", created_at: "2026-03-10T14:30:00Z" },
      { id: "d3", name: "SurgeonLetter_Vargas.pdf", size: "210 KB", req_type: "Medical clearance", url: "#", created_at: "2026-03-12T09:15:00Z" }
    ],
    "C-002": [
      { id: "d4", name: "Passport_MarcusWebb.pdf", size: "980 KB", req_type: "Passport / ID", url: "#", created_at: "2026-03-18T11:00:00Z" }
    ],
    "C-003": [
      { id: "d5", name: "Passport_IsabelleFontaine.pdf", size: "1.1 MB", req_type: "Passport / ID", url: "#", created_at: "2026-03-05T09:00:00Z" },
      { id: "d6", name: "ConsentForm_Signed.pdf", size: "450 KB", req_type: "Consent form", url: "#", created_at: "2026-03-14T16:00:00Z" },
      { id: "d7", name: "PreOp_Labwork.pdf", size: "520 KB", req_type: "Blood work", url: "#", created_at: "2026-03-15T08:30:00Z" },
      { id: "d8", name: "InsuranceCert.pdf", size: "280 KB", req_type: "Insurance", url: "#", created_at: "2026-03-16T10:00:00Z" }
    ],
    "C-004": [],
    "C-005": [
      { id: "d9", name: "Passport_HannaBergstrom.pdf", size: "1.0 MB", req_type: "Passport / ID", url: "#", created_at: "2026-03-28T12:00:00Z" }
    ]
  };

  useEffect(() => {
    if (selectedCase && selectedCase.caso_id_uuid) {
      const load = async () => {
        const data = await fetchChecklist(selectedCase.caso_id_uuid);
        if (data && data.items) {
          setAdminCheckDone(data.items);
        } else {
          setAdminCheckDone(Array(RECOVERY_CHECKS.length).fill(false));
        }
        const docs = await fetchDocuments(selectedCase.caso_id_uuid, null);
      setAdminDocs(docs && docs.length > 0 ? docs : (isDemoMode ? (DEMO_DOCS[selectedCase.id] || []) : []));
      };
      load();
    } else {
      setAdminCheckDone(Array(RECOVERY_CHECKS.length).fill(false));
      setAdminDocs(DEMO_DOCS[selectedCase?.id] || []);
    }
    setAdminCaseTab("journey");
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

  // Check if this is a REAL admin (exists in Supabase admins table) or DEMO
  useEffect(() => {
    if (!user || !user.email || isDemo) { 
      setIsDemoMode(true);
      setIsLoadingMode(false);
      return; 
    }
    try {
      const sUrl = SUPABASE_URL || window.SUPA_URL || window.VITE_SUPABASE_URL || "";
      const sKey = SUPABASE_KEY || window.SUPA_KEY || window.VITE_SUPABASE_KEY || "";
      if (!sUrl || !sKey) { 
        setIsDemoMode(true);
        setIsLoadingMode(false);
        return; 
      }
      const checkAdmin = async () => {
        try {
          const h = { "Content-Type":"application/json", apikey: sKey, Authorization: "Bearer " + (user.token || sKey) };
          const r = await fetch(sUrl + "/rest/v1/admins?email=eq." + encodeURIComponent(user.email), { headers: h });
          const data = r.ok ? await r.json() : [];
          if (!data || data.length === 0) {
            setToast("Acceso no autorizado.");
            setTimeout(() => onSignOut && onSignOut(), 1500);
            return;
          }
          setIsDemoMode(false);
          setIsLoadingMode(false);
        } catch(e) {
          console.log("Mode check error:", e);
          if (onSignOut) onSignOut();
        }
      };
      checkAdmin();
    } catch(e) {
      console.log("Mode check error:", e);
      if (onSignOut) onSignOut();
    }
  }, [user?.email]);

  // Real data from Supabase (falls back to demo data)
  const [dbDoctores, setDbDoctores] = useState([]);
  const [dbClinics, setDbClinics] = useState([]);
  const [dbHomes, setDbHomes] = useState([]);
  const [dbNurses, setDbNurses] = useState([]);
  const [dbCoords, setDbCoords] = useState([]);
  const [dbCases, setDbCases] = useState([]);
  const [dbPayments, setDbPayments] = useState([]);
  const [dbPacientes, setDbPacientes] = useState([]);
  const [dbIncidents, setDbIncidents] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Only load real data if this is a REAL admin (not demo)
    if (isDemoMode) return;
    
    const sUrl = SUPABASE_URL || window.SUPA_URL || window.VITE_SUPABASE_URL || "";
    const sKey = SUPABASE_KEY || window.SUPA_KEY || window.VITE_SUPABASE_KEY || "";
    if (!sUrl || !sKey) return;
    const h = { apikey: sKey, Authorization: "Bearer " + (user.token || sKey) };
    Promise.all([
      fetch(sUrl + "/rest/v1/doctores?select=*&order=name", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(sUrl + "/rest/v1/clinicas?select=*&order=name", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(sUrl + "/rest/v1/recovery_homes?select=*&order=name", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(sUrl + "/rest/v1/nurses?select=*&order=name", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(sUrl + "/rest/v1/coordinadores?select=*&order=name", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(sUrl + "/rest/v1/caso?select=*,paciente(*)", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(sUrl + "/rest/v1/pago?select=*,caso(paciente(nombre_completo))&order=fecha_creacion.desc", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(sUrl + "/rest/v1/notificaciones?select=*&order=created_at.desc", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(sUrl + "/rest/v1/paciente?select=*&order=fecha_registro.desc", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(sUrl + "/rest/v1/admin_notes?select=*&order=created_at.desc", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(sUrl + "/rest/v1/incidents?select=*&order=created_at.desc", { headers: h }).then(r => r.ok ? r.json() : []).catch(() => [])
    ]).then(([docs, clinics, homes, nurses, coords, cases, pagos, notifs, pacientes, anotes, aincidents]) => {
      if (Array.isArray(docs)) setDbDoctores(docs);
      if (Array.isArray(clinics)) setDbClinics(clinics);
      if (Array.isArray(homes)) setDbHomes(homes);
      if (Array.isArray(nurses)) setDbNurses(nurses);
      if (Array.isArray(coords)) setDbCoords(coords);
      if (Array.isArray(cases)) {
        const mapped = cases.map(c => {
          const caseId = c.caso_id || c.caso_id_uuid || c.id;
          const patientData = Array.isArray(c.paciente) ? c.paciente[0] : c.paciente;
          const rawStatus = c.estado || "Lead";
          const formattedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
          return {
          id: caseId ? String(caseId).substring(0,8).toUpperCase() : "C-NEW",
          caso_id_uuid: caseId,
          name: patientData?.nombre_completo || "Unknown Patient",
          proc: c.procedimiento || "TBD",
          status: formattedStatus,
          date: c.fecha_cirugia || "TBD",
          surgeon: c.cirujano_id || "— Unassigned —",
          budget: c.presupuesto_estimado_usd ? `$${c.presupuesto_estimado_usd}` : "TBD",
          country: patientData?.pais_residencia || "Unknown"
          };
        });
        setDbCases(mapped);
      }
      if (Array.isArray(pagos)) {
        const mappedPagos = pagos.map(p => {
          const pat = Array.isArray(p.caso) ? p.caso[0]?.paciente : p.caso?.paciente;
          const patName = Array.isArray(pat) ? pat[0]?.nombre_completo : pat?.nombre_completo;
          return {
            date: p.fecha_creacion ? p.fecha_creacion.substring(0, 10) : "N/A",
            patient: patName || "Unknown",
            desc: p.notas || "Procedimiento",
            amount: "$" + (p.monto_total_usd || p.deposito_usd || 0).toLocaleString(),
            status: p.estado_pago === "pendiente" ? "Pending" : "Settled",
            method: p.deposito_pagado ? "Card" : "—"
          };
        });
        setDbPayments(mappedPagos);
      }
      if (Array.isArray(notifs)) {
        const mappedNotifs = notifs.map(n => ({
          id: n.id || n.notificacion_id,
          type: n.tipo || "activity",
          title: n.titulo || "Notificación",
          body: n.mensaje || "",
          time: n.created_at ? new Date(n.created_at).toLocaleDateString() : "Reciente",
          read: n.leida || false
        }));
        setNotifications(mappedNotifs);
      }
      if (Array.isArray(pacientes)) {
        setDbPacientes(pacientes);
      }
      if (Array.isArray(anotes)) setDbNotes(anotes);
      if (Array.isArray(aincidents)) setDbIncidents(aincidents);
      setDataLoaded(true);
    });
  }, [isDemoMode, user?.token, user?.email]);

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedHome, setSelectedHome] = useState(null);
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const ACTIVE_CASES = isDemoMode ? CASES : dbCases;
  const filtered = ACTIVE_CASES.filter((c) => (c.name||"").toLowerCase().includes(tableSearch.toLowerCase()) || (c.proc||"").toLowerCase().includes(tableSearch.toLowerCase()));
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
  const saveNote = async () => {
    if (!noteInput.trim()) return;
    const now = new Date();
    if (isDemoMode) {
      setDemoNotes((n) => [{ author: "Admin", date: `${now.toLocaleDateString('en-US', {month:'short', day:'numeric'})} \xB7 ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`, text: noteInput.trim() }, ...n]);
      setNoteInput("");
      showToast("Note saved");
    } else {
      try {
        const sUrl = SUPABASE_URL || window.SUPA_URL || window.VITE_SUPABASE_URL || "";
        const sKey = SUPABASE_KEY || window.SUPA_KEY || window.VITE_SUPABASE_KEY || "";
        const h = { "Content-Type":"application/json", apikey: sKey, Authorization: "Bearer " + (user.token || sKey), Prefer: "return=representation" };
        const res = await fetch(sUrl + "/rest/v1/admin_notes", {
          method: "POST", headers: h, body: JSON.stringify({ author: "Admin", text: noteInput.trim() })
        }).then(r => r.json());
        if(res && res[0]) setDbNotes(prev => [res[0], ...prev]);
        setNoteInput("");
        showToast("Note saved to DB");
      } catch(e) { showToast("Error saving note"); }
    }
  };
  const ADMIN_GROUPS = [
    ["Operations", [
      ["Dashboard", "chartBar", () => navTo("Dashboard", "overview")],
      ["Patients", "person", () => navTo("Patients", "patients")],
      ["All Cases", "users", () => navTo("All Cases", "case")],
      ["Pipeline", "trendingUp", () => navTo("Pipeline", "pipeline")],
      ["Incidents", "alertCircle", () => navTo("Incidents", "incidents")]
    ]],
    ["Network", [
      ["Providers", "userMd", () => navTo("Providers", "providers")],
      ["Nursing Staff", "heart", () => navTo("Nursing Staff", "nursing")],
      ["Clinics", "hospital", () => navTo("Clinics", "clinics")],
      ["Doctors", "stethoscope", () => navTo("Doctors", "doctors")],
      ["Recovery Homes", "home", () => navTo("Recovery Homes", "homes")],
      ["Coordinators", "network", () => navTo("Coordinators", "coordinators")]
    ]],
    ["Finance", [
      ["Payments", "creditCard", () => navTo("Payments", "finance-payments")],
      ["Escrow", "lock", () => navTo("Escrow", "escrow")],
      ["Reports", "fileText", () => navTo("Reports", "reports")]
    ]]
  ];

  // Modal state for inline forms
  const [modal, setModal] = React.useState(null); // null | "clinic" | "doctor" | "home" | "nurse" | "coord"
  const [editItem, setEditItem] = useState(null);
  const closeModal = () => { setModal(null); setEditItem(null); };
  const openEditModal = (type, item) => { setEditItem(item); setModal(type); };
  const PanelHeader = ({ title, subtitle, actions }) => /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 28 } }, /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, title), subtitle && /* @__PURE__ */ React.createElement("p", { style: { color: G[400], fontSize: 13 } }, subtitle), actions && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 14 } }, actions));
  const Stat = ({ label, value, color, icon }) => /* @__PURE__ */ React.createElement("div", { style: { ...s.card, marginBottom: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: s.label }, label), /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 14, color })), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 32, fontWeight: 600, color } }, value));
  const caseMatch = (c, status) => (c.status || "").toLowerCase() === status.toLowerCase();
  const PIPELINE_COLS = isDemoMode ? [
    { label: "New Lead", color: "#6b7280", items: [{ name: "Rafael Oliveira", proc: "Hair Transplant", budget: "$3,100", country: "BR" }, { name: "Claire Marchand", proc: "Rhinoplasty", budget: "$3,900", country: "AU" }] },
    { label: "Qualified", color: "#92400e", items: [{ name: "Marcus Webb", proc: "Liposuction", budget: "$6,800", country: "UK" }, { name: "Hanna Bergstr\u00f6m", proc: "Tummy Tuck", budget: "$7,200", country: "PL" }] },
    { label: "Matched", color: "#1a7a72", items: [{ name: "Pietro Lombardi", proc: "Bariatric Surgery", budget: "$11,000", country: "MX" }] },
    { label: "Pre-op", color: "#b45309", items: [{ name: "Marcus Webb", proc: "Liposuction", budget: "$6,800", country: "UK" }] },
    { label: "In Recovery", color: "#1a9e95", items: [{ name: "Emily Thornton", proc: "Rhinoplasty", budget: "$4,200", country: "USA" }, { name: "Sofia Mart\u00ednez", proc: "Breast Aug.", budget: "$5,500", country: "CA" }] },
    { label: "Completed", color: "#059669", items: [{ name: "Yuki Tanaka", proc: "Dental Veneers", budget: "$2,100", country: "US" }] }
  ] : [
    { label: "New Lead", color: "#6b7280", items: dbCases.filter(c => caseMatch(c, "Lead")) },
    { label: "Qualified", color: "#92400e", items: dbCases.filter(c => caseMatch(c, "Qualified")) },
    { label: "Matched", color: "#1a7a72", items: dbCases.filter(c => caseMatch(c, "Matched")) },
    { label: "Pre-op", color: "#b45309", items: dbCases.filter(c => caseMatch(c, "Pre-op")) },
    { label: "In Recovery", color: "#1a9e95", items: dbCases.filter(c => caseMatch(c, "Recovery")) },
    { label: "Completed", color: "#059669", items: dbCases.filter(c => caseMatch(c, "Completed")) }
  ];
  const PipelineScreen = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement(PanelHeader, { title: "Pipeline", subtitle: "Patient journey status across all active cases" }), /* @__PURE__ */ React.createElement("div", { className: "grid-6", style: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, alignItems: "start" } }, PIPELINE_COLS.map(({ label, color, items }) => /* @__PURE__ */ React.createElement("div", { key: label }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color } }, label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, background: G[100], color: G[500], borderRadius: 10, padding: "1px 7px", fontWeight: 600 } }, items.length)), items.map((it, i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: i,
      style: { ...s.card, marginBottom: 8, padding: "12px 14px", cursor: "pointer" },
      onClick: () => {
        const fullCase = ACTIVE_CASES.find((c) => c.name === it.name) || { ...it, id: it.id || "C-000", status: label, date: "TBD", surgeon: "— Unassigned —" };
        setSelectedCase(fullCase);
        navTo("All Cases", "case");
      },
      onMouseEnter: (e) => e.currentTarget.style.borderColor = T[300],
      onMouseLeave: (e) => e.currentTarget.style.borderColor = G[200]
    },
/* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900], marginBottom: 3 } }, it.name),
/* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: G[400] } }, it.proc),
/* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: T[600], fontWeight: 500, marginTop: 4 } }, it.budget, " \xB7 ", it.country)
  ))))));
  const [demoIncidents, setDemoIncidents] = useState([
    { id: "INC-001", patient: "Hanna Bergstr\u00f6m", type: "Medical", desc: "Mild post-op fever reported on day 2. Dr. Medina notified. Monitoring underway.", severity: "Medium", date: "Mar 26", resolved: false },
    { id: "INC-002", patient: "Marcus Webb", type: "Logistics", desc: "Airport transfer missed due to flight delay. Rescheduled. No impact on surgery.", severity: "Low", date: "Mar 25", resolved: true },
    { id: "INC-003", patient: "Isabelle Fontaine", type: "Administrative", desc: "Consent form re-signature required after minor procedure change.", severity: "Low", date: "Mar 22", resolved: true },
    { id: "INC-004", patient: "Emily Thornton", type: "Medical", desc: "Patient reported unusual swelling. Surgical team reviewed remotely; deemed normal.", severity: "Low", date: "Mar 23", resolved: true }
  ]);
  const INCIDENTS_TO_USE = isDemoMode ? demoIncidents : dbIncidents;
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newInc, setNewInc] = useState({ patient: "", type: "Medical", severity: "Low", desc: "" });

  const resolveIncident = async (id) => {
    if (isDemoMode) {
      setDemoIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, resolved: true } : inc));
      showToast("Incident marked as resolved");
    } else {
      try {
        const sUrl = SUPABASE_URL || window.SUPA_URL || window.VITE_SUPABASE_URL || "";
        const sKey = SUPABASE_KEY || window.SUPA_KEY || window.VITE_SUPABASE_KEY || "";
        const h = { "Content-Type":"application/json", apikey: sKey, Authorization: "Bearer " + (user.token || sKey) };
        await fetch(sUrl + "/rest/v1/incidents?id=eq." + id, {
          method: "PATCH", headers: h, body: JSON.stringify({ resolved: true })
        });
        setDbIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, resolved: true } : inc));
        showToast("Incident marked as resolved");
      } catch(e) { showToast("Error resolving incident"); }
    }
  };

  const logIncident = async () => {
    if (!newInc.patient.trim() || !newInc.desc.trim()) { showToast("Please fill in patient and description"); return; }
    const nextNum = (INCIDENTS_TO_USE.length + 1).toString().padStart(3, "0");
    const incId = "INC-" + nextNum;
    
    if (isDemoMode) {
      const today = new Date();
      const timeStr = today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ", " + timeStr;
      setDemoIncidents(prev => [{ id: incId, ...newInc, date: dateStr, resolved: false }, ...prev]);
      setNewInc({ patient: "", type: "Medical", severity: "Low", desc: "" });
      setShowIncidentForm(false);
      showToast("Incident logged: " + incId);
    } else {
      try {
        const sUrl = SUPABASE_URL || window.SUPA_URL || window.VITE_SUPABASE_URL || "";
        const sKey = SUPABASE_KEY || window.SUPA_KEY || window.VITE_SUPABASE_KEY || "";
        const h = { "Content-Type":"application/json", apikey: sKey, Authorization: "Bearer " + (user.token || sKey), Prefer: "return=representation" };
        const payload = { id: incId, patient: newInc.patient, type: newInc.type, severity: newInc.severity, description: newInc.desc, resolved: false };
        const res = await fetch(sUrl + "/rest/v1/incidents", {
          method: "POST", headers: h, body: JSON.stringify(payload)
        }).then(r => r.json());
        if(res && res[0]) setDbIncidents(prev => [res[0], ...prev]);
        setNewInc({ patient: "", type: "Medical", severity: "Low", desc: "" });
        setShowIncidentForm(false);
        showToast("Incident logged: " + incId);
      } catch(e) { showToast("Error logging incident"); }
    }
  };

  const IncidentDetailScreen = () => {
    const inc = selectedIncident;
    if (!inc) return null;
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("button", { onClick: () => setSelectedIncident(null), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, marginBottom: 24 } },
        React.createElement(Icon, { name: "arrowLeft", size: 13, color: G[600] }), "Back to Incidents"
      ),
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 } },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: T[500], letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 } }, "Incident Details"),
          React.createElement("h1", { style: { fontFamily: serif, fontSize: 28, color: T[950], marginBottom: 8 } }, inc.id + " - " + inc.patient),
          React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } },
            React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 500, background: inc.resolved ? T[50] : "#fef2f2", color: inc.resolved ? T[700] : "#dc2626", border: `1px solid ${inc.resolved ? T[100] : "#fca5a5"}` } }, inc.resolved ? "Resolved" : "Open"),
            React.createElement("span", { style: { fontSize: 11, color: G[500], background: G[100], padding: "3px 10px", borderRadius: 10 } }, inc.type),
            React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, color: inc.severity === "High" ? "#dc2626" : inc.severity === "Medium" ? "#92400e" : G[500], background: inc.severity === "High" ? "#fef2f2" : inc.severity === "Medium" ? "#fef3c7" : G[50] } }, inc.severity)
          )
        ),
        !inc.resolved && React.createElement("button", { onClick: () => { resolveIncident(inc.id); setSelectedIncident({...inc, resolved: true}); }, style: { ...s.btnPrimary, display: "flex", alignItems: "center", gap: 6 } },
          React.createElement(Icon, { name: "check", size: 14, color: "#fff" }), "Mark resolved"
        )
      ),
      React.createElement("div", { style: s.card },
        React.createElement("div", { style: { ...s.label, marginBottom: 12 } }, "Description"),
        React.createElement("p", { style: { fontSize: 14, color: G[700], lineHeight: 1.6 } }, inc.desc || inc.description),
        React.createElement("div", { style: { marginTop: 20, paddingTop: 14, borderTop: `1px solid ${G[100]}`, fontSize: 12, color: G[400] } },
          "Reported on: ", inc.date || (inc.created_at ? new Date(inc.created_at).toLocaleString('en-US', {month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'}) : "")
        )
      )
    );
  };

  const IncidentsScreen = () => {
    if (selectedIncident) return IncidentDetailScreen();
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
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
      React.createElement(Stat, { label: "Open", value: INCIDENTS_TO_USE.filter(i => !i.resolved).length, color: "#dc2626", icon: "alertCircle" }),
      React.createElement(Stat, { label: "Resolved this month", value: INCIDENTS_TO_USE.filter(i => i.resolved).length, color: T[600], icon: "check" }),
      React.createElement(Stat, { label: "Total logged", value: INCIDENTS_TO_USE.length, color: G[500], icon: "fileText" })
    ),
    INCIDENTS_TO_USE.map((inc) => React.createElement("div", { key: inc.id, onClick: () => setSelectedIncident(inc), style: { ...s.card, marginBottom: 12, cursor: "pointer", borderLeft: `3px solid ${inc.resolved ? T[200] : inc.severity === "High" ? "#dc2626" : inc.severity === "Medium" ? "#f59e0b" : G[300]}` } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } },
        React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } },
          React.createElement("span", { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: G[400] } }, inc.id),
          React.createElement("span", { style: { fontSize: 11, padding: "2px 9px", borderRadius: 10, fontWeight: 500, background: inc.resolved ? T[50] : "#fef2f2", color: inc.resolved ? T[700] : "#dc2626", border: `1px solid ${inc.resolved ? T[100] : "#fca5a5"}` } }, inc.resolved ? "Resolved" : "Open"),
          React.createElement("span", { style: { fontSize: 11, color: G[500], background: G[100], padding: "2px 8px", borderRadius: 10 } }, inc.type),
          React.createElement("span", { style: { fontSize: 11, padding: "2px 8px", borderRadius: 10, color: inc.severity === "High" ? "#dc2626" : inc.severity === "Medium" ? "#92400e" : G[500], background: inc.severity === "High" ? "#fef2f2" : inc.severity === "Medium" ? "#fef3c7" : G[50] } }, inc.severity)
        ),
        React.createElement("span", { style: { fontSize: 11, color: G[400] } }, inc.date || (inc.created_at ? new Date(inc.created_at).toLocaleString('en-US', {month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'}) : ""))
      ),
      React.createElement("div", { style: { fontSize: 14, fontWeight: 500, color: G[900], marginBottom: 4 } }, inc.patient),
      React.createElement("p", { style: { fontSize: 13, color: G[600], lineHeight: 1.6 } }, inc.desc || inc.description),
      !inc.resolved && React.createElement("button", { onClick: (e) => { e.stopPropagation(); resolveIncident(inc.id); }, style: { ...s.btnGhost, marginTop: 12, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6 } },
        React.createElement(Icon, { name: "check", size: 13, color: T[600] }),
        "Mark resolved"
      )
    ))
  );
  };
  const PROVIDERS = isDemo ? [
    { name: "Dr. A. Vargas", spec: "Plastic & Reconstructive", hosp: "Clínica Vida", cases: 38, rating: "4.9", cert: "ABPS · JCI", phone: "+1 809 555 0101", email: "vargas@clinicavida.com", langs: "Spanish, English", bio: "Board-certified plastic surgeon with 12 years of experience in aesthetic and reconstructive procedures. Trained at Universidad Autónoma de Santo Domingo and completed a fellowship in Miami, FL." },
    { name: "Dr. C. Romero", spec: "Bariatric Surgery", hosp: "Centro Médico Central", cases: 21, rating: "4.8", cert: "IFSO · JCI", phone: "+1 809 555 0202", email: "romero@centromedico.com", langs: "Spanish, English, Portuguese", bio: "Specialist in minimally invasive bariatric surgery with over 400 successful procedures. Member of the International Federation for the Surgery of Obesity." },
    { name: "Dr. M. Medina", spec: "General & Bariatric", hosp: "Hospital del Este", cases: 15, rating: "4.7", cert: "ACS · JCI", phone: "+1 809 555 0303", email: "medina@hospitaleste.com", langs: "Spanish", bio: "General surgeon specializing in bariatric and laparoscopic procedures. Over 10 years of experience at Hospital del Este." },
    { name: "Dr. I. Castillo", spec: "Hair Restoration", hosp: "Clínica del Sol", cases: 29, rating: "5.0", cert: "ISHRS", phone: "+1 809 555 0404", email: "castillo@clinicasol.com", langs: "Spanish, English", bio: "Hair restoration specialist certified by the International Society of Hair Restoration Surgery. Pioneer in FUE technique in the Dominican Republic." },
    { name: "Dr. R. Herrera", spec: "Dental & Maxillofacial", hosp: "DentalPro", cases: 44, rating: "4.9", cert: "IAOMS", phone: "+1 809 555 0505", email: "herrera@dentalpro.com", langs: "Spanish, English, French", bio: "Oral and maxillofacial surgeon with specialty in dental veneers, implants, and jaw surgery. 15 years serving international patients." }
  ] : [];

  const NURSES = isDemo ? [
    { name: "Ana Reyes", license: "RN-8821", spec: "Post-op Care", home: "Villa Serena", cases: 12, rating: "4.9", cert: "RN · BLS · ACLS", phone: "+1 809 555 3001", email: "ana@praesenti.com", langs: "Spanish, English", bio: "Registered Nurse specialized in post-operative care with 8 years of experience in plastic surgery recovery and patient monitoring." },
    { name: "María Santos", license: "RN-7543", spec: "Wound Care", home: "Casa Brisa", cases: 18, rating: "4.8", cert: "RN · BLS · WOCN", phone: "+1 809 555 3002", email: "maria@praesenti.com", langs: "Spanish, English, Portuguese", bio: "Wound care specialist certified as Wound, Ostomy, and Continence Nurse. Over 10 years in surgical recovery homes." },
    { name: "Carmen López", license: "RN-9201", spec: "ICU & Critical Care", home: "Punta Suites", cases: 9, rating: "4.7", cert: "RN · BLS · CCRN", phone: "+1 809 555 3003", email: "carmen@praesenti.com", langs: "Spanish, English", bio: "Critical Care Registered Nurse with expertise in intensive monitoring and emergency response for post-operative complications." }
  ] : [];
  // \u2500\u2500 PROVIDER DETAIL SCREEN (full page) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  const CLINICS = isDemo ? [
    { name: "Cl\u00ednica Vida", sector: "Piantini", city: "Santo Domingo", specialties: "Plastic Surgery, Aesthetics", rating: "4.9", phone: "+1 809 555 0301", email: "info@clinicavida.com" },
    { name: "Centro M\u00e9dico Central", sector: "Gazcue", city: "Santo Domingo", specialties: "Bariatric, General Surgery", rating: "4.8", phone: "+1 809 555 0401", email: "info@centromedico.com" },
    { name: "Hospital del Este", sector: "San Pedro", city: "San Pedro de Macor\u00eds", specialties: "General Surgery, Bariatric", rating: "4.7", phone: "+1 809 555 0501", email: "info@hospitaleste.com" },
    { name: "Cl\u00ednica del Sol", sector: "Punta Cana", city: "La Altagracia", specialties: "Hair Restoration, Aesthetics", rating: "5.0", phone: "+1 809 555 0601", email: "info@clinicasol.com" },
    { name: "DentalPro", sector: "Naco", city: "Santo Domingo", specialties: "Dental, Maxillofacial", rating: "4.9", phone: "+1 809 555 0701", email: "info@dentalpro.com" }
  ] : [];
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
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 } },
            React.createElement("button", { onClick: () => setSelectedProvider(null), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)" } },
              React.createElement(Icon, { name: "arrowLeft", size: 13, color: "rgba(255,255,255,.7)" }), "Providers"
            ),
            React.createElement("button", { onClick: () => openEditModal("doctor", p), style: { ...s.btnPrimary, fontSize: 12, padding: "6px 14px" } }, "Edit Doctor")
          ),
          React.createElement("div", { style: { display: "flex", gap: 28, alignItems: "flex-end", paddingBottom: 32 } },
            p.photo_url ? React.createElement("img", { src: p.photo_url, style: { width: 110, height: 110, borderRadius: 16, objectFit: "cover", border: "3px solid rgba(255,255,255,.15)", flexShrink: 0 } }) :
            React.createElement("div", { style: { width: 110, height: 110, borderRadius: 16, background: T[700], border: "3px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", position: "relative" } },
              React.createElement("div", { style: { textAlign: "center" } },
                React.createElement("div", { style: { fontFamily: serif, fontSize: 38, fontWeight: 600, color: T[200] } }, (p.name.split(" ")[1] || "D")[0]),
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
    const allProviders = [
      ...PROVIDERS_TO_USE.map(p => ({ 
        ...p, _typeLabel: 'Doctor', _bgColor: T[800], _color: T[200], 
        _sub1: p.spec || p.specialty, _sub2: p.hosp || (Array.isArray(p.clinics)?p.clinics[0]:p.clinic), 
        _stat1: p.rating ? p.rating + " ★" : "New", _stat2: (p.cases || p.total_cases || 0) + " cases",
        _photoUrl: p.photo_url,
        _onClick: () => { setSelectedProvider(p); navTo("Doctors", "doctors"); } 
      })),
      ...CLINICS_TO_USE.map(c => ({ 
        ...c, _typeLabel: 'Clinic', _bgColor: T[100], _color: T[700], 
        _sub1: c.sector || c.city, _sub2: Array.isArray(c.specialties) ? c.specialties.join(", ") : c.specialties,
        _stat1: c.rating ? c.rating + " ★" : "New", _stat2: "Clinic",
        _photoUrl: c.photo_url,
        _onClick: () => { setSelectedClinic(c); navTo("Clinics", "clinics"); } 
      })),
      ...NURSES_TO_USE.map(n => ({ 
        ...n, _typeLabel: 'Nurse', _bgColor: T[700], _color: T[200], 
        _sub1: n.spec || n.specialty, _sub2: n.home,
        _stat1: n.rating ? n.rating + " ★" : "New", _stat2: (n.cases || 0) + " cases",
        _photoUrl: n.photo_url,
        _onClick: () => { setSelectedNurse(n); navTo("Nursing Staff", "nursing"); } 
      })),
      ...HOMES_TO_USE.map(h => ({ 
        ...h, _typeLabel: 'Recovery Home', _bgColor: G[200], _color: G[700], 
        _sub1: h.loc || h.address, _sub2: Array.isArray(h.amenities) ? h.amenities.join(", ") : h.amenities,
        _stat1: h.rating ? h.rating + " ★" : "New", _stat2: (h.beds || h.total_beds || 0) + " beds",
        _photoUrl: h.photo_url,
        _onClick: () => { setSelectedHome(h); navTo("Recovery Homes", "homes"); } 
      })),
      ...COORDS_TO_USE.map(c => ({ 
        ...c, _typeLabel: 'Coordinator', _bgColor: T[50], _color: T[700], 
        _sub1: c.email, _sub2: c.lang || c.languages,
        _stat1: c.rating ? c.rating + " ★" : "New", _stat2: (c.cases || 0) + " cases",
        _photoUrl: c.photo_url,
        _onClick: () => { setSelectedCoord(c); navTo("Coordinators", "coordinators"); } 
      }))
    ];
    const filteredProviders = allProviders.filter(p => (p.name||"").toLowerCase().includes(tableSearch.toLowerCase()));

    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Network Providers", subtitle: "Complete directory of medical partners and staff",
        actions: [
          React.createElement("button", { key: "c", onClick: () => setModal("clinic"), style: { ...s.btnGhost, fontSize: 13, padding: "9px 18px" } }, "+ Clinic"),
          React.createElement("button", { key: "d", onClick: () => setModal("doctor"), style: { ...s.btnGhost, fontSize: 13, padding: "9px 18px" } }, "+ Doctor"),
          React.createElement("button", { key: "n", onClick: () => setModal("nurse"), style: { ...s.btnGhost, fontSize: 13, padding: "9px 18px" } }, "+ Nurse"),
          React.createElement("button", { key: "h", onClick: () => setModal("home"), style: { ...s.btnGhost, fontSize: 13, padding: "9px 18px" } }, "+ Recovery Home"),
          React.createElement("button", { key: "co", onClick: () => setModal("coord"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 18px" } }, "+ Coordinator")
        ]
      }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(Stat, { label: "Total network", value: allProviders.length, color: T[700], icon: "network" }),
        React.createElement(Stat, { label: "Doctors & Clinics", value: PROVIDERS_TO_USE.length + CLINICS_TO_USE.length, color: T[500], icon: "stethoscope" }),
        React.createElement(Stat, { label: "Support staff", value: NURSES_TO_USE.length + COORDS_TO_USE.length, color: G[500], icon: "users" })
      ),
      React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("input", { value: tableSearch, onChange: e => setTableSearch(e.target.value), placeholder: "Search network...", style: { height: 38, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13, fontFamily: sans, outline: "none", color: G[900], width: "100%", maxWidth: 400 } })
      ),
      filteredProviders.map((p, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 18, marginBottom: 12, cursor: "pointer" },
        onClick: p._onClick,
        onMouseEnter: e => e.currentTarget.style.borderColor = T[300],
        onMouseLeave: e => e.currentTarget.style.borderColor = G[200]
      },
        React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: p._bgColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 18, fontWeight: 600, color: p._color, flexShrink: 0, overflow: "hidden" } }, 
          p._photoUrl ? React.createElement("img", { src: p._photoUrl, style: { width: "100%", height: "100%", objectFit: "cover" } }) :
          (p.name && p.name.includes(" ") ? p.name.split(" ")[1][0] : (p.name || "P")[0])
        ),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 2 } },
            React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, p.name),
            React.createElement("span", { style: { fontSize: 10, padding: "2px 8px", borderRadius: 10, background: G[100], color: G[600], fontWeight: 500 } }, p._typeLabel)
          ),
          React.createElement("div", { style: { fontSize: 12, color: G[500] } }, p._sub1, p._sub2 ? " \u00b7 " + p._sub2 : ""),
          p.cert && React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 3 } }, p.cert)
        ),
        React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, p._stat1),
          React.createElement("div", { style: { fontSize: 11, color: G[400] } }, p._stat2)
        ),
        React.createElement(Icon, { name: "arrowLeft", size: 14, color: G[300], style: { transform: "rotate(180deg)" } })
      ))
    );
  };

    const HOMES = isDemo ? [
    { name: "Villa Serena", loc: "Piantini, Santo Domingo", beds: 4, occ: 2, amenities: "Pool \xB7 Private nurse \xB7 Chef", rate: "$280/night", rating: "4.9", phone: "+1 809 555 1001", email: "info@villaserena.com", includes: "WiFi, 3 meals/day, AC, Pool, Transport", staff: "Shift nursing 12h + night guard", emergency: "Cl\u00ednica Vida" },
    { name: "Casa Brisa", loc: "Naco, Santo Domingo", beds: 6, occ: 4, amenities: "Pool \xB7 AC \xB7 On-call nurse", rate: "$220/night", rating: "4.8", phone: "+1 809 555 1002", email: "info@casabrisa.com", includes: "WiFi, Breakfast, AC, Pool", staff: "On-call nurse 24h", emergency: "Cl\u00ednica Vida" },
    { name: "Punta Suites", loc: "Punta Cana", beds: 8, occ: 3, amenities: "Medical staff 24/7 \xB7 Meals", rate: "$350/night", rating: "5.0", phone: "+1 809 555 1003", email: "info@puntasuites.com", includes: "WiFi, Full board, AC, Medical staff 24/7, Transport", staff: "Resident medical and nursing staff", emergency: "Cl\u00ednica del Este" },
    { name: "Residencial Sol", loc: "Gazcue, Santo Domingo", beds: 3, occ: 1, amenities: "Shared cook \xB7 Transport", rate: "$160/night", rating: "4.7", phone: "+1 809 555 1004", email: "info@residencialsol.com", includes: "WiFi, Shared cook, AC, Transport", staff: "Day assistant + basic night guard", emergency: "Cl\u00ednica Vida" }
  ] : [];
  // Use demo data if isDemoMode, otherwise use Supabase data
  const PROVIDERS_TO_USE = isDemoMode ? PROVIDERS : dbDoctores;
  const CLINICS_TO_USE = isDemoMode ? CLINICS : dbClinics;
  const NURSES_TO_USE = isDemoMode ? NURSES : dbNurses;
  const HOMES_TO_USE = isDemoMode ? HOMES : dbHomes;
  const COORDS_TO_USE = isDemoMode ? [] : dbCoords;
  // \u2500\u2500 HOME DETAIL SCREEN (full page) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  const ClinicDetailScreen = () => {
    const c = selectedClinic;
    if (!c) return null;
    const initials = (c.name || "Clinic").split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("") || "C";
    const photosArray = Array.isArray(c.photos) && c.photos.length > 0 ? c.photos : (c.photo_url ? [c.photo_url] : []);

    return React.createElement("div", { className: "dash-screen", style: { flex: 1, overflowY: "auto" } },
      React.createElement("div", { style: { background: T[950], padding: "32px 40px 0", position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize: "32px 32px" } }),
        React.createElement("div", { style: { position: "relative", zIndex: 1 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 } },
            React.createElement("button", { onClick: () => setSelectedClinic(null), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)" } },
              React.createElement(Icon, { name: "arrowLeft", size: 13, color: "rgba(255,255,255,.7)" }), "Clinics"
            ),
            React.createElement("button", { onClick: () => openEditModal("clinic", c), style: { ...s.btnPrimary, fontSize: 12, padding: "6px 14px" } }, "Edit Clinic")
          ),
          React.createElement("div", { style: { display: "flex", gap: 28, alignItems: "flex-end", paddingBottom: 32 } },
            c.photo_url ? React.createElement("img", { src: c.photo_url, style: { width: 110, height: 110, borderRadius: 16, objectFit: "cover", border: "3px solid rgba(255,255,255,.15)", flexShrink: 0 } }) :
            React.createElement("div", { style: { width: 110, height: 110, borderRadius: 16, background: T[700], border: "3px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", position: "relative" } },
              React.createElement("div", { style: { textAlign: "center" } },
                React.createElement("div", { style: { fontFamily: serif, fontSize: 38, fontWeight: 600, color: T[200] } }, initials),
                React.createElement("div", { style: { fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 2 } }, "Photo")
              )
            ),
            React.createElement("div", { style: { flex: 1, paddingBottom: 4 } },
              React.createElement("div", { style: { fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: T[300], marginBottom: 6 } }, "Clinic"),
              React.createElement("h1", { style: { fontFamily: serif, fontSize: 32, fontWeight: 600, color: "#fff", marginBottom: 6 } }, c.name),
              React.createElement("div", { style: { fontSize: 14, color: "rgba(255,255,255,.5)" } }, c.city || c.sector || "Location not provided"),
              React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 14, alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: T[300] } }, c.rating || "New", " \u2605"),
                React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "rgba(77,208,200,.15)", color: T[300], border: "1px solid rgba(77,208,200,.2)" } }, c.specialties || "General")
              )
            )
          )
        )
      ),
      React.createElement("div", { style: { padding: "32px 40px", maxWidth: 860 } },
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 } },
          React.createElement("div", { style: s.card }, React.createElement("div", { style: s.label }, "Address"), React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900], marginTop: 6 } }, c.address || "N/A")),
          React.createElement("div", { style: s.card }, React.createElement("div", { style: s.label }, "Sector/City"), React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900], marginTop: 6 } }, (c.sector ? c.sector + ", " : "") + (c.city || "N/A")))
        ),
        React.createElement("div", { style: { ...s.card, marginBottom: 20 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
            React.createElement("div", { style: s.label }, "Photos"),
            React.createElement("button", { onClick: () => openEditModal("clinic", c), style: { ...s.btnGhost, fontSize: 11, padding: "5px 12px" } }, "+ Add/Edit photos")
          ),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 } },
            photosArray.length > 0 ? photosArray.map((url, i) => React.createElement("img", { key: i, src: url, alt: "Clinic", style: { width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10, border: `1px solid ${G[200]}` } })) :
            [1,2,3,4].map(i => React.createElement("div", { key: i, style: { aspectRatio: "4/3", borderRadius: 10, background: G[100], border: `2px dashed ${G[200]}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6 }, onClick: () => openEditModal("clinic", c) }, React.createElement(Icon, { name: "document", size: 20, color: G[300] }), React.createElement("span", { style: { fontSize: 10, color: G[400] } }, "Add photo")))
          )
        ),
        React.createElement("div", { style: s.card },
          React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Contact information"),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
            [["Phone", c.phone], ["Email", c.email]].map(([k, v]) => React.createElement("div", { key: k }, React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: G[400], letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 } }, k), React.createElement("div", { style: { fontSize: 14, color: G[800] } }, v || "N/A")))
          )
        )
      )
    );
  };

  const ClinicsScreen = () => {
    if (selectedClinic) return React.createElement(ClinicDetailScreen, null);
    
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Clinics", subtitle: "Accredited clinics and hospitals in the network",
      actions: [React.createElement("button", { key: "add", onClick: () => setModal("clinic"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add clinic")]
    }),
    React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
      React.createElement(Stat, { label: "Total clinics", value: CLINICS_TO_USE.length, color: T[700], icon: "hospital" }),
      React.createElement(Stat, { label: "Avg. rating", value: "4.9", color: T[500], icon: "activity" }),
      React.createElement(Stat, { label: "Active procedures", value: "124", color: G[500], icon: "check" })
    ),
    CLINICS_TO_USE.map((c, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 16, marginBottom: 12, cursor: "pointer" },
      onClick: () => setSelectedClinic(c),
      onMouseEnter: e => e.currentTarget.style.borderColor = T[300],
      onMouseLeave: e => e.currentTarget.style.borderColor = G[200]
    },
      c.photo_url ? React.createElement("img", { src: c.photo_url, style: { width: 44, height: 44, borderRadius: 12, objectFit: "cover", flexShrink: 0 } }) :
      React.createElement("div", { style: { width: 44, height: 44, borderRadius: 12, background: T[100], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 16, fontWeight: 700, color: T[700], flexShrink: 0 } },
        (c.name || "Clinic").split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("") || "C"
      ),
      React.createElement("div", { style: { flex: 1 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, c.name),
        React.createElement("div", { style: { fontSize: 12, color: G[500], marginTop: 2 } }, c.sector, ", ", c.city),
        React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } }, c.specialties)
      ),
      React.createElement("div", { style: { textAlign: "right" } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, c.rating, " \u2605"),
        React.createElement("button", { onClick: (e) => { e.stopPropagation(); openEditModal("clinic", c); }, style: { ...s.btnGhost, marginTop: 4, padding: "4px 10px", fontSize: 11 } }, "Edit")
      )
    ))
  );
  };

  const DoctorsScreen = () => {
    if (selectedProvider) return React.createElement(ProviderDetailScreen, null);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Doctors", subtitle: "Board-certified surgeons in the Praesenti network",
        actions: [React.createElement("button", { key: "d", onClick: () => setModal("doctor"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 18px" } }, "+ Add doctor")]
      }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(Stat, { label: "Active doctors", value: PROVIDERS_TO_USE.length, color: T[700], icon: "userMd" }),
        React.createElement(Stat, { label: "Avg. rating", value: "4.86", color: T[500], icon: "activity" }),
        React.createElement(Stat, { label: "Cases this month", value: "12", color: G[500], icon: "users" })
      ),
      PROVIDERS_TO_USE.map((p, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 18, marginBottom: 12, cursor: "pointer" },
        onClick: () => setSelectedProvider(p),
        onMouseEnter: e => e.currentTarget.style.borderColor = T[300],
        onMouseLeave: e => e.currentTarget.style.borderColor = G[200]
      },
        React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: T[800], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 18, fontWeight: 600, color: T[200], flexShrink: 0, overflow: "hidden" } }, 
          p.photo_url ? React.createElement("img", { src: p.photo_url, style: { width: "100%", height: "100%", objectFit: "cover" } }) :
          p.name.split(" ")[1][0]
        ),
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
  const HomeDetailScreen = () => {
    const h = selectedHome;
    if (!h) return null;
    const photosArray = Array.isArray(h.photos) && h.photos.length > 0 ? h.photos : (h.photo_url ? [h.photo_url] : []);
    const occPct = Math.round((h.occ / h.beds) * 100);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, overflowY: "auto" } },
      // Hero
      React.createElement("div", { style: { background: T[950], padding: "32px 40px 0", position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize: "32px 32px" } }),
        React.createElement("div", { style: { position: "relative", zIndex: 1 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 } },
            React.createElement("button", { onClick: () => setSelectedHome(null), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)" } },
              React.createElement(Icon, { name: "arrowLeft", size: 13, color: "rgba(255,255,255,.7)" }), "Recovery Homes"
            ),
            React.createElement("button", { onClick: () => openEditModal("home", h), style: { ...s.btnPrimary, fontSize: 12, padding: "6px 14px" } }, "Edit Home")
          ),
          React.createElement("div", { style: { display: "flex", gap: 28, alignItems: "flex-end", paddingBottom: 32 } },
            h.photo_url ? React.createElement("img", { src: h.photo_url, style: { width: 110, height: 110, borderRadius: 16, objectFit: "cover", border: "3px solid rgba(255,255,255,.15)", flexShrink: 0 } }) :
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
            photosArray.length > 0 ? photosArray.map((url, i) => React.createElement("img", { key: i, src: url, alt: "Home", style: { width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10, border: `1px solid ${G[200]}` } })) :
            [1,2,3,4].map(i => React.createElement("div", { key: i, style: { aspectRatio: "4/3", borderRadius: 10, background: G[100], border: `2px dashed ${G[200]}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6 }, onClick: () => openEditModal("home", h) },
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
        actions: [React.createElement("button", { key: "add", onClick: () => setModal("home"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add home")]
      }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(Stat, { label: "Total homes", value: HOMES_TO_USE.length, color: T[700], icon: "home" }),
      React.createElement(Stat, { label: "Occupied beds", value: HOMES_TO_USE.reduce((a, h) => a + (h.occ || 0), 0), color: T[500], icon: "users" }),
      React.createElement(Stat, { label: "Available beds", value: HOMES_TO_USE.reduce((a, h) => a + ((h.beds || h.total_beds || 0) - (h.occ || 0)), 0), color: G[500], icon: "check" })
      ),
      React.createElement("div", { className: "grid-2", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
        HOMES_TO_USE.map((h, i) => React.createElement("div", { key: i, style: { ...s.card, cursor: "pointer" },
          onClick: () => setSelectedHome(h),
          onMouseEnter: e => e.currentTarget.style.borderColor = T[300],
          onMouseLeave: e => e.currentTarget.style.borderColor = G[200]
        },
          h.photo_url && React.createElement("img", { src: h.photo_url, style: { width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: 12 } }),
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

    const COORDS = isDemo ? [
    { name: "Laura Mendez", cases: 8, lang: "EN \xB7 ES", status: "Active", email: "laura@praesenti.com", rating: "4.9", phone: "+1 809 555 2001", joined: "Jan 2024", bio: "Senior care coordinator with expertise in plastic surgery cases. Fluent in English and Spanish." },
    { name: "Carlos Vega", cases: 5, lang: "EN \xB7 ES \xB7 PT", status: "Active", email: "carlos@praesenti.com", rating: "4.8", phone: "+1 809 555 2002", joined: "Mar 2024", bio: "Trilingual coordinator specializing in bariatric and reconstructive cases. Background in healthcare administration." },
    { name: "Nadia Bertrand", cases: 3, lang: "EN \xB7 FR", status: "Active", email: "nadia@praesenti.com", rating: "5.0", phone: "+1 809 555 2003", joined: "Jun 2024", bio: "French-English coordinator focused on European patient experience. Former medical tourism consultant in Paris." },
    { name: "Kevin Osei", cases: 0, lang: "EN", status: "On leave", email: "kevin@praesenti.com", rating: "4.7", phone: "+1 809 555 2004", joined: "Sep 2023", bio: "Experienced coordinator currently on scheduled leave. Returns Q2 2026." }
  ] : [];
  // \u2500\u2500 COORDINATOR DETAIL SCREEN (full page) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const CoordDetailScreen = () => {
    const coord = selectedCoord;
    if (!coord) return null;
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, overflowY: "auto" } },
      React.createElement("div", { style: { background: T[950], padding: "32px 40px 0", position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize: "32px 32px" } }),
        React.createElement("div", { style: { position: "relative", zIndex: 1 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 } },
            React.createElement("button", { onClick: () => setSelectedCoord(null), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)" } },
              React.createElement(Icon, { name: "arrowLeft", size: 13, color: "rgba(255,255,255,.7)" }), "Coordinators"
            ),
            React.createElement("button", { onClick: () => openEditModal("coord", coord), style: { ...s.btnPrimary, fontSize: 12, padding: "6px 14px" } }, "Edit Coordinator")
          ),
          React.createElement("div", { style: { display: "flex", gap: 28, alignItems: "flex-end", paddingBottom: 32 } },
            coord.photo_url ? React.createElement("img", { src: coord.photo_url, style: { width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,.15)", flexShrink: 0 } }) :
            React.createElement("div", { style: { width: 110, height: 110, borderRadius: "50%", background: T[700], border: "3px solid rgba(255,255,255,.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              React.createElement("div", { style: { fontFamily: serif, fontSize: 38, fontWeight: 600, color: T[200] } }, coord.name[0] || "C"),
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

  const NursingStaffScreen = () => {
    if (selectedNurse) return React.createElement("div", { className: "dash-screen", style: { flex: 1, overflowY: "auto" } },
      React.createElement("div", { style: { background: T[950], padding: "32px 40px 0", position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize: "32px 32px" } }),
        React.createElement("div", { style: { position: "relative", zIndex: 1 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 } },
            React.createElement("button", { onClick: () => setSelectedNurse(null), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)" } },
              React.createElement(Icon, { name: "arrowLeft", size: 13, color: "rgba(255,255,255,.7)" }), "Nursing Staff"
            ),
            React.createElement("button", { onClick: () => openEditModal("nurse", selectedNurse), style: { ...s.btnPrimary, fontSize: 12, padding: "6px 14px" } }, "Edit Nurse")
          ),
          React.createElement("div", { style: { display: "flex", gap: 28, alignItems: "flex-end", paddingBottom: 32 } },
            selectedNurse.photo_url ? React.createElement("img", { src: selectedNurse.photo_url, style: { width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,.15)", flexShrink: 0 } }) :
            React.createElement("div", { style: { width: 110, height: 110, borderRadius: "50%", background: T[700], border: "3px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 38, fontWeight: 600, color: T[200], flexShrink: 0 } }, selectedNurse.name[0] || "N"),
            React.createElement("div", { style: { flex: 1, paddingBottom: 4 } },
              React.createElement("div", { style: { fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: T[300], marginBottom: 6 } }, selectedNurse.spec),
              React.createElement("h1", { style: { fontFamily: serif, fontSize: 32, fontWeight: 600, color: "#fff", marginBottom: 6 } }, selectedNurse.name),
              React.createElement("div", { style: { fontSize: 14, color: "rgba(255,255,255,.5)" } }, "License: " + selectedNurse.license),
              React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 14, alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: T[300] } }, selectedNurse.rating, " ★"),
                React.createElement("span", { style: { fontSize: 12, color: "rgba(255,255,255,.35)" } }, selectedNurse.cases + " active cases"),
                React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "rgba(77,208,200,.15)", color: T[300], border: "1px solid rgba(77,208,200,.2)" } }, selectedNurse.cert)
              )
            )
          )
        )
      ),
      React.createElement("div", { style: { padding: "32px 40px", maxWidth: 860 } },
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 } },
          [["Active cases", selectedNurse.cases], ["Rating", selectedNurse.rating + " ★"], ["Languages", selectedNurse.langs], ["Recovery home", selectedNurse.home]].map(([k, v]) =>
            React.createElement("div", { key: k, style: { ...s.card, marginBottom: 0 } },
              React.createElement("div", { style: s.label }, k),
              React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900], marginTop: 6 } }, v)
            )
          )
        ),
        React.createElement("div", { style: { ...s.card } },
          React.createElement("div", { style: { ...s.label, marginBottom: 12 } }, "Professional profile"),
          React.createElement("p", { style: { fontSize: 14, color: G[600], lineHeight: 1.8 } }, selectedNurse.bio),
          React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 } },
            selectedNurse.cert.split(" · ").map(c => React.createElement("span", { key: c, style: { fontSize: 11, padding: "3px 10px", background: T[50], border: "1px solid " + T[100], borderRadius: 10, color: T[700], fontWeight: 500 } }, c))
          )
        )
      )
    );
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Nursing Staff", subtitle: "Registered nurses and clinical specialists",
        actions: [React.createElement("button", { key: "add", onClick: () => setModal("nurse"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add nurse")]
      }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(Stat, { label: "Active nurses", value: NURSES_TO_USE.length, color: T[700], icon: "heart" }),
        React.createElement(Stat, { label: "Avg. rating", value: "4.8", color: T[500], icon: "activity" }),
        React.createElement(Stat, { label: "Active patient cases", value: NURSES_TO_USE.reduce((a, n) => a + (n.cases || 0), 0), color: G[500], icon: "users" })
      ),
      NURSES_TO_USE.map((n, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 18, marginBottom: 12, cursor: "pointer" },
        onClick: () => setSelectedNurse(n),
        onMouseEnter: e => e.currentTarget.style.borderColor = T[300],
        onMouseLeave: e => e.currentTarget.style.borderColor = G[200]
      },
        React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: T[700], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 18, fontWeight: 600, color: T[200], flexShrink: 0, overflow: "hidden" } }, 
          n.photo_url ? React.createElement("img", { src: n.photo_url, style: { width: "100%", height: "100%", objectFit: "cover" } }) :
          (n.name || "N")[0]
        ),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, n.name),
          React.createElement("div", { style: { fontSize: 12, color: G[500], marginTop: 2 } }, n.spec, " · ", n.home),
          React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 3 } }, n.cert)
        ),
        React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, n.rating, " ★"),
          React.createElement("div", { style: { fontSize: 11, color: G[400] } }, n.cases, " cases")
        ),
        React.createElement(Icon, { name: "arrowLeft", size: 14, color: G[300], style: { transform: "rotate(180deg)" } })
      ))
    );
  };

  const CoordinatorsScreen = () => {
    if (selectedCoord) return React.createElement(CoordDetailScreen, null);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Coordinators", subtitle: "Patient care coordination team",
        actions: [React.createElement("button", { key: "add", onClick: () => setModal("coord"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add coordinator")]
      }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(Stat, { label: "Active coordinators", value: COORDS_TO_USE.filter(c => c.status === "Active").length, color: T[700], icon: "users" }),
        React.createElement(Stat, { label: "Total active cases", value: COORDS_TO_USE.reduce((a, c) => a + (c.cases || 0), 0), color: T[500], icon: "clipboard" }),
        React.createElement(Stat, { label: "Languages covered", value: "4", color: G[500], icon: "globe" })
      ),
      COORDS_TO_USE.map((coord, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 16, marginBottom: 12, cursor: "pointer" },
        onClick: () => setSelectedCoord(coord),
        onMouseEnter: e => e.currentTarget.style.borderColor = T[300],
        onMouseLeave: e => e.currentTarget.style.borderColor = G[200]
      },
        React.createElement("div", { style: { width: 42, height: 42, borderRadius: "50%", background: T[100], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 17, fontWeight: 600, color: T[700], flexShrink: 0, overflow: "hidden" } }, 
          coord.photo_url ? React.createElement("img", { src: coord.photo_url, style: { width: "100%", height: "100%", objectFit: "cover" } }) :
          (coord.name || "C")[0]
        ),
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

    const FIN_PAYMENTS = isDemo ? [
    { date: "Mar 20", patient: "Emily Thornton", desc: "Rhinoplasty", amount: "$4,200", status: "Settled", method: "Escrow" },
    { date: "Mar 20", patient: "Sofia Mart\u00ednez", desc: "Breast Augmentation", amount: "$5,500", status: "Settled", method: "Escrow" },
    { date: "Mar 25", patient: "Marcus Webb", desc: "Liposuction deposit", amount: "$2,040", status: "Held", method: "Escrow" },
    { date: "Apr 02", patient: "Marcus Webb", desc: "Liposuction balance", amount: "$4,760", status: "Pending", method: "\u2014" },
    { date: "Apr 09", patient: "Hanna Bergstr\u00f6m", desc: "Tummy Tuck deposit", amount: "$2,160", status: "Pending", method: "\u2014" }
  ] : [];
  const FinancePaymentsScreen = () => {
    const paymentsList = isDemoMode ? FIN_PAYMENTS : dbPayments;
    const settledAmount = paymentsList.filter(p => p.status === "Settled").reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, "") || 0), 0);
    const pendingAmount = paymentsList.filter(p => p.status === "Pending").reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, "") || 0), 0);

    return /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement(PanelHeader, { title: "Payments", subtitle: "All patient transactions across active cases" }), /* @__PURE__ */ React.createElement("div", { className: "grid-4", style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 } }, /* @__PURE__ */ React.createElement(Stat, { label: "Settled this month", value: `$${settledAmount.toLocaleString()}`, color: T[700], icon: "check" }), /* @__PURE__ */ React.createElement(Stat, { label: "Held in escrow", value: "$0", color: "#b45309", icon: "lock" }), /* @__PURE__ */ React.createElement(Stat, { label: "Pending", value: `$${pendingAmount.toLocaleString()}`, color: G[500], icon: "calendar" }), /* @__PURE__ */ React.createElement(Stat, { label: "Total pipeline", value: `$${(settledAmount + pendingAmount).toLocaleString()}`, color: T[500], icon: "trendingUp" })), /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Transaction log"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, ["Date", "Patient", "Description", "Method", "Amount", "Status"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: { ...s.label, textAlign: "left", paddingBottom: 10, borderBottom: `1px solid ${G[200]}` } }, h)))), /* @__PURE__ */ React.createElement("tbody", null, paymentsList.map((p, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: `1px solid ${G[100]}` } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 0", color: G[400], fontSize: 11 } }, p.date), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", fontWeight: 500 } }, p.patient), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", color: G[600] } }, p.desc), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", color: G[400] } }, p.method), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px", textAlign: "right", fontWeight: 600, color: T[700] } }, p.amount), /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 8px" } }, /* @__PURE__ */ React.createElement("span", {
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
  };
  const [escrowList, setEscrowList] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_escrow_real");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return isDemo ? [
      { patient: "Marcus Webb", proc: "Liposuction", held: "$2,040", total: "$6,800", release: "Apr 02", stage: "Pre-op", released: false },
      { patient: "Hanna Bergstr\u00f6m", proc: "Tummy Tuck", held: "$0", total: "$7,200", release: "Apr 09", stage: "Lead", released: false },
      { patient: "Rafael Oliveira", proc: "Hair Transplant", held: "$0", total: "$3,100", release: "Apr 18", stage: "Lead", released: false }
    ] : [];
  });
  useEffect(() => {
    if (!isDemo) localStorage.setItem("admin_escrow_real", JSON.stringify(escrowList));
  }, [escrowList, isDemo]);
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
  );
  const ReportsScreen = () => {
    const [period, setPeriod] = useState("Q1 2026");
    const totalRevenue = dbPayments.reduce((s,p) => s + parseInt(String(p.amount).replace(/[^0-9]/g, "")||0), 0);
    const METRICS = [
      { label: "Total revenue", value: isDemoMode ? "$52,400" : "$" + totalRevenue.toLocaleString(), change: "+18%", up: true },
      { label: "Patients registered", value: isDemoMode ? "14" : dbPacientes.length.toString(), change: "+4", up: true },
      { label: "Active cases", value: isDemoMode ? "12" : dbCases.length.toString(), change: "+2", up: true },
      { label: "Providers in network", value: isDemoMode ? "45" : (dbDoctores.length + dbClinics.length + dbHomes.length).toString(), change: "+5", up: true },
      { label: "Pending payments", value: isDemoMode ? "$6,920" : "$" + dbPayments.filter(p=>p.status==="Pending").reduce((s,p) => s + parseInt(String(p.amount).replace(/[^0-9]/g, "")||0), 0).toLocaleString(), change: "-$120", up: true },
      { label: "Incident rate", value: isDemoMode ? "14%" : (dbIncidents.length > 0 ? Math.round((dbIncidents.length / Math.max(dbCases.length, 1)) * 100) + "%" : "0%"), change: isDemoMode ? "+2%" : "0%", up: false }
    ];
    const REPORT_DATA = isDemoMode ? {
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
    } : {};
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
    
    if (!isDemo) return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Reports"),
      React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Operational and financial reports by period"),
      React.createElement("div", { style: { ...s.card, textAlign: "center", padding: "60px 20px" } },
        React.createElement(Icon, { name: "fileText", size: 32, color: G[300] }),
        React.createElement("h3", { style: { fontSize: 16, fontWeight: 600, color: G[900], marginTop: 14, marginBottom: 6 } }, "No reports available"),
        React.createElement("p", { style: { fontSize: 13.5, color: G[500], maxWidth: 300, margin: "0 auto" } }, "Once you have active patient cases, your monthly and quarterly reports will appear here.")
      )
    );

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

  const PATIENTS_DEMO = isDemoMode ? [
    { paciente_id: "p1", nombre_completo: "Maria Vasquez", email: "maria@example.com", telefono: "+1 555 1234", pais_residencia: "USA", fecha_registro: "2026-01-15T10:00:00Z", activo: true, documento_verificado: true },
    { paciente_id: "p2", nombre_completo: "James Okafor", email: "james@example.com", telefono: "+44 7700 900077", pais_residencia: "UK", fecha_registro: "2026-02-20T14:30:00Z", activo: true, documento_verificado: false },
    { paciente_id: "p3", nombre_completo: "Sofia Mart\u00ednez", email: "sofia@example.com", telefono: "+1 416 555 0198", pais_residencia: "CA", fecha_registro: "2026-03-05T09:15:00Z", activo: true, documento_verificado: true },
    { paciente_id: "p4", nombre_completo: "Luca Ferreira", email: "luca@example.com", telefono: "+55 11 99999-9999", pais_residencia: "BR", fecha_registro: "2026-03-25T16:45:00Z", activo: true, documento_verificado: false }
  ] : [];

  const PATIENTS_TO_USE = isDemoMode ? PATIENTS_DEMO : dbPacientes;

  const PatientsScreen = () => {
    const validList = Array.isArray(PATIENTS_TO_USE) ? PATIENTS_TO_USE : [];
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Patients", subtitle: "Registered patients in the platform" }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(Stat, { label: "Total Patients", value: validList.length, color: T[700], icon: "users" }),
        React.createElement(Stat, { label: "Verified IDs", value: validList.filter(p => p && p.documento_verificado).length, color: T[500], icon: "check" }),
        React.createElement(Stat, { label: "Active", value: validList.filter(p => p && p.activo !== false).length, color: G[500], icon: "activity" })
      ),
      React.createElement("div", { style: s.card },
        React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } },
          React.createElement("thead", null, React.createElement("tr", { style: { textAlign: "left" } },
            ["Name", "Email", "Phone", "Country", "Registered", "Verified"].map(h => React.createElement("th", { key: h, style: { ...s.label, paddingBottom: 10, borderBottom: `1px solid ${G[200]}`, fontWeight: 600 } }, h))
          )),
          React.createElement("tbody", null,
            validList.map((p, i) => {
              if (!p) return null;
              return React.createElement("tr", { key: p.paciente_id || i, style: { borderBottom: `1px solid ${G[100]}` } },
                React.createElement("td", { style: { padding: "12px 8px", fontWeight: 500, color: G[900] } }, p.nombre_completo || "\u2014"),
                React.createElement("td", { style: { padding: "12px 8px", color: G[600] } }, p.email || "\u2014"),
                React.createElement("td", { style: { padding: "12px 8px", color: G[600] } }, p.telefono || "\u2014"),
                React.createElement("td", { style: { padding: "12px 8px", color: G[600] } }, p.pais_residencia || "\u2014"),
                React.createElement("td", { style: { padding: "12px 8px", color: G[500] } }, p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString() : "\u2014"),
                React.createElement("td", { style: { padding: "12px 8px" } }, 
                  React.createElement("span", { style: { fontSize: 11, padding: "2px 8px", borderRadius: 10, background: p.documento_verificado ? T[50] : G[100], color: p.documento_verificado ? T[700] : G[500], border: `1px solid ${p.documento_verificado ? T[100] : G[200]}` } }, p.documento_verificado ? "Verified" : "Unverified")
                )
              );
            })
          )
        )
      )
    );
  };

  const AdminSidebar = () => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "sidebar-overlay" + (sidebarOpen ? " open" : ""), onClick: () => setSidebarOpen(false) }), /* @__PURE__ */ React.createElement("div", { className: "app-sidebar" + (sidebarOpen ? " open" : ""), style: { background: T[950], width: 220, flexShrink: 0, padding: "22px 0", borderRight: "1px solid rgba(255,255,255,.06)" } }, ADMIN_GROUPS.map(([grp, items]) => /* @__PURE__ */ React.createElement("div", { key: grp }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,.2)", padding: "0 20px", marginBottom: 8, marginTop: 18, display: "block" } }, grp), items.map(([lbl, iconName, fn]) => /* @__PURE__ */ React.createElement("div", { key: lbl, onClick: () => { fn(); setSidebarOpen(false); }, style: { padding: "10px 20px", fontSize: 13, color: sidebarItem === lbl ? "#fff" : "rgba(255,255,255,.45)", cursor: "pointer", borderLeft: `2px solid ${sidebarItem === lbl ? T[400] : "transparent"}`, background: sidebarItem === lbl ? "rgba(255,255,255,.07)" : "transparent", display: "flex", alignItems: "center", gap: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 14, color: sidebarItem === lbl ? T[300] : "rgba(255,255,255,.3)" }), lbl))))));
  const AdminOverview = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: 28, color: T[950], marginBottom: 4 } }, "Operations Dashboard"), /* @__PURE__ */ React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })), /* @__PURE__ */ React.createElement("div", { className: "grid-4", style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 } }, [
    ["Active cases", String(ACTIVE_CASES.filter(c => (c.status||"").toLowerCase() !== "lead" && (c.status||"").toLowerCase() !== "completed").length), T[700], "users"],
    ["In recovery", String(ACTIVE_CASES.filter(c => (c.status||"").toLowerCase() === "recovery").length), T[500], "heart"],
    ["Pre-op", String(ACTIVE_CASES.filter(c => (c.status||"").toLowerCase() === "pre-op").length), "#92400e", "calendar"],
    ["New leads", String(ACTIVE_CASES.filter(c => (c.status||"").toLowerCase() === "lead").length), G[500], "trendingUp"]
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
  const DocsList = ({ docs }) => docs.length === 0
    ? React.createElement("div", { style: { textAlign: "center", padding: "40px 20px" } },
        React.createElement(Icon, { name: "document", size: 32, color: G[300] }),
        React.createElement("div", { style: { marginTop: 12, fontSize: 13, color: G[400] } }, "No documents uploaded yet")
      )
    : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
        docs.map((d, i) => {
          const isDemo = !d.url || d.url === "#";
          const ext = (d.name || "").split(".").pop().toUpperCase();
          const extColor = ext === "PDF" ? "#dc2626" : ext === "JPG" || ext === "PNG" ? T[600] : G[500];
          return React.createElement("div", { key: d.id || i, style: { display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: G[50], borderRadius: 8, border: `1px solid ${G[200]}` } },
            React.createElement("div", { style: { width: 40, height: 40, borderRadius: 8, background: "#fff", border: `1px solid ${G[200]}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, gap: 1 } },
              React.createElement(Icon, { name: "document", size: 14, color: extColor }),
              React.createElement("span", { style: { fontSize: 8, fontWeight: 700, color: extColor, letterSpacing: "0.05em" } }, ext)
            ),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.name),
              React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } },
                (d.size || "Unknown size") + (d.req_type ? " \u00b7 " + d.req_type : " \u00b7 Extra Document") + (d.created_at ? " \u00b7 " + new Date(d.created_at).toLocaleDateString() : "")
              )
            ),
            isDemo
              ? React.createElement("span", { style: { fontSize: 11, color: G[400], padding: "6px 12px", border: `1px solid ${G[200]}`, borderRadius: 6 } }, "Demo file")
              : React.createElement("a", {
                  href: d.url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  download: d.name,
                  style: { ...s.btnPrimary, fontSize: 11, padding: "6px 14px", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }
                },
                  React.createElement(Icon, { name: "download", size: 12, color: "#fff" }),
                  "Download"
                )
          );
        })
      );

  const AdminCaseDetail = () => {
    if (!selectedCase) return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32 } }, "No case selected");
    
    return React.createElement("div", { className: "case-detail-layout", style: { flex: 1, display: "flex", overflow: "hidden" } },
    React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 28, overflowY: "auto" } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 20 } },
        React.createElement("button", { onClick: () => navTo("Dashboard", "overview"), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6 } }, React.createElement(Icon, { name: "arrowLeft", size: 13, color: G[600] }), "Back"),
        React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950] } }, selectedCase.name),
        React.createElement(SPill, { status: selectedCase.status })
      ),
      React.createElement("div", { style: { ...s.card, marginBottom: 16 } },
        React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Case details"),
        React.createElement(IR, { k: "Case ID", v: selectedCase.id }),
        React.createElement(IR, { k: "Procedure", v: selectedCase.proc }),
        React.createElement(IR, { k: "Surgeon", v: selectedCase.surgeon }),
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${G[100]}` } },
          React.createElement("span", { style: { color: G[500], fontWeight: 300, fontSize: 13 } }, "Coordinator"),
          React.createElement("select", {
            value: selectedCase.coordinator || "\u2014 Unassigned \u2014",
            onChange: async (e) => {
              const val = e.target.value;
              setSelectedCase({ ...selectedCase, coordinator: val });
              if (!isDemoMode && selectedCase.caso_id_uuid) {
                 try {
                   const sUrl = SUPABASE_URL || window.SUPA_URL || window.VITE_SUPABASE_URL || "";
                   const sKey = SUPABASE_KEY || window.SUPA_KEY || window.VITE_SUPABASE_KEY || "";
                   const cId = dbCoords.find(c => c.name === val)?.id || null;
                   await fetch(`${sUrl}/rest/v1/caso?caso_id=eq.${selectedCase.caso_id_uuid}`, {
                     method: 'PATCH', headers: { 'Content-Type': 'application/json', apikey: sKey, Authorization: "Bearer " + (user.token || sKey) },
                     body: JSON.stringify({ coordinador_id: cId })
                   });
                 } catch(err) { console.error("Error assigning coord", err); }
              }
              showToast("Coordinator assigned");
            },
            style: { padding: "4px 8px", borderRadius: 6, border: `1px solid ${G[200]}`, fontSize: 12, outline: "none", color: G[900], background: G[50], textAlign: "right", fontFamily: sans, cursor: "pointer" }
          },
          ["\u2014 Unassigned \u2014", ...(isDemoMode ? ["Laura Mendez", "Carlos Vega", "Nadia Bertrand", "Kevin Osei"] : dbCoords.map(c => c.name))].map(c => React.createElement("option", { key: c, value: c }, c))
          )
        ),
        React.createElement(IR, { k: "Budget", v: selectedCase.budget }),
        React.createElement(IR, { k: "Country", v: selectedCase.country }),
        React.createElement(IR, { k: "Surgery date", v: selectedCase.date })
      ),
      // Tabs
      React.createElement("div", { style: { display: "flex", gap: 20, borderBottom: `1px solid ${G[200]}`, marginBottom: 20 } },
        [["journey", "Journey"], ["checklist", "Checklist"], ["documents", "Documents"]].map(([k, lbl]) =>
          React.createElement("button", { key: k, onClick: () => setAdminCaseTab(k), style: { padding: "0 4px 12px", fontSize: 13.5, fontWeight: 500, color: adminCaseTab === k ? T[700] : G[500], borderBottom: `2.5px solid ${adminCaseTab === k ? T[500] : "transparent"}`, background: "none", border: "none", borderBottom: `2.5px solid ${adminCaseTab === k ? T[500] : "transparent"}`, cursor: "pointer" } }, lbl)
        )
      ),
      adminCaseTab === "journey" && React.createElement("div", { style: s.card },
        React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Journey timeline"),
        JOURNEY_STEPS.map((step, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderBottom: i < JOURNEY_STEPS.length - 1 ? `1px solid ${G[100]}` : "none" } },
          React.createElement("div", { style: { width: 20, height: 20, borderRadius: "50%", background: step.done ? T[500] : G[200], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
            step.done && React.createElement(Icon, { name: "check", size: 10, color: "#fff" })
          ),
          React.createElement("div", { style: { flex: 1, fontSize: 13, color: step.done ? G[900] : G[400] } }, step.label),
      React.createElement("div", { style: { fontSize: 11, color: G[400] } }, isDemoMode ? step.date : "\u2014")
        ))
      ),
      adminCaseTab === "checklist" && React.createElement("div", { style: s.card },
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
      ),
      adminCaseTab === "documents" && React.createElement("div", { style: s.card },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
          React.createElement("div", { style: s.label }, "Patient documents"),
          React.createElement("span", { style: { fontSize: 12, color: G[400] } }, adminDocs.length + " file" + (adminDocs.length !== 1 ? "s" : ""))
        ),
        DocsList({ docs: adminDocs })
      )
    ),
    React.createElement("div", { className: "case-notes-panel", style: { width: 300, borderLeft: `1px solid ${G[200]}`, padding: 20, background: "#fff", flexShrink: 0, display: "flex", flexDirection: "column" } },
      React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Internal notes"),
      React.createElement("textarea", { value: noteInput, onChange: (e) => setNoteInput(e.target.value), placeholder: "Add a note...", rows: 4, style: { width: "100%", border: `1px solid ${G[200]}`, borderRadius: 8, padding: 12, fontSize: 13, fontFamily: sans, outline: "none", resize: "none", color: G[900], marginBottom: 10 } }),
      React.createElement("button", { onClick: saveNote, style: { ...s.btnPrimary, width: "100%", padding: "10px 0", fontSize: 13 } }, "Save note"),
      React.createElement("div", { style: { marginTop: 20, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" } },
        NOTES_TO_USE.map((n, i) => React.createElement("div", { key: n.id || i, style: { padding: "12px 14px", background: G[50], borderRadius: 8, border: `1px solid ${G[200]}` } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } },
            React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: T[600] } }, n.author),
            React.createElement("span", { style: { fontSize: 10, color: G[400] } }, n.date || (n.created_at ? new Date(n.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : ""))
          ),
          React.createElement("p", { style: { fontSize: 12.5, color: G[700], lineHeight: 1.6 } }, n.text)
        ))
      )
    )
  );
  };
  // ─── INLINE ADD MODAL ──────────────────────────────────────────────
  const FLbl = ({ t, req }) => React.createElement("label", { style:{ display:"block", fontSize:12, fontWeight:500, color:G[700], marginBottom:5 } }, t, req && React.createElement("span", { style:{ color:"#dc2626", marginLeft:2 } }, "*"));
  const FInput = ({ val, onChange, ph, type="text", err }) => React.createElement("input", { type, value:val, onChange, placeholder:ph, style:{ width:"100%", height:40, border:`1px solid ${err?"#fca5a5":G[200]}`, borderRadius:7, padding:"0 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900] } });
  const FTextarea = ({ val, onChange, ph, rows=3 }) => React.createElement("textarea", { value:val, onChange, placeholder:ph, rows, style:{ width:"100%", border:`1px solid ${G[200]}`, borderRadius:7, padding:"10px 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900], resize:"vertical" } });
  const FSelect = ({ val, onChange, options }) => React.createElement("select", { value:val, onChange, style:{ width:"100%", height:40, border:`1px solid ${G[200]}`, borderRadius:7, padding:"0 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900], background:"#fff" } }, options.map(o => React.createElement("option", { key:o, value:o }, o)));
  const FSec = ({ title }) => React.createElement("div", { style:{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T[500], marginTop:24, marginBottom:12, paddingBottom:8, borderBottom:`1px solid ${G[100]}` } }, title);
  const FRow = ({ children, cols=2 }) => React.createElement("div", { style:{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:14, marginBottom:14 } }, children);
  const FField = ({ label, req, children }) => React.createElement("div", null, React.createElement(FLbl, { t:label, req }), children);
  const LANG_OPTS = ["Espa\u00f1ol","Ingl\u00e9s","Portugu\u00e9s","Franc\u00e9s","Italiano","Alem\u00e1n"];
  const SPEC_OPTS_CLINIC = ["Cirug\u00eda pl\u00e1stica","Cirug\u00eda bari\u00e1trica","Odontolog\u00eda est\u00e9tica","Trasplante capilar","Ortopedia","Medicina general","Oftalmolog\u00eda"];
  const SPEC_OPTS_DOC = ["Cirug\u00eda pl\u00e1stica","Cirug\u00eda bari\u00e1trica","Odontolog\u00eda est\u00e9tica","Trasplante capilar","Anestesiolog\u00eda","Medicina interna","Ortopedia"];

  const AddModal = () => {
    const [form, setForm] = React.useState(() => {
      if (editItem) {
        const isCoord = modal === "coord";
        let fn = "", ln = "";
        if (isCoord && editItem.name) {
          const parts = editItem.name.split(" ");
          fn = parts[0] || "";
          ln = parts.slice(1).join(" ") || "";
        }
        return { 
          ...editItem, 
          fn: fn || editItem.fn || "", 
          ln: ln || editItem.ln || "",
          exp: editItem.experience || editItem.experience_years || "",
          beds: editItem.beds || editItem.total_beds || ""
        };
      }
      return {};
    });
    const [langs, setLangs] = React.useState(() => {
      if (editItem) {
        const l = editItem.languages || editItem.langs || "";
        return Array.isArray(l) ? l : typeof l === "string" ? l.split(",").map(x=>x.trim()) : [];
      }
      return [];
    });
    const [specs, setSpecs] = React.useState(() => {
      if (editItem) {
        const s = editItem.procedures || editItem.specialties || editItem.certifications || editItem.cert || "";
        return Array.isArray(s) ? s : typeof s === "string" ? s.split(",").map(x=>x.trim()) : [];
      }
      return [];
    });
    const [photoFile, setPhotoFile] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [err, setErr] = React.useState({});
    const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErr(ex => ({ ...ex, [k]: false })); };
    const toggleLang = v => setLangs(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
    const toggleSpec = v => setSpecs(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
    const sUrl = SUPABASE_URL || window.SUPA_URL || window.VITE_SUPABASE_URL || "";
    const sKey = SUPABASE_KEY || window.SUPA_KEY || window.VITE_SUPABASE_KEY || "";
    const isMultiPhoto = modal === "clinic" || modal === "home";
    const PhotoField = () => React.createElement(FField, { label: isMultiPhoto ? "Photos (Select multiple)" : "Profile Photo" },
      React.createElement("input", { 
        type: "file", accept: "image/*", multiple: isMultiPhoto, 
        onChange: (e) => {
          if (isMultiPhoto) setPhotoFile(Array.from(e.target.files));
          else setPhotoFile(e.target.files[0]);
        }, 
        style: { width: "100%", fontSize: 12, marginTop: 4 } 
      })
    );

    const handleSave = async () => {
      const required = modal === "coord" ? ["fn","ln","email"] : modal === "doctor" ? ["name","license","specialty"] : modal === "nurse" ? ["name","license","specialty"] : ["name","city","phone"];
      const newErr = {};
      required.forEach(k => { if (!(form[k]||"").trim()) newErr[k] = true; });
      if (Object.keys(newErr).length) { setErr(newErr); return; }
      setSaving(true);
      try {
        let finalPhotoUrl = editItem?.photo_url || null;
        let finalPhotosArray = editItem?.photos || [];

        if (photoFile) {
          if (Array.isArray(photoFile)) {
            const urls = await Promise.all(photoFile.map(file => new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(file);
            })));
            finalPhotosArray = [...finalPhotosArray, ...urls];
            finalPhotoUrl = finalPhotosArray[0];
          } else {
            finalPhotoUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(photoFile);
            });
            finalPhotosArray = [finalPhotoUrl];
          }
        }

        if (sUrl && sKey) {
          const h = { "Content-Type":"application/json", apikey: sKey, Authorization: "Bearer " + (user.token || sKey), Prefer: "return=representation" };
          const method = editItem ? "PATCH" : "POST";
          const qs = editItem ? `?id=eq.${editItem.id}` : "";

          if (modal === "clinic") {
            const body = { name:form.name, address:form.address||"", sector:form.sector||"", city:form.city, phone:form.phone, email:form.email||"", specialties:specs.join(", "), languages:langs.join(", ") };
            if (finalPhotoUrl) { body.photo_url = finalPhotoUrl; body.photos = finalPhotosArray; }
            const r = await fetch(sUrl + "/rest/v1/clinicas" + qs, { method, headers:h, body: JSON.stringify(body) }).then(x=>x.json());
            if (r && r[0]) {
              if (editItem) { setDbClinics(p => p.map(x => x.id === editItem.id ? r[0] : x)); }
              else setDbClinics(p => [...p, r[0]]);
            }
          }
          else if (modal === "doctor") {
            const body = { name:form.name, specialty:form.specialty, subspecialty:form.subspecialty||"", license:form.license, experience:parseInt(form.exp)||0, bio:form.bio||"", languages:langs, clinics:[], procedures:specs };
            if (!editItem) { body.rating = "New"; body.cases = 0; }
            if (finalPhotoUrl) body.photo_url = finalPhotoUrl;
            const r = await fetch(sUrl + "/rest/v1/doctores" + qs, { method, headers:h, body: JSON.stringify(body) }).then(x=>x.json());
            if (r && r[0]) {
              if (editItem) { setDbDoctores(p => p.map(x => x.id === editItem.id ? r[0] : x)); if (selectedProvider?.id === editItem.id) setSelectedProvider(r[0]); }
              else setDbDoctores(p => [...p, r[0]]);
            }
          }
          else if (modal === "home") {
            const body = { name:form.name, address:form.address||"", sector:form.sector||"", city:form.city, phone:form.phone, email:form.email||"", total_beds:parseInt(form.beds)||0, rate_per_night:form.rate||"", staff_model:form.staff||"", emergency_clinic:form.emergency_clinic||"", languages:langs.join(", ") };
            if (finalPhotoUrl) { body.photo_url = finalPhotoUrl; body.photos = finalPhotosArray; }
            const r = await fetch(sUrl + "/rest/v1/recovery_homes" + qs, { method, headers:h, body: JSON.stringify(body) }).then(x=>x.json());
            if (r && r[0]) {
              if (editItem) { setDbHomes(p => p.map(x => x.id === editItem.id ? r[0] : x)); if (selectedHome?.id === editItem.id) setSelectedHome(r[0]); }
              else setDbHomes(p => [...p, r[0]]);
            }
          }
          else if (modal === "nurse") {
            const body = { name:form.name, license:form.license, specialty:form.specialty, home:form.home||"", phone:form.phone||"", experience:parseInt(form.exp)||0, bio:form.bio||"", languages:langs.join(", ")||"EN", certifications:specs.join(", ") };
            if (!editItem) { body.rating = "New"; body.cases = 0; }
            if (finalPhotoUrl) body.photo_url = finalPhotoUrl;
            const r = await fetch(sUrl + "/rest/v1/nurses" + qs, { method, headers:h, body: JSON.stringify(body) }).then(x=>x.json());
            if (r && r[0]) {
              if (editItem) { setDbNurses(p => p.map(x => x.id === editItem.id ? r[0] : x)); if (selectedNurse?.id === editItem.id) setSelectedNurse(r[0]); }
              else setDbNurses(p => [...p, r[0]]);
            }
          }
          else if (modal === "coord") {
            const body = { name:`${form.fn} ${form.ln}`.trim(), email:form.email, phone:form.phone||"", languages:langs.join(" · ")||"EN" };
            if (!editItem) { body.status = "Active"; body.cases = 0; }
            if (finalPhotoUrl) body.photo_url = finalPhotoUrl;
            const r = await fetch(sUrl + "/rest/v1/coordinadores" + qs, { method, headers:h, body: JSON.stringify(body) }).then(x=>x.json());
            if (r && r[0]) {
              if (editItem) { setDbCoords(p => p.map(x => x.id === editItem.id ? r[0] : x)); if (selectedCoord?.id === editItem.id) setSelectedCoord(r[0]); }
              else setDbCoords(p => [...p, r[0]]);
            }
          }
        }
        showToast("Saved successfully");
        closeModal();
        if (modal === "nurse") setSelectedNurse(null);
      } catch(e) { showToast("Error saving. Please try again."); }
      setSaving(false);
    };

    const titles = { clinic: editItem ? "Edit Clinic" : "Add Clinic", doctor: editItem ? "Edit Doctor" : "Add Doctor", home: editItem ? "Edit Recovery Home" : "Add Recovery Home", nurse: editItem ? "Edit Nurse" : "Add Nurse", coord: editItem ? "Edit Coordinator" : "Add Coordinator" };

    const BodyClinic = () => React.createElement(React.Fragment, null,
      React.createElement(FSec, { title:"Identification" }),
      PhotoField(),
      React.createElement(FRow, null, React.createElement(FField, { label:"Name", req:true }, React.createElement(FInput, { val:form.name||"", onChange:set("name"), ph:"Cl\u00ednica Vida", err:err.name })), React.createElement(FField, { label:"Certifications" }, React.createElement(FInput, { val:form.cert||"", onChange:set("cert"), ph:"JCI, ABPS" }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"Address" }, React.createElement(FInput, { val:form.address||"", onChange:set("address"), ph:"Av. Principal 123" })), React.createElement(FField, { label:"Sector" }, React.createElement(FInput, { val:form.sector||"", onChange:set("sector"), ph:"Piantini" }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"City", req:true }, React.createElement(FInput, { val:form.city||"", onChange:set("city"), ph:"Santo Domingo", err:err.city })), React.createElement(FField, { label:"Phone", req:true }, React.createElement(FInput, { val:form.phone||"", onChange:set("phone"), ph:"+1 809 000 0000", err:err.phone }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"Email" }, React.createElement(FInput, { val:form.email||"", onChange:set("email"), ph:"info@clinica.com", type:"email" })), React.createElement(FField, { label:"Contact person" }, React.createElement(FInput, { val:form.contact||"", onChange:set("contact"), ph:"Full name" }))),
      React.createElement(FSec, { title:"Specialties" }),
      React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:14 } }, SPEC_OPTS_CLINIC.map(item => React.createElement("label", { key:item, style:{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:G[700], cursor:"pointer" } }, React.createElement("input", { type:"checkbox", checked:specs.includes(item), onChange:()=>toggleSpec(item), style:{ accentColor:T[500] } }), item))),
      React.createElement(FSec, { title:"Languages" }),
      React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 } }, LANG_OPTS.map(item => React.createElement("label", { key:item, style:{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:G[700], cursor:"pointer" } }, React.createElement("input", { type:"checkbox", checked:langs.includes(item), onChange:()=>toggleLang(item), style:{ accentColor:T[500] } }), item)))
    );

    const BodyDoctor = () => React.createElement(React.Fragment, null,
      React.createElement(FSec, { title:"Professional Info" }),
      PhotoField(),
      React.createElement(FRow, null, React.createElement(FField, { label:"Full name", req:true }, React.createElement(FInput, { val:form.name||"", onChange:set("name"), ph:"Dr. / Dra. Nombre Apellido", err:err.name })), React.createElement(FField, { label:"Medical license", req:true }, React.createElement(FInput, { val:form.license||"", onChange:set("license"), ph:"e.g. 123-45", err:err.license }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"Specialty", req:true }, React.createElement(FSelect, { val:form.specialty||"", onChange:set("specialty"), options:["\u2014 Select \u2014",...SPEC_OPTS_DOC] })), React.createElement(FField, { label:"Subspecialty" }, React.createElement(FInput, { val:form.subspecialty||"", onChange:set("subspecialty"), ph:"e.g. Facial aesthetics" }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"Years of experience" }, React.createElement(FInput, { val:form.exp||"", onChange:set("exp"), ph:"8", type:"number" })), React.createElement(FField, { label:"Main clinic" }, React.createElement(FInput, { val:form.clinic||"", onChange:set("clinic"), ph:"Clinic name" }))),
      React.createElement(FSec, { title:"Languages" }),
      React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 } }, LANG_OPTS.map(item => React.createElement("label", { key:item, style:{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:G[700], cursor:"pointer" } }, React.createElement("input", { type:"checkbox", checked:langs.includes(item), onChange:()=>toggleLang(item), style:{ accentColor:T[500] } }), item))),
      React.createElement(FSec, { title:"Bio" }),
      React.createElement(FTextarea, { val:form.bio||"", onChange:set("bio"), ph:"Brief professional biography visible to patients...", rows:3 })
    );

    const BodyHome = () => React.createElement(React.Fragment, null,
      React.createElement(FSec, { title:"Identification" }),
      PhotoField(),
      React.createElement(FRow, null, React.createElement(FField, { label:"Name", req:true }, React.createElement(FInput, { val:form.name||"", onChange:set("name"), ph:"Villa Serena", err:err.name })), React.createElement(FField, { label:"Manager" }, React.createElement(FInput, { val:form.manager||"", onChange:set("manager"), ph:"Full name" }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"Address" }, React.createElement(FInput, { val:form.address||"", onChange:set("address"), ph:"Street and number" })), React.createElement(FField, { label:"Sector" }, React.createElement(FInput, { val:form.sector||"", onChange:set("sector"), ph:"Piantini" }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"City", req:true }, React.createElement(FInput, { val:form.city||"", onChange:set("city"), ph:"Santo Domingo", err:err.city })), React.createElement(FField, { label:"Phone", req:true }, React.createElement(FInput, { val:form.phone||"", onChange:set("phone"), ph:"+1 809 000 0000", err:err.phone }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"Email" }, React.createElement(FInput, { val:form.email||"", onChange:set("email"), ph:"info@home.com", type:"email" })), React.createElement(FField, { label:"Rate per night" }, React.createElement(FInput, { val:form.rate||"", onChange:set("rate"), ph:"$200/night" }))),
      React.createElement(FRow, { cols:3 }, React.createElement(FField, { label:"Total beds" }, React.createElement(FInput, { val:form.beds||"", onChange:set("beds"), ph:"6", type:"number" })), React.createElement(FField, { label:"Staff model" }, React.createElement(FSelect, { val:form.staff||"Shift", onChange:set("staff"), options:["Shift","On-call","Resident","None"] })), React.createElement(FField, { label:"Emergency clinic" }, React.createElement(FInput, { val:form.emergency_clinic||"", onChange:set("emergency_clinic"), ph:"Cl\u00ednica Vida" })))
    );

    const BodyCoord = () => React.createElement(React.Fragment, null,
      React.createElement(FSec, { title:"Personal Information" }),
      PhotoField(),
      React.createElement(FRow, null, React.createElement(FField, { label:"First name", req:true }, React.createElement(FInput, { val:form.fn||"", onChange:set("fn"), ph:"Ana", err:err.fn })), React.createElement(FField, { label:"Last name", req:true }, React.createElement(FInput, { val:form.ln||"", onChange:set("ln"), ph:"Rodriguez", err:err.ln }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"Email", req:true }, React.createElement(FInput, { val:form.email||"", onChange:set("email"), ph:"ana@praesenti.com", type:"email", err:err.email })), React.createElement(FField, { label:"Phone" }, React.createElement(FInput, { val:form.phone||"", onChange:set("phone"), ph:"+1 809 555 0123" }))),
      React.createElement(FSec, { title:"Languages" }),
      React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 } }, LANG_OPTS.map(item => React.createElement("label", { key:item, style:{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:G[700], cursor:"pointer" } }, React.createElement("input", { type:"checkbox", checked:langs.includes(item), onChange:()=>toggleLang(item), style:{ accentColor:T[500] } }), item)))
    );

    const BodyNurse = () => React.createElement(React.Fragment, null,
      React.createElement(FSec, { title:"Professional Info" }),
      PhotoField(),
      React.createElement(FRow, null, React.createElement(FField, { label:"Full name", req:true }, React.createElement(FInput, { val:form.name||"", onChange:set("name"), ph:"Ana Reyes", err:err.name })), React.createElement(FField, { label:"License", req:true }, React.createElement(FInput, { val:form.license||"", onChange:set("license"), ph:"RN-8821", err:err.license }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"Specialization", req:true }, React.createElement(FSelect, { val:form.specialty||"", onChange:set("specialty"), options:["\u2014 Select \u2014","Post-op Care","Wound Care","ICU & Critical Care","General Nursing","Pediatrics"] })), React.createElement(FField, { label:"Years of experience" }, React.createElement(FInput, { val:form.exp||"", onChange:set("exp"), ph:"8", type:"number" }))),
      React.createElement(FRow, null, React.createElement(FField, { label:"Assigned Recovery Home" }, React.createElement(FSelect, { val:form.home||"", onChange:set("home"), options:["\u2014 Not assigned \u2014","Villa Serena","Casa Brisa","Punta Suites","Residencial Sol"] })), React.createElement(FField, { label:"Phone" }, React.createElement(FInput, { val:form.phone||"", onChange:set("phone"), ph:"+1 809 555 0123" }))),
      React.createElement(FSec, { title:"Certifications" }),
      React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:14 } }, ["RN","BLS","ACLS","WOCN","CCRN","CEN"].map(item => React.createElement("label", { key:item, style:{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:G[700], cursor:"pointer" } }, React.createElement("input", { type:"checkbox", checked:specs.includes(item), onChange:()=>toggleSpec(item), style:{ accentColor:T[500] } }), item))),
      React.createElement(FSec, { title:"Languages" }),
      React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 } }, LANG_OPTS.map(item => React.createElement("label", { key:item, style:{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:G[700], cursor:"pointer" } }, React.createElement("input", { type:"checkbox", checked:langs.includes(item), onChange:()=>toggleLang(item), style:{ accentColor:T[500] } }), item))),
      React.createElement(FSec, { title:"Bio" }),
      React.createElement(FTextarea, { val:form.bio||"", onChange:set("bio"), ph:"Brief professional biography...", rows:3 })
    );

    return React.createElement(Modal, { open:modal, onClose:closeModal },
      React.createElement("div", { style:{ padding:"28px 28px 32px", minWidth:480 } },
        React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 } },
          React.createElement("h2", { style:{ fontFamily:serif, fontSize:22, color:T[950] } }, titles[modal]),
          React.createElement("button", { onClick:closeModal, style:{ background:"none", border:"none", cursor:"pointer", padding:4 } }, React.createElement(Icon, { name:"close", size:18, color:G[400] }))
        )
      ),
      React.createElement("div", { style:{ padding:"0 28px 28px", maxHeight:"70vh", overflowY:"auto" } },
        modal === "clinic" && BodyClinic(),
        modal === "doctor" && BodyDoctor(),
        modal === "home" && BodyHome(),
        modal === "nurse" && BodyNurse(),
        modal === "coord" && BodyCoord(),
        Object.keys(err).length > 0 && React.createElement("p", { style:{ fontSize:12.5, color:"#dc2626", marginTop:12 } }, "✕ Please fill in all required fields."),
        React.createElement("div", { style:{ display:"flex", gap:10, marginTop:24 } },
          React.createElement("button", { onClick:handleSave, disabled:saving, style:{ ...s.btnPrimary, padding:"11px 28px", fontSize:13, opacity:saving?0.7:1 } }, saving?"Saving…":"Save"),
          React.createElement("button", { onClick:closeModal, style:{ ...s.btnGhost, padding:"11px 20px", fontSize:13 } }, "Cancel")
        )
      )
    );
  };

  const NotifBell = () => React.createElement("div", { style: { position: "relative" } },
    notifOpen && React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 199 }, onClick: () => setNotifOpen(false) }),
    React.createElement("button", { onClick: () => setNotifOpen(o => !o), style: { background: "none", border: `1px solid ${G[200]}`, borderRadius: 8, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", zIndex: 200 } },
      React.createElement(Icon, { name: "alertCircle", size: 18, color: unreadCount > 0 ? T[600] : G[400] }),
      unreadCount > 0 && React.createElement("span", { style: { position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: T[500], color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" } }, unreadCount)
    ),
    notifOpen && React.createElement("div", { style: { position: "absolute", right: 0, top: 46, width: 320, background: "#fff", border: `1px solid ${G[200]}`, borderRadius: 12, zIndex: 200, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,.1)" } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${G[100]}` } },
        React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: G[900] } }, "Notifications"),
        unreadCount > 0 && React.createElement("button", { onClick: markAllRead, style: { fontSize: 11, color: T[600], background: "none", border: "none", cursor: "pointer", fontFamily: sans } }, "Mark all read")
      ),
      React.createElement("div", { style: { maxHeight: 320, overflowY: "auto" } },
        notifications.map(n => React.createElement("div", { key: n.id, onClick: () => { markRead(n.id); }, style: { display: "flex", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${G[100]}`, cursor: "pointer", background: n.read ? "#fff" : T[50] } },
          React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: n.read ? G[100] : T[100], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 } },
            React.createElement(Icon, { name: n.type || "activity", size: 14, color: n.read ? G[400] : T[600] })
          ),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: n.read ? 400 : 600, color: G[900], marginBottom: 2 } }, n.title),
            React.createElement("div", { style: { fontSize: 12, color: G[500], lineHeight: 1.5, marginBottom: 2 } }, n.body),
            React.createElement("div", { style: { fontSize: 11, color: G[400] } }, n.time)
          ),
          !n.read && React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: T[500], flexShrink: 0, marginTop: 6 } })
        ))
      )
    )
  );

  if (!user) {
    return React.createElement("div", { style: { padding: 32, color: "#666" } },
      React.createElement("p", null, "Admin data not available. Please log in again.")
    );
  }

  return React.createElement("div", { style: { fontFamily: sans, background: G[50], minHeight: "100vh" } },
    isLoadingMode && React.createElement("div", { style: { position: "absolute", inset: 0, background: G[50], display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } },
      React.createElement("div", { style: { color: T[600], fontFamily: sans } }, "Loading admin data...")
    ),
    toast && React.createElement(Toast, { msg: toast, onDone: () => setToast(null) }),
    modal && React.createElement(AddModal, null),
    React.createElement("div", { className: "dash-header", style: { height: 60, background: "#fff", borderBottom: `1px solid ${G[200]}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
        React.createElement("button", { className: "mobile-menu-btn", onClick: () => setSidebarOpen(o => !o), style: { background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" } }, React.createElement(HamburgerIcon, { color: "#374151" })),
        React.createElement("div", { style: { fontFamily: serif, fontSize: 19, fontWeight: 600, color: T[900], letterSpacing: "0.06em", textTransform: "uppercase" } }, "Praes", React.createElement("span", { style: { color: T[500] } }, "enti")),
        React.createElement("span", { className: "col-hide-xs", style: { fontSize: 11, fontWeight: 500, color: T[500], letterSpacing: "0.08em", textTransform: "uppercase", marginLeft: 6 } }, "Admin")
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16 } },
        React.createElement(NotifBell, null),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: G[700] } },
          React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T[700], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 14, fontWeight: 600, color: T[200] } }, "P"),
          React.createElement("span", { className: "col-hide-xs" }, "Admin")
        ),
        React.createElement("button", { onClick: onSignOut, style: { background: "none", border: `1px solid ${G[200]}`, color: G[500], padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: sans } }, "Sign out")
      )
    ),
    React.createElement("div", { style: { display: "flex", minHeight: "calc(100vh - 60px)", overflow: "hidden" } },
      AdminSidebar(),
      React.createElement("div", { className: "dash-layout-inner", style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" } },
        screen === "overview" && AdminOverview(),
        screen === "patients" && PatientsScreen(),
        screen === "case" && AdminCaseDetail(),
        screen === "pipeline" && PipelineScreen(),
        screen === "incidents" && IncidentsScreen(),
        screen === "providers" && ProvidersScreen(),
        screen === "nursing" && NursingStaffScreen(),
        screen === "clinics" && ClinicsScreen(),
        screen === "doctors" && DoctorsScreen(),
        screen === "homes" && HomesScreen(),
        screen === "coordinators" && CoordinatorsScreen(),
        screen === "finance-payments" && FinancePaymentsScreen(),
        screen === "escrow" && EscrowScreen(),
        screen === "reports" && React.createElement(ReportsScreen, null)
      )
    )
          );
        };
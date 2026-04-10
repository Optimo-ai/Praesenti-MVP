import { T, G, serif, sans, s, CASES, INIT_MSGS, JOURNEY_STEPS, DOCS, RECOVERY_CHECKS } from '../constants.js';
import { fetchChecklist, saveChecklist, fetchDocuments, uploadDocument, deleteDocument } from '../supabase.js';
import { HamburgerIcon, Icon, SPill, Toast, Modal, IR } from './shared.js';
import { Wizard } from './Wizard.js';
import { CheckoutModal } from './CheckoutModal.js';

const { React } = window;
const { useState, useRef, useEffect } = React;

// SUPA_URL/KEY read lazily inside async fetch functions

export const PatientDashboard = ({ onSignOut, user, autoWiz }) => {
  const firstName = (user == null ? void 0 : user.fn) || "";
  const lastName = (user == null ? void 0 : user.ln) || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Patient";
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "P";
  const isDemo = !!(user == null ? void 0 : user.isDemo);
  const isNewUser = !isDemo;
  const [screen, setScreen] = useState("overview");
  const [caseTab, setCaseTab] = useState("journey");
  const [msgs, setMsgs] = useState(INIT_MSGS);
  const [msgInput, setMsgInput] = useState("");
  const [sidebarItem, setSidebarItem] = useState("Overview");
  const [checkDone, setCheckDone] = useState(Array(RECOVERY_CHECKS.length).fill(false));
  const [myCaseId, setMyCaseId] = useState(null);
  const [docsList, setDocsList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [targetReqType, setTargetReqType] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchPatientCase = async () => {
      if (!user || user.isDemo) return;
      const SUPA_URL = window.VITE_SUPABASE_URL || window.SUPA_URL;
      const SUPA_KEY = window.VITE_SUPABASE_KEY || window.SUPA_KEY;
      if (!SUPA_URL) { console.warn("[CASE] No SUPA_URL"); return; }
      console.log("[CASE] Looking for case. user.id:", user.id);
      try {
        const pacRes = await fetch(`${SUPA_URL}/rest/v1/paciente?auth_user_id=eq.${user.id}&select=paciente_id`, {
          headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
        }).then(r => r.json());
        console.log("[CASE] paciente query result:", pacRes);
        if (!pacRes || pacRes.length === 0) { console.warn("[CASE] No paciente record found"); return; }
        if (pacRes.error) { console.error("[CASE] paciente query error:", pacRes.error); return; }
        
        const pid = pacRes[0].paciente_id;
        console.log("[CASE] found paciente_id:", pid);
        const casoRes = await fetch(`${SUPA_URL}/rest/v1/caso?paciente_id=eq.${pid}&select=caso_id`, {
          headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
        }).then(r => r.json());
        console.log("[CASE] caso query result:", casoRes);
        if (!casoRes || casoRes.length === 0) { console.warn("[CASE] No caso record found for paciente_id:", pid); return; }
        if (casoRes.error) { console.error("[CASE] caso query error:", casoRes.error); return; }
        
        setMyCaseId(casoRes[0].caso_id);
        console.log("[CASE] SET myCaseId:", casoRes[0].caso_id);
      } catch (e) {
        console.error("Error fetching patient case:", e);
      }
    };
    fetchPatientCase();
  }, [user]);

  useEffect(() => {
    const loadChecklist = async () => {
      if (myCaseId) {
        const data = await fetchChecklist(myCaseId);
        if (data && data.items) {
          setCheckDone(data.items);
        }
      }
    };
    loadChecklist();
    
    const loadDocs = async () => {
      // Get docs by case or user
      const docs = await fetchDocuments(myCaseId, user?.id);
      setDocsList(docs);
    };
    loadDocs();
  }, [myCaseId, user?.id]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    console.log("[DOC] File selected:", file?.name, "| myCaseId:", myCaseId, "| user:", JSON.stringify(user));
    if (!file) { console.warn("[DOC] No file selected"); return; }
    if (!myCaseId && !user?.id) { console.error("[DOC] No myCaseId or user.id"); showToast("Error: No user ID"); return; }
    setUploading(true);
    showToast("Uploading document...");
    const savedDoc = await uploadDocument(myCaseId, file, user?.id, targetReqType);
    console.log("[DOC] uploadDocument result:", savedDoc);
    if (savedDoc) {
      setDocsList(prev => [savedDoc, ...prev]);
      showToast("Document saved successfully");
    } else {
      showToast("Error uploading document");
    }
    setUploading(false);
    setTargetReqType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteDoc = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.name}"?`)) return;
    showToast("Deleting...");
    const ok = await deleteDocument(doc.id, doc.url, user?.id);
    if (ok) {
      setDocsList(prev => prev.filter(d => d.url !== doc.url));
      showToast("Document deleted");
    } else {
      showToast("Error deleting document");
    }
  };

  const [toast, setToast] = useState(null);
  const showToast = (msg) => setToast(msg);
  const [tcSlot, setTcSlot] = useState(null);
  const [tcBooked, setTcBooked] = useState(false);
  const [dashWizOpen, setDashWizOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [service, setService] = useState("Initial Consultation");

  const [patPayments, setPatPayments] = useState([]);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchPayments = async () => {
    if (!user || !user.id) return;
    const SUPA_URL = window.VITE_SUPABASE_URL || window.SUPA_URL;
    const SUPA_KEY = window.VITE_SUPABASE_KEY || window.SUPA_KEY;
    try {
      const pacRes = await fetch(SUPA_URL + '/rest/v1/paciente?auth_user_id=eq.' + user.id + '&select=paciente_id', {
        headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
      }).then(r => r.json());
      if (pacRes && pacRes[0]) {
        const pid = pacRes[0].paciente_id;
        const res = await fetch(SUPA_URL + '/rest/v1/pago?caso(paciente_id)=eq.' + pid + '&select=*,caso(*)', {
          headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
        }).then(r => r.json());
        if (res && !res.error) {
          const mapped = res.map(p => ({
            pago_id: p.pago_id,
            date: p.fecha_creacion ? p.fecha_creacion.substring(0, 10) : "N/A",
            desc: p.notas || "Procedimiento",
            amount: p.deposito_pagado ? p.monto_total_usd : p.deposito_usd,
            status: p.estado_pago === "pendiente" ? "Pending" : "Paid",
            method: p.deposito_pagado ? "Visa ...4242" : "\u2014"
          }));
          setPatPayments(mapped.length > 0 ? mapped : PAT_PAYMENTS);
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPayments(); }, [user]);
  useEffect(() => { if (autoWiz) setDashWizOpen(true); }, [autoWiz]);
  const msgBodyRef = useRef(null);
  useEffect(() => { if (msgBodyRef.current) msgBodyRef.current.scrollTop = msgBodyRef.current.scrollHeight; }, [msgs]);
  const sendMsg = () => {
    if (!msgInput.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMsgs((m) => [...m, { side: "me", text: msgInput.trim(), time, date: "Today" }]);
    setMsgInput("");
    setTimeout(() => setMsgs((m) => [...m, { side: "them", text: "Got it! I'll get back to you shortly.", time, date: "Today" }]), 1200);
  };
  const navTo = (item, scr, tab) => {
    const newScr = scr || "overview";
    setSidebarItem(item);
    setScreen(newScr);
    if (tab) setCaseTab(tab);
    setSidebarOpen(false);
    history.pushState({ role: "patient", item, scr: newScr, tab: tab || null, dash: "patient" }, "", "#patient/" + newScr + (tab ? "/" + tab : ""));
  };
  useEffect(() => {
    if (!history.state || history.state.dash !== "patient") {
      history.replaceState({ item: sidebarItem, scr: screen, tab: caseTab, dash: "patient" }, "", "#patient/" + screen + (caseTab ? "/" + caseTab : ""));
    }
    const onPop = (e) => {
      const st = e.state;
      if (!st || st.dash !== "patient") {
        if (!st) { setScreen("overview"); setSidebarItem("Overview"); }
        return;
      }
      setSidebarItem(st.item);
      setScreen(st.scr || "overview");
      if (st.tab) setCaseTab(st.tab);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const SIDEBAR_GROUPS = [
    ["My Journey", [
      ["Overview", "activity", () => navTo("Overview", "overview")],
      ["My Case", "clipboard", () => navTo("My Case", "case", "journey")],
      ["Documents", "document", () => navTo("Documents", "case", "documents")],
      ["Checklists", "check", () => navTo("Checklists", "case", "recovery")]
    ]],
    ["Support", [
      ["Messages", "message", () => navTo("Messages", "case", "messages")],
      ["Teleconsult", "video", () => navTo("Teleconsult", "teleconsult")]
    ]],
    ["Account", [
      ["My Profile", "person", () => navTo("My Profile", "profile")],
      ["Payments", "creditCard", () => navTo("Payments", "payments")]
    ]]
  ];

  const TeleconsultScreen = () => {
    const slots = [
      { day: "Mon Mar 31", times: ["09:00", "10:30", "14:00", "15:30"] },
      { day: "Tue Apr 01", times: ["08:30", "11:00", "13:00", "16:00"] },
      { day: "Wed Apr 02", times: ["09:30", "12:00", "14:30"] }
    ];
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Teleconsult Scheduler"),
      React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Book a secure video call with Dr. Pe\u00f1a or your care coordinator"),
      tcBooked ? React.createElement("div", { style: { ...s.card, background: T[50], border: `1px solid ${T[200]}`, textAlign: "center", padding: "40px 28px" } },
        React.createElement("div", { style: { width: 52, height: 52, borderRadius: "50%", background: T[100], border: `2px solid ${T[300]}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" } }, React.createElement(Icon, { name: "check", size: 22, color: T[600] })),
        React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[900], marginBottom: 8 } }, "Appointment confirmed"),
        React.createElement("p", { style: { fontSize: 14, color: G[500] } }, "Your ", service, " is scheduled for ", React.createElement("strong", { style: { color: G[900] } }, tcSlot), " with Dr. Pe\u00f1a."),
        React.createElement("button", { onClick: () => { setTcBooked(false); setTcSlot(null); }, style: { ...s.btnGhost, marginTop: 20, fontSize: 12 } }, "Reschedule")
      ) : React.createElement(React.Fragment, null,
        React.createElement("div", { style: { ...s.card, marginBottom: 14 } },
          React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Appointment type"),
          React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 20 } }, ["Initial Consultation", "Pre-op Review", "Post-op Follow-up"].map((t) => React.createElement("button", { key: t, onClick: () => setService(t), style: { flex: 1, padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${service === t ? T[500] : G[100]}`, background: service === t ? T[50] : "#fff", color: service === t ? T[700] : G[600], fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: sans } }, t))),
          React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Select a date & time"),
          slots.map(({ day, times }) => React.createElement("div", { key: day, style: { marginBottom: 18 } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: G[700], marginBottom: 8 } }, day),
            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, times.map((t) => React.createElement("button", { key: t, onClick: () => setTcSlot(`${day} \u00b7 ${t}`), style: { padding: "8px 18px", borderRadius: 7, border: `1.5px solid ${tcSlot === `${day} \u00b7 ${t}` ? T[500] : G[200]}`, background: tcSlot === `${day} \u00b7 ${t}` ? T[50] : "#fff", color: tcSlot === `${day} \u00b7 ${t}` ? T[700] : G[700], fontSize: 13, cursor: "pointer", fontFamily: sans } }, t)))
          ))
        ),
        React.createElement("button", { onClick: () => { if (tcSlot) setTcBooked(true); else showToast("Please select a time slot"); }, style: { ...s.btnPrimary, padding: "11px 28px" } }, "Confirm appointment")
      )
    );
  };

  const [profileForm, setProfileForm] = useState({ fn: firstName, ln: lastName, email: (user == null ? void 0 : user.email) || "", phone: "+1 555-0123", country: "United States", lang: "English", emergency: "Jane Doe (+1 555-9876)" });
  const [profileSaved, setProfileSaved] = useState(false);
  const ProfileScreen = ({ profileForm, setProfileForm, profileSaved, setProfileSaved, showToast }) => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto", maxWidth: 700 } },
    React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 12 } }, "My Profile"),
    React.createElement("div", { style: s.card },
      React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "Personal information"),
      [["First name", "fn"], ["Last name", "ln"], ["Email address", "email"], ["Phone number", "phone"], ["Country", "country"]].map(([lbl, key]) => React.createElement("div", { key, style: { marginBottom: 14 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, lbl),
        React.createElement("input", { value: profileForm[key], onChange: (e) => setProfileForm((f) => ({ ...f, [key]: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } })
      )),
      React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, "Preferred language"),
        React.createElement("select", { value: profileForm.lang, onChange: (e) => setProfileForm(f => ({ ...f, lang: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } }, ["English", "Spanish", "French", "German"].map(l => React.createElement("option", { key: l, value: l }, l)))
      ),
      React.createElement("div", { style: { marginBottom: 20 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, "Emergency contact"),
        React.createElement("input", { value: profileForm.emergency, onChange: (e) => setProfileForm((f) => ({ ...f, emergency: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } })
      ),
      React.createElement("div", { style: { borderTop: `1px solid ${G[100]}`, paddingTop: 20, marginTop: 6 } },
        React.createElement("div", { style: { ...s.label, marginBottom: 16, marginTop: 20 } }, "Security"),
        React.createElement("button", { style: s.btnGhost }, "Update password")
      ),
      React.createElement("button", { onClick: () => { setProfileSaved(true); showToast("Profile updated successfully"); setTimeout(() => setProfileSaved(false), 3000); }, style: { ...s.btnPrimary, marginTop: 24, width: "100%" } }, "Save changes")
    )
  );

  const PAT_PAYMENTS = [
    { date: "Mar 20", desc: "Surgery \u2014 Rhinoplasty", amount: "$4,200", status: "Paid", method: "Visa \u00b7\u00b7\u00b74242" },
    { date: "Apr 20", desc: "Telemedicine Fee", amount: "$75", status: "Pending", method: "\u2014" }
  ];

  const PaymentsScreen = () => {
    const totalPaid = patPayments.filter(p => p.status === "Paid").reduce((acc, p) => acc + (parseFloat(String(p.amount).replace(/[^0-9.]/g, "")) || 0), 0);
    const totalPending = patPayments.filter(p => p.status === "Pending").reduce((acc, p) => acc + (parseFloat(String(p.amount).replace(/[^0-9.]/g, "")) || 0), 0);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Payments"),
      React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Review your invoices, payment history, and financial schedule"),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement("div", { style: s.card }, React.createElement("div", { style: s.label }, "Total paid"), React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: T[700], marginTop: 4 } }, "$" + totalPaid.toLocaleString())),
        React.createElement("div", { style: s.card }, React.createElement("div", { style: s.label }, "Pending balance"), React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: "#92400e", marginTop: 4 } }, "$" + totalPending.toLocaleString())),
        React.createElement("div", { style: s.card }, React.createElement("div", { style: s.label }, "Saved savings"), React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: G[500], marginTop: 4 } }, "$1,240"))
      ),
      React.createElement("div", { style: s.card },
        React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Transaction history"),
        React.createElement("div", { className: "table-scroll" },
          React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13.5 } },
            React.createElement("thead", null, React.createElement("tr", { style: { textAlign: "left" } }, ["Date", "Description", "Status", "Method", "Amount"].map(h => React.createElement("th", { key: h, style: { fontWeight: 600, color: G[500], padding: "0 0 10px" } }, h)))),
            React.createElement("tbody", null, patPayments.map((p, i) => React.createElement("tr", { key: i, style: { borderTop: `1px solid ${G[100]}` } },
              React.createElement("td", { style: { padding: "14px 0", color: G[500] } }, p.date),
              React.createElement("td", { style: { padding: "14px 0", fontWeight: 500 } }, p.desc),
              React.createElement("td", { style: { padding: "14px 0" } }, React.createElement("span", { style: { fontSize: 11, padding: "2px 8px", borderRadius: 4, background: p.status === "Paid" ? T[50] : "#fffbeb", color: p.status === "Paid" ? T[700] : "#92400e", border: `1px solid ${p.status === "Paid" ? T[100] : "#fef3c7"}` } }, p.status)),
              React.createElement("td", { style: { padding: "14px 0", color: G[400] } }, p.method),
              React.createElement("td", { style: { padding: "14px 0", textAlign: "right", fontWeight: 600 } },
                "$" + p.amount,
                p.status === "Pending" && React.createElement("button", { onClick: () => { setSelectedPayment(p); setPayModalOpen(true); }, style: { ...s.btnPrimary, padding: "5px 12px", fontSize: 11, marginLeft: 12 } }, "Pay now")
              )
            )))
          )
        )
      ),
      React.createElement("div", { style: s.card },
        React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "Payment method on file"),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
          React.createElement("div", { style: { width: 44, height: 28, borderRadius: 4, background: G[900], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 } }, "VISA"),
          React.createElement("div", null, React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, "Visa ending in 4242"), React.createElement("div", { style: { fontSize: 11, color: G[400] } }, "Expires 12/26")),
          React.createElement("button", { style: { ...s.btnGhost, marginLeft: "auto", fontSize: 12, padding: "6px 12px" } }, "Update")
        )
      )
    );
  };

  const Sidebar = () => React.createElement("div", { className: "app-sidebar" + (sidebarOpen ? " open" : ""), style: { background: "#fff", borderRight: `1px solid ${G[200]}`, overflowY: "auto" } },
    React.createElement("div", { style: { padding: "24px 20px" } },
      SIDEBAR_GROUPS.map(([grp, items], gi) => React.createElement("div", { key: grp, style: { marginBottom: 28 } },
        React.createElement("span", { style: { ...s.label, display: "block", marginBottom: 12, paddingLeft: 4 } }, grp),
        items.map(([lbl, iconName, fn]) => React.createElement("div", { key: lbl, onClick: fn, style: { padding: "10px 14px", fontSize: 13.5, color: sidebarItem === lbl ? T[700] : G[600], cursor: "pointer", borderRadius: 8, background: sidebarItem === lbl ? T[50] : "transparent", display: "flex", alignItems: "center", gap: 12, transition: "all .2s" }, onMouseEnter: e => { if (sidebarItem !== lbl) e.currentTarget.style.background = G[50]; }, onMouseLeave: e => { if (sidebarItem !== lbl) e.currentTarget.style.background = "transparent"; } }, React.createElement(Icon, { name: iconName, size: 16, color: sidebarItem === lbl ? T[600] : G[400] }), lbl))
      ))
    )
  );

  const NEXT_STEPS = [
    { icon: "clipboard", title: "Complete your medical profile", body: "We need your health history to finalize your surgical plan.", onClick: () => navTo("My Profile", "profile") },
    { icon: "video", title: "Book your initial teleconsult", body: "Schedule 30 mins with Dr. Pe\u00f1a to review your goals.", onClick: () => navTo("Teleconsult", "teleconsult") },
    { icon: "document", title: "Upload identification", body: "Please upload a copy of your passport or ID.", onClick: () => navTo("Documents", "case", "documents") }
  ];

  const NewUserOverview = () => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
    React.createElement("div", { style: { background: T[950], borderRadius: 16, padding: "40px 36px", marginBottom: 28, position: "relative", overflow: "hidden" } },
      React.createElement("div", { style: { position: "absolute", top: -20, right: -20, opacity: 0.1 } }, React.createElement(Icon, { name: "sparkles", size: 200, color: "#fff" })),
      React.createElement("h1", { style: { fontFamily: serif, fontSize: 32, color: "#fff", marginBottom: 10 } }, "Welcome home, " + firstName),
      React.createElement("p", { style: { color: "rgba(255,255,255,.7)", fontSize: 15, maxWidth: 500 } }, "Your transformation journey at Praesenti starts today. We're here to guide you through every step of the process.")
    ),
    React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "Your next steps"),
    React.createElement("div", { style: { display: "grid", gap: 12 } },
      NEXT_STEPS.map((step, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "flex-start", gap: 16, cursor: "pointer" }, onClick: step.onClick },
        React.createElement("div", { style: { width: 44, height: 44, borderRadius: 12, background: T[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: step.icon, size: 20, color: T[600] })),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontWeight: 600, color: G[900], fontSize: 15, marginBottom: 2 } }, step.title),
          React.createElement("div", { style: { fontSize: 13, color: G[500], lineHeight: 1.5 } }, step.body)
        ),
        React.createElement("div", { style: { alignSelf: "center" } }, React.createElement(Icon, { name: "arrowRight", size: 16, color: G[300] }))
      ))
    )
  );

  const StatBox = ({ lbl, val, sub }) => React.createElement("div", { style: { ...s.card, flex: 1, marginBottom: 0 } },
    React.createElement("div", { style: s.label }, lbl),
    React.createElement("div", { style: { fontSize: 24, fontWeight: 700, margin: "6px 0 2px", color: T[900] } }, val),
    React.createElement("div", { style: { fontSize: 11, color: G[500] } }, sub)
  );

  const Overview = () => isNewUser ? React.createElement(NewUserOverview, null) : React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
    React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 } },
      React.createElement("div", null, React.createElement("h1", { style: { fontFamily: serif, fontSize: 28, color: T[950], marginBottom: 4 } }, "Patient Dashboard"), React.createElement("p", { style: { color: G[400], fontSize: 13 } }, "Case ID: #PRS-29402 \u2022 Status: Recovery")),
      React.createElement("button", { onClick: () => navTo("Messages", "case", "messages"), style: { ...s.btnPrimary, display: "flex", alignItems: "center", gap: 8 } }, React.createElement(Icon, { name: "message", size: 15, color: "#fff" }), "Message Coordinator")
    ),
    React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
      React.createElement(StatBox, { lbl: "Recovery day", val: "Day 6", sub: "of projected 14 days" }),
      React.createElement(StatBox, { lbl: "Next milestone", val: "Check-up", sub: "In 2 days (Oct 3)" }),
      React.createElement(StatBox, { lbl: "Health score", val: "Optimal", sub: "Based on recovery logs" })
    ),
    React.createElement("div", { className: "grid-2", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 } },
      React.createElement("div", null,
        React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Recovery progress"),
        React.createElement("div", { style: s.card },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 12 } }, React.createElement("span", { style: { fontSize: 13, fontWeight: 600 } }, "Checklist"), React.createElement("span", { style: { fontSize: 12, color: G[400] } }, checkDone.filter(Boolean).length + " / " + RECOVERY_CHECKS.length + " complete")),
          React.createElement("div", { style: { height: 6, background: G[100], borderRadius: 3, marginBottom: 20, overflow: "hidden" } }, React.createElement("div", { style: { height: "100%", width: (checkDone.filter(Boolean).length / RECOVERY_CHECKS.length * 100) + "%", background: T[500], borderRadius: 3 } })),
          RECOVERY_CHECKS.slice(0, 4).map((c, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i > 0 ? `1px solid ${G[50]}` : "none", opacity: checkDone[i] ? 0.5 : 1 } },
            React.createElement("div", { title: "Managed by Coordinator", style: { width: 18, height: 18, borderRadius: 4, border: `2px solid ${checkDone[i] ? T[500] : G[300]}`, background: checkDone[i] ? T[500] : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" } }, checkDone[i] && React.createElement(Icon, { name: "check", size: 10, color: "#fff" })),
            React.createElement("span", { style: { fontSize: 13, color: G[700], textDecoration: checkDone[i] ? "line-through" : "none" } }, c)
          )),

          React.createElement("button", { onClick: () => navTo("Checklists", "case", "recovery"), style: { ...s.btnGhost, width: "100%", marginTop: 14, fontSize: 11 } }, "View full checklist")
        )
      ),
      React.createElement("div", null,
        React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Care team"),
        React.createElement("div", { style: { ...s.card, display: "flex", gap: 16 } },
          React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: T[100], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 17, fontWeight: 700, color: T[700] } }, "JP"),
          React.createElement("div", null, React.createElement("div", { style: { fontSize: 14, fontWeight: 600 } }, "Dr. Juan Pe\u00f1a"), React.createElement("div", { style: { fontSize: 12, color: G[500], margin: "2px 0 8px" } }, "Lead Surgeon"), React.createElement("button", { onClick: () => navTo("Teleconsult", "teleconsult"), style: { ...s.btnGhost, padding: "4px 10px", fontSize: 11 } }, "Book visit"))
        ),
        React.createElement("div", { style: { ...s.card, display: "flex", gap: 16 } },
          React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: G[100], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 17, fontWeight: 700, color: G[600] } }, "AC"),
          React.createElement("div", null, React.createElement("div", { style: { fontSize: 14, fontWeight: 600 } }, "Ana Castillo"), React.createElement("div", { style: { fontSize: 12, color: G[500], margin: "2px 0 8px" } }, "Care Coordinator"), React.createElement("button", { onClick: () => navTo("Messages", "case", "messages"), style: { ...s.btnGhost, padding: "4px 10px", fontSize: 11 } }, "Send message"))
        )
      )
    )
  );

  const EmptyState = ({ icon, title, body, action, onClick }) => React.createElement("div", { style: { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 12, border: `1px dashed ${G[300]}` } },
    React.createElement("div", { style: { width: 48, height: 48, borderRadius: "50%", background: G[50], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" } }, React.createElement(Icon, { name: icon, size: 22, color: G[400] })),
    React.createElement("h3", { style: { fontSize: 16, fontWeight: 600, color: G[900], marginBottom: 6 } }, title),
    React.createElement("p", { style: { fontSize: 13.5, color: G[500], maxWidth: 300, margin: "0 auto 20px", lineHeight: 1.5 } }, body),
    action && React.createElement("button", { onClick: onClick, style: { ...s.btnPrimary, fontSize: 12, padding: "8px 18px" } }, action)
  );

  const CaseDetail = () => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
    React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 } },
      React.createElement("div", null, React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "My Case"), React.createElement("p", { style: { color: G[400], fontSize: 13 } }, "Rhinoplasty \u2022 Dr. Juan Pe\u00f1a")),
      React.createElement("div", { style: { fontSize: 11, padding: "4px 10px", borderRadius: 10, background: T[50], color: T[700], fontWeight: 600, textTransform: "uppercase" } }, "Recovery")
    ),
    React.createElement("div", { style: { display: "flex", gap: 24, borderBottom: `1px solid ${G[200]}`, marginBottom: 24 } }, [["journey", "Journey"], ["documents", "Documents"], ["recovery", "Checklist"], ["messages", "Messages"]].map(([k, lbl]) => React.createElement("button", { key: k, onClick: () => setCaseTab(k), style: { padding: "0 4px 12px", fontSize: 14, fontWeight: 500, color: caseTab === k ? T[700] : G[500], borderBottom: `2.5px solid ${caseTab === k ? T[500] : "transparent"}`, background: "none", borderLeft: "none", borderRight: "none", borderTop: "none", cursor: "pointer", transition: "all .2s" } }, lbl))),
    caseTab === "journey" && React.createElement(React.Fragment, null,
      React.createElement("div", { style: { ...s.card, padding: "32px" } },
        JOURNEY_STEPS.map((st, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 20, marginBottom: i === JOURNEY_STEPS.length - 1 ? 0 : 32, position: "relative" } },
          i < JOURNEY_STEPS.length - 1 && React.createElement("div", { style: { position: "absolute", left: 10, top: 30, bottom: -30, width: 1, background: G[200] } }),
          React.createElement("div", { style: { width: 22, height: 22, borderRadius: "50%", background: st.done ? T[500] : "#fff", border: `2px solid ${st.done ? T[500] : G[300]}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, flexShrink: 0 } }, st.done && React.createElement(Icon, { name: "check", size: 10, color: "#fff" })),
          React.createElement("div", null, React.createElement("div", { style: { fontWeight: 600, fontSize: 14, color: st.done ? G[900] : G[400] } }, st.label), React.createElement("div", { style: { fontSize: 12, color: G[400], marginTop: 2 } }, st.date))
        ))
      )
    ),
    caseTab === "documents" && React.createElement(React.Fragment, null,
      React.createElement("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, style: { display: "none" } }),
      React.createElement("div", { style: { ...s.card, padding: "24px" } },
        React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "Required documents"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
          DOCS.map((doc, i) => {
            const uploadedDoc = docsList.find(d => d.req_type === doc.name);
            const hasUpload = !!uploadedDoc;
            return React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 14, padding: "14px", border: `1px solid ${hasUpload ? T[100] : G[200]}`, borderRadius: 8, background: hasUpload ? T[50] : "#fff" } },
              React.createElement("div", { style: { width: 38, height: 38, borderRadius: 8, background: hasUpload ? T[100] : G[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: hasUpload ? "check" : "document", size: 18, color: hasUpload ? T[600] : G[500] })),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900] } }, hasUpload ? uploadedDoc.name : doc.name),
                React.createElement("div", { style: { fontSize: 11, color: hasUpload ? T[600] : G[400], marginTop: 2 } }, hasUpload ? (uploadedDoc.size + " \u00b7 " + (uploadedDoc.created_at ? new Date(uploadedDoc.created_at).toLocaleDateString() : "Just now")) : doc.size + " \u00b7 " + doc.date)
              ),
              hasUpload 
                ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                    React.createElement("a", { href: uploadedDoc.url, target: "_blank", rel: "noopener noreferrer", style: { ...s.btnGhost, fontSize: 11, padding: "6px 12px", textDecoration: "none" } }, "View"),
                    React.createElement("button", { onClick: () => handleDeleteDoc(uploadedDoc), title: "Delete document", style: { background: "#fff1f1", border: "1px solid #fee2e2", cursor: "pointer", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" } }, React.createElement(Icon, { name: "close", size: 10, color: "#ef4444" }))
                  )
                : React.createElement("button", { onClick: () => { setTargetReqType(doc.name); if (fileInputRef.current) fileInputRef.current.click(); }, style: { ...s.btnPrimary, fontSize: 11, padding: "6px 12px", background: G[600] } }, "Select")
            );
          })
        )
      ),
      // Show extra docs if we have more than needed
      docsList.length > DOCS.length && React.createElement("div", { style: { ...s.card, marginTop: 16 } },
        React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Additional documents"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, 
          docsList.slice(DOCS.length).map((d, i) => React.createElement("div", { key: d.id || i, style: { display: "flex", alignItems: "center", gap: 14, padding: "12px", background: G[50], borderRadius: 8 } },
            React.createElement("div", { style: { width: 32, height: 32, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "document", size: 16, color: G[500] })),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } }, React.createElement("div", { style: { fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.name), React.createElement("div", { style: { fontSize: 10, color: G[400], marginTop: 2 } }, d.size + " · " + (d.created_at ? new Date(d.created_at).toLocaleDateString() : "Just now"))),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
              React.createElement("a", { href: d.url, target: "_blank", rel: "noopener noreferrer", style: { color: T[500], fontSize: 11, fontWeight: 600, textDecoration: "none" } }, "View"),
              React.createElement("button", { onClick: () => handleDeleteDoc(d), title: "Delete document", style: { background: "#fff1f1", border: "1px solid #fee2e2", cursor: "pointer", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "close", size: 10, color: "#ef4444" }))
            )
          ))
        )
      ),
      React.createElement("div", { style: { marginTop: 16 } },
        React.createElement("button", { onClick: () => { if (fileInputRef.current) fileInputRef.current.click(); }, style: { ...s.btnGhost, width: "100%" } }, uploading ? "Uploading..." : "+ Upload additional document")
      )
    ),
    caseTab === "recovery" && React.createElement(React.Fragment, null,
      React.createElement("div", { style: { ...s.card, padding: "24px" } },
        RECOVERY_CHECKS.map((item, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < RECOVERY_CHECKS.length - 1 ? `1px solid ${G[100]}` : "none", cursor: "default" } },
          React.createElement("div", { title: "Managed by Coordinator", style: { width: 20, height: 20, borderRadius: 5, border: `2px solid ${checkDone[i] ? T[500] : G[200]}`, background: checkDone[i] ? T[500] : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, checkDone[i] && React.createElement(Icon, { name: "check", size: 10, color: "#fff" })),
          React.createElement("span", { style: { fontSize: 14, color: checkDone[i] ? G[400] : G[700], textDecoration: checkDone[i] ? "line-through" : "none" } }, item)
        ))
      )
    ),

    caseTab === "messages" && React.createElement("div", { style: { ...s.card, padding: 0, height: 500, display: "flex", flexDirection: "column", overflow: "hidden" } },
      React.createElement("div", { ref: msgBodyRef, style: { flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, background: G[50] } },
        msgs.map((m, i) => React.createElement("div", { key: i, style: { alignSelf: m.side === "me" ? "flex-end" : "flex-start", maxWidth: "80%" } },
          React.createElement("div", { style: { padding: "10px 14px", borderRadius: 12, background: m.side === "me" ? T[500] : "#fff", color: m.side === "me" ? "#fff" : G[900], fontSize: 13.5, lineHeight: 1.5, border: m.side === "me" ? "none" : `1px solid ${G[200]}`, boxShadow: m.side === "me" ? "none" : "0 1px 3px rgba(0,0,0,.05)" } }, m.text),
          React.createElement("div", { style: { fontSize: 10, color: G[400], marginTop: 4, textAlign: m.side === "me" ? "right" : "left" } }, m.time)
        ))
      ),
      React.createElement("div", { style: { padding: 16, borderTop: `1px solid ${G[200]}`, background: "#fff", display: "flex", gap: 10 } },
        React.createElement("input", { value: msgInput, onChange: e => setMsgInput(e.target.value), onKeyDown: e => e.key === "Enter" && sendMsg(), placeholder: "Type your message...", style: { flex: 1, height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } }),
        React.createElement("button", { onClick: sendMsg, style: { ...s.btnPrimary, padding: "0 20px" } }, "Send")
      )
    )
  );

  return React.createElement("div", { style: { fontFamily: sans, background: G[50], minHeight: "100vh", display: "flex", flexDirection: "column" } },
    React.createElement(Wizard, { open: dashWizOpen, user: user, onClose: () => setDashWizOpen(false) }),
    toast && React.createElement(Toast, { msg: toast, onDone: () => setToast(null) }),
    React.createElement("div", { className: "sidebar-overlay" + (sidebarOpen ? " open" : ""), onClick: () => setSidebarOpen(false) }),
    React.createElement("div", { className: "dash-header", style: { height: 60, background: "#fff", borderBottom: `1px solid ${G[200]}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
        React.createElement("button", { className: "mobile-menu-btn", onClick: () => setSidebarOpen(o => !o) }, React.createElement(Icon, { name: "menu", size: 22, color: G[800] })),
        React.createElement("div", { style: { fontFamily: serif, fontSize: 19, fontWeight: 600, color: T[900], letterSpacing: "0.06em", textTransform: "uppercase" } }, "Praes", React.createElement("span", { style: { color: T[500] } }, "enti"))
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: G[700] } },
          React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T[700], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 14, fontWeight: 600, color: T[200] } }, initials),
          React.createElement("span", { className: "col-hide-xs" }, fullName)
        ),
        React.createElement("button", { onClick: onSignOut, style: { ...s.btnGhost, padding: "6px 14px", fontSize: 12 } }, "Sign out")
      )
    ),
    React.createElement("div", { style: { display: "flex", flex: 1, overflow: "hidden" } },
      React.createElement(Sidebar, null),
      React.createElement("div", { style: { flex: 1, overflowY: "auto", minWidth: 0, background: G[50] } },
        screen === "overview" && Overview(),
        screen === "case" && CaseDetail(),
        screen === "teleconsult" && TeleconsultScreen(),
        screen === "profile" && ProfileScreen({ profileForm, setProfileForm, profileSaved, setProfileSaved, showToast }),
        screen === "payments" && PaymentsScreen()
      )
    ),
    React.createElement(CheckoutModal, { open: payModalOpen, payment: selectedPayment, onClose: () => setPayModalOpen(false), onSuccess: () => { showToast("Payment received!"); fetchPayments(); } })
  );
};

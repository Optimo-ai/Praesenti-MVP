import { T, G, serif, sans, s, CASES, INIT_MSGS, JOURNEY_STEPS, DOCS, RECOVERY_CHECKS } from '../constants.js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';
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
  console.log("[Patient] user:", JSON.stringify(user), "isDemo:", isDemo);
  const [screen, setScreen] = useState(() => {
    if (user && !user.isDemo && !localStorage.getItem("onboarding_done_" + user.id)) {
      return "onboarding";
    }
    return "overview";
  });
  const [caseTab, setCaseTab] = useState("journey");
  const [msgs, setMsgs] = useState(isDemo ? INIT_MSGS : []);
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
  const [service, setService] = useState(isDemo ? "Post-op Follow-up" : "Initial Consultation");

  const PAT_PAYMENTS_DEMO = [
    { date: "Mar 20", desc: "Surgery \u2014 Rhinoplasty", amount: "4200", status: "Paid", method: "PayPal" },
    { date: "Apr 20", desc: "Telemedicine Fee", amount: "75", status: "Pending", method: "\u2014" }
  ];
  const [patPayments, setPatPayments] = useState(isDemo ? PAT_PAYMENTS_DEMO : []);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchPayments = async () => {
    if (!user || !user.id || isDemo) return;
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
          setPatPayments(mapped.length > 0 ? mapped : []);
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPayments(); }, [user]);
  useEffect(() => { if (autoWiz) setDashWizOpen(true); }, [autoWiz]);
  const msgBodyRef = useRef(null);
  useEffect(() => { if (msgBodyRef.current) msgBodyRef.current.scrollTop = msgBodyRef.current.scrollHeight; }, [msgs]);

  useEffect(() => {
    if (user && !user.isDemo && !localStorage.getItem("onboarding_done_" + user.id)) {
      if (screen !== "onboarding") setScreen("onboarding");
    }
  }, [screen, user]);

  const sendMsg = () => {
    if (!msgInput.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMsgs((m) => [...m, { side: "me", text: msgInput.trim(), time, date: "Today" }]);
    setMsgInput("");
    setTimeout(() => setMsgs((m) => [...m, { side: "them", text: "Got it! I'll get back to you shortly.", time, date: "Today" }]), 1200);
  };
  const navTo = (item, scr, tab) => {
    if (user && !user.isDemo && !localStorage.getItem("onboarding_done_" + user.id)) {
      showToast("Please complete your profile first.");
      return;
    }
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
      if (user && !user.isDemo && !localStorage.getItem("onboarding_done_" + user.id)) {
        setScreen("onboarding");
        return;
      }
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
      ["My Timeline", "trendingUp", () => navTo("My Timeline", "timeline")],
      ["Documents", "document", () => navTo("Documents", "case", "documents")],
      ["Checklists", "check", () => navTo("Checklists", "case", "recovery")]
    ]],
    ["My Network", [
      ["My Care Team", "heart", () => navTo("My Care Team", "careteam")],
      ["Explore Network", "globe", () => navTo("Explore Network", "explore")]
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
    if (isNewUser) {
      return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, display: "flex", alignItems: "center", justifyContent: "center" } },
        React.createElement("div", { style: { textAlign: "center", maxWidth: 360 } },
          React.createElement("div", { style: { width: 52, height: 52, borderRadius: "50%", background: G[100], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" } },
            React.createElement(Icon, { name: "video", size: 24, color: G[400] })
          ),
          React.createElement("h3", { style: { fontFamily: serif, fontSize: 20, color: G[900], marginBottom: 8 } }, "Not available yet"),
          React.createElement("p", { style: { fontSize: 13.5, color: G[500], lineHeight: 1.6 } }, "You don't have a coordinator or surgeon assigned yet. We will notify you once your care team is ready to schedule a call.")
        )
      );
    }

    const getSlots = () => {
      const days = [];
      const today = new Date();
      let count = 0;
      let d = new Date(today);
      d.setDate(d.getDate() + 1);
      while (count < 3) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) {
          const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          const allTimes = [["09:00","10:30","14:00","15:30"],["08:30","11:00","13:00","16:00"],["09:30","12:00","14:30"]];
          days.push({ day: label, times: allTimes[count] });
          count++;
        }
        d.setDate(d.getDate() + 1);
      }
      return days;
    };
    const slots = getSlots();
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Teleconsult Scheduler"),
      React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Book a secure video call with your surgeon or care coordinator"),
      tcBooked ? React.createElement("div", { style: { ...s.card, background: T[50], border: `1px solid ${T[200]}`, textAlign: "center", padding: "40px 28px" } },
        React.createElement("div", { style: { width: 52, height: 52, borderRadius: "50%", background: T[100], border: `2px solid ${T[300]}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" } }, React.createElement(Icon, { name: "check", size: 22, color: T[600] })),
        React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[900], marginBottom: 8 } }, "Appointment confirmed"),
        React.createElement("p", { style: { fontSize: 14, color: G[500] } }, "Your ", service, " is scheduled for ", React.createElement("strong", { style: { color: G[900] } }, tcSlot), "."),
        React.createElement("button", { onClick: () => { setTcBooked(false); setTcSlot(null); }, style: { ...s.btnGhost, marginTop: 20, fontSize: 12 } }, "Reschedule")
      ) : React.createElement(React.Fragment, null,
        React.createElement("div", { style: { ...s.card, marginBottom: 14 } },
          React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Appointment type"),
          React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 } }, 
            (isNewUser ? ["Initial Consultation"] : ["Pre-op Review", "Post-op Follow-up", "General Question"]).map((t) => 
              React.createElement("button", { key: t, onClick: () => setService(t), style: { flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${service === t ? T[500] : G[100]}`, background: service === t ? T[50] : "#fff", color: service === t ? T[700] : G[600], fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: sans } }, t)
            )
          ),
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

  const [profileForm, setProfileForm] = useState({
    fn: firstName,
    ln: lastName,
    email: (user == null ? void 0 : user.email) || "",
    phone: isDemo ? "+1 555-0123" : "",
    country: isDemo ? "United States" : "",
    lang: "English",
    emergency: isDemo ? "Jane Doe (+1 555-9876)" : ""
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const ProfileScreen = ({ profileForm, setProfileForm, profileSaved, setProfileSaved, showToast }) => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto", maxWidth: 700 } },
    React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 12 } }, "My Profile"),
    React.createElement("div", { style: s.card },
      React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "Personal information"),
      [["First name", "fn"], ["Last name", "ln"], ["Email address", "email"], ["Phone number", "phone"]].map(([lbl, key]) => React.createElement("div", { key, style: { marginBottom: 14 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, lbl),
        React.createElement("input", { value: profileForm[key], onChange: (e) => setProfileForm((f) => ({ ...f, [key]: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } })
      )),
      React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, "Country"),
        React.createElement("select", { value: profileForm.country, onChange: (e) => setProfileForm(f => ({ ...f, country: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } }, ["", "United States", "Canada", "United Kingdom", "Australia", "Dominican Republic", "Argentina", "Austria", "Bahamas", "Belgium", "Bolivia", "Brazil", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Czech Republic", "Denmark", "Ecuador", "Egypt", "El Salvador", "Finland", "France", "Germany", "Greece", "Guatemala", "Honduras", "Hong Kong", "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Malaysia", "Mexico", "Netherlands", "New Zealand", "Nicaragua", "Norway", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "United Arab Emirates", "Uruguay", "Venezuela", "Vietnam", "Other"].map(c => React.createElement("option", { key: c, value: c }, c || "Select a country")))
      ),
      React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, "Preferred language"),
        React.createElement("select", { value: profileForm.lang, onChange: (e) => setProfileForm(f => ({ ...f, lang: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } }, ["English", "Spanish", "Portuguese", "French", "Italian", "German", "Arabic", "Chinese", "Japanese", "Korean", "Russian", "Other"].map(l => React.createElement("option", { key: l, value: l }, l)))
      ),
      React.createElement("div", { style: { marginBottom: 20 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, "Emergency contact"),
        React.createElement("input", { value: profileForm.emergency, onChange: (e) => setProfileForm((f) => ({ ...f, emergency: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } })
      ),
      React.createElement("div", { style: { borderTop: `1px solid ${G[100]}`, paddingTop: 20, marginTop: 6 } },
        React.createElement("div", { style: { ...s.label, marginBottom: 16, marginTop: 20 } }, "Security"),
        React.createElement("button", { onClick: () => {
          if (!SUPA_URL || !SUPABASE_URL) {
            showToast("Password reset email sent (demo mode)");
            return;
          }
          const email = profileForm.email || (user && user.email);
          if (!email) { showToast("No email on file"); return; }
          fetch(SUPA_URL + "/auth/v1/recover", {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: SUPA_KEY },
            body: JSON.stringify({ email })
          }).then(() => showToast("Password reset email sent to " + email))
            .catch(() => showToast("Error sending reset email"));
        }, style: s.btnGhost }, "Update password")
      ),
      React.createElement("button", { onClick: () => { setProfileSaved(true); showToast("Profile updated successfully"); setTimeout(() => setProfileSaved(false), 3000); }, style: { ...s.btnPrimary, marginTop: 24, width: "100%" } }, "Save changes")
    )
  );

  const PaymentsScreen = () => {
    const totalPaid = patPayments.filter(p => p.status === "Paid").reduce((acc, p) => acc + (parseFloat(String(p.amount).replace(/[^0-9.]/g, "")) || 0), 0);
    const totalPending = patPayments.filter(p => p.status === "Pending").reduce((acc, p) => acc + (parseFloat(String(p.amount).replace(/[^0-9.]/g, "")) || 0), 0);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Payments"),
      React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Review your invoices, payment history, and financial schedule"),
      isDemo && React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement("div", { style: s.card }, React.createElement("div", { style: s.label }, "Total paid"), React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: T[700], marginTop: 4 } }, "$" + totalPaid.toLocaleString())),
        React.createElement("div", { style: s.card }, React.createElement("div", { style: s.label }, "Pending balance"), React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: "#92400e", marginTop: 4 } }, "$" + totalPending.toLocaleString())),
        React.createElement("div", { style: s.card }, React.createElement("div", { style: s.label }, "Saved vs. US avg"), React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: G[500], marginTop: 4 } }, "$1,240"))
      ),
      React.createElement("div", { style: s.card },
        React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Transaction history"),
        patPayments.length === 0
          ? React.createElement("div", { style: { textAlign: "center", padding: "40px 20px" } },
              React.createElement("div", { style: { width: 48, height: 48, borderRadius: "50%", background: G[100], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" } }, React.createElement(Icon, { name: "creditCard", size: 20, color: G[400] })),
              React.createElement("p", { style: { fontSize: 13, color: G[500] } }, "No transactions yet. Payments will appear here once your procedure is confirmed.")
            )
          : React.createElement("div", { className: "table-scroll" },
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
        React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "Payment method"),
        isDemo
          ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
              React.createElement("div", { style: { width: 44, height: 28, borderRadius: 4, background: "#0070BA", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 } }, "PP"),
              React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, "PayPal"),
                React.createElement("div", { style: { fontSize: 11, color: G[400] } }, "demo@praesenti.com")
              ),
              React.createElement("span", { style: { ...s.btnGhost, marginLeft: "auto", fontSize: 12, padding: "6px 12px" } }, "Saved")
            )
          : React.createElement("div", { style: { textAlign: "center", padding: "32px 20px" } },
              React.createElement("div", { style: { width: 48, height: 48, borderRadius: "50%", background: G[100], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" } }, React.createElement(Icon, { name: "creditCard", size: 20, color: G[400] })),
              React.createElement("p", { style: { fontSize: 13, color: G[500], marginBottom: 16 } }, "No payment method saved yet."),
              React.createElement("a", {
                href: "https://www.paypal.com",
                target: "_blank",
                rel: "noopener noreferrer",
                style: { ...s.btnPrimary, fontSize: 13, padding: "10px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }
              },
                React.createElement("div", { style: { width: 20, height: 14, borderRadius: 2, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#0070BA" } }, "PP"),
                "Add PayPal"
              )
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
    { icon: "video", title: "Book your initial teleconsult", body: "Schedule a 30-minute call with your coordinator to review your goals.", onClick: () => navTo("Teleconsult", "teleconsult") },
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
          React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: T[100], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 17, fontWeight: 700, color: T[700] } }, "S"),
          React.createElement("div", null, React.createElement("div", { style: { fontSize: 14, fontWeight: 600 } }, "Your Surgeon"), React.createElement("div", { style: { fontSize: 12, color: G[500], margin: "2px 0 8px" } }, "Lead Surgeon"), React.createElement("button", { onClick: () => navTo("Teleconsult", "teleconsult"), style: { ...s.btnGhost, padding: "4px 10px", fontSize: 11 } }, "Book visit"))
        ),
        React.createElement("div", { style: { ...s.card, display: "flex", gap: 16 } },
          React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: G[100], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 17, fontWeight: 700, color: G[600] } }, "C"),
          React.createElement("div", null, React.createElement("div", { style: { fontSize: 14, fontWeight: 600 } }, "Your Coordinator"), React.createElement("div", { style: { fontSize: 12, color: G[500], margin: "2px 0 8px" } }, "Care Coordinator"), React.createElement("button", { onClick: () => navTo("Messages", "case", "messages"), style: { ...s.btnGhost, padding: "4px 10px", fontSize: 11 } }, "Send message"))
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
      React.createElement("div", null,
          React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, caseTab === "journey" ? "My Case" : caseTab === "documents" ? "Documents" : caseTab === "recovery" ? "Recovery Checklist" : caseTab === "messages" ? "Messages" : "My Case"),
        React.createElement("p", { style: { color: G[400], fontSize: 13 } }, isDemo ? "Rhinoplasty \u2022 Care Team Assigned" : "Your case details will appear here once confirmed")
      ),
      isDemo && React.createElement("div", { style: { fontSize: 11, padding: "4px 10px", borderRadius: 10, background: T[50], color: T[700], fontWeight: 600, textTransform: "uppercase" } }, "Recovery")
    ),
    caseTab === "journey" && React.createElement(React.Fragment, null,
      React.createElement("div", { style: { ...s.card, padding: "32px" } },
        (isDemo ? JOURNEY_STEPS : [
          { label:"Application submitted",      date:"\u2014", done:false },
          { label:"Matched with your surgeon",  date:"\u2014", done:false },
          { label:"Pre-op consultation",        date:"\u2014", done:false },
          { label:"Surgery day",                date:"\u2014", done:false },
          { label:"Recovery home check-in",     date:"\u2014", done:false },
          { label:"7-day follow-up",            date:"\u2014", done:false },
          { label:"30-day telemedicine",        date:"\u2014", done:false },
          { label:"Final clearance",            date:"\u2014", done:false }
        ]).map((st, i, arr) => React.createElement("div", { key: i, style: { display: "flex", gap: 20, marginBottom: i === arr.length - 1 ? 0 : 32, position: "relative" } },
          i < arr.length - 1 && React.createElement("div", { style: { position: "absolute", left: 10, top: 30, bottom: -30, width: 1, background: G[200] } }),
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
          (isDemo ? DOCS : [
            { name: "Passport / Government ID",    size: "", date: "" },
            { name: "Medical clearance letter",    size: "", date: "" },
            { name: "Blood work results",          size: "", date: "" },
            { name: "Consent form",                size: "", date: "" },
            { name: "Insurance or payment proof",  size: "", date: "" }
          ]).map((doc, i) => {
            const uploadedDoc = docsList.find(d => d.req_type === doc.name);
            const hasUpload = !!uploadedDoc;
            return React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 14, padding: "14px", border: `1px solid ${hasUpload ? T[100] : G[200]}`, borderRadius: 8, background: hasUpload ? T[50] : "#fff" } },
              React.createElement("div", { style: { width: 38, height: 38, borderRadius: 8, background: hasUpload ? T[100] : G[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: hasUpload ? "check" : "document", size: 18, color: hasUpload ? T[600] : G[500] })),
              React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900] } }, hasUpload ? uploadedDoc.name : doc.name),
                React.createElement("div", { style: { fontSize: 11, color: hasUpload ? T[600] : G[400], marginTop: 2 } }, hasUpload ? (uploadedDoc.size + " \u00b7 " + (uploadedDoc.created_at ? new Date(uploadedDoc.created_at).toLocaleDateString() : "Just now")) : (doc.size ? doc.size + " \u00b7 " + doc.date : "Pending upload"))
              ),
              hasUpload
                ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                    React.createElement("a", { href: uploadedDoc.url, target: "_blank", rel: "noopener noreferrer", style: { ...s.btnGhost, fontSize: 11, padding: "6px 12px", textDecoration: "none" } }, "View"),
                    React.createElement("button", { onClick: () => handleDeleteDoc(uploadedDoc), title: "Delete document", style: { background: "#fff1f1", border: "1px solid #fee2e2", cursor: "pointer", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "close", size: 10, color: "#ef4444" }))
                  )
                : React.createElement("button", { onClick: () => { setTargetReqType(doc.name); if (fileInputRef.current) fileInputRef.current.click(); }, style: { ...s.btnPrimary, fontSize: 11, padding: "6px 12px", background: G[600] } }, "Upload")
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
            React.createElement("div", { style: { flex: 1, minWidth: 0 } }, React.createElement("div", { style: { fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.name), React.createElement("div", { style: { fontSize: 10, color: G[400], marginTop: 2 } }, d.size + " \u00b7 " + (d.created_at ? new Date(d.created_at).toLocaleDateString() : "Just now"))),
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
      !isDemo && msgs.length === 0
        ? React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" } },
            React.createElement("div", { style: { width: 52, height: 52, borderRadius: "50%", background: G[100], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 } }, React.createElement(Icon, { name: "message", size: 22, color: G[400] })),
            React.createElement("h3", { style: { fontSize: 15, fontWeight: 600, color: G[900], marginBottom: 6 } }, "No messages yet"),
            React.createElement("p", { style: { fontSize: 13, color: G[500], lineHeight: 1.6 } }, "Once a coordinator is assigned to your case, your conversation will appear here.")
          )
        : React.createElement(React.Fragment, null,
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
    )
  );


  // \u2500\u2500 ONBOARDING GUIADO \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const OnboardingScreen = () => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ country:"", phone:"", lang:"English" });
    const [proc, setProc] = useState("");
    const [budget, setBudget] = useState(5000);
    const [slot, setSlot] = useState(null);
    const [done, setDone] = useState(false);
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const PROCS = ["Rhinoplasty","Breast Augmentation","Liposuction","Tummy Tuck","Hair Transplant","Dental Veneers","Bariatric Surgery","Eye Surgery","Other"];
    const SLOTS = [
      { day:"Mon Apr 14", times:["09:00","10:30","14:00","15:30"] },
      { day:"Tue Apr 15", times:["08:30","11:00","13:00","16:00"] },
      { day:"Wed Apr 16", times:["09:30","12:00","14:30"] }
    ];
    const pct = Math.round((step/3)*100);
    if(done) return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, display:"flex", alignItems:"center", justifyContent:"center" } },
      React.createElement("div", { style:{ textAlign:"center", maxWidth:420 } },
        React.createElement("div", { style:{ width:72, height:72, borderRadius:"50%", background:T[50], border:`3px solid ${T[200]}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" } }, React.createElement(Icon, { name:"leaf", size:32, color:T[600] })),
        React.createElement("h1", { style:{ fontFamily:serif, fontSize:30, color:T[950], marginBottom:10 } }, "You're all set!"),
        React.createElement("p", { style:{ fontSize:14, color:G[500], lineHeight:1.8, marginBottom:24 } }, slot ? `Your intro call is confirmed for ${slot}.` : "A coordinator will reach out within 24 hours."),
        React.createElement("div", { style:{ ...s.card, background:T[950], border:"none", marginBottom:20, textAlign:"left" } },
          React.createElement("div", { style:{ fontSize:11, color:"rgba(255,255,255,.3)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 } }, "Your application"),
          [["Procedure",proc||"\u2014"],["Budget","$"+budget.toLocaleString()],["Country",form.country||"\u2014"],["Language",form.lang]].map(([l,v])=>
            React.createElement("div", { key:l, style:{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,.07)", fontSize:13 } }, React.createElement("span",{style:{color:"rgba(255,255,255,.4)"}},l), React.createElement("span",{style:{color:"rgba(255,255,255,.85)",fontWeight:500}},v))
          )
        ),
        React.createElement("button", { onClick:() => {
          if (user && !user.isDemo) {
            localStorage.setItem("onboarding_done_" + user.id, "true");
          }
          navTo("Overview","overview");
        }, style:{ ...s.btnPrimary, padding:"12px 36px", fontSize:14 } }, "Go to my dashboard")
      )
    );
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto", maxWidth:600, margin:"0 auto" } },
      React.createElement("div", { style:{ marginBottom:32 } },
        React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", marginBottom:8 } },
          React.createElement("span", { style:{ fontSize:12, fontWeight:600, color:T[500], textTransform:"uppercase", letterSpacing:"0.1em" } }, "Step "+step+" of 3"),
          React.createElement("span", { style:{ fontSize:11, color:G[400] } }, ["","Takes 1 minute","No commitment","Free \u00b7 30 min"][step])
        ),
        React.createElement("div", { style:{ height:4, background:G[100], borderRadius:2, overflow:"hidden" } },
          React.createElement("div", { style:{ height:"100%", width:pct+"%", background:T[500], borderRadius:2, transition:"width .4s" } })
        )
      ),
      step===1 && React.createElement("div", null,
        React.createElement("h2", { style:{ fontFamily:serif, fontSize:26, color:T[950], marginBottom:6 } }, "Welcome, "+firstName+"!"),
        React.createElement("p", { style:{ fontSize:14, color:G[500], marginBottom:28, lineHeight:1.7 } }, "Let us finish setting up your profile so your coordinator has everything they need."),
        React.createElement("div", { style:{ marginBottom:16 } }, React.createElement("label", { style:{ display:"block", fontSize:12, fontWeight:500, color:G[700], marginBottom:5 } }, "Country of residence"), 
          React.createElement("select", { value:form.country, onChange:set("country"), style:{ width:"100%", height:40, border:`1px solid ${G[200]}`, borderRadius:7, padding:"0 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900], background:"#fff" } },
            ["", "United States", "Canada", "United Kingdom", "Australia", "Dominican Republic", "Argentina", "Austria", "Bahamas", "Belgium", "Bolivia", "Brazil", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Czech Republic", "Denmark", "Ecuador", "Egypt", "El Salvador", "Finland", "France", "Germany", "Greece", "Guatemala", "Honduras", "Hong Kong", "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Malaysia", "Mexico", "Netherlands", "New Zealand", "Nicaragua", "Norway", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "United Arab Emirates", "Uruguay", "Venezuela", "Vietnam", "Other"].map(c => React.createElement("option", { key:c, value:c }, c || "Select a country"))
          )
        ),
        React.createElement("div", { style:{ marginBottom:16 } }, React.createElement("label", { style:{ display:"block", fontSize:12, fontWeight:500, color:G[700], marginBottom:5 } }, "Phone number"), React.createElement("input", { type:"tel", value:form.phone, onChange:set("phone"), placeholder:"+1 555 000 0000", style:{ width:"100%", height:40, border:`1px solid ${G[200]}`, borderRadius:7, padding:"0 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900] } })),
        React.createElement("div", { style:{ marginBottom:16 } }, React.createElement("label", { style:{ display:"block", fontSize:12, fontWeight:500, color:G[700], marginBottom:5 } }, "Preferred language"), React.createElement("select", { value:form.lang, onChange:set("lang"), style:{ width:"100%", height:40, border:`1px solid ${G[200]}`, borderRadius:7, padding:"0 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900], background:"#fff" } }, ["English", "Spanish", "Portuguese", "French", "Italian", "German", "Arabic", "Chinese", "Japanese", "Korean", "Russian", "Other"].map(l=>React.createElement("option",{key:l,value:l},l)))),
        React.createElement("div", { style:{ display:"flex", justifyContent:"flex-end", marginTop:28 } }, React.createElement("button", { onClick:()=>{
          if(!form.country || !form.phone.trim()) {
            showToast("Please complete all required fields.");
            return;
          }
          setStep(2);
        }, style:{ ...s.btnPrimary, padding:"11px 32px", fontSize:13 } }, "Continue \u2192"))
      ),
      step===2 && React.createElement("div", null,
        React.createElement("h2", { style:{ fontFamily:serif, fontSize:26, color:T[950], marginBottom:6 } }, "What are you looking for?"),
        React.createElement("p", { style:{ fontSize:14, color:G[500], marginBottom:24, lineHeight:1.7 } }, "This helps us match you with the right surgeon."),
        React.createElement("div", { style:{ marginBottom:22 } },
          React.createElement("label", { style:{ display:"block", fontSize:12, fontWeight:500, color:G[700], marginBottom:5 } }, "Procedure of interest"),
          React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 } },
            PROCS.map(p=>React.createElement("button", { key:p, onClick:()=>setProc(p), style:{ padding:"10px 14px", borderRadius:8, border:`1.5px solid ${proc===p?T[500]:G[200]}`, background:proc===p?T[50]:"#fff", color:proc===p?T[700]:G[700], fontSize:13, cursor:"pointer", fontFamily:sans, textAlign:"left" } }, p))
          )
        ),
        React.createElement("div", { style:{ marginBottom:28 } },
          React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", marginBottom:8 } }, React.createElement("label", { style:{ display:"block", fontSize:12, fontWeight:500, color:G[700], marginBottom:5 } }, "Approximate budget"), React.createElement("span",{style:{fontSize:14,fontWeight:600,color:T[600]}},"$"+budget.toLocaleString())),
          React.createElement("input", { type:"range", min:1000, max:30000, step:500, value:budget, onChange:e=>setBudget(Number(e.target.value)), style:{ width:"100%", height:4, borderRadius:2, outline:"none", cursor:"pointer", border:"none", WebkitAppearance:"none", appearance:"none", background:`linear-gradient(90deg,${T[500]} ${(((budget-1000)/29000)*100)}%,${G[200]} ${(((budget-1000)/29000)*100)}%)` } }),
          React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", fontSize:11, color:G[400], marginTop:4 } }, React.createElement("span",null,"$1,000"), React.createElement("span",null,"$30,000+"))
        ),
        React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", marginTop:28 } },
          React.createElement("button", { onClick:()=>setStep(1), style:{ ...s.btnGhost, padding:"11px 24px", fontSize:13 } }, "\u2190 Back"),
          React.createElement("button", { onClick:()=>{
            if(!proc) {
              showToast("Please select a procedure.");
              return;
            }
            setStep(3);
          }, style:{ ...s.btnPrimary, padding:"11px 32px", fontSize:13 } }, "Continue \u2192")
        )
      ),
      step===3 && React.createElement("div", null,
        React.createElement("h2", { style:{ fontFamily:serif, fontSize:26, color:T[950], marginBottom:6 } }, "Book your intro call"),
        React.createElement("p", { style:{ fontSize:14, color:G[500], marginBottom:24, lineHeight:1.7 } }, "A free 30-minute call with a Praesenti coordinator."),
        React.createElement("div", { style:{ ...s.card, marginBottom:16 } },
          SLOTS.map(({ day, times }) => React.createElement("div", { key:day, style:{ marginBottom:18 } },
            React.createElement("div", { style:{ fontSize:12, fontWeight:600, color:G[700], marginBottom:8 } }, day),
            React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:8 } },
              times.map(t=>React.createElement("button", { key:t, onClick:()=>setSlot(day+" \u00b7 "+t), style:{ padding:"8px 18px", borderRadius:7, border:`1.5px solid ${slot===day+" \u00b7 "+t?T[500]:G[200]}`, background:slot===day+" \u00b7 "+t?T[50]:"#fff", color:slot===day+" \u00b7 "+t?T[700]:G[700], fontSize:13, cursor:"pointer", fontFamily:sans } }, t))
            )
          ))
        ),
        React.createElement("p", { style:{ fontSize:12, color:G[400], textAlign:"center", marginBottom:20 } }, "Don\u2019t want to book now? You can schedule later from your dashboard."),
        React.createElement("div", { style:{ display:"flex", justifyContent:"space-between" } },
          React.createElement("button", { onClick:()=>setStep(2), style:{ ...s.btnGhost, padding:"11px 24px", fontSize:13 } }, "\u2190 Back"),
          React.createElement("div", { style:{ display:"flex", gap:10 } },
            React.createElement("button", { onClick:()=>setDone(true), style:{ ...s.btnGhost, padding:"11px 20px", fontSize:13 } }, "Skip"),
            React.createElement("button", { onClick:()=>{ if(slot)setDone(true); else showToast("Please select a time slot"); }, style:{ ...s.btnPrimary, padding:"11px 28px", fontSize:13 } }, "Confirm call")
          )
        )
      )
    );
  };

  // \u2500\u2500 LIVE TIMELINE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const LiveTimelineScreen = () => {
    const [expanded, setExpanded] = useState(null);
    const DEMO_STAGES = [
      { label:"Initial consultation",          date:"Feb 28", status:"done",    responsible:"Praesenti",    detail:"We received your application and confirmed your procedure of interest and budget.", icon:"clipboard" },
      { label:"Medical evaluation",            date:"Mar 02", status:"done",    responsible:"Medical team", detail:"Your case was reviewed. You were confirmed as a good candidate and your surgeon was selected.", icon:"stethoscope" },
      { label:"Confirmation & documentation",  date:"Mar 14", status:"done",    responsible:"Coordinator",  detail:"Consent forms signed. Pre-operative instructions delivered. Surgery date confirmed.", icon:"document" },
      { label:"Surgery day",                   date:"Mar 20", status:"done",    responsible:"Surgical team",detail:"Procedure completed without complications. Post-operative report filed.", icon:"heart" },
      { label:"Recovery home check-in",        date:"Mar 22", status:"done",    responsible:"Recovery Home",detail:"Transferred to your recovery home. Nursing staff performed initial recovery assessment.", icon:"home" },
      { label:"7-day follow-up",               date:"Mar 27", status:"current", responsible:"Dr. Vargas",   detail:"Post-operative review at 7 days via teleconsult. Wound status and recovery plan adherence will be assessed.", icon:"video" },
      { label:"30-day telemedicine",           date:"Apr 20", status:"pending", responsible:"Dr. Vargas",   detail:"30-day follow-up consultation. Discharge decision based on your evolution.", icon:"activity" },
      { label:"Discharge & case closure",      date:"May 10", status:"pending", responsible:"Coordinator",  detail:"Final outcome evaluation. Medical discharge certificate issued and case file completed.", icon:"check" }
    ];
    const NEW_STAGES = [
      { label:"Initial consultation",          date:"\u2014", status:"pending", responsible:"Praesenti",    detail:"We will contact you to confirm your procedure of interest and budget.", icon:"clipboard" },
      { label:"Medical evaluation",            date:"\u2014", status:"pending", responsible:"Medical team", detail:"Your case will be reviewed by our medical team.", icon:"stethoscope" },
      { label:"Confirmation & documentation",  date:"\u2014", status:"pending", responsible:"Coordinator",  detail:"Consent forms, pre-operative instructions and surgery date.", icon:"document" },
      { label:"Surgery day",                   date:"\u2014", status:"pending", responsible:"Surgical team",detail:"Your procedure will be performed by your assigned surgeon.", icon:"heart" },
      { label:"Recovery home check-in",        date:"\u2014", status:"pending", responsible:"Recovery Home",detail:"Transfer to your recovery home with nursing staff support.", icon:"home" },
      { label:"7-day follow-up",               date:"\u2014", status:"pending", responsible:"Your surgeon", detail:"Post-operative review via teleconsult at 7 days.", icon:"video" },
      { label:"30-day telemedicine",           date:"\u2014", status:"pending", responsible:"Your surgeon", detail:"30-day follow-up consultation and discharge decision.", icon:"activity" },
      { label:"Discharge & case closure",      date:"\u2014", status:"pending", responsible:"Coordinator",  detail:"Final outcome evaluation and medical discharge certificate.", icon:"check" }
    ];
    const stages = isDemo ? DEMO_STAGES : NEW_STAGES;
    const doneCount = stages.filter(st=>st.status==="done").length;
    const currentIdx = stages.findIndex(st=>st.status==="current");
    const pct = Math.round((doneCount/stages.length)*100);
    const pillBg  = st => ({done:T[50], current:"#fef3c7", pending:G[100]})[st];
    const pillClr = st => ({done:T[700], current:"#92400e", pending:G[500]})[st];
    const pillBrd = st => ({done:T[100], current:"#fde68a", pending:G[200]})[st];
    const pillLbl = st => ({done:"Complete", current:"In progress", pending:"Pending"})[st];
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } },
      React.createElement("h1", { style:{ fontFamily:serif, fontSize:26, color:T[950], marginBottom:4 } }, "My Journey"),
      React.createElement("p", { style:{ color:G[400], fontSize:13, marginBottom:24 } }, "Track every stage of your medical journey with Praesenti"),
      React.createElement("div", { style:{ ...s.card, background:T[950], border:"none", marginBottom:24 } },
        React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 } },
          React.createElement("div", null,
            React.createElement("div", { style:{ fontSize:11, color:"rgba(255,255,255,.35)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 } }, "Overall progress"),
            React.createElement("div", { style:{ fontFamily:serif, fontSize:22, color:"#fff" } }, doneCount+" of "+stages.length+" stages complete")
          ),
          React.createElement("div", { style:{ textAlign:"right" } },
            React.createElement("div", { style:{ fontFamily:serif, fontSize:34, fontWeight:600, color:T[400] } }, pct+"%"),
            currentIdx>=0 && React.createElement("div", { style:{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 } }, "Currently: "+stages[currentIdx].label)
          )
        ),
        React.createElement("div", { style:{ height:6, background:"rgba(255,255,255,.1)", borderRadius:3, overflow:"hidden" } },
          React.createElement("div", { style:{ height:"100%", width:pct+"%", background:T[400], borderRadius:3, transition:"width .4s" } })
        ),
        React.createElement("div", { style:{ display:"flex", gap:4, marginTop:10 } },
          stages.map((st,i)=>React.createElement("div",{key:i,style:{flex:1,height:3,borderRadius:2,background:st.status==="done"?T[400]:st.status==="current"?"rgba(77,208,200,.5)":"rgba(255,255,255,.1)"}}))
        )
      ),
      React.createElement("div", { style:{ position:"relative" } },
        React.createElement("div", { style:{ position:"absolute", left:19, top:10, bottom:10, width:2, background:G[100], zIndex:0 } }),
        stages.map((st,i)=>React.createElement("div", { key:i, style:{ position:"relative", zIndex:1, display:"flex", gap:18, marginBottom:10 } },
          React.createElement("div", { style:{ width:40, height:40, borderRadius:"50%", background:st.status==="done"?T[500]:st.status==="current"?T[50]:"#fff", border:`2px solid ${st.status==="done"?T[500]:st.status==="current"?T[400]:G[200]}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:4 } },
            st.status==="done" ? React.createElement(Icon,{name:"check",size:16,color:"#fff"}) : st.status==="current" ? React.createElement(Icon,{name:st.icon,size:16,color:T[600]}) : React.createElement("div",{style:{width:10,height:10,borderRadius:"50%",background:G[300]}})
          ),
          React.createElement("div", { style:{ flex:1, ...s.card, marginBottom:0, cursor:"pointer", opacity:st.status==="pending"?.65:1 }, onClick:()=>setExpanded(e=>e===i?null:i), onMouseEnter:e=>{ if(st.status!=="pending")e.currentTarget.style.borderColor=T[300]; }, onMouseLeave:e=>e.currentTarget.style.borderColor=G[200] },
            React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center" } },
              React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:10 } },
                React.createElement("div", { style:{ fontSize:14, fontWeight:500, color:G[900] } }, st.label),
                React.createElement("span", { style:{ fontSize:11, padding:"2px 9px", borderRadius:10, fontWeight:500, background:pillBg(st.status), color:pillClr(st.status), border:`1px solid ${pillBrd(st.status)}` } }, pillLbl(st.status))
              ),
              React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:12 } },
                React.createElement("span", { style:{ fontSize:12, color:G[400] } }, st.date),
                React.createElement("span", { style:{ fontSize:16, color:G[400], display:"inline-block", transition:"transform .2s", transform:expanded===i?"rotate(180deg)":"none" } }, "\u25be")
              )
            ),
            expanded===i && React.createElement("div", { style:{ marginTop:14, paddingTop:14, borderTop:`1px solid ${G[100]}` } },
              React.createElement("div", { style:{ display:"flex", gap:8, marginBottom:10, alignItems:"center" } }, React.createElement(Icon,{name:"person",size:13,color:G[400]}), React.createElement("span",{style:{fontSize:12,color:G[500]}},"Responsible: "+st.responsible)),
              React.createElement("p", { style:{ fontSize:13.5, color:G[600], lineHeight:1.75 } }, st.detail),
              st.status==="current" && React.createElement("button", { onClick:e=>{ e.stopPropagation(); navTo("Teleconsult","teleconsult"); }, style:{ ...s.btnPrimary, marginTop:14, fontSize:12, padding:"8px 18px" } }, "Book follow-up")
            )
          )
        ))
      )
    );
  };

  // ── DEMO care team data ───────────────────────────────────────────────
  const DEMO_CARE_TEAM = {
    surgeon: { name:"Dr. Marcus Varela", specialty:"Plastic & Reconstructive Surgery", clinic:"Bella Forma Clinic", phone:"+1 809 555 0101", email:"varela@bellaforma.com", license:"MED-2019-04", experience:9, langs:"Spanish, English", bio:"Board-certified plastic surgeon with 9 years of experience in aesthetic procedures. Trained in Miami and Santo Domingo.", rating:"4.9", cases:41 },
    coordinator: { name:"Sofia Reyes", role:"Care Coordinator", phone:"+1 809 555 0202", email:"sofia@praesenti.com", langs:"Spanish, English, French" },
    clinic: { name:"Bella Forma Clinic", address:"Av. Abraham Lincoln 705, Piantini", city:"Santo Domingo", phone:"+1 809 555 0300", email:"info@bellaforma.com", specialties:"Plastic Surgery, Aesthetics", langs:"Spanish, English, Portuguese, French" },
    home: { name:"Villa Serena", address:"Piantini, Santo Domingo", rate:"$280/night", amenities:"Pool \u00b7 Private nurse \u00b7 Chef \u00b7 AC \u00b7 WiFi", phone:"+1 809 555 1001", email:"info@villaserena.com" }
  };

  const DEMO_NETWORK = {
    doctors: [
      { name:"Dr. Marcus Varela",    specialty:"Plastic & Reconstructive", clinic:"Bella Forma Clinic",  rating:"4.9", cases:41, langs:"ES, EN",         license:"MED-2019-04", experience:9,  bio:"Board-certified plastic surgeon with 9 years of experience.",           phone:"+1 809 555 0101", email:"varela@bellaforma.com" },
      { name:"Dr. Carlos Romero",    specialty:"Bariatric Surgery",         clinic:"Centro Medico",       rating:"4.8", cases:22, langs:"ES, EN, PT",     license:"MED-2017-11", experience:11, bio:"Specialist in minimally invasive bariatric procedures.",               phone:"+1 809 555 0202", email:"romero@centromedico.com" },
      { name:"Dr. Ivan Castillo",    specialty:"Hair Restoration",          clinic:"Clinica del Sol",     rating:"5.0", cases:30, langs:"ES, EN",         license:"MED-2020-07", experience:7,  bio:"Pioneer of FUE technique in the Dominican Republic.",                  phone:"+1 809 555 0303", email:"castillo@clinicasol.com" },
      { name:"Dr. Ramon Herrera",    specialty:"Dental & Maxillofacial",    clinic:"DentalPro",           rating:"4.9", cases:44, langs:"ES, EN, FR",     license:"MED-2015-03", experience:13, bio:"15 years serving international patients in oral surgery.",             phone:"+1 809 555 0404", email:"herrera@dentalpro.com" }
    ],
    clinics: [
      { name:"Bella Forma Clinic",   address:"Av. Abraham Lincoln 705, Piantini, SD",   specialties:"Plastic Surgery, Aesthetics",  langs:"ES, EN, PT, FR", phone:"+1 809 555 0300", email:"info@bellaforma.com" },
      { name:"Centro Medico",        address:"Av. Independencia 201, Gazcue, SD",       specialties:"Bariatric, General Surgery",   langs:"ES, EN, PT",     phone:"+1 809 555 0400", email:"info@centromedico.com" },
      { name:"Clinica del Sol",      address:"Calle El Sol 12, Punta Cana",             specialties:"Hair Restoration, Aesthetics", langs:"ES, EN",         phone:"+1 809 555 0500", email:"info@clinicasol.com" },
      { name:"DentalPro",            address:"Av. 27 de Febrero 305, Naco, SD",         specialties:"Dental, Maxillofacial",        langs:"ES, EN, FR",     phone:"+1 809 555 0600", email:"info@dentalpro.com" }
    ],
    homes: [
      { name:"Villa Serena",         address:"Piantini, Santo Domingo",   rate:"$280/night", amenities:"Pool, Private nurse, Chef, AC, WiFi",       phone:"+1 809 555 1001", email:"info@villaserena.com",   beds:4, available:2 },
      { name:"Casa Brisa",           address:"Naco, Santo Domingo",       rate:"$220/night", amenities:"Pool, AC, On-call nurse, WiFi",              phone:"+1 809 555 1002", email:"info@casabrisa.com",     beds:6, available:2 },
      { name:"Punta Suites",         address:"Punta Cana",                rate:"$350/night", amenities:"Medical staff 24/7, Full board, Transport",  phone:"+1 809 555 1003", email:"info@puntasuites.com",   beds:8, available:5 },
      { name:"Residencial Sol",      address:"Gazcue, Santo Domingo",     rate:"$160/night", amenities:"Shared cook, Transport, AC, WiFi",           phone:"+1 809 555 1004", email:"info@residencialsol.com",beds:3, available:2 }
    ]
  };

  // ── fetch real network from Supabase ───────────────────────────────────
  const [networkData, setNetworkData] = React.useState(null);
  const [networkLoading, setNetworkLoading] = React.useState(false);

  const fetchNetwork = async () => {
    if (isDemo) return;
    if (!SUPA_URL || !SUPABASE_URL) {
      console.warn("[Network] No valid Supabase URL");
      return;
    }
    setNetworkLoading(true);
    try {
      const headers = { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY };
      const [docsRes, clinicsRes, homesRes] = await Promise.all([
        fetch(`${SUPA_URL}/rest/v1/doctores?select=*`, { headers }).then(r => r.json()),
        fetch(`${SUPA_URL}/rest/v1/clinicas?select=*`, { headers }).then(r => r.json()),
        fetch(`${SUPA_URL}/rest/v1/recovery_homes?select=*`, { headers }).then(r => r.json())
      ]);
      console.log("[Network] doctors:", docsRes, "clinics:", clinicsRes, "homes:", homesRes);
      setNetworkData({
        doctors: Array.isArray(docsRes) ? docsRes : [],
        clinics: Array.isArray(clinicsRes) ? clinicsRes : [],
        homes: Array.isArray(homesRes) ? homesRes : []
      });
    } catch(e) {
      console.error("[Network] fetchNetwork error:", e);
    }
    setNetworkLoading(false);
  };

  React.useEffect(() => {
    console.log("[Network] screen:", screen, "isDemo:", isDemo);
    if (screen === "explore" && !isDemo) fetchNetwork();
  }, [screen]);

  // ── detail view state ──────────────────────────────────────────────────
  const [selectedNetworkItem, setSelectedNetworkItem] = React.useState(null);
  const [networkDetailType, setNetworkDetailType] = React.useState(null); // 'doctor'|'clinic'|'home'
  const [exploreTab, setExploreTab] = React.useState("doctors");

  const openDetail = (item, type) => { setSelectedNetworkItem(item); setNetworkDetailType(type); };
  const closeDetail = () => { setSelectedNetworkItem(null); setNetworkDetailType(null); };

  // ── Hero banner reused by detail screens ──────────────────────────────
  const DetailHero = ({ title, subtitle, tag, initials, onBack, backLabel }) =>
    React.createElement("div", { style:{ background:T[950], padding:"32px 40px 0", position:"relative", overflow:"hidden" } },
      React.createElement("div", { style:{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize:"32px 32px" } }),
      React.createElement("div", { style:{ position:"relative", zIndex:1 } },
        React.createElement("button", { onClick:onBack, style:{ ...s.btnGhost, fontSize:12, padding:"7px 14px", display:"flex", alignItems:"center", gap:6, marginBottom:24, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.7)" } },
          React.createElement(Icon, { name:"arrowLeft", size:13, color:"rgba(255,255,255,.7)" }), backLabel || "Back"
        ),
        React.createElement("div", { style:{ display:"flex", gap:24, alignItems:"flex-end", paddingBottom:32 } },
          React.createElement("div", { style:{ width:100, height:100, borderRadius:"50%", background:T[700], border:"3px solid rgba(255,255,255,.15)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 } },
            React.createElement("div", { style:{ fontFamily:serif, fontSize:32, fontWeight:600, color:T[200] } }, initials),
            React.createElement("div", { style:{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:2 } }, "Photo")
          ),
          React.createElement("div", { style:{ flex:1, paddingBottom:4 } },
            React.createElement("div", { style:{ fontSize:11, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:T[300], marginBottom:6 } }, tag),
            React.createElement("h1", { style:{ fontFamily:serif, fontSize:30, fontWeight:600, color:"#fff", marginBottom:6 } }, title),
            subtitle && React.createElement("div", { style:{ fontSize:14, color:"rgba(255,255,255,.5)" } }, subtitle)
          )
        )
      )
    );

  // ── Doctor detail ──────────────────────────────────────────────────────
  const DoctorDetailScreen = ({ doc, onBack }) => {
    const name    = doc.name || "";
    const spec    = doc.specialty || "";
    const subspec = doc.subspecialty || "";
    const lic     = doc.license || "";
    const exp     = doc.experience_years || doc.experience || "";
    const langs   = Array.isArray(doc.languages) ? doc.languages.join(", ") : (doc.langs||"");
    const procs   = Array.isArray(doc.procedures) ? doc.procedures : [];
    const bio     = doc.bio || "";
    const phone   = doc.phone || "";
    const email   = doc.email || "";
    const clinic  = Array.isArray(doc.clinics) ? doc.clinics.join(", ") : (doc.clinic||"");
    const rating  = doc.rating || "";
    const cases   = doc.total_cases || doc.cases || "";
    const photo   = doc.photo_url || "";
    const initials = name.split(" ").filter(w=>w[0]>="A"&&w[0]<="Z").slice(0,2).map(w=>w[0]).join("");
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, overflowY:"auto" } },
      // Hero
      React.createElement("div", { style:{ background:T[950], padding:"32px 40px 0", position:"relative", overflow:"hidden" } },
        React.createElement("div", { style:{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize:"32px 32px" } }),
        React.createElement("div", { style:{ position:"relative", zIndex:1 } },
          React.createElement("button", { onClick:onBack, style:{ ...s.btnGhost, fontSize:12, padding:"7px 14px", display:"flex", alignItems:"center", gap:6, marginBottom:24, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.7)" } },
            React.createElement(Icon, { name:"arrowLeft", size:13, color:"rgba(255,255,255,.7)" }), "Explore Network"
          ),
          React.createElement("div", { style:{ display:"flex", gap:24, alignItems:"flex-end", paddingBottom:32 } },
            photo
              ? React.createElement("img", { src:photo, alt:name, style:{ width:100, height:100, borderRadius:"50%", objectFit:"cover", border:"3px solid rgba(255,255,255,.15)", flexShrink:0 } })
              : React.createElement("div", { style:{ width:100, height:100, borderRadius:"50%", background:T[700], border:"3px solid rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 } },
                  React.createElement("div", { style:{ fontFamily:serif, fontSize:32, fontWeight:600, color:T[200] } }, initials)
                ),
            React.createElement("div", { style:{ flex:1, paddingBottom:4 } },
              React.createElement("div", { style:{ fontSize:11, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:T[300], marginBottom:6 } }, "Surgeon"),
              React.createElement("h1", { style:{ fontFamily:serif, fontSize:30, fontWeight:600, color:"#fff", marginBottom:6 } }, name),
              React.createElement("div", { style:{ fontSize:14, color:"rgba(255,255,255,.5)" } }, spec+(subspec?" \u00b7 "+subspec:""))
            )
          )
        )
      ),
      React.createElement("div", { style:{ padding:"32px 40px", maxWidth:860 } },
        React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 } },
          [["Rating", rating+" \u2605"], ["Cases", cases+" total"], ["Experience", exp+" years"], ["License", lic]].map(([k,v]) =>
            React.createElement("div", { key:k, style:{ ...s.card, marginBottom:0 } }, React.createElement("div",{style:s.label},k), React.createElement("div",{style:{fontSize:13,fontWeight:500,color:G[900],marginTop:6}},v))
          )
        ),
        React.createElement("div", { style:{ ...s.card, marginBottom:20 } },
          React.createElement("div",{style:{...s.label,marginBottom:8}},"About"),
          React.createElement("p",{style:{fontSize:14,color:G[600],lineHeight:1.8}},bio),
          React.createElement("div",{style:{marginTop:12,fontSize:13,color:G[600]}},[["Languages",langs],["Clinic",clinic]].map(([k,v])=>v&&React.createElement("span",{key:k,style:{marginRight:20}},React.createElement("span",{style:{color:G[400]}},(k+": ")),v)))
        ),
        procs.length > 0 && React.createElement("div", { style:{ ...s.card, marginBottom:20 } },
          React.createElement("div",{style:{...s.label,marginBottom:14}},"Procedures"),
          React.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:8}},
            procs.map((p,i)=>React.createElement("span",{key:i,style:{fontSize:12,padding:"4px 12px",borderRadius:20,background:T[50],color:T[700],border:`1px solid ${T[100]}`}},p))
          )
        ),
        React.createElement("div", { style:s.card },
          React.createElement("div",{style:{...s.label,marginBottom:14}},"Contact"),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}},
            [["Phone",phone],["Email",email]].map(([k,v])=>v&&React.createElement("div",{key:k},React.createElement("div",{style:{fontSize:11,fontWeight:600,color:G[400],letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}},k),React.createElement("div",{style:{fontSize:14,color:G[800]}},v)))
          )
        )
      )
    );
  };

  // ── Clinic detail ──────────────────────────────────────────────────────
  const ClinicDetailScreen = ({ clinic, onBack }) => {
    const name    = clinic.name || "";
    const addr    = clinic.address || (clinic.sector ? clinic.sector+", "+clinic.city : "");
    const specs   = Array.isArray(clinic.specialties) ? clinic.specialties.join(", ") : (clinic.specialties||"");
    const langs   = Array.isArray(clinic.languages) ? clinic.languages.join(", ") : (clinic.langs||"");
    const phone   = clinic.phone || "";
    const email   = clinic.email || "";
    const contact = clinic.contact_name || "";
    const procs   = clinic.procedures ? (Array.isArray(clinic.procedures) ? clinic.procedures : Object.values(clinic.procedures||{})) : [];
    const initials = name.split(" ").filter(w=>w.length>2).slice(0,2).map(w=>w[0]).join("");
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, overflowY:"auto" } },
      React.createElement(DetailHero, { title:name, subtitle:addr, tag:"Clinic", initials, onBack, backLabel:"Explore Network" }),
      React.createElement("div", { style:{ padding:"32px 40px", maxWidth:860 } },
        React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 } },
          [["Specialties",specs],["Languages",langs]].map(([k,v])=>v&&
            React.createElement("div",{key:k,style:{...s.card,marginBottom:0}},React.createElement("div",{style:s.label},k),React.createElement("div",{style:{fontSize:13,fontWeight:500,color:G[900],marginTop:6}},v))
          )
        ),
        procs.length > 0 && React.createElement("div", { style:{ ...s.card, marginBottom:20 } },
          React.createElement("div",{style:{...s.label,marginBottom:14}},"Procedures & Pricing"),
          React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
            procs.map((p,i)=>{
              const pname = typeof p==="string"?p:(p.name||"");
              const price = p.price_from ? "from $"+p.price_from.toLocaleString() : "";
              return React.createElement("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<procs.length-1?`1px solid ${G[100]}`:"none",fontSize:13}},
                React.createElement("span",{style:{color:G[700]}},pname),
                price&&React.createElement("span",{style:{color:T[600],fontWeight:500}},price)
              );
            })
          )
        ),
        React.createElement("div", { style:{ ...s.card, marginBottom:20 } },
          React.createElement("div",{style:{...s.label,marginBottom:14}},"Photo gallery"),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}},
            (Array.isArray(clinic.photos) && clinic.photos.length > 0 ? clinic.photos : []).length > 0
              ? (clinic.photos).map((url,i)=>React.createElement("img",{key:i,src:url,alt:"Clinic photo "+(i+1),style:{width:"100%",aspectRatio:"4/3",objectFit:"cover",borderRadius:10,border:"1px solid "+G[200]}}))
              : [1,2,3,4].map(i=>React.createElement("div",{key:i,style:{aspectRatio:"4/3",borderRadius:10,background:G[100],border:`2px dashed ${G[200]}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}},
                  React.createElement(Icon,{name:"document",size:18,color:G[300]}),
                  React.createElement("span",{style:{fontSize:10,color:G[400]}},"Photo")
                ))
          )
        ),
        React.createElement("div", { style:s.card },
          React.createElement("div",{style:{...s.label,marginBottom:14}},"Contact"),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}},
            [["Phone",phone],["Email",email],contact&&["Contact",contact]].filter(Boolean).map(([k,v])=>
              React.createElement("div",{key:k},React.createElement("div",{style:{fontSize:11,fontWeight:600,color:G[400],letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}},k),React.createElement("div",{style:{fontSize:14,color:G[800]}},v))
            )
          )
        )
      )
    );
  };

  // ── Home detail ────────────────────────────────────────────────────────
  const HomeDetailScreen = ({ home, onBack }) => {
    const name  = home.name || "";
    const addr  = home.address || "";
    const rate  = home.rate || home.nightly_rate || "";
    const amen  = Array.isArray(home.amenities) ? home.amenities.join(", ") : (home.amenities||"");
    const phone = home.phone || "";
    const email = home.email || "";
    const beds  = home.beds || home.total_beds || "";
    const avail = home.available !== undefined ? home.available : (home.available_beds||"");
    const initials = name.split(" ").filter(w=>w.length>2).slice(0,2).map(w=>w[0]).join("");
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, overflowY:"auto" } },
      React.createElement(DetailHero, { title:name, subtitle:addr, tag:"Recovery Home", initials, onBack, backLabel:"Explore Network" }),
      React.createElement("div", { style:{ padding:"32px 40px", maxWidth:860 } },
        React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 } },
          [["Rate",rate],["Total beds",beds],["Available",avail]].filter(([,v])=>v!=="").map(([k,v])=>
            React.createElement("div",{key:k,style:{...s.card,marginBottom:0}},React.createElement("div",{style:s.label},k),React.createElement("div",{style:{fontFamily:serif,fontSize:22,fontWeight:600,color:T[700],marginTop:6}},v))
          )
        ),
        amen && React.createElement("div", { style:{ ...s.card, marginBottom:20 } },
          React.createElement("div",{style:{...s.label,marginBottom:12}},"Amenities"),
          React.createElement("p",{style:{fontSize:14,color:G[600],lineHeight:1.8}},amen)
        ),
        React.createElement("div", { style:{ ...s.card, marginBottom:20 } },
          React.createElement("div",{style:{...s.label,marginBottom:14}},"Photos"),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}},
            [1,2,3,4].map(i=>React.createElement("div",{key:i,style:{aspectRatio:"4/3",borderRadius:10,background:G[100],border:`2px dashed ${G[200]}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}},
              React.createElement(Icon,{name:"home",size:18,color:G[300]}),
              React.createElement("span",{style:{fontSize:10,color:G[400]}},"Photo")
            ))
          )
        ),
        React.createElement("div", { style:s.card },
          React.createElement("div",{style:{...s.label,marginBottom:14}},"Contact"),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}},
            [["Phone",phone],["Email",email]].filter(([,v])=>v).map(([k,v])=>
              React.createElement("div",{key:k},React.createElement("div",{style:{fontSize:11,fontWeight:600,color:G[400],letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}},k),React.createElement("div",{style:{fontSize:14,color:G[800]}},v))
            )
          )
        )
      )
    );
  };

  // ── CareTeamScreen ─────────────────────────────────────────────────────
  const CareTeamScreen = () => {
    const team = isDemo ? DEMO_CARE_TEAM : null;

    // if viewing detail of a team member
    if (selectedNetworkItem) {
      if (networkDetailType==="doctor")  return React.createElement(DoctorDetailScreen, { doc:selectedNetworkItem,    onBack:closeDetail });
      if (networkDetailType==="clinic")  return React.createElement(ClinicDetailScreen, { clinic:selectedNetworkItem, onBack:closeDetail });
      if (networkDetailType==="home")    return React.createElement(HomeDetailScreen,   { home:selectedNetworkItem,   onBack:closeDetail });
    }

    if (!team) return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } },
      React.createElement("h1",{style:{fontFamily:serif,fontSize:26,color:T[950],marginBottom:4}},"My Care Team"),
      React.createElement("p",{style:{color:G[400],fontSize:13,marginBottom:32}},"Your assigned team will appear here once your case is confirmed."),
      React.createElement("div",{style:{...s.card,textAlign:"center",padding:"60px 40px"}},
        React.createElement("div",{style:{width:64,height:64,borderRadius:"50%",background:G[100],display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}},React.createElement(Icon,{name:"users",size:28,color:G[400]})),
        React.createElement("h3",{style:{fontSize:18,fontWeight:600,color:G[900],marginBottom:8}},"No team assigned yet"),
        React.createElement("p",{style:{fontSize:14,color:G[500],maxWidth:360,margin:"0 auto 24px",lineHeight:1.7}},"Once your procedure is confirmed, your dedicated surgeon, coordinator and recovery home will appear here."),
        React.createElement("button",{onClick:()=>navTo("Explore Network","explore"),style:{...s.btnPrimary,fontSize:13,padding:"10px 24px"}},"Explore our network")
      )
    );

    const Section = ({ title, children }) => React.createElement("div",{style:{marginBottom:24}},
      React.createElement("div",{style:{...s.label,marginBottom:12}},title), children
    );

    // build objects compatible with detail screens
    const surgeonObj = { name:team.surgeon.name, specialty:team.surgeon.specialty, license:team.surgeon.license, experience:team.surgeon.experience, langs:team.surgeon.langs, bio:team.surgeon.bio, clinic:team.surgeon.clinic, phone:team.surgeon.phone, email:team.surgeon.email, rating:"4.9", cases:41, procedures:["Rhinoplasty","Breast Augmentation","Liposuction","Facelift"] };
    const clinicObj  = { name:team.clinic.name,  address:team.clinic.address, city:team.clinic.city, specialties:team.clinic.specialties, langs:team.clinic.langs, phone:team.clinic.phone, email:team.clinic.email };
    const homeObj    = { name:team.home.name,    address:team.home.address, rate:team.home.rate, amenities:team.home.amenities, phone:team.home.phone, email:team.home.email, beds:4, available:2 };

    const ViewBtn = ({ onClick }) => React.createElement("button",{ onClick, style:{ ...s.btnGhost, fontSize:12, padding:"7px 14px", flexShrink:0, display:"flex", alignItems:"center", gap:5 } },
      "View profile", React.createElement(Icon,{name:"arrowLeft",size:12,color:G[500],style:{transform:"rotate(180deg)"}})
    );

    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } },
      React.createElement("h1",{style:{fontFamily:serif,fontSize:26,color:T[950],marginBottom:4}},"My Care Team"),
      React.createElement("p",{style:{color:G[400],fontSize:13,marginBottom:28}},"Your dedicated team for this procedure — click any card to see the full profile"),
      React.createElement(Section, { title:"Your Surgeon" },
        React.createElement("div",{style:{...s.card,display:"flex",gap:20,alignItems:"flex-start",cursor:"pointer"},onClick:()=>openDetail(surgeonObj,"doctor"),onMouseEnter:e=>e.currentTarget.style.borderColor=T[300],onMouseLeave:e=>e.currentTarget.style.borderColor=G[200]},
          React.createElement("div",{style:{width:56,height:56,borderRadius:"50%",background:T[800],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:serif,fontSize:20,fontWeight:600,color:T[200],flexShrink:0}},"MV"),
          React.createElement("div",{style:{flex:1}},
            React.createElement("div",{style:{fontSize:15,fontWeight:600,color:G[900],marginBottom:2}},team.surgeon.name),
            React.createElement("div",{style:{fontSize:13,color:G[500],marginBottom:8}},team.surgeon.specialty+" \u00b7 "+team.surgeon.clinic),
            React.createElement("p",{style:{fontSize:13,color:G[600],lineHeight:1.7,marginBottom:12}},team.surgeon.bio),
            React.createElement("div",{style:{display:"flex",gap:16,fontSize:12,color:G[500]}},
              React.createElement("span",null,team.surgeon.experience+" yrs experience"),
              React.createElement("span",null,"License: "+team.surgeon.license),
              React.createElement("span",null,team.surgeon.langs)
            )
          ),
          React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8,flexShrink:0}},
            React.createElement("button",{onClick:e=>{e.stopPropagation();navTo("Teleconsult","teleconsult");},style:{...s.btnPrimary,fontSize:12,padding:"8px 16px"}},"Book visit"),
            React.createElement(ViewBtn,{onClick:e=>{e.stopPropagation();openDetail(surgeonObj,"doctor");}})
          )
        )
      ),
      React.createElement(Section, { title:"Your Clinic" },
        React.createElement("div",{style:{...s.card,display:"flex",gap:20,alignItems:"flex-start",cursor:"pointer"},onClick:()=>openDetail(clinicObj,"clinic"),onMouseEnter:e=>e.currentTarget.style.borderColor=T[300],onMouseLeave:e=>e.currentTarget.style.borderColor=G[200]},
          React.createElement("div",{style:{width:56,height:56,borderRadius:12,background:T[100],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:serif,fontSize:20,fontWeight:600,color:T[700],flexShrink:0}},"BF"),
          React.createElement("div",{style:{flex:1}},
            React.createElement("div",{style:{fontSize:15,fontWeight:600,color:G[900],marginBottom:2}},team.clinic.name),
            React.createElement("div",{style:{fontSize:13,color:G[500],marginBottom:8}},team.clinic.address+", "+team.clinic.city),
            React.createElement("div",{style:{display:"flex",gap:16,fontSize:12,color:G[500]}},
              React.createElement("span",null,team.clinic.specialties),
              React.createElement("span",null,"Languages: "+team.clinic.langs)
            )
          ),
          React.createElement(ViewBtn,{onClick:e=>{e.stopPropagation();openDetail(clinicObj,"clinic");}})
        )
      ),
      React.createElement(Section, { title:"Your Recovery Home" },
        React.createElement("div",{style:{...s.card,display:"flex",gap:20,alignItems:"flex-start",cursor:"pointer"},onClick:()=>openDetail(homeObj,"home"),onMouseEnter:e=>e.currentTarget.style.borderColor=T[300],onMouseLeave:e=>e.currentTarget.style.borderColor=G[200]},
          React.createElement("div",{style:{width:56,height:56,borderRadius:12,background:G[100],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},React.createElement(Icon,{name:"home",size:24,color:G[500]})),
          React.createElement("div",{style:{flex:1}},
            React.createElement("div",{style:{fontSize:15,fontWeight:600,color:G[900],marginBottom:2}},team.home.name),
            React.createElement("div",{style:{fontSize:13,color:G[500],marginBottom:8}},team.home.address+" \u00b7 "+team.home.rate),
            React.createElement("div",{style:{fontSize:12,color:G[500]}},team.home.amenities)
          ),
          React.createElement(ViewBtn,{onClick:e=>{e.stopPropagation();openDetail(homeObj,"home");}})
        )
      ),
      React.createElement(Section, { title:"Your Coordinator" },
        React.createElement("div",{style:{...s.card,display:"flex",gap:20,alignItems:"center"}},
          React.createElement("div",{style:{width:56,height:56,borderRadius:"50%",background:G[200],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:serif,fontSize:20,fontWeight:600,color:G[600],flexShrink:0}},"SR"),
          React.createElement("div",{style:{flex:1}},
            React.createElement("div",{style:{fontSize:15,fontWeight:600,color:G[900],marginBottom:2}},team.coordinator.name),
            React.createElement("div",{style:{fontSize:13,color:G[500],marginBottom:4}},team.coordinator.role),
            React.createElement("div",{style:{fontSize:12,color:G[500]}},team.coordinator.langs)
          ),
          React.createElement("button",{onClick:()=>navTo("Messages","case","messages"),style:{...s.btnGhost,fontSize:12,padding:"8px 16px"}},"Send message")
        )
      )
    );
  };

  // ── ExploreNetworkScreen ───────────────────────────────────────────────
  const ExploreNetworkScreen = () => {
    if (selectedNetworkItem) {
      if (networkDetailType==="doctor")  return React.createElement(DoctorDetailScreen, { doc:selectedNetworkItem, onBack:closeDetail });
      if (networkDetailType==="clinic")  return React.createElement(ClinicDetailScreen, { clinic:selectedNetworkItem, onBack:closeDetail });
      if (networkDetailType==="home")    return React.createElement(HomeDetailScreen,   { home:selectedNetworkItem, onBack:closeDetail });
    }
    const data = isDemo ? DEMO_NETWORK : (networkData || { doctors:[], clinics:[], homes:[] });
    const tabs = [["doctors","Surgeons"],["clinics","Clinics"],["homes","Recovery Homes"]];
    const CardBtn = ({ onClick }) => React.createElement("button",{onClick,style:{...s.btnGhost,fontSize:12,padding:"6px 14px",display:"flex",alignItems:"center",gap:5}},React.createElement(Icon,{name:"arrowLeft",size:12,color:G[500],style:{transform:"rotate(180deg)"}}), "View");
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } },
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}},
        React.createElement("div",null,
          React.createElement("h1",{style:{fontFamily:serif,fontSize:26,color:T[950],marginBottom:4}},"Explore Network"),
          React.createElement("p",{style:{color:G[400],fontSize:13}},"Board-certified surgeons, accredited clinics and recovery homes in Santo Domingo")
        ),
        !isDemo && React.createElement("button",{onClick:fetchNetwork,style:{...s.btnGhost,fontSize:12,padding:"8px 14px"}},networkLoading?"Loading...":"Refresh")
      ),
      React.createElement("div",{style:{display:"flex",gap:4,marginBottom:24,background:G[100],borderRadius:10,padding:4,width:"fit-content"}},
        tabs.map(([key,label])=>React.createElement("button",{key,onClick:()=>setExploreTab(key),style:{padding:"8px 20px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:500,background:exploreTab===key?"#fff":  "transparent",color:exploreTab===key?G[900]:G[500],boxShadow:exploreTab===key?"0 1px 4px rgba(0,0,0,.1)":"none",fontFamily:sans}},label))
      ),
      exploreTab==="doctors" && React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:12}},
        data.doctors.length===0
          ? React.createElement("div",{style:{...s.card,textAlign:"center",padding:"48px 20px",color:G[400]}},"No surgeons listed yet")
          : data.doctors.map((doc,i)=>React.createElement("div",{key:i,style:{...s.card,display:"flex",alignItems:"center",gap:16}},
              React.createElement("div",{style:{width:48,height:48,borderRadius:"50%",background:T[800],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:serif,fontSize:18,fontWeight:600,color:T[200],flexShrink:0}},
                (doc.name||"").split(" ").filter(w=>w[0]>="A"&&w[0]<="Z").slice(0,2).map(w=>w[0]).join("")
              ),
              React.createElement("div",{style:{flex:1}},
                React.createElement("div",{style:{fontSize:14,fontWeight:600,color:G[900]}},(doc.name||"")),
                React.createElement("div",{style:{fontSize:12,color:G[500],marginTop:2}},(doc.specialty||"")+((Array.isArray(doc.clinics)?doc.clinics[0]:doc.clinic)?" \u00b7 "+(Array.isArray(doc.clinics)?doc.clinics[0]:doc.clinic):"")),
                React.createElement("div",{style:{fontSize:11,color:G[400],marginTop:2}},"Languages: "+(Array.isArray(doc.languages)?doc.languages.join(", "):(doc.langs||"")))
              ),
              React.createElement("div",{style:{textAlign:"right",flexShrink:0,marginRight:8}},
                React.createElement("div",{style:{fontSize:13,fontWeight:600,color:T[600]}},doc.rating||"","",doc.rating?" \u2605":""),
                React.createElement("div",{style:{fontSize:11,color:G[400]}},(doc.total_cases||doc.cases||0)+" cases")
              ),
              React.createElement(CardBtn,{onClick:()=>openDetail(doc,"doctor")})
            ))
      ),
      exploreTab==="clinics" && React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:12}},
        data.clinics.length===0
          ? React.createElement("div",{style:{...s.card,textAlign:"center",padding:"48px 20px",color:G[400]}},"No clinics listed yet")
          : data.clinics.map((clinic,i)=>React.createElement("div",{key:i,style:{...s.card,display:"flex",alignItems:"center",gap:16}},
              React.createElement("div",{style:{width:48,height:48,borderRadius:12,background:T[100],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:serif,fontSize:18,fontWeight:600,color:T[700],flexShrink:0}},
                (clinic.name||"").split(" ").filter(w=>w.length>2).slice(0,2).map(w=>w[0]).join("")
              ),
              React.createElement("div",{style:{flex:1}},
                React.createElement("div",{style:{fontSize:14,fontWeight:600,color:G[900]}},(clinic.name||"")),
                React.createElement("div",{style:{fontSize:12,color:G[500],marginTop:2}},(clinic.city||clinic.sector||"")+((clinic.address&&!clinic.city)?", "+clinic.address:"")),
                React.createElement("div",{style:{fontSize:11,color:G[400],marginTop:2}},(Array.isArray(clinic.specialties)?clinic.specialties.join(", "):(clinic.specialties||"")))
              ),
              React.createElement(CardBtn,{onClick:()=>openDetail(clinic,"clinic")})
            ))
      ),
      exploreTab==="homes" && React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}},
        data.homes.length===0
          ? React.createElement("div",{style:{...s.card,textAlign:"center",padding:"48px 20px",color:G[400],gridColumn:"1/-1"}},"No recovery homes listed yet")
          : data.homes.map((home,i)=>React.createElement("div",{key:i,style:s.card},
              React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}},
                React.createElement("div",null,
                  React.createElement("div",{style:{fontSize:15,fontWeight:600,color:G[900],fontFamily:serif}},(home.name||"")),
                  React.createElement("div",{style:{fontSize:12,color:G[400],marginTop:2}},(home.address||""))
                ),
                React.createElement("span",{style:{fontSize:13,fontWeight:600,color:T[600]}},(home.rate||home.nightly_rate||""))
              ),
              React.createElement("div",{style:{fontSize:11,color:G[500],marginBottom:12}},(Array.isArray(home.amenities)?home.amenities.join(", "):(home.amenities||""))),
              React.createElement("button",{onClick:()=>openDetail(home,"home"),style:{...s.btnGhost,fontSize:12,padding:"7px 14px",width:"100%"}},"View details")
            ))
      )
    );
  };

  // ── Notificaciones del paciente ──────────────────────────────────────────
  const [notifications, setNotifications] = useState(isDemo ? [
    { id: 1, type: "heart", title: "Coordinator assigned", body: "Laura Mendez has been assigned as your care coordinator.", time: "2 hours ago", read: false },
    { id: 2, type: "document", title: "New document", body: "Your pre-op instructions have been uploaded.", time: "1 day ago", read: false },
    { id: 3, type: "video", title: "Teleconsult reminder", body: "Your initial consultation is tomorrow at 10:00 AM.", time: "2 days ago", read: true },
    { id: 4, type: "check", title: "Checklist updated", body: "Your recovery checklist has been updated.", time: "3 days ago", read: true }
  ] : []);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const markRead = id => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));

  const NotifBell = () => React.createElement("div", { style: { position: "relative" } },
    React.createElement("button", { onClick: () => setNotifOpen(o => !o), style: { background: "none", border: `1px solid ${G[200]}`, borderRadius: 8, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" } },
      React.createElement(Icon, { name: "alertCircle", size: 18, color: unreadCount > 0 ? T[600] : G[400] }),
      unreadCount > 0 && React.createElement("span", { style: { position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: T[500], color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" } }, unreadCount)
    ),
    notifOpen && React.createElement("div", { style: { position: "absolute", right: 0, top: 46, width: 320, background: "#fff", border: `1px solid ${G[200]}`, borderRadius: 12, zIndex: 200, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,.1)" } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${G[100]}` } },
        React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: G[900] } }, "Notifications"),
        unreadCount > 0 && React.createElement("button", { onClick: () => setNotifications(ns => ns.map(n => ({ ...n, read: true }))), style: { fontSize: 11, color: T[600], background: "none", border: "none", cursor: "pointer", fontFamily: sans } }, "Mark all read")
      ),
      React.createElement("div", { style: { maxHeight: 320, overflowY: "auto" } },
        notifications.map(n => React.createElement("div", { key: n.id, onClick: () => { markRead(n.id); setNotifOpen(false); }, style: { display: "flex", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${G[100]}`, cursor: "pointer", background: n.read ? "#fff" : T[50] } },
          React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: n.read ? G[100] : T[100], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 } },
            React.createElement(Icon, { name: n.type, size: 14, color: n.read ? G[400] : T[600] })
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

  return React.createElement("div", { style: { fontFamily: sans, background: G[50], minHeight: "100vh", display: "flex", flexDirection: "column" } },
    React.createElement(Wizard, { open: dashWizOpen, user: user, onClose: () => setDashWizOpen(false) }),
    toast && React.createElement(Toast, { msg: toast, onDone: () => setToast(null) }),
    React.createElement("div", { className: "sidebar-overlay" + (sidebarOpen ? " open" : ""), onClick: () => setSidebarOpen(false) }),
    React.createElement("div", { className: "dash-header", style: { height: 60, background: "#fff", borderBottom: `1px solid ${G[200]}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
        screen !== "onboarding" && React.createElement("button", { className: "mobile-menu-btn", onClick: () => setSidebarOpen(o => !o) }, React.createElement(Icon, { name: "menu", size: 22, color: G[800] })),
        React.createElement("div", { style: { fontFamily: serif, fontSize: 19, fontWeight: 600, color: T[900], letterSpacing: "0.06em", textTransform: "uppercase" } }, "Praes", React.createElement("span", { style: { color: T[500] } }, "enti"))
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16 } },
        React.createElement(NotifBell, null),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: G[700] } },
          React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T[700], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 14, fontWeight: 600, color: T[200] } }, initials),
          React.createElement("span", { className: "col-hide-xs" }, fullName)
        ),
        React.createElement("button", { onClick: onSignOut, style: { ...s.btnGhost, padding: "6px 14px", fontSize: 12 } }, "Sign out")
      )
    ),

    React.createElement("div", { style: { display: "flex", flex: 1, overflow: "hidden" } },
      screen !== "onboarding" && React.createElement(Sidebar, null),
      React.createElement("div", { style: { flex: 1, overflowY: "auto", minWidth: 0, background: G[50] } },
        screen === "overview" && Overview(),
        screen === "case" && CaseDetail(),
        screen === "onboarding" && React.createElement(OnboardingScreen, null),
        screen === "timeline" && React.createElement(LiveTimelineScreen, null),
        screen === "teleconsult" && TeleconsultScreen(),
        screen === "profile" && ProfileScreen({ profileForm, setProfileForm, profileSaved, setProfileSaved, showToast }),
        screen === "payments" && PaymentsScreen(),
        screen === "careteam" && React.createElement(CareTeamScreen, null),
        screen === "explore" && React.createElement(ExploreNetworkScreen, null)
      )
    ),
    React.createElement(CheckoutModal, { open: payModalOpen, payment: selectedPayment, onClose: () => setPayModalOpen(false), onSuccess: () => { showToast("Payment received!"); fetchPayments(); } })
  );
};
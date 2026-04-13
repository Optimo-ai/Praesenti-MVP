import { T, G, serif, sans, s } from '../constants.js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';
import { HamburgerIcon, Icon, SPill, Toast, Modal } from './shared.js';

const { React } = window;
const { useState, useEffect, useRef } = React;

// ── DEMO DATA ─────────────────────────────────────────────────────────────
const DEMO_NURSE_PROFILE = {
  name: "Ana Reyes", license: "RN-8821", specialization: "Post-op", shift: "Day",
  languages: ["Español", "Inglés"], certifications: ["RN", "BLS", "ACLS"],
  rating: "4.9", cases_active: 3, recovery_homes: ["Villa Serena", "Casa Brisa"],
  phone: "+1 809 555 3001", email: "ana@praesenti.com",
  bio: "Enfermera especializada en cuidados post-operatorios con 8 años de experiencia en cirugía plástica y bariátrica."
};

const DEMO_NURSE_CASES = [
  { id:"C-001", patient:"Emily Thornton",  proc:"Rhinoplasty", home:"Villa Serena", day_postop:8, coord:"Laura Mendez", status:"Stable" },
  { id:"C-003", patient:"Isabelle Fontaine",proc:"Breast Aug.", home:"Villa Serena", day_postop:2, coord:"Carlos Vega",  status:"Needs attention" },
  { id:"C-005", patient:"Hanna Bergström",  proc:"Tummy Tuck",  home:"Casa Brisa",   day_postop:1, coord:"Laura Mendez", status:"Stable" }
];

const DEMO_CARE_NOTES = [
  { id:"n1", case_id:"C-001", type:"Vital signs", text:"BP 118/76, Temp 36.8°C, HR 72bpm. Patient resting comfortably.", time:"08:30", date:"Today", temp:"36.8", bp:"118/76", hr:"72" },
  { id:"n2", case_id:"C-003", type:"Wound check", text:"Slight redness around incision site. Cleaned and re-dressed. Notified coordinator.", time:"10:15", date:"Today", temp:"", bp:"", hr:"" },
  { id:"n3", case_id:"C-001", type:"Medication",  text:"Administered prescribed analgesic (Ketorolac 30mg IV) as scheduled.", time:"06:00", date:"Today", temp:"", bp:"", hr:"" },
  { id:"n4", case_id:"C-005", type:"General",     text:"Patient arrived at recovery home. Initial assessment completed. Stable vitals.", time:"18:00", date:"Yesterday", temp:"36.9", bp:"120/80", hr:"68" }
];

const DEMO_INVENTORY = [
  { id:"i1", home:"Villa Serena", name:"Ketorolac 30mg", qty:15, unit:"ampoules", status:"OK" },
  { id:"i2", home:"Villa Serena", name:"Cephalexin 500mg", qty:4, unit:"capsules", status:"Low stock" },
  { id:"i3", home:"Casa Brisa",   name:"Tramadol 50mg", qty:20, unit:"tablets", status:"OK" },
  { id:"i4", home:"Villa Serena", name:"Gauze Pads 4x4", qty:50, unit:"packs", status:"OK" },
  { id:"i5", home:"Casa Brisa",   name:"Lidocaine 2%", qty:2, unit:"vials", status:"Low stock" }
];

const DEMO_MESSAGES = [
  { side:"them", text:"Hola Ana, ¿cómo está el paciente C-003 esta mañana?", time:"09:50", date:"Today", from:"Laura Mendez" },
  { side:"me",   text:"Hay leve enrojecimiento en la incisión. Ya lo limpié y notifiqué. Lo monitoreo cada hora.", time:"10:20", date:"Today" },
  { side:"them", text:"Perfecto, gracias. Si empeora avísame de inmediato.", time:"10:22", date:"Today", from:"Laura Mendez" }
];

const DEMO_COORDS = [
  { id: "coord1", name: "Laura Mendez", role: "Care Coordinator" },
  { id: "coord2", name: "Carlos Vega", role: "Care Coordinator" }
];

// ── COMPONENT ─────────────────────────────────────────────────────────────
export const NurseDashboard = ({ onSignOut, user }) => {
  const firstName  = user?.fn || "Ana";
  const lastName   = user?.ln || "Reyes";
  const fullName   = `${firstName} ${lastName}`.trim() || "Nurse";
  const initials   = `${firstName[0]||""}${lastName[0]||""}`.toUpperCase() || "N";
  const isDemo     = !!user?.isDemo;

  const [screen, setScreen] = useState("overview");
  const [sidebarItem, setSidebarItem] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Supabase State
  const [nurseProfile, setNurseProfile] = useState(null);
  const [dbCases, setDbCases] = useState([]);
  const [dbNotes, setDbNotes] = useState([]);
  const [dbCoords, setDbCoords] = useState([]);
  const [dbInventory, setDbInventory] = useState([]);

  // Derived Active Data
  const myCases   = isDemo ? DEMO_NURSE_CASES : dbCases;
  const careNotes = isDemo ? DEMO_CARE_NOTES : dbNotes;
  const profile   = isDemo ? DEMO_NURSE_PROFILE : nurseProfile;
  const inventory = isDemo ? DEMO_INVENTORY : dbInventory;
  const coords    = isDemo ? DEMO_COORDS : dbCoords;

  // Messages
  const [msgs, setMsgs] = useState(isDemo ? DEMO_MESSAGES : []);

  // Notes Modal
  const [noteModal, setNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ case_id:"", type:"General", text:"", temp:"", bp:"", hr:"" });

  // Profile Form
  const [profileForm, setProfileForm] = useState(() => {
    if (isDemo && user?.id) {
      const saved = localStorage.getItem("nurse_profile_" + user.id);
      if (saved) try { return JSON.parse(saved); } catch(e) {}
    }
    return { fn: firstName, ln: lastName, phone: profile?.phone||"", bio: profile?.bio||"", shift: profile?.shift||"Day", langs: profile?.languages||[] };
  });

  const [expandedCase, setExpandedCase] = useState(null);

  useEffect(() => {
    if (isDemo || !user?.id) return;
    const h = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY };
    const base = SUPABASE_URL + "/rest/v1";
    
    fetch(`${base}/nurses?auth_user_id=eq.${user.id}&select=*`, { headers: h })
      .then(r => r.ok ? r.json() : []).then(rows => { if (rows[0]) setNurseProfile(rows[0]); }).catch(()=>{});
    
    fetch(`${base}/nurse_cases?nurse_id=eq.${user.id}&select=*,caso(*)`, { headers: h })
      .then(r => r.ok ? r.json() : []).then(rows => setDbCases(rows.map(r => r.caso).filter(Boolean))).catch(()=>{});
    
    fetch(`${base}/care_notes?nurse_id=eq.${user.id}&select=*&order=created_at.desc`, { headers: h })
      .then(r => r.ok ? r.json() : []).then(rows => setDbNotes(rows)).catch(()=>{});
      
    fetch(`${base}/coordinadores?select=*&status=eq.Active`, { headers: h })
      .then(r => r.ok ? r.json() : []).then(rows => setDbCoords(rows)).catch(()=>{});
      
    // If you add an inventory table in the future, fetch it here.
  }, [user?.id, isDemo]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  
  const navTo = (item, scr) => {
    setSidebarItem(item);
    setScreen(scr);
    setSidebarOpen(false);
  };

  // ─── UI HELPERS ─────────────────────────────────────────────────────────
  const NurseStat = ({ label, value, color, icon }) => React.createElement("div", { style: { ...s.card, marginBottom: 0 } },
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } },
      React.createElement("div", { style: s.label }, label),
      React.createElement(Icon, { name: icon, size: 14, color })
    ),
    React.createElement("div", { style: { fontFamily: serif, fontSize: 32, fontWeight: 600, color } }, value)
  );

  const EmptyState = ({ icon, title, text }) => React.createElement("div", { style: { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 12, border: `1px dashed ${G[300]}` } },
    React.createElement("div", { style: { width: 48, height: 48, borderRadius: "50%", background: G[50], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" } }, React.createElement(Icon, { name: icon, size: 22, color: G[400] })),
    React.createElement("h3", { style: { fontSize: 16, fontWeight: 600, color: G[900], marginBottom: 6 } }, title),
    React.createElement("p", { style: { fontSize: 13.5, color: G[500], maxWidth: 300, margin: "0 auto", lineHeight: 1.5 } }, text)
  );

  // ─── SCREENS ────────────────────────────────────────────────────────────
  const OverviewScreen = () => {
    const active = myCases.length;
    const stable = myCases.filter(c => c.status === "Stable").length;
    const attention = myCases.filter(c => c.status === "Needs attention").length;
    const attentionColor = attention > 0 ? "#dc2626" : G[500];

    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("div", { style: { background: T[950], borderRadius: 16, padding: "32px", marginBottom: 24, position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", top: -20, right: -20, opacity: 0.05 } }, React.createElement(Icon, { name: "heart", size: 180, color: "#fff" })),
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 } },
          React.createElement("div", null,
            React.createElement("h1", { style: { fontFamily: serif, fontSize: 28, color: "#fff", marginBottom: 8 } }, "Good morning, " + firstName),
            React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center" } },
              React.createElement("span", { style: { fontSize: 12, padding: "3px 10px", borderRadius: 10, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.2)" } }, (profile?.shift || "Day") + " Shift"),
              React.createElement("span", { style: { fontSize: 12, color: T[300] } }, (profile?.recovery_homes || []).join(" • "))
            )
          )
        )
      ),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(NurseStat, { label: "Active Cases", value: active, color: T[700], icon: "users" }),
        React.createElement(NurseStat, { label: "Stable Patients", value: stable, color: T[500], icon: "check" }),
        React.createElement(NurseStat, { label: "Needs Attention", value: attention, color: attentionColor, icon: "alertCircle" })
      ),
      React.createElement("div", { style: s.card },
        React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Today's Patients"),
        myCases.length === 0 ? React.createElement(EmptyState, { icon: "users", title: "No patients today", text: "You have no patients assigned for this shift." }) :
        React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } },
          React.createElement("thead", null, React.createElement("tr", { style: { textAlign: "left", borderBottom: `1px solid ${G[200]}` } },
            ["Patient", "Procedure", "Location", "Day Post-op", "Status"].map(h => React.createElement("th", { key: h, style: { paddingBottom: 10, fontWeight: 600, color: G[500] } }, h))
          )),
          React.createElement("tbody", null, myCases.map(c => React.createElement("tr", { key: c.id, style: { borderBottom: `1px solid ${G[100]}`, cursor: "pointer" }, onClick: () => navTo("My Cases", "cases") },
            React.createElement("td", { style: { padding: "12px 0", fontWeight: 500, color: G[900] } }, c.patient),
            React.createElement("td", { style: { padding: "12px 8px", color: G[600] } }, c.proc),
            React.createElement("td", { style: { padding: "12px 8px", color: G[600] } }, c.home),
            React.createElement("td", { style: { padding: "12px 8px", color: G[600] } }, "Day " + c.day_postop),
            React.createElement("td", { style: { padding: "12px 8px" } },
              React.createElement("span", { style: { fontSize: 11, padding: "2px 8px", borderRadius: 10, background: c.status === "Stable" ? T[50] : "#fef2f2", color: c.status === "Stable" ? T[700] : "#dc2626", border: `1px solid ${c.status === "Stable" ? T[100] : "#fca5a5"}` } }, c.status)
            )
          )))
        )
      )
    );
  };

  const MyCasesScreen = () => {
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "My Cases"),
      React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 24 } }, "Detailed view of your assigned patients"),
      myCases.length === 0 ? React.createElement(EmptyState, { icon: "clipboard", title: "No cases assigned yet", text: "Cases will appear here once assigned by your administrator." }) :
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
        myCases.map(c => {
          const isExpanded = expandedCase === c.id;
          const cNotes = careNotes.filter(n => n.case_id === c.id);
          return React.createElement("div", { key: c.id, style: { ...s.card, marginBottom: 0, padding: "18px 24px" } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
              React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: G[900], marginBottom: 4 } }, c.patient),
                React.createElement("div", { style: { fontSize: 13, color: G[500] } }, `${c.proc} • ${c.home} • Day ${c.day_postop} of recovery`)
              ),
              React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, background: c.status === "Stable" ? T[50] : "#fef2f2", color: c.status === "Stable" ? T[700] : "#dc2626", border: `1px solid ${c.status === "Stable" ? T[100] : "#fca5a5"}` } }, c.status),
                React.createElement("button", { onClick: () => navTo("Messages", "messages"), style: { ...s.btnGhost, fontSize: 12, padding: "6px 12px" } }, "Message Coord."),
                React.createElement("button", { onClick: () => setExpandedCase(isExpanded ? null : c.id), style: { ...s.btnPrimary, fontSize: 12, padding: "6px 14px" } }, isExpanded ? "Hide details" : "View details")
              )
            ),
            isExpanded && React.createElement("div", { style: { marginTop: 20, paddingTop: 20, borderTop: `1px solid ${G[100]}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 } },
              React.createElement("div", null,
                React.createElement("div", { style: { ...s.label, marginBottom: 12 } }, "Daily Tasks"),
                ["Morning vitals", "Wound check", "Medication administered", "Evening vitals"].map((task, i) => React.createElement("label", { key: i, style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 13, color: G[700], cursor: "pointer" } },
                  React.createElement("input", { type: "checkbox", style: { accentColor: T[500], width: 16, height: 16 } }), task
                ))
              ),
              React.createElement("div", null,
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
                  React.createElement("div", { style: s.label }, "Recent Care Notes"),
                  React.createElement("button", { onClick: () => { setNoteForm(f => ({...f, case_id: c.id})); setNoteModal(true); }, style: { ...s.btnGhost, fontSize: 11, padding: "4px 10px" } }, "+ Add note")
                ),
                cNotes.length === 0 ? React.createElement("div", { style: { fontSize: 13, color: G[400], fontStyle: "italic" } }, "No notes recorded yet.") :
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
                  cNotes.map(n => React.createElement("div", { key: n.id, style: { padding: "10px", background: G[50], borderRadius: 8, border: `1px solid ${G[100]}` } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } },
                      React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: G[700] } }, n.type),
                      React.createElement("span", { style: { fontSize: 10, color: G[400] } }, n.time)
                    ),
                    React.createElement("p", { style: { fontSize: 12, color: G[600], lineHeight: 1.5, margin: 0 } }, n.text)
                  ))
                )
              )
            )
          );
        })
      )
    );
  };

  const CareNotesScreen = () => {
    const typeColor = t => ({ "Vital signs": "#3b82f6", "Wound check": "#f59e0b", "Medication": "#10b981", "General": G[500] })[t] || G[500];
    const typeBg = t => ({ "Vital signs": "#eff6ff", "Wound check": "#fffbeb", "Medication": "#ecfdf5", "General": G[50] })[t] || G[50];
    
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 } },
        React.createElement("div", null,
          React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Care Notes"),
          React.createElement("p", { style: { color: G[400], fontSize: 13 } }, "Clinical observations and vitals log")
        ),
        React.createElement("button", { onClick: () => { setNoteForm({ case_id:"", type:"General", text:"", temp:"", bp:"", hr:"" }); setNoteModal(true); }, style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add note")
      ),
      careNotes.length === 0 ? React.createElement(EmptyState, { icon: "fileText", title: "No care notes", text: "Record your first clinical observation." }) :
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
        careNotes.map((n, i) => {
          const pt = myCases.find(c => c.id === n.case_id)?.patient || n.case_id;
          return React.createElement("div", { key: n.id || i, style: { ...s.card, marginBottom: 0, borderLeft: `3px solid ${typeColor(n.type)}` } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
              React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 11, padding: "2px 8px", borderRadius: 10, background: typeBg(n.type), color: typeColor(n.type), fontWeight: 500, border: `1px solid ${typeColor(n.type)}40` } }, n.type),
                React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: G[900] } }, pt)
              ),
              React.createElement("span", { style: { fontSize: 12, color: G[400] } }, `${n.date} • ${n.time}`)
            ),
            React.createElement("p", { style: { fontSize: 13.5, color: G[700], lineHeight: 1.6, marginBottom: (n.temp || n.bp || n.hr) ? 12 : 0 } }, n.text),
            (n.temp || n.bp || n.hr) && React.createElement("div", { style: { display: "flex", gap: 10 } },
              n.temp && React.createElement("span", { style: { fontSize: 11, color: G[600], background: G[100], padding: "3px 8px", borderRadius: 6 } }, `Temp: ${n.temp}°C`),
              n.bp   && React.createElement("span", { style: { fontSize: 11, color: G[600], background: G[100], padding: "3px 8px", borderRadius: 6 } }, `BP: ${n.bp}`),
              n.hr   && React.createElement("span", { style: { fontSize: 11, color: G[600], background: G[100], padding: "3px 8px", borderRadius: 6 } }, `HR: ${n.hr} bpm`)
            )
          );
        })
      )
    );
  };

  const InventoryScreen = () => {
    const grouped = inventory.reduce((acc, item) => {
      acc[item.home] = acc[item.home] || [];
      acc[item.home].push(item);
      return acc;
    }, {});

    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Medication Inventory"),
      React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Current stock levels at assigned recovery homes"),
      inventory.length === 0 ? React.createElement(EmptyState, { icon: "activity", title: "No inventory data", text: "There are no medications tracked for your recovery homes." }) :
      Object.entries(grouped).map(([home, items]) =>
        React.createElement("div", { key: home, style: s.card },
          React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, home),
          React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } },
            React.createElement("thead", null,
              React.createElement("tr", { style: { borderBottom: `1px solid ${G[200]}`, textAlign: "left" } },
                React.createElement("th", { style: { padding: "8px 0", color: G[500], fontWeight: 600 } }, "Item"),
                React.createElement("th", { style: { padding: "8px 0", color: G[500], fontWeight: 600 } }, "Quantity"),
                React.createElement("th", { style: { padding: "8px 0", color: G[500], fontWeight: 600 } }, "Status")
              )
            ),
            React.createElement("tbody", null,
              items.map(it => React.createElement("tr", { key: it.id, style: { borderBottom: `1px solid ${G[100]}` } },
                React.createElement("td", { style: { padding: "10px 0", fontWeight: 500, color: G[900] } }, it.name),
                React.createElement("td", { style: { padding: "10px 0", color: G[600] } }, `${it.qty} ${it.unit}`),
                React.createElement("td", { style: { padding: "10px 0" } },
                  React.createElement("span", { style: { fontSize: 11, padding: "3px 8px", borderRadius: 10, background: it.status === "OK" ? T[50] : "#fef2f2", color: it.status === "OK" ? T[700] : "#dc2626", border: `1px solid ${it.status === "OK" ? T[100] : "#fca5a5"}`, fontWeight: 500 } }, it.status)
                )
              ))
            )
          )
        )
      )
    );
  };

  const MessagesScreen = () => {
    const [selectedCoord, setSelectedCoord] = useState(coords[0]);
    const [msgInput, setMsgInput] = useState("");
    const msgBodyRef = useRef(null);

    useEffect(() => {
      if (msgBodyRef.current) msgBodyRef.current.scrollTop = msgBodyRef.current.scrollHeight;
    }, [msgs]);

    const sendMsg = () => {
      if (!msgInput.trim()) return;
      const now = new Date();
      const time = now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");
      setMsgs(prev => [...prev, { side: "me", text: msgInput.trim(), time, date: "Today" }]);
      setMsgInput("");
      if (isDemo) {
        setTimeout(() => setMsgs(p => [...p, { side: "them", text: "Entendido, gracias por el reporte. Lo registro.", time, date: "Today", from: selectedCoord.name }]), 1200);
      }
    };

    return React.createElement("div", { className: "dash-screen", style: { flex: 1, display: "flex", overflow: "hidden" } },
      React.createElement("div", { style: { width: 260, borderRight: `1px solid ${G[200]}`, overflowY: "auto", flexShrink: 0, background: "#fff" } },
        React.createElement("div", { style: { ...s.label, padding: "20px 16px 10px" } }, "Coordinators"),
        coords.length === 0 ? React.createElement("div", { style: { padding: 16, fontSize: 13, color: G[400] } }, "No coordinators found") :
        coords.map((c, i) => React.createElement("div", { key: c.id || i, onClick: () => { setSelectedCoord(c); setMsgInput(""); }, style: { padding: "14px 16px", cursor: "pointer", borderBottom: `1px solid ${G[100]}`, background: selectedCoord?.id === c.id ? T[50] : "#fff", borderLeft: `2px solid ${selectedCoord?.id === c.id ? T[500] : "transparent"}` } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900] } }, c.name),
          React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } }, c.role || "Care Coordinator")
        ))
      ),
      React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", padding: 24, overflow: "hidden" } },
        selectedCoord ? React.createElement(React.Fragment, null,
          React.createElement("div", { style: { marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${G[200]}` } },
            React.createElement("h2", { style: { fontFamily: serif, fontSize: 20, color: T[950] } }, selectedCoord.name),
            React.createElement("div", { style: { fontSize: 12, color: G[400] } }, "Internal Communication")
          ),
          React.createElement("div", { ref: msgBodyRef, style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 12 } },
            msgs.map((m, i) => React.createElement("div", { key: i, style: { alignSelf: m.side === "me" ? "flex-end" : "flex-start", maxWidth: "75%" } },
              React.createElement("div", { style: { padding: "10px 14px", borderRadius: 12, background: m.side === "me" ? T[500] : G[100], color: m.side === "me" ? "#fff" : G[900], fontSize: 13.5, lineHeight: 1.6 } }, m.text,
                React.createElement("div", { style: { fontSize: 10, marginTop: 4, opacity: 0.55, textAlign: m.side === "me" ? "right" : "left" } }, m.time)
              )
            ))
          ),
          React.createElement("div", { style: { display: "flex", gap: 10, paddingTop: 12, borderTop: `1px solid ${G[200]}` } },
            React.createElement("input", { value: msgInput, onChange: e => setMsgInput(e.target.value), onKeyDown: e => e.key === "Enter" && sendMsg(), placeholder: "Type a message to " + selectedCoord.name.split(" ")[0] + "...", style: { flex: 1, height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } }),
            React.createElement("button", { onClick: sendMsg, style: { ...s.btnPrimary, padding: "0 20px", display: "flex", alignItems: "center", gap: 7 } }, React.createElement(Icon, { name: "send", size: 14, color: "#fff" }), "Send")
          )
        ) : React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: G[400], fontSize: 13 } }, "Select a coordinator to chat")
      )
    );
  };

  const ProfileScreen = () => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto", maxWidth: 760 } },
    React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "My Profile"),
    React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Manage your nursing credentials and preferences"),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 } },
      React.createElement("div", { style: s.card },
        React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "Personal details"),
        [["First name", "fn"], ["Last name", "ln"], ["Phone", "phone"]].map(([lbl, key]) => React.createElement("div", { key, style: { marginBottom: 14 } },
          React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, lbl),
          React.createElement("input", { value: profileForm[key], onChange: e => setProfileForm(f => ({ ...f, [key]: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } })
        )),
        React.createElement("div", { style: { marginBottom: 14 } },
          React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, "Shift preference"),
          React.createElement("select", { value: profileForm.shift, onChange: e => setProfileForm(f => ({ ...f, shift: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } },
            ["Day", "Night", "Rotating"].map(o => React.createElement("option", { key: o, value: o }, o))
          )
        ),
        React.createElement("div", { style: { marginBottom: 14 } },
          React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, "Languages"),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } },
            ["Español", "Inglés", "Portugués", "Francés"].map(l => React.createElement("label", { key: l, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: G[700] } },
              React.createElement("input", { type: "checkbox", checked: profileForm.langs.includes(l), onChange: () => {
                setProfileForm(f => ({ ...f, langs: f.langs.includes(l) ? f.langs.filter(x => x !== l) : [...f.langs, l] }));
              }, style: { accentColor: T[500] } }), l
            ))
          )
        ),
        React.createElement("div", { style: { marginBottom: 20 } },
          React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 6 } }, "Biography"),
          React.createElement("textarea", { value: profileForm.bio, onChange: e => setProfileForm(f => ({ ...f, bio: e.target.value })), rows: 3, style: { width: "100%", border: `1px solid ${G[200]}`, borderRadius: 8, padding: "10px 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], resize: "vertical" } })
        ),
        React.createElement("button", { onClick: () => {
          if (isDemo && user?.id) {
            localStorage.setItem("nurse_profile_" + user.id, JSON.stringify(profileForm));
            showToast("Profile saved successfully");
          } else if (isDemo) {
            showToast("Profile saved successfully");
          } else {
            showToast("Updating your profile...");
          }
        }, style: { ...s.btnPrimary, width: "100%" } }, "Save changes")
      ),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { style: s.card },
          React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "Professional details (Read-only)"),
          React.createElement("div", { style: { marginBottom: 12 } }, React.createElement("span", { style: { fontSize: 12, color: G[500], display: "block" } }, "License number"), React.createElement("span", { style: { fontSize: 14, fontWeight: 500, color: G[900] } }, profile?.license || "N/A")),
          React.createElement("div", { style: { marginBottom: 12 } }, React.createElement("span", { style: { fontSize: 12, color: G[500], display: "block" } }, "Specialization"), React.createElement("span", { style: { fontSize: 14, fontWeight: 500, color: G[900] } }, profile?.specialization || "N/A")),
          React.createElement("div", { style: { marginBottom: 12 } }, React.createElement("span", { style: { fontSize: 12, color: G[500], display: "block", marginBottom: 4 } }, "Certifications"), React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, (profile?.certifications || []).map(c => React.createElement("span", { key: c, style: { fontSize: 11, padding: "2px 8px", background: G[100], borderRadius: 10, color: G[600] } }, c)))),
          React.createElement("div", { style: { marginBottom: 6 } }, React.createElement("span", { style: { fontSize: 12, color: G[500], display: "block", marginBottom: 4 } }, "Assigned Recovery Homes"), React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, (profile?.recovery_homes || []).map(h => React.createElement("span", { key: h, style: { fontSize: 11, padding: "2px 8px", background: T[50], border: `1px solid ${T[100]}`, borderRadius: 10, color: T[700] } }, h))))
        ),
        React.createElement("div", { style: s.card },
          React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "Security"),
          React.createElement("button", { onClick: () => showToast("Password reset email sent"), style: s.btnGhost }, "Change password")
        )
      )
    )
  );

  // ─── ADD NOTE MODAL ─────────────────────────────────────────────────────
  const NoteModal = () => React.createElement(Modal, { open: noteModal, onClose: () => setNoteModal(false) },
    React.createElement("div", { style: { padding: "28px 28px 32px" } },
      React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950], marginBottom: 20 } }, "Add Care Note"),
      React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Patient / Case"),
        React.createElement("select", { value: noteForm.case_id, onChange: e => setNoteForm(f => ({ ...f, case_id: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 12px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } },
          React.createElement("option", { value: "" }, "-- Select patient --"),
          myCases.map(c => React.createElement("option", { key: c.id, value: c.id }, `${c.patient} (${c.proc})`))
        )
      ),
      React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Observation type"),
        React.createElement("select", { value: noteForm.type, onChange: e => setNoteForm(f => ({ ...f, type: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 12px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } },
          ["Vital signs", "Wound check", "Medication", "General"].map(t => React.createElement("option", { key: t, value: t }, t))
        )
      ),
      React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Clinical notes"),
        React.createElement("textarea", { value: noteForm.text, onChange: e => setNoteForm(f => ({ ...f, text: e.target.value })), rows: 3, placeholder: "Describe observations...", style: { width: "100%", border: `1px solid ${G[200]}`, borderRadius: 8, padding: "10px 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], resize: "vertical" } })
      ),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24, padding: "14px", background: G[50], borderRadius: 8, border: `1px solid ${G[100]}` } },
        React.createElement("div", null, React.createElement("label", { style: { display: "block", fontSize: 11, color: G[500], marginBottom: 4 } }, "Temp (°C)"), React.createElement("input", { value: noteForm.temp, onChange: e => setNoteForm(f => ({ ...f, temp: e.target.value })), placeholder: "36.8", style: { width: "100%", height: 34, border: `1px solid ${G[200]}`, borderRadius: 6, padding: "0 8px", fontSize: 12, outline: "none" } })),
        React.createElement("div", null, React.createElement("label", { style: { display: "block", fontSize: 11, color: G[500], marginBottom: 4 } }, "BP (mmHg)"), React.createElement("input", { value: noteForm.bp, onChange: e => setNoteForm(f => ({ ...f, bp: e.target.value })), placeholder: "120/80", style: { width: "100%", height: 34, border: `1px solid ${G[200]}`, borderRadius: 6, padding: "0 8px", fontSize: 12, outline: "none" } })),
        React.createElement("div", null, React.createElement("label", { style: { display: "block", fontSize: 11, color: G[500], marginBottom: 4 } }, "HR (bpm)"), React.createElement("input", { value: noteForm.hr, onChange: e => setNoteForm(f => ({ ...f, hr: e.target.value })), placeholder: "72", style: { width: "100%", height: 34, border: `1px solid ${G[200]}`, borderRadius: 6, padding: "0 8px", fontSize: 12, outline: "none" } }))
      ),
      React.createElement("div", { style: { display: "flex", gap: 10 } },
        React.createElement("button", { onClick: () => {
          if (!noteForm.case_id || !noteForm.text.trim()) { showToast("Case and notes are required"); return; }
          if (isDemo) {
            setDbNotes(prev => [{ id: "n" + Date.now(), case_id: noteForm.case_id, type: noteForm.type, text: noteForm.text, temp: noteForm.temp, bp: noteForm.bp, hr: noteForm.hr, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), date: "Today" }, ...prev]);
            showToast("Note added");
            setNoteModal(false);
          } else {
            showToast("Demo note saved (backend integration pending)");
            setNoteModal(false);
          }
        }, style: { ...s.btnPrimary, flex: 1, padding: "11px 0" } }, "Save note"),
        React.createElement("button", { onClick: () => setNoteModal(false), style: { ...s.btnGhost, padding: "11px 20px" } }, "Cancel")
      )
    )
  );

  // ─── RENDER ─────────────────────────────────────────────────────────────
  const NURSE_GROUPS = [
    ["My Work", [
      ["Overview", "chartBar", "overview"],
      ["My Cases", "clipboard", "cases"]
    ]],
    ["My Patients", [
      ["Care Notes", "fileText", "notes"],
      ["Inventory", "activity", "inventory"]
    ]],
    ["Communication", [
      ["Messages", "message", "messages"]
    ]],
    ["Account", [
      ["My Profile", "person", "profile"]
    ]]
  ];

  const renderScreen = () => {
    if (screen === "overview") return OverviewScreen();
    if (screen === "cases") return MyCasesScreen();
    if (screen === "notes") return CareNotesScreen();
    if (screen === "inventory") return InventoryScreen();
    if (screen === "messages") return React.createElement(MessagesScreen, null);
    if (screen === "profile") return ProfileScreen();
    return OverviewScreen();
  };

  return React.createElement("div", { style: { fontFamily: sans, background: G[50], minHeight: "100vh", display: "flex", flexDirection: "column" } },
    toast && React.createElement(Toast, { msg: toast, onDone: () => setToast(null) }),
    noteModal && NoteModal(),
    
    React.createElement("div", { className: "sidebar-overlay" + (sidebarOpen ? " open" : ""), onClick: () => setSidebarOpen(false) }),
    React.createElement("div", { className: "dash-header", style: { height: 60, background: "#fff", borderBottom: `1px solid ${G[200]}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
        React.createElement("button", { className: "mobile-menu-btn", onClick: () => setSidebarOpen(o => !o), style: { background:"none", border:"none", cursor:"pointer", padding:6, display:"flex", alignItems:"center" } }, React.createElement(HamburgerIcon, { color: G[800] })),
        React.createElement("div", { style: { fontFamily: serif, fontSize: 19, fontWeight: 600, color: T[900], letterSpacing: "0.06em", textTransform: "uppercase" } }, "Praes", React.createElement("span", { style: { color: T[500] } }, "enti")),
        React.createElement("span", { className: "col-hide-xs", style: { fontSize: 11, fontWeight: 500, color: T[500], letterSpacing: "0.08em", textTransform: "uppercase", marginLeft: 6 } }, "Nurse")
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
      React.createElement("div", { className: "app-sidebar" + (sidebarOpen ? " open" : ""), style: { background: T[950], width: 220, flexShrink: 0, padding: "22px 0", borderRight: "1px solid rgba(255,255,255,.06)" } },
        NURSE_GROUPS.map(([grp, items]) => React.createElement("div", { key: grp },
          React.createElement("span", { style: { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,.2)", padding: "0 20px", marginBottom: 8, marginTop: 18, display: "block" } }, grp),
          items.map(([lbl, iconName, scr]) => React.createElement("div", { key: lbl, onClick: () => navTo(lbl, scr), style: { padding: "10px 20px", fontSize: 13, color: sidebarItem === lbl ? "#fff" : "rgba(255,255,255,.45)", cursor: "pointer", borderLeft: `2px solid ${sidebarItem === lbl ? T[400] : "transparent"}`, background: sidebarItem === lbl ? "rgba(255,255,255,.07)" : "transparent", display: "flex", alignItems: "center", gap: 9 } },
            React.createElement(Icon, { name: iconName, size: 14, color: sidebarItem === lbl ? T[300] : "rgba(255,255,255,.3)" }), lbl
          ))
        ))
      ),
      React.createElement("div", { className: "dash-layout-inner", style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", background: G[50] } },
        renderScreen()
      )
    )
  );
};
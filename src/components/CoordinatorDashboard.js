import { T, G, serif, sans, s, CASES, ADMIN_NOTES, RECOVERY_CHECKS, JOURNEY_STEPS } from '../constants.js';
import { fetchChecklist, saveChecklist } from '../supabase.js';
import { HamburgerIcon, Icon, SPill, Toast, Modal, IR } from './shared.js';

const { React } = window;
const { useState, useRef, useEffect } = React;

export const CoordinatorDashboard = ({ onSignOut, user }) => {
  const firstName = (user && user.fn) || "Ana";
  const lastName = (user && user.ln) || "Rodr\u00edguez";
  const fullName = (firstName + " " + lastName).trim() || "Coordinator";
  const initials = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "C";

  const [screen, setScreen] = useState("overview");
  const [sidebarItem, setSidebarItem] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(CASES[0]);
  const [toast, setToast] = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [notes, setNotes] = useState(ADMIN_NOTES);
  const [coordCheckDone, setCoordCheckDone] = useState(Array(RECOVERY_CHECKS.length).fill(false));

  useEffect(() => {
    if (selectedCase && selectedCase.caso_id_uuid) {
      const load = async () => {
        const data = await fetchChecklist(selectedCase.caso_id_uuid);
        if (data && data.items) {
          setCoordCheckDone(data.items);
        } else {
          setCoordCheckDone(Array(RECOVERY_CHECKS.length).fill(false));
        }
      };
      load();
    } else {
      setCoordCheckDone(Array(RECOVERY_CHECKS.length).fill(false));
    }
  }, [selectedCase]);

  const [selectedMsgCase, setSelectedMsgCase] = useState(CASES[0]);
  const [caseMessages, setCaseMessages] = useState(() => {
    const map = {};
    CASES.forEach(c => {
      map[c.id] = [
        { side: "them", text: "Hello, how should I prepare for surgery?", time: "09:12", date: "March 20" },
        { side: "me", text: "Hi " + c.name.split(" ")[0] + ", thanks for reaching out. I'll send the pre-operative instructions this afternoon.", time: "09:45", date: "March 20" },
        { side: "them", text: "Perfect, thank you very much.", time: "10:02", date: "March 20" }
      ];
    });
    return map;
  });
  const [msgs, setMsgs] = useState(caseMessages[CASES[0].id]);
  const [msgInput, setMsgInput] = useState("");
  const msgBodyRef = useRef(null);

  useEffect(() => {
    if (msgBodyRef.current) msgBodyRef.current.scrollTop = msgBodyRef.current.scrollHeight;
  }, [msgs]);

  const showToast = (msg) => setToast(msg);

  const navTo = (item, scr) => {
    const newScr = scr || "overview";
    setSidebarItem(item);
    setScreen(newScr);
    history.pushState({ role: "coordinator", item, scr: newScr, dash: "coordinator" }, "", "#coord/" + newScr);
  };
  useEffect(() => {
    if (!history.state || history.state.dash !== "coordinator") {
      history.replaceState({ item: sidebarItem, scr: screen, dash: "coordinator" }, "", "#coord/" + screen);
    }
    const onPop = (e) => {
      const st = e.state;
      if (!st || st.dash !== "coordinator") {
        if (!st) { setScreen("overview"); setSidebarItem("Overview"); }
        return;
      }
      setSidebarItem(st.item);
      setScreen(st.scr || "overview");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleToggleCheck = async (i) => {
    const nd = [...coordCheckDone];
    nd[i] = !nd[i];
    setCoordCheckDone(nd);
    if (selectedCase && selectedCase.caso_id_uuid) {
      await saveChecklist(selectedCase.caso_id_uuid, nd, user.email);
      showToast("Checklist updated");
    }
  };

  const saveNote = () => {
    if (!noteInput.trim()) return;
    const now = new Date();
    setNotes(n => [{ author: "Coord. Ana", date: "March " + now.getDate() + " \u00b7 " + now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0"), text: noteInput.trim() }, ...n]);
    setNoteInput("");
    showToast("Note saved");
  };

  const sendMsg = () => {
    if (!msgInput.trim()) return;
    const now = new Date();
    const time = now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");
    const newMsg = { side: "me", text: msgInput.trim(), time, date: "Today" };
    const caseId = selectedMsgCase.id;
    setCaseMessages(prev => {
      const updated = { ...prev, [caseId]: [...(prev[caseId] || []), newMsg] };
      setMsgs(updated[caseId]);
      return updated;
    });
    setMsgInput("");
    setTimeout(() => {
      const reply = { side: "them", text: "Thanks for the info, coordinator.", time, date: "Today" };
      setCaseMessages(prev => {
        const updated = { ...prev, [caseId]: [...(prev[caseId] || []), reply] };
        setMsgs(updated[caseId]);
        return updated;
      });
    }, 1200);
  };

  const filtered = CASES.filter(c =>
    c.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    c.proc.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const COORD_GROUPS = [
    ["My Cases", [
      ["Overview", "chartBar", "overview"],
      ["All Cases", "users", "cases"],
      ["Pipeline", "trendingUp", "pipeline"],
      ["Messages", "message", "messages"]
    ]],
    ["Team", [
      ["My Team", "network", "team"]
    ]]
  ];

  const COORD_PIPELINE_COLS = [
    { label: "New Lead", color: "#6b7280", items: [{ name: "Luca Ferreira", proc: "Hair Transplant", budget: "$3,100", country: "BR" }, { name: "Sophie Wright", proc: "Rhinoplasty", budget: "$3,900", country: "AU" }] },
    { label: "Qualified", color: "#92400e", items: [{ name: "James Okafor", proc: "Liposuction", budget: "$6,800", country: "UK" }, { name: "Anna Kowalski", proc: "Tummy Tuck", budget: "$7,200", country: "PL" }] },
    { label: "Matched", color: "#1a7a72", items: [{ name: "Carlos Reyes", proc: "Bariatric Surgery", budget: "$11,000", country: "MX" }] },
    { label: "Pre-op", color: "#b45309", items: [{ name: "James Okafor", proc: "Liposuction", budget: "$6,800", country: "UK" }] },
    { label: "In Recovery", color: "#1a9e95", items: [{ name: "Maria Vasquez", proc: "Rhinoplasty", budget: "$4,200", country: "USA" }, { name: "Sofia Mart\u00ednez", proc: "Breast Aug.", budget: "$5,500", country: "CA" }] },
    { label: "Completed", color: "#059669", items: [{ name: "Daniel Park", proc: "Dental Veneers", budget: "$2,100", country: "US" }] }
  ];

  const COORD_COORDS = [
    { name: "Ana Rodr\u00edguez", cases: 8, lang: "EN \u00b7 ES", status: "Active", email: "ana@praesenti.com", rating: "4.9" },
    { name: "Miguel Santos", cases: 5, lang: "EN \u00b7 ES \u00b7 PT", status: "Active", email: "miguel@praesenti.com", rating: "4.8" },
    { name: "Claire Dubois", cases: 3, lang: "EN \u00b7 FR", status: "Active", email: "claire@praesenti.com", rating: "5.0" },
    { name: "Thomas Nguyen", cases: 0, lang: "EN", status: "On leave", email: "thomas@praesenti.com", rating: "4.7" }
  ];

  const CoordStat = ({ label, value, color, icon }) => React.createElement("div", { style: { ...s.card, marginBottom: 0 } },
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } },
      React.createElement("div", { style: s.label }, label),
      React.createElement(Icon, { name: icon, size: 14, color })
    ),
    React.createElement("div", { style: { fontFamily: serif, fontSize: 32, fontWeight: 600, color } }, value)
  );

  const CoordSidebar = () => React.createElement(React.Fragment, null,
    React.createElement("div", { className: "sidebar-overlay" + (sidebarOpen ? " open" : ""), onClick: () => setSidebarOpen(false) }),
    React.createElement("div", { className: "app-sidebar" + (sidebarOpen ? " open" : ""), style: { background: T[950], width: 220, flexShrink: 0, padding: "22px 0", borderRight: "1px solid rgba(255,255,255,.06)" } },
      COORD_GROUPS.map(([grp, items]) => React.createElement("div", { key: grp },
        React.createElement("span", { style: { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,.2)", padding: "0 20px", marginBottom: 8, marginTop: 18, display: "block" } }, grp),
        items.map(([lbl, iconName, scr]) => React.createElement("div", {
          key: lbl,
          onClick: () => { navTo(lbl, scr); setSidebarOpen(false); },
          style: { padding: "10px 20px", fontSize: 13, color: sidebarItem === lbl ? "#fff" : "rgba(255,255,255,.45)", cursor: "pointer", borderLeft: "2px solid " + (sidebarItem === lbl ? T[400] : "transparent"), background: sidebarItem === lbl ? "rgba(255,255,255,.07)" : "transparent", display: "flex", alignItems: "center", gap: 9 }
        },
          React.createElement(Icon, { name: iconName, size: 14, color: sidebarItem === lbl ? T[300] : "rgba(255,255,255,.3)" }),
          lbl
        ))
      ))
    )
  );

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const CasesTable = ({ title, onRowClick }) => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
    React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, title),
    React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, CASES.length + " active cases"),
    React.createElement("div", { style: { ...s.card, marginBottom: 0 } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
        React.createElement("div", { style: s.label }, "Cases"),
        React.createElement("input", { value: tableSearch, onChange: e => setTableSearch(e.target.value), placeholder: "Search...", style: { height: 34, border: "1px solid " + G[200], borderRadius: 7, padding: "0 12px", fontSize: 12.5, fontFamily: sans, outline: "none", color: G[900], width: 200 } })
      ),
      React.createElement("div", { className: "table-scroll" },
        React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } },
          React.createElement("thead", null,
            React.createElement("tr", { style: { textAlign: "left" } },
              ["ID", "Patient", "Procedure", "Status", "Surgery", "Surgeon", "Budget", "Country"].map(h =>
                React.createElement("th", { key: h, className: ["ID", "Surgeon", "Country"].includes(h) ? "col-hide-xs" : "", style: { ...s.label, paddingBottom: 10, borderBottom: "1px solid " + G[200], fontWeight: 600 } }, h)
              )
            )
          ),
          React.createElement("tbody", null,
            filtered.map(c => React.createElement("tr", {
              key: c.id,
              onClick: () => onRowClick(c),
              style: { cursor: "pointer", borderBottom: "1px solid " + G[100] },
              onMouseEnter: e => e.currentTarget.style.background = G[50],
              onMouseLeave: e => e.currentTarget.style.background = "transparent"
            },
              React.createElement("td", { className: "col-hide-xs", style: { padding: "10px 0", color: G[400], fontSize: 11 } }, c.id),
              React.createElement("td", { style: { padding: "10px 8px", fontWeight: 500 } }, c.name),
              React.createElement("td", { style: { padding: "10px 8px", color: G[600] } }, c.proc),
              React.createElement("td", { style: { padding: "10px 8px" } }, React.createElement(SPill, { status: c.status })),
              React.createElement("td", { style: { padding: "10px 8px", color: G[500] } }, c.date),
              React.createElement("td", { className: "col-hide-xs", style: { padding: "10px 8px", color: G[600] } }, c.surgeon),
              React.createElement("td", { style: { padding: "10px 8px", color: T[600], fontWeight: 500 } }, c.budget),
              React.createElement("td", { className: "col-hide-xs", style: { padding: "10px 8px", color: G[500] } }, c.country)
            ))
          )
        )
      )
    )
  );

  const OverviewScreen = () => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
    React.createElement("h1", { style: { fontFamily: serif, fontSize: 28, color: T[950], marginBottom: 4 } }, "Coordinator Dashboard"),
    React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, dateStr),
    React.createElement("div", { className: "grid-4", style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 } },
      React.createElement(CoordStat, { label: "Active cases", value: CASES.length, color: T[700], icon: "users" }),
      React.createElement(CoordStat, { label: "In recovery", value: CASES.filter(c => c.status === "Recovery").length, color: T[500], icon: "heart" }),
      React.createElement(CoordStat, { label: "Pre-op this week", value: CASES.filter(c => c.status === "Pre-op").length, color: "#92400e", icon: "calendar" }),
      React.createElement(CoordStat, { label: "Leads", value: CASES.filter(c => c.status === "Lead").length, color: G[500], icon: "trendingUp" })
    ),
    React.createElement("div", { style: { ...s.card, marginBottom: 0 } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
        React.createElement("div", { style: s.label }, "Recent cases"),
        React.createElement("input", { value: tableSearch, onChange: e => setTableSearch(e.target.value), placeholder: "Search...", style: { height: 34, border: "1px solid " + G[200], borderRadius: 7, padding: "0 12px", fontSize: 12.5, fontFamily: sans, outline: "none", color: G[900], width: 200 } })
      ),
      React.createElement("div", { className: "table-scroll" },
        React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } },
          React.createElement("thead", null,
            React.createElement("tr", { style: { textAlign: "left" } },
              ["ID", "Patient", "Procedure", "Status", "Surgery", "Surgeon", "Budget", "Country"].map(h =>
                React.createElement("th", { key: h, className: ["ID", "Surgeon", "Country"].includes(h) ? "col-hide-xs" : "", style: { ...s.label, paddingBottom: 10, borderBottom: "1px solid " + G[200], fontWeight: 600 } }, h)
              )
            )
          ),
          React.createElement("tbody", null,
            filtered.map(c => React.createElement("tr", {
              key: c.id,
              onClick: () => { setSelectedCase(c); navTo("All Cases", "caseDetail"); },
              style: { cursor: "pointer", borderBottom: "1px solid " + G[100] },
              onMouseEnter: e => e.currentTarget.style.background = G[50],
              onMouseLeave: e => e.currentTarget.style.background = "transparent"
            },
              React.createElement("td", { className: "col-hide-xs", style: { padding: "10px 0", color: G[400], fontSize: 11 } }, c.id),
              React.createElement("td", { style: { padding: "10px 8px", fontWeight: 500 } }, c.name),
              React.createElement("td", { style: { padding: "10px 8px", color: G[600] } }, c.proc),
              React.createElement("td", { style: { padding: "10px 8px" } }, React.createElement(SPill, { status: c.status })),
              React.createElement("td", { style: { padding: "10px 8px", color: G[500] } }, c.date),
              React.createElement("td", { className: "col-hide-xs", style: { padding: "10px 8px", color: G[600] } }, c.surgeon),
              React.createElement("td", { style: { padding: "10px 8px", color: T[600], fontWeight: 500 } }, c.budget),
              React.createElement("td", { className: "col-hide-xs", style: { padding: "10px 8px", color: G[500] } }, c.country)
            ))
          )
        )
      )
    )
  );

  const CaseDetailScreen = () => React.createElement("div", { className: "case-detail-layout", style: { flex: 1, display: "flex", overflow: "hidden" } },
    React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 28, overflowY: "auto" } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 } },
        React.createElement("button", { onClick: () => navTo("All Cases", "cases"), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6 } },
          React.createElement(Icon, { name: "arrowLeft", size: 13, color: G[600] }),
          "Back"
        ),
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
        JOURNEY_STEPS.map((step, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderBottom: i < JOURNEY_STEPS.length - 1 ? "1px solid " + G[100] : "none" } },
          React.createElement("div", { style: { width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: step.done ? T[500] : G[200], display: "flex", alignItems: "center", justifyContent: "center" } },
            step.done && React.createElement(Icon, { name: "check", size: 9, color: "#fff" })
          ),
          React.createElement("div", { style: { flex: 1, fontSize: 13, color: step.done ? G[900] : G[400] } }, step.label),
          React.createElement("div", { style: { fontSize: 11, color: G[400] } }, step.date)
        ))
      ),
      React.createElement("div", { style: { ...s.card, marginTop: 14 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
          React.createElement("div", { style: s.label }, "Recovery checklist"),
          React.createElement("div", { style: { fontSize: 12, color: G[400] } }, coordCheckDone.filter(Boolean).length + " / " + RECOVERY_CHECKS.length + " complete")
        ),
        React.createElement("div", { style: { height: 4, background: G[100], borderRadius: 2, marginBottom: 16, overflow: "hidden" } },
          React.createElement("div", { style: { height: "100%", width: ((coordCheckDone.filter(Boolean).length / RECOVERY_CHECKS.length) * 100).toFixed(0) + "%", background: T[500], borderRadius: 2, transition: "width .3s" } })
        ),
        RECOVERY_CHECKS.map((item, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < RECOVERY_CHECKS.length - 1 ? "1px solid " + G[100] : "none", cursor: "pointer" }, onClick: () => handleToggleCheck(i) },
          React.createElement("div", { style: { width: 18, height: 18, borderRadius: 4, border: "2px solid " + (coordCheckDone[i] ? T[500] : G[300]), background: coordCheckDone[i] ? T[500] : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
            coordCheckDone[i] && React.createElement(Icon, { name: "check", size: 9, color: "#fff" })
          ),
          React.createElement("span", { style: { fontSize: 13, color: coordCheckDone[i] ? G[400] : G[700], textDecoration: coordCheckDone[i] ? "line-through" : "none" } }, item)
        ))
      )
    ),

    React.createElement("div", { className: "case-notes-panel", style: { width: 280, borderLeft: "1px solid " + G[200], padding: 20, overflowY: "auto", background: "#fff", flexShrink: 0 } },
      React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Internal notes"),
      React.createElement("textarea", { value: noteInput, onChange: e => setNoteInput(e.target.value), placeholder: "Add a note...", style: { width: "100%", height: 80, border: "1px solid " + G[200], borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: sans, resize: "none", outline: "none", color: G[900], marginBottom: 8 } }),
      React.createElement("button", { onClick: saveNote, style: { ...s.btnPrimary, width: "100%", fontSize: 12, padding: "9px 0" } }, "Save note"),
      React.createElement("div", { style: { marginTop: 20 } },
        notes.map((n, i) => React.createElement("div", { key: i, style: { ...s.card, padding: "12px 14px", marginBottom: 10 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } },
            React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: T[700] } }, n.author),
            React.createElement("span", { style: { fontSize: 10, color: G[400] } }, n.date)
          ),
          React.createElement("p", { style: { fontSize: 12.5, color: G[700], lineHeight: 1.6 } }, n.text)
        ))
      )
    )
  );

  const PipelineScreen = () => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
    React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Pipeline"),
    React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Patient journey status across all active cases"),
    React.createElement("div", { className: "grid-6", style: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, alignItems: "start" } },
      COORD_PIPELINE_COLS.map(({ label, color, items }) => React.createElement("div", { key: label },
        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } },
          React.createElement("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color } }, label),
          React.createElement("span", { style: { fontSize: 11, background: G[100], color: G[500], borderRadius: 10, padding: "1px 7px", fontWeight: 600 } }, items.length)
        ),
        items.map((it, i) => React.createElement("div", {
          key: i,
          style: { ...s.card, marginBottom: 8, padding: "12px 14px", cursor: "pointer" },
          onMouseEnter: e => e.currentTarget.style.borderColor = T[300],
          onMouseLeave: e => e.currentTarget.style.borderColor = G[200]
        },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900], marginBottom: 3 } }, it.name),
          React.createElement("div", { style: { fontSize: 11, color: G[400] } }, it.proc),
          React.createElement("div", { style: { fontSize: 11, color: T[600], fontWeight: 500, marginTop: 4 } }, it.budget + " \u00b7 " + it.country)
        ))
      ))
    )
  );

  const MessagesScreen = () => {
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, display: "flex", overflow: "hidden" } },
      React.createElement("div", { style: { width: 240, borderRight: "1px solid " + G[200], overflowY: "auto", flexShrink: 0, background: "#fff" } },
        React.createElement("div", { style: { ...s.label, padding: "18px 16px 10px" } }, "Cases"),
        CASES.map((c, i) => React.createElement("div", {
          key: c.id,
          onClick: () => {
            setSelectedMsgCase(c);
            setMsgs(caseMessages[c.id] || []);
            setMsgInput("");
          },
          style: { padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid " + G[100], background: selectedMsgCase && selectedMsgCase.id === c.id ? T[50] : "#fff", borderLeft: "2px solid " + (selectedMsgCase && selectedMsgCase.id === c.id ? T[500] : "transparent") }
        },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900] } }, c.name),
          React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } }, c.proc),
          React.createElement(SPill, { status: c.status })
        ))
      ),
      React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", padding: 24, overflowY: "hidden" } },
        selectedMsgCase
          ? React.createElement(React.Fragment, null,
            React.createElement("div", { style: { marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid " + G[200] } },
              React.createElement("h2", { style: { fontFamily: serif, fontSize: 20, color: T[950] } }, selectedMsgCase.name),
              React.createElement("div", { style: { fontSize: 12, color: G[400] } }, selectedMsgCase.proc)
            ),
            React.createElement("div", { ref: msgBodyRef, style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 12 } },
              msgs.map((m, i) => {
                const showDate = i === 0 || msgs[i - 1].date !== m.date;
                return React.createElement("div", { key: i },
                  showDate && React.createElement("div", { style: { textAlign: "center", fontSize: 11, color: G[400], margin: "8px 0" } }, m.date),
                  React.createElement("div", { style: { display: "flex", justifyContent: m.side === "me" ? "flex-end" : "flex-start" } },
                    React.createElement("div", { style: { maxWidth: "72%", padding: "10px 14px", borderRadius: 12, background: m.side === "me" ? T[500] : G[100], color: m.side === "me" ? "#fff" : G[900], fontSize: 13.5, lineHeight: 1.6 } },
                      m.text,
                      React.createElement("div", { style: { fontSize: 10, marginTop: 4, opacity: 0.55, textAlign: "right" } }, m.time)
                    )
                  )
                );
              })
            ),
            React.createElement("div", { style: { display: "flex", gap: 10, paddingTop: 12, borderTop: "1px solid " + G[200] } },
              React.createElement("input", { value: msgInput, onChange: e => setMsgInput(e.target.value), onKeyDown: e => e.key === "Enter" && sendMsg(), placeholder: "Type a message...", style: { flex: 1, height: 42, border: "1px solid " + G[200], borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } }),
              React.createElement("button", { onClick: sendMsg, style: { ...s.btnPrimary, padding: "0 20px", display: "flex", alignItems: "center", gap: 7 } },
                React.createElement(Icon, { name: "send", size: 14, color: "#fff" }),
                "Send"
              )
            )
          )
          : React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: G[400], fontSize: 13 } }, "Select a case to view messages")
      )
    );
  };

  const TeamScreen = () => React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
    React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "My Team"),
    React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Patient care coordination team"),
    React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
      React.createElement(CoordStat, { label: "Active coordinators", value: COORD_COORDS.filter(c => c.status === "Active").length, color: T[700], icon: "users" }),
      React.createElement(CoordStat, { label: "Total active cases", value: COORD_COORDS.reduce((a, c) => a + c.cases, 0), color: T[500], icon: "clipboard" }),
      React.createElement(CoordStat, { label: "Languages covered", value: "4", color: G[500], icon: "globe" })
    ),
    COORD_COORDS.map((c, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 16, marginBottom: 12 } },
      React.createElement("div", { style: { width: 42, height: 42, borderRadius: "50%", background: T[100], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 17, fontWeight: 600, color: T[700], flexShrink: 0 } }, c.name[0]),
      React.createElement("div", { style: { flex: 1 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, c.name),
        React.createElement("div", { style: { fontSize: 12, color: G[500], marginTop: 2 } }, c.email),
        React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } }, "Languages: " + c.lang)
      ),
      React.createElement("div", { style: { textAlign: "center", flexShrink: 0 } },
        React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: T[600], fontFamily: serif } }, c.cases),
        React.createElement("div", { style: { fontSize: 10, color: G[400] } }, "cases")
      ),
      React.createElement("span", { style: { fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 500, background: c.status === "Active" ? T[50] : G[100], color: c.status === "Active" ? T[700] : G[500], border: "1px solid " + (c.status === "Active" ? T[100] : G[200]) } }, c.status),
      React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
        React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, c.rating + " \u2605"),
        React.createElement("button", { onClick: () => showToast("Viewing " + c.name), style: { ...s.btnGhost, fontSize: 12, padding: "6px 12px", marginTop: 4 } }, "View")
      )
    ))
  );

  const renderScreen = () => {
    if (screen === "overview") return OverviewScreen();
    if (screen === "cases") return CasesTable({ title: "All Cases", onRowClick: c => { setSelectedCase(c); navTo("All Cases", "caseDetail"); } });
    if (screen === "caseDetail") return CaseDetailScreen();
    if (screen === "pipeline") return PipelineScreen();
    if (screen === "messages") return MessagesScreen();
    if (screen === "team") return TeamScreen();
    return OverviewScreen();
  };

  return React.createElement("div", { style: { fontFamily: sans, background: G[50], minHeight: "100vh" } },
    toast && React.createElement(Toast, { msg: toast, onDone: () => setToast(null) }),
    React.createElement("div", { className: "dash-header", style: { height: 60, background: "#fff", borderBottom: "1px solid " + G[200], display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
        React.createElement("button", { className: "mobile-menu-btn", onClick: () => setSidebarOpen(o => !o), style: { background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" } },
          React.createElement(HamburgerIcon, { color: "#374151" })
        ),
        React.createElement("div", { style: { fontFamily: serif, fontSize: 19, fontWeight: 600, color: T[900], letterSpacing: "0.06em", textTransform: "uppercase" } },
          "Praes", React.createElement("span", { style: { color: T[500] } }, "enti")
        ),
        React.createElement("span", { style: { fontSize: 11, fontWeight: 500, color: T[500], letterSpacing: "0.08em", textTransform: "uppercase", marginLeft: 6 } }, "Coordinator")
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: G[700] } },
          React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T[700], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 14, fontWeight: 600, color: T[200] } }, initials),
          fullName
        ),
        React.createElement("button", { onClick: onSignOut, style: { background: "none", border: "1px solid " + G[200], color: G[500], padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: sans } }, "Sign out")
      )
    ),
    React.createElement("div", { style: { display: "flex", minHeight: "calc(100vh - 60px)", overflow: "hidden" } },
      React.createElement(CoordSidebar, null),
      React.createElement("div", { className: "dash-layout-inner", style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" } },
        renderScreen()
      )
    )
  );
};

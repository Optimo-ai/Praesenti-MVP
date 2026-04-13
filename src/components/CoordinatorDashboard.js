import { T, G, serif, sans, s, CASES, ADMIN_NOTES, RECOVERY_CHECKS, JOURNEY_STEPS } from '../constants.js';
import { fetchChecklist, saveChecklist, fetchDocuments } from '../supabase.js';
import { HamburgerIcon, Icon, SPill, Toast, Modal, IR } from './shared.js';

const { React } = window;
const { useState, useRef, useEffect } = React;

export const CoordinatorDashboard = ({ onSignOut, user }) => {
  const firstName = (user && user.fn) || "Ana";
  const lastName  = (user && user.ln) || "Rodriguez";
  const fullName  = (firstName + " " + lastName).trim() || "Coordinator";
  const initials  = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "C";

  const [screen, setScreen]           = useState("overview");
  const [sidebarItem, setSidebarItem] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(CASES[0]);
  const [toast, setToast]             = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [noteInput, setNoteInput]     = useState("");
  const [notes, setNotes]             = useState(ADMIN_NOTES);
  const [coordCheckDone, setCoordCheckDone] = useState(Array(RECOVERY_CHECKS.length).fill(false));
  const [coordDocs, setCoordDocs]     = useState([]);
  const [coordCaseTab, setCoordCaseTab] = useState("journey");
  const [saving, setSaving]           = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);

  const [coordAssign, setCoordAssign] = useState({ status:"", surgeon:"", clinic:"", home:"", nurse:"", surgery_date:"", discharge_date:"", home_checkin:"", notes:"" });
  const [coordAssignSaved, setCoordAssignSaved] = useState(false);

  useEffect(() => {
    if (selectedCase) {
      setCoordAssign({
        status: selectedCase.status || "", 
        surgeon: selectedCase.surgeon && selectedCase.surgeon !== "—" ? selectedCase.surgeon : "— Unassigned —", 
        clinic: selectedCase.clinic || "— Unassigned —",
        home: selectedCase.home || "— Unassigned —",
        nurse: selectedCase.nurse || "— Unassigned —",
        surgery_date: selectedCase.date || "", 
        discharge_date: "", 
        home_checkin: "", 
        notes: "" 
      });
      setCoordAssignSaved(false);
    }
  }, [selectedCase]);

  const COORD_DEMO_DOCS = {
    "C-001": [
      { id:"d1", name:"Passport_EmilyThornton.pdf",   size:"1.2 MB", req_type:"Passport / ID",     url:"#", created_at:"2026-03-01T10:00:00Z" },
      { id:"d2", name:"BloodTest_March2026.pdf",       size:"340 KB", req_type:"Blood work",        url:"#", created_at:"2026-03-10T14:30:00Z" },
      { id:"d3", name:"SurgeonLetter_Vargas.pdf",      size:"210 KB", req_type:"Medical clearance", url:"#", created_at:"2026-03-12T09:15:00Z" }
    ],
    "C-002": [{ id:"d4", name:"Passport_MarcusWebb.pdf",      size:"980 KB", req_type:"Passport / ID", url:"#", created_at:"2026-03-18T11:00:00Z" }],
    "C-003": [
      { id:"d5", name:"Passport_IsabelleFontaine.pdf", size:"1.1 MB", req_type:"Passport / ID",    url:"#", created_at:"2026-03-05T09:00:00Z" },
      { id:"d6", name:"ConsentForm_Signed.pdf",        size:"450 KB", req_type:"Consent form",     url:"#", created_at:"2026-03-14T16:00:00Z" },
      { id:"d7", name:"PreOp_Labwork.pdf",             size:"520 KB", req_type:"Blood work",       url:"#", created_at:"2026-03-15T08:30:00Z" }
    ],
    "C-004": [],
    "C-005": [{ id:"d9", name:"Passport_HannaBergstrom.pdf", size:"1.0 MB", req_type:"Passport / ID", url:"#", created_at:"2026-03-28T12:00:00Z" }]
  };

  useEffect(() => {
    if (selectedCase && selectedCase.caso_id_uuid) {
      const load = async () => {
        const data = await fetchChecklist(selectedCase.caso_id_uuid);
        setCoordCheckDone(data && data.items ? data.items : Array(RECOVERY_CHECKS.length).fill(false));
        const docs = await fetchDocuments(selectedCase.caso_id_uuid, null);
        setCoordDocs(docs && docs.length > 0 ? docs : (COORD_DEMO_DOCS[selectedCase.id] || []));
      };
      load();
    } else {
      setCoordCheckDone(Array(RECOVERY_CHECKS.length).fill(false));
      setCoordDocs(COORD_DEMO_DOCS[selectedCase?.id] || []);
    }
    setCoordCaseTab("journey");
  }, [selectedCase]);

  // ── messages (original working pattern) ───────────────────────────────
  const [selectedMsgCase, setSelectedMsgCase] = useState(CASES[0]);
  const [caseMessages, setCaseMessages] = useState(() => {
    const map = {};
    CASES.forEach(c => {
      map[c.id] = [
        { side:"them", text:"Hello, how should I prepare for surgery?",                                                time:"09:12", date:"March 20" },
        { side:"me",   text:"Hi "+c.name.split(" ")[0]+", I'll send the pre-op instructions this afternoon.",         time:"09:45", date:"March 20" },
        { side:"them", text:"Perfect, thank you very much.",                                                           time:"10:02", date:"March 20" }
      ];
    });
    return map;
  });
  const [msgs, setMsgs]       = useState(caseMessages[CASES[0].id]);
  const [msgInput, setMsgInput] = useState("");
  const msgBodyRef = useRef(null);
  useEffect(() => {
    if (msgBodyRef.current) msgBodyRef.current.scrollTop = msgBodyRef.current.scrollHeight;
  }, [msgs]);

  // ── notifications ──────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("praesenti_notifs_coord_" + (user?.id || "demo"));
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      { id:1, type:"case",      title:"New lead assigned",   body:"Rafael Oliveira requested a hair transplant consultation.",  time:"5 min ago",  read:false, caseId:"C-004" },
      { id:2, type:"message",   title:"Patient message",     body:"Emily Thornton sent a message about her recovery.",         time:"18 min ago", read:false, caseId:"C-001" },
      { id:3, type:"checklist", title:"Checklist updated",   body:"Marcus Webb pre-op checklist marked complete.",            time:"1h ago",     read:true,  caseId:"C-002" },
      { id:4, type:"alert",     title:"Follow-up pending",   body:"Isabelle Fontaine has her 7-day review today.",            time:"2h ago",     read:true,  caseId:"C-003" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("praesenti_notifs_coord_" + (user?.id || "demo"), JSON.stringify(notifications));
  }, [notifications, user?.id]);

  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const markRead    = id => setNotifications(ns => ns.map(n => n.id===id ? {...n, read:true} : n));
  const addNotif    = (notif) => setNotifications(ns => [{ id:Date.now(), ...notif, time:"Just now", read:false }, ...ns]);

  const showToast = (msg) => setToast(msg);

  const navTo = (item, scr) => {
    setSidebarItem(item);
    setScreen(scr || "overview");
    setSidebarOpen(false);
    history.pushState({ role:"coordinator", item, scr:scr||"overview", dash:"coordinator" }, "", "#coord/"+(scr||"overview"));
  };

  useEffect(() => {
    if (!history.state || history.state.dash !== "coordinator")
      history.replaceState({ item:sidebarItem, scr:screen, dash:"coordinator" }, "", "#coord/"+screen);
    const onPop = e => {
      const st = e.state;
      if (!st || st.dash !== "coordinator") { if (!st) { setScreen("overview"); setSidebarItem("Overview"); } return; }
      setSidebarItem(st.item); setScreen(st.scr || "overview");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleToggleCheck = async (i) => {
    const nd = [...coordCheckDone];
    nd[i] = !nd[i];
    setCoordCheckDone(nd);
    if (selectedCase && selectedCase.caso_id_uuid) {
      await saveChecklist(selectedCase.caso_id_uuid, nd, user?.email);
      showToast("Checklist updated");
    }
  };

  const saveNote = () => {
    if (!noteInput.trim()) return;
    const now = new Date();
    setNotes(n => [{ author:fullName, date:now.toLocaleDateString("en-US",{month:"short",day:"numeric"})+" \u00b7 "+now.getHours()+":"+String(now.getMinutes()).padStart(2,"0"), text:noteInput.trim() }, ...n]);
    setNoteInput("");
    showToast("Note saved");
  };

  // original working sendMsg
  const sendMsg = () => {
    if (!msgInput.trim()) return;
    const now  = new Date();
    const time = now.getHours()+":"+String(now.getMinutes()).padStart(2,"0");
    const newMsg = { side:"me", text:msgInput.trim(), time, date:"Today" };
    const caseId = selectedMsgCase.id;
    setCaseMessages(prev => {
      const updated = { ...prev, [caseId]:[...(prev[caseId]||[]), newMsg] };
      setMsgs(updated[caseId]);
      return updated;
    });
    setMsgInput("");
    setTimeout(() => {
      const reply = { side:"them", text:"Thanks for the info, coordinator.", time, date:"Today" };
      setCaseMessages(prev => {
        const updated = { ...prev, [caseId]:[...(prev[caseId]||[]), reply] };
        setMsgs(updated[caseId]);
        return updated;
      });
    }, 1200);
  };

  const filtered = CASES.filter(c =>
    c.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    c.proc.toLowerCase().includes(tableSearch.toLowerCase())
  );

  // ── Sidebar groups ─────────────────────────────────────────────────────
  const COORD_GROUPS = [
    ["Cases", [
      ["Overview",   "chartBar",   "overview"],
      ["All Cases",  "users",      "cases"],
      ["Pipeline",   "trendingUp", "pipeline"],
      ["Messages",   "message",    "messages"]
    ]],
    ["Case Actions", [
      ["Intake",     "clipboard",  "intake"],
      ["Assignment", "activity",   "assign"]
    ]],
    ["Team", [
      ["My Team",    "network",    "team"]
    ]]
  ];

  const COORD_PIPELINE_COLS = [
    { label:"New Lead",    color:"#6b7280", items:[{ name:"Rafael Oliveira", proc:"Hair Transplant", budget:"$3,100", country:"BR" },{ name:"Claire Marchand", proc:"Rhinoplasty", budget:"$3,900", country:"AU" }] },
    { label:"Qualified",   color:"#92400e", items:[{ name:"Marcus Webb", proc:"Liposuction", budget:"$6,800", country:"UK" },{ name:"Hanna Bergstr\u00f6m", proc:"Tummy Tuck", budget:"$7,200", country:"PL" }] },
    { label:"Matched",     color:"#1a7a72", items:[{ name:"Pietro Lombardi", proc:"Bariatric Surgery", budget:"$11,000", country:"MX" }] },
    { label:"Pre-op",      color:"#b45309", items:[{ name:"Marcus Webb", proc:"Liposuction", budget:"$6,800", country:"UK" }] },
    { label:"In Recovery", color:"#1a9e95", items:[{ name:"Emily Thornton", proc:"Rhinoplasty", budget:"$4,200", country:"USA" },{ name:"Sofia Mart\u00ednez", proc:"Breast Aug.", budget:"$5,500", country:"CA" }] },
    { label:"Completed",   color:"#059669", items:[{ name:"Yuki Tanaka", proc:"Dental Veneers", budget:"$2,100", country:"US" }] }
  ];

  const COORD_COORDS = [
    { name:"Laura Mendez",   cases:8, lang:"EN \u00b7 ES",          status:"Active",   email:"laura@praesenti.com",  rating:"4.9", phone:"+1 809 555 2001", joined:"Jan 2024", bio:"Senior care coordinator with expertise in plastic surgery cases." },
    { name:"Carlos Vega",    cases:5, lang:"EN \u00b7 ES \u00b7 PT", status:"Active",   email:"carlos@praesenti.com", rating:"4.8", phone:"+1 809 555 2002", joined:"Mar 2024", bio:"Trilingual coordinator specializing in bariatric and reconstructive cases." },
    { name:"Nadia Bertrand", cases:3, lang:"EN \u00b7 FR",           status:"Active",   email:"nadia@praesenti.com",  rating:"5.0", phone:"+1 809 555 2003", joined:"Jun 2024", bio:"French-English coordinator focused on European patient experience." },
    { name:"Kevin Osei",     cases:0, lang:"EN",                    status:"On leave", email:"kevin@praesenti.com",  rating:"4.7", phone:"+1 809 555 2004", joined:"Sep 2023", bio:"Experienced coordinator currently on scheduled leave. Returns Q2 2026." }
  ];

  // ── Shared helpers ─────────────────────────────────────────────────────
  const CoordStat = ({ label, value, color, icon }) => React.createElement("div", { style:{ ...s.card, marginBottom:0 } },
    React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 } },
      React.createElement("div", { style:s.label }, label),
      React.createElement(Icon, { name:icon, size:14, color })
    ),
    React.createElement("div", { style:{ fontFamily:serif, fontSize:32, fontWeight:600, color } }, value)
  );

  const FLb  = ({ t }) => React.createElement("label", { style:{ display:"block", fontSize:12, fontWeight:500, color:G[700], marginBottom:5 } }, t);
  const FIn  = ({ val, onChange, ph }) => React.createElement("input", { value:val, onChange, placeholder:ph, style:{ width:"100%", height:40, border:`1px solid ${G[200]}`, borderRadius:7, padding:"0 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900] } });
  const FTa  = ({ val, onChange, ph, rows=3 }) => React.createElement("textarea", { value:val, onChange, placeholder:ph, rows, style:{ width:"100%", border:`1px solid ${G[200]}`, borderRadius:7, padding:"10px 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900], resize:"vertical" } });
  const FSel = ({ val, onChange, options }) => React.createElement("select", { value:val, onChange, style:{ width:"100%", height:40, border:`1px solid ${G[200]}`, borderRadius:7, padding:"0 12px", fontSize:13.5, fontFamily:sans, outline:"none", color:G[900], background:"#fff" } }, options.map(o => React.createElement("option",{key:o,value:o},o)));
  const FSec = ({ t }) => React.createElement("div", { style:{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T[500], marginTop:24, marginBottom:12, paddingBottom:8, borderBottom:`1px solid ${G[100]}` } }, t);
  const DRow = ({ l, children }) => React.createElement("div", { style:{ marginBottom:14 } }, React.createElement(FLb,{t:l}), children);

  // ── NotifBell ──────────────────────────────────────────────────────────
  const NotifBell = () => React.createElement("div", { style:{ position:"relative" } },
    notifOpen && React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 199 }, onClick: () => setNotifOpen(false) }),
    React.createElement("button", { onClick:()=>setNotifOpen(o=>!o), style:{ background:"none", border:`1px solid ${G[200]}`, borderRadius:8, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", zIndex: 200 } },
      React.createElement(Icon, { name:"alertCircle", size:18, color:unreadCount>0?T[600]:G[400] }),
      unreadCount>0 && React.createElement("span", { style:{ position:"absolute", top:-5, right:-5, width:18, height:18, borderRadius:"50%", background:T[500], color:"#fff", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid #fff" } }, unreadCount)
    ),
    notifOpen && React.createElement("div", { style:{ position:"absolute", right:0, top:46, width:320, background:"#fff", border:`1px solid ${G[200]}`, borderRadius:12, zIndex:200, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,.1)" } },
      React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:`1px solid ${G[100]}` } },
        React.createElement("span", { style:{ fontSize:13, fontWeight:600, color:G[900] } }, "Notifications"),
        unreadCount>0 && React.createElement("button", { onClick:()=>setNotifications(ns=>ns.map(n=>({...n,read:true}))), style:{ fontSize:11, color:T[600], background:"none", border:"none", cursor:"pointer", fontFamily:sans } }, "Mark all read")
      ),
      React.createElement("div", { style:{ maxHeight:320, overflowY:"auto" } },
        notifications.map(n => React.createElement("div", { key:n.id, onClick:()=>{ markRead(n.id); setNotifOpen(false); const c=CASES.find(x=>x.id===n.caseId); if(c){ setSelectedCase(c); navTo("All Cases","caseDetail"); } }, style:{ display:"flex", gap:12, padding:"12px 16px", borderBottom:`1px solid ${G[100]}`, cursor:"pointer", background:n.read?"#fff":T[50] } },
          React.createElement("div", { style:{ width:32, height:32, borderRadius:"50%", background:n.read?G[100]:T[100], display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 } },
            React.createElement(Icon, { name:({case:"clipboard",message:"message",checklist:"check",alert:"alertCircle"})[n.type]||"activity", size:14, color:n.read?G[400]:T[600] })
          ),
          React.createElement("div", { style:{ flex:1 } },
            React.createElement("div", { style:{ fontSize:13, fontWeight:n.read?400:600, color:G[900], marginBottom:2 } }, n.title),
            React.createElement("div", { style:{ fontSize:12, color:G[500], lineHeight:1.5, marginBottom:2 } }, n.body),
            React.createElement("div", { style:{ fontSize:11, color:G[400] } }, n.time)
          ),
          !n.read && React.createElement("div", { style:{ width:8, height:8, borderRadius:"50%", background:T[500], flexShrink:0, marginTop:6 } })
        ))
      )
    )
  );

  // ── CoordSidebar ───────────────────────────────────────────────────────
  const CoordSidebar = () => React.createElement(React.Fragment, null,
    React.createElement("div", { className:"sidebar-overlay"+(sidebarOpen?" open":""), onClick:()=>setSidebarOpen(false) }),
    React.createElement("div", { className:"app-sidebar"+(sidebarOpen?" open":""), style:{ background:T[950], width:220, flexShrink:0, padding:"22px 0", borderRight:"1px solid rgba(255,255,255,.06)" } },
      COORD_GROUPS.map(([grp, items]) => React.createElement("div", { key:grp },
        React.createElement("span", { style:{ fontSize:10, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,255,255,.2)", padding:"0 20px", marginBottom:8, marginTop:18, display:"block" } }, grp),
        items.map(([lbl, iconName, scr]) => React.createElement("div", {
          key:lbl,
          onClick:()=>{ navTo(lbl,scr); setSidebarOpen(false); },
          style:{ padding:"10px 20px", fontSize:13, color:sidebarItem===lbl?"#fff":"rgba(255,255,255,.45)", cursor:"pointer", borderLeft:"2px solid "+(sidebarItem===lbl?T[400]:"transparent"), background:sidebarItem===lbl?"rgba(255,255,255,.07)":"transparent", display:"flex", alignItems:"center", gap:9 }
        },
          React.createElement(Icon, { name:iconName, size:14, color:sidebarItem===lbl?T[300]:"rgba(255,255,255,.3)" }),
          lbl
        ))
      ))
    )
  );

  // ── DocsList ───────────────────────────────────────────────────────────
  const CoordDocsList = ({ docs }) => docs.length === 0
    ? React.createElement("div", { style:{ textAlign:"center", padding:"40px 20px" } },
        React.createElement(Icon, { name:"document", size:32, color:G[300] }),
        React.createElement("div", { style:{ marginTop:12, fontSize:13, color:G[400] } }, "No documents uploaded yet")
      )
    : React.createElement("div", { style:{ display:"flex", flexDirection:"column", gap:10 } },
        docs.map((d,i) => {
          const isDemo = !d.url || d.url==="#";
          const ext = (d.name||"").split(".").pop().toUpperCase();
          const extColor = ext==="PDF"?"#dc2626":T[600];
          return React.createElement("div", { key:d.id||i, style:{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", background:G[50], borderRadius:8, border:"1px solid "+G[200] } },
            React.createElement("div", { style:{ width:40, height:40, borderRadius:8, background:"#fff", border:"1px solid "+G[200], display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0, gap:1 } },
              React.createElement(Icon, { name:"document", size:14, color:extColor }),
              React.createElement("span", { style:{ fontSize:8, fontWeight:700, color:extColor } }, ext)
            ),
            React.createElement("div", { style:{ flex:1, minWidth:0 } },
              React.createElement("div", { style:{ fontSize:13, fontWeight:500, color:G[900], whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" } }, d.name),
              React.createElement("div", { style:{ fontSize:11, color:G[400], marginTop:2 } }, (d.size||"")+(d.req_type?" \u00b7 "+d.req_type:"")+(d.created_at?" \u00b7 "+new Date(d.created_at).toLocaleDateString():""))
            ),
            isDemo
              ? React.createElement("span", { style:{ fontSize:11, color:G[400], padding:"6px 12px", border:"1px solid "+G[200], borderRadius:6 } }, "Demo file")
              : React.createElement("a", { href:d.url, target:"_blank", rel:"noopener noreferrer", download:d.name, style:{ ...s.btnPrimary, fontSize:11, padding:"6px 14px", textDecoration:"none", display:"flex", alignItems:"center", gap:5, flexShrink:0 } },
                  React.createElement(Icon, { name:"download", size:12, color:"#fff" }), "Download"
                )
          );
        })
      );

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });

  // ── CasesTable ─────────────────────────────────────────────────────────
  const CasesTable = ({ title, onRowClick }) => React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } },
    React.createElement("h1", { style:{ fontFamily:serif, fontSize:26, color:T[950], marginBottom:4 } }, title),
    React.createElement("p", { style:{ color:G[400], fontSize:13, marginBottom:28 } }, CASES.length+" active cases"),
    React.createElement("div", { style:{ ...s.card } },
      React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 } },
        React.createElement("div", { style:s.label }, "Cases"),
        React.createElement("input", { value:tableSearch, onChange:e=>setTableSearch(e.target.value), placeholder:"Search...", style:{ height:34, border:"1px solid "+G[200], borderRadius:7, padding:"0 12px", fontSize:12.5, fontFamily:sans, outline:"none", color:G[900], width:200 } })
      ),
      React.createElement("div", { className:"table-scroll" },
      React.createElement("table", { style:{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:700 } },
          React.createElement("thead", null, React.createElement("tr", { style:{ textAlign:"left" } },
            ["ID","Patient","Procedure","Status","Surgery","Surgeon","Budget","Country"].map(h =>
              React.createElement("th", { key:h, className:["ID","Surgeon","Country"].includes(h)?"col-hide-xs":"", style:{ ...s.label, paddingBottom:10, borderBottom:"1px solid "+G[200], fontWeight:600 } }, h)
            )
          )),
          React.createElement("tbody", null,
            filtered.map(c => React.createElement("tr", { key:c.id, onClick:()=>onRowClick(c), style:{ cursor:"pointer", borderBottom:"1px solid "+G[100] }, onMouseEnter:e=>e.currentTarget.style.background=G[50], onMouseLeave:e=>e.currentTarget.style.background="transparent" },
              React.createElement("td", { className:"col-hide-xs", style:{ padding:"10px 0", color:G[400], fontSize:11 } }, c.id),
              React.createElement("td", { style:{ padding:"10px 8px", fontWeight:500 } }, c.name),
              React.createElement("td", { style:{ padding:"10px 8px", color:G[600] } }, c.proc),
              React.createElement("td", { style:{ padding:"10px 8px" } }, React.createElement(SPill, { status:c.status })),
              React.createElement("td", { style:{ padding:"10px 8px", color:G[500] } }, c.date),
              React.createElement("td", { className:"col-hide-xs", style:{ padding:"10px 8px", color:G[600] } }, c.surgeon),
              React.createElement("td", { style:{ padding:"10px 8px", color:T[600], fontWeight:500 } }, c.budget),
              React.createElement("td", { className:"col-hide-xs", style:{ padding:"10px 8px", color:G[500] } }, c.country)
            ))
          )
        )
      )
    )
  );

  // ── OverviewScreen ─────────────────────────────────────────────────────
  const OverviewScreen = () => React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } },
    React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 } },
      React.createElement("div", null,
        React.createElement("h1", { style:{ fontFamily:serif, fontSize:28, color:T[950], marginBottom:4 } }, "Good morning, "+firstName),
        React.createElement("p", { style:{ color:G[400], fontSize:13 } }, dateStr)
      )
    ),
    React.createElement("div", { className:"grid-4", style:{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 } },
      React.createElement(CoordStat, { label:"Active cases",     value:CASES.length,                                  color:T[700], icon:"users" }),
      React.createElement(CoordStat, { label:"In recovery",      value:CASES.filter(c=>c.status==="Recovery").length,  color:T[500], icon:"heart" }),
      React.createElement(CoordStat, { label:"Pre-op this week", value:CASES.filter(c=>c.status==="Pre-op").length,    color:"#92400e", icon:"calendar" }),
      React.createElement(CoordStat, { label:"Leads",            value:CASES.filter(c=>c.status==="Lead").length,      color:G[500], icon:"trendingUp" })
    ),
    React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 } },
      React.createElement("div", { style:s.card },
        React.createElement("div", { style:{ ...s.label, marginBottom:14 } }, "Needs attention"),
        [
          { label:"Emily Thornton",  tag:"7-day follow-up today",  color:"#dc2626", bg:"#fef2f2", icon:"alertCircle", caseId:"C-001" },
          { label:"Marcus Webb",     tag:"Payment pending",         color:"#92400e", bg:"#fef3c7", icon:"creditCard",  caseId:"C-002" },
          { label:"Rafael Oliveira", tag:"Intake not completed",   color:G[500],   bg:G[50],     icon:"clipboard",   caseId:"C-004" }
        ].map((item,i) => React.createElement("div", { key:i, style:{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<2?`1px solid ${G[100]}`:"none", cursor:"pointer" }, onClick:()=>{ const c=CASES.find(x=>x.id===item.caseId); if(c){ setSelectedCase(c); navTo("All Cases","caseDetail"); } } },
          React.createElement("div", { style:{ width:32, height:32, borderRadius:8, background:item.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 } },
            React.createElement(Icon, { name:item.icon, size:14, color:item.color })
          ),
          React.createElement("div", { style:{ flex:1 } },
            React.createElement("div", { style:{ fontSize:13, fontWeight:500, color:G[900] } }, item.label),
            React.createElement("div", { style:{ fontSize:11, color:item.color, marginTop:1 } }, item.tag)
          ),
          React.createElement(Icon, { name:"arrowLeft", size:13, color:G[300], style:{ transform:"rotate(180deg)" } })
        ))
      ),
      React.createElement("div", { style:s.card },
        React.createElement("div", { style:{ ...s.label, marginBottom:14 } }, "Quick actions"),
        [
          { label:"Start intake",  icon:"clipboard",  scr:"intake",   desc:"Evaluate a new patient" },
          { label:"Assign case",   icon:"activity",   scr:"assign",   desc:"Update surgeon & home" },
          { label:"View pipeline", icon:"trendingUp", scr:"pipeline", desc:"Overview by stage" },
          { label:"Send message",  icon:"message",    scr:"messages", desc:"Chat with a patient" }
        ].map((a,i) => React.createElement("div", { key:i, style:{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<3?`1px solid ${G[100]}`:"none", cursor:"pointer" }, onClick:()=>navTo(a.label,a.scr) },
          React.createElement("div", { style:{ width:32, height:32, borderRadius:8, background:T[50], display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 } },
            React.createElement(Icon, { name:a.icon, size:14, color:T[600] })
          ),
          React.createElement("div", { style:{ flex:1 } },
            React.createElement("div", { style:{ fontSize:13, fontWeight:500, color:G[900] } }, a.label),
            React.createElement("div", { style:{ fontSize:11, color:G[400], marginTop:1 } }, a.desc)
          ),
          React.createElement(Icon, { name:"arrowLeft", size:13, color:G[300], style:{ transform:"rotate(180deg)" } })
        ))
      )
    ),
    React.createElement("div", { style:s.card },
      React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 } },
        React.createElement("div", { style:s.label }, "Recent cases"),
        React.createElement("input", { value:tableSearch, onChange:e=>setTableSearch(e.target.value), placeholder:"Search...", style:{ height:34, border:"1px solid "+G[200], borderRadius:7, padding:"0 12px", fontSize:12.5, fontFamily:sans, outline:"none", color:G[900], width:180 } })
      ),
      React.createElement("div", { className:"table-scroll" },
      React.createElement("table", { style:{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:700 } },
          React.createElement("thead", null, React.createElement("tr", { style:{ textAlign:"left" } },
            ["Patient","Procedure","Status","Surgery","Budget"].map(h =>
              React.createElement("th", { key:h, style:{ ...s.label, paddingBottom:10, borderBottom:"1px solid "+G[200], fontWeight:600 } }, h)
            )
          )),
          React.createElement("tbody", null,
            filtered.slice(0,5).map(c => React.createElement("tr", { key:c.id, onClick:()=>{ setSelectedCase(c); navTo("All Cases","caseDetail"); }, style:{ cursor:"pointer", borderBottom:"1px solid "+G[100] }, onMouseEnter:e=>e.currentTarget.style.background=G[50], onMouseLeave:e=>e.currentTarget.style.background="transparent" },
              React.createElement("td", { style:{ padding:"10px 8px", fontWeight:500 } }, c.name),
              React.createElement("td", { style:{ padding:"10px 8px", color:G[600] } }, c.proc),
              React.createElement("td", { style:{ padding:"10px 8px" } }, React.createElement(SPill, { status:c.status })),
              React.createElement("td", { style:{ padding:"10px 8px", color:G[500] } }, c.date),
              React.createElement("td", { style:{ padding:"10px 8px", color:T[600], fontWeight:500 } }, c.budget)
            ))
          )
        )
      )
    )
  );

  // ── IntakeScreen ───────────────────────────────────────────────────────
  const IntakeScreen = () => {
    const c = selectedCase;
    const [form, setForm] = React.useState({ proc_confirmed:"", budget:"", surgery_date:"", lang_pref:"English", diet:"", mobility:"None", companion:"None", home_pref:"", physician_notes:"", notes_special:"" });
    const [health, setHealth] = React.useState([]);
    const [saved, setSaved]   = React.useState(false);
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const HEALTH_OPTS = ["Diabetes","Hypertension","Cardiac condition","Asthma","Allergies","Previous surgeries","None"];
    const PROCS = ["Rhinoplasty","Breast Augmentation","Liposuction","Tummy Tuck","Facelift","Bariatric Surgery","Hair Transplant","Dental Veneers","Other"];
    if (saved) return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, display:"flex", alignItems:"center", justifyContent:"center" } },
      React.createElement("div", { style:{ textAlign:"center", maxWidth:400 } },
        React.createElement("div", { style:{ width:60, height:60, borderRadius:"50%", background:T[50], border:`2px solid ${T[200]}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" } }, React.createElement(Icon, { name:"check", size:26, color:T[600] })),
        React.createElement("h2", { style:{ fontFamily:serif, fontSize:22, color:T[950], marginBottom:8 } }, "Intake saved"),
        React.createElement("p", { style:{ fontSize:14, color:G[500], lineHeight:1.7, marginBottom:24 } }, "Initial evaluation for "+c.name+" has been recorded."),
        React.createElement("div", { style:{ display:"flex", gap:12, justifyContent:"center" } },
          React.createElement("button", { onClick:()=>navTo("Assignment","assign"), style:{ ...s.btnPrimary, padding:"10px 24px", fontSize:13 } }, "Go to assignment"),
          React.createElement("button", { onClick:()=>navTo("All Cases","cases"),   style:{ ...s.btnGhost,   padding:"10px 20px", fontSize:13 } }, "View cases")
        )
      )
    );
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } },
      React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:14, marginBottom:24 } },
        React.createElement("button", { onClick:()=>navTo("All Cases","cases"), style:{ ...s.btnGhost, fontSize:12, padding:"7px 14px", display:"flex", alignItems:"center", gap:6 } }, React.createElement(Icon,{name:"arrowLeft",size:13,color:G[600]}), "Cases"),
        React.createElement("div", null, React.createElement("h1",{style:{fontFamily:serif,fontSize:24,color:T[950],marginBottom:2}},"Initial Intake"), React.createElement("div",{style:{fontSize:13,color:G[500]}},c.name+" \u00b7 "+c.proc))
      ),
      React.createElement("div", { className:"grid-2", style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 } },
        React.createElement("div", { style:s.card },
          React.createElement(FSec,{t:"Procedure & Budget"}),
          React.createElement("div",{style:{marginBottom:14}},React.createElement(FLb,{t:"Confirmed procedure"}),React.createElement(FSel,{val:form.proc_confirmed,onChange:set("proc_confirmed"),options:["-- Select --",...PROCS]})),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}},
            React.createElement("div",null,React.createElement(FLb,{t:"Budget (USD)"}),React.createElement(FIn,{val:form.budget,onChange:set("budget"),ph:"$5,000"})),
            React.createElement("div",null,React.createElement(FLb,{t:"Target date"}),React.createElement(FIn,{val:form.surgery_date,onChange:set("surgery_date"),ph:"May 2026"}))
          ),
          React.createElement(FSec,{t:"Health conditions"}),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}},
            HEALTH_OPTS.map(h=>React.createElement("label",{key:h,style:{display:"flex",alignItems:"center",gap:8,fontSize:13,color:G[700],cursor:"pointer",padding:"5px 0"}},
              React.createElement("input",{type:"checkbox",checked:health.includes(h),onChange:()=>setHealth(p=>p.includes(h)?p.filter(x=>x!==h):[...p,h]),style:{accentColor:T[500],width:15,height:15}}), h
            ))
          ),
          React.createElement(FSec,{t:"Clinical notes"}),
          React.createElement(FTa,{val:form.physician_notes,onChange:set("physician_notes"),ph:"Physician observations...",rows:4})
        ),
        React.createElement("div", { style:s.card },
          React.createElement(FSec,{t:"Patient preferences"}),
          React.createElement("div",{style:{marginBottom:14}},React.createElement(FLb,{t:"Preferred language"}),React.createElement(FSel,{val:form.lang_pref,onChange:set("lang_pref"),options:["English","Spanish","French","Portuguese","Italian"]})),
          React.createElement("div",{style:{marginBottom:14}},React.createElement(FLb,{t:"Dietary restrictions"}),React.createElement(FIn,{val:form.diet,onChange:set("diet"),ph:"e.g. Vegetarian, gluten-free..."})),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}},
            React.createElement("div",null,React.createElement(FLb,{t:"Reduced mobility"}),React.createElement(FSel,{val:form.mobility,onChange:set("mobility"),options:["None","Mild","Moderate","Severe"]})),
            React.createElement("div",null,React.createElement(FLb,{t:"Companion"}),React.createElement(FSel,{val:form.companion,onChange:set("companion"),options:["None","Yes, 1 person","Yes, 2 people"]}))
          ),
          React.createElement(FSec,{t:"Recovery home"}),
          React.createElement("div",{style:{marginBottom:14}},React.createElement(FLb,{t:"Preference"}),React.createElement(FIn,{val:form.home_pref,onChange:set("home_pref"),ph:"Name or desired features"})),
          React.createElement(FSec,{t:"Additional notes"}),
          React.createElement("div",{style:{marginBottom:24}},React.createElement(FTa,{val:form.notes_special,onChange:set("notes_special"),ph:"Special needs, cultural context...",rows:4})),
          React.createElement("div",{style:{display:"flex",gap:10}},
            React.createElement("button",{onClick:()=>{ addNotif({type:"checklist",title:"Intake completed",body:"Intake for "+c.name+" was saved.",caseId:c.id}); setSaved(true); },style:{...s.btnPrimary,padding:"11px 28px",fontSize:13}},"Save intake"),
            React.createElement("button",{onClick:()=>navTo("All Cases","cases"),style:{...s.btnGhost,padding:"11px 20px",fontSize:13}},"Cancel")
          )
        )
      )
    );
  };

  // ── AssignmentScreen ───────────────────────────────────────────────────
  const AssignmentScreen = () => {
    const c = selectedCase;
    const assign = coordAssign;
    const setAssign = setCoordAssign;
    const saved = coordAssignSaved;
    const setSaved = setCoordAssignSaved;
    const set = k => e => setAssign(a=>({...a,[k]:e.target.value}));
    const STATUS_OPTS  = ["Lead","Qualified","Matched","Pre-op","Recovery","Completed"];
    const SURGEON_OPTS = ["\u2014 Unassigned \u2014", "Dr. Marcus Varela", "Dr. Carlos Romero", "Dr. Ivan Castillo", "Dr. Ramon Herrera", "Dr. A. Vargas", "Dr. C. Romero", "Dr. M. Medina"];
    const CLINIC_OPTS  = ["\u2014 Unassigned \u2014", "Bella Forma Clinic", "Centro Medico", "Clinica del Sol", "DentalPro", "Cl\u00ednica Vida", "Hospital del Este"];
    const HOME_OPTS    = ["\u2014 Unassigned \u2014", "Villa Serena", "Casa Brisa", "Punta Suites", "Residencial Sol"];
    const NURSE_OPTS   = ["\u2014 Unassigned \u2014", "Ana Reyes (Post-op Care)", "Mar\u00eda Santos (Wound Care)", "Carmen L\u00f3pez (General Nursing)"];

    const handleRecommend = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const budgetNum = parseInt(String(c.budget || "").replace(/[^0-9]/g, "")) || 5000;
      const proc = String(c.proc || "").toLowerCase();
      let bestSurgeon = "\u2014 Unassigned \u2014";
      let bestClinic = "\u2014 Unassigned \u2014";
      let bestHome = "\u2014 Unassigned \u2014";
      let bestNurse = "\u2014 Unassigned \u2014";
      if (proc.includes("hair")) { bestSurgeon = "Dr. Ivan Castillo"; bestClinic = "Clinica del Sol"; bestNurse = "Carmen L\u00f3pez (General Nursing)"; }
      else if (proc.includes("bariatric") || proc.includes("weight")) { bestSurgeon = "Dr. Carlos Romero"; bestClinic = "Centro Medico"; bestNurse = "Mar\u00eda Santos (Wound Care)"; }
      else if (proc.includes("dental") || proc.includes("veneer")) { bestSurgeon = "Dr. Ramon Herrera"; bestClinic = "DentalPro"; bestNurse = "Carmen L\u00f3pez (General Nursing)"; }
      else { bestSurgeon = "Dr. Marcus Varela"; bestClinic = "Bella Forma Clinic"; bestNurse = "Ana Reyes (Post-op Care)"; }
      if (budgetNum > 6000) bestHome = "Punta Suites";
      else if (budgetNum > 4000) bestHome = "Villa Serena";
      else bestHome = "Residencial Sol";
      setAssign(a => ({ ...a, surgeon: bestSurgeon, clinic: bestClinic, home: bestHome, nurse: bestNurse }));
      showToast("AI match applied based on budget \u0026 procedure");
    };

    const handleSave = async () => {
      setSaving(true);
      try {
        if (c.caso_id_uuid) {
          const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
          const SUPA_KEY = import.meta.env.VITE_SUPABASE_KEY;
          if (SUPA_URL && SUPA_KEY) {
            await fetch(`${SUPA_URL}/rest/v1/caso?caso_id=eq.${c.caso_id_uuid}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, Prefer: "return=minimal" },
              body: JSON.stringify({
                cirujano_id: assign.surgeon !== "\u2014 Unassigned \u2014" ? assign.surgeon : null,
                clinica_id: assign.clinic !== "\u2014 Unassigned \u2014" ? assign.clinic : null,
                recovery_home_id: assign.home !== "\u2014 Unassigned \u2014" ? assign.home : null,
                nurse_id: assign.nurse !== "\u2014 Unassigned \u2014" ? assign.nurse : null,
                estado: assign.status.toLowerCase()
              })
            });
          }
        }
        
        c.surgeon = assign.surgeon !== "\u2014 Unassigned \u2014" ? assign.surgeon : null;
        c.clinic = assign.clinic !== "\u2014 Unassigned \u2014" ? assign.clinic : null;
        c.home = assign.home !== "\u2014 Unassigned \u2014" ? assign.home : null;
        c.nurse = assign.nurse !== "\u2014 Unassigned \u2014" ? assign.nurse : null;
        c.status = assign.status;

        addNotif({ type:"case", title:"Case updated", body:`${c.name} assigned to ${assign.surgeon}.`, caseId:c.id });
        setSaving(false); setSaved(true);
      } catch(e) { console.error(e); showToast("Error updating assignment"); setSaving(false); }
    };
    if (saved) return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, display:"flex", alignItems:"center", justifyContent:"center" } },
      React.createElement("div", { style:{ textAlign:"center", maxWidth:380 } },
        React.createElement("div", { style:{ width:60, height:60, borderRadius:"50%", background:T[50], border:`2px solid ${T[200]}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" } }, React.createElement(Icon, { name:"check", size:26, color:T[600] })),
        React.createElement("h2", { style:{ fontFamily:serif, fontSize:22, color:T[950], marginBottom:8 } }, "Assignment saved"),
        React.createElement("p", { style:{ fontSize:14, color:G[500], lineHeight:1.7, marginBottom:24 } }, "Changes saved for "+c.name+"."),
        React.createElement("div", { style:{ display:"flex", gap:12, justifyContent:"center" } },
          React.createElement("button",{onClick:()=>setSaved(false),style:{...s.btnGhost,padding:"10px 20px",fontSize:13}},"Keep editing"),
          React.createElement("button",{onClick:()=>navTo("All Cases","cases"),style:{...s.btnPrimary,padding:"10px 24px",fontSize:13}},"View cases")
        )
      )
    );
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } },
      React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:14, marginBottom:24 } },
        React.createElement("button",{onClick:()=>navTo("All Cases","cases"),style:{...s.btnGhost,fontSize:12,padding:"7px 14px",display:"flex",alignItems:"center",gap:6}},React.createElement(Icon,{name:"arrowLeft",size:13,color:G[600]}),"Cases"),
        React.createElement("div",null,React.createElement("h1",{style:{fontFamily:serif,fontSize:24,color:T[950],marginBottom:2}},"Assignment Panel"),React.createElement("div",{style:{fontSize:13,color:G[500]}},c.name+" \u00b7 "+c.proc)),
        React.createElement(SPill,{status:c.status})
      ),
      React.createElement("div", { className:"grid-2", style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 } },
        React.createElement("div", { style:{ display:"flex", flexDirection:"column", gap:14 } },
          React.createElement("div", { style:s.card },
            React.createElement("div",{style:{...s.label,marginBottom:16}},"Case status"),
            React.createElement(DRow,{l:"Pipeline stage"},React.createElement(FSel,{val:assign.status,onChange:set("status"),options:STATUS_OPTS})),
            React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}},
              React.createElement(DRow,{l:"Surgery date"},React.createElement(FIn,{val:assign.surgery_date,onChange:set("surgery_date"),ph:"Apr 09, 2026"})),
              React.createElement(DRow,{l:"Discharge date"},React.createElement(FIn,{val:assign.discharge_date,onChange:set("discharge_date"),ph:"Apr 23, 2026"}))
            )
          ),
          React.createElement("div", { style:s.card },
            React.createElement("div",{style:{...s.label,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}},
              "Medical team",
              React.createElement("button", { onClick: handleRecommend, style: { ...s.btnGhost, padding: "4px 10px", fontSize: 11, color: T[600], borderColor: T[200], background: T[50], display: "flex", alignItems: "center", gap: 4 } }, "Recommend")
            ),
            React.createElement(DRow,{l:"Assigned surgeon"},React.createElement(FSel,{val:assign.surgeon,onChange:set("surgeon"),options:SURGEON_OPTS})),
            React.createElement(DRow,{l:"Assigned clinic"},React.createElement(FSel,{val:assign.clinic,onChange:set("clinic"),options:CLINIC_OPTS})),
            React.createElement(DRow,{l:"Assigned nurse"},React.createElement(FSel,{val:assign.nurse,onChange:set("nurse"),options:NURSE_OPTS})),
            assign.surgeon && assign.surgeon!=="\u2014 Unassigned \u2014" && React.createElement("div",{style:{padding:"10px 14px",background:T[50],border:`1px solid ${T[100]}`,borderRadius:8,marginTop:-4,fontSize:12.5,color:T[700]}},assign.surgeon+" will be notified of this case.")
          ),
          React.createElement("div", { style:s.card },
            React.createElement("div",{style:{...s.label,marginBottom:12}},"Coordinator notes"),
            React.createElement(FTa,{val:assign.notes,onChange:set("notes"),ph:"Internal notes...",rows:3})
          )
        ),
        React.createElement("div", { style:{ display:"flex", flexDirection:"column", gap:14 } },
          React.createElement("div", { style:s.card },
            React.createElement("div",{style:{...s.label,marginBottom:16}},"Recovery home"),
            React.createElement(DRow,{l:"Assigned home"},React.createElement(FSel,{val:assign.home,onChange:set("home"),options:HOME_OPTS})),
            React.createElement(DRow,{l:"Check-in date"},React.createElement(FIn,{val:assign.home_checkin,onChange:set("home_checkin"),ph:"Apr 09, 2026"})),
            assign.home && assign.home!=="\u2014 Unassigned \u2014" && React.createElement("div",{style:{padding:"10px 14px",background:T[50],border:`1px solid ${T[100]}`,borderRadius:8,marginTop:-4,fontSize:12.5,color:T[700]}},"Pending reservation at "+assign.home+".")
          ),
          React.createElement("div", { style:s.card },
            React.createElement("div",{style:{...s.label,marginBottom:12}},"Case summary"),
            [["Patient",c.name],["Procedure",c.proc],["Budget",c.budget],["Country",c.country]].map(([l,v])=>
              React.createElement("div",{key:l,style:{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${G[100]}`,fontSize:13}},
                React.createElement("span",{style:{color:G[500]}},l), React.createElement("span",{style:{fontWeight:500,color:G[900]}},v)
              )
            ),
            React.createElement("div",{style:{display:"flex",gap:10,marginTop:20}},
              React.createElement("button",{onClick:handleSave,disabled:saving,style:{...s.btnPrimary,flex:1,padding:"11px 0",fontSize:13,opacity:saving?.7:1}},saving?"Saving...":"Save changes"),
              React.createElement("button",{onClick:()=>navTo("Intake","intake"),style:{...s.btnGhost,flex:1,padding:"11px 0",fontSize:13}},"View intake")
            )
          )
        )
      )
    );
  };

  // ── CaseDetailScreen ───────────────────────────────────────────────────
  const CaseDetailScreen = () => React.createElement("div", { className:"case-detail-layout", style:{ flex:1, display:"flex", overflow:"hidden" } },
    React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:28, overflowY:"auto" } },
      React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:14, marginBottom:20 } },
        React.createElement("button",{onClick:()=>navTo("All Cases","cases"),style:{...s.btnGhost,fontSize:12,padding:"7px 14px",display:"flex",alignItems:"center",gap:6}},React.createElement(Icon,{name:"arrowLeft",size:13,color:G[600]}),"Back"),
        React.createElement("h2",{style:{fontFamily:serif,fontSize:22,color:T[950]}},selectedCase.name),
        React.createElement(SPill,{status:selectedCase.status})
      ),
      React.createElement("div", { style:{ ...s.card, marginBottom:16 } },
        React.createElement("div",{style:{...s.label,marginBottom:10}},"Case details"),
        React.createElement(IR,{k:"Case ID",v:selectedCase.id}),
        React.createElement(IR,{k:"Procedure",v:selectedCase.proc}),
        React.createElement(IR,{k:"Surgeon",v:selectedCase.surgeon}),
        React.createElement(IR,{k:"Budget",v:selectedCase.budget}),
        React.createElement(IR,{k:"Country",v:selectedCase.country}),
        React.createElement(IR,{k:"Surgery date",v:selectedCase.date}),
        React.createElement("div",{style:{display:"flex",gap:8,marginTop:14}},
          React.createElement("button",{onClick:()=>navTo("Intake","intake"),style:{...s.btnGhost,fontSize:12,padding:"7px 14px",flex:1}},"Intake"),
          React.createElement("button",{onClick:()=>navTo("Assignment","assign"),style:{...s.btnPrimary,fontSize:12,padding:"7px 14px",flex:1}},"Assignment")
        )
      ),
    React.createElement("div", { className:"case-tabs", style:{ display:"flex", gap:20, borderBottom:"1px solid "+G[200], marginBottom:20 } },
        [["journey","Journey"],["checklist","Checklist"],["documents","Documents ("+coordDocs.length+")"],["messages","Messages"]].map(([k,lbl])=>
          React.createElement("button",{key:k,onClick:()=>setCoordCaseTab(k),style:{padding:"0 4px 12px",fontSize:13.5,fontWeight:500,color:coordCaseTab===k?T[700]:G[500],borderBottom:"2.5px solid "+(coordCaseTab===k?T[500]:"transparent"),background:"none",border:"none",cursor:"pointer"}},lbl)
        )
      ),
      coordCaseTab==="journey" && React.createElement("div",{style:s.card},
        React.createElement("div",{style:{...s.label,marginBottom:14}},"Journey timeline"),
        JOURNEY_STEPS.map((step,i)=>React.createElement("div",{key:i,style:{display:"flex",alignItems:"center",gap:14,padding:"8px 0",borderBottom:i<JOURNEY_STEPS.length-1?"1px solid "+G[100]:"none"}},
          React.createElement("div",{style:{width:20,height:20,borderRadius:"50%",background:step.done?T[500]:G[200],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}, step.done&&React.createElement(Icon,{name:"check",size:9,color:"#fff"})),
          React.createElement("div",{style:{flex:1,fontSize:13,color:step.done?G[900]:G[400]}},step.label),
          React.createElement("div",{style:{fontSize:11,color:G[400]}},step.date)
        ))
      ),
      coordCaseTab==="checklist" && React.createElement("div",{style:s.card},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},
          React.createElement("div",{style:s.label},"Recovery checklist"),
          React.createElement("div",{style:{fontSize:12,color:G[400]}},coordCheckDone.filter(Boolean).length+" / "+RECOVERY_CHECKS.length+" complete")
        ),
        React.createElement("div",{style:{height:4,background:G[100],borderRadius:2,marginBottom:16,overflow:"hidden"}},
          React.createElement("div",{style:{height:"100%",width:((coordCheckDone.filter(Boolean).length/RECOVERY_CHECKS.length)*100).toFixed(0)+"%",background:T[500],borderRadius:2,transition:"width .3s"}})
        ),
        RECOVERY_CHECKS.map((item,i)=>React.createElement("div",{key:i,style:{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<RECOVERY_CHECKS.length-1?"1px solid "+G[100]:"none",cursor:"pointer"},onClick:()=>handleToggleCheck(i)},
          React.createElement("div",{style:{width:18,height:18,borderRadius:4,border:"2px solid "+(coordCheckDone[i]?T[500]:G[300]),background:coordCheckDone[i]?T[500]:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}, coordCheckDone[i]&&React.createElement(Icon,{name:"check",size:9,color:"#fff"})),
          React.createElement("span",{style:{fontSize:13,color:coordCheckDone[i]?G[400]:G[700],textDecoration:coordCheckDone[i]?"line-through":"none"}},item)
        ))
      ),
      coordCaseTab==="documents" && React.createElement("div",{style:s.card},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},
          React.createElement("div",{style:s.label},"Patient documents"),
          React.createElement("span",{style:{fontSize:12,color:G[400]}},coordDocs.length+" file"+(coordDocs.length!==1?"s":""))
        ),
        React.createElement(CoordDocsList,{docs:coordDocs})
      ),
      coordCaseTab==="messages" && React.createElement("div",{style:{...s.card,padding:0,height:420,display:"flex",flexDirection:"column",overflow:"hidden"}},
        React.createElement("div",{ref:msgBodyRef,style:{flex:1,padding:20,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,background:G[50]}},
          (caseMessages[selectedCase.id]||[]).map((m,i)=>React.createElement("div",{key:i,style:{alignSelf:m.side==="me"?"flex-end":"flex-start",maxWidth:"75%"}},
            React.createElement("div",{style:{padding:"10px 14px",borderRadius:12,background:m.side==="me"?T[500]:"#fff",color:m.side==="me"?"#fff":G[900],fontSize:13.5,lineHeight:1.5,border:m.side==="me"?"none":"1px solid "+G[200]}},m.text),
            React.createElement("div",{style:{fontSize:10,color:G[400],marginTop:4,textAlign:m.side==="me"?"right":"left"}},m.time)
          ))
        ),
        React.createElement("div",{style:{padding:14,borderTop:"1px solid "+G[200],background:"#fff",display:"flex",gap:10}},
          React.createElement("input",{value:msgInput,onChange:e=>setMsgInput(e.target.value),onKeyDown:e=>{ if(e.key==="Enter"){ const id=selectedCase.id; if(!msgInput.trim()) return; const t=new Date(); const time=t.getHours()+":"+String(t.getMinutes()).padStart(2,"0"); const nm={side:"me",text:msgInput.trim(),time,date:"Today"}; setCaseMessages(prev=>({...prev,[id]:[...(prev[id]||[]),nm]})); setMsgInput(""); } },placeholder:"Type a message...",style:{flex:1,height:40,border:"1px solid "+G[200],borderRadius:8,padding:"0 14px",fontSize:13.5,fontFamily:sans,outline:"none",color:G[900]}}),
          React.createElement("button",{onClick:()=>{ const id=selectedCase.id; if(!msgInput.trim()) return; const t=new Date(); const time=t.getHours()+":"+String(t.getMinutes()).padStart(2,"0"); const nm={side:"me",text:msgInput.trim(),time,date:"Today"}; setCaseMessages(prev=>({...prev,[id]:[...(prev[id]||[]),nm]})); setMsgInput(""); },style:{...s.btnPrimary,padding:"0 18px"}},React.createElement(Icon,{name:"send",size:14,color:"#fff"}))
        )
      )
    ),
    React.createElement("div",{className:"case-notes-panel",style:{width:280,borderLeft:"1px solid "+G[200],padding:20,background:"#fff",flexShrink:0,display:"flex",flexDirection:"column"}},
      React.createElement("div",{style:{...s.label,marginBottom:14}},"Internal notes"),
      React.createElement("textarea",{value:noteInput,onChange:e=>setNoteInput(e.target.value),placeholder:"Add a note...",rows:4,style:{width:"100%",border:"1px solid "+G[200],borderRadius:8,padding:12,fontSize:13,fontFamily:sans,outline:"none",resize:"none",color:G[900],marginBottom:10}}),
      React.createElement("button",{onClick:saveNote,style:{...s.btnPrimary,width:"100%",padding:"10px 0",fontSize:13}},"Save note"),
      React.createElement("div",{style:{marginTop:20,display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}},
        notes.map((n,i)=>React.createElement("div",{key:i,style:{padding:"12px 14px",background:G[50],borderRadius:8,border:"1px solid "+G[200]}},
          React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:6}},
            React.createElement("span",{style:{fontSize:11,fontWeight:600,color:T[600]}},n.author),
            React.createElement("span",{style:{fontSize:10,color:G[400]}},n.date)
          ),
          React.createElement("p",{style:{fontSize:12.5,color:G[700],lineHeight:1.6}},n.text)
        ))
      )
    )
  );

  // ── PipelineScreen ─────────────────────────────────────────────────────
  const PipelineScreen = () => React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto" } },
    React.createElement("h1",{style:{fontFamily:serif,fontSize:26,color:T[950],marginBottom:4}},"Pipeline"),
    React.createElement("p",{style:{color:G[400],fontSize:13,marginBottom:28}},"Patient journey status across all active cases"),
    React.createElement("div", { className: "pipeline-scroll", style: { overflowX: "auto", paddingBottom: 16 } },
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(6,260px)",gap:16,alignItems:"start",minWidth:"max-content"}},
      COORD_PIPELINE_COLS.map(({label,color,items})=>React.createElement("div",{key:label},
        React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}},
          React.createElement("span",{style:{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color}},label),
          React.createElement("span",{style:{fontSize:11,background:G[100],color:G[500],borderRadius:10,padding:"1px 7px"}},items.length)
        ),
        items.map((it,i)=>React.createElement("div",{key:i,style:{...s.card,marginBottom:8,padding:"12px 14px",cursor:"pointer",borderLeft:"3px solid "+color},onMouseEnter:e=>e.currentTarget.style.borderColor=color,onMouseLeave:e=>e.currentTarget.style.borderColor=color,onClick:()=>{
          const fullCase = CASES.find(c => c.name === it.name) || { ...it, id: "C-C" + i, status: label, date: "TBD", surgeon: "\u2014 Unassigned \u2014" };
          setSelectedCase(fullCase);
          navTo("All Cases", "caseDetail");
        }},
          React.createElement("div",{style:{fontSize:13,fontWeight:600,color:G[900],marginBottom:3}},it.name),
          React.createElement("div",{style:{fontSize:11,color:G[500]}},it.proc),
          React.createElement("div",{style:{fontSize:11,color:T[600],fontWeight:500,marginTop:4}},it.budget+" \u00b7 "+it.country)
        ))
      ))
    )
    )
  );

  // ── MessagesScreen (original working version) ──────────────────────────
  const MessagesScreen = () => React.createElement("div", { className:"dash-screen", style:{ flex:1, display:"flex", overflow:"hidden" } },
    React.createElement("div", { style:{ width:240, borderRight:"1px solid "+G[200], overflowY:"auto", flexShrink:0, background:"#fff" } },
      React.createElement("div",{style:{...s.label,padding:"18px 16px 10px"}},"Cases"),
      CASES.map((c,i)=>React.createElement("div",{
        key:c.id,
        onClick:()=>{ setSelectedMsgCase(c); setMsgs(caseMessages[c.id]||[]); setMsgInput(""); },
        style:{ padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid "+G[100], background:selectedMsgCase&&selectedMsgCase.id===c.id?T[50]:"#fff", borderLeft:"2px solid "+(selectedMsgCase&&selectedMsgCase.id===c.id?T[500]:"transparent") }
      },
        React.createElement("div",{style:{fontSize:13,fontWeight:500,color:G[900]}},c.name),
        React.createElement("div",{style:{fontSize:11,color:G[400],marginTop:2}},c.proc),
        React.createElement(SPill,{status:c.status})
      ))
    ),
    React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",padding:24,overflow:"hidden"}},
      selectedMsgCase
        ? React.createElement(React.Fragment, null,
            React.createElement("div",{style:{marginBottom:16,paddingBottom:14,borderBottom:"1px solid "+G[200]}},
              React.createElement("h2",{style:{fontFamily:serif,fontSize:20,color:T[950]}},selectedMsgCase.name),
              React.createElement("div",{style:{fontSize:12,color:G[400]}},selectedMsgCase.proc)
            ),
            React.createElement("div",{ref:msgBodyRef,style:{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,paddingBottom:12}},
              msgs.map((m,i)=>{
                const showDate = i===0||msgs[i-1].date!==m.date;
                return React.createElement("div",{key:i},
                  showDate&&React.createElement("div",{style:{textAlign:"center",fontSize:11,color:G[400],margin:"8px 0"}},m.date),
                  React.createElement("div",{style:{display:"flex",justifyContent:m.side==="me"?"flex-end":"flex-start"}},
                    React.createElement("div",{style:{maxWidth:"72%",padding:"10px 14px",borderRadius:12,background:m.side==="me"?T[500]:G[100],color:m.side==="me"?"#fff":G[900],fontSize:13.5,lineHeight:1.6}},
                      m.text,
                      React.createElement("div",{style:{fontSize:10,marginTop:4,opacity:.55,textAlign:"right"}},m.time)
                    )
                  )
                );
              })
            ),
            React.createElement("div",{style:{display:"flex",gap:10,paddingTop:12,borderTop:"1px solid "+G[200]}},
              React.createElement("input",{value:msgInput,onChange:e=>setMsgInput(e.target.value),onKeyDown:e=>e.key==="Enter"&&sendMsg(),placeholder:"Type a message...",style:{flex:1,height:42,border:"1px solid "+G[200],borderRadius:8,padding:"0 14px",fontSize:13.5,fontFamily:sans,outline:"none",color:G[900]}}),
              React.createElement("button",{onClick:sendMsg,style:{...s.btnPrimary,padding:"0 20px",display:"flex",alignItems:"center",gap:7}},
                React.createElement(Icon,{name:"send",size:14,color:"#fff"}), "Send"
              )
            )
          )
        : React.createElement("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:G[400],fontSize:13}},"Select a case to view messages")
    )
  );

  // ── TeamScreen ─────────────────────────────────────────────────────────
  const TeamMemberDetail = () => {
    const m = selectedTeamMember;
    if (!m) return null;
    return React.createElement("div",{className:"dash-screen",style:{flex:1,overflowY:"auto"}},
      React.createElement("div",{style:{background:T[950],padding:"32px 40px 0",position:"relative",overflow:"hidden"}},
        React.createElement("div",{style:{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)",backgroundSize:"32px 32px"}}),
        React.createElement("div",{style:{position:"relative",zIndex:1}},
          React.createElement("button",{onClick:()=>setSelectedTeamMember(null),style:{...s.btnGhost,fontSize:12,padding:"7px 14px",display:"flex",alignItems:"center",gap:6,marginBottom:24,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",color:"rgba(255,255,255,.7)"}},
            React.createElement(Icon,{name:"arrowLeft",size:13,color:"rgba(255,255,255,.7)"}), "My Team"
          ),
          React.createElement("div",{style:{display:"flex",gap:24,alignItems:"flex-end",paddingBottom:32}},
            React.createElement("div",{style:{width:100,height:100,borderRadius:"50%",background:T[700],border:"3px solid rgba(255,255,255,.15)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}},
              React.createElement("div",{style:{fontFamily:serif,fontSize:36,fontWeight:600,color:T[200]}},m.name[0]),
              React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:2}},"Photo")
            ),
            React.createElement("div",{style:{flex:1,paddingBottom:4}},
              React.createElement("div",{style:{fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:T[300],marginBottom:6}},"Care Coordinator"),
              React.createElement("h1",{style:{fontFamily:serif,fontSize:32,fontWeight:600,color:"#fff",marginBottom:6}},m.name),
              React.createElement("div",{style:{fontSize:14,color:"rgba(255,255,255,.5)"}},m.lang),
              React.createElement("div",{style:{display:"flex",gap:12,marginTop:14,alignItems:"center"}},
                React.createElement("span",{style:{fontSize:14,fontWeight:600,color:T[300]}},m.rating," \u2605"),
                React.createElement("span",{style:{fontSize:12,color:"rgba(255,255,255,.35)"}},m.cases+" active cases"),
                React.createElement("span",{style:{fontSize:11,padding:"3px 10px",borderRadius:10,background:m.status==="Active"?"rgba(77,208,200,.15)":"rgba(255,255,255,.08)",color:m.status==="Active"?T[300]:"rgba(255,255,255,.4)",border:"1px solid "+(m.status==="Active"?"rgba(77,208,200,.2)":"rgba(255,255,255,.1)")}},m.status)
              )
            )
          )
        )
      ),
      React.createElement("div",{style:{padding:"32px 40px",maxWidth:860}},
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28}},
          [["Active cases",m.cases],["Rating",m.rating+" \u2605"],["Languages",m.lang],["Since",m.joined]].map(([k,v])=>
            React.createElement("div",{key:k,style:{...s.card,marginBottom:0}},
              React.createElement("div",{style:s.label},k),
              React.createElement("div",{style:{fontSize:13,fontWeight:500,color:G[900],marginTop:6}},v)
            )
          )
        ),
        React.createElement("div",{style:{...s.card,marginBottom:20}},
          React.createElement("div",{style:{...s.label,marginBottom:12}},"About"),
          React.createElement("p",{style:{fontSize:14,color:G[600],lineHeight:1.8}},m.bio)
        ),
        React.createElement("div",{style:s.card},
          React.createElement("div",{style:{...s.label,marginBottom:14}},"Contact"),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}},
            [["Phone",m.phone],["Email",m.email]].map(([k,v])=>
              React.createElement("div",{key:k},
                React.createElement("div",{style:{fontSize:11,fontWeight:600,color:G[400],letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}},k),
                React.createElement("div",{style:{fontSize:14,color:G[800]}},v)
              )
            )
          )
        )
      )
    );
  };

  const TeamScreen = () => {
    if (selectedTeamMember) return React.createElement(TeamMemberDetail, null);
    return React.createElement("div",{className:"dash-screen",style:{flex:1,padding:32,overflowY:"auto"}},
      React.createElement("h1",{style:{fontFamily:serif,fontSize:26,color:T[950],marginBottom:4}},"My Team"),
      React.createElement("p",{style:{color:G[400],fontSize:13,marginBottom:28}},"Patient care coordination team"),
      React.createElement("div",{className:"grid-3",style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}},
        React.createElement(CoordStat,{label:"Active coordinators",value:COORD_COORDS.filter(c=>c.status==="Active").length,color:T[700],icon:"users"}),
        React.createElement(CoordStat,{label:"Total active cases",value:COORD_COORDS.reduce((a,c)=>a+c.cases,0),color:T[500],icon:"clipboard"}),
        React.createElement(CoordStat,{label:"Languages covered",value:"4",color:G[500],icon:"globe"})
      ),
      COORD_COORDS.map((c,i)=>React.createElement("div",{key:i,style:{...s.card,display:"flex",alignItems:"center",gap:16,marginBottom:12,cursor:"pointer"},onClick:()=>setSelectedTeamMember(c),onMouseEnter:e=>e.currentTarget.style.borderColor=T[300],onMouseLeave:e=>e.currentTarget.style.borderColor=G[200]},
        React.createElement("div",{style:{width:42,height:42,borderRadius:"50%",background:T[100],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:serif,fontSize:17,fontWeight:600,color:T[700],flexShrink:0}},c.name[0]),
        React.createElement("div",{style:{flex:1}},
          React.createElement("div",{style:{fontSize:14,fontWeight:600,color:G[900]}},c.name),
          React.createElement("div",{style:{fontSize:12,color:G[500],marginTop:2}},c.email),
          React.createElement("div",{style:{fontSize:11,color:G[400],marginTop:2}},"Languages: "+c.lang)
        ),
        React.createElement("div",{style:{textAlign:"center",flexShrink:0}},
          React.createElement("div",{style:{fontSize:18,fontWeight:700,color:T[600],fontFamily:serif}},c.cases),
          React.createElement("div",{style:{fontSize:10,color:G[400]}},"cases")
        ),
        React.createElement("span",{style:{fontSize:11,padding:"3px 10px",borderRadius:10,fontWeight:500,background:c.status==="Active"?T[50]:G[100],color:c.status==="Active"?T[700]:G[500],border:"1px solid "+(c.status==="Active"?T[100]:G[200])}},c.status),
        React.createElement("div",{style:{textAlign:"right",flexShrink:0}},
          React.createElement("div",{style:{fontSize:13,fontWeight:600,color:T[600]}},c.rating+" \u2605"),
          React.createElement(Icon,{name:"arrowLeft",size:14,color:G[300],style:{transform:"rotate(180deg)",marginTop:6}})
        )
      ))
    );
  };

  // ── render ─────────────────────────────────────────────────────────────
  const renderScreen = () => {
    if (screen === "overview")   return OverviewScreen();
    if (screen === "cases")      return CasesTable({ title:"All Cases", onRowClick:c=>{ setSelectedCase(c); navTo("All Cases","caseDetail"); } });
    if (screen === "caseDetail") return CaseDetailScreen();
    if (screen === "intake")     return React.createElement(IntakeScreen, null);
    if (screen === "assign")     return AssignmentScreen();
    if (screen === "pipeline")   return PipelineScreen();
    if (screen === "messages")   return MessagesScreen();
    if (screen === "team")       return TeamScreen();
    return OverviewScreen();
  };

  return React.createElement("div", { style:{ fontFamily:sans, background:G[50], minHeight:"100vh" } },
    toast && React.createElement(Toast, { msg:toast, onDone:()=>setToast(null) }),
    React.createElement("div", { className:"dash-header", style:{ height:60, background:"#fff", borderBottom:"1px solid "+G[200], display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", position:"sticky", top:0, zIndex:50 } },
      React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:10 } },
        React.createElement("button", { className:"mobile-menu-btn", onClick:()=>setSidebarOpen(o=>!o), style:{ background:"none", border:"none", cursor:"pointer", padding:6, display:"flex", alignItems:"center" } },
          React.createElement(HamburgerIcon, { color:"#374151" })
        ),
        React.createElement("div", { style:{ fontFamily:serif, fontSize:19, fontWeight:600, color:T[900], letterSpacing:"0.06em", textTransform:"uppercase" } },
          "Praes", React.createElement("span",{style:{color:T[500]}},"enti")
        ),
        React.createElement("span", { style:{ fontSize:11, fontWeight:500, color:T[500], letterSpacing:"0.08em", textTransform:"uppercase", marginLeft:6 } }, "Coordinator")
      ),
      React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:12 } },
        React.createElement(NotifBell, null),
        React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:G[700] } },
          React.createElement("div", { style:{ width:32, height:32, borderRadius:"50%", background:T[700], display:"flex", alignItems:"center", justifyContent:"center", fontFamily:serif, fontSize:14, fontWeight:600, color:T[200] } }, initials),
          fullName
        ),
        React.createElement("button", { onClick:onSignOut, style:{ background:"none", border:"1px solid "+G[200], color:G[500], padding:"6px 14px", borderRadius:6, fontSize:12, cursor:"pointer", fontFamily:sans } }, "Sign out")
      )
    ),
    React.createElement("div", { style:{ display:"flex", minHeight:"calc(100vh - 60px)", overflow:"hidden" } },
      React.createElement(CoordSidebar, null),
      React.createElement("div", { className:"dash-layout-inner", style:{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" } },
        renderScreen()
      )
    )
  );
};
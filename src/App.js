import { Landing } from './components/Landing.js';
import { PatientDashboard } from './components/PatientDashboard.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { CoordinatorDashboard } from './components/CoordinatorDashboard.js';
import { NurseDashboard } from './components/NurseDashboard.js';

const { React, ReactDOM } = window;
const { useState, useEffect } = React;

// SUPA_URL/KEY are read lazily inside useEffect (env-loader runs async)

const App = () => {
  const [view, setView] = useState(() => localStorage.getItem("session_view") || "landing");
  const [lang, setLang] = useState("en");
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("session_user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [autoWiz, setAutoWiz] = useState(false);
  const [checking, setChecking] = useState(true);


  useEffect(() => {
    // Auth token logic
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const accessToken = params.get("access_token");
    const type = params.get("type");
    if (accessToken && (type === "signup" || type === "magiclink")) {
      window.history.replaceState(null, "", window.location.pathname);
      const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPA_KEY = import.meta.env.VITE_SUPABASE_KEY;
      fetch(`${SUPA_URL}/auth/v1/user`, {
        headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${accessToken}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data && data.id) {
            const meta = data.user_metadata || {};
            const userData = { id: data.id, fn: meta.fn || "", ln: meta.ln || "", email: data.email, token: accessToken };
            setUser(userData);
            setView("patient");
            localStorage.setItem("session_user", JSON.stringify(userData));
            localStorage.setItem("session_view", "patient");
            history.pushState({ role: "patient", dash: "patient" }, "", "#patient");

          }
          setChecking(false);
        })
        .catch(() => setChecking(false));
    } else {
      setChecking(false);
    }

    // Navigation logic
    if (!history.state) {
      history.replaceState({ role: "landing", dash: "landing" }, "", window.location.pathname);
    }
    const onPop = (e) => {
      const st = e.state;
      if (st && st.role) {
        setView(st.role);
      } else if (!st) {
        setView("landing");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleLogin = (role, userData) => {
    setUser(userData || null);
    setView(role);
    if (userData) localStorage.setItem("session_user", JSON.stringify(userData));
    localStorage.setItem("session_view", role);
    history.pushState({ role, dash: role }, "", "#" + role);
  };

  // Check if user is admin when currently showing "patient" view (might be misclassified)
  useEffect(() => {
    if (!user || !user.email || view !== "patient") return;
    
    let isMounted = true;
    const checkIfAdmin = async () => {
      try {
        const sUrl = window.SUPA_URL || import.meta.env.VITE_SUPABASE_URL;
        const sKey = window.SUPA_KEY || import.meta.env.VITE_SUPABASE_KEY;
        if (!sUrl || !sKey) return;
        
        const h = { "Content-Type":"application/json", apikey: sKey, Authorization: "Bearer " + (user.token || sKey) };
        const res = await fetch(sUrl + "/rest/v1/admins?email=eq." + encodeURIComponent(user.email), { headers: h });
        const admins = await res.json();
        
        if (isMounted && admins && admins.length > 0) {
          // User is actually an admin, redirect
          setView("admin");
          localStorage.setItem("session_view", "admin");
          history.pushState({ role: "admin", dash: "admin" }, "", "#admin");
        }
      } catch(e) {
        console.log("Admin check error:", e);
      }
    };
    
    checkIfAdmin();
    return () => { isMounted = false; };
  }, [user?.email]);


  if (checking) return /* @__PURE__ */ React.createElement("div", {
    style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", background: "#f0fdfb" }
  },
/* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } },
  /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, fontWeight: 600, color: "#0d3d3a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 } },
    "PRAES", /* @__PURE__ */ React.createElement("span", { style: { color: "#1a9e95" } }, "ENTI")
  ),
  /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#9ca3af" } }, "Confirming your account\u2026")
  )
  );

  if (view === "patient") return /* @__PURE__ */ React.createElement(PatientDashboard, {
    user, autoWiz, onSignOut: () => {
      localStorage.removeItem("session_user");
      localStorage.removeItem("session_view");
      setView("landing");
      setUser(null);
      setAutoWiz(false);
      history.pushState({ role: "landing", dash: "landing" }, "", "#landing");
    }
  });
  if (view === "admin") return /* @__PURE__ */ React.createElement(AdminDashboard, {
    user,
    onSignOut: () => {
      localStorage.removeItem("session_user");
      localStorage.removeItem("session_view");
      setView("landing");
      setUser(null);
      history.pushState({ role: "landing", dash: "landing" }, "", "#landing");
    }
  });
  if (view === "coordinator") return React.createElement(CoordinatorDashboard, {
    user,
    onSignOut: () => {
      localStorage.removeItem("session_user");
      localStorage.removeItem("session_view");
      setView("landing");
      setUser(null);
      history.pushState({ role: "landing", dash: "landing" }, "", "#landing");
    }
  });
  if (view === "nurse") return React.createElement(NurseDashboard, {
    user,
    onSignOut: () => {
      localStorage.removeItem("session_user");
      localStorage.removeItem("session_view");
      setView("landing");
      setUser(null);
      history.pushState({ role: "landing", dash: "landing" }, "", "#landing");
    }
  });
  return /* @__PURE__ */ React.createElement(Landing, { onLogin: handleLogin, lang, setLang });
};
const startApp = () => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(App, null));
};

startApp();
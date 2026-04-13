import { Landing } from './components/Landing.js';
import { PatientDashboard } from './components/PatientDashboard.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { CoordinatorDashboard } from './components/CoordinatorDashboard.js';
import { NurseDashboard } from './components/NurseDashboard.js';
import { s } from './constants.js';

const { React, ReactDOM } = window;
const { useState, useEffect } = React;

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("landing");
  const [lang, setLang] = useState("en");

  const handleLogin = (newRole, userData) => {
    setRole(newRole);
    setUser(userData);
    try { window.history.pushState({ role: newRole, dash: newRole }, "", "#" + newRole); } catch(e){}
  };

  const handleSignOut = () => {
    setRole("landing");
    setUser(null);
    try { window.history.pushState({ role: "landing", dash: "landing" }, "", "#landing"); } catch(e){}
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const SUPA_URL = window.SUPABASE_URL || window.SUPA_URL || window.VITE_SUPABASE_URL;
      const SUPA_KEY = window.SUPABASE_KEY || window.SUPA_KEY || window.VITE_SUPABASE_KEY;
      
      if (accessToken && SUPA_URL && SUPA_KEY) {
        fetch(`${SUPA_URL}/auth/v1/user`, {
          headers: {
            "apikey": SUPA_KEY,
            "Authorization": `Bearer ${accessToken}`
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data && data.email) {
            const meta = data.user_metadata || {};
            const userRole = meta.role || "patient";
            handleLogin(userRole, { fn: meta.fn || "", ln: meta.ln || "", email: data.email, id: data.id, token: accessToken });
            window.history.replaceState(null, "", window.location.pathname);
          }
        })
        .catch(err => console.error("Error confirming email token:", err));
      }
    }
  }, []);

  return /* @__PURE__ */ React.createElement("div", { style: s.page }, 
    role === "landing" && /* @__PURE__ */ React.createElement(Landing, { onLogin: handleLogin, lang, setLang }), 
    role === "patient" && /* @__PURE__ */ React.createElement(PatientDashboard, { onSignOut: handleSignOut, user, autoWiz: false }),
    role === "admin" && /* @__PURE__ */ React.createElement(AdminDashboard, { onSignOut: handleSignOut, user }),
    role === "coordinator" && /* @__PURE__ */ React.createElement(CoordinatorDashboard, { onSignOut: handleSignOut, user }),
    role === "nurse" && /* @__PURE__ */ React.createElement(NurseDashboard, { onSignOut: handleSignOut, user })
  );
};

const startApp = () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(/* @__PURE__ */ React.createElement(App, null));
  } else {
    console.error("Element with id 'root' not found.");
  }
};

startApp();
import { T, G, serif, sans, s } from '../constants.js';
import { SuFi, SuLbl, Icon, Modal } from './shared.js';

const { React } = window;
const { useState } = React;

const supaFetch = (path, body) => {
  const SUPA_URL = window.VITE_SUPABASE_URL;
  const SUPA_KEY = window.VITE_SUPABASE_KEY;
  return fetch(`${SUPA_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` },
    body: JSON.stringify(body)
  }).then((r) => r.json());
};

const DEMO_ACCOUNTS = {
  "patient@praesenti.com": { password: "patient2024", role: "patient", fn: "Maria", ln: "Vasquez", isDemo: true, id: "demo-patient-001" },
  "admin@praesenti.com": { password: "admin2024", role: "admin", fn: "Admin", ln: "", isDemo: true, id: "demo-admin-001" },
  "coordinator@praesenti.com": { password: "coord2024", role: "coordinator", fn: "Ana", ln: "Rodríguez", isDemo: true, id: "demo-coord-001" }
};

export const AuthModal = ({ open, onClose, onLogin, onSwitchToSignUp }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const reset = () => {
    setEmail("");
    setPassword("");
    setError("");
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  const handleSignIn = async () => {
    var _a;
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    const demo = DEMO_ACCOUNTS[email.trim().toLowerCase()];
    if (demo) {
      if (demo.password !== password) {
        setError("Incorrect password. Please try again.");
        return;
      }
      reset();
      onClose();
      onLogin(demo.role, { fn: demo.fn, ln: demo.ln, email: email.trim().toLowerCase(), isDemo: true, id: demo.id });
      return;
    }
    setLoading(true);
    setError("");
    const data = await supaFetch("token?grant_type=password", { email: email.trim().toLowerCase(), password });
    setLoading(false);
    if (data.error || !data.access_token) {
      setError(data.error_description || data.msg || "Incorrect email or password.");
      return;
    }
    const meta = ((_a = data.user) == null ? void 0 : _a.user_metadata) || {};
    const role = meta.role || "patient";
    const userId = data.user?.id;
    reset();
    onClose();
    onLogin(role, { fn: meta.fn || "", ln: meta.ln || "", email: data.user.email, id: userId });
  };
  return /* @__PURE__ */ React.createElement(Modal, { open, onClose: handleClose }, /* @__PURE__ */ React.createElement("div", { style: { padding: "28px 28px 32px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950] } }, "Welcome back"), /* @__PURE__ */ React.createElement("button", { onClick: handleClose, style: { background: "none", border: "none", color: G[400], cursor: "pointer", padding: 4, display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 18, color: G[400] }))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Email"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "email",
      placeholder: "you@email.com",
      value: email,
      onChange: (e) => {
        setEmail(e.target.value);
        setError("");
      },
      onKeyDown: (e) => e.key === "Enter" && handleSignIn(),
      style: { width: "100%", height: 42, border: `1px solid ${error ? "#fca5a5" : G[200]}`, borderRadius: 7, padding: "0 13px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: error ? 10 : 20 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Password"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      value: password,
      onChange: (e) => {
        setPassword(e.target.value);
        setError("");
      },
      onKeyDown: (e) => e.key === "Enter" && handleSignIn(),
      style: { width: "100%", height: 42, border: `1px solid ${error ? "#fca5a5" : G[200]}`, borderRadius: 7, padding: "0 13px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] }
    }
  )), error && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12.5, color: "#dc2626", marginBottom: 14 } }, "\u2715 ", error), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSignIn,
      disabled: loading,
      style: { ...s.btnPrimary, width: "100%", opacity: loading ? 0.7 : 1 }
    },
    loading ? "Signing in\u2026" : "Sign in"
  ), /* @__PURE__ */ React.createElement("p", { style: { textAlign: "center", marginTop: 18, fontSize: 13, color: G[500] } }, "Don't have an account?", " ", /* @__PURE__ */ React.createElement("span", {
    onClick: () => {
      handleClose();
      onSwitchToSignUp();
    }, style: { color: T[600], fontWeight: 500, cursor: "pointer" }
  }, "Create one")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16, padding: "14px 16px", background: G[50], borderRadius: 8, border: `1px solid ${G[200]}` } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, fontWeight: 600, color: G[500], letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 } }, "Demo accounts"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, [["Patient", "patient@praesenti.com", "patient2024"], ["Admin", "admin@praesenti.com", "admin2024"], ["Coordinator", "coordinator@praesenti.com", "coord2024"]].map(([label, em, pw]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: label,
      onClick: () => {
        setEmail(em);
        setPassword(pw);
        setError("");
      },
      style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fff", border: `1px solid ${G[200]}`, borderRadius: 7, cursor: "pointer", fontFamily: sans, fontSize: 12.5, color: G[700] }
    },
/* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500 } }, label),
/* @__PURE__ */ React.createElement("span", { style: { color: G[400], fontFamily: "monospace", fontSize: 11 } }, em)
  ))))));
};

export const SignUpModal = ({ open, onClose, onSignUpDone, onSwitchToSignIn }) => {
  const [form, setForm] = useState({ fn: "", ln: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const reset = () => {
    setForm({ fn: "", ln: "", email: "", password: "", confirm: "" });
    setError("");
    setEmailSent(false);
    setSentTo("");
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setError("");
  };
  const handleCreate = async () => {
    if (!form.fn.trim() || !form.ln.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError("");
    const data = await supaFetch("signup", {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      data: { fn: form.fn.trim(), ln: form.ln.trim(), role: "patient" }
    });
    setLoading(false);
    console.log("Supabase signup response:", JSON.stringify(data, null, 2));
    const userObj = data.user || (data.id ? data : null);
    if (data.error || !userObj) {
      setError(data.msg || data.error_description || data.error || "Could not create account. Try again.");
      return;
    }
    setSentTo(form.email.trim().toLowerCase());
    setEmailSent(true);
  };
  if (emailSent) return /* @__PURE__ */ React.createElement(Modal, { open, onClose: handleClose },
/* @__PURE__ */ React.createElement("div", { style: { padding: "52px 36px", textAlign: "center" } },
  /* @__PURE__ */ React.createElement("div", { style: { width: 64, height: 64, borderRadius: "50%", background: T[50], border: "2px solid " + T[200], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" } },
    /* @__PURE__ */ React.createElement(Icon, { name: "leaf", size: 28, color: T[600] })
  ),
  /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 26, color: T[900], marginBottom: 10 } }, "Check your inbox"),
  /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: G[500], lineHeight: 1.8, marginBottom: 6 } }, "We sent a confirmation link to"),
  /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, fontWeight: 600, color: T[700], marginBottom: 20 } }, sentTo),
  /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: G[500], lineHeight: 1.8, marginBottom: 32, maxWidth: 320, margin: "0 auto 32px" } }, "Click the link in the email to activate your account. Once confirmed, come back and sign in."),
  /* @__PURE__ */ React.createElement("button", { onClick: handleClose, style: { ...s.btnPrimary, padding: "11px 32px", fontSize: 13 } }, "Got it"),
  /* @__PURE__ */ React.createElement("p", { style: { marginTop: 18, fontSize: 12, color: G[400] } }, "Didn't receive it? Check your spam folder.")
  )
  );
  return /* @__PURE__ */ React.createElement(Modal, { open, onClose: handleClose }, /* @__PURE__ */ React.createElement("div", { style: { padding: "28px 28px 32px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950] } }, "Create your account"), /* @__PURE__ */ React.createElement("button", { onClick: handleClose, style: { background: "none", border: "none", color: G[400], cursor: "pointer", padding: 4, display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 18, color: G[400] }))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: G[500], marginBottom: 22 } }, "Then we'll ask a few quick questions to match you with the right care."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(SuLbl, { t: "First name" }), /* @__PURE__ */ React.createElement(SuFi, { ph: "Maria", val: form.fn, onChange: set("fn"), err: !!error && !form.fn.trim(), onEnter: handleCreate })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(SuLbl, { t: "Last name" }), /* @__PURE__ */ React.createElement(SuFi, { ph: "Vasquez", val: form.ln, onChange: set("ln"), err: !!error && !form.ln.trim(), onEnter: handleCreate }))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(SuLbl, { t: "Email address" }), /* @__PURE__ */ React.createElement(SuFi, { type: "email", ph: "you@email.com", val: form.email, onChange: set("email"), err: !!error && !form.email.includes("@"), onEnter: handleCreate })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(SuLbl, { t: "Password" }), /* @__PURE__ */ React.createElement(SuFi, { type: "password", ph: "At least 6 characters", val: form.password, onChange: set("password"), err: !!error && form.password.length < 6, onEnter: handleCreate })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: error ? 10 : 24 } }, /* @__PURE__ */ React.createElement(SuLbl, { t: "Confirm password" }), /* @__PURE__ */ React.createElement(SuFi, { type: "password", ph: "Repeat your password", val: form.confirm, onChange: set("confirm"), err: !!error && form.password !== form.confirm, onEnter: handleCreate })), error && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12.5, color: "#dc2626", marginBottom: 14 } }, "\u2715 ", error), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCreate,
      disabled: loading,
      style: { ...s.btnPrimary, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }
    },
    loading ? "Creating account\u2026" : "Continue to questionnaire",
    !loading && /* @__PURE__ */ React.createElement(Icon, { name: "arrowLeft", size: 14, color: "#fff", style: { transform: "rotate(180deg)" } })
  ), /* @__PURE__ */ React.createElement("p", { style: { textAlign: "center", marginTop: 18, fontSize: 13, color: G[500] } }, "Already have an account?", " ", /* @__PURE__ */ React.createElement("span", {
    onClick: () => {
      handleClose();
      onSwitchToSignIn();
    }, style: { color: T[600], fontWeight: 500, cursor: "pointer" }
  }, "Sign in"))));
};

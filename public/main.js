import { AdminDashboard } from '../src/components/AdminDashboard.js';
import { CoordinatorDashboard } from '../src/components/CoordinatorDashboard.js';
import { NurseDashboard } from '../src/components/NurseDashboard.js';

const { React, ReactDOM } = window;
const { useState, useRef, useEffect, useCallback } = React;

// History API falla en iframes sandboxed (ej. preview de Claude). Usar wrappers seguros.
const safePush    = (state, title, url) => { try { history.pushState(state, title, url); } catch(e) {} };
const safeReplace = (state, title, url) => { try { history.replaceState(state, title, url); } catch(e) {} };

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
};

// Las vars de Supabase están disponibles síncronamente desde window.__PRAESENTI_CONFIG__
const useSupabaseReady = () => !!(SUPA_URL && SUPA_KEY);

const HamburgerIcon = ({ color = "#fff" }) =>
  React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round" },
    React.createElement("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
    React.createElement("line", { x1: "3", y1: "12", x2: "21", y2: "12" }),
    React.createElement("line", { x1: "3", y1: "18", x2: "21", y2: "18" })
  );
const T = {
  950: "#061f1d",
  900: "#0d3d3a",
  800: "#0f4d49",
  700: "#136158",
  600: "#1a7a72",
  500: "#1a9e95",
  400: "#20bdb3",
  300: "#4dd0c8",
  200: "#a0e8e4",
  100: "#d6f5f3",
  50: "#f0fdfb"
};
const G = {
  900: "#0f1117",
  800: "#1a1f2e",
  700: "#374151",
  600: "#4b5563",
  500: "#6b7280",
  400: "#9ca3af",
  300: "#d1d5db",
  200: "#e5e7eb",
  100: "#f3f4f6",
  50: "#f9fafb"
};
const serif = "'Cormorant Garamond',Georgia,serif";
const sans = "'DM Sans',system-ui,sans-serif";
const s = {
  page: { fontFamily: sans, color: G[900], background: "#fff", minHeight: "100vh" },
  btnPrimary: {
    background: T[500],
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "12px 28px",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: sans,
    cursor: "pointer"
  },
  btnGhost: {
    background: "transparent",
    color: G[700],
    border: `1px solid ${G[200]}`,
    borderRadius: 7,
    padding: "10px 18px",
    fontSize: 13,
    fontFamily: sans,
    cursor: "pointer"
  },
  btnDanger: {
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: 7,
    padding: "10px 18px",
    fontSize: 13,
    fontFamily: sans,
    cursor: "pointer"
  },
  card: {
    background: "#fff",
    border: `1px solid ${G[200]}`,
    borderRadius: 12,
    padding: "20px 22px",
    marginBottom: 14
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: G[400]
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: `1px solid ${G[100]}`,
    fontSize: 13
  }
};
const Icon = ({ name, size = 20, color = "currentColor", style = {} }) => {
  const icons = {
    // Procedures
    nose: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M12 3c0 0-4 6-4 11a4 4 0 0 0 8 0C16 9 12 3 12 3z" }), /* @__PURE__ */ React.createElement("path", { d: "M8 14c-1.5.5-2 1.5-2 2" }), /* @__PURE__ */ React.createElement("path", { d: "M16 14c1.5.5 2 1.5 2 2" })),
    flower: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z", opacity: ".6" }), /* @__PURE__ */ React.createElement("path", { d: "M12 16a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z", opacity: ".6" }), /* @__PURE__ */ React.createElement("path", { d: "M2 12a3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3z", opacity: ".6" }), /* @__PURE__ */ React.createElement("path", { d: "M16 12a3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3z", opacity: ".6" })),
    sparkles: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" }), /* @__PURE__ */ React.createElement("path", { d: "M19 16l.75 2.25L22 19l-2.25.75L19 22l-.75-2.25L16 19l2.25-.75L19 16z", opacity: ".6" }), /* @__PURE__ */ React.createElement("path", { d: "M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5L5 3z", opacity: ".6" })),
    // How it works icons
    clipboard: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), /* @__PURE__ */ React.createElement("polyline", { points: "14 2 14 8 20 8" }), /* @__PURE__ */ React.createElement("path", { d: "M12 11h4" }), /* @__PURE__ */ React.createElement("path", { d: "M12 16h4" }), /* @__PURE__ */ React.createElement("polyline", { points: "10 9 9 9 8 9" })),
    handshake: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M11 17a4 4 0 0 1-4-4V7l3-3h6l3 3v1" }), /* @__PURE__ */ React.createElement("path", { d: "m9 12 2 2 4-4" }), /* @__PURE__ */ React.createElement("path", { d: "M14 19l2 2 5-5" }), /* @__PURE__ */ React.createElement("path", { d: "M7 15H4l-2 2 3 3 2-2V15" })),
    plane: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polygon", { points: "23 7 16 12 23 17 23 7" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "5", width: "15", height: "14", rx: "2", ry: "2" })),
    heart: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" })),
    // Why DR icons
    hospital: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M12 6v4" }), /* @__PURE__ */ React.createElement("path", { d: "M10 8h4" }), /* @__PURE__ */ React.createElement("path", { d: "M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ React.createElement("path", { d: "M9 22v-4h6v4" })),
    sun: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "5" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "1", x2: "12", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "23" }), /* @__PURE__ */ React.createElement("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }), /* @__PURE__ */ React.createElement("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }), /* @__PURE__ */ React.createElement("line", { x1: "1", y1: "12", x2: "3", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "21", y1: "12", x2: "23", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }), /* @__PURE__ */ React.createElement("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" })),
    piggyBank: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8.5 3 2 4l-1 4h4l1-1.5c.8.2 1.6.3 2.4.3.8 0 1.6-.1 2.4-.3L17 19h4l-1-4c2-.7 3-3 3-5.7 0-2.7-2-4.7-4-5.3z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 10v4" }), /* @__PURE__ */ React.createElement("path", { d: "M10 12h4" })),
    mapPin: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "10", r: "3" })),
    userMd: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "7", r: "4" }), /* @__PURE__ */ React.createElement("path", { d: "M12 11v4" }), /* @__PURE__ */ React.createElement("path", { d: "M10 13h4" })),
    home: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }), /* @__PURE__ */ React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })),
    // UI icons
    document: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), /* @__PURE__ */ React.createElement("polyline", { points: "14 2 14 8 20 8" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), /* @__PURE__ */ React.createElement("polyline", { points: "10 9 9 9 8 9" })),
    person: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "7", r: "4" })),
    check: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" })),
    send: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), /* @__PURE__ */ React.createElement("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })),
    download: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), /* @__PURE__ */ React.createElement("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "15", x2: "12", y2: "3" })),
    activity: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" })),
    globe: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("line", { x1: "2", y1: "12", x2: "22", y2: "12" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" })),
    video: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polygon", { points: "23 7 16 12 23 17 23 7" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "5", width: "15", height: "14", rx: "2", ry: "2" })),
    creditCard: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "1", y: "4", width: "22", height: "16", rx: "2", ry: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "1", y1: "10", x2: "23", y2: "10" })),
    settings: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })),
    message: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })),
    calendar: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" })),
    close: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })),
    arrowLeft: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "19", y1: "12", x2: "5", y2: "12" }), /* @__PURE__ */ React.createElement("polyline", { points: "12 19 5 12 12 5" })),
    chartBar: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "20", x2: "18", y2: "10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "20", x2: "12", y2: "4" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "20", x2: "6", y2: "14" }), /* @__PURE__ */ React.createElement("line", { x1: "2", y1: "20", x2: "22", y2: "20" })),
    users: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "7", r: "4" }), /* @__PURE__ */ React.createElement("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }), /* @__PURE__ */ React.createElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })),
    alertCircle: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "16", x2: "12.01", y2: "16", strokeWidth: "2.5" })),
    network: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "5", r: "2" }), /* @__PURE__ */ React.createElement("circle", { cx: "5", cy: "19", r: "2" }), /* @__PURE__ */ React.createElement("circle", { cx: "19", cy: "19", r: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "7", x2: "5", y2: "17" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "7", x2: "19", y2: "17" })),
    dollarSign: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "1", x2: "12", y2: "23" }), /* @__PURE__ */ React.createElement("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" })),
    trendingUp: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }), /* @__PURE__ */ React.createElement("polyline", { points: "17 6 23 6 23 12" })),
    fileText: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), /* @__PURE__ */ React.createElement("polyline", { points: "14 2 14 8 20 8" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), /* @__PURE__ */ React.createElement("polyline", { points: "10 9 9 9 8 9" })),
    lock: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })),
    shield: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })),
    palm: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M18 22a6 6 0 0 0-12 0" }), /* @__PURE__ */ React.createElement("path", { d: "M12 17a6 6 0 0 0 6-6c0-3-1-5-3-7" }), /* @__PURE__ */ React.createElement("path", { d: "M12 17a6 6 0 0 1-6-6c0-3 1-5 3-7" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3v14" }))
  };
  const svg = icons[name];
  if (!svg) return null;
  return /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, flexShrink: 0, ...style } }, React.cloneElement(svg, { width: size, height: size }));
};
const TRANSLATIONS = {
  eyebrow: { en: "Medical tourism \xB7 Dominican Republic", es: "Turismo m\xE9dico \xB7 Rep\xFAblica Dominicana" },
  heroTitle: { en: ["World-class surgery,", "Caribbean recovery."], es: ["Cirug\xEDa de clase mundial,", "recuperaci\xF3n en el Caribe."] },
  heroBody: {
    en: "Praesenti connects international patients with top-tier surgeons in the Dominican Republic \u2014 coordinating every detail so you heal in comfort and style.",
    es: "Praesenti conecta a pacientes internacionales con cirujanos de primer nivel en la Rep\xFAblica Dominicana, coordinando cada detalle para que te recuperes con comodidad y estilo."
  },
  begin: { en: "Begin your journey", es: "Comienza tu viaje" },
  howItWorks: { en: "How it works", es: "C\xF3mo funciona" },
  signIn: { en: "Sign in", es: "Iniciar sesi\xF3n" },
  stepHow1T: { en: "Tell us your goals", es: "Cu\xE9ntanos tus objetivos" },
  stepHow1B: { en: "Complete a short intake \u2014 your procedure, budget, timeline, and health background.", es: "Completa un breve formulario \u2014 procedimiento, presupuesto, cronograma y antecedentes de salud." },
  stepHow2T: { en: "We match you", es: "Te emparejamos" },
  stepHow2B: { en: "Our team reviews your profile and pairs you with board-certified surgeons and accredited facilities.", es: "Nuestro equipo revisa tu perfil y te vincula con cirujanos certificados e instalaciones acreditadas." },
  stepHow3T: { en: "All-in-one coordination", es: "Coordinaci\xF3n todo en uno" },
  stepHow3B: { en: "Flights, transfers, accommodation, surgery \u2014 handled. You focus on healing.", es: "Vuelos, traslados, alojamiento, cirug\xEDa \u2014 todo gestionado. T\xFA conc\xE9ntrate en sanar." },
  stepHow4T: { en: "Recovery & follow-up", es: "Recuperaci\xF3n y seguimiento" },
  stepHow4B: { en: "Luxury recovery homes, telemedicine check-ins, and lifetime support from your care team.", es: "Casas de recuperaci\xF3n de lujo, teleconsultas y apoyo de por vida de tu equipo m\xE9dico." },
  whyDR: { en: "Why the Dominican Republic?", es: "\xBFPor qu\xE9 Rep\xFAblica Dominicana?" },
  whyDRBody: {
    en: "The DR combines internationally accredited hospitals, US-trained surgeons, and a 12-month warm climate \u2014 at 40\u201370% less than US prices.",
    es: "La RD combina hospitales con acreditaci\xF3n internacional, cirujanos formados en EE.UU. y un clima c\xE1lido durante 12 meses, a un 40\u201370% menos que los precios de EE.UU."
  },
  footerTag: { en: "Precision care. Caribbean soul.", es: "Cuidado de precisi\xF3n. Alma caribe\xF1a." }
};
const tr = (key, lang) => {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
};
// ── NETWORK DATA — loaded from Supabase at runtime ──────────────────
// Seed SQL is in /supabase/seed_network.sql
// Tables: clinicas, doctores, recovery_homes
// These are placeholders used before data loads or when Supabase is not configured.
const CLINICAS_PLACEHOLDER = [];
const DOCTORES_PLACEHOLDER = [];
const RECOVERY_HOMES_PLACEHOLDER = [];

const CASES = [
  { id: "C-001", name: "Patient A", proc: "Rhinoplasty", status: "Recovery", date: "Mar 14", surgeon: "Dr. [Surgeon]", budget: "$4,400", country: "USA" },
  { id: "C-002", name: "Patient B", proc: "Liposuction", status: "Pre-op", date: "Apr 02", surgeon: "Dr. [Surgeon]", budget: "$6,500", country: "UK" },
  { id: "C-003", name: "Patient C", proc: "Breast Augmentation", status: "Recovery", date: "Mar 20", surgeon: "Dr. [Surgeon]", budget: "$5,200", country: "CA" },
  { id: "C-004", name: "Patient D", proc: "Hair Transplant", status: "Lead", date: "Apr 18", surgeon: "\u2014", budget: "$3,300", country: "BR" },
  { id: "C-005", name: "Patient E", proc: "Tummy Tuck", status: "Pre-op", date: "Apr 09", surgeon: "Dr. [Surgeon]", budget: "$7,000", country: "SE" }
];
const INIT_MSGS = [
  { side: "them", text: "Hi! Welcome to Praesenti. I'm your personal care coordinator. How are you feeling about your upcoming procedure?", time: "09:14", date: "March 14" },
  { side: "me", text: "Hi! A bit nervous, but excited. Thanks for reaching out.", time: "09:22", date: "March 14" },
  { side: "them", text: "That's completely normal! The surgical team here is excellent — you're in great hands. Any last-minute questions?", time: "09:25", date: "March 14" },
  { side: "me", text: "Can I eat anything the night before?", time: "09:31", date: "March 14" },
  { side: "them", text: "Nothing after midnight — just water until 6 AM. We'll go over the full pre-op checklist when you arrive.", time: "09:33", date: "March 14" }
];
const ADMIN_NOTES = [
  { author: "Dr. [Surgeon]", date: "March 22 \xB7 10:15", text: "Post-op review completed. Swelling within normal range. Patient cleared for discharge to recovery home." },
  { author: "Coord. Laura", date: "March 20 \xB7 08:45", text: "Patient arrived at the clinic. Surgery scheduled for 10:00 AM. All pre-op labs confirmed." },
  { author: "Coord. Laura", date: "March 14 \xB7 14:00", text: "Pre-op consultation completed. Patient is a good candidate. Consent forms signed." }
];
const JOURNEY_STEPS = [
  { label: "Application submitted", date: "Feb 28", done: true },
  { label: "Matched with surgical team", date: "Mar 02", done: true },
  { label: "Pre-op consultation", date: "Mar 14", done: true },
  { label: "Surgery day", date: "Mar 20", done: true },
  { label: "Recovery home check-in", date: "Mar 22", done: true },
  { label: "7-day follow-up", date: "Mar 27", done: false },
  { label: "30-day telemedicine", date: "Apr 20", done: false },
  { label: "Final clearance", date: "May 10", done: false }
];
const DOCS = [
  { name: "Consent Form \u2014 Rhinoplasty.pdf", size: "218 KB", date: "Mar 14" },
  { name: "Pre-op Blood Work Results.pdf", size: "94 KB", date: "Mar 17" },
  { name: "Surgery Report.pdf", size: "340 KB", date: "Mar 20" },
  { name: "Recovery Instructions.pdf", size: "156 KB", date: "Mar 22" },
  { name: "Invoice & Payment Receipt.pdf", size: "82 KB", date: "Mar 22" }
];
const RECOVERY_CHECKS = [
  "Complete pre-op blood work",
  "Attend pre-op consultation",
  "Arrange airport transfer",
  "Pack prescribed medications",
  "Sign all consent forms",
  "7-day wound care log",
  "Attend telemedicine check-in",
  "Submit 30-day recovery photos"
];
const SPill = ({ status }) => {
  const m = {
    Recovery: { bg: T[50], color: T[700], border: T[100] },
    "Pre-op": { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
    Lead: { bg: G[100], color: G[600], border: G[200] }
  };
  const c = m[status] || m.Lead;
  return /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.border}` } }, status);
};
const Toast = ({ msg, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: T[900], color: "#fff", padding: "12px 22px", borderRadius: 10, fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,.25)", whiteSpace: "nowrap" } }, msg);
};
const Modal = ({ open, onClose, children, wide, disableBackdropClose }) => {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  if (!open) return null;
  return /* @__PURE__ */ React.createElement("div", { onClick: (e) => { if (!disableBackdropClose && e.target === e.currentTarget) onClose(); }, className: "modal-backdrop", style: { position: "fixed", inset: 0, zIndex: 300, background: "rgba(6,31,29,.88)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-inner", style: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: wide ? 540 : 480, maxHeight: "92vh", overflowY: "auto" } }, children));
};
const IR = ({ k, v, vc }) => /* @__PURE__ */ React.createElement("div", { style: s.infoRow }, /* @__PURE__ */ React.createElement("span", { style: { color: G[500], fontWeight: 300 } }, k), /* @__PURE__ */ React.createElement("span", { style: { color: vc || G[900], fontWeight: 500, textAlign: "right" } }, v));
const WZ_LBLS = ["", "Your information", "What you're looking for", "Your health", "Preferences", "Review & confirm"];
const WZ_HNTS = ["", "No commitment required", "Takes about 30 seconds", "Your data is fully secure", "Almost done", "Review and submit"];
const PROCS_LIST = ["Rhinoplasty", "Breast Augmentation", "Liposuction", "Tummy Tuck", "Hair Transplant", "Dental Veneers", "Bariatric Surgery", "Hip Replacement", "Eye Surgery", "Other"];
const HEALTH_OPTS = ["Diabetes", "Hypertension", "Heart condition", "Asthma", "None of the above"];
const WzFi = ({ type = "text", ph, val, onChange, err }) => /* @__PURE__ */ React.createElement("input", { type, value: val, onChange, placeholder: ph, style: { width: "100%", height: 42, border: `1px solid ${err ? "#fca5a5" : G[200]}`, borderRadius: 7, padding: "0 13px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: err ? "#fffafb" : "#fff" } });
const C_FLAGS = [{n:"United States", c:"us"},{n:"Canada", c:"ca"},{n:"United Kingdom", c:"gb"},{n:"Australia", c:"au"},{n:"Dominican Republic", c:"do"},{n:"Argentina", c:"ar"},{n:"Austria", c:"at"},{n:"Bahamas", c:"bs"},{n:"Belgium", c:"be"},{n:"Bolivia", c:"bo"},{n:"Brazil", c:"br"},{n:"Chile", c:"cl"},{n:"China", c:"cn"},{n:"Colombia", c:"co"},{n:"Costa Rica", c:"cr"},{n:"Croatia", c:"hr"},{n:"Cuba", c:"cu"},{n:"Czech Republic", c:"cz"},{n:"Denmark", c:"dk"},{n:"Ecuador", c:"ec"},{n:"Egypt", c:"eg"},{n:"El Salvador", c:"sv"},{n:"Finland", c:"fi"},{n:"France", c:"fr"},{n:"Germany", c:"de"},{n:"Greece", c:"gr"},{n:"Guatemala", c:"gt"},{n:"Honduras", c:"hn"},{n:"Hong Kong", c:"hk"},{n:"Hungary", c:"hu"},{n:"India", c:"in"},{n:"Indonesia", c:"id"},{n:"Ireland", c:"ie"},{n:"Israel", c:"il"},{n:"Italy", c:"it"},{n:"Jamaica", c:"jm"},{n:"Japan", c:"jp"},{n:"Malaysia", c:"my"},{n:"Mexico", c:"mx"},{n:"Netherlands", c:"nl"},{n:"New Zealand", c:"nz"},{n:"Nicaragua", c:"ni"},{n:"Norway", c:"no"},{n:"Panama", c:"pa"},{n:"Paraguay", c:"py"},{n:"Peru", c:"pe"},{n:"Philippines", c:"ph"},{n:"Poland", c:"pl"},{n:"Portugal", c:"pt"},{n:"Puerto Rico", c:"pr"},{n:"Russia", c:"ru"},{n:"Saudi Arabia", c:"sa"},{n:"Singapore", c:"sg"},{n:"South Africa", c:"za"},{n:"South Korea", c:"kr"},{n:"Spain", c:"es"},{n:"Sweden", c:"se"},{n:"Switzerland", c:"ch"},{n:"Taiwan", c:"tw"},{n:"Thailand", c:"th"},{n:"Turkey", c:"tr"},{n:"United Arab Emirates", c:"ae"},{n:"Uruguay", c:"uy"},{n:"Venezuela", c:"ve"},{n:"Vietnam", c:"vn"},{n:"Other", c:""}];
const CountrySelect = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const clickOut = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", clickOut); return () => document.removeEventListener("mousedown", clickOut); }, []);
  const selected = C_FLAGS.find(c => c.n === value);
  return /* @__PURE__ */ React.createElement("div", { ref, style: { position: "relative", width: "100%" } },
    /* @__PURE__ */ React.createElement("div", { onClick: () => setOpen(!open), style: { width: "100%", height: 42, border: `1px solid ${error ? "#fca5a5" : G[200]}`, borderRadius: 7, padding: "0 13px", fontSize: 13.5, fontFamily: sans, color: value ? G[900] : G[500], background: error ? "#fffafb" : "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" } },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, selected && selected.c ? /* @__PURE__ */ React.createElement("img", { src: `https://flagcdn.com/w20/${selected.c}.png`, width: 20, alt: "" }) : null, value || "Select a country"),
      /* @__PURE__ */ React.createElement(Icon, { name: "arrowLeft", size: 14, color: G[400], style: { transform: open ? "rotate(90deg)" : "rotate(-90deg)" } })
    ),
    open && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: `1px solid ${G[200]}`, borderRadius: 7, maxHeight: 220, overflowY: "auto", zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } },
      C_FLAGS.map(c => /* @__PURE__ */ React.createElement("div", { key: c.n, onClick: () => { onChange(c.n); setOpen(false); }, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", cursor: "pointer", fontSize: 13.5, color: G[900], background: value === c.n ? G[50] : "transparent" }, onMouseEnter: e => e.currentTarget.style.background = G[50], onMouseLeave: e => e.currentTarget.style.background = value === c.n ? G[50] : "transparent" }, c.c ? /* @__PURE__ */ React.createElement("img", { src: `https://flagcdn.com/w20/${c.c}.png`, width: 20, alt: "" }) : /* @__PURE__ */ React.createElement("div", { style: { width: 20 } }), c.n))
    )
  );
};
const WzLbl = ({ t }) => /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, t);
const SuFi = ({ type = "text", ph, val, onChange, err, onEnter }) => /* @__PURE__ */ React.createElement("input", { type, value: val, onChange, placeholder: ph, onKeyDown: (e) => e.key === "Enter" && onEnter && onEnter(), style: { width: "100%", height: 42, border: `1px solid ${err ? "#fca5a5" : G[200]}`, borderRadius: 7, padding: "0 13px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } });
const SuLbl = ({ t }) => /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, t);
const Wizard = ({ open, onClose, prefill, onComplete }) => {
  const [step, setStep] = useState(1);
  const [proc, setProc] = useState("");
  const [budget, setBudget] = useState(5e3);
  const [health, setHealth] = useState([]);
  const [pref, setPref] = useState({ rh: "", cp: "" });
  const [cons, setCons] = useState({ c1: false, c2: false });
  const [form, setForm] = useState({ fn: "", ln: "", email: "", country: "", lang: "English", phone: "" });
  const [cErr, setCErr] = useState(false);
  const [wizErr, setWizErr] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (open && prefill) {
      setForm((f) => ({ ...f, fn: prefill.fn || "", ln: prefill.ln || "", email: prefill.email || "" }));
    }
  }, [open, prefill]);
  const pct = Math.round(Math.min(step, 5) / 5 * 100);
  const next = () => {
    if (step === 1) {
      if (!form.fn.trim() || !form.ln.trim() || !form.email.includes("@") || !form.country) {
        setWizErr(true);
        return;
      }
    }
    if (step === 2 && !proc) return;
    if (step === 4 && (!pref.rh || !pref.cp)) return;
    if (step === 5) {
      if (!cons.c1 || !cons.c2) {
        setCErr(true);
        return;
      }
      setSubmitted(true);
      setStep(6);
      setTimeout(() => {
        setStep(1);
        setProc("");
        setHealth([]);
        setPref({ rh: "", cp: "" });
        setCons({ c1: false, c2: false });
        setSubmitted(false);
        onClose();
        if (onComplete) onComplete(form);
      }, 2200);
      return;
    }
    setStep((s2) => s2 + 1);
  };
  const back = () => setStep((s2) => s2 - 1);
  const togH = (v) => setHealth((h) => h.includes(v) ? h.filter((x) => x !== v) : [...h, v]);
  const close = () => {
    setStep(1);
    setProc("");
    setHealth([]);
    setPref({ rh: "", cp: "" });
    setCons({ c1: false, c2: false });
    setSubmitted(false);
    onClose();
  };
  const body = () => {
    if (submitted) return /* @__PURE__ */ React.createElement("div", { style: { padding: "48px 36px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 64, height: 64, borderRadius: "50%", background: T[50], border: `2px solid ${T[200]}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "leaf", size: 28, color: T[600] })), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 28, color: T[900], marginBottom: 12 } }, "You're on your way"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: G[500], lineHeight: 1.8, marginBottom: 8 } }, "Taking you to your dashboard\u2026"), /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 3, background: T[200], borderRadius: 3, margin: "16px auto 0", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", background: T[500], borderRadius: 3, animation: "progressBar 2.2s linear forwards" } })), /* @__PURE__ */ React.createElement("style", null, `@keyframes progressBar { from { width:0 } to { width:100% } }`));
    if (step === 1) return /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "First name" }), /* @__PURE__ */ React.createElement(WzFi, { ph: "Jane", val: form.fn, err: wizErr && !form.fn.trim(), onChange: (e) => { setForm((f) => ({ ...f, fn: e.target.value })); setWizErr(false); } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "Last name" }), /* @__PURE__ */ React.createElement(WzFi, { ph: "Smith", val: form.ln, err: wizErr && !form.ln.trim(), onChange: (e) => { setForm((f) => ({ ...f, ln: e.target.value })); setWizErr(false); } })), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1/-1" } }, /* @__PURE__ */ React.createElement(WzLbl, { t: "Email address" }), /* @__PURE__ */ React.createElement(WzFi, { type: "email", ph: "you@email.com", val: form.email, err: wizErr && (!form.email || !form.email.includes("@")), onChange: (e) => { setForm((f) => ({ ...f, email: e.target.value })); setWizErr(false); } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "Country of residence" }), /* @__PURE__ */ React.createElement("select", { value: form.country, onChange: (e) => { setForm((f) => ({ ...f, country: e.target.value })); setWizErr(false); }, style: { width: "100%", height: 42, border: `1px solid ${wizErr && !form.country ? "#fca5a5" : G[200]}`, borderRadius: 7, padding: "0 13px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: wizErr && !form.country ? "#fffafb" : "#fff" } }, ["", "United States", "Canada", "United Kingdom", "Australia", "Dominican Republic", "Argentina", "Austria", "Bahamas", "Belgium", "Bolivia", "Brazil", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Czech Republic", "Denmark", "Ecuador", "Egypt", "El Salvador", "Finland", "France", "Germany", "Greece", "Guatemala", "Honduras", "Hong Kong", "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Malaysia", "Mexico", "Netherlands", "New Zealand", "Nicaragua", "Norway", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "United Arab Emirates", "Uruguay", "Venezuela", "Vietnam", "Other"].map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c || "Select a country")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(WzLbl, { t: "Phone (optional)" }), /* @__PURE__ */ React.createElement(WzFi, { type: "tel", ph: "+1 555 000 000", val: form.phone, onChange: (e) => setForm((f) => ({ ...f, phone: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1/-1" } }, /* @__PURE__ */ React.createElement(WzLbl, { t: "Preferred language" }), /* @__PURE__ */ React.createElement("select", { value: form.lang, onChange: (e) => setForm((f) => ({ ...f, lang: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 13px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } }, ["English", "Spanish", "Portuguese", "French", "Italian", "German", "Arabic", "Chinese", "Japanese", "Korean", "Russian", "Other"].map((l) => /* @__PURE__ */ React.createElement("option", { key: l, value: l }, l)))));
    if (step === 2) return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Lbl, { t: "Procedure of interest" }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 } }, PROCS_LIST.map((p) => /* @__PURE__ */ React.createElement("div", { key: p, onClick: () => setProc(p), style: { padding: "10px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1.5px solid ${proc === p ? T[500] : G[200]}`, background: proc === p ? T[50] : "#fff", color: proc === p ? T[700] : G[700], fontWeight: proc === p ? 500 : 400 } }, p))), /* @__PURE__ */ React.createElement(Lbl, { t: `Estimated budget: $${budget.toLocaleString()}` }), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        min: 1e3,
        max: 3e4,
        step: 500,
        value: budget,
        style: { "--p": `${((budget - 1e3) / 29e3 * 100).toFixed(1)}%` },
        onChange: (e) => setBudget(+e.target.value)
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: G[400] } }, /* @__PURE__ */ React.createElement("span", null, "$1,000"), /* @__PURE__ */ React.createElement("span", null, "$30,000+")));
    if (step === 3) return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Lbl, { t: "Pre-existing conditions (select all that apply)" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginTop: 8 } }, HEALTH_OPTS.map((h) => /* @__PURE__ */ React.createElement("label", { key: h, style: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${health.includes(h) ? T[500] : G[200]}`, background: health.includes(h) ? T[50] : "#fff", cursor: "pointer", fontSize: 13, color: G[700] } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: health.includes(h), onChange: () => togH(h), style: { accentColor: T[500], width: 16, height: 16 } }), h))));
    if (step === 4) return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Lbl, { t: "Recovery home preference" }), ["Private villa", "Shared recovery home", "Hotel (self-managed)", "No preference"].map((r) => /* @__PURE__ */ React.createElement("label", { key: r, style: { display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, border: `1.5px solid ${pref.rh === r ? T[500] : G[200]}`, background: pref.rh === r ? T[50] : "#fff", cursor: "pointer", fontSize: 13, color: G[700], marginBottom: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "rh", checked: pref.rh === r, onChange: () => setPref((p) => ({ ...p, rh: r })), style: { accentColor: T[500] } }), r))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Lbl, { t: "Care package" }), ["Standard", "Premium (includes airport transfer + private nurse)", "Concierge (all-inclusive)"].map((c) => /* @__PURE__ */ React.createElement("label", { key: c, style: { display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, border: `1.5px solid ${pref.cp === c ? T[500] : G[200]}`, background: pref.cp === c ? T[50] : "#fff", cursor: "pointer", fontSize: 13, color: G[700], marginBottom: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "cp", checked: pref.cp === c, onChange: () => setPref((p) => ({ ...p, cp: c })), style: { accentColor: T[500] } }), c))));
    if (step === 5) return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { ...s.card, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Summary"), /* @__PURE__ */ React.createElement(IR, { k: "Name", v: `${form.fn} ${form.ln}`.trim() || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Email", v: form.email || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Country", v: form.country || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Procedure", v: proc || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Budget", v: `$${budget.toLocaleString()}` }), /* @__PURE__ */ React.createElement(IR, { k: "Recovery home", v: pref.rh || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Care package", v: pref.cp || "\u2014" }), /* @__PURE__ */ React.createElement(IR, { k: "Health", v: health.length ? health.join(", ") : "None listed" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, [["c1", "I consent to Praesenti processing my health information to match me with providers."], ["c2", "I acknowledge that Praesenti is a coordination service and not a medical provider."]].map(([key, text]) => /* @__PURE__ */ React.createElement("label", { key, style: { display: "flex", gap: 12, padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${cons[key] ? T[500] : cErr ? "#fca5a5" : G[200]}`, background: cons[key] ? T[50] : "#fff", cursor: "pointer", fontSize: 12.5, color: G[700], lineHeight: 1.6 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: cons[key], onChange: () => {
      setCons((c) => ({ ...c, [key]: !c[key] }));
      setCErr(false);
    }, style: { accentColor: T[500], marginTop: 2, flexShrink: 0 } }), text)), cErr && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#dc2626" } }, "Please accept both consents to continue.")));
  };
  return /* @__PURE__ */ React.createElement(Modal, { open, onClose: close, wide: true }, /* @__PURE__ */ React.createElement("div", { style: { padding: "28px 28px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", null, !submitted && /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 4 } }, "Step ", step, " of 5 \xB7 ", WZ_HNTS[step]), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950] } }, submitted ? "Application received" : WZ_LBLS[step])), /* @__PURE__ */ React.createElement("button", { onClick: close, style: { background: "none", border: "none", color: G[400], cursor: "pointer", padding: 4, display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 18, color: G[400] }))), !submitted && /* @__PURE__ */ React.createElement("div", { style: { height: 3, background: G[100], borderRadius: 3, marginBottom: 24, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${pct}%`, background: T[500], borderRadius: 3, transition: "width .35s ease" } }))), /* @__PURE__ */ React.createElement("div", { style: { padding: "0 28px 28px" } }, body(), !submitted && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 28 } }, /* @__PURE__ */ React.createElement("button", { onClick: step === 1 ? close : back, style: { ...s.btnGhost, visibility: step === 1 ? "hidden" : "visible" } }, "Back"), /* @__PURE__ */ React.createElement("button", { onClick: next, style: s.btnPrimary }, step === 5 ? "Submit application" : "Continue"))));
};
const _cfg = window.__PRAESENTI_CONFIG__ || {};
let SUPA_URL = _cfg.SUPABASE_URL || "";
let SUPA_KEY = _cfg.SUPABASE_KEY || "";

// Lee SUPA_URL/SUPA_KEY en el momento de la llamada, no al definirse
const supaFetch = (path, body) => {
  if (!SUPA_URL || !SUPA_KEY) return Promise.resolve({ error: "Supabase not configured", error_description: "Falta configurar SUPABASE_URL y SUPABASE_KEY en el archivo .env" });
  return fetch(`${SUPA_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` },
    body: JSON.stringify(body)
  }).then((r) => r.json());
};

const supaGet = (table, params = "") => {
  if (!SUPA_URL || !SUPA_KEY) return Promise.resolve([]);
  return fetch(`${SUPA_URL}/rest/v1/${table}?${params}`, {
    headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" }
  }).then(r => r.ok ? r.json() : []).catch(() => []);
};
const DEMO_ACCOUNTS = {
  "patient@praesenti.com": { password: "patient2024", role: "patient", fn: "Demo", ln: "Patient", isDemo: true },
  "admin@praesenti.com": { password: "admin2024", role: "admin", fn: "Admin", ln: "", isDemo: true },
  "coordinator@praesenti.com": { password: "coord2024", role: "coordinator", fn: "Demo", ln: "Coordinator", isDemo: true },
  "nurse@praesenti.com": { password: "nurse2024", role: "nurse", fn: "Ana", ln: "Reyes", isDemo: true }
};
const AuthModal = ({ open, onClose, onLogin, onSwitchToSignUp }) => {
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
      onLogin(demo.role, { fn: demo.fn, ln: demo.ln, email: email.trim().toLowerCase(), isDemo: true });
      return;
    }
    if (!SUPA_URL || !SUPA_KEY) {
      setError("Estamos teniendo problemas para conectarnos. Por favor intenta más tarde o contacta a soporte.");
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
    reset();
    onClose();
    onLogin(role, { fn: meta.fn || "", ln: meta.ln || "", email: data.user.email });
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
  ), /* @__PURE__ */ React.createElement("p", { style: { textAlign: "center", marginTop: 18, fontSize: 13, color: G[500] } }, "Don't have an account?", " ", /* @__PURE__ */ React.createElement("span", { onClick: () => {
    handleClose();
    onSwitchToSignIn();
  }, style: { color: T[600], fontWeight: 500, cursor: "pointer" } }, "Create one")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16, padding: "14px 16px", background: G[50], borderRadius: 8, border: `1px solid ${G[200]}` } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, fontWeight: 600, color: G[500], letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 } }, "Demo accounts"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, [["Patient", "patient@praesenti.com", "patient2024"], ["Admin", "admin@praesenti.com", "admin2024"], ["Coordinator", "coordinator@praesenti.com", "coord2024"], ["Nurse", "nurse@praesenti.com", "nurse2024"]].map(([label, em, pw]) => /* @__PURE__ */ React.createElement(
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
const SignUpModal = ({ open, onClose, onSignUpDone, onSwitchToSignIn }) => {
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
    if (!SUPA_URL || !SUPA_KEY) {
      setError("Estamos teniendo problemas para conectarnos. Por favor intenta más tarde o contacta a soporte.");
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
      /* @__PURE__ */ React.createElement("div", { style: { width: 64, height: 64, borderRadius: "50%", background: T[50], border: `2px solid ${T[200]}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" } },
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
  return /* @__PURE__ */ React.createElement(Modal, { open, onClose: handleClose }, /* @__PURE__ */ React.createElement("div", { style: { padding: "28px 28px 32px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950] } }, "Create your account"), /* @__PURE__ */ React.createElement("button", { onClick: handleClose, style: { background: "none", border: "none", color: G[400], cursor: "pointer", padding: 4, display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 18, color: G[400] }))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: G[500], marginBottom: 22 } }, "Then we'll ask a few quick questions to match you with the right care."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(SuLbl, { t: "First name" }), /* @__PURE__ */ React.createElement(SuFi, { ph: "Jane", val: form.fn, onChange: set("fn"), err: !!error && !form.fn.trim(), onEnter: handleCreate })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(SuLbl, { t: "Last name" }), /* @__PURE__ */ React.createElement(SuFi, { ph: "Smith", val: form.ln, onChange: set("ln"), err: !!error && !form.ln.trim(), onEnter: handleCreate }))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(SuLbl, { t: "Email address" }), /* @__PURE__ */ React.createElement(SuFi, { type: "email", ph: "you@email.com", val: form.email, onChange: set("email"), err: !!error && !form.email.includes("@"), onEnter: handleCreate })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(SuLbl, { t: "Password" }), /* @__PURE__ */ React.createElement(SuFi, { type: "password", ph: "At least 6 characters", val: form.password, onChange: set("password"), err: !!error && form.password.length < 6, onEnter: handleCreate })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: error ? 10 : 20 } }, /* @__PURE__ */ React.createElement(SuLbl, { t: "Confirm password" }), /* @__PURE__ */ React.createElement(SuFi, { type: "password", ph: "Repeat your password", val: form.confirm, onChange: set("confirm"), err: !!error && form.password !== form.confirm, onEnter: handleCreate })), error && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12.5, color: "#dc2626", marginBottom: 14 } }, "\u2715 ", error), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCreate,
      disabled: loading,
      style: { ...s.btnPrimary, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }
    },
    loading ? "Creating account\u2026" : "Continue to questionnaire",
    !loading && /* @__PURE__ */ React.createElement(Icon, { name: "arrowLeft", size: 14, color: "#fff", style: { transform: "rotate(180deg)" } })
  ), /* @__PURE__ */ React.createElement("p", { style: { textAlign: "center", marginTop: 18, fontSize: 13, color: G[500] } }, "Already have an account?", " ", /* @__PURE__ */ React.createElement("span", { onClick: () => {
    handleClose();
    onSwitchToSignIn();
  }, style: { color: T[600], fontWeight: 500, cursor: "pointer" } }, "Sign in"))));
};
const Landing = ({ onLogin, lang, setLang }) => {
  const [authOpen, setAuthOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [wizOpen, setWizOpen] = useState(false);
  const [prefillForm, setPrefillForm] = useState(null);
  const howRef = useRef(null);
  const procRef = useRef(null);
  const whyRef = useRef(null);
  const scroll = (ref) => {
    var _a;
    return (_a = ref.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
  };
  const PROCS_LANDING = [
    { name: "Rhinoplasty", iconName: "nose", price: "from $3,200", savings: "Save up to 65%" },
    { name: "Breast Aug.", iconName: "flower", price: "from $4,500", savings: "Save up to 60%" },
    { name: "Liposuction", iconName: "sparkles", price: "from $3,800", savings: "Save up to 55%" },
    { name: "Hair Transplant", iconName: "seedling", price: "from $2,400", savings: "Save up to 70%" },
    { name: "Tummy Tuck", iconName: "stethoscope", price: "from $5,000", savings: "Save up to 58%" },
    { name: "Dental Veneers", iconName: "smile", price: "from $1,800", savings: "Save up to 72%" }
  ];
  const HOW_STEPS = [
    { title: tr("stepHow1T", lang), body: tr("stepHow1B", lang), num: "01", iconName: "clipboard" },
    { title: tr("stepHow2T", lang), body: tr("stepHow2B", lang), num: "02", iconName: "handshake" },
    { title: tr("stepHow3T", lang), body: tr("stepHow3B", lang), num: "03", iconName: "plane" },
    { title: tr("stepHow4T", lang), body: tr("stepHow4B", lang), num: "04", iconName: "heart" }
  ];
  const WHY_ITEMS = [
    { iconName: "hospital", label: "JCI-accredited hospitals" },
    { iconName: "sun", label: "Year-round warm climate" },
    { iconName: "piggyBank", label: "40\u201372% cost savings" },
    { iconName: "plane", label: "2\u20134 hr from major US cities" },
    { iconName: "userMd", label: "US-trained surgeons" },
    { iconName: "palm", label: "Luxury recovery homes" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: s.page }, /* @__PURE__ */ React.createElement(
    Wizard,
    {
      open: wizOpen,
      prefill: prefillForm,
      onClose: () => {
        setWizOpen(false);
        setPrefillForm(null);
      },
      onComplete: (form) => onLogin("patient", { fn: form.fn, ln: form.ln, email: form.email })
    }
  ), /* @__PURE__ */ React.createElement(AuthModal, { open: authOpen, onClose: () => setAuthOpen(false), onLogin: (role, userData) => onLogin(role, userData), onSwitchToSignUp: () => setSignUpOpen(true) }), /* @__PURE__ */ React.createElement(
    SignUpModal,
    {
      open: signUpOpen,
      onClose: () => setSignUpOpen(false),
      onSignUpDone: (form) => {
        setPrefillForm(form);
        setWizOpen(true);
      },
      onSwitchToSignIn: () => setAuthOpen(true)
    }
  ), /* @__PURE__ */ React.createElement("nav", { className: "landing-nav", style: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 60px", height: 68, background: "rgba(6,31,29,.94)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,.06)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 22, fontWeight: 600, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" } }, "Praes", /* @__PURE__ */ React.createElement("span", { style: { color: T[300] } }, "enti")), /* @__PURE__ */ React.createElement("div", { className: "nav-right", style: { display: "flex", alignItems: "center", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "nav-links", style: { display: "flex", gap: 24 } }, [["Process", howRef], ["Procedures", procRef], ["Dominican Republic", whyRef]].map(([lbl, ref]) => /* @__PURE__ */ React.createElement(
    "span",
    {
      key: lbl,
      onClick: () => scroll(ref),
      style: { color: "rgba(255,255,255,.55)", fontSize: 13, cursor: "pointer" },
      onMouseEnter: (e) => e.target.style.color = "#fff",
      onMouseLeave: (e) => e.target.style.color = "rgba(255,255,255,.55)"
    },
    lbl
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, overflow: "hidden" } }, ["EN", "ES"].map((l, i) => /* @__PURE__ */ React.createElement("span", { key: l }, i === 1 && /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 16, background: "rgba(255,255,255,.12)", display: "inline-block", verticalAlign: "middle" } }), /* @__PURE__ */ React.createElement("button", { onClick: () => setLang(l.toLowerCase()), style: { padding: "6px 11px", fontSize: 12, fontWeight: 500, color: lang === l.toLowerCase() ? "#fff" : "rgba(255,255,255,.45)", background: lang === l.toLowerCase() ? "rgba(255,255,255,.12)" : "transparent", border: "none", cursor: "pointer", fontFamily: sans } }, l)))), /* @__PURE__ */ React.createElement("button", { className: "nav-signin", onClick: () => setAuthOpen(true), style: { background: "transparent", color: "rgba(255,255,255,.75)", border: "1px solid rgba(255,255,255,.18)", padding: "8px 18px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: sans } }, tr("signIn", lang)), /* @__PURE__ */ React.createElement("button", { onClick: () => setSignUpOpen(true), style: { background: T[500], color: "#fff", border: "none", padding: "9px 20px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: sans } }, tr("begin", lang)))), /* @__PURE__ */ React.createElement("section", { className: "hero-section", style: { minHeight: "100vh", background: T[950], display: "grid", gridTemplateColumns: "1fr 420px", alignItems: "center", gap: 60, padding: "120px 60px 80px", position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.035) 1px,transparent 0)", backgroundSize: "40px 40px" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "-20%", right: "-10%", width: "55vw", height: "55vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(26,158,149,.14) 0%,transparent 65%)", pointerEvents: "none" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", zIndex: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "inline-block", fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: T[300], marginBottom: 28, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,.1)" } }, tr("eyebrow", lang)), /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: "clamp(46px,5.5vw,76px)", fontWeight: 600, color: "#fff", lineHeight: 1.04, marginBottom: 28 } }, tr("heroTitle", lang)[0], /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("em", { style: { fontStyle: "italic", color: T[300], fontWeight: 400 } }, tr("heroTitle", lang)[1])), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,.55)", lineHeight: 1.8, maxWidth: 480, marginBottom: 48 } }, tr("heroBody", lang)), /* @__PURE__ */ React.createElement("div", { className: "hero-btns", style: { display: "flex", gap: 14, marginBottom: 64 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setSignUpOpen(true), style: { ...s.btnPrimary, padding: "14px 32px" } }, tr("begin", lang)), /* @__PURE__ */ React.createElement("button", { onClick: () => scroll(howRef), style: { ...s.btnGhost, padding: "14px 24px", color: "rgba(255,255,255,.6)", borderColor: "rgba(255,255,255,.15)" } }, tr("howItWorks", lang)))), /* @__PURE__ */ React.createElement("div", { className: "hero-card", style: { position: "relative", zIndex: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "rgba(255,255,255,.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "28px 26px" } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, color: "rgba(255,255,255,.3)", marginBottom: 18 } }, "Current patient"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,.07)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 46, height: 46, borderRadius: "50%", background: T[800], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 20, fontWeight: 600, color: T[200] } }, "M"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { color: "#fff", fontWeight: 500, fontSize: 14 } }, "Patient F"), /* @__PURE__ */ React.createElement("div", { style: { color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 2 } }, "New York, USA")), /* @__PURE__ */ React.createElement(SPill, { status: "Recovery" })), [["Procedure", "Rhinoplasty"], ["Surgeon", "Dr. [Surgeon]"], ["Surgery date", "March 20, 2026"], ["Recovery home", "Villa Serena \xB7 Santo Domingo"], ["Coordinator", "Coordinator A"]].map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, style: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.05)", fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "rgba(255,255,255,.35)" } }, k), /* @__PURE__ */ React.createElement("span", { style: { color: "rgba(255,255,255,.8)", fontWeight: 500 } }, v))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.3)", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", null, "Recovery progress"), /* @__PURE__ */ React.createElement("span", null, "Day 8 of 14")), /* @__PURE__ */ React.createElement("div", { style: { height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: "57%", background: T[400], borderRadius: 2 } })))))), /* @__PURE__ */ React.createElement("section", { ref: howRef, className: "section-pad", style: { padding: "96px 60px", background: "#fff" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 56 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, color: T[500], marginBottom: 12 } }, "The process"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, color: T[950] } }, tr("howItWorks", lang))), /* @__PURE__ */ React.createElement("div", { className: "grid-4", style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, maxWidth: 1100, margin: "0 auto" } }, HOW_STEPS.map(({ title, body, num, iconName }) => /* @__PURE__ */ React.createElement("div", { key: num }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: T[300], marginBottom: 16 } }, num), /* @__PURE__ */ React.createElement("div", { style: { width: 44, height: 44, borderRadius: 10, background: T[50], border: `1px solid ${T[100]}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 22, color: T[600] })), /* @__PURE__ */ React.createElement("h3", { style: { fontFamily: serif, fontSize: 20, fontWeight: 600, color: T[950], marginBottom: 10 } }, title), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13.5, color: G[500], lineHeight: 1.75, fontWeight: 300 } }, body))))), /* @__PURE__ */ React.createElement("section", { ref: procRef, className: "section-pad", style: { padding: "96px 60px", background: G[50] } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 48 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, color: T[500], marginBottom: 12 } }, "Popular procedures"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, color: T[950] } }, lang === "es" ? "Procedimientos disponibles" : "Available procedures")), /* @__PURE__ */ React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 1100, margin: "0 auto" } }, PROCS_LANDING.map((p) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: p.name,
      style: { background: "#fff", border: `1px solid ${G[200]}`, borderRadius: 14, padding: "24px 22px", cursor: "pointer" },
      onMouseEnter: (e) => e.target.style.boxShadow = "0 8px 32px rgba(26,158,149,.12)",
      onMouseLeave: (e) => e.target.style.boxShadow = "none"
    },
    /* @__PURE__ */ React.createElement("div", { style: { width: 48, height: 48, borderRadius: 10, background: T[50], border: `1px solid ${T[100]}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Icon, { name: p.iconName, size: 24, color: T[600] })), /* @__PURE__ */ React.createElement("h3", { style: { fontFamily: serif, fontSize: 20, fontWeight: 600, color: T[950], marginBottom: 6 } }, p.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, color: T[600], fontWeight: 500, marginBottom: 4 } }, p.price), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: G[400], fontWeight: 300 } }, p.savings)
  )))), /* @__PURE__ */ React.createElement("section", { ref: whyRef, className: "section-pad", style: { padding: "96px 60px", background: T[950], position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize: "40px 40px" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, color: T[300], marginBottom: 16 } }, "Location"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, color: "#fff", marginBottom: 22 } }, tr("whyDR", lang)), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, color: "rgba(255,255,255,.5)", lineHeight: 1.9, fontWeight: 300, marginBottom: 48 } }, tr("whyDRBody", lang)), /* @__PURE__ */ React.createElement("div", { className: "grid-why", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: "rgba(255,255,255,.06)", borderRadius: 14, overflow: "hidden" } }, WHY_ITEMS.map(({ iconName, label }) => /* @__PURE__ */ React.createElement("div", { key: label, style: { padding: "22px 18px", background: "rgba(255,255,255,.03)", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: 8, background: "rgba(77,208,200,.1)", border: "1px solid rgba(77,208,200,.15)", display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 20, color: T[300] }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,.55)", fontWeight: 300 } }, label)))))), /* @__PURE__ */ React.createElement("section", { className: "section-pad", style: { padding: "80px 60px", background: "#fff", textAlign: "center" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: "clamp(28px,3.5vw,46px)", fontWeight: 600, color: T[950], marginBottom: 18 } }, lang === "es" ? "\xBFListo para empezar?" : "Ready to begin?"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 15, color: G[500], fontWeight: 300, marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" } }, lang === "es" ? "Tu consulta inicial es gratuita. Sin compromiso." : "Your initial consultation is free. No commitment."), /* @__PURE__ */ React.createElement("button", { onClick: () => setSignUpOpen(true), style: { ...s.btnPrimary, padding: "15px 40px", fontSize: 15 } }, tr("begin", lang))), /* @__PURE__ */ React.createElement("footer", { className: "footer-layout", style: { background: T[950], padding: "32px 60px", display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" } }, "Praes", /* @__PURE__ */ React.createElement("span", { style: { color: T[300] } }, "enti")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,.25)", fontWeight: 300 } }, tr("footerTag", lang)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,.25)" } }, "\xA9 2026 Praesenti")));
};
const PatientDashboard = ({ onSignOut, user, autoWiz }) => {
  const firstName = (user == null ? void 0 : user.fn) || "";
  const lastName = (user == null ? void 0 : user.ln) || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Patient";
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "P";
  const isDemo = !!(user == null ? void 0 : user.isDemo);
  const isNewUser = !isDemo;
  const [screen, setScreen] = useState(() => {
    if (user && !user.isDemo && !localStorage.getItem("onboarding_done_" + user.id)) {
      return "onboarding";
    }
    return "overview";
  });
  const [caseTab, setCaseTab] = useState("journey");
  const [msgs, setMsgs] = useState(INIT_MSGS);
  const [msgInput, setMsgInput] = useState("");
  const [sidebarItem, setSidebarItem] = useState("Overview");
  const [checkDone, setCheckDone] = useState([true, true, true, false, false, false, false, false]);
  const [toast, setToast] = useState(null);
  const [tcSlot, setTcSlot] = useState(null);
  const [tcBooked, setTcBooked] = useState(false);
  const [dashWizOpen, setDashWizOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [service, setService] = useState(isDemo ? "Post-op Follow-up" : "Initial Consultation");

  // ── Load patient's assigned providers from Supabase ──────────────────
  const [CLINICAS, setCLINICAS] = useState(CLINICAS_PLACEHOLDER);
  const [DOCTORES, setDOCTORES] = useState(DOCTORES_PLACEHOLDER);
  const [RECOVERY_HOMES_FULL, setRECOVERY_HOMES_FULL] = useState(RECOVERY_HOMES_PLACEHOLDER);

  useEffect(() => {
    if (!useSupabaseReady()) return;
    Promise.all([
      supaGet("clinicas",       "select=*&order=name"),
      supaGet("doctores",       "select=*&order=name"),
      supaGet("recovery_homes", "select=*&order=name")
    ]).then(([clin, docs, homes]) => {
      if (Array.isArray(clin)  && clin.length)  setCLINICAS(clin);
      if (Array.isArray(docs)  && docs.length)  setDOCTORES(docs);
      if (Array.isArray(homes) && homes.length) setRECOVERY_HOMES_FULL(homes);
    });
  }, []);

  // En producción estos vendrían del caso asignado al paciente:
  const patMyDoctor = DOCTORES[0] || null;
  const patMyClinic = CLINICAS[0] || null;
  const patMyHome   = RECOVERY_HOMES_FULL[0] || null;
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => { if (autoWiz) setDashWizOpen(true); }, [autoWiz]);
  const msgBodyRef = useRef(null);
  useEffect(() => {
    if (msgBodyRef.current) msgBodyRef.current.scrollTop = msgBodyRef.current.scrollHeight;
  }, [msgs]);
  useEffect(() => {
    if (user && !user.isDemo && !localStorage.getItem("onboarding_done_" + user.id)) {
      if (screen !== "onboarding") setScreen("onboarding");
    }
  }, [screen, user]);
  const showToast = (msg) => setToast(msg);
  const sendMsg = () => {
    if (!msgInput.trim()) return;
    const now = /* @__PURE__ */ new Date();
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
    safePush({ role: "patient", item, scr: newScr, tab: tab || null, dash: "patient" }, "", "#patient/" + newScr + (tab ? "/" + tab : ""));
  };
  useEffect(() => {
    if (!history.state || history.state.dash !== "patient") {
      safeReplace({ item: sidebarItem, scr: screen, tab: caseTab, dash: "patient" }, "", "#patient/" + screen + (caseTab ? "/" + caseTab : ""));
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
    ["My Care", [
      ["My Doctor", "userMd", () => navTo("My Doctor", "my-doctor")],
      ["My Clinic", "hospital", () => navTo("My Clinic", "my-clinic")],
      ["Recovery Home", "home", () => navTo("Recovery Home", "my-home")]
    ]],
    ["Explore", [
      ["Recovery Homes", "palm", () => navTo("Recovery Homes", "dir-homes")],
      ["Clinics & Doctors", "stethoscope", () => navTo("Clinics & Doctors", "dir-providers")]
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
    const activeOptions = isDemo ? ["Pre-op Review", "Post-op Follow-up", "General Question"] : ["Initial Consultation"];
    const currentService = activeOptions.includes(service) ? service : activeOptions[0];

    return /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Teleconsult Scheduler"), /* @__PURE__ */ React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Book a secure video call with your surgeon or care coordinator"), tcBooked ? /* @__PURE__ */ React.createElement("div", { style: { ...s.card, background: T[50], border: `1px solid ${T[200]}`, textAlign: "center", padding: "40px 28px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 52, height: 52, borderRadius: "50%", background: T[100], border: `2px solid ${T[300]}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 22, color: T[600] })), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[900], marginBottom: 8 } }, "Appointment confirmed"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: G[500] } }, "Your ", currentService, " is scheduled for ", /* @__PURE__ */ React.createElement("strong", { style: { color: G[900] } }, tcSlot), "."), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: G[400], marginTop: 8 } }, "A confirmation has been sent to your email. A join link will appear 15 minutes before your call."), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setTcBooked(false);
      setTcSlot(null);
    }, style: { ...s.btnGhost, marginTop: 20, fontSize: 12 } }, "Reschedule")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { ...s.card, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Appointment type"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 } }, activeOptions.map((t2) => /* @__PURE__ */ React.createElement("button", { key: t2, onClick: () => setService(t2), style: { flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${currentService === t2 ? T[500] : G[100]}`, background: currentService === t2 ? T[50] : "#fff", color: currentService === t2 ? T[700] : G[600], fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: sans } }, t2))), /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Select a date & time"), slots.map(({ day, times }) => /* @__PURE__ */ React.createElement("div", { key: day, style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: G[700], marginBottom: 8 } }, day), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, times.map((t) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t,
        onClick: () => setTcSlot(`${day} \xB7 ${t}`),
        style: { padding: "8px 18px", borderRadius: 7, border: `1.5px solid ${tcSlot === `${day} \xB7 ${t}` ? T[500] : G[200]}`, background: tcSlot === `${day} \xB7 ${t}` ? T[50] : "#fff", color: tcSlot === `${day} \xB7 ${t}` ? T[700] : G[700], fontSize: 13, cursor: "pointer", fontFamily: sans, fontWeight: tcSlot === `${day} \xB7 ${t}` ? 500 : 400 }
      },
      t
    )))))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          if (tcSlot) {
            setTcBooked(true);
          } else {
            showToast("Please select a time slot");
          }
        },
        style: { ...s.btnPrimary, padding: "11px 28px" }
      },
      "Confirm appointment"
    )));
  };
  const [profileForm, setProfileForm] = useState({ fn: firstName, ln: lastName, email: (user == null ? void 0 : user.email) || "", phone: "", country: "", lang: "English", emergency: "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const ProfileScreen = ({ profileForm, setProfileForm, profileSaved, setProfileSaved, showToast }) => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto", maxWidth: 600 } }, /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "My Profile"), /* @__PURE__ */ React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Manage your personal information and preferences"), /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 16 } }, "Personal information"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 } }, [["First name", "fn"], ["Last name", "ln"]].map(([lbl, key]) => /* @__PURE__ */ React.createElement("div", { key }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, lbl), /* @__PURE__ */ React.createElement("input", { value: profileForm[key], onChange: (e) => setProfileForm((f) => ({ ...f, [key]: e.target.value })), style: { width: "100%", height: 40, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 12px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } } ,)))), [["Email address", "email", "email"], ["Phone", "phone", "tel"], ["Emergency contact", "emergency", "text"]].map(([lbl, key, type]) => /* @__PURE__ */ React.createElement("div", { key, style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, lbl), /* @__PURE__ */ React.createElement("input", { type, value: profileForm[key], onChange: (e) => setProfileForm((f) => ({ ...f, [key]: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 12px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } }))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Country"), /* @__PURE__ */ React.createElement("select", { value: profileForm.country, onChange: (e) => setProfileForm((f) => ({ ...f, country: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 12px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } }, [React.createElement("option", { key: "", value: "" }, "Select a country"), ...[{n:"United States",f:"🇺🇸"},{n:"Canada",f:"🇨🇦"},{n:"United Kingdom",f:"🇬🇧"},{n:"Australia",f:"🇦🇺"},{n:"Dominican Republic",f:"🇩🇴"},{n:"Argentina",f:"🇦🇷"},{n:"Austria",f:"🇦🇹"},{n:"Bahamas",f:"🇧🇸"},{n:"Belgium",f:"🇧🇪"},{n:"Bolivia",f:"🇧🇴"},{n:"Brazil",f:"🇧🇷"},{n:"Chile",f:"🇨🇱"},{n:"China",f:"🇨🇳"},{n:"Colombia",f:"🇨🇴"},{n:"Costa Rica",f:"🇨🇷"},{n:"Croatia",f:"🇭🇷"},{n:"Cuba",f:"🇨🇺"},{n:"Czech Republic",f:"🇨🇿"},{n:"Denmark",f:"🇩🇰"},{n:"Ecuador",f:"🇪🇨"},{n:"Egypt",f:"🇪🇬"},{n:"El Salvador",f:"🇸🇻"},{n:"Finland",f:"🇫🇮"},{n:"France",f:"🇫🇷"},{n:"Germany",f:"🇩🇪"},{n:"Greece",f:"🇬🇷"},{n:"Guatemala",f:"🇬🇹"},{n:"Honduras",f:"🇭🇳"},{n:"Hong Kong",f:"🇭🇰"},{n:"Hungary",f:"🇭🇺"},{n:"India",f:"🇮🇳"},{n:"Indonesia",f:"🇮🇩"},{n:"Ireland",f:"🇮🇪"},{n:"Israel",f:"🇮🇱"},{n:"Italy",f:"🇮🇹"},{n:"Jamaica",f:"🇯🇲"},{n:"Japan",f:"🇯🇵"},{n:"Malaysia",f:"🇲🇾"},{n:"Mexico",f:"🇲🇽"},{n:"Netherlands",f:"🇳🇱"},{n:"New Zealand",f:"🇳🇿"},{n:"Nicaragua",f:"🇳🇮"},{n:"Norway",f:"🇳🇴"},{n:"Panama",f:"🇵🇦"},{n:"Paraguay",f:"🇵🇾"},{n:"Peru",f:"🇵🇪"},{n:"Philippines",f:"🇵🇭"},{n:"Poland",f:"🇵🇱"},{n:"Portugal",f:"🇵🇹"},{n:"Puerto Rico",f:"🇵🇷"},{n:"Russia",f:"🇷🇺"},{n:"Saudi Arabia",f:"🇸🇦"},{n:"Singapore",f:"🇸🇬"},{n:"South Africa",f:"🇿🇦"},{n:"South Korea",f:"🇰🇷"},{n:"Spain",f:"🇪🇸"},{n:"Sweden",f:"🇸🇪"},{n:"Switzerland",f:"🇨🇭"},{n:"Taiwan",f:"🇹🇼"},{n:"Thailand",f:"🇹🇭"},{n:"Turkey",f:"🇹🇷"},{n:"United Arab Emirates",f:"🇦🇪"},{n:"Uruguay",f:"🇺🇾"},{n:"Venezuela",f:"🇻🇪"},{n:"Vietnam",f:"🇻🇳"},{n:"Other",f:"🌍"}].map((c) => React.createElement("option", { key: c.n, value: c.n }, c.f + " " + c.n))])), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 500, color: G[700], marginBottom: 5 } }, "Preferred language"), /* @__PURE__ */ React.createElement("select", { value: profileForm.lang, onChange: (e) => setProfileForm((f) => ({ ...f, lang: e.target.value })), style: { width: "100%", height: 42, border: `1px solid ${G[200]}`, borderRadius: 7, padding: "0 12px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900], background: "#fff" } }, ["English", "Spanish", "Portuguese", "French", "Italian", "German", "Arabic", "Chinese", "Japanese", "Korean", "Russian", "Other"].map((l) => React.createElement("option", { key: l, value: l }, l)))), profileSaved && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: T[600], marginBottom: 10, fontWeight: 500 } }, "Changes saved successfully."), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setProfileSaved(true);
    showToast("Profile updated");
    setTimeout(() => setProfileSaved(false), 3e3);
  }, style: { ...s.btnPrimary, marginTop: 8, padding: "10px 24px", fontSize: 13 } }, "Save changes")), /* @__PURE__ */ React.createElement("div", { style: { ...s.card, marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 12 } }, "Security"), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast("Password reset email sent"), style: { ...s.btnGhost, fontSize: 13 } }, "Change password")));
  const PAT_PAYMENTS = [
    { date: "Mar 20", desc: "Surgery \u2014 Rhinoplasty", amount: "$4,200", status: "Paid", method: "Visa \xB7\xB7\xB74242" },
    { date: "Mar 18", desc: "Recovery home \u2014 7 nights", amount: "$980", status: "Paid", method: "Visa \xB7\xB7\xB74242" },
    { date: "Mar 14", desc: "Pre-op consultation", amount: "$120", status: "Paid", method: "Visa \xB7\xB7\xB74242" },
    { date: "Apr 20", desc: "30-day telemedicine", amount: "$75", status: "Pending", method: "\u2014" }
  ];
  const PaymentsScreen = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: 26, color: T[950], marginBottom: 4 } }, "Payments"), /* @__PURE__ */ React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Your payment history and upcoming charges"), isNewUser ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.card, textAlign: "center", padding: "48px 32px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 52, height: 52, borderRadius: "50%", background: G[100], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" } }, /* @__PURE__ */ React.createElement(Icon, { name: "creditCard", size: 24, color: G[400] })), /* @__PURE__ */ React.createElement("h3", { style: { fontFamily: serif, fontSize: 20, color: G[700], marginBottom: 8 } }, "No transactions yet"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13.5, color: G[400], lineHeight: 1.8 } }, "Your invoices and payment history will appear here once your case is assigned and payments are processed.")), /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Payment method"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: G[400], marginBottom: 14 } }, "No payment method on file. You'll be prompted to add one when your first invoice is issued."), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast("Card management coming soon"), style: { ...s.btnGhost, fontSize: 13 } }, "Add payment method")), /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Make a payment"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: G[400], marginBottom: 14 } }, "Simulate a payment for testing purposes."), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast("Mock payment processed"), style: { ...s.btnPrimary, fontSize: 13 } }, "Make mock payment"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 } }, [["Total paid", "$5,300", T[700]], ["Pending", "$75", "#92400e"], ["Savings vs. US", "~$8,400", T[500]]].map(([lbl, val, color]) => /* @__PURE__ */ React.createElement("div", { key: lbl, style: { ...s.card, marginBottom: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 8 } }, lbl), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 28, fontWeight: 600, color } }, val)))), /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Transaction history"), PAT_PAYMENTS.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < PAT_PAYMENTS.length - 1 ? `1px solid ${G[100]}` : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: 8, background: p.status === "Paid" ? T[50] : G[100], border: `1px solid ${p.status === "Paid" ? T[100] : G[200]}`, display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: "creditCard", size: 16, color: p.status === "Paid" ? T[600] : G[500] })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: G[900] } }, p.desc), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } }, p.date, " \xB7 ", p.method))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, p.amount), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 500, color: p.status === "Paid" ? T[600] : "#92400e", background: p.status === "Paid" ? T[50] : "#fef3c7", padding: "2px 8px", borderRadius: 10, border: `1px solid ${p.status === "Paid" ? T[100] : "#fde68a"}` } }, p.status))))), /* @__PURE__ */ React.createElement("div", { style: { ...s.card, marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Payment method on file"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: "creditCard", size: 20, color: G[500] }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: G[700] } }, "Visa ending in 4242")), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast("Card management coming soon"), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px" } }, "Update card"))), /* @__PURE__ */ React.createElement("div", { style: { ...s.card, marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Make a payment"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: G[400], marginBottom: 14 } }, "Pay for your services using PayPal."), /* @__PURE__ */ React.createElement("div", { id: "paypal-button-container" }))));
  const Sidebar = () => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "sidebar-overlay" + (sidebarOpen ? " open" : ""), onClick: () => setSidebarOpen(false) }), /* @__PURE__ */ React.createElement("div", { className: "app-sidebar" + (sidebarOpen ? " open" : ""), style: { background: "#fff", borderRight: `1px solid ${G[200]}`, padding: "24px 0", width: 220, flexShrink: 0 } }, SIDEBAR_GROUPS.map(([grp, items]) => /* @__PURE__ */ React.createElement("div", { key: grp, style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("span", { style: { ...s.label, padding: "0 20px", display: "block", marginBottom: 8 } }, grp), items.map(([lbl, iconName, fn]) => /* @__PURE__ */ React.createElement("div", { key: lbl, onClick: () => { fn(); setSidebarOpen(false); }, style: { padding: "9px 20px", fontSize: 13, color: sidebarItem === lbl ? T[700] : G[600], cursor: "pointer", borderLeft: `2px solid ${sidebarItem === lbl ? T[500] : "transparent"}`, background: sidebarItem === lbl ? T[50] : "transparent", fontWeight: sidebarItem === lbl ? 500 : void 0, display: "flex", alignItems: "center", gap: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 15, color: sidebarItem === lbl ? T[600] : G[400] }), lbl, lbl === "Messages" && !isNewUser && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", background: T[500], color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10 } }, "1")))))));
  const NEXT_STEPS = [
    { icon: "clipboard", title: "Complete your profile", body: "Add your country, phone, and health background so we can match you faster.", action: "Complete profile", onClick: () => navTo("Onboarding", "onboarding") },
    { icon: "stethoscope", title: "Your case is being reviewed", body: "A Praesenti coordinator will reach out within 24 hours to discuss your procedure and budget.", action: null },
    { icon: "video", title: "Book a free consultation", body: "Schedule a video call with one of our patient coordinators to answer any questions.", action: "Book a call", onClick: () => navTo("Teleconsult", "teleconsult") }
  ];
  const NewUserOverview = () => /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { background: T[950], borderRadius: 16, padding: "36px 36px 32px", marginBottom: 24, position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "-30%", right: "-8%", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle,rgba(26,158,149,.18) 0%,transparent 65%)", pointerEvents: "none" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", zIndex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(77,208,200,.12)", border: "1px solid rgba(77,208,200,.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 20 } }, /* @__PURE__ */ React.createElement(Icon, { name: "leaf", size: 13, color: T[300] }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T[300] } }, "Application received")), /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: 32, fontWeight: 600, color: "#fff", marginBottom: 10, lineHeight: 1.2 } }, "Welcome, ", firstName || ((user == null ? void 0 : user.email) || "").split("@")[0], ".", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: T[300], fontStyle: "italic", fontWeight: 400 } }, "Your journey starts here.")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: "rgba(255,255,255,.5)", fontWeight: 300, maxWidth: 480, lineHeight: 1.8 } }, "We've received your application. A coordinator will be in touch within 24 hours to guide your next steps."))), /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "What happens next"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 } }, NEXT_STEPS.map((step, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: 10, background: T[50], border: `1px solid ${T[100]}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 } }, /* @__PURE__ */ React.createElement(Icon, { name: step.icon, size: 18, color: T[600] })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: T[500], background: T[50], border: `1px solid ${T[100]}`, borderRadius: 10, padding: "2px 8px" } }, "Step ", i + 1)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 500, color: G[900], marginBottom: 4 } }, step.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: G[500], lineHeight: 1.6 } }, step.body), step.action && /* @__PURE__ */ React.createElement("button", { onClick: step.onClick, style: { ...s.btnPrimary, marginTop: 12, padding: "8px 18px", fontSize: 12 } }, step.action)), /* @__PURE__ */ React.createElement("div", { style: { width: 20, height: 20, borderRadius: "50%", background: i === 0 ? T[500] : G[200], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 } }, i === 0 && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 10, color: "#fff" }))))));
  const Overview = () => isNewUser ? /* @__PURE__ */ React.createElement(NewUserOverview, null) : /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: serif, fontSize: 28, color: T[950] } }, "Good morning, ", firstName), /* @__PURE__ */ React.createElement("div", { style: { width: 28, height: 28, borderRadius: "50%", background: T[50], border: `1px solid ${T[100]}`, display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: "leaf", size: 14, color: T[600] }))), /* @__PURE__ */ React.createElement("p", { style: { color: G[400], fontSize: 13, marginBottom: 28 } }, "Day 8 of recovery \xB7 Everything looks on track"), /* @__PURE__ */ React.createElement("div", { style: { ...s.card, background: T[950], border: "none", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, color: "rgba(255,255,255,.3)", marginBottom: 6 } }, "Recovery progress"), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: serif, fontSize: 22, color: "#fff" } }, "Rhinoplasty \xB7 Dr. [Surgeon]")), /* @__PURE__ */ React.createElement(SPill, { status: "Recovery" })), /* @__PURE__ */ React.createElement("div", { style: { height: 6, background: "rgba(255,255,255,.1)", borderRadius: 3, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: "57%", background: T[400], borderRadius: 3 } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 6 } }, /* @__PURE__ */ React.createElement("span", null, "Day 8"), /* @__PURE__ */ React.createElement("span", null, "Day 14"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Next step"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 500, color: G[900], marginBottom: 4 } }, "7-day follow-up"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: G[400] } }, "March 27 \xB7 Telemedicine"), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast("Booking telemedicine..."), style: { ...s.btnPrimary, marginTop: 14, padding: "9px 20px", fontSize: 12 } }, "Book now")), /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "Your coordinator"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 38, height: 38, borderRadius: "50%", background: T[100], display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Icon, { name: "person", size: 18, color: T[600] })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 500, color: G[900] } }, "Coordinator A"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: G[400] } }, "Usually replies in <2h"))), /* @__PURE__ */ React.createElement("button", { onClick: () => navTo("Messages", "case", "messages"), style: { ...s.btnGhost, fontSize: 12, padding: "8px 16px" } }, "Message"))), /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { ...s.label, marginBottom: 14 } }, "Journey timeline"), JOURNEY_STEPS.slice(0, 5).map((step, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${G[100]}` : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 20, height: 20, borderRadius: "50%", background: step.done ? T[500] : G[200], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, step.done && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 10, color: "#fff" })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontSize: 13, color: step.done ? G[900] : G[400] } }, step.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: G[400] } }, step.date))), /* @__PURE__ */ React.createElement("button", { onClick: () => navTo("My Case", "case", "journey"), style: { ...s.btnGhost, marginTop: 14, fontSize: 12, padding: "8px 16px" } }, "View full timeline")));
  const EmptyState = ({ icon, title, body, action, onClick }) => /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", maxWidth: 360 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 64, height: 64, borderRadius: "50%", background: T[50], border: `2px solid ${T[100]}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" } }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 26, color: T[500] })), /* @__PURE__ */ React.createElement("h3", { style: { fontFamily: serif, fontSize: 22, color: T[950], marginBottom: 10 } }, title), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13.5, color: G[500], lineHeight: 1.8, marginBottom: action ? 24 : 0 } }, body), action && /* @__PURE__ */ React.createElement("button", { onClick, style: s.btnPrimary }, action)));
  const CaseDetail = () => /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 28, overflowY: "auto" } }, caseTab === "journey" && (isNewUser ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "clipboard",
      title: "No case assigned yet",
      body: "Once your coordinator reviews your application and matches you with a surgeon, your full journey will appear here.",
      action: "Go to overview",
      onClick: () => navTo("Overview", "overview")
    }
  ) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950], marginBottom: 20 } }, "My Journey"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: 10, top: 0, bottom: 0, width: 2, background: G[100] } }), JOURNEY_STEPS.map((step, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 20, marginBottom: 20, position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 22, height: 22, borderRadius: "50%", flexShrink: 0, zIndex: 1, background: step.done ? T[500] : G[200], display: "flex", alignItems: "center", justifyContent: "center" } }, step.done && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 10, color: "#fff" })), /* @__PURE__ */ React.createElement("div", { style: { ...s.card, flex: 1, margin: 0, padding: "14px 18px", opacity: step.done ? 1 : 0.55 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: step.done ? 500 : 400, color: step.done ? G[900] : G[500] } }, step.label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: G[400] } }, step.date)))))))), caseTab === "documents" && (isNewUser ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "document",
      title: "No documents yet",
      body: "Your consent forms, lab results, and surgery reports will appear here once your case is assigned."
    }
  ) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950], marginBottom: 20 } }, "My Documents"), DOCS.map((doc, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: 8, background: T[50], border: `1px solid ${T[100]}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement(Icon, { name: "fileText", size: 20, color: T[600] })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 500, color: G[900] } }, doc.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } }, doc.size, " \xB7 Uploaded ", doc.date)), /* @__PURE__ */ React.createElement("button", { onClick: () => showToast("Download started"), style: { ...s.btnGhost, fontSize: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(Icon, { name: "download", size: 13, color: G[600] }), "Download"))))), caseTab === "recovery" && (isNewUser ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "check",
      title: "Checklist coming soon",
      body: "Your pre-op and recovery checklist will be shared by your coordinator once your procedure is confirmed."
    }
  ) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950], marginBottom: 20 } }, "Recovery Checklist"), /* @__PURE__ */ React.createElement("div", { style: { ...s.card, background: T[50], border: `1px solid ${T[100]}`, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(Icon, { name: "shield", size: 15, color: T[600] }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, color: T[700], lineHeight: 1.6 } }, "Your coordinator manages and updates this checklist as your case progresses."))), /* @__PURE__ */ React.createElement("div", { style: s.card }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: s.label }, "Tasks"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: G[400] } }, checkDone.filter(Boolean).length, " / ", RECOVERY_CHECKS.length, " complete")), /* @__PURE__ */ React.createElement("div", { style: { height: 4, background: G[100], borderRadius: 2, marginBottom: 20, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${(checkDone.filter(Boolean).length / RECOVERY_CHECKS.length * 100).toFixed(0)}%`, background: T[500], borderRadius: 2, transition: "width .3s" } })), RECOVERY_CHECKS.map((item, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < RECOVERY_CHECKS.length - 1 ? `1px solid ${G[100]}` : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 18, height: 18, borderRadius: 4, border: `2px solid ${checkDone[i] ? T[500] : G[300]}`, background: checkDone[i] ? T[500] : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, checkDone[i] && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 10, color: "#fff" })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13.5, color: checkDone[i] ? G[400] : G[900], textDecoration: checkDone[i] ? "line-through" : "none" } }, item)))))), caseTab === "messages" && (isNewUser ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "message",
      title: "No messages yet",
      body: "Once a coordinator is assigned to your case, you'll be able to message them directly here.",
      action: "Book a consultation",
      onClick: () => navTo("Teleconsult", "teleconsult")
    }
  ) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950], marginBottom: 16 } }, "Messages"), /* @__PURE__ */ React.createElement("div", { ref: msgBodyRef, style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 12 } }, msgs.map((m, i) => {
    const showDate = i === 0 || msgs[i - 1].date !== m.date;
    return /* @__PURE__ */ React.createElement("div", { key: i }, showDate && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontSize: 11, color: G[400], margin: "8px 0" } }, m.date), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: m.side === "me" ? "flex-end" : "flex-start" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "72%", padding: "10px 14px", borderRadius: 12, background: m.side === "me" ? T[500] : G[100], color: m.side === "me" ? "#fff" : G[900], fontSize: 13.5, lineHeight: 1.6 } }, m.text, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, marginTop: 4, opacity: 0.55, textAlign: "right" } }, m.time))));
  })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, paddingTop: 12, borderTop: `1px solid ${G[200]}` } }, /* @__PURE__ */ React.createElement("input", { value: msgInput, onChange: (e) => setMsgInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && sendMsg(), placeholder: "Type a message...", style: { flex: 1, height: 42, border: `1px solid ${G[200]}`, borderRadius: 8, padding: "0 14px", fontSize: 13.5, fontFamily: sans, outline: "none", color: G[900] } }), /* @__PURE__ */ React.createElement("button", { onClick: sendMsg, style: { ...s.btnPrimary, padding: "0 20px", display: "flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement(Icon, { name: "send", size: 14, color: "#fff" }), "Send"))))));
  const PatDetailRow = ({ label, value }) =>
    React.createElement("div", { style: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"9px 0", borderBottom:`1px solid ${G[100]}`, gap:16 } },
      React.createElement("span", { style:{ fontSize:12.5, color:G[500], flexShrink:0 } }, label),
      React.createElement("span", { style:{ fontSize:13, color:G[900], fontWeight:500, textAlign:"right" } }, value)
    );

  const MyDoctorScreen = () => {
    const d = patMyDoctor;
    if (!d) return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 } },
      React.createElement("div", { style:{ width:52, height:52, borderRadius:"50%", background:T[50], border:`1px solid ${T[100]}`, display:"flex", alignItems:"center", justifyContent:"center" } }, React.createElement(Icon, { name:"userMd", size:22, color:T[400] })),
      React.createElement("p", { style:{ fontSize:14, color:G[500], textAlign:"center" } }, "Tu médico asignado aparecerá aquí una vez que tu coordinador confirme tu caso.")
    );
    const ini = d.name.split(" ").filter((_,j)=>j>0).map(w=>w[0]).join("").slice(0,2).toUpperCase();
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto", maxWidth:800 } },
      React.createElement("h1", { style:{ fontFamily:serif, fontSize:26, color:T[950], marginBottom:4 } }, "Mi Médico"),
      React.createElement("p",  { style:{ color:G[400], fontSize:13, marginBottom:28 } }, "Información sobre tu cirujano asignado"),
      React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:18, marginBottom:24 } },
        React.createElement("div", { style:{ width:64, height:64, borderRadius:"50%", background:T[800], display:"flex", alignItems:"center", justifyContent:"center", fontFamily:serif, fontSize:24, fontWeight:600, color:T[200] } }, ini),
        React.createElement("div", null,
          React.createElement("h2", { style:{ fontFamily:serif, fontSize:22, color:T[950], marginBottom:4 } }, d.name),
          React.createElement("div", { style:{ fontSize:14, color:G[500] } }, d.specialty + (d.subspecialty ? ` · ${d.subspecialty}` : "")),
          React.createElement("div", { style:{ fontSize:13, color:T[600], fontWeight:600, marginTop:4 } }, d.rating+" ★ · "+d.cases+" casos")
        )
      ),
      React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 } },
        React.createElement("div", { style:s.card },
          React.createElement("div", { style:{ ...s.label, marginBottom:12 } }, "Información profesional"),
          React.createElement(PatDetailRow, { label:"Especialidad", value:d.specialty }),
          React.createElement(PatDetailRow, { label:"Subespecialidad", value:d.subspecialty }),
          React.createElement(PatDetailRow, { label:"Experiencia", value:d.experience+" años" }),
          React.createElement(PatDetailRow, { label:"Idiomas", value:d.languages.join(" · ") }),
          React.createElement(PatDetailRow, { label:"Clínica", value:d.clinics.join(", ") })
        ),
        React.createElement("div", { style:s.card },
          React.createElement("div", { style:{ ...s.label, marginBottom:12 } }, "Procedimientos"),
          d.procedures.map((p,i)=>
            React.createElement("div", { key:i, style:{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:i<d.procedures.length-1?`1px solid ${G[100]}`:"none" } },
              React.createElement("div", { style:{ width:6, height:6, borderRadius:"50%", background:T[400], flexShrink:0 } }),
              React.createElement("span", { style:{ fontSize:13, color:G[700] } }, p)
            )
          )
        )
      ),
      React.createElement("div", { style:{ ...s.card, marginTop:16 } },
        React.createElement("div", { style:{ ...s.label, marginBottom:10 } }, "Sobre el Dr./Dra."),
        React.createElement("p", { style:{ fontSize:13.5, color:G[600], lineHeight:1.75 } }, d.bio)
      )
    );
  };

  const MyClinicScreen = () => {
    const c = patMyClinic;
    if (!c) return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 } },
      React.createElement("div", { style:{ width:52, height:52, borderRadius:"50%", background:T[50], border:`1px solid ${T[100]}`, display:"flex", alignItems:"center", justifyContent:"center" } }, React.createElement(Icon, { name:"hospital", size:22, color:T[400] })),
      React.createElement("p", { style:{ fontSize:14, color:G[500], textAlign:"center" } }, "La clínica donde se realizará tu procedimiento aparecerá aquí una vez confirmado tu caso.")
    );
    return React.createElement("div", { className:"dash-screen", style:{ flex:1, padding:32, overflowY:"auto", maxWidth:800 } },
      React.createElement("h1", { style:{ fontFamily:serif, fontSize:26, color:T[950], marginBottom:4 } }, "Mi Clínica"),
      React.createElement("p",  { style:{ color:G[400], fontSize:13, marginBottom:28 } }, "Donde se realizará tu procedimiento"),
      React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:18, marginBottom:24 } },
        React.createElement("div", { style:{ width:56, height:56, borderRadius:14, background:T[800], display:"flex", alignItems:"center", justifyContent:"center" } },
          React.createElement(Icon, { name:"hospital", size:26, color:T[200] })
        ),
        React.createElement("div", null,
          React.createElement("h2", { style:{ fontFamily:serif, fontSize:22, color:T[950], marginBottom:4 } }, c.name),
          React.createElement("div", { style:{ fontSize:14, color:G[500] } }, c.sector),
          React.createElement("div", { style:{ fontSize:13, color:T[600], fontWeight:600, marginTop:4 } }, c.rating+" ★")
        )
      ),
      React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 } },
        React.createElement("div", { style:s.card },
          React.createElement("div", { style:{ ...s.label, marginBottom:12 } }, "Cómo llegar"),
          React.createElement(PatDetailRow, { label:"Dirección", value:c.address }),
          React.createElement(PatDetailRow, { label:"Sector", value:c.sector }),
          React.createElement(PatDetailRow, { label:"Teléfono", value:c.phone }),
          React.createElement(PatDetailRow, { label:"WhatsApp", value:c.whatsapp }),
          React.createElement(PatDetailRow, { label:"Email", value:c.email }),
          React.createElement(PatDetailRow, { label:"Idiomas", value:c.languages.join(" · ") })
        ),
        React.createElement("div", { style:s.card },
          React.createElement("div", { style:{ ...s.label, marginBottom:12 } }, "Especialidades"),
          c.specialties.map((sp,i)=>
            React.createElement("div", { key:i, style:{ display:"flex", alignItems:"center", gap:8, padding:"8px 0" } },
              React.createElement("div", { style:{ width:6, height:6, borderRadius:"50%", background:T[500] } }),
              React.createElement("span", { style:{ fontSize:13.5, color:G[900] } }, sp)
            )
          )
        )
      )
    );
  };

  const ClinicsScreen = () => {
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Clinics", subtitle: "Accredited clinics and hospitals in the network",
        actions: [React.createElement("button", { key: "add", onClick: () => navTo("+ New Clinic", "form-clinic"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 20px" } }, "+ Add clinic")]
      }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
      React.createElement(Stat, { label: "Total clinics", value: clinicsList.length, color: T[700], icon: "hospital" }),
        React.createElement(Stat, { label: "Avg. rating", value: "4.9", color: T[500], icon: "activity" }),
        React.createElement(Stat, { label: "Active procedures", value: "124", color: G[500], icon: "check" })
      ),
    clinicsList.map((c, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 16, marginBottom: 12 } },
        React.createElement("div", { style: { width: 44, height: 44, borderRadius: 12, background: T[100], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 18, fontWeight: 600, color: T[700], flexShrink: 0 } }, c.name.split(" ").filter(w=>w.length>2).slice(0,2).map(w=>w[0]).join("")),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: G[900] } }, c.name),
          React.createElement("div", { style: { fontSize: 12, color: G[500], marginTop: 2 } }, c.sector, ", ", c.city),
          React.createElement("div", { style: { fontSize: 11, color: G[400], marginTop: 2 } }, c.specialties)
        ),
        React.createElement("div", { style: { textAlign: "right", flexShrink: 0 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: T[600] } }, c.rating, " \u2605")
        )
      ))
    );
  };

  const DoctorsScreen = () => {
    if (selectedProvider) return React.createElement(ProviderDetailScreen, null);
    return React.createElement("div", { className: "dash-screen", style: { flex: 1, padding: 32, overflowY: "auto" } },
      React.createElement(PanelHeader, { title: "Doctors", subtitle: "Board-certified surgeons in the Praesenti network",
        actions: [React.createElement("button", { key: "d", onClick: () => navTo("+ New Doctor", "form-doctor"), style: { ...s.btnPrimary, fontSize: 13, padding: "9px 18px" } }, "+ Add doctor")]
      }),
      React.createElement("div", { className: "grid-3", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 } },
        React.createElement(Stat, { label: "Active doctors", value: providersList.length, color: T[700], icon: "userMd" }),
        React.createElement(Stat, { label: "Avg. rating", value: "4.86", color: T[500], icon: "activity" }),
        React.createElement(Stat, { label: "Cases this month", value: "12", color: G[500], icon: "users" })
      ),
      PROVIDERS.map((p, i) => React.createElement("div", { key: i, style: { ...s.card, display: "flex", alignItems: "center", gap: 18, marginBottom: 12, cursor: "pointer" }, onClick: () => setSelectedProvider(p), onMouseEnter: e => e.currentTarget.style.borderColor = T[300], onMouseLeave: e => e.currentTarget.style.borderColor = G[200] },
        React.createElement("div", { style: { width: 44, height: 44, borderRadius: "50%", background: T[800], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 18, fontWeight: 600, color: T[200], flexShrink: 0 } }, p.name.split(" ")[1][0]),
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

  const App = () => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState("landing");
    const [lang, setLang] = useState("en");
    const [toast, setToast] = useState(null);
    const [authOpen, setAuthOpen] = useState(false);
    const [signUpOpen, setSignUpOpen] = useState(false);
    const [wizOpen, setWizOpen] = useState(false);
    const [prefillForm, setPrefillForm] = useState(null);
    const showToast = (msg) => {
      setToast(msg);
      setTimeout(() => setToast(null), 2200);
    };
    const handleLogin = (newRole, userData) => {
      setRole(newRole);
      setUser(userData);
      safePush({ role: newRole, dash: newRole }, "", "#" + newRole);
    };
    const handleSignOut = () => {
      setRole("landing");
      setUser(null);
      safePush({ role: "landing", dash: "landing" }, "", "#landing");
    };

    useEffect(() => {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        if (accessToken && typeof SUPA_URL !== 'undefined' && typeof SUPA_KEY !== 'undefined') {
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
              let userRole = meta.role || "patient";
              const userEmail = data.email;
              const checkRoles = async () => {
                try {
                  const headers = { "apikey": SUPA_KEY, "Authorization": `Bearer ${accessToken}` };
                  const adminRes = await fetch(`${SUPA_URL}/rest/v1/admins?email=eq.${encodeURIComponent(userEmail)}&select=id`, { headers });
                  if (adminRes.ok && (await adminRes.json()).length > 0) userRole = "admin";
                  else {
                    const coordRes = await fetch(`${SUPA_URL}/rest/v1/coordinadores?email=eq.${encodeURIComponent(userEmail)}&select=id`, { headers });
                    if (coordRes.ok && (await coordRes.json()).length > 0) userRole = "coordinator";
                    else {
                      const nurseRes = await fetch(`${SUPA_URL}/rest/v1/nurses?email=eq.${encodeURIComponent(userEmail)}&select=id`, { headers });
                      if (nurseRes.ok && (await nurseRes.json()).length > 0) userRole = "nurse";
                      else userRole = "patient";
                    }
                  }
                } catch(e) {}
                handleLogin(userRole, { fn: meta.fn || "", ln: meta.ln || "", email: userEmail, id: data.id, token: accessToken });
                window.history.replaceState(null, "", window.location.pathname);
              };
              checkRoles();
            }
          })
          .catch(err => console.error("Error confirming email token:", err));
        }
      }
    }, []);

  return /* @__PURE__ */ React.createElement("div", { style: s.page }, 
    /* @__PURE__ */ React.createElement(Toast, { msg: toast, onDone: () => setToast(null) }), 
    role === "landing" && /* @__PURE__ */ React.createElement(Landing, { onLogin: handleLogin, lang, setLang }), 
    role === "patient" && /* @__PURE__ */ React.createElement(PatientDashboard, { onSignOut: handleSignOut, user, autoWiz: false }),
    role === "admin" && /* @__PURE__ */ React.createElement(AdminDashboard, { onSignOut: handleSignOut, user }),
    role === "coordinator" && /* @__PURE__ */ React.createElement(CoordinatorDashboard, { onSignOut: handleSignOut, user }),
    role === "nurse" && /* @__PURE__ */ React.createElement(NurseDashboard, { onSignOut: handleSignOut, user })
  );
  };
  const startApp = () => {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(/* @__PURE__ */ React.createElement(App, null));
  };
  startApp();}
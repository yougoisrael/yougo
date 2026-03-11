// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  main.jsx — React Router v6 + PWA service worker
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { StrictMode } from "react";
import { createRoot }  from "react-dom/client";
import { HashRouter }  from "react-router-dom";   // HashRouter works on Vercel static SPA
import App from "./App";

// ── Register Service Worker (PWA) ──────────────────
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(r => console.log("SW registered:", r.scope))
      .catch(e => console.warn("SW failed:", e));
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);

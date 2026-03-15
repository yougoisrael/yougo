import "./index.css";
import { StrictMode }   from "react";
import { createRoot }   from "react-dom/client";
import { HashRouter }   from "react-router-dom";
import App              from "./App";
import { startKeepAlive } from "./lib/supabase";

/* PWA Service Worker */
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(r => console.log("✅ SW:", r.scope))
      .catch(e => console.warn("SW failed:", e));
  });
}

/* Keep Supabase awake 24/7 */
startKeepAlive();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);

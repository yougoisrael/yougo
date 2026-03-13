import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

const AREAS = [
  {
    id: "east",
    short: "ראמה - מגאר - עראבה",
    name: "ראמה, סאגור, שזור, עין אל-אסד, עראבה, סחנין, מגאר",
    lat: 32.907,
    lng: 35.355,
    radius: 10000,
    color: "#C8102E",
  },
  {
    id: "center",
    short: "כרמיאל - נחף - בעינה",
    name: "כרמיאל, נחף, דיר אל-אסד, בעינה, מגד אל-כרום",
    lat: 32.918,
    lng: 35.295,
    radius: 8000,
    color: "#1d4ed8",
  },
  {
    id: "north",
    short: "פקיעין - חורפיש - כסרה",
    name: "פקיעין, חורפיש, בית ג'ן, כסרה-סמיע",
    lat: 32.987,
    lng: 35.322,
    radius: 8500,
    color: "#16a34a",
  },
];

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate    = useNavigate();
  const mapRef      = useRef(null);
  const leafRef     = useRef(null);
  const circlesRef  = useRef({});
  const [ready,     setReady]    = useState(false);
  const [selected,  setSelected] = useState(null);

  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const css = Object.assign(document.createElement("link"), {
      rel: "stylesheet",
      href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
    });
    document.head.appendChild(css);
    const js = Object.assign(document.createElement("script"), {
      src: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
      onload: () => setReady(true),
    });
    document.head.appendChild(js);
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [32.935, 35.325],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      minZoom: 10,
      maxZoom: 14,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    leafRef.current = map;

    AREAS.forEach(area => {
      // دائرة شفافة
      const circle = L.circle([area.lat, area.lng], {
        radius:      area.radius,
        color:       area.color,
        weight:      2,
        opacity:     0.7,
        fillColor:   area.color,
        fillOpacity: 0.08,
      }).addTo(map);

      circle.on("click", () => selectArea(area, map, L));

      // pin صغير في المنتصف
      const icon = L.divIcon({
        html: `<div class="yg-pin" id="pin-${area.id}" style="--col:${area.color}">
          <div class="yg-dot"></div>
          <div class="yg-lbl">${area.short}</div>
        </div>`,
        className:  "",
        iconSize:   [10, 10],
        iconAnchor: [5, 5],
      });

      L.marker([area.lat, area.lng], { icon })
        .addTo(map)
        .on("click", e => { L.DomEvent.stopPropagation(e); selectArea(area, map, L); });

      circlesRef.current[area.id] = circle;
    });

    map.on("click", () => { setSelected(null); resetPins(); });

    return () => { map.remove(); leafRef.current = null; circlesRef.current = {}; };
  }, [ready]);

  function selectArea(area, map, L) {
    resetPins();
    setPinActive(area.id, true, area.color);

    // تحديث الدائرة - أكثر وضوحاً عند الاختيار
    AREAS.forEach(a => {
      const c = circlesRef.current[a.id];
      if (!c) return;
      if (a.id === area.id) {
        c.setStyle({ fillOpacity: 0.18, weight: 3, opacity: 1 });
      } else {
        c.setStyle({ fillOpacity: 0.05, weight: 1.5, opacity: 0.4 });
      }
    });

    map.flyTo([area.lat, area.lng], 12, { duration: 0.5 });
    setSelected(area);
  }

  function resetPins() {
    AREAS.forEach(a => setPinActive(a.id, false, a.color));
    AREAS.forEach(a => {
      const c = circlesRef.current[a.id];
      if (c) c.setStyle({ fillOpacity: 0.08, weight: 2, opacity: 0.7 });
    });
  }

  function setPinActive(id, active, color) {
    const el = document.getElementById(`pin-${id}`);
    if (!el) return;
    const dot = el.querySelector(".yg-dot");
    const lbl = el.querySelector(".yg-lbl");
    if (dot) {
      dot.style.background = active ? color : "white";
      dot.style.transform  = active ? "scale(1.5)" : "scale(1)";
    }
    if (lbl) {
      lbl.style.background = active ? color  : "white";
      lbl.style.color      = active ? "white" : "#111";
      lbl.style.fontWeight = active ? "900"   : "700";
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, fontFamily: "Arial,sans-serif", direction: "rtl" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(110%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .mBtn:active { transform: scale(0.91); }
        .leaflet-container { background: #f0ece4 !important; }
        .yg-pin { display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; }
        .yg-dot {
          width: 16px; height: 16px; border-radius: 50%;
          background: white; border: 2px solid var(--col);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
        }
        .yg-lbl {
          background: white; color: #111;
          font-size: 9px; font-weight: 700;
          padding: 2px 6px; border-radius: 6px;
          white-space: nowrap;
          border: 1.5px solid var(--col);
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
          transition: all 0.2s ease;
          font-family: Arial, sans-serif;
        }
      `}</style>

      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "white", boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <button className="mBtn" onClick={() => navigate(-1)} style={{
          background: "#F3F4F6", border: "none", borderRadius: 12,
          width: 38, height: 38, cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>בחר אזור משלוח</div>
          <div style={{
            fontSize: 11, marginTop: 1,
            color: selected ? selected.color : C.gray,
            fontWeight: selected ? 800 : 400,
            transition: "color 0.25s",
          }}>
            {selected ? `✓ ${selected.short}` : "לחץ על הדגל שלך במפה"}
          </div>
        </div>
        <div style={{ width: 38 }}/>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{
        position: "absolute", top: 62, left: 0, right: 0,
        bottom: selected ? 168 : 80,
        transition: "bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)",
      }}/>

      {/* Loading */}
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 600, background: "white",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "3px solid rgba(200,16,46,0.15)", borderTopColor: C.red,
            animation: "spin 0.8s linear infinite",
          }}/>
          <div style={{ color: C.gray, fontSize: 13, fontWeight: 700 }}>טוען מפה...</div>
        </div>
      )}

      {/* Zoom */}
      <div style={{
        position: "absolute", left: 12, top: "50%",
        transform: "translateY(-50%)", zIndex: 900,
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {[["+", 1], ["-", -1]].map(([l, d]) => (
          <button key={l} className="mBtn"
            onClick={() => leafRef.current?.setZoom((leafRef.current.getZoom() || 11) + d)}
            style={{
              background: "white", border: "1px solid #E5E7EB", borderRadius: 10,
              width: 36, height: 36, color: C.dark, fontSize: 18, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>{l}
          </button>
        ))}
      </div>

      {/* Selected card */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 80, left: 0, right: 0, zIndex: 1000,
          background: "white", borderRadius: "22px 22px 0 0",
          padding: "14px 20px 18px",
          boxShadow: "0 -6px 28px rgba(0,0,0,0.13)",
          animation: "slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1)",
        }}>
          <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 12px" }}/>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0,
              background: `${selected.color}15`,
              border: `1.5px solid ${selected.color}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={selected.color}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: C.dark, lineHeight: 1.5 }}>
                {selected.name}
              </div>
              <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginTop: 3 }}>
                ✓ אזור פעיל • משלוח זמין
              </div>
            </div>
            <button onClick={() => { setSelected(null); resetPins(); }} style={{
              background: "#F3F4F6", border: "none", borderRadius: "50%",
              width: 28, height: 28, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: C.gray, flexShrink: 0,
            }}>✕</button>
          </div>
          <button className="mBtn"
            onClick={() => { onAreaSelect?.(selected); navigate("/"); }}
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${selected.color}, ${selected.color}bb)`,
              border: "none", borderRadius: 16, padding: "15px",
              color: "white", fontSize: 15, fontWeight: 900, cursor: "pointer",
              boxShadow: `0 4px 18px ${selected.color}45`,
            }}>
            בחר {selected.short} ←
          </button>
        </div>
      )}

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 999 }}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}

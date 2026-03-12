import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

// كل منطقة — polygon يحيط بالقرى الحقيقية بدقة
const AREAS = [
  {
    id: "rame_group",
    name: "ראמה - סגור - בית ג׳ן",
    emoji: "🏡",
    active: true,
    // يحيط بـ: ראמה (32.938,35.373), סגור (32.918,35.339), בית ג׳ן (32.968,35.406)
    center: [32.942, 35.375],
    polygon: [
      [32.980, 35.328],[32.985, 35.360],[32.982, 35.388],
      [32.975, 35.418],[32.958, 35.425],[32.940, 35.420],
      [32.922, 35.408],[32.908, 35.390],[32.905, 35.362],
      [32.908, 35.330],[32.922, 35.312],[32.940, 35.308],
      [32.960, 35.312],
    ],
  },
  {
    id: "karmiel_group",
    name: "כרמיאל - נחף - מג׳ד - שזור",
    emoji: "🏙️",
    active: true,
    // يحيط بـ: כרמיאל (32.914,35.296), נחף (32.958,35.320), מג׳ד (32.902,35.350), שזור (32.935,35.305)
    center: [32.932, 35.318],
    polygon: [
      [32.970, 35.278],[32.972, 35.305],[32.970, 35.335],
      [32.968, 35.358],[32.952, 35.368],[32.935, 35.365],
      [32.918, 35.360],[32.898, 35.348],[32.890, 35.325],
      [32.892, 35.298],[32.902, 35.278],[32.920, 35.265],
      [32.942, 35.262],[32.958, 35.268],
    ],
  },
  {
    id: "magar",
    name: "מג׳אר",
    emoji: "🌿",
    active: true,
    // قرية מג׳אר (32.898,35.403) — منطقة صغيرة
    center: [32.898, 35.403],
    polygon: [
      [32.912, 35.388],[32.914, 35.408],[32.908, 35.420],
      [32.895, 35.424],[32.882, 35.418],[32.878, 35.405],
      [32.882, 35.390],[32.895, 35.382],
    ],
  },
  {
    id: "peki_group",
    name: "פקיעין - כ׳ סמיע - כסרה",
    emoji: "🌲",
    active: true,
    // يحيط بـ: פקיעין (32.979,35.323), כ׳ סמיע (32.945,35.275), כסרה (32.965,35.345)
    center: [32.962, 35.312],
    polygon: [
      [32.992, 35.262],[32.995, 35.290],[32.992, 35.318],
      [32.988, 35.350],[32.972, 35.362],[32.955, 35.358],
      [32.938, 35.348],[32.928, 35.330],[32.928, 35.305],
      [32.932, 35.278],[32.945, 35.260],[32.962, 35.252],
      [32.978, 35.255],
    ],
  },
];

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate    = useNavigate();
  const mapRef      = useRef(null);
  const leafRef     = useRef(null);
  const polyRef     = useRef({});
  const labelRef    = useRef(null);
  const [ready,     setReady]    = useState(false);
  const [selected,  setSelected] = useState(null);

  // ── Load Leaflet ──────────────────────────────
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

  // ── Init map ──────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [32.935, 35.340],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      minZoom: 9,
      maxZoom: 15,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    leafRef.current = map;

    function clearLabel() {
      if (labelRef.current) {
        map.removeLayer(labelRef.current);
        labelRef.current = null;
      }
    }

    function resetStyles() {
      Object.entries(polyRef.current).forEach(([id, poly]) => {
        poly.setStyle({ fillOpacity: 0.13, weight: 2, opacity: 0.8 });
      });
    }

    AREAS.forEach(area => {
      const poly = L.polygon(area.polygon, {
        color:       C.red,
        weight:      2,
        opacity:     0.8,
        fillColor:   C.red,
        fillOpacity: 0.13,
        className:   "area-poly",
      }).addTo(map);

      polyRef.current[area.id] = poly;

      poly.on("click", (e) => {
        L.DomEvent.stopPropagation(e);

        clearLabel();
        resetStyles();

        // Highlight this polygon
        poly.setStyle({ fillOpacity: 0.28, weight: 3, opacity: 1 });

        // Show floating label above center
        const lbl = L.marker(area.center, {
          icon: L.divIcon({
            html: `
              <div style="
                background:${C.red};
                color:white;
                padding:8px 18px;
                border-radius:22px;
                font-size:13px;
                font-weight:900;
                white-space:nowrap;
                box-shadow:0 4px 16px rgba(200,16,46,0.45);
                font-family:Arial,sans-serif;
                transform:translateX(50%);
              ">${area.emoji} ${area.name}</div>
            `,
            className: "",
            iconSize:  [0, 0],
            iconAnchor:[0, 32],
          }),
          interactive: false,
          zIndexOffset: 2000,
        }).addTo(map);

        labelRef.current = lbl;

        map.flyTo(area.center, 12, { duration: 0.6 });
        setSelected(area);
      });
    });

    // Click outside → deselect
    map.on("click", () => {
      clearLabel();
      resetStyles();
      setSelected(null);
    });

    return () => {
      map.remove();
      leafRef.current  = null;
      polyRef.current  = {};
      labelRef.current = null;
    };
  }, [ready]);

  function handleConfirm() {
    if (!selected) return;
    onAreaSelect?.(selected);
    navigate("/");
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      fontFamily: "Arial,sans-serif", direction: "rtl",
      background: "#f0ece4",
    }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(110%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .leaflet-container { background: #f0ece4 !important; }
        .mBtn:active { transform: scale(0.91); }
        .area-poly { cursor: pointer; transition: fill-opacity 0.2s; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "white",
        boxShadow: "0 1px 0 rgba(0,0,0,0.07)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button className="mBtn" onClick={() => navigate(-1)} style={{
          background: "#F3F4F6", border: "none", borderRadius: 12,
          width: 38, height: 38, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>
            בחר אזור משלוח
          </div>
          <div style={{
            fontSize: 11, marginTop: 1, fontWeight: selected ? 800 : 400,
            color: selected ? C.red : C.gray,
            transition: "color 0.25s",
          }}>
            {selected ? `✓ ${selected.name} נבחר` : "לחץ על האזור שלך במפה"}
          </div>
        </div>

        <div style={{ width: 38 }} />
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{
        position: "absolute",
        top: 62, left: 0, right: 0,
        bottom: selected ? 162 : 80,
        transition: "bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)",
      }} />

      {/* ── Loading ── */}
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 600,
          background: "white",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "3px solid rgba(200,16,46,0.15)",
            borderTopColor: C.red,
            animation: "spin 0.8s linear infinite",
          }} />
          <div style={{ color: C.gray, fontSize: 13 }}>טוען מפה...</div>
        </div>
      )}

      {/* ── Zoom ── */}
      <div style={{
        position: "absolute", left: 12, top: "50%",
        transform: "translateY(-50%)", zIndex: 900,
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {[["+", 1], ["-", -1]].map(([l, d]) => (
          <button key={l} className="mBtn"
            onClick={() => leafRef.current?.setZoom(
              (leafRef.current.getZoom() || 11) + d
            )}
            style={{
              background: "white", border: "1px solid #E5E7EB",
              borderRadius: 10, width: 36, height: 36,
              color: C.dark, fontSize: 18, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Selected card ── */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 80, left: 0, right: 0, zIndex: 1000,
          background: "white", borderRadius: "22px 22px 0 0",
          padding: "14px 20px 18px",
          boxShadow: "0 -6px 28px rgba(0,0,0,0.13)",
          animation: "slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1)",
        }}>
          {/* Handle */}
          <div style={{
            width: 36, height: 4, background: "#E5E7EB",
            borderRadius: 2, margin: "0 auto 14px",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            {/* Icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(200,16,46,0.07)",
              border: "1.5px solid rgba(200,16,46,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              {selected.emoji}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>
                {selected.name}
              </div>
              <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>
                ✓ אזור פעיל • משלוח זמין
              </div>
            </div>

            {/* Close */}
            <button className="mBtn" onClick={() => {
              if (labelRef.current && leafRef.current) {
                leafRef.current.removeLayer(labelRef.current);
                labelRef.current = null;
              }
              Object.values(polyRef.current).forEach(p =>
                p.setStyle({ fillOpacity: 0.13, weight: 2, opacity: 0.8 })
              );
              setSelected(null);
            }} style={{
              background: "#F3F4F6", border: "none", borderRadius: "50%",
              width: 30, height: 30, cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: C.gray,
            }}>✕</button>
          </div>

          <button className="mBtn" onClick={handleConfirm} style={{
            width: "100%",
            background: `linear-gradient(135deg, ${C.red}, #a00020)`,
            border: "none", borderRadius: 16, padding: "15px",
            color: "white", fontSize: 15, fontWeight: 900, cursor: "pointer",
            boxShadow: "0 4px 18px rgba(200,16,46,0.35)",
          }}>
            בחר {selected.name} ←
          </button>
        </div>
      )}

      {/* ── BottomNav ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 999 }}>
        <BottomNav cartCount={cartCount} />
      </div>
    </div>
  );
}

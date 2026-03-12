import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

const C = {
  red:    "#C8102E",
  dark:   "#111827",
  card:   "rgba(17,24,39,0.97)",
  border: "rgba(200,16,46,0.25)",
};

// ── North Israel bounds ───────────────────────────
const NORTH = { lat: 32.95, lng: 35.22, zoom: 11 };

// ── Custom dark map style via CartoDB ────────────
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

// ── SVG icons ────────────────────────────────────
const PIN_SVG = (color = "#C8102E", inner = "🍽️", size = 44) => `
  <div style="position:relative;width:${size}px;height:${size + 12}px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.35))">
    <div style="
      width:${size}px;height:${size}px;
      background:white;
      border:3px solid ${color};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.45}px;
      position:relative;z-index:1;
    ">${inner}</div>
    <div style="
      width:0;height:0;
      border-left:${size * 0.3}px solid transparent;
      border-right:${size * 0.3}px solid transparent;
      border-top:${size * 0.32}px solid ${color};
      margin:0 auto;margin-top:-2px;
    "></div>
  </div>
`;

const DRIVER_SVG = (status) => `
  <div style="
    background:${status === "delivering" ? C.red : "#16a34a"};
    border:2.5px solid white;
    border-radius:12px;
    width:40px;height:40px;
    display:flex;align-items:center;justify-content:center;
    font-size:22px;
    box-shadow:0 3px 12px rgba(0,0,0,0.4);
    ${status === "delivering" ? "animation:driverPulse 1.8s infinite;" : ""}
  ">🚗</div>
`;

export default function MapPage({ cartCount = 0 }) {
  const navigate    = useNavigate();
  const mapRef      = useRef(null);
  const leafRef     = useRef(null);
  const markersRef  = useRef([]);
  const [ready,     setReady]     = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [restaurants, setRests]   = useState([]);
  const [stats,     setStats]     = useState({ rests: 0, drivers: 3, areas: 5 });

  // ── Fake drivers (realtime later) ────────────────
  const [drivers] = useState([
    { id: "d1", name: "Ahmad",   lat: 32.960, lng: 35.380, status: "delivering" },
    { id: "d2", name: "Yosef",   lat: 32.935, lng: 35.290, status: "available"  },
    { id: "d3", name: "Mohammed",lat: 32.910, lng: 35.310, status: "delivering" },
  ]);

  // ── Load Leaflet ─────────────────────────────────
  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const link = Object.assign(document.createElement("link"), {
      rel: "stylesheet",
      href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
    });
    document.head.appendChild(link);
    const script = Object.assign(document.createElement("script"), {
      src: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
      onload: () => setReady(true),
    });
    document.head.appendChild(script);
  }, []);

  // ── Fetch restaurants from Supabase ──────────────
  useEffect(() => {
    supabase
      .from("stores")
      .select("id,name,emoji,latitude,longitude,is_open,page_type,category")
      .not("latitude", "is", null)
      .then(({ data }) => {
        if (data?.length) {
          setRests(data);
          setStats(s => ({ ...s, rests: data.filter(r => r.is_open).length }));
        } else {
          // fallback demo data
          const demo = [
            { id:1, name:"פיצה ראמה",       emoji:"🍕", latitude:32.9410, longitude:35.3750, is_open:true,  page_type:"restaurant" },
            { id:2, name:"שווארמה הגליל",    emoji:"🥙", latitude:32.9300, longitude:35.3680, is_open:true,  page_type:"restaurant" },
            { id:3, name:"בורגר נהריה",      emoji:"🍔", latitude:33.0060, longitude:35.0930, is_open:true,  page_type:"restaurant" },
            { id:4, name:"סושי עכו",         emoji:"🍱", latitude:32.9250, longitude:35.0780, is_open:false, page_type:"restaurant" },
            { id:5, name:"פלאפל כרמיאל",     emoji:"🧆", latitude:32.9120, longitude:35.2940, is_open:true,  page_type:"restaurant" },
            { id:6, name:"רמי לוי ראמה",     emoji:"🛒", latitude:32.9380, longitude:35.3720, is_open:true,  page_type:"market"     },
            { id:7, name:"סופר-פארם",        emoji:"💊", latitude:32.9260, longitude:35.0800, is_open:true,  page_type:"market"     },
          ];
          setRests(demo);
          setStats(s => ({ ...s, rests: demo.filter(r => r.is_open).length }));
        }
      });
  }, []);

  // ── Build map ────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [NORTH.lat, NORTH.lng],
      zoom:   NORTH.zoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);

    // subtle attribution
    L.control.attribution({ prefix: false, position: "bottomleft" })
      .addText('<span style="font-size:9px;opacity:0.4">© OpenStreetMap</span>')
      .addTo(map);

    leafRef.current = map;

    return () => { map.remove(); leafRef.current = null; };
  }, [ready]);

  // ── Draw markers ─────────────────────────────────
  const drawMarkers = useCallback(() => {
    const L   = window.L;
    const map = leafRef.current;
    if (!L || !map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const mk = (html, size, anchor) => L.divIcon({
      html, className: "", iconSize: [size, size + 12], iconAnchor: anchor || [size / 2, size + 12],
    });

    // ── Active delivery zone (polygon) ───────────
    if (filter === "all" || filter === "areas") {
      const zone = L.polygon([
        [33.05, 35.05], [33.05, 35.45],
        [32.85, 35.45], [32.85, 35.05],
      ], {
        color: C.red, weight: 2, opacity: 0.6,
        fillColor: C.red, fillOpacity: 0.06,
        dashArray: "6,5",
      }).addTo(map);
      markersRef.current.push(zone);

      // Area label
      const lbl = L.marker([33.06, 35.25], {
        icon: L.divIcon({
          html: `<div style="background:${C.red};color:white;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:900;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">📍 אזור צפון — פעיל</div>`,
          className: "", iconAnchor: [60, 16],
        }),
      }).addTo(map);
      markersRef.current.push(lbl);
    }

    // ── Restaurants / Market ─────────────────────
    if (filter === "all" || filter === "restaurants") {
      restaurants.forEach(r => {
        if (!r.latitude) return;
        const color = r.is_open ? C.red : "#6b7280";
        const icon  = mk(PIN_SVG(color, r.emoji || "🍽️", 44), 44);
        const m = L.marker([r.latitude, r.longitude], { icon })
          .addTo(map)
          .on("click", () => setSelected({ type: r.page_type || "restaurant", ...r }));
        markersRef.current.push(m);
      });
    }

    // ── Drivers ──────────────────────────────────
    if (filter === "all" || filter === "drivers") {
      drivers.forEach(d => {
        const icon = L.divIcon({
          html: DRIVER_SVG(d.status),
          className: "", iconSize: [40, 40], iconAnchor: [20, 20],
        });
        const m = L.marker([d.lat, d.lng], { icon })
          .addTo(map)
          .on("click", () => setSelected({ type: "driver", ...d }));
        markersRef.current.push(m);
      });

      // ── Delivery route line ───────────────────
      if (restaurants[0] && drivers[0]) {
        const line = L.polyline([
          [drivers[0].lat, drivers[0].lng],
          [restaurants[0].latitude || 32.941, restaurants[0].longitude || 35.375],
        ], {
          color: C.red, weight: 3, opacity: 0.7, dashArray: "10,7",
        }).addTo(map);
        markersRef.current.push(line);
      }
    }
  }, [ready, filter, restaurants, drivers]);

  useEffect(() => {
    if (leafRef.current) drawMarkers();
  }, [drawMarkers]);

  // ── Animate drivers every 4s ─────────────────────
  useEffect(() => {
    if (!ready) return;
    const iv = setInterval(drawMarkers, 4000);
    return () => clearInterval(iv);
  }, [drawMarkers, ready]);

  const FILTERS = [
    { key: "all",         label: "הכל",     emoji: "🗺️" },
    { key: "restaurants", label: "חנויות",  emoji: "🍽️" },
    { key: "drivers",     label: "נהגים",   emoji: "🚗" },
    { key: "areas",       label: "אזורים",  emoji: "📍" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:C.dark, fontFamily:"Arial,sans-serif", direction:"rtl", zIndex:10 }}>

      <style>{`
        @keyframes driverPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(200,16,46,0.6); }
          60%      { box-shadow:0 0 0 10px rgba(200,16,46,0); }
        }
        .leaflet-container { background:#e8e0d8 !important; }
        .ymap-btn:active   { transform:scale(0.9) !important; }
        .ymap-flt:active   { transform:scale(0.93) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:1000,
        padding:"12px 16px 10px",
        background:"linear-gradient(180deg,rgba(17,24,39,0.96) 0%,rgba(17,24,39,0) 100%)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>

          {/* Back */}
          <button className="ymap-btn" onClick={() => navigate(-1)} style={{
            background:"rgba(255,255,255,0.1)", border:"none",
            borderRadius:12, width:40, height:40, color:"white",
            fontSize:18, cursor:"pointer", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>←</button>

          {/* Title */}
          <div style={{ flex:1 }}>
            <div style={{ color:"white", fontSize:16, fontWeight:900 }}>מפת YOUGO</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>אזור צפון ישראל</div>
          </div>

          {/* Live badge */}
          <div style={{
            background:"rgba(22,163,74,0.15)", border:"1px solid rgba(22,163,74,0.4)",
            borderRadius:20, padding:"4px 10px",
            display:"flex", alignItems:"center", gap:5,
          }}>
            <div style={{
              width:7, height:7, borderRadius:"50%", background:"#16a34a",
              animation:"driverPulse 2s infinite",
            }}/>
            <span style={{ color:"#4ade80", fontSize:11, fontWeight:800 }}>Live</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          {[
            { v: stats.rests,   l: "חנויות",   c: "#f59e0b" },
            { v: stats.drivers, l: "נהגים",    c: "#4ade80" },
            { v: stats.areas,   l: "ערים",     c: C.red     },
          ].map(s => (
            <div key={s.l} style={{
              flex:1, background:"rgba(255,255,255,0.07)",
              border:`1px solid ${s.c}22`,
              borderRadius:12, padding:"8px 4px", textAlign:"center",
            }}>
              <div style={{ color:s.c, fontSize:18, fontWeight:900 }}>{s.v}</div>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{ width:"100%", height:"100%" }} />

      {/* ── Loading ── */}
      {!ready && (
        <div style={{
          position:"absolute", inset:0, zIndex:500,
          background:C.dark, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:14,
        }}>
          <div style={{
            width:48, height:48, borderRadius:"50%",
            border:`3px solid rgba(200,16,46,0.2)`,
            borderTopColor:C.red,
            animation:"spin 0.8s linear infinite",
          }}/>
          <div style={{ color:"white", fontSize:14, fontWeight:700 }}>טוען מפת Yougo...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── Zoom ── */}
      <div style={{
        position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
        zIndex:1000, display:"flex", flexDirection:"column", gap:6,
      }}>
        {[["＋", 1], ["－", -1]].map(([lbl, dir]) => (
          <button key={lbl} className="ymap-btn"
            onClick={() => leafRef.current?.setZoom((leafRef.current.getZoom() || 11) + dir)}
            style={{
              background:"rgba(17,24,39,0.92)", border:`1px solid rgba(200,16,46,0.25)`,
              borderRadius:12, width:40, height:40, color:"white",
              fontSize:18, fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 16px rgba(0,0,0,0.4)",
            }}>{lbl}</button>
        ))}

        {/* My location */}
        <button className="ymap-btn"
          onClick={() => {
            navigator.geolocation?.getCurrentPosition(p => {
              leafRef.current?.setView([p.coords.latitude, p.coords.longitude], 14);
            });
          }}
          style={{
            background:C.red, border:"none",
            borderRadius:12, width:40, height:40, color:"white",
            fontSize:16, cursor:"pointer", marginTop:4,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 16px rgba(200,16,46,0.4)",
          }}>📍</button>
      </div>

      {/* ── Filters ── */}
      <div style={{
        position:"absolute",
        bottom: selected ? 230 : 90,
        left:"50%", transform:"translateX(-50%)",
        zIndex:1000, display:"flex", gap:7,
        transition:"bottom 0.3s cubic-bezier(0.34,1.2,0.64,1)",
      }}>
        {FILTERS.map(f => (
          <button key={f.key} className="ymap-flt"
            onClick={() => setFilter(f.key)}
            style={{
              background: filter === f.key ? C.red : "rgba(17,24,39,0.92)",
              border:`1px solid ${filter === f.key ? C.red : "rgba(255,255,255,0.12)"}`,
              borderRadius:20, padding:"7px 13px",
              color:"white", fontSize:11, fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap",
              boxShadow:"0 4px 16px rgba(0,0,0,0.35)",
              transition:"all 0.2s ease",
            }}>
            <span>{f.emoji}</span> {f.label}
          </button>
        ))}
      </div>

      {/* ── Bottom Info Card ── */}
      {selected && (
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, zIndex:1000,
          background:C.card, borderRadius:"24px 24px 0 0",
          padding:"16px 20px 40px",
          border:`1px solid ${C.border}`,
          boxShadow:"0 -8px 40px rgba(0,0,0,0.6)",
          animation:"sheetUp 0.3s cubic-bezier(0.34,1.2,0.64,1)",
        }}>
          <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

          {/* Handle */}
          <div style={{ width:36, height:4, background:"rgba(255,255,255,0.15)", borderRadius:2, margin:"0 auto 14px" }}/>

          {/* Close */}
          <button onClick={() => setSelected(null)} style={{
            position:"absolute", top:14, left:16,
            background:"rgba(255,255,255,0.08)", border:"none",
            borderRadius:"50%", width:32, height:32, color:"white",
            fontSize:16, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>✕</button>

          {/* Restaurant / Market card */}
          {(selected.type === "restaurant" || selected.type === "market") && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:6 }}>{selected.emoji || "🍽️"}</div>
              <div style={{ color:"white", fontSize:18, fontWeight:900 }}>{selected.name}</div>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:6, marginTop:8,
                background: selected.is_open ? "rgba(22,163,74,0.15)" : "rgba(100,100,100,0.15)",
                border:`1px solid ${selected.is_open ? "rgba(22,163,74,0.3)" : "rgba(100,100,100,0.3)"}`,
                borderRadius:20, padding:"4px 14px",
                color: selected.is_open ? "#4ade80" : "#9ca3af",
                fontSize:12, fontWeight:700,
              }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"currentColor" }}/>
                {selected.is_open ? "פתוח עכשיו" : "סגור"}
              </div>
              {selected.is_open && (
                <button
                  onClick={() => navigate(selected.type === "market" ? "/market" : `/${selected.type}/${selected.id}`)}
                  style={{
                    marginTop:16, width:"100%",
                    background:`linear-gradient(135deg,${C.red},#a00020)`,
                    border:"none", borderRadius:16, padding:"14px",
                    color:"white", fontSize:15, fontWeight:900, cursor:"pointer",
                    boxShadow:"0 4px 16px rgba(200,16,46,0.4)",
                  }}>
                  📦 הזמן עכשיו
                </button>
              )}
            </div>
          )}

          {/* Driver card */}
          {selected.type === "driver" && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:6 }}>🚗</div>
              <div style={{ color:"white", fontSize:18, fontWeight:900 }}>{selected.name}</div>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:6, marginTop:8,
                background: selected.status === "delivering" ? "rgba(200,16,46,0.15)" : "rgba(22,163,74,0.15)",
                borderRadius:20, padding:"4px 14px",
                color: selected.status === "delivering" ? "#f87171" : "#4ade80",
                fontSize:12, fontWeight:700,
              }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"currentColor" }}/>
                {selected.status === "delivering" ? "⚡ בדרך לאספקה" : "✅ פנוי"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

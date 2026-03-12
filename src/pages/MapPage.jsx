import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const C = { red: "#C8102E", dark: "#111827" };

export default function MapPage({ cartCount = 0 }) {
  const navigate   = useNavigate();
  const mapRef     = useRef(null);
  const leafRef    = useRef(null);
  const [ready,    setReady]    = useState(false);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [stores,   setStores]   = useState([]);

  // ── Load Leaflet CSS + JS ──────────────────────
  useEffect(() => {
    try {
      if (window.L) { setReady(true); return; }

      const css = document.createElement("link");
      css.rel  = "stylesheet";
      css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(css);

      const js = document.createElement("script");
      js.src   = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      js.onload = () => setReady(true);
      js.onerror = () => setError("Failed to load map library");
      document.head.appendChild(js);
    } catch(e) {
      setError(e.message);
    }
  }, []);

  // ── Fetch stores ──────────────────────────────
  useEffect(() => {
    supabase
      .from("stores")
      .select("id,name,emoji,latitude,longitude,is_open,page_type")
      .not("latitude", "is", null)
      .then(({ data, error: err }) => {
        if (err || !data?.length) {
          setStores([
            { id:1, name:"פיצה ראמה",    emoji:"🍕", latitude:32.941, longitude:35.375, is_open:true,  page_type:"restaurant" },
            { id:2, name:"שווארמה גליל",  emoji:"🥙", latitude:32.930, longitude:35.368, is_open:true,  page_type:"restaurant" },
            { id:3, name:"רמי לוי ראמה", emoji:"🛒", latitude:32.938, longitude:35.372, is_open:true,  page_type:"market"     },
            { id:4, name:"בורגר נהריה",  emoji:"🍔", latitude:33.006, longitude:35.093, is_open:true,  page_type:"restaurant" },
            { id:5, name:"סושי עכו",     emoji:"🍱", latitude:32.925, longitude:35.078, is_open:false, page_type:"restaurant" },
          ]);
        } else {
          setStores(data);
        }
      });
  }, []);

  // ── Init map ──────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    try {
      const L   = window.L;
      const map = L.map(mapRef.current, {
        center: [32.93, 35.22],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      leafRef.current = map;
    } catch(e) {
      setError(e.message);
    }

    return () => {
      if (leafRef.current) { leafRef.current.remove(); leafRef.current = null; }
    };
  }, [ready]);

  // ── Add markers when stores + map ready ───────
  useEffect(() => {
    if (!leafRef.current || !stores.length || !window.L) return;
    const L   = window.L;
    const map = leafRef.current;

    stores.forEach(s => {
      if (!s.latitude || !s.longitude) return;
      const icon = L.divIcon({
        html: `<div style="
          background:white;
          border:3px solid ${s.is_open ? C.red : "#9ca3af"};
          border-radius:50%;
          width:40px;height:40px;
          display:flex;align-items:center;justify-content:center;
          font-size:20px;
          box-shadow:0 3px 10px rgba(0,0,0,0.25);
        ">${s.emoji || "🍽️"}</div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([s.latitude, s.longitude], { icon })
        .addTo(map)
        .on("click", () => setSelected(s));
    });
  }, [stores, ready]);

  // ── Error state ───────────────────────────────
  if (error) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:C.dark, color:"white", gap:16, padding:20 }}>
      <div style={{ fontSize:40 }}>⚠️</div>
      <div style={{ fontSize:14, opacity:0.7, textAlign:"center" }}>{error}</div>
      <button onClick={() => navigate(-1)} style={{ background:C.red, border:"none", borderRadius:12, padding:"12px 24px", color:"white", fontWeight:700, cursor:"pointer" }}>
        חזור
      </button>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:C.dark, fontFamily:"Arial,sans-serif", direction:"rtl" }}>

      <style>{`
        .leaflet-container { background:#e8e0d8 !important; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:1000,
        background:"linear-gradient(180deg,rgba(17,24,39,0.95) 0%,transparent 100%)",
        padding:"14px 16px 28px",
        display:"flex", alignItems:"center", gap:10,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background:"rgba(255,255,255,0.1)", border:"none", borderRadius:12,
          width:40, height:40, color:"white", fontSize:18, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>←</button>
        <div>
          <div style={{ color:"white", fontSize:16, fontWeight:900 }}>מפת Yougo 🗺️</div>
          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>צפון ישראל • {stores.filter(s=>s.is_open).length} חנויות פתוחות</div>
        </div>
        <div style={{ marginRight:"auto", background:"rgba(22,163,74,0.15)", border:"1px solid rgba(22,163,74,0.4)", borderRadius:20, padding:"4px 10px", display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#16a34a" }}/>
          <span style={{ color:"#4ade80", fontSize:11, fontWeight:800 }}>Live</span>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ width:"100%", height:"100%" }} />

      {/* Loading */}
      {!ready && (
        <div style={{
          position:"absolute", inset:0, zIndex:500,
          background:C.dark, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:14,
        }}>
          <div style={{ width:48, height:48, borderRadius:"50%", border:`3px solid rgba(200,16,46,0.2)`, borderTopColor:C.red, animation:"spin 0.8s linear infinite" }}/>
          <div style={{ color:"white", fontSize:14, fontWeight:700 }}>טוען מפה...</div>
        </div>
      )}

      {/* Zoom */}
      <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", zIndex:1000, display:"flex", flexDirection:"column", gap:6 }}>
        {[["+",1],["-",-1]].map(([lbl,d]) => (
          <button key={lbl}
            onClick={() => leafRef.current?.setZoom((leafRef.current.getZoom()||11)+d)}
            style={{ background:"rgba(17,24,39,0.9)", border:"1px solid rgba(200,16,46,0.25)", borderRadius:12, width:40, height:40, color:"white", fontSize:18, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {lbl}
          </button>
        ))}
        <button
          onClick={() => navigator.geolocation?.getCurrentPosition(p => leafRef.current?.setView([p.coords.latitude, p.coords.longitude], 14))}
          style={{ background:C.red, border:"none", borderRadius:12, width:40, height:40, color:"white", fontSize:16, cursor:"pointer", marginTop:4, display:"flex", alignItems:"center", justifyContent:"center" }}>
          📍
        </button>
      </div>

      {/* Info card */}
      {selected && (
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, zIndex:1000,
          background:"rgba(17,24,39,0.97)", borderRadius:"24px 24px 0 0",
          padding:"16px 20px 40px",
          border:"1px solid rgba(200,16,46,0.25)",
          boxShadow:"0 -8px 40px rgba(0,0,0,0.6)",
        }}>
          <div style={{ width:36, height:4, background:"rgba(255,255,255,0.15)", borderRadius:2, margin:"0 auto 14px" }}/>
          <button onClick={() => setSelected(null)} style={{ position:"absolute", top:14, left:16, background:"rgba(255,255,255,0.08)", border:"none", borderRadius:"50%", width:32, height:32, color:"white", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:8 }}>{selected.emoji || "🍽️"}</div>
            <div style={{ color:"white", fontSize:18, fontWeight:900 }}>{selected.name}</div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:8, background: selected.is_open ? "rgba(22,163,74,0.15)" : "rgba(100,100,100,0.15)", borderRadius:20, padding:"4px 14px", color: selected.is_open ? "#4ade80" : "#9ca3af", fontSize:12, fontWeight:700 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"currentColor" }}/>
              {selected.is_open ? "פתוח עכשיו" : "סגור"}
            </div>
            {selected.is_open && (
              <button
                onClick={() => navigate(selected.page_type === "market" ? "/market" : `/restaurant/${selected.id}`)}
                style={{ marginTop:16, width:"100%", background:`linear-gradient(135deg,${C.red},#a00020)`, border:"none", borderRadius:16, padding:"14px", color:"white", fontSize:15, fontWeight:900, cursor:"pointer" }}>
                📦 הזמן עכשיו
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

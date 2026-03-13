/**
 * AddressPickerPage.jsx — Yougo v6
 *
 * Step 0: ZoneSelector — GPS / zone cards / saved locations
 * Step 1: MapPicker    — smooth Leaflet map with circle zones + אני כאן
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

/* ── Colors ── */
const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";
const BG   = "#F5F5F7";

/* ── Zones ── */
const ZONES = [
  {
    id: "east", short: "ראמה · מגאר · עראבה",
    nameHe: "ראמה, מגאר, עראבה, סחנין, שזור",
    cities: "ראמה, מגאר, עראבה, סחנין, שזור, דיר חנא",
    emoji: "🌿", accent: "#059669", light: "#D1FAE5",
    lat: 32.9078, lng: 35.3524, radius: 6500,
  },
  {
    id: "center", short: "כרמיאל · נחף · בעינה",
    nameHe: "כרמיאל, נחף, בעינה, מגד אל-כרום",
    cities: "כרמיאל, נחף, בעינה, דיר אל-אסד, מגד אל-כרום",
    emoji: "🏙️", accent: "#2563EB", light: "#DBEAFE",
    lat: 32.9178, lng: 35.2999, radius: 5000,
  },
  {
    id: "north", short: "פקיעין · חורפיש · כסרה",
    nameHe: "פקיעין, חורפיש, כסרה-סמיע",
    cities: "פקיעין, חורפיש, בית ג'ן, כסרה-סמיע",
    emoji: "⛰️", accent: "#7C3AED", light: "#EDE9FE",
    lat: 32.9873, lng: 35.3220, radius: 5500,
  },
];

const SAVED_KEY = "yougo_saved_locations";
const loadSaved  = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; } };
const saveSaved  = (l) => { try { localStorage.setItem(SAVED_KEY, JSON.stringify(l.slice(0, 3))); } catch {} };

function haversine(la1, lo1, la2, lo2) {
  const R = 6371000, φ1 = la1 * Math.PI / 180, φ2 = la2 * Math.PI / 180,
    Δφ = (la2 - la1) * Math.PI / 180, Δλ = (lo2 - lo1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const nearestZone = (la, lo) =>
  ZONES.reduce((b, z) => haversine(la, lo, z.lat, z.lng) < haversine(la, lo, b.lat, b.lng) ? z : b, ZONES[0]);

/* ══════════════════════════════════════════════
   SHARED CSS
══════════════════════════════════════════════ */
const CSS = `
  @keyframes addrSpin { to { transform: rotate(360deg); } }
  @keyframes addrUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes addrPop  { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  @keyframes addrPulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.5);opacity:0} }
  @keyframes addrSheet { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes circleIn  { from{stroke-dashoffset:2000;opacity:0} to{stroke-dashoffset:0;opacity:1} }
  @keyframes pinPop    { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }

  .ygbtn  { transition: transform .12s, box-shadow .12s; }
  .ygbtn:active { transform: scale(0.94) !important; }
  .ygcard { transition: transform .17s, box-shadow .17s, border-color .17s, background .17s; }
  .ygcard:active { transform: scale(0.97); }
`;

/* ══════════════════════════════════════════════
   ZONE SELECTOR  (Step 0)
══════════════════════════════════════════════ */
function ZoneSelector({ onFamilyMap, onSaveAndGo, cartCount = 0 }) {
  const [busy,   setBusy]   = useState(false);
  const [gpsErr, setGpsErr] = useState("");
  const [saved,  setSaved]  = useState(loadSaved);
  const [tap,    setTap]    = useState(null);

  function detectGPS() {
    setBusy(true); setGpsErr("");
    if (!navigator.geolocation) { setGpsErr("GPS אינו זמין בדפדפן זה"); setBusy(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: la, longitude: lo } }) => {
        setBusy(false);
        onSaveAndGo({ zone: nearestZone(la, lo), coords: { lat: la, lng: lo } });
      },
      (e) => {
        setBusy(false);
        setGpsErr(e.code === 1 ? "אפשר גישה למיקום בהגדרות הדפדפן" : "לא ניתן לאתר מיקום — בחר ידנית");
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
    );
  }

  function deleteSaved(idx) {
    const next = saved.filter((_, i) => i !== idx);
    saveSaved(next); setSaved(next);
  }

  function useSaved(s) {
    onSaveAndGo({ zone: s.zone, coords: s.coords });
  }

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      fontFamily: "system-ui,Arial,sans-serif", direction: "rtl",
      background: BG, maxWidth: 430, margin: "0 auto", zIndex: 300,
    }}>
      <style>{CSS}</style>

      {/* Hero header */}
      <div style={{
        background: `linear-gradient(158deg,${RED} 0%,#6B0716 100%)`,
        padding: "36px 22px 28px", position: "relative", overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{ position:"absolute",width:240,height:240,borderRadius:"50%",border:"1px solid rgba(255,255,255,.06)",top:-100,right:-80,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",width:160,height:160,borderRadius:"50%",border:"1px solid rgba(255,255,255,.05)",bottom:-60,left:-50,pointerEvents:"none" }}/>
        <div style={{ fontSize: 40, marginBottom: 10, lineHeight: 1, position: "relative" }}>🗺️</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "white", position: "relative" }}>בחר את האזור שלך</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", marginTop: 6, lineHeight: 1.55, position: "relative" }}>
          כדי להציג לך מסעדות ומשלוחים בסביבתך
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 100 }}>

        {/* GPS */}
        <div style={{ padding: "18px 16px 0" }}>
          <button className="ygbtn" onClick={detectGPS} disabled={busy} style={{
            width: "100%", border: "none", borderRadius: 18, padding: 0,
            background: busy ? "#F3F4F6" : `linear-gradient(135deg,${RED},#9B0B22)`,
            boxShadow: busy ? "none" : "0 6px 22px rgba(200,16,46,.36)",
            cursor: busy ? "default" : "pointer", overflow: "hidden",
            fontFamily: "inherit",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                background: busy ? "#E5E7EB" : "rgba(255,255,255,.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {busy
                  ? <div style={{ width:22,height:22,borderRadius:"50%",border:"2.5px solid #D1D5DB",borderTopColor:RED,animation:"addrSpin .75s linear infinite" }}/>
                  : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3" fill="white" stroke="none"/>
                      <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
                      <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
                      <circle cx="12" cy="12" r="8"/>
                    </svg>
                }
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontSize:15,fontWeight:900,color:busy?DARK:"white",lineHeight:1.2 }}>
                  {busy ? "מאתר מיקום..." : "זיהוי אוטומטי של המיקום שלי"}
                </div>
                <div style={{ fontSize:11,color:busy?GRAY:"rgba(255,255,255,.68)",marginTop:3 }}>
                  {busy ? "אנא המתן" : "GPS · מיידי · מעבר ישיר למסעדות"}
                </div>
              </div>
              {!busy && (
                <div style={{ width:28,height:28,borderRadius:9,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              )}
            </div>
          </button>

          {gpsErr && (
            <div style={{ marginTop:10,background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"10px 14px",display:"flex",gap:8,alignItems:"flex-start",animation:"addrUp .25s both" }}>
              <span style={{ fontSize:15,flexShrink:0 }}>⚠️</span>
              <span style={{ fontSize:12,color:"#DC2626",fontWeight:600,lineHeight:1.4 }}>{gpsErr}</span>
            </div>
          )}
        </div>

        {/* Family/Friend button */}
        <div style={{ padding: "10px 16px 0" }}>
          <button className="ygbtn" onClick={onFamilyMap} style={{
            width: "100%", border: `2px dashed #D1D5DB`, borderRadius: 16,
            padding: "13px 18px", background: "white", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 12,
            fontFamily: "inherit",
          }}>
            <div style={{ width:40,height:40,borderRadius:12,background:"rgba(200,16,46,.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>
              📍
            </div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontSize:14,fontWeight:800,color:DARK }}>הוסף מיקום של קרוב משפחה / חבר/ה / עבודה</div>
              <div style={{ fontSize:11,color:GRAY,marginTop:2 }}>בחר מיקום מדויק על המפה</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"18px 16px 10px" }}>
          <div style={{ flex:1,height:1,background:"#E5E7EB" }}/>
          <span style={{ fontSize:11,color:GRAY,fontWeight:700 }}>בחר אזור משלוח</span>
          <div style={{ flex:1,height:1,background:"#E5E7EB" }}/>
        </div>

        {/* Zone cards */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {ZONES.map((z, i) => (
            <button key={z.id} className="ygcard"
              onTouchStart={() => setTap(z.id)}
              onTouchEnd={() => { setTap(null); onSaveAndGo({ zone: z }); }}
              onClick={() => onSaveAndGo({ zone: z })}
              style={{
                width: "100%", border: `2px solid ${tap === z.id ? z.accent : "#E9EAEB"}`,
                borderRadius: 17, padding: "14px 15px", cursor: "pointer", textAlign: "right",
                fontFamily: "inherit", background: tap === z.id ? z.light : "white",
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: tap === z.id ? "0 8px 24px rgba(0,0,0,.09)" : "0 1px 4px rgba(0,0,0,.04)",
                animation: `addrUp .35s ${i * .08}s both`,
              }}>
              <div style={{ width:46,height:46,borderRadius:13,flexShrink:0,background:z.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>
                {z.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize:14,fontWeight:900,color:DARK,marginBottom:2 }}>{z.short}</div>
                <div style={{ fontSize:11,color:GRAY }}>{z.cities}</div>
              </div>
              <div style={{ width:28,height:28,borderRadius:9,background:tap===z.id?z.accent:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tap===z.id?"white":"#9CA3AF"} strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Saved locations */}
        {saved.length > 0 && (
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ fontSize:13,fontWeight:900,color:DARK,marginBottom:10 }}>📌 המיקומים השמורים שלי</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {saved.map((s, i) => (
                <div key={i} className="ygcard" style={{
                  display:"flex",alignItems:"center",gap:10,background:"white",
                  borderRadius:14,padding:"11px 14px",border:"1.5px solid #E9EAEB",
                  boxShadow:"0 1px 4px rgba(0,0,0,.04)",animation:`addrUp .3s ${i*.06}s both`,
                  cursor:"pointer",
                }} onClick={() => useSaved(s)}>
                  <div style={{ width:38,height:38,borderRadius:11,background:"rgba(200,16,46,.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0 }}>
                    {s.typeEmoji || "📍"}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:800,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {s.label || s.address || "מיקום שמור"}
                    </div>
                    <div style={{ fontSize:10,color:GRAY,marginTop:1 }}>{s.zoneName || ""}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteSaved(i); }} style={{ background:"none",border:"none",cursor:"pointer",color:"#D1D5DB",fontSize:16,padding:"0 4px",flexShrink:0 }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* spacer */}
        <div style={{ height: 20 }}/>
      </div>

      {/* BottomNav — fixed at bottom */}
      <div style={{ position:"absolute",bottom:0,left:0,right:0,zIndex:10,background:"white",borderTop:"1px solid #F0F0F0" }}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
/* ══════════════════════════════════════════════
   MAP PICKER  — Wolt-style
   • Fixed red pin at center (always visible)
   • Map moves underneath it
   • Zone circles locked → tap to unlock + highlight
   • אני כאן fixed bubble (live GPS position)
   • Smooth reverse geocode on drag end
   • Bottom sheet with full address form
══════════════════════════════════════════════ */
function MapPicker({ onBack, onSaved, cartCount = 0 }) {
  const mapEl    = useRef(null);
  const mapRef   = useRef(null);
  const circleRefs = useRef({});
  const markerRefs = useRef({});
  const userMarkRef = useRef(null);
  const initDone = useRef(false);
  const geoTimer = useRef(null);

  const [ready,     setReady]     = useState(false);
  const [selected,  setSelected]  = useState(null);   // active zone
  const [dragging,  setDragging]  = useState(false);
  const [pinPos,    setPinPos]    = useState({ lat: 32.945, lng: 35.325 });
  const [addrTxt,   setAddrTxt]   = useState("");
  const [addrBusy,  setAddrBusy]  = useState(false);
  const [outOfZone, setOutOfZone] = useState(false);  // soft error
  const [showForm,  setShowForm]  = useState(false);
  const [label,     setLabel]     = useState("");
  const [locType,   setLocType]   = useState("בית");
  const [saving,    setSaving]    = useState(false);
  const [myLocLat,  setMyLocLat]  = useState(null);
  const [myLocLng,  setMyLocLng]  = useState(null);

  /* ── Nearest zone to a point ── */
  function nearZone(la, lo) {
    let best = null, bestD = Infinity;
    ZONES.forEach(z => {
      const d = haversine(la, lo, z.lat, z.lng);
      if (d < bestD) { bestD = d; best = z; }
    });
    return { zone: best, dist: bestD };
  }

  function isInAnyZone(la, lo) {
    return ZONES.some(z => haversine(la, lo, z.lat, z.lng) <= z.radius * 1.05);
  }

  /* ── Load Leaflet ── */
  useEffect(() => {
    if (window.L) { initMap(); return; }
    if (!document.querySelector('link[href*="leaflet"]')) {
      const el = Object.assign(document.createElement("link"), {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
      });
      document.head.appendChild(el);
    }
    if (document.querySelector('script[src*="leaflet"]')) {
      const t = setInterval(() => { if (window.L) { clearInterval(t); initMap(); } }, 100);
      return () => clearInterval(t);
    }
    const s = Object.assign(document.createElement("script"), {
      src: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
      onload: () => initMap(),
    });
    document.head.appendChild(s);
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      initDone.current = false;
    };
  }, []);

  function initMap() {
    if (initDone.current || !mapEl.current) return;
    initDone.current = true;
    const L = window.L;

    const map = L.map(mapEl.current, {
      center: [32.945, 35.325], zoom: 12,
      zoomControl: false, attributionControl: false,
      minZoom: 10, maxZoom: 17,
      preferCanvas: true,
      fadeAnimation: true, zoomAnimation: true,
      tap: true, touchZoom: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, updateWhenIdle: false, updateWhenZooming: false, keepBuffer: 8,
    }).addTo(map);

    mapRef.current = map;

    /* Draw locked zone overlays */
    ZONES.forEach(zone => {
      /* Outer dark overlay (locked feel) */
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        color: RED,
        weight: 2.5,
        opacity: 0.5,
        fillColor: "#111827",
        fillOpacity: 0.22,
        dashArray: "8,5",
        interactive: true,
        className: "yg-zc",
      }).addTo(map);

      /* Zone label marker */
      const icon = L.divIcon({
        html: `<div id="yz-${zone.id}" style="
          display:flex;flex-direction:column;align-items:center;
          pointer-events:none;
        ">
          <div class="yz-bubble-${zone.id}" style="
            background:rgba(17,24,39,.75);
            backdrop-filter:blur(4px);
            color:white;font-family:system-ui,Arial,sans-serif;
            font-size:10px;font-weight:800;
            padding:5px 12px;border-radius:20px;
            box-shadow:0 3px 12px rgba(0,0,0,.3);
            border:1.5px solid rgba(255,255,255,.15);
            display:flex;align-items:center;gap:5px;
            white-space:nowrap;
            transition:all .25s cubic-bezier(.34,1.3,.64,1);
          ">
            <span style="font-size:14px">${zone.emoji}</span>
            <span class="yz-label-${zone.id}">${zone.short.split("·")[0].trim()}</span>
            <span style="font-size:9px;opacity:.6">🔒</span>
          </div>
          <div class="yz-tail-${zone.id}" style="
            width:0;height:0;
            border-left:5px solid transparent;border-right:5px solid transparent;
            border-top:8px solid rgba(17,24,39,.75);margin-top:-1px;
            transition:border-top-color .25s;
          "></div>
        </div>`,
        className: "",
        iconSize: [130, 38],
        iconAnchor: [65, 38],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon, interactive: true }).addTo(map);

      const doSelect = (e) => {
        if (e?.originalEvent) L.DomEvent.stopPropagation(e);
        activateZone(zone, map, L);
      };
      circle.on("click", doSelect);
      marker.on("click", doSelect);

      circleRefs.current[zone.id] = circle;
      markerRefs.current[zone.id] = marker;
    });

    /* Map drag events — update pin center */
    map.on("movestart", () => {
      setDragging(true);
      setOutOfZone(false);
    });

    map.on("move", () => {
      const c = map.getCenter();
      setPinPos({ lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6) });
    });

    map.on("moveend", () => {
      setDragging(false);
      const c = map.getCenter();
      const la = +c.lat.toFixed(6), lo = +c.lng.toFixed(6);
      setPinPos({ lat: la, lng: lo });

      /* Check if inside active zone */
      if (!isInAnyZone(la, lo)) {
        setOutOfZone(true);
        setAddrTxt("");
        return;
      }
      setOutOfZone(false);
      /* Auto-activate nearest zone */
      const { zone } = nearZone(la, lo);
      setSelected(zone);
      activateZoneStyle(zone.id);

      /* Reverse geocode with debounce */
      clearTimeout(geoTimer.current);
      geoTimer.current = setTimeout(() => reverseGeo(la, lo), 600);
    });

    setReady(true);

    /* GPS on load */
    navigator.geolocation?.getCurrentPosition(
      ({ coords: { latitude: la, longitude: lo } }) => {
        placeMyLoc(la, lo, L, map);
        setMyLocLat(la); setMyLocLng(lo);
        map.flyTo([la, lo], 14, { animate: true, duration: 0.8 });
        const { zone } = nearZone(la, lo);
        if (zone) {
          setSelected(zone);
          activateZoneStyle(zone.id);
          reverseGeo(la, lo);
        }
      },
      () => {}
    );
  }

  /* Activate zone — visual only (no flyTo = smoother) */
  function activateZone(zone, map, L) {
    /* Fly to zone center */
    map.flyTo([zone.lat, zone.lng], 14, { animate: true, duration: 0.45, easeLinearity: 0.9 });
    setSelected(zone);
    activateZoneStyle(zone.id);
    reverseGeo(zone.lat, zone.lng);
    setOutOfZone(false);
  }

  function activateZoneStyle(activeId) {
    ZONES.forEach(z => {
      const circle = circleRefs.current[z.id];
      const isActive = z.id === activeId;

      circle?.setStyle(isActive ? {
        fillColor: RED, fillOpacity: 0.12,
        color: RED, weight: 3, opacity: 0.9, dashArray: "",
      } : {
        fillColor: "#111827", fillOpacity: 0.22,
        color: RED, weight: 2.5, opacity: 0.5, dashArray: "8,5",
      });

      /* Update label bubble */
      const bubble = document.querySelector(`.yz-bubble-${z.id}`);
      const tail   = document.querySelector(`.yz-tail-${z.id}`);
      const label  = document.querySelector(`.yz-label-${z.id}`);
      const lock   = bubble?.querySelector("span:last-child");

      if (bubble) {
        bubble.style.background   = isActive ? RED : "rgba(17,24,39,.75)";
        bubble.style.border       = isActive ? `1.5px solid rgba(255,255,255,.3)` : "1.5px solid rgba(255,255,255,.15)";
        bubble.style.boxShadow    = isActive ? `0 4px 18px rgba(200,16,46,.45)` : "0 3px 12px rgba(0,0,0,.3)";
        bubble.style.transform    = isActive ? "scale(1.12)" : "scale(1)";
        if (lock) lock.textContent = isActive ? "✓" : "🔒";
      }
      if (tail) tail.style.borderTopColor = isActive ? RED : "rgba(17,24,39,.75)";
    });
  }

  /* Place "אני כאן" blue dot (GPS) */
  function placeMyLoc(la, lo, L, map) {
    userMarkRef.current?.remove();
    const icon = L.divIcon({
      className: "",
      html: `<div style="
        display:flex;flex-direction:column;align-items:center;
        pointer-events:none;animation:addrPop .4s cubic-bezier(.34,1.5,.64,1) both;
      ">
        <div style="
          background:${RED};color:white;
          font-family:system-ui,Arial,sans-serif;
          font-size:11px;font-weight:800;
          padding:5px 13px;border-radius:22px;
          box-shadow:0 3px 14px rgba(200,16,46,.45);
          border:2px solid rgba(255,255,255,.55);
          display:flex;align-items:center;gap:5px;white-space:nowrap;
        "><span style="font-size:13px">🧭</span>אני כאן</div>
        <div style="
          width:0;height:0;
          border-left:6px solid transparent;border-right:6px solid transparent;
          border-top:9px solid ${RED};margin-top:-1px;
        "></div>
        <div style="
          position:relative;width:14px;height:14px;border-radius:50%;
          background:#3B82F6;border:2.5px solid white;
          box-shadow:0 2px 8px rgba(59,130,246,.55);margin-top:2px;
        ">
          <div style="
            position:absolute;inset:-6px;border-radius:50%;
            background:rgba(59,130,246,.18);
            animation:addrPulse 2s ease-out infinite;
          "></div>
        </div>
      </div>`,
      iconSize: [100, 68],
      iconAnchor: [50, 68],
    });
    userMarkRef.current = window.L?.marker([la, lo], {
      icon, zIndexOffset: 800, interactive: false,
    }).addTo(map);
  }

  function goMyLoc() {
    if (!mapRef.current) return;
    if (myLocLat && myLocLng) {
      mapRef.current.flyTo([myLocLat, myLocLng], 15, { animate: true, duration: 0.6 });
      return;
    }
    navigator.geolocation?.getCurrentPosition(({ coords: { latitude: la, longitude: lo } }) => {
      if (window.L && mapRef.current) placeMyLoc(la, lo, window.L, mapRef.current);
      mapRef.current.flyTo([la, lo], 15, { animate: true, duration: 0.6 });
      setMyLocLat(la); setMyLocLng(lo);
    });
  }

  async function reverseGeo(la, lo) {
    setAddrBusy(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json`,
        { headers: { "Accept-Language": "he" } }
      );
      const j = await r.json(), a = j.address || {};
      const road = a.road || a.pedestrian || a.neighbourhood || a.suburb || "";
      const city = a.city || a.town || a.village || "";
      const num  = a.house_number || "";
      const full = [road + (num ? " " + num : ""), city].filter(Boolean).join(", ")
        || j.display_name?.split(",").slice(0, 2).join(", ")
        || "מיקום נבחר";
      setAddrTxt(full);
    } catch { setAddrTxt("מיקום נבחר"); }
    setAddrBusy(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    await new Promise(ok => setTimeout(ok, 350));
    const typeEmoji = { "בית":"🏠","חבר":"👥","עבודה":"💼","משרד":"🏢","מיקום אחר":"📍" }[locType] || "📍";
    const entry = {
      label: label || locType,
      typeEmoji,
      address: addrTxt,
      zoneName: selected.short,
      zone: selected,
      coords: { lat: pinPos.lat, lng: pinPos.lng },
    };
    const prev = loadSaved();
    saveSaved([entry, ...prev]);
    onSaved?.(entry);
    setSaving(false);
  }

  const SHEET_H = showForm ? 370 : (selected ? 100 : 0);

  return (
    <div style={{
      position:"fixed",inset:0,display:"flex",flexDirection:"column",
      fontFamily:"system-ui,Arial,sans-serif",direction:"rtl",
      background:"#ede8df",maxWidth:430,margin:"0 auto",zIndex:300,
    }}>
      <style>{CSS}</style>
      <style>{`
        .yg-zc { cursor: pointer !important; }
        .leaflet-container { background: #f0ece4 !important; }
        .leaflet-tile { transition: opacity .2s; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        flexShrink:0,background:"white",
        padding:"10px 16px",borderBottom:"1px solid #F0F0F0",
        display:"flex",alignItems:"center",gap:12,zIndex:20,
      }}>
        <button onClick={onBack} style={{
          width:38,height:38,borderRadius:12,background:"#F3F4F6",
          border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke={DARK} strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex:1,textAlign:"center" }}>
          <div style={{ fontSize:15,fontWeight:900,color:DARK }}>בחר מיקום על המפה</div>
          <div style={{
            fontSize:10,
            color: outOfZone ? "#EF4444" : (selected ? "#16A34A" : GRAY),
            fontWeight:700,marginTop:1,transition:"color .25s",
          }}>
            {outOfZone
              ? "⚠️ אזור זה עדיין לא בשירות שלנו"
              : selected ? `✓ ${selected.short}` : "לחץ על אזור משלוח כדי לבחור"}
          </div>
        </div>
        <div style={{ width:38 }}/>
      </div>

      {/* ── Map area ── */}
      <div style={{ flex:1,position:"relative",overflow:"hidden" }}>
        <div ref={mapEl} style={{ position:"absolute",inset:0 }}/>

        {/* Loading overlay */}
        {!ready && (
          <div style={{
            position:"absolute",inset:0,background:"rgba(255,255,255,.92)",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:12,zIndex:20,
          }}>
            <div style={{
              width:42,height:42,borderRadius:"50%",
              border:"3px solid rgba(200,16,46,.15)",borderTopColor:RED,
              animation:"addrSpin .8s linear infinite",
            }}/>
            <span style={{ color:GRAY,fontSize:13,fontWeight:600 }}>טוען מפה...</span>
          </div>
        )}

        {/* ── Fixed center PIN (always visible, Wolt-style) ── */}
        {ready && (
          <div style={{
            position:"absolute",
            top:`calc(50% - ${SHEET_H/2}px)`,
            left:"50%",
            transform:"translate(-50%,-100%)",
            zIndex:15,pointerEvents:"none",
            transition:"top .3s ease",
          }}>
            {/* Pin shadow on map */}
            <div style={{
              position:"absolute",bottom:-4,left:"50%",
              transform:`translateX(-50%) scale(${dragging?1.4:1})`,
              width:18,height:6,borderRadius:"50%",
              background:"rgba(0,0,0,.2)",
              filter:"blur(3px)",
              transition:"transform .15s ease",
            }}/>
            {/* Pin body */}
            <svg width="36" height="44" viewBox="0 0 36 44" style={{
              filter:`drop-shadow(0 4px 12px rgba(200,16,46,.45))`,
              transform:dragging?"translateY(-6px) scale(1.08)":"translateY(0) scale(1)",
              transition:"transform .15s cubic-bezier(.34,1.3,.64,1)",
            }}>
              <path d="M18 0C8.06 0 0 8.06 0 18c0 12.75 18 26 18 26S36 30.75 36 18C36 8.06 27.94 0 18 0z" fill={RED}/>
              <circle cx="18" cy="18" r="7" fill="white"/>
              <circle cx="18" cy="18" r="4" fill={RED}/>
            </svg>
          </div>
        )}

        {/* ── Address bubble above pin ── */}
        {ready && (
          <div style={{
            position:"absolute",
            top:`calc(50% - ${SHEET_H/2}px - 64px)`,
            left:"50%",
            transform:"translateX(-50%)",
            zIndex:16,pointerEvents:"none",
            transition:"top .3s ease, opacity .2s",
            opacity: selected ? 1 : 0,
          }}>
            <div style={{
              background:"white",
              border:`1.5px solid ${outOfZone?"#FCA5A5":"rgba(200,16,46,.2)"}`,
              borderRadius:20,
              padding:"6px 14px",
              fontSize:11,fontWeight:800,color:outOfZone?"#EF4444":DARK,
              boxShadow:"0 4px 16px rgba(0,0,0,.12)",
              maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
              display:"flex",alignItems:"center",gap:6,
              transform: dragging ? "scale(.95)" : "scale(1)",
              transition:"transform .15s ease",
            }}>
              {outOfZone
                ? <><span>🚫</span><span>מחוץ לאזור השירות</span></>
                : addrBusy
                  ? <><div style={{ width:10,height:10,borderRadius:"50%",border:"2px solid #D1D5DB",borderTopColor:RED,animation:"addrSpin .7s linear infinite" }}/><span>מחפש כתובת...</span></>
                  : <><span style={{ fontSize:13 }}>📍</span><span>{addrTxt || "גרור למיקום המדויק"}</span></>
              }
            </div>
            {/* bubble tail */}
            <div style={{
              width:0,height:0,margin:"0 auto",
              borderLeft:"5px solid transparent",borderRight:"5px solid transparent",
              borderTop:`7px solid ${outOfZone?"#FCA5A5":"rgba(200,16,46,.2)"}`,
            }}/>
          </div>
        )}

        {/* Out-of-zone soft error banner */}
        {outOfZone && ready && (
          <div style={{
            position:"absolute",bottom:SHEET_H+12,left:16,right:16,zIndex:16,
            background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:16,
            padding:"12px 16px",
            display:"flex",alignItems:"center",gap:10,
            boxShadow:"0 4px 16px rgba(239,68,68,.15)",
            animation:"addrUp .3s both",
          }}>
            <span style={{ fontSize:22,flexShrink:0 }}>🗺️</span>
            <div>
              <div style={{ fontSize:13,fontWeight:800,color:"#991B1B" }}>אזור זה עדיין לא בשירות</div>
              <div style={{ fontSize:11,color:"#DC2626",marginTop:2 }}>חזור לאחת מהמנות המסומנות על המפה</div>
            </div>
          </div>
        )}

        {/* ── GPS FAB ── */}
        <button onClick={goMyLoc} style={{
          position:"absolute",right:14,bottom:SHEET_H+16,zIndex:10,
          width:44,height:44,background:"white",border:"none",borderRadius:"50%",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 4px 16px rgba(0,0,0,.18)",transition:"bottom .3s ease",
        }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke={RED} strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" fill={RED} stroke="none"/>
            <line x1="12" y1="2" x2="12" y2="5"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="5" y2="12"/>
            <line x1="19" y1="12" x2="22" y2="12"/>
            <circle cx="12" cy="12" r="8"/>
          </svg>
        </button>

        {/* ── Zoom buttons ── */}
        <div style={{
          position:"absolute",left:14,bottom:SHEET_H+16,zIndex:10,
          display:"flex",flexDirection:"column",gap:6,
          transition:"bottom .3s ease",
        }}>
          {[["+",1],["-",-1]].map(([l,d]) => (
            <button key={l}
              onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom()||12)+d)}
              style={{
                width:38,height:38,background:"white",
                border:"1px solid rgba(0,0,0,.07)",borderRadius:10,
                fontSize:18,fontWeight:700,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 2px 8px rgba(0,0,0,.09)",color:DARK,
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── Bottom sheet ── */}
        {selected && (
          <div style={{
            position:"absolute",bottom:0,left:0,right:0,zIndex:18,
            height:SHEET_H,background:"white",
            borderRadius:"22px 22px 0 0",
            boxShadow:"0 -6px 32px rgba(0,0,0,.14)",
            transition:"height .32s cubic-bezier(.34,1.1,.64,1)",
            animation:"addrSheet .32s cubic-bezier(.34,1.1,.64,1)",
            overflow:"hidden",
          }}>
            {/* Handle */}
            <div style={{ padding:"10px 0 0",display:"flex",justifyContent:"center" }}>
              <div style={{ width:36,height:4,background:"#E5E7EB",borderRadius:2 }}/>
            </div>

            {!showForm ? (
              /* ── Collapsed row ── */
              <div style={{ padding:"8px 16px 14px",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{
                  width:44,height:44,borderRadius:12,flexShrink:0,
                  background:`rgba(200,16,46,.07)`,border:"1.5px solid rgba(200,16,46,.15)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,
                }}>
                  {selected.emoji}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:900,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                    {addrTxt || selected.short}
                  </div>
                  <div style={{ fontSize:11,color:"#16A34A",fontWeight:700,marginTop:2 }}>
                    ✓ {selected.short} • גרור לשינוי מיקום
                  </div>
                </div>
                <button className="ygbtn" onClick={() => setShowForm(true)}
                  style={{
                    background:`linear-gradient(135deg,${RED},#9B0B22)`,
                    border:"none",borderRadius:13,padding:"10px 18px",
                    color:"white",fontSize:13,fontWeight:900,
                    cursor:"pointer",fontFamily:"inherit",
                    boxShadow:"0 4px 14px rgba(200,16,46,.35)",
                    flexShrink:0,
                  }}>
                  אישור ←
                </button>
              </div>
            ) : (
              /* ── Expanded form ── */
              <div style={{ overflowY:"auto",height:"calc(100% - 24px)",padding:"0 16px 16px" }}>
                {/* Address info card */}
                <div style={{
                  background:"#F9FAFB",borderRadius:13,padding:"11px 14px",
                  marginBottom:11,border:"1.5px solid #E9EAEB",
                }}>
                  <div style={{ fontSize:10,color:GRAY,fontWeight:700,marginBottom:3 }}>אזור · כתובת נוכחית</div>
                  <div style={{ fontSize:13,fontWeight:800,color:DARK }}>{selected.short}</div>
                  {addrTxt && (
                    <div style={{ fontSize:12,color:GRAY,marginTop:2 }}>{addrTxt}</div>
                  )}
                </div>

                {/* Label */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>
                    שם המיקום <span style={{ opacity:.5 }}>(אופציונלי)</span>
                  </div>
                  <input
                    style={{
                      width:"100%",border:"1.5px solid #E5E7EB",borderRadius:11,
                      padding:"11px 13px",fontSize:14,outline:"none",
                      background:"white",textAlign:"right",fontFamily:"inherit",
                      boxSizing:"border-box",color:DARK,direction:"rtl",
                    }}
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="לדוגמה: בית של אמא / עבודה"
                    onFocus={e => { e.target.style.borderColor=RED; e.target.style.boxShadow=`0 0 0 3px rgba(200,16,46,.08)`; }}
                    onBlur={e => { e.target.style.borderColor="#E5E7EB"; e.target.style.boxShadow="none"; }}
                  />
                </div>

                {/* Type */}
                <div style={{ marginBottom:13 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:6 }}>סוג מיקום</div>
                  <div style={{ display:"flex",gap:7 }}>
                    {[{k:"בית",e:"🏠"},{k:"חבר",e:"👥"},{k:"עבודה",e:"💼"},{k:"מיקום אחר",e:"📍"}].map(t => (
                      <button key={t.k} onClick={() => setLocType(t.k)} style={{
                        flex:1,padding:"8px 2px",borderRadius:11,cursor:"pointer",
                        border:`2px solid ${locType===t.k?RED:"#E5E7EB"}`,
                        background:locType===t.k?"rgba(200,16,46,.06)":"white",
                        color:locType===t.k?RED:GRAY,
                        fontSize:9,fontWeight:700,
                        display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                        fontFamily:"inherit",transition:"all .15s",
                      }}>
                        <span style={{ fontSize:18 }}>{t.e}</span>{t.k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <button className="ygbtn" onClick={handleSave} disabled={saving} style={{
                  width:"100%",
                  background:saving?GRAY:`linear-gradient(135deg,${RED},#9B0B22)`,
                  border:"none",borderRadius:16,padding:"14px",
                  color:"white",fontSize:15,fontWeight:900,
                  cursor:saving?"default":"pointer",
                  boxShadow:saving?"none":"0 5px 20px rgba(200,16,46,.36)",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  fontFamily:"inherit",
                }}>
                  {saving
                    ? <><div style={{ width:18,height:18,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,.4)",borderTopColor:"white",animation:"addrSpin .7s linear infinite" }}/>שומר...</>
                    : "שמור מיקום ✓"
                  }
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════ */
export default function AddressPickerPage({ onAddressSave, initialZone, cartCount = 0 }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  function handleSaveAndGo({ zone, coords }) {
    const norm = {
      id: zone.id, short: zone.short, name: zone.nameHe,
      lat: zone.lat, lng: zone.lng, radius: zone.radius,
      coords: coords || { lat: zone.lat, lng: zone.lng },
    };
    onAddressSave?.(norm);
    navigate("/");
  }

  function handleMapSaved(entry) {
    onAddressSave?.({
      id: entry.zone.id, short: entry.zone.short, name: entry.zone.nameHe,
      lat: entry.zone.lat, lng: entry.zone.lng, radius: entry.zone.radius,
      coords: entry.coords,
    });
    navigate("/");
  }

  if (step === 1) {
    return (
      <MapPicker
        onBack={() => setStep(0)}
        onSaved={handleMapSaved}
        cartCount={cartCount}
      />
    );
  }

  return (
    <ZoneSelector
      onFamilyMap={() => setStep(1)}
      onSaveAndGo={handleSaveAndGo}
      cartCount={cartCount}
    />
  );
}

/**
 * AddressPickerPage.jsx — Yougo v6
 *
 * Step 0: ZoneSelector — GPS / zone cards / saved locations
 * Step 1: MapPicker    — smooth Leaflet map with circle zones + אני כאן
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { IcoNature, IcoCity, IcoMountain, IcoGPS, IcoPinSaved } from "../components/Icons";
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
    IconComp: IcoNature, accent: "#059669", light: "#D1FAE5",
    lat: 32.9078, lng: 35.3524, radius: 6500,
  },
  {
    id: "center", short: "כרמיאל · נחף · בעינה",
    nameHe: "כרמיאל, נחף, בעינה, מגד אל-כרום",
    cities: "כרמיאל, נחף, בעינה, דיר אל-אסד, מגד אל-כרום",
    IconComp: IcoCity, accent: "#2563EB", light: "#DBEAFE",
    lat: 32.9178, lng: 35.2999, radius: 5000,
  },
  {
    id: "north", short: "פקיעין · חורפיש · כסרה",
    nameHe: "פקיעין, חורפיש, כסרה-סמיע",
    cities: "פקיעין, חורפיש, בית ג'ן, כסרה-סמיע",
    IconComp: IcoMountain, accent: "#7C3AED", light: "#EDE9FE",
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
  ZONES_ACTIVE.reduce((b, z) => haversine(la, lo, z.lat, z.lng) < haversine(la, lo, b.lat, b.lng) ? z : b, ZONES[0]);

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
  /* ── Remove Leaflet ugly default divIcon white boxes ── */
  .leaflet-div-icon { background: none !important; border: none !important; }
  .leaflet-marker-icon { overflow: visible !important; }
  .leaflet-container a.leaflet-popup-close-button { display:none; }
`;

/* ══════════════════════════════════════════════
   ZONE SELECTOR  (Step 0)
══════════════════════════════════════════════ */
function ZoneSelector({ onFamilyMap, onSaveAndGo, zones: zonesOverride, cartCount = 0, user, onNeedLogin, onClose }) {
  const [busy,   setBusy]   = useState(false);
  const ZONES_ACTIVE = zonesOverride || ZONES;
  const [gpsErr, setGpsErr] = useState("");
  const [saved,  setSaved]  = useState(loadSaved);
  const [tap,    setTap]    = useState(null);

  const [gpsDone, setGpsDone] = useState(() => { try { return !!localStorage.getItem("yougo_area"); } catch { return false; } });

  function detectGPS() {
    setBusy(true); setGpsErr(""); setGpsDone(false);
    if (!navigator.geolocation) { setGpsErr("GPS אינו זמין בדפדפן זה"); setBusy(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: la, longitude: lo } }) => {
        const zone   = nearestZone(la, lo);
        const coords = { lat: la, lng: lo };
        /* ── Auto-save to localStorage immediately ── */
        const norm = {
          id: zone.id, short: zone.short, name: zone.nameHe,
          lat: zone.lat, lng: zone.lng, radius: zone.radius,
          coords,
        };
        try { localStorage.setItem("yougo_area", JSON.stringify(norm)); } catch {}
        setGpsDone(true);
        setBusy(false);
        setTimeout(() => onSaveAndGo({ zone, coords }), 1500);
      },
      (e) => {
        setBusy(false);
        setGpsErr(e.code === 1 ? "אפשר גישה למיקום בהגדרות הדפדפן" : "לא ניתן לאתר מיקום — בחר ידנית");
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
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
    <>
    {/* ── Backdrop ── */}
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(4px)", zIndex: 500,
    }} onClick={() => onClose?.()}/>

    {/* ── Bottom Sheet Modal ── */}
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      maxHeight: "88vh", overflowY: "auto",
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui,Arial,sans-serif", direction: "rtl",
      background: BG, zIndex: 501,
      borderRadius: "24px 24px 0 0",
      boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
      animation: "zoneUp .35s cubic-bezier(.34,1.1,.64,1)",
    }}>
    <style>{`@keyframes zoneUp{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}`}</style>
      <style>{CSS}</style>

      {/* Drag handle + compact header */}
      <div style={{ padding: "12px 20px 16px", flexShrink: 0, borderBottom: "1px solid #F0F0F0", position:"relative" }}>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:12 }}>
          <div style={{ width:38,height:4,borderRadius:2,background:"#D1D5DB" }}/>
        </div>
        {/* X close button */}
        <button onClick={()=>onClose?.()} style={{
          position:"absolute",top:14,left:16,
          width:32,height:32,borderRadius:"50%",
          background:"#F3F4F6",border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ fontSize:28 }}>🗺️</span>
          <div>
            <div style={{ fontSize:17,fontWeight:900,color:DARK }}>בחר את האזור שלך</div>
            <div style={{ fontSize:12,color:GRAY,marginTop:2 }}>כדי להציג לך מסעדות ומשלוחים בסביבתך</div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 100 }}>

        {/* GPS */}
        <div style={{ padding: "18px 16px 0" }}>
          <button className="ygbtn" onClick={detectGPS} disabled={busy} style={{
            width: "100%", border: "none", borderRadius: 18, padding: 0,
            background: gpsDone
              ? "linear-gradient(135deg,#16A34A,#14532D)"
              : busy
                ? "#F3F4F6"
                : `linear-gradient(135deg,${RED},#9B0B22)`,
            boxShadow: gpsDone
              ? "0 6px 22px rgba(22,163,74,.40)"
              : busy
                ? "none"
                : "0 6px 22px rgba(200,16,46,.36)",
            cursor: busy || gpsDone ? "default" : "pointer", overflow: "hidden",
            fontFamily: "inherit",
            transition: "background 0.5s ease, box-shadow 0.5s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                background: busy ? "#E5E7EB" : "rgba(255,255,255,.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {busy
                  ? <div style={{ width:22,height:22,borderRadius:"50%",border:"2.5px solid #D1D5DB",borderTopColor:RED,animation:"addrSpin .75s linear infinite" }}/>
                  : gpsDone
                    ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
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
                  {busy ? "מאתר מיקום..." : gpsDone ? "✅ מיקום נשמר — לחץ לעדכן" : "זיהוי אוטומטי של המיקום שלי"}
                </div>
                <div style={{ fontSize:11,color:busy?GRAY:"rgba(255,255,255,.75)",marginTop:3 }}>
                  {busy ? "אנא המתן" : gpsDone ? "לחץ לעדכן מיקום" : "GPS · מיידי · מעבר ישיר למסעדות"}
                </div>
              </div>
              {!busy && !gpsDone && (
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
          <button className="ygbtn" onClick={() => { if (!user?.id) { onNeedLogin?.(); return; } onFamilyMap(); }} style={{
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
          {ZONES_ACTIVE.map((z, i) => (
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
                {z.IconComp ? <z.IconComp s={32}/> : null}
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
        <div style={{ height: 24 }}/>
      </div>
    </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   MAP PICKER  — HAAT/Wolt style
══════════════════════════════════════════════ */
/* ══════════════════════════════════════════════
   MAP PICKER  — HAAT/Wolt style
   • Scrollable page: MAP on top, FORM below
   • Fixed red pin at center of map viewport
   • Map moves underneath pin
   • Zone pins at center of each zone (no label boxes)
   • Tap zone pin → circle draws, map zooms in
   • Max zoom out restricted (minZoom 11)
   • GPS → fly to exact location
   • Soft error banner if outside zones
   • אני כאן fixed bubble
══════════════════════════════════════════════ */
function MapPicker({ onBack, onSaved, cartCount = 0 }) {
  const mapEl     = useRef(null);
  const mapRef    = useRef(null);
  const circleRef = useRef(null);
  const pinRefs   = useRef({});
  const userMark  = useRef(null);
  const initDone  = useRef(false);
  const geoTimer  = useRef(null);
  const MAP_H     = 320; // fixed map height px

  const [ready,    setReady]    = useState(false);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [pinPos,   setPinPos]   = useState({ lat: 32.945, lng: 35.325 });
  const [addrLine1,setAddrLine1]= useState("");  // שם רחוב
  const [addrLine2,setAddrLine2]= useState("");  // עיר
  const [addrBusy, setAddrBusy] = useState(false);
  const [outOfZone,setOutOfZone]= useState(false);
  const [label,    setLabel]    = useState("");
  const [buildNum, setBuildNum] = useState("");
  const [floor,    setFloor]    = useState("");
  const [apt,      setApt]      = useState("");
  const [notes,    setNotes]    = useState("");
  const [locType,  setLocType]  = useState("בית");
  const [saving,   setSaving]   = useState(false);
  const [myLoc,    setMyLoc]    = useState(null);
  const [gpsErr,   setGpsErr]   = useState(false);

  /* ── Load Leaflet ── */
  useEffect(() => {
    if (window.L) { initMap(); return; }
    if (!document.querySelector('link[href*="leaflet"]')) {
      document.head.appendChild(Object.assign(document.createElement("link"), {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
      }));
    }
    if (document.querySelector('script[src*="leaflet"]')) {
      const t = setInterval(() => { if (window.L) { clearInterval(t); initMap(); } }, 80);
      return () => clearInterval(t);
    }
    document.head.appendChild(Object.assign(document.createElement("script"), {
      src: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
      onload: () => initMap(),
    }));
    return () => { mapRef.current?.remove(); mapRef.current = null; initDone.current = false; };
  }, []);

  function initMap() {
    if (initDone.current || !mapEl.current) return;
    initDone.current = true;
    const L = window.L;

    const map = L.map(mapEl.current, {
      center: [32.945, 35.325], zoom: 11,
      zoomControl: false, attributionControl: false,
      minZoom: 11,   // ← لا يقدر يزوم out أكتر
      maxZoom: 17,
      maxBounds: [[32.60, 34.90], [33.30, 35.80]],
      maxBoundsViscosity: 1.0,   // ← منع خروج كامل من الحدود
      preferCanvas: true,
      fadeAnimation: true, zoomAnimation: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, updateWhenIdle: false, updateWhenZooming: false, keepBuffer: 6,
    }).addTo(map);

    mapRef.current = map;

    /* ── Zone pins — clean dot style, no label box ── */
    ZONES.forEach(zone => {
      const icon = L.divIcon({
        html: `<div id="yp-${zone.id}" style="
            display:flex;flex-direction:column;align-items:center;
            cursor:pointer;
            animation:ypinPop .4s cubic-bezier(.34,1.4,.64,1);
          ">
          <div id="ypb-${zone.id}" style="
            width:46px;height:46px;border-radius:50%;
            background:white;border:3px solid ${RED};
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 3px 14px rgba(200,16,46,.35);
            transition:all .25s cubic-bezier(.34,1.3,.64,1);
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${RED}">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:9px solid ${RED};margin-top:-2px;opacity:.8"/>
        </div>`,
        className: "",
        iconSize: [46, 40],
        iconAnchor: [23, 40],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon, zIndexOffset: 100 }).addTo(map);
      marker.on("click", e => { L.DomEvent.stopPropagation(e); selectZone(zone, map, L); });
      pinRefs.current[zone.id] = marker;
    });

    map.on("click", () => deselect(map));

    map.on("movestart", () => setDragging(true));
    map.on("move", () => {
      const c = map.getCenter();
      setPinPos({ lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6) });
    });
    map.on("moveend", () => {
      setDragging(false);
      const c = map.getCenter();
      const la = +c.lat.toFixed(6), lo = +c.lng.toFixed(6);
      setPinPos({ lat: la, lng: lo });
      const inZone = ZONES.some(z => haversine(la, lo, z.lat, z.lng) <= z.radius * 1.12);
      setOutOfZone(!inZone);
      if (!inZone) { setAddrLine1(""); setAddrLine2(""); return; }
      clearTimeout(geoTimer.current);
      geoTimer.current = setTimeout(() => reverseGeo(la, lo), 700);
    });

    setReady(true);

    /* GPS on load — place "אני כאן" marker only, keep overview zoom */
    navigator.geolocation?.getCurrentPosition(
      ({ coords: { latitude: la, longitude: lo } }) => {
        placeMyLoc(la, lo, L, map);
        setMyLoc({ la, lo });
        setGpsErr(false);
        /* Do NOT flyTo — user sees all 3 zones first */
      },
      () => setGpsErr(true),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
  }

  function selectZone(zone, map, L) {
    if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
    ZONES.forEach(z => setPinStyle(z.id, false));
    setPinStyle(zone.id, true);

    circleRef.current = L.circle([zone.lat, zone.lng], {
      radius: zone.radius,
      color: RED, weight: 2.5, opacity: 0.9,
      fillColor: RED, fillOpacity: 0.09,
      dashArray: "7,5",
    }).addTo(map);

    // Pan so zone center is at upper 40% of map (leaving room for sheet)
    const pt    = map.latLngToContainerPoint([zone.lat, zone.lng]);
    const newPt = window.L.point(pt.x, pt.y + 50);
    map.panTo(map.containerPointToLatLng(newPt), { animate: true, duration: 0.3, easeLinearity: 0.9 });
    if (map.getZoom() < 13) map.setZoom(13, { animate: true });

    setPinPos({ lat: zone.lat, lng: zone.lng });
    setSelected(zone);
    setOutOfZone(false);
    reverseGeo(zone.lat, zone.lng);
  }

  function deselect(map) {
    if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
    ZONES.forEach(z => setPinStyle(z.id, false));
    setSelected(null);
  }

  function setPinStyle(id, active) {
    const ball = document.getElementById(`ypb-${id}`);
    const lbl  = document.getElementById(`ypl-${id}`);
    const svg  = ball?.querySelector("svg");
    if (!ball) return;
    ball.style.background  = active ? RED   : "white";
    ball.style.transform   = active ? "scale(1.3)" : "scale(1)";
    ball.style.boxShadow   = active ? "0 5px 20px rgba(200,16,46,.55)" : "0 3px 14px rgba(200,16,46,.35)";
    svg?.querySelector("path")?.setAttribute("fill", active ? "white" : RED);
    /* no label div */
  }

  function placeMyLoc(la, lo, L, map) {
    userMark.current?.remove();
    const icon = L.divIcon({
      className: "",
      html: `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;animation:addrPop .4s cubic-bezier(.34,1.5,.64,1) both">
        <div style="background:${RED};color:white;font-family:system-ui,Arial,sans-serif;font-size:11px;font-weight:800;padding:5px 13px;border-radius:22px;box-shadow:0 3px 14px rgba(200,16,46,.5);border:2px solid rgba(255,255,255,.6);display:flex;align-items:center;gap:5px;white-space:nowrap;">
          <span>🧭</span>אני כאן
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${RED};margin-top:-1px;"></div>
        <div style="position:relative;width:13px;height:13px;border-radius:50%;background:#3B82F6;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,.6);margin-top:2px;">
          <div style="position:absolute;inset:-5px;border-radius:50%;background:rgba(59,130,246,.2);animation:addrPulse 2s ease-out infinite;"></div>
        </div>
      </div>`,
      iconSize: [100, 68], iconAnchor: [50, 68],
    });
    userMark.current = L.marker([la, lo], { icon, zIndexOffset: 900, interactive: false }).addTo(map);
  }

  function goMyLoc() {
    if (myLoc?.la && mapRef.current) {
      mapRef.current.flyTo([myLoc.la, myLoc.lo], 16, { animate: true, duration: 0.6 });
      return;
    }
    setGpsErr(false);
    navigator.geolocation?.getCurrentPosition(
      ({ coords: { latitude: la, longitude: lo } }) => {
        if (window.L && mapRef.current) placeMyLoc(la, lo, window.L, mapRef.current);
        setMyLoc({ la, lo });
        setGpsErr(false);
        mapRef.current?.flyTo([la, lo], 16, { animate: true, duration: 0.7 });
        const zone = nearestZone(la, lo);
        setTimeout(() => selectZone(zone, mapRef.current, window.L), 900);
      },
      () => setGpsErr(true),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
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
      const num  = a.house_number || "";
      const city = a.city || a.town || a.village || "";
      setAddrLine1(road + (num ? " " + num : ""));
      setAddrLine2(city);
    } catch { setAddrLine1("מיקום נבחר"); setAddrLine2(""); }
    setAddrBusy(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    await new Promise(ok => setTimeout(ok, 300));
    const typeEmoji = { "בית":"🏠","חבר":"👥","עבודה":"💼","משרד":"🏢","מיקום אחר":"📍" }[locType] || "📍";
    const fullAddr = [addrLine1, buildNum ? `מס׳ ${buildNum}` : "", addrLine2].filter(Boolean).join(", ");
    const entry = { label: label || locType, typeEmoji, address: fullAddr, zoneName: selected.short, zone: selected, coords: pinPos };
    saveSaved([entry, ...loadSaved()]);
    onSaved?.(entry);
    setSaving(false);
  }

  const INP = (extra={}) => ({
    width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12,
    padding: "12px 14px", fontSize: 14, outline: "none",
    background: "white", textAlign: "right", fontFamily: "inherit",
    boxSizing: "border-box", color: DARK, direction: "rtl",
    ...extra,
  });

  return (
    <div style={{ position:"fixed",inset:0,display:"flex",flexDirection:"column",fontFamily:"system-ui,Arial,sans-serif",direction:"rtl",background:"#F5F5F7",zIndex:300 }}>
      <style>{CSS}</style>
      <style>{`
        .leaflet-container{background:#f0ece4!important}
        .leaflet-div-icon{background:none!important;border:none!important}
        .leaflet-marker-icon{overflow:visible!important}
        @keyframes ypinPop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
        @keyframes addrPop{0%{transform:scale(.5)translateY(10px);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
        @keyframes addrPulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.5);opacity:0}}
        @keyframes addrUp{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>

      {/* ── Header ── */}
      <div style={{ flexShrink:0,background:"white",padding:"10px 16px",borderBottom:"1px solid #F0F0F0",display:"flex",alignItems:"center",gap:12,zIndex:100,position:"relative" }}>
        <button onClick={onBack} style={{ width:38,height:38,borderRadius:12,background:"#F3F4F6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex:1,textAlign:"center" }}>
          <div style={{ fontSize:15,fontWeight:900,color:DARK }}>בחר מיקום על המפה</div>
          <div style={{ fontSize:10,color:outOfZone?"#EF4444":selected?"#16A34A":GRAY,fontWeight:700,marginTop:1,transition:"color .25s" }}>
            {outOfZone?"⚠️ אזור זה עדיין לא בשירות שלנו":selected?`✓ ${selected.short}`:"לחץ על סמן האזור שלך"}
          </div>
        </div>
        <div style={{ width:38 }}/>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch" }}>

        {/* MAP BLOCK */}
        <div style={{ position:"relative",height:MAP_H,background:"#f0ece4",flexShrink:0 }}>
          <div ref={mapEl} style={{ position:"absolute",inset:0,zIndex:1 }}/>

          {/* Loading */}
          {!ready && (
            <div style={{ position:"absolute",inset:0,background:"rgba(255,255,255,.9)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,zIndex:20 }}>
              <div style={{ width:40,height:40,borderRadius:"50%",border:"3px solid rgba(200,16,46,.15)",borderTopColor:RED,animation:"addrSpin .8s linear infinite" }}/>
              <span style={{ color:GRAY,fontSize:13,fontWeight:600 }}>טוען מפה...</span>
            </div>
          )}

          {/* Fixed center PIN */}
          {ready && (
            <div style={{ position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-100%)",zIndex:500,pointerEvents:"none" }}>
              {/* shadow */}
              <div style={{ position:"absolute",bottom:-3,left:"50%",transform:`translateX(-50%) scale(${dragging?1.6:1})`,width:18,height:5,borderRadius:"50%",background:"rgba(0,0,0,.2)",filter:"blur(3px)",transition:"transform .15s" }}/>
              {/* pin */}
              <svg width="36" height="44" viewBox="0 0 36 44" style={{ filter:"drop-shadow(0 4px 14px rgba(200,16,46,.5))",transform:dragging?"translateY(-8px) scale(1.12)":"translateY(0) scale(1)",transition:"transform .18s cubic-bezier(.34,1.3,.64,1)" }}>
                <path d="M18 0C8.06 0 0 8.06 0 18c0 12.75 18 26 18 26S36 30.75 36 18C36 8.06 27.94 0 18 0z" fill={RED}/>
                <circle cx="18" cy="18" r="7.5" fill="white"/>
                <circle cx="18" cy="18" r="4" fill={RED}/>
              </svg>
            </div>
          )}

          {/* Address bubble above pin */}
          {ready && (
            <div style={{ position:"absolute",left:"50%",top:`calc(50% - 56px)`,transform:"translateX(-50%)",zIndex:500,pointerEvents:"none",opacity:selected&&!outOfZone?1:0,transition:"opacity .2s" }}>
              <div style={{ background:"white",border:"1.5px solid rgba(200,16,46,.2)",borderRadius:20,padding:"5px 13px",fontSize:11,fontWeight:800,color:DARK,boxShadow:"0 3px 14px rgba(0,0,0,.12)",maxWidth:210,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5,transform:dragging?"scale(.9)":"scale(1)",transition:"transform .15s" }}>
                {addrBusy
                  ? <><div style={{ width:9,height:9,borderRadius:"50%",border:"2px solid #ddd",borderTopColor:RED,animation:"addrSpin .7s linear infinite" }}/><span>מחפש...</span></>
                  : <><span style={{ fontSize:12 }}>📍</span><span>{addrLine1||"גרור למיקום המדויק"}</span></>
                }
              </div>
              <div style={{ width:0,height:0,margin:"0 auto",borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"7px solid rgba(200,16,46,.2)" }}/>
            </div>
          )}

          {/* Out-of-zone banner */}
          {outOfZone && ready && (
            <div style={{ position:"absolute",top:10,left:12,right:12,zIndex:500,background:"rgba(254,242,242,.96)",backdropFilter:"blur(4px)",border:"1px solid #FECACA",borderRadius:14,padding:"10px 14px",display:"flex",alignItems:"center",gap:9,animation:"addrUp .25s both" }}>
              <span style={{ fontSize:18 }}>🗺️</span>
              <div>
                <div style={{ fontSize:12,fontWeight:800,color:"#991B1B" }}>אזור זה עדיין לא בשירות</div>
                <div style={{ fontSize:10,color:"#DC2626",marginTop:1 }}>חזור לאחת מהמנות המסומנות</div>
              </div>
            </div>
          )}

          {/* GPS FAB */}
          <button onClick={goMyLoc} style={{ position:"absolute",right:12,bottom:12,zIndex:500,width:42,height:42,background:"white",border:`2px solid ${gpsErr?"#FCA5A5":"rgba(200,16,46,.15)"}`,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 14px rgba(0,0,0,.15)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gpsErr?"#EF4444":RED} strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" fill={gpsErr?"#EF4444":RED} stroke="none"/>
              <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
              <circle cx="12" cy="12" r="8"/>
            </svg>
          </button>

          {/* Zoom */}
          <div style={{ position:"absolute",left:12,bottom:12,zIndex:500,display:"flex",flexDirection:"column",gap:5 }}>
            {[["+",1],["-",-1]].map(([l,d])=>(
              <button key={l} onClick={()=>mapRef.current?.setZoom((mapRef.current.getZoom()||11)+d)} style={{ width:36,height:36,background:"white",border:"1px solid rgba(0,0,0,.08)",borderRadius:9,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.08)",color:DARK }}>
                {l}
              </button>
            ))}
          </div>

          {/* Drag hint */}
          {selected && !dragging && (
            <div style={{ position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",zIndex:500,background:"rgba(17,24,39,.72)",backdropFilter:"blur(4px)",borderRadius:12,padding:"6px 14px",color:"white",fontSize:10,fontWeight:700,whiteSpace:"nowrap",pointerEvents:"none" }}>
              גרור את הסיכה למיקום המדויק לשליחת ההזמנה ✋
            </div>
          )}
        </div>

        {/* ── FORM below map — HAAT style ── */}
        <div style={{ padding:"0 0 100px" }}>

          {/* Address card */}
          <div style={{ background:"white",margin:"12px 14px",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:"1px solid #F0F0F0" }}>
            <div style={{ padding:"14px 16px 4px",borderBottom:"1px solid #F7F7F8" }}>
              <div style={{ fontSize:13,fontWeight:900,color:DARK }}>פרטי כתובת</div>
              <div style={{ fontSize:11,color:GRAY,marginTop:2 }}>הזן את פרטי הכתובת שלך</div>
            </div>

            {/* Zone row */}
            {selected && (
              <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid #F7F7F8",background:"rgba(200,16,46,.03)" }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:"#16A34A",flexShrink:0 }}/>
                <span style={{ fontSize:12,fontWeight:700,color:DARK }}>אזור: {selected.short}</span>
                <button onClick={()=>deselect(mapRef.current)} style={{ marginRight:"auto",background:"none",border:"none",cursor:"pointer",color:GRAY,fontSize:12 }}>✕ שנה</button>
              </div>
            )}

            {/* Street row — auto filled */}
            <div style={{ padding:"10px 16px",borderBottom:"1px solid #F7F7F8" }}>
              <div style={{ fontSize:10,color:GRAY,fontWeight:700,marginBottom:5 }}>שם רחוב</div>
              <div style={{ fontSize:14,fontWeight:700,color:addrLine1?DARK:"#9CA3AF",display:"flex",alignItems:"center",gap:8 }}>
                {addrBusy
                  ? <><div style={{ width:12,height:12,borderRadius:"50%",border:"2px solid #E5E7EB",borderTopColor:RED,animation:"addrSpin .7s linear infinite" }}/><span>מחפש...</span></>
                  : addrLine1 || "גרור את הסיכה על המפה"
                }
              </div>
              {addrLine2 && <div style={{ fontSize:11,color:GRAY,marginTop:2 }}>{addrLine2}</div>}
            </div>

            {/* Number row */}
            <div style={{ padding:"12px 16px",borderBottom:"1px solid #F7F7F8" }}>
              <div style={{ fontSize:10,color:GRAY,fontWeight:700,marginBottom:6 }}>מספר בניין</div>
              <input style={INP({ fontSize:13,padding:"9px 12px" })} value={buildNum} onChange={e=>setBuildNum(e.target.value)} placeholder="הכנס מספר בניין"
                onFocus={e=>{e.target.style.borderColor=RED;e.target.style.boxShadow=`0 0 0 3px rgba(200,16,46,.08)`;}}
                onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";}}
              />
            </div>

            {/* Floor + Apt */}
            <div style={{ display:"flex",gap:0,borderBottom:"1px solid #F7F7F8" }}>
              <div style={{ flex:1,padding:"12px 16px",borderLeft:"1px solid #F7F7F8" }}>
                <div style={{ fontSize:10,color:GRAY,fontWeight:700,marginBottom:6 }}>קומה</div>
                <input style={INP({ fontSize:13,padding:"9px 12px" })} value={floor} onChange={e=>setFloor(e.target.value)} placeholder="קומה"
                  onFocus={e=>{e.target.style.borderColor=RED;}}
                  onBlur={e=>{e.target.style.borderColor="#E5E7EB";}}
                />
              </div>
              <div style={{ flex:1,padding:"12px 16px" }}>
                <div style={{ fontSize:10,color:GRAY,fontWeight:700,marginBottom:6 }}>דירה <span style={{ opacity:.5 }}>(אופציונלי)</span></div>
                <input style={INP({ fontSize:13,padding:"9px 12px" })} value={apt} onChange={e=>setApt(e.target.value)} placeholder="מס׳ דירה"
                  onFocus={e=>{e.target.style.borderColor=RED;}}
                  onBlur={e=>{e.target.style.borderColor="#E5E7EB";}}
                />
              </div>
            </div>

            {/* Delivery notes */}
            <div style={{ padding:"12px 16px" }}>
              <div style={{ fontSize:10,color:GRAY,fontWeight:700,marginBottom:6 }}>הוראות לשליח <span style={{ opacity:.5 }}>(אופציונלי)</span></div>
              <div style={{ position:"relative" }}>
                <textarea style={{ ...INP({ resize:"none",height:64,fontSize:13,padding:"9px 12px 9px 36px" }) }} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="דוגמה: ליד סניף הדואר הראשי"
                  onFocus={e=>{e.target.style.borderColor=RED;e.target.style.boxShadow=`0 0 0 3px rgba(200,16,46,.08)`;}}
                  onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";}}
                />
                <svg style={{ position:"absolute",left:10,top:12,pointerEvents:"none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Location type */}
          <div style={{ background:"white",margin:"0 14px",borderRadius:16,padding:"14px 16px",boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:"1px solid #F0F0F0" }}>
            <div style={{ fontSize:12,fontWeight:900,color:DARK,marginBottom:4 }}>מהו סוג המיקום?</div>
            <div style={{ fontSize:11,color:GRAY,marginBottom:12 }}>כדי להקל על בחירת המיקום בהזמנות עתידיות</div>
            <div style={{ display:"flex",gap:8 }}>
              {[{k:"בית",e:"🏠"},{k:"משרד",e:"💼"},{k:"חבר",e:"👥"},{k:"מיקום אחר",e:"📍"}].map(t=>(
                <button key={t.k} onClick={()=>setLocType(t.k)} style={{
                  flex:1,padding:"10px 4px",borderRadius:13,cursor:"pointer",
                  border:`2px solid ${locType===t.k?RED:"#E5E7EB"}`,
                  background:locType===t.k?"rgba(200,16,46,.06)":"white",
                  color:locType===t.k?RED:"#6B7280",
                  fontSize:9,fontWeight:700,
                  display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                  fontFamily:"inherit",transition:"all .15s",
                }}>
                  <span style={{ fontSize:22 }}>{t.e}</span>{t.k}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ background:"white",margin:"12px 14px 0",borderRadius:16,padding:"14px 16px",boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:"1px solid #F0F0F0" }}>
            <div style={{ fontSize:10,color:GRAY,fontWeight:700,marginBottom:6 }}>שם המיקום <span style={{ opacity:.5 }}>(אופציונלי)</span></div>
            <input style={INP()} value={label} onChange={e=>setLabel(e.target.value)} placeholder="לדוגמה: בית של אמא / משרד ראשי"
              onFocus={e=>{e.target.style.borderColor=RED;e.target.style.boxShadow=`0 0 0 3px rgba(200,16,46,.08)`;}}
              onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";}}
            />
          </div>

        </div>
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div style={{ flexShrink:0,background:"white",padding:"12px 16px",borderTop:"1px solid #F0F0F0",boxShadow:"0 -4px 20px rgba(0,0,0,.06)" }}>
        <button onClick={handleSave} disabled={!selected||saving} style={{
          width:"100%",
          background:(!selected||saving)?`#E5E7EB`:`linear-gradient(135deg,${RED},#9B0B22)`,
          border:"none",borderRadius:16,padding:"15px",
          color:(!selected||saving)?"#9CA3AF":"white",
          fontSize:15,fontWeight:900,cursor:(!selected||saving)?"default":"pointer",
          boxShadow:(!selected||saving)?"none":"0 5px 20px rgba(200,16,46,.35)",
          display:"flex",alignItems:"center",justifyContent:"center",gap:10,
          fontFamily:"inherit",transition:"all .2s",
        }}>
          {saving
            ? <><div style={{ width:18,height:18,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,.4)",borderTopColor:"white",animation:"addrSpin .7s linear infinite" }}/>שומר...</>
            : selected ? "להמשיך ←" : "בחר אזור על המפה"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   LOGIN MODAL — Phone number entry (smooth)
══════════════════════════════════════════════ */
function LoginModal({ onClose, onDone }) {
  const navigate = useNavigate();
  return (
    <div style={{
      position:"fixed",inset:0,zIndex:2000,
      background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"flex-end",fontFamily:"system-ui,Arial,sans-serif",direction:"rtl",
    }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{
        width:"100%",maxWidth:430,margin:"0 auto",
        background:"white",borderRadius:"24px 24px 0 0",
        padding:"20px 20px 40px",
        animation:"addrSheet .3s cubic-bezier(.34,1.1,.64,1)",
      }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:"50%",background:"#F3F4F6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:17,fontWeight:900,color:"#111827" }}>כדי להמשיך</div>
            <div style={{ fontSize:12,color:"#6B7280",marginTop:2 }}>הוסף מיקום משפחה דורש התחברות</div>
          </div>
          <div style={{ width:32 }}/>
        </div>
        <button onClick={() => { onClose(); navigate("/profile"); }} style={{
          width:"100%",background:"linear-gradient(135deg,#C8102E,#9B0B22)",
          border:"none",borderRadius:16,padding:"15px",
          color:"white",fontSize:15,fontWeight:900,cursor:"pointer",
          boxShadow:"0 5px 20px rgba(200,16,46,.35)",marginBottom:10,
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          fontFamily:"inherit",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          כניסה / הרשמה
        </button>
        <button onClick={onClose} style={{ width:"100%",background:"none",border:"none",color:"#6B7280",fontSize:13,cursor:"pointer",padding:"8px",fontFamily:"inherit" }}>
          בטל
        </button>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════ */
export default function AddressPickerPage({ onAddressSave, initialZone, cartCount = 0, user, guest }) {
  // Zones — load from Supabase, fallback to hardcoded
  const [dynZones, setDynZones] = useState(null);
  useEffect(() => {
    supabase.from("zones").select("*").eq("active",true).order("sort_order")
      .then(({data}) => {
        if (data && data.length > 0) setDynZones(data.map(z => ({
          id:z.id, short:z.short||z.name, nameHe:z.name_he||z.name,
          cities:z.cities||"", accent:z.accent||"#059669", light:z.light||"#D1FAE5",
          lat:z.lat, lng:z.lng, radius:z.radius||5000,
        })));
      });
  }, []);

  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
    <>
      <ZoneSelector
        onFamilyMap={() => setStep(1)}
        onSaveAndGo={handleSaveAndGo}
        cartCount={cartCount}
        user={user}
        onNeedLogin={() => setShowLoginModal(true)}
        zones={dynZones}
        onClose={() => navigate(-1)}
      />
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} onDone={() => setShowLoginModal(false)} />
      )}
    </>
  );
}

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
   MAP PICKER  (Step 1) — smooth Leaflet + circles + אני כאן
══════════════════════════════════════════════ */
function MapPicker({ onBack, onSaved, cartCount = 0 }) {
  const mapEl    = useRef(null);
  const mapInst  = useRef(null);
  const circles  = useRef({});   // zone circles
  const userMark = useRef(null);
  const initDone = useRef(false);
  const pinLat   = useRef(32.935);
  const pinLng   = useRef(35.340);

  const [ready,    setReady]    = useState(false);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [addrTxt,  setAddrTxt]  = useState("גרור למיקום המדויק...");
  const [addrBusy, setAddrBusy] = useState(false);
  const [label,    setLabel]    = useState("");
  const [locType,  setLocType]  = useState("בית");
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);

  /* ── Load Leaflet CDN ── */
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
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } initDone.current = false; };
  }, []);

  /* ── Init map ── */
  function initMap() {
    if (initDone.current || !mapEl.current) return;
    initDone.current = true;
    const L = window.L;

    const map = L.map(mapEl.current, {
      center: [32.945, 35.325],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      minZoom: 10,
      maxZoom: 15,
      maxBounds: [[32.50, 34.80], [33.50, 35.90]],
      maxBoundsViscosity: 0.85,
      preferCanvas: true,
      fadeAnimation: true,
      zoomAnimation: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, updateWhenIdle: false, updateWhenZooming: false, keepBuffer: 6,
    }).addTo(map);

    mapInst.current = map;

    /* ── Draw zone circles with pins ── */
    ZONES.forEach(zone => {
      // Circle
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        color: RED, weight: 2, opacity: 0.6,
        fillColor: RED, fillOpacity: 0.08,
        dashArray: "6,4",
        interactive: true,
        className: "yg-zone-circle",
      }).addTo(map);

      // Pin marker
      const icon = L.divIcon({
        html: `
          <div id="mp-pin-${zone.id}" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;animation:pinPop .3s ease">
            <div class="mp-circle-${zone.id}" style="
              width:42px;height:42px;border-radius:50%;
              background:white;border:2.5px solid ${RED};
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 10px rgba(200,16,46,.25);
              transition:all .2s cubic-bezier(.34,1.3,.64,1);
              font-size:18px;
            ">${zone.emoji}</div>
            <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:9px solid ${RED};margin-top:-1px;opacity:.7"/>
            <div class="mp-label-${zone.id}" style="
              margin-top:2px;background:white;color:${DARK};
              font-size:9px;font-weight:700;padding:2px 8px;border-radius:7px;
              white-space:nowrap;border:1.5px solid ${RED};
              box-shadow:0 1px 5px rgba(0,0,0,.1);
              transition:all .2s;font-family:system-ui,Arial,sans-serif;
            ">${zone.short.split("·")[0].trim()}</div>
          </div>`,
        className: "",
        iconSize: [42, 70],
        iconAnchor: [21, 51],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon }).addTo(map);

      // Click handler on both circle and marker
      const onClick = (e) => {
        L.DomEvent.stopPropagation(e);
        selectZone(zone, map, L);
      };
      circle.on("click", onClick);
      marker.on("click", onClick);

      circles.current[zone.id] = { circle, marker };
    });

    /* ── Map events ── */
    map.on("click", () => {
      resetZones();
      setSelected(null);
      setShowForm(false);
    });

    map.on("movestart", () => setDragging(true));
    map.on("moveend", () => {
      setDragging(false);
      const c = map.getCenter();
      pinLat.current = +c.lat.toFixed(7);
      pinLng.current = +c.lng.toFixed(7);
    });

    setReady(true);

    /* ── GPS on load ── */
    navigator.geolocation?.getCurrentPosition(
      ({ coords: { latitude: la, longitude: lo } }) => {
        placeUserMarker(la, lo, L, map);
        pinLat.current = la;
        pinLng.current = lo;
      },
      () => {}
    );
  }

  function selectZone(zone, map, L) {
    resetZones();

    // Highlight selected circle
    const { circle, marker } = circles.current[zone.id] || {};
    circle?.setStyle({ fillOpacity: 0.22, weight: 3, opacity: 1, dashArray: "" });

    // Animate pin
    const pinEl = document.getElementById(`mp-pin-${zone.id}`);
    if (pinEl) {
      const circleEl = pinEl.querySelector(`.mp-circle-${zone.id}`);
      const labelEl  = pinEl.querySelector(`.mp-label-${zone.id}`);
      if (circleEl) {
        circleEl.style.background   = RED;
        circleEl.style.transform    = "scale(1.3)";
        circleEl.style.boxShadow    = "0 4px 18px rgba(200,16,46,.5)";
        circleEl.style.color        = "white";
      }
      if (labelEl) {
        labelEl.style.background   = RED;
        labelEl.style.color        = "white";
        labelEl.style.fontWeight   = "900";
      }
    }

    // Pan map — offset so zone is above bottom sheet
    const mapH  = map.getSize().y;
    const sheetH = 160;
    const pt    = map.latLngToContainerPoint([zone.lat, zone.lng]);
    const newPt = window.L.point(pt.x, pt.y + sheetH / 2);
    map.panTo(map.containerPointToLatLng(newPt), { animate: true, duration: 0.3, easeLinearity: 0.9 });

    pinLat.current = zone.lat;
    pinLng.current = zone.lng;

    setSelected(zone);
    setShowForm(false);
    reverseGeo(zone.lat, zone.lng);
  }

  function resetZones() {
    Object.entries(circles.current).forEach(([id, { circle }]) => {
      circle.setStyle({ fillOpacity: 0.08, weight: 2, opacity: 0.6, dashArray: "6,4" });
      const pinEl = document.getElementById(`mp-pin-${id}`);
      const zone  = ZONES.find(z => z.id === id);
      if (pinEl && zone) {
        const circleEl = pinEl.querySelector(`.mp-circle-${id}`);
        const labelEl  = pinEl.querySelector(`.mp-label-${id}`);
        if (circleEl) { circleEl.style.background = "white"; circleEl.style.transform = "scale(1)"; circleEl.style.boxShadow = "0 2px 10px rgba(200,16,46,.25)"; circleEl.style.color = "initial"; }
        if (labelEl)  { labelEl.style.background = "white"; labelEl.style.color = DARK; labelEl.style.fontWeight = "700"; }
      }
    });
  }

  function placeUserMarker(la, lo, L, map) {
    userMark.current?.remove();
    const icon = L.divIcon({
      className: "",
      html: `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
        <div style="background:${RED};color:white;font-family:system-ui,Arial,sans-serif;font-size:11px;font-weight:800;padding:5px 12px;border-radius:22px;box-shadow:0 3px 14px rgba(200,16,46,.45);border:2px solid rgba(255,255,255,.55);display:flex;align-items:center;gap:5px;white-space:nowrap;animation:addrPop .4s cubic-bezier(.34,1.5,.64,1) both">
          <span style="font-size:14px">🧭</span>אני כאן
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${RED};margin-top:-1px"></div>
        <div style="position:relative;width:14px;height:14px;border-radius:50%;background:#3B82F6;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,.55);margin-top:2px">
          <div style="position:absolute;inset:-5px;border-radius:50%;background:rgba(59,130,246,.18);animation:addrPulse 2s ease-out infinite"></div>
        </div>
      </div>`,
      iconSize: [100, 68], iconAnchor: [50, 68],
    });
    userMark.current = window.L.marker([la, lo], { icon, zIndexOffset: 700, interactive: false }).addTo(map);
  }

  async function reverseGeo(la, lo) {
    setAddrBusy(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json`, { headers: { "Accept-Language": "he" } });
      const j = await r.json(), a = j.address || {};
      const road = a.road || a.pedestrian || a.suburb || "", city = a.city || a.town || a.village || "", num = a.house_number || "";
      setAddrTxt([road + (num ? " " + num : ""), city].filter(Boolean).join(", ") || j.display_name?.split(",")[0] || "מיקום נבחר");
    } catch { setAddrTxt("מיקום נבחר"); }
    setAddrBusy(false);
  }

  function goMyLoc() {
    navigator.geolocation?.getCurrentPosition(({ coords: { latitude: la, longitude: lo } }) => {
      if (window.L && mapInst.current) placeUserMarker(la, lo, window.L, mapInst.current);
      mapInst.current?.flyTo([la, lo], 15, { animate: true, duration: 0.7 });
      pinLat.current = la; pinLng.current = lo;
      if (selected) reverseGeo(la, lo);
    });
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    await new Promise(ok => setTimeout(ok, 300));
    const typeEmoji = { "בית": "🏠", "משרד": "🏢", "חבר": "👥", "עבודה": "💼", "מיקום אחר": "📍" }[locType] || "📍";
    const entry = {
      label: label || locType,
      typeEmoji,
      address: addrTxt,
      zoneName: selected.short,
      zone: selected,
      coords: { lat: pinLat.current, lng: pinLng.current },
    };
    const prev = loadSaved();
    saveSaved([entry, ...prev]);
    onSaved?.(entry);
    setSaving(false);
  }

  const INP = {
    width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 11,
    padding: "11px 13px", fontSize: 14, outline: "none", background: "white",
    textAlign: "right", fontFamily: "inherit", boxSizing: "border-box",
    color: DARK, direction: "rtl",
  };

  const SHEET_H = showForm ? 360 : (selected ? 110 : 0);

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      fontFamily: "system-ui,Arial,sans-serif", direction: "rtl",
      background: "#ede8df", maxWidth: 430, margin: "0 auto", zIndex: 300,
    }}>
      <style>{CSS}</style>
      <style>{`.yg-zone-circle{cursor:pointer!important}.leaflet-container{background:#f0ece4!important}`}</style>

      {/* Header */}
      <div style={{ flexShrink:0,background:"white",padding:"10px 16px",borderBottom:"1px solid #F0F0F0",display:"flex",alignItems:"center",gap:12,zIndex:20 }}>
        <button onClick={onBack} style={{ width:38,height:38,borderRadius:12,background:"#F3F4F6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex:1,textAlign:"center" }}>
          <div style={{ fontSize:15,fontWeight:900,color:DARK }}>בחר מיקום על המפה</div>
          <div style={{ fontSize:10,color:selected?"#16A34A":GRAY,fontWeight:selected?700:400,marginTop:2,transition:"color .25s" }}>
            {selected ? `✓ ${selected.short.split("·")[0].trim()}` : "לחץ על אזור כדי לבחור"}
          </div>
        </div>
        <div style={{ width: 38 }}/>
      </div>

      {/* Map */}
      <div style={{ flex:1,position:"relative",overflow:"hidden" }}>
        <div ref={mapEl} style={{ position:"absolute",inset:0 }}/>

        {/* Loading */}
        {!ready && (
          <div style={{ position:"absolute",inset:0,background:"rgba(255,255,255,.9)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,zIndex:10 }}>
            <div style={{ width:40,height:40,borderRadius:"50%",border:`3px solid rgba(200,16,46,.15)`,borderTopColor:RED,animation:"addrSpin .8s linear infinite" }}/>
            <span style={{ color:GRAY,fontSize:13,fontWeight:600 }}>טוען מפה...</span>
          </div>
        )}

        {/* Crosshair — when zone selected */}
        {ready && selected && (
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:5,pointerEvents:"none" }}>
            <div style={{ position:"absolute",top:"50%",left:-24,right:-24,height:1.5,background:RED,transform:"translateY(-50%)",opacity:.55 }}/>
            <div style={{ position:"absolute",left:"50%",top:-24,bottom:-24,width:1.5,background:RED,transform:"translateX(-50%)",opacity:.55 }}/>
            <div style={{ width:12,height:12,borderRadius:"50%",background:"white",border:`3px solid ${RED}`,boxShadow:`0 0 0 4px rgba(200,16,46,.15),0 2px 8px rgba(0,0,0,.2)` }}/>
            {/* address bubble */}
            <div style={{ position:"absolute",bottom:"calc(100% + 10px)",left:"50%",transform:`translateX(-50%) scale(${dragging?.9:1})`,transition:"transform .18s cubic-bezier(.34,1.4,.64,1)",whiteSpace:"nowrap" }}>
              <div style={{ background:"white",border:"1.5px solid rgba(200,16,46,.2)",borderRadius:18,padding:"5px 13px",fontSize:11,fontWeight:800,color:DARK,boxShadow:"0 3px 14px rgba(0,0,0,.10)",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:5 }}>
                <span style={{ fontSize:12 }}>📍</span>
                <span>{addrBusy ? "מחפש..." : addrTxt.split(",")[0]}</span>
              </div>
              <div style={{ width:0,height:0,borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"7px solid white",margin:"0 auto",filter:"drop-shadow(0 1px 1px rgba(0,0,0,.06))" }}/>
            </div>
          </div>
        )}

        {/* GPS FAB */}
        <button onClick={goMyLoc} style={{
          position:"absolute",right:12,bottom:SHEET_H+14,zIndex:10,
          width:42,height:42,background:"white",border:"none",borderRadius:"50%",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 3px 14px rgba(0,0,0,.16)",transition:"bottom .3s ease",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" fill={RED} stroke="none"/>
            <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
            <circle cx="12" cy="12" r="8"/>
          </svg>
        </button>

        {/* Zoom */}
        <div style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",zIndex:10,display:"flex",flexDirection:"column",gap:6 }}>
          {[["+", 1], ["-", -1]].map(([l, d]) => (
            <button key={l}
              onClick={() => mapInst.current?.setZoom((mapInst.current.getZoom() || 11) + d)}
              style={{ width:36,height:36,background:"white",border:"1px solid rgba(0,0,0,.07)",borderRadius:10,fontSize:17,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.09)",color:DARK }}>
              {l}
            </button>
          ))}
        </div>

        {/* Drag hint */}
        {selected && !showForm && (
          <div style={{ position:"absolute",bottom:SHEET_H+8,left:"50%",transform:"translateX(-50%)",zIndex:10,background:"rgba(17,24,39,.75)",backdropFilter:"blur(4px)",borderRadius:14,padding:"7px 16px",color:"white",fontSize:10,fontWeight:600,whiteSpace:"nowrap",boxShadow:"0 3px 14px rgba(0,0,0,.2)",transition:"bottom .3s" }}>
            גרור את המפה למיקום המדויק ✋
          </div>
        )}

        {/* Bottom sheet */}
        {selected && (
          <div style={{
            position:"absolute",bottom:0,left:0,right:0,zIndex:15,
            height:SHEET_H, background:"white",
            borderRadius:"22px 22px 0 0",
            boxShadow:"0 -6px 28px rgba(0,0,0,.13)",
            transition:"height .32s cubic-bezier(.34,1.1,.64,1)",
            animation:"addrSheet .32s cubic-bezier(.34,1.1,.64,1)",
            overflow:"hidden",
          }}>
            {/* Handle */}
            <div style={{ padding:"10px 0 0",display:"flex",justifyContent:"center" }}>
              <div style={{ width:36,height:4,background:"#E5E7EB",borderRadius:2 }}/>
            </div>

            {!showForm ? (
              /* Collapsed */
              <div style={{ padding:"8px 18px 14px",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:`rgba(200,16,46,.07)`,border:"1.5px solid rgba(200,16,46,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>
                  {selected.emoji}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14,fontWeight:900,color:DARK }}>{selected.short}</div>
                  <div style={{ fontSize:11,color:"#16A34A",fontWeight:700,marginTop:2 }}>✓ אזור פעיל • גרור לבחור מיקום מדויק</div>
                </div>
                <button className="ygbtn" onClick={() => setShowForm(true)} style={{ background:`linear-gradient(135deg,${RED},#9B0B22)`,border:"none",borderRadius:13,padding:"9px 16px",color:"white",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:"0 3px 12px rgba(200,16,46,.3)" }}>
                  אישור ←
                </button>
              </div>
            ) : (
              /* Expanded form */
              <div style={{ overflowY:"auto",height:"calc(100% - 24px)",padding:"0 16px 16px" }}>
                <div style={{ background:"#F9FAFB",borderRadius:12,padding:"10px 14px",marginBottom:11,border:"1.5px solid #E9EAEB" }}>
                  <div style={{ fontSize:11,color:GRAY,fontWeight:700,marginBottom:3 }}>אזור · כתובת</div>
                  <div style={{ fontSize:13,fontWeight:800,color:DARK }}>{selected.short}</div>
                  <div style={{ fontSize:12,color:GRAY,marginTop:2 }}>{addrBusy ? "מחפש..." : addrTxt}</div>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>שם המיקום (אופציונלי)</div>
                  <input style={INP} value={label} onChange={e => setLabel(e.target.value)} placeholder="לדוגמה: בית של אמא / עבודה"/>
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:6 }}>סוג מיקום</div>
                  <div style={{ display:"flex",gap:7 }}>
                    {[{k:"בית",e:"🏠"},{k:"חבר",e:"👥"},{k:"עבודה",e:"💼"},{k:"מיקום אחר",e:"📍"}].map(t => (
                      <button key={t.k} onClick={() => setLocType(t.k)} style={{ flex:1,padding:"7px 2px",borderRadius:11,cursor:"pointer",border:`2px solid ${locType===t.k?RED:"#E5E7EB"}`,background:locType===t.k?"rgba(200,16,46,.06)":"white",color:locType===t.k?RED:GRAY,fontSize:9,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"inherit" }}>
                        <span style={{ fontSize:18 }}>{t.e}</span>{t.k}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="ygbtn" onClick={handleSave} disabled={saving} style={{ width:"100%",background:saving?GRAY:`linear-gradient(135deg,${RED},#9B0B22)`,border:"none",borderRadius:16,padding:"14px",color:"white",fontSize:15,fontWeight:900,cursor:saving?"default":"pointer",boxShadow:saving?"none":"0 5px 20px rgba(200,16,46,.36)",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:"inherit" }}>
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
  const navigate   = useNavigate();
  const [step, setStep] = useState(0); // 0 = ZoneSelector, 1 = MapPicker

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

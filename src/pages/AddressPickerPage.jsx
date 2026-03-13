/**
 * AddressPickerPage.jsx — v5 COMPLETE REBUILD
 *
 * ZONES SELECTOR (step 0):
 *   - GPS button → detect zone → navigate("/") directly
 *   - "Family/Friend/Work" button → opens FriendMapPicker (step 2)
 *   - Zone cards → tap → save zone + navigate("/") directly (NO MAP)
 *   - "המיקומים שלי" — up to 3 saved locations from localStorage
 *
 * FRIEND MAP PICKER (step 2):
 *   - Full-screen map, all 3 zone POLYGONS drawn (hardcoded coords = instant, no network)
 *   - Tap polygon → highlight + bottom sheet slides up
 *   - Crosshair = center of map = precise delivery point
 *   - "אני כאן" GPS bubble marker
 *   - Name the location + type
 *   - Save → localStorage + callback → navigate back
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

/* ── Brand ─────────────────────────────────── */
const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";

/* ── Hardcoded zone polygons (instant, no lag) ── */
const ZONES = [
  {
    id:      "east",
    short:   "ראמה · מגאר · עראבה",
    nameHe:  "ראמה, מגאר, עראבה",
    cities:  "ראמה, מגאר, עראבה, סחנין, שזור, דיר חנא",
    emoji:   "🌿",
    accent:  "#059669",
    light:   "#D1FAE5",
    lat: 32.9078, lng: 35.3524, radius: 6500,
    polygon: [
      [32.980,35.328],[32.985,35.362],[32.982,35.392],
      [32.975,35.420],[32.956,35.428],[32.938,35.422],
      [32.920,35.410],[32.906,35.390],[32.902,35.362],
      [32.906,35.330],[32.920,35.310],[32.940,35.305],
      [32.960,35.310],
    ],
  },
  {
    id:      "center",
    short:   "כרמיאל · נחף · בעינה",
    nameHe:  "כרמיאל, נחף, בעינה",
    cities:  "כרמיאל, נחף, בעינה, דיר אל-אסד, מגד אל-כרום",
    emoji:   "🏙️",
    accent:  "#2563EB",
    light:   "#DBEAFE",
    lat: 32.9178, lng: 35.2999, radius: 5000,
    polygon: [
      [32.970,35.278],[32.972,35.305],[32.970,35.337],
      [32.968,35.360],[32.952,35.370],[32.935,35.368],
      [32.918,35.362],[32.898,35.350],[32.890,35.325],
      [32.892,35.298],[32.902,35.276],[32.920,35.263],
      [32.942,35.260],[32.958,35.266],
    ],
  },
  {
    id:      "north",
    short:   "פקיעין · חורפיש · כסרה",
    nameHe:  "פקיעין, חורפיש, כסרה",
    cities:  "פקיעין, חורפיש, בית ג'ן, כסרה-סמיע",
    emoji:   "⛰️",
    accent:  "#7C3AED",
    light:   "#EDE9FE",
    lat: 32.9873, lng: 35.3220, radius: 5500,
    polygon: [
      [32.992,35.262],[32.995,35.292],[32.992,35.320],
      [32.988,35.352],[32.972,35.364],[32.955,35.360],
      [32.938,35.350],[32.928,35.330],[32.928,35.305],
      [32.932,35.278],[32.945,35.258],[32.962,35.250],
      [32.978,35.253],
    ],
  },
];

const SAVED_KEY = "yougo_saved_locations";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}
function saveSaved(list) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0,3))); } catch {}
}

function haversine(la1,lo1,la2,lo2){
  const R=6371000,φ1=la1*Math.PI/180,φ2=la2*Math.PI/180,
    Δφ=(la2-la1)*Math.PI/180,Δλ=(lo2-lo1)*Math.PI/180;
  const a=Math.sin(Δφ/2)**2+Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
const nearestZone = (la,lo) => ZONES.reduce((b,z)=> haversine(la,lo,z.lat,z.lng) < haversine(la,lo,b.lat,b.lng) ? z : b, ZONES[0]);
const resolveZone = (iz) => !iz ? null : ZONES.find(z=>z.id===iz.id) || (iz.lat&&iz.lng ? nearestZone(iz.lat,iz.lng) : null);

const CSS = `
  @keyframes addrSpin  { to { transform:rotate(360deg); } }
  @keyframes addrPulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:0;transform:scale(2.5)} }
  @keyframes addrUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes addrSheet { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes addrPop   { 0%{opacity:0;transform:scale(.5)} 70%{transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
  .leaflet-container { background:#ede8df !important; }
  .ygbtn:active { transform:scale(.96) !important; }
  .yg-poly { cursor:pointer; transition:fill-opacity .2s; }
`;

/* ══════════════════════════════════════════════
   ZONE SELECTOR  (Step 0)
══════════════════════════════════════════════ */
function ZoneSelector({ initialZone, onFamilyMap, onSaveAndGo, cartCount=0 }) {
  const [busy,    setBusy]    = useState(false);
  const [gpsErr,  setGpsErr]  = useState("");
  const [saved,   setSaved]   = useState(loadSaved);
  const [tap,     setTap]     = useState(null);

  function detectGPS() {
    setBusy(true); setGpsErr("");
    if (!navigator.geolocation) { setGpsErr("GPS غير متاح في هذا المتصفح"); setBusy(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: la, longitude: lo } }) => {
        setBusy(false);
        onSaveAndGo({ zone: nearestZone(la, lo), coords: { lat: la, lng: lo } });
      },
      (e) => { setBusy(false); setGpsErr(e.code===1 ? "يرجى السماح بالوصول للموقع في إعدادات المتصفح" : "تعذّر تحديد الموقع، اختر منطقتك يدوياً"); },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
    );
  }

  function deleteSaved(idx) {
    const next = saved.filter((_,i)=>i!==idx);
    saveSaved(next); setSaved(next);
  }

  return (
    <div style={{ position:"fixed",inset:0,display:"flex",flexDirection:"column",fontFamily:"system-ui,Arial,sans-serif",direction:"rtl",background:"#F5F5F7",maxWidth:430,margin:"0 auto",zIndex:300 }}>
      <style>{CSS}</style>

      {/* Hero */}
      <div style={{ background:`linear-gradient(158deg,#C8102E 0%,#6B0716 100%)`,padding:"32px 22px 26px",position:"relative",overflow:"hidden",flexShrink:0 }}>
        <div style={{ position:"absolute",width:220,height:220,borderRadius:"50%",border:"1px solid rgba(255,255,255,.07)",top:-90,right:-70,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",width:150,height:150,borderRadius:"50%",border:"1px solid rgba(255,255,255,.05)",bottom:-55,left:-45,pointerEvents:"none" }}/>
        <div style={{ fontSize:38,marginBottom:10,lineHeight:1,position:"relative" }}>🗺️</div>
        <div style={{ fontSize:21,fontWeight:900,color:"white",position:"relative" }}>בחר את האזור שלך</div>
        <div style={{ fontSize:13,color:"rgba(255,255,255,.65)",marginTop:5,lineHeight:1.5,position:"relative" }}>כדי להציג לך מסעדות ומשלוחים בסביבתך</div>
      </div>

      <div style={{ flex:1,overflowY:"auto",padding:"0 0 20px" }}>

        {/* GPS button */}
        <div style={{ padding:"18px 18px 0" }}>
          <button className="ygbtn" onClick={detectGPS} disabled={busy} style={{ width:"100%",border:"none",borderRadius:18,padding:0,background:busy?"#F3F4F6":`linear-gradient(135deg,${RED},#9B0B22)`,boxShadow:busy?"none":"0 6px 22px rgba(200,16,46,.36)",cursor:busy?"default":"pointer",overflow:"hidden",transition:"all .22s",fontFamily:"inherit" }}>
            <div style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 18px" }}>
              <div style={{ width:46,height:46,borderRadius:13,flexShrink:0,background:busy?"#E5E7EB":"rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                {busy
                  ? <div style={{ width:22,height:22,borderRadius:"50%",border:"2.5px solid #D1D5DB",borderTopColor:RED,animation:"addrSpin .75s linear infinite" }}/>
                  : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3" fill="white" stroke="none"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="8"/></svg>
                }
              </div>
              <div style={{ flex:1,textAlign:"right" }}>
                <div style={{ fontSize:15,fontWeight:900,color:busy?DARK:"white",lineHeight:1.2 }}>{busy?"מאתר מיקום...":"זיהוי אוטומטי של המיקום שלי"}</div>
                <div style={{ fontSize:11,color:busy?GRAY:"rgba(255,255,255,.68)",marginTop:3 }}>{busy?"אנא המתן":"GPS · מיידי · מעבר ישיר למסעדות"}</div>
              </div>
              {!busy && <div style={{ width:28,height:28,borderRadius:9,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></div>}
            </div>
            {!busy && <div style={{ height:3,background:"rgba(255,255,255,.18)" }}/>}
          </button>

          {gpsErr && (
            <div style={{ marginTop:10,background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"10px 14px",display:"flex",gap:8,alignItems:"flex-start",animation:"addrUp .25s both" }}>
              <span style={{ fontSize:15,flexShrink:0 }}>⚠️</span>
              <span style={{ fontSize:12,color:"#DC2626",fontWeight:600,lineHeight:1.4 }}>{gpsErr}</span>
            </div>
          )}
        </div>

        {/* Family/Friend button */}
        <div style={{ padding:"10px 18px 0" }}>
          <button className="ygbtn" onClick={onFamilyMap} style={{ width:"100%",border:"2px dashed #D1D5DB",borderRadius:16,padding:"13px 18px",background:"white",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"inherit",transition:"all .2s" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=RED; e.currentTarget.style.background="rgba(200,16,46,.03)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#D1D5DB"; e.currentTarget.style.background="white"; }}
          >
            <div style={{ width:40,height:40,borderRadius:12,background:"rgba(200,16,46,.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>📍</div>
            <div style={{ flex:1,textAlign:"right" }}>
              <div style={{ fontSize:14,fontWeight:800,color:DARK }}>הוסף מיקום של קרוב משפחה / חבר/ה / עבודה</div>
              <div style={{ fontSize:11,color:GRAY,marginTop:2 }}>בחר מיקום מדויק על המפה</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Divider */}
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"16px 18px 8px" }}>
          <div style={{ flex:1,height:1,background:"#E5E7EB" }}/>
          <span style={{ fontSize:11,color:GRAY,fontWeight:700 }}>בחר אזור משלוח</span>
          <div style={{ flex:1,height:1,background:"#E5E7EB" }}/>
        </div>

        {/* Zone cards → direct to restaurants */}
        <div style={{ padding:"0 18px",display:"flex",flexDirection:"column",gap:9 }}>
          {ZONES.map((z,i)=>(
            <button key={z.id} className="ygbtn"
              onMouseDown={()=>setTap(z.id)} onMouseUp={()=>setTap(null)}
              onTouchStart={()=>setTap(z.id)} onTouchEnd={()=>{setTap(null);onSaveAndGo({zone:z});}}
              onClick={()=>onSaveAndGo({zone:z})}
              style={{ width:"100%",border:`2px solid ${tap===z.id?z.accent:"#E9EAEB"}`,borderRadius:17,padding:"13px 15px",cursor:"pointer",textAlign:"right",fontFamily:"inherit",background:tap===z.id?z.light:"white",display:"flex",alignItems:"center",gap:11,boxShadow:tap===z.id?"0 8px 24px rgba(0,0,0,.09)":"0 1px 4px rgba(0,0,0,.04)",transition:"all .17s",animation:`addrUp .3s ${i*.07}s both` }}
            >
              <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:z.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>{z.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,fontWeight:900,color:DARK,marginBottom:2 }}>{z.short}</div>
                <div style={{ fontSize:11,color:GRAY }}>{z.cities}</div>
              </div>
              <div style={{ width:26,height:26,borderRadius:8,background:tap===z.id?z.accent:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .17s",flexShrink:0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tap===z.id?"white":"#9CA3AF"} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
          ))}
        </div>

        {/* Saved locations */}
        {saved.length > 0 && (
          <div style={{ padding:"18px 18px 0" }}>
            <div style={{ fontSize:13,fontWeight:900,color:DARK,marginBottom:10 }}>📌 המיקומים השמורים שלי</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {saved.map((s,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:10,background:"white",borderRadius:14,padding:"11px 14px",border:"1.5px solid #E9EAEB",boxShadow:"0 1px 4px rgba(0,0,0,.04)",animation:`addrUp .3s ${i*.06}s both` }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:"rgba(200,16,46,.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>{s.typeEmoji||"📍"}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:800,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.label||s.address||"מיקום שמור"}</div>
                    <div style={{ fontSize:10,color:GRAY,marginTop:1 }}>{s.zoneName||""}</div>
                  </div>
                  <button onClick={()=>deleteSaved(i)} style={{ background:"none",border:"none",cursor:"pointer",color:"#D1D5DB",fontSize:16,padding:"0 4px",flexShrink:0 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height:20 }}/>
      </div>

      <div style={{ flexShrink:0,background:"white",borderTop:"1px solid #F0F0F0" }}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   FRIEND MAP PICKER  (Step 2)
   - full-screen polygon map (Version A approach = instant, smooth)
   - crosshair for precise location
   - GPS "אני כאן" marker
   - form: name + type → save to localStorage
══════════════════════════════════════════════ */
const SHEET_COLLAPSED = 90;   // height when just zone selected (px)
const SHEET_EXPANDED  = 380;  // height when form visible (px)

function FriendMapPicker({ onBack, onSaved, cartCount=0 }) {
  const mapEl      = useRef(null);
  const mapInst    = useRef(null);
  const polyLayers = useRef({});     // zone polygons
  const userMark   = useRef(null);   // "אני כאן"
  const initDone   = useRef(false);

  const pinLat = useRef(32.935);
  const pinLng = useRef(35.340);

  const [ready,      setReady]      = useState(false);
  const [selected,   setSelected]   = useState(null);   // selected zone
  const [sheetH,     setSheetH]     = useState(0);       // 0 = hidden, COLLAPSED, EXPANDED
  const [dragging,   setDragging]   = useState(false);
  const [addrTxt,    setAddrTxt]    = useState("גרור למיקום המדויק...");
  const [addrBusy,   setAddrBusy]   = useState(false);
  const [label,      setLabel]      = useState("");
  const [locType,    setLocType]    = useState("בית");
  const [saving,     setSaving]     = useState(false);

  /* load leaflet */
  useEffect(()=>{
    if (!document.querySelector('link[href*="leaflet"]')) {
      const el=document.createElement("link"); el.rel="stylesheet";
      el.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(el);
    }
    if (window.L) { initMap(); return; }
    if (document.querySelector('script[src*="leaflet"]')) {
      const t=setInterval(()=>{ if(window.L){clearInterval(t);initMap();} },120);
      return ()=>clearInterval(t);
    }
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload=()=>initMap();
    document.head.appendChild(s);
    return ()=>{ if(mapInst.current){mapInst.current.remove();mapInst.current=null;} initDone.current=false; };
  },[]);

  useEffect(()=>{
    return ()=>{ if(mapInst.current){mapInst.current.remove();mapInst.current=null;} };
  },[]);

  /* invalidate when sheet changes */
  useEffect(()=>{
    if(mapInst.current) setTimeout(()=>mapInst.current?.invalidateSize({pan:false}),60);
  },[sheetH]);

  function initMap() {
    if (initDone.current || !mapEl.current) return;
    initDone.current = true;
    const L = window.L;

    const map = L.map(mapEl.current, {
      center:[32.935,35.340], zoom:11,
      zoomControl:false, attributionControl:false,
      minZoom:9, maxZoom:16,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{ maxZoom:19 }).addTo(map);
    mapInst.current = map;

    /* draw all zone polygons */
    ZONES.forEach(zone=>{
      const poly = L.polygon(zone.polygon, {
        color:RED, weight:2, opacity:.7, fillColor:RED, fillOpacity:.10,
        className:"yg-poly",
      }).addTo(map);

      poly.on("click", e=>{
        L.DomEvent.stopPropagation(e);
        selectZone(zone, map, L, poly);
      });

      polyLayers.current[zone.id] = poly;
    });

    map.on("click", ()=>{ resetPolys(); setSelected(null); setSheetH(0); });

    map.on("movestart", ()=>setDragging(true));
    map.on("moveend",   ()=>{
      setDragging(false);
      const c=map.getCenter();
      pinLat.current=+c.lat.toFixed(7);
      pinLng.current=+c.lng.toFixed(7);
      if(selected) reverseGeo(pinLat.current, pinLng.current);
    });

    setReady(true);

    /* GPS on load */
    navigator.geolocation?.getCurrentPosition(
      ({coords:{latitude:la,longitude:lo}})=>{
        placeUserMarker(la,lo,L,map);
        map.flyTo([la,lo],13,{animate:true,duration:.9});
        pinLat.current=la; pinLng.current=lo;
      },
      ()=>{}
    );
  }

  function selectZone(zone, map, L, poly) {
    resetPolys();
    poly.setStyle({ fillOpacity:.25, weight:3, opacity:1 });
    map.flyTo([zone.lat,zone.lng], 13, { animate:true, duration:.6 });
    pinLat.current=zone.lat; pinLng.current=zone.lng;
    setSelected(zone);
    setSheetH(SHEET_COLLAPSED);
    reverseGeo(zone.lat, zone.lng);
  }

  function resetPolys() {
    Object.values(polyLayers.current).forEach(p=>
      p.setStyle({fillOpacity:.10,weight:2,opacity:.7})
    );
  }

  function placeUserMarker(la,lo,L,map) {
    userMark.current?.remove();
    const icon = L.divIcon({
      className:"",
      html:`<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
        <div style="background:${RED};color:white;font-family:system-ui,Arial,sans-serif;font-size:11px;font-weight:800;padding:5px 12px;border-radius:22px;box-shadow:0 3px 14px rgba(200,16,46,.45);border:2px solid rgba(255,255,255,.55);display:flex;align-items:center;gap:5px;white-space:nowrap;animation:addrPop .4s cubic-bezier(.34,1.5,.64,1) both">
          <span style="font-size:14px">🧭</span>אני כאן
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${RED};margin-top:-1px"></div>
        <div style="width:12px;height:12px;border-radius:50%;background:#3B82F6;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,.55);margin-top:2px;position:relative">
          <div style="position:absolute;inset:-5px;border-radius:50%;background:rgba(59,130,246,.18);animation:addrPulse 2s ease-out infinite"></div>
        </div>
      </div>`,
      iconSize:[100,64], iconAnchor:[50,64],
    });
    userMark.current = L.marker([la,lo],{icon,zIndexOffset:700,interactive:false}).addTo(map);
  }

  async function reverseGeo(la,lo) {
    setAddrBusy(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json`,{headers:{"Accept-Language":"he"}});
      const j=await r.json(),a=j.address||{};
      const road=a.road||a.pedestrian||a.suburb||"", city=a.city||a.town||a.village||"", num=a.house_number||"";
      setAddrTxt([road+(num?" "+num:""),city].filter(Boolean).join(", ")||j.display_name?.split(",")[0]||"מיקום נבחר");
    } catch { setAddrTxt("מיקום נבחר"); }
    setAddrBusy(false);
  }

  function goMyLoc() {
    navigator.geolocation?.getCurrentPosition(({coords:{latitude:la,longitude:lo}})=>{
      if(window.L&&mapInst.current) placeUserMarker(la,lo,window.L,mapInst.current);
      mapInst.current?.flyTo([la,lo],16,{animate:true,duration:.7});
      pinLat.current=la; pinLng.current=lo;
      if(selected) reverseGeo(la,lo);
    });
  }

  function expandForm() { setSheetH(SHEET_EXPANDED); }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    await new Promise(ok=>setTimeout(ok,300));
    const typeEmoji = { "בית":"🏠","משרד":"🏢","חבר":"👥","עבודה":"💼","מיקום אחר":"📍" }[locType] || "📍";
    const entry = {
      label:    label || locType,
      typeEmoji,
      address:  addrTxt,
      zoneName: selected.short,
      zone:     selected,
      coords:   { lat:pinLat.current, lng:pinLng.current },
    };
    const prev = loadSaved();
    saveSaved([entry, ...prev]);
    onSaved?.(entry);
    setSaving(false);
  }

  const INP = { width:"100%",border:"1.5px solid #E5E7EB",borderRadius:11,padding:"11px 13px",fontSize:14,outline:"none",background:"white",textAlign:"right",fontFamily:"inherit",boxSizing:"border-box",color:DARK,direction:"rtl",transition:"border-color .15s,box-shadow .15s" };
  const fo=e=>{e.target.style.borderColor=RED;e.target.style.boxShadow=`0 0 0 3px rgba(200,16,46,.08)`;};
  const bl=e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";};

  return (
    <div style={{ position:"fixed",inset:0,display:"flex",flexDirection:"column",fontFamily:"system-ui,Arial,sans-serif",direction:"rtl",background:"#ede8df",maxWidth:430,margin:"0 auto",zIndex:300 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ flexShrink:0,background:"white",padding:"10px 16px",borderBottom:"1px solid #F0F0F0",display:"flex",alignItems:"center",gap:12,zIndex:20 }}>
        <button onClick={onBack} style={{ width:38,height:38,borderRadius:12,background:"#F3F4F6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex:1,textAlign:"center" }}>
          <div style={{ fontSize:15,fontWeight:900,color:DARK }}>בחר מיקום על המפה</div>
          <div style={{ fontSize:10,color:selected?"#16A34A":GRAY,fontWeight:selected?700:400,marginTop:2,transition:"color .25s" }}>
            {selected ? `✓ ${selected.short.split("·")[0].trim()}` : "לחץ על אזור כדי לבחור"}
          </div>
        </div>
        <div style={{ width:38 }}/>
      </div>

      {/* Map — fills remaining space above sheet */}
      <div style={{ flex:1,position:"relative",overflow:"hidden" }}>
        <div ref={mapEl} style={{ position:"absolute",inset:0 }}/>

        {/* Loading */}
        {!ready && (
          <div style={{ position:"absolute",inset:0,background:"rgba(255,255,255,.9)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,zIndex:10 }}>
            <div style={{ width:40,height:40,borderRadius:"50%",border:`3px solid rgba(200,16,46,.15)`,borderTopColor:RED,animation:"addrSpin .8s linear infinite" }}/>
            <span style={{ color:GRAY,fontSize:13,fontWeight:600 }}>טוען מפה...</span>
          </div>
        )}

        {/* Center crosshair — only visible when zone selected */}
        {ready && selected && (
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:5,pointerEvents:"none" }}>
            {/* arms */}
            <div style={{ position:"absolute",top:"50%",left:-22,right:-22,height:1.5,background:RED,transform:"translateY(-50%)",opacity:.65 }}/>
            <div style={{ position:"absolute",left:"50%",top:-22,bottom:-22,width:1.5,background:RED,transform:"translateX(-50%)",opacity:.65 }}/>
            {/* center dot */}
            <div style={{ width:13,height:13,borderRadius:"50%",background:"white",border:`3px solid ${RED}`,boxShadow:`0 0 0 4px rgba(200,16,46,.15),0 2px 8px rgba(0,0,0,.2)` }}/>

            {/* address label above crosshair */}
            <div style={{ position:"absolute",bottom:"calc(100% + 10px)",left:"50%",transform:`translateX(-50%) ${dragging?"scale(.9)":"scale(1)"}`,transition:"transform .18s cubic-bezier(.34,1.4,.64,1)",whiteSpace:"nowrap" }}>
              <div style={{ background:"white",border:"1.5px solid rgba(200,16,46,.2)",borderRadius:18,padding:"5px 13px",fontSize:11,fontWeight:800,color:DARK,boxShadow:"0 3px 14px rgba(0,0,0,.10)",maxWidth:210,overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:5 }}>
                <span style={{ fontSize:12 }}>📍</span>
                <span>{addrBusy?"מחפש...":addrTxt.split(",")[0]}</span>
              </div>
              <div style={{ width:0,height:0,borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"7px solid white",margin:"0 auto",filter:"drop-shadow(0 1px 1px rgba(0,0,0,.06))" }}/>
            </div>
          </div>
        )}

        {/* My location FAB */}
        <button onClick={goMyLoc} style={{ position:"absolute",right:12,bottom:sheetH+12,zIndex:10,width:40,height:40,background:"white",border:"none",borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 14px rgba(0,0,0,.16)",transition:"bottom .3s ease" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3" fill={RED} stroke="none"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="8"/></svg>
        </button>

        {/* Zoom */}
        <div style={{ position:"absolute",right:12,top:12,zIndex:10,display:"flex",flexDirection:"column",gap:5 }}>
          {[["+",1],["-",-1]].map(([l,d])=>(
            <button key={l} onClick={()=>mapInst.current?.setZoom((mapInst.current.getZoom()||11)+d)} style={{ width:34,height:34,background:"white",border:"1px solid rgba(0,0,0,.07)",borderRadius:9,fontSize:17,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.09)",color:DARK }}>{l}</button>
          ))}
        </div>

        {/* Drag hint — only when zone selected and sheet collapsed */}
        {selected && sheetH===SHEET_COLLAPSED && (
          <div style={{ position:"absolute",bottom:SHEET_COLLAPSED+4,left:"50%",transform:"translateX(-50%)",zIndex:10,background:"rgba(17,24,39,.78)",backdropFilter:"blur(5px)",borderRadius:14,padding:"8px 18px",color:"white",fontSize:10,fontWeight:600,whiteSpace:"nowrap",boxShadow:"0 3px 14px rgba(0,0,0,.2)" }}>
            גרור את המפה למיקום המדויק
          </div>
        )}

        {/* ── BOTTOM SHEET ── */}
        {sheetH > 0 && selected && (
          <div style={{ position:"absolute",bottom:0,left:0,right:0,zIndex:15,height:sheetH,background:"white",borderRadius:"22px 22px 0 0",boxShadow:"0 -8px 32px rgba(0,0,0,.13)",overflow:"hidden",transition:"height .3s cubic-bezier(.34,1.1,.64,1)",animation:"addrSheet .32s cubic-bezier(.34,1.1,.64,1)" }}>

            {/* Sheet handle */}
            <div style={{ padding:"10px 0 0",display:"flex",justifyContent:"center" }}>
              <div style={{ width:36,height:4,background:"#E5E7EB",borderRadius:2 }}/>
            </div>

            {sheetH === SHEET_COLLAPSED ? (
              /* Collapsed: zone info + expand button */
              <div style={{ padding:"10px 18px 16px",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:`rgba(200,16,46,.07)`,border:"1.5px solid rgba(200,16,46,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>
                  {selected.emoji}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14,fontWeight:900,color:DARK }}>{selected.short}</div>
                  <div style={{ fontSize:11,color:"#16A34A",fontWeight:700,marginTop:2 }}>✓ אזור פעיל • גרור לבחור מיקום מדויק</div>
                </div>
                <button className="ygbtn" onClick={expandForm} style={{ background:`linear-gradient(135deg,${RED},#9B0B22)`,border:"none",borderRadius:13,padding:"9px 16px",color:"white",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:"0 3px 12px rgba(200,16,46,.3)" }}>
                  אישור ←
                </button>
              </div>
            ) : (
              /* Expanded: full form */
              <div style={{ overflowY:"auto",height:"calc(100% - 24px)",padding:"0 16px 20px" }}>
                {/* Zone + address */}
                <div style={{ background:"#F9FAFB",borderRadius:12,padding:"11px 14px",marginBottom:12,border:"1.5px solid #E9EAEB" }}>
                  <div style={{ fontSize:11,color:GRAY,fontWeight:700,marginBottom:4 }}>אזור · כתובת</div>
                  <div style={{ fontSize:13,fontWeight:800,color:DARK }}>{selected.short}</div>
                  <div style={{ fontSize:12,color:GRAY,marginTop:2 }}>{addrBusy?"מחפש...":addrTxt}</div>
                </div>

                {/* Label / name */}
                <div style={{ marginBottom:11 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>שם המיקום (אופציונלי)</div>
                  <input style={INP} value={label} onChange={e=>setLabel(e.target.value)} placeholder="לדוגמה: בית של אמא / עבודה" onFocus={fo} onBlur={bl}/>
                </div>

                {/* Location type */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:7 }}>סוג מיקום</div>
                  <div style={{ display:"flex",gap:7 }}>
                    {[{k:"בית",e:"🏠"},{k:"חבר",e:"👥"},{k:"עבודה",e:"💼"},{k:"מיקום אחר",e:"📍"}].map(t=>(
                      <button key={t.k} onClick={()=>setLocType(t.k)} style={{ flex:1,padding:"8px 2px",borderRadius:12,cursor:"pointer",border:`2px solid ${locType===t.k?RED:"#E5E7EB"}`,background:locType===t.k?"rgba(200,16,46,.06)":"white",color:locType===t.k?RED:GRAY,fontSize:9,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .17s",fontFamily:"inherit" }}>
                        <span style={{ fontSize:18 }}>{t.e}</span>{t.k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save */}
                <button className="ygbtn" onClick={handleSave} disabled={saving} style={{ width:"100%",background:saving?GRAY:`linear-gradient(135deg,${RED},#9B0B22)`,border:"none",borderRadius:16,padding:"15px",color:"white",fontSize:15,fontWeight:900,cursor:saving?"default":"pointer",boxShadow:saving?"none":"0 5px 20px rgba(200,16,46,.36)",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:"inherit",transition:"all .22s" }}>
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

      {/* Bottom nav — always visible */}
      <div style={{ flexShrink:0,background:"white",borderTop:"1px solid #F0F0F0",zIndex:20 }}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════ */
export default function AddressPickerPage({ onAddressSave, initialZone, cartCount=0 }) {
  const navigate  = useNavigate();
  const startZone = resolveZone(initialZone);

  // 0 = zone selector, 2 = friend/family map
  const [step, setStep] = useState(0);

  /* Zone selected (GPS or card tap) → save + go home */
  function handleSaveAndGo({ zone, coords }) {
    const norm = {
      address:"", coords: coords||{lat:zone.lat,lng:zone.lng},
      zone, id:zone.id, short:zone.short, name:zone.nameHe,
      lat:zone.lat, lng:zone.lng, radius:zone.radius,
      type:"בית", notes:"",
    };
    onAddressSave?.(norm);
    navigate("/");
  }

  /* Friend location saved → go back to zone selector */
  function handleFriendSaved(entry) {
    // also update the main selected area to friend's zone
    onAddressSave?.({
      address: entry.address, coords: entry.coords,
      zone: entry.zone, id: entry.zone.id,
      short: entry.zone.short, name: entry.zone.nameHe,
      lat: entry.zone.lat, lng: entry.zone.lng,
      radius: entry.zone.radius,
      type: entry.typeEmoji, notes: "",
    });
    setStep(0);
  }

  if (step === 2) {
    return (
      <FriendMapPicker
        onBack={() => setStep(0)}
        onSaved={handleFriendSaved}
        cartCount={cartCount}
      />
    );
  }

  return (
    <ZoneSelector
      initialZone={startZone}
      onFamilyMap={() => setStep(2)}
      onSaveAndGo={handleSaveAndGo}
      cartCount={cartCount}
    />
  );
}

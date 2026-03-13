// AddressPickerPage.jsx — نسخة نهائية مستقرة
// • خريطة ثابتة لا تخرب
// • سهم Apple على موقع المستخدم الحقيقي
// • bounce-back ناعم لو خرج من المنطقة
// • يقبل initialZone من MapPage أو AddressPickerPage
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";

// نفس structure بتاع MapPage — يقبل short, name, nameHe كلها
const ZONES = [
  { id:"east",   short:"ראמה - מגאר - עראבה",    nameHe:"ראמה, סאגור, שזור",     lat:32.9078, lng:35.3524, radius:6500 },
  { id:"center", short:"כרמיאל - נחף - בעינה",   nameHe:"כרמיאל - נחף - בעינה",  lat:32.9178, lng:35.2999, radius:5000 },
  { id:"north",  short:"פקיעין - חורפיש - כסרה",  nameHe:"פקיעין - חורפיש - כסרה", lat:32.9873, lng:35.3220, radius:5500 },
];

function dist(a,b,c,d){
  const R=6371000,dl=((c-a)*Math.PI)/180,dg=((d-b)*Math.PI)/180;
  const x=Math.sin(dl/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dg/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
const inZ   = (lat,lng,z) => dist(lat,lng,z.lat,z.lng) <= z.radius * 1.12;
const bestZ = (lat,lng)   => ZONES.reduce((b,z)=>dist(lat,lng,z.lat,z.lng)<dist(lat,lng,b.lat,b.lng)?z:b, ZONES[0]);

// ממפה initialZone (כל מבנה) → zone מ-ZONES
function resolveZone(iz) {
  if (!iz) return null;
  // לפי id
  const byId = ZONES.find(z => z.id === iz.id);
  if (byId) return byId;
  // לפי lat/lng
  if (iz.lat && iz.lng) return bestZ(iz.lat, iz.lng);
  return null;
}

export default function AddressPickerPage({ onAddressSave, initialZone }) {
  const navigate    = useNavigate();
  const mapDiv      = useRef(null);
  const mapRef      = useRef(null);
  const userMark    = useRef(null);
  const bounceTimer = useRef(null);
  const searchTimer = useRef(null);
  const initDone    = useRef(false);

  const startZone = resolveZone(initialZone);
  const pinLat    = useRef(startZone?.lat || 32.9178);
  const pinLng    = useRef(startZone?.lng || 35.2999);
  const lockedZ   = useRef(startZone);

  const [mapReady,  setMapReady]  = useState(false);
  const [address,   setAddress]   = useState("מחפש כתובת...");
  const [zone,      setZone]      = useState(startZone);
  const [outZone,   setOutZone]   = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const [bouncing,  setBouncing]  = useState(false);
  const [geoLoad,   setGeoLoad]   = useState(false);
  const [searchQ,   setSearchQ]   = useState("");
  const [sugs,      setSugs]      = useState([]);
  const [searching, setSearching] = useState(false);
  const [toast,     setToast]     = useState("");
  const [street,    setStreet]    = useState("");
  const [building,  setBuilding]  = useState("");
  const [floor,     setFloor]     = useState("");
  const [apt,       setApt]       = useState("");
  const [notes,     setNotes]     = useState("");
  const [locType,   setLocType]   = useState("בית");
  const [saving,    setSaving]    = useState(false);

  // ── Init map — מחכה ל-Leaflet שנטען ב-index.html ──
  useEffect(() => {
    function tryInit() {
      if (initDone.current) return;
      if (!window.L)        return;
      if (!mapDiv.current)  return;
      initDone.current = true;
      initMap(window.L);
    }

    // אם כבר זמין
    tryInit();

    // אם עוד לא — מאזין לאירוע load
    const onLoad = () => tryInit();
    window.addEventListener("leaflet-ready", onLoad);

    // polling fallback כל 150ms עד 6 שניות
    const poll = setInterval(() => {
      if (window.L || initDone.current) {
        clearInterval(poll);
        tryInit();
      }
    }, 150);

    return () => {
      clearInterval(poll);
      window.removeEventListener("leaflet-ready", onLoad);
      clearTimeout(bounceTimer.current);
      clearTimeout(searchTimer.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initDone.current = false;
    };
  }, []);

  function initMap(L) {
    if (!mapDiv.current) return;
    const lat = pinLat.current;
    const lng = pinLng.current;

    const map = L.map(mapDiv.current, {
      center:             [lat, lng],
      zoom:               14,
      zoomControl:        false,
      attributionControl: false,
      tap:                false,
      fadeAnimation:      true,
      zoomAnimation:      true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom:19, crossOrigin:true, updateWhenIdle:false }
    ).addTo(map);

    // رسم حدود المناطق
    ZONES.forEach(z => {
      L.circle([z.lat, z.lng], {
        radius:      z.radius,
        color:       RED,
        weight:      2,
        opacity:     0.28,
        fillColor:   RED,
        fillOpacity: 0.05,
        dashArray:   "7,5",
        interactive: false,
      }).addTo(map);
    });

    mapRef.current = map;
    setMapReady(true);

    // Reverse geocode اولي
    doReverseGeo(lat, lng);

    // أحداث الخريطة
    map.on("movestart", () => setDragging(true));
    map.on("moveend", () => {
      setDragging(false);
      const c   = map.getCenter();
      const la  = c.lat, lg = c.lng;
      const lz  = lockedZ.current;

      if (lz && !inZ(la, lg, lz)) {
        // ── BOUNCE BACK ──────────────────────────
        setBouncing(true);
        setOutZone(true);
        showToast("↩ חוזר אוטומטית לאזור " + (lz.short || lz.nameHe || "").split(" -")[0].split(",")[0]);

        const d     = dist(la, lg, lz.lat, lz.lng);
        const ratio = (lz.radius * 1.05) / d;
        const bLat  = lz.lat + (la - lz.lat) * ratio;
        const bLng  = lz.lng + (lg - lz.lng) * ratio;

        bounceTimer.current = setTimeout(() => {
          map.flyTo([bLat, bLng], map.getZoom(), {
            animate:      true,
            duration:     0.5,
            easeLinearity: 0.25,
          });
          pinLat.current = bLat;
          pinLng.current = bLng;
          setTimeout(() => {
            setOutZone(false);
            setBouncing(false);
            doReverseGeo(bLat, bLng);
          }, 580);
        }, 60);
      } else {
        pinLat.current = la;
        pinLng.current = lg;
        setOutZone(false);
        const nz = bestZ(la, lg);
        setZone(nz);
        if (!lz) lockedZ.current = nz;
        doReverseGeo(la, lg);
      }
    });

    // موقع المستخدم الحقيقي
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude: ulat, longitude: ulng } = pos.coords;
      addUserDot(ulat, ulng, L, map);
      map.flyTo([ulat, ulng], 16, { animate:true, duration:0.8 });
      pinLat.current = ulat;
      pinLng.current = ulng;
      const nz = bestZ(ulat, ulng);
      setZone(nz);
      lockedZ.current = nz;
      doReverseGeo(ulat, ulng);
    }, () => {/* denied */});
  }

  function addUserDot(lat, lng, L, map) {
    if (userMark.current) { userMark.current.remove(); userMark.current = null; }
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:20px;height:20px;position:relative">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.22);animation:ygPulse 2s ease-out infinite"></div>
        <div style="position:absolute;inset:4px;border-radius:50%;background:#3B82F6;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.6)"></div>
      </div>`,
      iconSize:   [20,20],
      iconAnchor: [10,10],
    });
    userMark.current = L.marker([lat,lng],{icon,zIndexOffset:600,interactive:false}).addTo(map);
  }

  async function doReverseGeo(lat, lng) {
    setGeoLoad(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers:{"Accept-Language":"he"} }
      );
      const d = await r.json(), a = d.address||{};
      const st   = a.road||a.pedestrian||a.suburb||"";
      const city = a.city||a.town||a.village||"";
      const num  = a.house_number||"";
      const full = `${st}${num?" "+num:""}${city?", "+city:""}`.trim();
      const res  = full || d.display_name?.split(",")[0] || "מיקום נבחר";
      setAddress(res);
      if (st) setStreet(`${st}${num?" "+num:""}`);
    } catch { setAddress("מיקום נבחר"); }
    setGeoLoad(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(""),2200); }

  function goMyLocation() {
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude:lat, longitude:lng } = pos.coords;
      if (window.L && mapRef.current) addUserDot(lat, lng, window.L, mapRef.current);
      mapRef.current?.flyTo([lat,lng],17,{animate:true,duration:0.7});
      pinLat.current=lat; pinLng.current=lng;
      const nz=bestZ(lat,lng); setZone(nz); lockedZ.current=nz;
      setOutZone(false); doReverseGeo(lat,lng);
    });
  }

  function handleSearch(v) {
    setSearchQ(v);
    clearTimeout(searchTimer.current);
    if (!v.trim()) { setSugs([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v+" ישראל")}&format=json&limit=5&accept-language=he`
        );
        setSugs((await r.json()).slice(0,4));
      } catch {}
      setSearching(false);
    }, 450);
  }

  function pickSug(s) {
    const lat=parseFloat(s.lat), lng=parseFloat(s.lon);
    setSugs([]); setSearchQ(s.display_name.split(",")[0]);
    if (!ZONES.some(z=>inZ(lat,lng,z))) { showToast("🚫 הכתובת מחוץ לאזורי השירות שלנו"); return; }
    mapRef.current?.flyTo([lat,lng],17,{animate:true,duration:0.6});
    pinLat.current=lat; pinLng.current=lng;
    const nz=bestZ(lat,lng); setZone(nz); lockedZ.current=nz; setOutZone(false);
    setAddress(s.display_name.split(",")[0]);
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r=>setTimeout(r,300));
    const addr = [
      street,
      building ? `בניין ${building}` : "",
      floor    ? `קומה ${floor}`    : "",
      apt      ? `דירה ${apt}`      : "",
    ].filter(Boolean).join(", ");
    const saveZone = zone || lockedZ.current;
    onAddressSave?.({
      address: addr || address,
      coords:  { lat:pinLat.current, lng:pinLng.current },
      zone:    saveZone,
      // שמירת שדות תאימות עם MapPage
      id:      saveZone?.id,
      short:   saveZone?.short,
      name:    saveZone?.nameHe,
      lat:     saveZone?.lat,
      lng:     saveZone?.lng,
      radius:  saveZone?.radius,
      type:    locType,
      notes,
    });
    navigate(-1);
    setSaving(false);
  }

  const canSave = !outZone && !bouncing && mapReady;
  const pinOOZ  = outZone || bouncing;

  const INP = {
    width:"100%", border:"1.5px solid #E5E7EB", borderRadius:11,
    padding:"11px 13px", fontSize:14, outline:"none",
    background:"white", textAlign:"right", fontFamily:"Arial,sans-serif",
    boxSizing:"border-box", color:DARK, direction:"rtl",
  };
  const fo = e => { e.target.style.borderColor=RED; e.target.style.boxShadow=`0 0 0 3px rgba(200,16,46,0.1)`; };
  const bl = e => { e.target.style.borderColor="#E5E7EB"; e.target.style.boxShadow="none"; };

  const zoneName = (zone || lockedZ.current)?.short ||
                   (zone || lockedZ.current)?.nameHe || "";

  return (
    <>
      <div style={{
        position:"fixed", inset:0,
        display:"flex", flexDirection:"column",
        fontFamily:"Arial,sans-serif", direction:"rtl",
        background:"#F7F7F8", zIndex:200,
        maxWidth:430, margin:"0 auto",
        overflow:"hidden",
      }}>

        {/* HEADER */}
        <div style={{
          background:"white", flexShrink:0,
          padding:"10px 16px",
          borderBottom:"1px solid #F0F0F0",
          display:"flex", alignItems:"center", gap:12, zIndex:10,
        }}>
          <button onClick={()=>navigate(-1)} style={{
            width:38,height:38,borderRadius:12,background:"#F3F4F6",
            border:"none",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
              stroke={DARK} strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{flex:1, textAlign:"center"}}>
            <div style={{fontSize:15, fontWeight:900, color:DARK}}>פרטי מיקום</div>
            <div style={{
              fontSize:10, fontWeight:700, marginTop:2,
              color: pinOOZ ? "#EF4444" : zoneName ? "#16A34A" : GRAY,
              transition:"color 0.3s",
            }}>
              {bouncing  ? "↩ חוזר לאזור..." :
               outZone   ? "⚠️ מחוץ לאזור השירות" :
               zoneName  ? `✓ ${zoneName.split(" -")[0].split(",")[0]}` :
               "בחר מיקום"}
            </div>
          </div>
          <div style={{width:38}}/>
        </div>

        {/* SEARCH */}
        <div style={{
          background:"white", flexShrink:0,
          padding:"8px 14px 10px",
          borderBottom:"1px solid #F0F0F0",
          position:"relative", zIndex:9,
        }}>
          <div style={{
            display:"flex", alignItems:"center",
            background:"#F3F4F6", borderRadius:14,
            padding:"0 14px", border:"1.5px solid #E9EAEB",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2">
              <circle cx="11" cy="11" r="7.5"/>
              <path d="M17 17l3.5 3.5" strokeLinecap="round"/>
            </svg>
            <input value={searchQ} onChange={e=>handleSearch(e.target.value)}
              placeholder="חיפוש או הזנת כתובת"
              style={{
                flex:1,background:"none",border:"none",outline:"none",
                padding:"10px 10px",fontSize:13,
                textAlign:"right",fontFamily:"Arial,sans-serif",color:DARK,direction:"rtl",
              }}
            />
            {searching
              ? <div style={{width:15,height:15,borderRadius:"50%",border:"2px solid #eee",borderTopColor:RED,animation:"ygSpin .7s linear infinite",flexShrink:0}}/>
              : searchQ ? <button onClick={()=>{setSearchQ("");setSugs([]);}} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:GRAY,fontSize:14,lineHeight:1}}>✕</button>
              : null
            }
          </div>

          {sugs.length>0 && (
            <div style={{
              position:"absolute",top:"100%",left:14,right:14,
              background:"white",borderRadius:16,
              boxShadow:"0 10px 40px rgba(0,0,0,0.13)",
              border:"1px solid #E5E7EB",overflow:"hidden",zIndex:1000,
            }}>
              {sugs.map((s,i) => {
                const sl=parseFloat(s.lat),sg=parseFloat(s.lon);
                const ok=ZONES.some(z=>inZ(sl,sg,z));
                return (
                  <button key={i} onClick={()=>pickSug(s)} style={{
                    width:"100%",background:"none",border:"none",
                    padding:"11px 16px",textAlign:"right",cursor:"pointer",
                    display:"flex",alignItems:"center",gap:10,
                    borderBottom:i<sugs.length-1?"1px solid #F3F4F6":"none",
                    fontFamily:"Arial,sans-serif",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={ok?RED:"#D1D5DB"} style={{flexShrink:0}}>
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    </svg>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:DARK}}>{s.display_name.split(",")[0]}</div>
                      <div style={{fontSize:10,color:GRAY}}>{s.display_name.split(",").slice(1,3).join(",")}</div>
                    </div>
                    {!ok && <span style={{fontSize:9,color:"#EF4444",fontWeight:700,background:"#FEF2F2",padding:"2px 7px",borderRadius:6}}>מחוץ לאזור</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MAP — ارتفاع ثابت بالـ px */}
        <div style={{position:"relative", height:280, flexShrink:0}}>
          <div ref={mapDiv} style={{position:"absolute",inset:0,background:"#EEE8DC"}}/>

          {/* Loading */}
          {!mapReady && (
            <div style={{
              position:"absolute",inset:0,background:"rgba(255,255,255,0.9)",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,zIndex:5,
            }}>
              <div style={{width:38,height:38,borderRadius:"50%",border:`3px solid rgba(200,16,46,0.15)`,borderTopColor:RED,animation:"ygSpin .8s linear infinite"}}/>
              <span style={{color:GRAY,fontSize:13,fontWeight:600}}>טוען מפה...</span>
            </div>
          )}

          {/* CENTER PIN */}
          {mapReady && (
            <div style={{
              position:"absolute",
              top:"50%", left:"50%",
              transform:dragging ? "translate(-50%,-128%)" : "translate(-50%,-100%)",
              zIndex:4, pointerEvents:"none",
              transition:"transform .18s cubic-bezier(.34,1.56,.64,1)",
              filter:pinOOZ ? "none" : "drop-shadow(0 5px 10px rgba(200,16,46,.38))",
            }}>
              <div style={{
                width:46, height:46,
                background:pinOOZ?"#EF4444":"white",
                border:`3.5px solid ${pinOOZ?"#EF4444":RED}`,
                borderRadius:"50%",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:22,
                transition:"background .25s, border-color .25s",
              }}>{pinOOZ?"🚫":"📍"}</div>
              <div style={{width:0,height:0,borderLeft:"9px solid transparent",borderRight:"9px solid transparent",borderTop:`13px solid ${pinOOZ?"#EF4444":RED}`,margin:"0 auto"}}/>
              <div style={{width:dragging?6:12,height:dragging?2:4,background:"rgba(0,0,0,0.15)",borderRadius:"50%",margin:"2px auto",filter:"blur(2px)",transition:"all .2s"}}/>
            </div>
          )}

          {/* ADDRESS BUBBLE */}
          {mapReady && !pinOOZ && (
            <div style={{
              position:"absolute",
              top:"50%", left:"50%",
              transform:dragging ? "translate(-50%,-275%) scale(.93)" : "translate(-50%,-235%)",
              zIndex:3, pointerEvents:"none",
              transition:"transform .2s cubic-bezier(.34,1.4,.64,1), opacity .15s",
              opacity:dragging ? 0.65 : 1,
            }}>
              <div style={{
                background:"white",
                border:"1.5px solid rgba(200,16,46,.18)",
                borderRadius:20, padding:"5px 13px",
                fontSize:11, fontWeight:800, color:DARK,
                whiteSpace:"nowrap",
                boxShadow:"0 3px 14px rgba(0,0,0,0.11)",
                maxWidth:190, overflow:"hidden", textOverflow:"ellipsis",
              }}>
                {geoLoad
                  ? <span style={{color:GRAY}}>מחפש...</span>
                  : <><span style={{color:RED}}>📍 </span>{address.split(",")[0]}</>
                }
              </div>
              <div style={{width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderTop:"8px solid white",margin:"0 auto",filter:"drop-shadow(0 1px 1px rgba(0,0,0,.07))"}}/>
            </div>
          )}

          {/* TOAST */}
          {toast && (
            <div style={{
              position:"absolute",top:12,left:"50%",
              transform:"translateX(-50%)",zIndex:6,
              background:"rgba(17,24,39,.88)",
              backdropFilter:"blur(6px)",
              borderRadius:14,padding:"9px 18px",
              display:"flex",alignItems:"center",gap:8,
              boxShadow:"0 4px 20px rgba(0,0,0,.25)",
              whiteSpace:"nowrap",
              animation:"ygToast .3s cubic-bezier(.34,1.4,.64,1)",
            }}>
              <span style={{fontSize:15}}>⛔</span>
              <div style={{fontSize:11,fontWeight:800,color:"white"}}>{toast}</div>
            </div>
          )}

          {/* MY LOCATION */}
          <button onClick={goMyLocation} style={{
            position:"absolute",left:12,bottom:44,zIndex:5,
            width:42,height:42,background:"white",border:"none",
            borderRadius:"50%",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 3px 14px rgba(0,0,0,.17)",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" fill={RED} stroke="none"/>
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
              <circle cx="12" cy="12" r="8"/>
            </svg>
          </button>

          {/* ZOOM */}
          <div style={{position:"absolute",left:12,top:12,zIndex:5,display:"flex",flexDirection:"column",gap:5}}>
            {[["+",1],["-",-1]].map(([l,d])=>(
              <button key={l} onClick={()=>mapRef.current?.setZoom((mapRef.current.getZoom()||14)+d)} style={{
                width:36,height:36,background:"white",border:"1px solid rgba(0,0,0,.07)",
                borderRadius:9,fontSize:18,fontWeight:700,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 2px 8px rgba(0,0,0,.1)",color:DARK,
              }}>{l}</button>
            ))}
          </div>

          {/* DRAG HINT */}
          <div style={{
            position:"absolute",bottom:0,left:0,right:0,zIndex:5,
            background:"rgba(17,24,39,.8)",backdropFilter:"blur(4px)",
            padding:"8px 16px",
            display:"flex",alignItems:"center",justifyContent:"space-between",
          }}>
            <span style={{color:"white",fontSize:11,fontWeight:600}}>
              גרור את הסיכה למיקום המדויק לשליחת ההזמנה
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.8">
              <path d="M5 9l7-7 7 7M5 15l7 7 7-7"/>
            </svg>
          </div>
        </div>

        {/* FORM */}
        <div style={{
          flex:1, overflowY:"auto",
          background:"white",
          borderRadius:"20px 20px 0 0",
          marginTop:-16, position:"relative", zIndex:2,
          boxShadow:"0 -8px 30px rgba(0,0,0,.09)",
        }}>
          <div style={{padding:"10px 0 4px",display:"flex",justifyContent:"center"}}>
            <div style={{width:38,height:4,background:"#E5E7EB",borderRadius:2}}/>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 16px 12px"}}>
            <div style={{width:34,height:34,background:"rgba(200,16,46,.07)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={RED}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:900,color:DARK}}>פרטי כתובת</div>
              <div style={{fontSize:10,color:GRAY,marginTop:1}}>הזן את פרטי הכתובת שלך</div>
            </div>
            {zoneName && !pinOOZ && (
              <div style={{background:"#DCFCE7",borderRadius:20,padding:"3px 10px",display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:"#16A34A"}}/>
                <span style={{fontSize:9,fontWeight:800,color:"#16A34A"}}>
                  {zoneName.split(" -")[0].split(",")[0]}
                </span>
              </div>
            )}
          </div>

          <div style={{padding:"0 16px 40px"}}>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:GRAY,marginBottom:5}}>שם רחוב</div>
              <input style={INP} value={street} onChange={e=>setStreet(e.target.value)} placeholder="שם הרחוב ומספר הבית" onFocus={fo} onBlur={bl}/>
            </div>

            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {[
                {label:"מספר בניין",val:building,set:setBuilding,ph:"בניין"},
                {label:"קומה",      val:floor,   set:setFloor,   ph:"קומה",t:"number"},
                {label:"דירה",      val:apt,     set:setApt,     ph:"דירה"},
              ].map(f=>(
                <div key={f.label} style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:700,color:GRAY,marginBottom:5}}>{f.label}</div>
                  <input style={INP} value={f.val} type={f.t||"text"} onChange={e=>f.set(e.target.value)} placeholder={f.ph} onFocus={fo} onBlur={bl}/>
                </div>
              ))}
            </div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:GRAY,marginBottom:7}}>סוג מיקום</div>
              <div style={{display:"flex",gap:7}}>
                {[{k:"בית",e:"🏠"},{k:"משרד",e:"🏢"},{k:"מיקום אחר",e:"📍"}].map(t=>(
                  <button key={t.k} onClick={()=>setLocType(t.k)} style={{
                    flex:1,padding:"9px 4px",borderRadius:12,cursor:"pointer",
                    border:`1.5px solid ${locType===t.k?RED:"#E5E7EB"}`,
                    background:locType===t.k?"rgba(200,16,46,.06)":"white",
                    color:locType===t.k?RED:GRAY,
                    fontSize:10,fontWeight:700,
                    display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                    transition:"all .18s",fontFamily:"Arial,sans-serif",
                  }}>
                    <span style={{fontSize:18}}>{t.e}</span>{t.k}
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,color:GRAY,marginBottom:5}}>הוראות לשליח</div>
              <div style={{display:"flex",gap:8,background:"#F9FAFB",borderRadius:12,padding:"9px 12px",border:"1.5px solid #E5E7EB"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="1.8" style={{flexShrink:0,marginTop:2}}>
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="לדוגמה: ליד סניף הדואר הראשי..." style={{flex:1,background:"none",border:"none",outline:"none",resize:"none",fontSize:12,fontFamily:"Arial,sans-serif",color:DARK,minHeight:44,textAlign:"right",direction:"rtl"}}/>
              </div>
            </div>

            <button onClick={handleSave} disabled={!canSave||saving} style={{
              width:"100%",
              background:!canSave?"#D1D5DB":saving?GRAY:`linear-gradient(135deg,${RED},#9B0B22)`,
              border:"none",borderRadius:16,padding:"15px",
              color:"white",fontSize:15,fontWeight:900,
              cursor:!canSave||saving?"not-allowed":"pointer",
              boxShadow:canSave&&!saving?`0 4px 20px rgba(200,16,46,.38)`:"none",
              display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              transition:"all .25s",letterSpacing:.3,
            }}>
              {saving
                ? <><div style={{width:18,height:18,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,.4)",borderTopColor:"white",animation:"ygSpin .7s linear infinite"}}/>שומר...</>
                : pinOOZ ? "⛔ מחוץ לאזור השירות" : "הוספת אזור ✓"
              }
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ygSpin  { to { transform:rotate(360deg); } }
        @keyframes ygPulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(2.4);opacity:0} }
        @keyframes ygToast { from{opacity:0;transform:translateX(-50%) translateY(-6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        input::placeholder, textarea::placeholder { color:#9CA3AF; }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </>
  );
}

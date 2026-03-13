import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

// دوائر محددة بدقة من الصور — مركز + نصف قطر بالمتر
const AREAS = [
  {
    id: "rame",
    name: "ראמה - סגור - בית ג׳ן",
    emoji: "🏡",
    lat: 32.9386, lng: 35.3731,
    color: "#C8102E",
    circles: [
      { lat: 32.9386, lng: 35.3650, r: 1400 }, // ראמה
      { lat: 32.9270, lng: 35.3650, r: 700  }, // סגור
      { lat: 32.9530, lng: 35.4000, r: 900  }, // בית ג'ן
    ],
  },
  {
    id: "karmiel",
    name: "כרמיאל - נחף - שזור - חורפיש",
    emoji: "🏙️",
    lat: 32.9200, lng: 35.3050,
    color: "#2563eb",
    circles: [
      { lat: 32.9195, lng: 35.3030, r: 2200 }, // כרמיאל
      { lat: 32.9290, lng: 35.3240, r: 700  }, // נחף
      { lat: 32.9220, lng: 35.3400, r: 600  }, // שזור
      { lat: 33.0000, lng: 35.2980, r: 900  }, // חורפיש
    ],
  },
  {
    id: "magar",
    name: "מג׳אר",
    emoji: "🌿",
    lat: 32.8980, lng: 35.4028,
    color: "#16a34a",
    circles: [
      { lat: 32.8980, lng: 35.4028, r: 1600 }, // מג'אר
    ],
  },
  {
    id: "peki",
    name: "פקיעין - כסרא-סומיע",
    emoji: "🌲",
    lat: 32.9750, lng: 35.3280,
    color: "#9333ea",
    circles: [
      { lat: 32.9760, lng: 35.3310, r: 900  }, // פקיעין
      { lat: 32.9580, lng: 35.3250, r: 1400 }, // כסרא-סומיע
    ],
  },
];

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate    = useNavigate();
  const mapRef      = useRef(null);
  const leafRef     = useRef(null);
  const markersRef  = useRef({});
  const layersRef   = useRef([]);
  const [ready,     setReady]    = useState(false);
  const [selected,  setSelected] = useState(null);

  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    js.onload = () => setReady(true);
    document.head.appendChild(js);
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [32.930, 35.345], zoom: 11,
      zoomControl: false, attributionControl: false,
      minZoom: 9, maxZoom: 16,
    });
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);
    leafRef.current = map;

    AREAS.forEach(area => {
      const m = L.marker([area.lat, area.lng], {
        icon: makeIcon(area, false), zIndexOffset: 1000,
      }).addTo(map);
      m.on("click", e => { L.DomEvent.stopPropagation(e); onTap(area, map, L); });
      markersRef.current[area.id] = m;
    });

    map.on("click", deselect);
    return () => { map.remove(); leafRef.current = null; };
  }, [ready]);

  function makeIcon(area, active) {
    const color = area.color || C.red;
    return window.L.divIcon({
      html: `
        <div style="display:flex;flex-direction:column;align-items:center">
          <div style="
            width:46px;height:46px;border-radius:50%;
            background:${active ? color : "white"};
            border:2.5px solid ${color};
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 4px 18px ${color}55;
            transition:all 0.2s;
          ">
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="${active ? "white" : color}"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75
                   7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38
                   0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5
                   2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div style="width:0;height:0;
            border-left:7px solid transparent;
            border-right:7px solid transparent;
            border-top:10px solid ${color};
            margin-top:-1px">
          </div>
        </div>`,
      className: "", iconSize: [46, 58], iconAnchor: [23, 58],
    });
  }

  function clearLayers() {
    layersRef.current.forEach(l => leafRef.current?.removeLayer(l));
    layersRef.current = [];
  }

  function deselect() {
    clearLayers();
    AREAS.forEach(a => markersRef.current[a.id]?.setIcon(makeIcon(a, false)));
    setSelected(null);
  }

  function onTap(area, map, L) {
    AREAS.forEach(a => markersRef.current[a.id]?.setIcon(makeIcon(a, false)));
    markersRef.current[area.id]?.setIcon(makeIcon(area, true));
    clearLayers();
    setSelected(area);

    const allBounds = [];

    area.circles.forEach(({ lat, lng, r }) => {
      // الطبقة الخارجية — ناعمة شفافة
      const outer = L.circle([lat, lng], {
        radius: r,
        color: area.color,
        weight: 2,
        opacity: 0.6,
        fillColor: area.color,
        fillOpacity: 0.10,
        className: "smooth-circle",
      }).addTo(map);

      // الطبقة الداخلية — أكثر كثافة
      const inner = L.circle([lat, lng], {
        radius: r * 0.55,
        color: area.color,
        weight: 0,
        fillColor: area.color,
        fillOpacity: 0.12,
      }).addTo(map);

      // النقطة المركزية
      const dot = L.circleMarker([lat, lng], {
        radius: 4,
        color: "white",
        fillColor: area.color,
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);

      layersRef.current.push(outer, inner, dot);
      allBounds.push(outer.getBounds());
    });

    // flyToBounds لكل الدوائر
    if (allBounds.length) {
      let combined = allBounds[0];
      allBounds.forEach(b => { combined = combined.extend(b); });
      map.flyToBounds(combined, { padding: [50, 50], maxZoom: 14, duration: 0.9 });
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, fontFamily:"Arial,sans-serif", direction:"rtl" }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes slideUp { from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1} }
        @keyframes pulse   { 0%,100%{opacity:1}50%{opacity:0.6} }
        .leaflet-container { background:#e8e0d8 !important }
        .mBtn:active { transform:scale(0.92) }
        .smooth-circle path { stroke-linejoin:round; stroke-linecap:round }
      `}</style>

      {/* Header */}
      <div style={{
        position:"absolute",top:0,left:0,right:0,zIndex:1000,
        background:"white",boxShadow:"0 1px 0 rgba(0,0,0,0.07)",
        padding:"12px 16px",display:"flex",alignItems:"center",gap:12,
      }}>
        <button className="mBtn" onClick={()=>navigate(-1)} style={{
          background:"#F3F4F6",border:"none",borderRadius:12,
          width:38,height:38,cursor:"pointer",flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:16,fontWeight:900,color:C.dark}}>בחר אזור משלוח</div>
          <div style={{
            fontSize:11,marginTop:2,fontWeight:selected?800:400,
            color:selected?(AREAS.find(a=>a.id===selected.id)?.color||C.red):C.gray,
            transition:"color 0.3s",
          }}>
            {selected ? `✓ ${selected.name}` : "לחץ על סמן האזור שלך"}
          </div>
        </div>
        <div style={{width:38}}/>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{
        position:"absolute",top:62,left:0,right:0,
        bottom:selected?168:80,
        transition:"bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)",
      }}/>

      {/* Loading */}
      {!ready && (
        <div style={{position:"absolute",inset:0,zIndex:600,background:"white",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid rgba(200,16,46,0.15)",borderTopColor:C.red,animation:"spin 0.8s linear infinite"}}/>
          <div style={{color:C.gray,fontSize:13,fontWeight:700}}>טוען מפה...</div>
        </div>
      )}

      {/* Zoom */}
      <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",zIndex:900,display:"flex",flexDirection:"column",gap:6}}>
        {[["+",1],["-",-1]].map(([l,d])=>(
          <button key={l} className="mBtn"
            onClick={()=>leafRef.current?.setZoom((leafRef.current.getZoom()||11)+d)}
            style={{background:"white",border:"1px solid #E5E7EB",borderRadius:10,width:36,height:36,color:C.dark,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
            {l}
          </button>
        ))}
      </div>

      {/* Card */}
      {selected && (
        <div style={{
          position:"absolute",bottom:80,left:0,right:0,zIndex:1000,
          background:"white",borderRadius:"22px 22px 0 0",
          padding:"14px 20px 18px",
          boxShadow:"0 -6px 28px rgba(0,0,0,0.12)",
          animation:"slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1)",
        }}>
          <div style={{width:36,height:4,background:"#E5E7EB",borderRadius:2,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{
              width:48,height:48,borderRadius:14,
              background:`${AREAS.find(a=>a.id===selected.id)?.color}18`,
              border:`1.5px solid ${AREAS.find(a=>a.id===selected.id)?.color}33`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22,flexShrink:0,
            }}>{selected.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:900,color:C.dark}}>{selected.name}</div>
              <div style={{fontSize:12,marginTop:2,fontWeight:700,color:"#16a34a"}}>✓ אזור פעיל • משלוח זמין</div>
            </div>
            <button className="mBtn" onClick={deselect} style={{background:"#F3F4F6",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:C.gray}}>✕</button>
          </div>
          <button className="mBtn"
            onClick={()=>{ onAreaSelect?.(selected); navigate("/"); }}
            style={{
              width:"100%",
              background:`linear-gradient(135deg,${AREAS.find(a=>a.id===selected.id)?.color},${AREAS.find(a=>a.id===selected.id)?.color}cc)`,
              border:"none",borderRadius:16,padding:"15px",
              color:"white",fontSize:15,fontWeight:900,cursor:"pointer",
              boxShadow:`0 4px 18px ${AREAS.find(a=>a.id===selected.id)?.color}44`,
            }}>
            {`בחר ${selected.name} ←`}
          </button>
        </div>
      )}

      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:999}}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}

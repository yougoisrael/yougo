import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const RED = "#C8102E";
const DARK = "#0f172a";
const ZONES = [
  { id: "rame",    name: "ראמה - סגור - בית ג׳ן",       lat: 32.9386, lng: 35.3731, color: "#C8102E" },
  { id: "karmiel", name: "כרמיאל - נחף - שזור - חורפיש", lat: 32.9200, lng: 35.3050, color: "#2563eb" },
  { id: "magar",  name: "מג׳אר",                         lat: 32.8980, lng: 35.4028, color: "#16a34a" },
  { id: "peki",   name: "פקיעין - כסרא-סומיע",           lat: 32.9650, lng: 35.3150, color: "#9333ea" },
];

const TOOLS = [
  { id: "polygon",  icon: "✏️",  label: "מצולע חופשי" },
  { id: "circle",   icon: "⭕",  label: "עיגול" },
  { id: "rect",     icon: "▭",   label: "מלבן" },
  { id: "edit",     icon: "🔧",  label: "עריכת נקודות" },
];

export default function AdminZonesPage() {
  const navigate = useNavigate();
  const mapRef   = useRef(null);
  const leafRef  = useRef(null);
  const stateRef = useRef({
    tool: "polygon", zone: null, drawing: false,
    points: [], tempMarkers: [], tempPoly: null,
    allLayers: {}, history: [],
    circleCenter: null, circleMarker: null, circleLayer: null,
    rectStart: null, rectLayer: null,
  });

  const [ready,      setReady]      = useState(false);
  const [activeZone, setActiveZone] = useState(null);
  const [activeTool, setActiveTool] = useState("polygon");
  const [saved,      setSaved]      = useState({});
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState(null);
  const [pointCount, setPointCount] = useState(0);
  const [opacity,    setOpacity]    = useState(0.3);
  const [strokeW,    setStrokeW]    = useState(2.5);

  // Load Leaflet
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

  // Init map
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [32.930, 35.345], zoom: 11,
      zoomControl: false, attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    leafRef.current = map;

    // Load existing zones from Supabase
    loadZones();

    map.on("click",       onMapClick);
    map.on("dblclick",    onMapDblClick);
    map.on("mousemove",   onMapMouseMove);

    return () => { map.remove(); leafRef.current = null; };
  }, [ready]);

  async function loadZones() {
    try {
      const { data } = await supabase.from("delivery_zones").select("*");
      if (!data) return;
      const savedMap = {};
      data.forEach(z => {
        if (z.polygon) savedMap[z.id] = true;
      });
      setSaved(savedMap);
    } catch(e) {}
  }

  function showMsg(text, type = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  function getColor() {
    const z = ZONES.find(z => z.id === stateRef.current.zone);
    return z?.color || RED;
  }

  function clearTemp() {
    const L = window.L;
    const map = leafRef.current;
    if (!map || !L) return;
    const s = stateRef.current;
    s.tempMarkers.forEach(m => map.removeLayer(m));
    s.tempMarkers = [];
    if (s.tempPoly)    { map.removeLayer(s.tempPoly);    s.tempPoly = null; }
    if (s.circleMarker){ map.removeLayer(s.circleMarker); s.circleMarker = null; }
    if (s.circleLayer) { map.removeLayer(s.circleLayer);  s.circleLayer = null; }
    if (s.rectLayer)   { map.removeLayer(s.rectLayer);    s.rectLayer = null; }
    s.points = []; s.circleCenter = null; s.rectStart = null;
    s.drawing = false;
    setPointCount(0);
  }

  function onMapClick(e) {
    const s = stateRef.current;
    if (!s.zone) { showMsg("בחר אזור תחילה!", "error"); return; }
    const L = window.L;
    const map = leafRef.current;
    const { lat, lng } = e.latlng;
    const color = getColor();

    if (s.tool === "polygon") {
      s.drawing = true;
      s.points.push([lat, lng]);
      setPointCount(s.points.length);

      // dot marker
      const dot = L.circleMarker([lat, lng], {
        radius: 5, color, fillColor: "white",
        fillOpacity: 1, weight: 2,
      }).addTo(map);
      s.tempMarkers.push(dot);

      // update preview polygon
      if (s.tempPoly) map.removeLayer(s.tempPoly);
      if (s.points.length >= 2) {
        s.tempPoly = L.polygon(s.points, {
          color, weight: strokeW, opacity: 0.8,
          fillColor: color, fillOpacity: opacity,
          dashArray: "8,4",
        }).addTo(map);
      }
    }

    else if (s.tool === "circle") {
      if (!s.circleCenter) {
        s.circleCenter = [lat, lng];
        s.drawing = true;
        s.circleMarker = L.circleMarker([lat, lng], {
          radius: 8, color, fillColor: color, fillOpacity: 1,
        }).addTo(map);
        showMsg("עכשיו לחץ על נקודה שנייה להגדרת הרדיוס");
      } else {
        // calc radius
        const R = map.distance(s.circleCenter, [lat, lng]);
        if (s.circleLayer) map.removeLayer(s.circleLayer);
        s.circleLayer = L.circle(s.circleCenter, {
          radius: R, color, weight: strokeW, opacity: 0.85,
          fillColor: color, fillOpacity: opacity,
        }).addTo(map);
        s.points = [s.circleCenter, R]; // store center+radius
        setPointCount(1);
      }
    }

    else if (s.tool === "rect") {
      if (!s.rectStart) {
        s.rectStart = [lat, lng];
        s.drawing = true;
        showMsg("עכשיו לחץ על הפינה השנייה");
      } else {
        const bounds = L.latLngBounds(s.rectStart, [lat, lng]);
        if (s.rectLayer) map.removeLayer(s.rectLayer);
        s.rectLayer = L.rectangle(bounds, {
          color, weight: strokeW, opacity: 0.85,
          fillColor: color, fillOpacity: opacity,
        }).addTo(map);
        // convert rect to polygon points
        s.points = [
          [bounds.getNorth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()],
          [bounds.getSouth(), bounds.getEast()],
          [bounds.getSouth(), bounds.getWest()],
        ];
        setPointCount(4);
      }
    }
  }

  function onMapMouseMove(e) {
    const s = stateRef.current;
    if (!s.drawing) return;
    const L = window.L;
    const map = leafRef.current;
    const { lat, lng } = e.latlng;
    const color = getColor();

    if (s.tool === "polygon" && s.points.length >= 1) {
      if (s.tempPoly) map.removeLayer(s.tempPoly);
      s.tempPoly = L.polygon([...s.points, [lat, lng]], {
        color, weight: strokeW, opacity: 0.7,
        fillColor: color, fillOpacity: opacity * 0.6,
        dashArray: "8,4",
      }).addTo(map);
    }

    if (s.tool === "circle" && s.circleCenter) {
      const R = map.distance(s.circleCenter, [lat, lng]);
      if (s.circleLayer) map.removeLayer(s.circleLayer);
      s.circleLayer = L.circle(s.circleCenter, {
        radius: R, color, weight: strokeW, opacity: 0.6,
        fillColor: color, fillOpacity: opacity * 0.6, dashArray: "8,4",
      }).addTo(map);
    }

    if (s.tool === "rect" && s.rectStart) {
      const bounds = L.latLngBounds(s.rectStart, [lat, lng]);
      if (s.rectLayer) map.removeLayer(s.rectLayer);
      s.rectLayer = L.rectangle(bounds, {
        color, weight: strokeW, opacity: 0.6,
        fillColor: color, fillOpacity: opacity * 0.6, dashArray: "8,4",
      }).addTo(map);
    }
  }

  function onMapDblClick(e) {
    window.L?.DomEvent?.preventDefault(e);
    const s = stateRef.current;
    if (s.tool === "polygon" && s.points.length >= 3) {
      finishPolygon();
    }
  }

  function finishPolygon() {
    const s = stateRef.current;
    if (s.points.length < 3) { showMsg("צריך לפחות 3 נקודות!", "error"); return; }
    commitShape(s.points, "polygon");
  }

  function commitShape(points, type) {
    const s = stateRef.current;
    const L = window.L;
    const map = leafRef.current;
    const color = getColor();

    // save to history
    s.history.push({ zone: s.zone, type, points: [...points] });

    // draw final layer
    let layer;
    if (type === "polygon") {
      layer = L.polygon(points, {
        color, weight: strokeW, opacity: 0.9,
        fillColor: color, fillOpacity: opacity,
      }).addTo(map);
    } else if (type === "circle") {
      layer = L.circle(points[0], {
        radius: points[1], color, weight: strokeW, opacity: 0.9,
        fillColor: color, fillOpacity: opacity,
      }).addTo(map);
    }

    if (!s.allLayers[s.zone]) s.allLayers[s.zone] = [];
    s.allLayers[s.zone].push({ layer, type, points: [...points] });

    clearTemp();
    showMsg(`✅ צורה נוספה! לחץ שמור לשמירה`);
  }

  function undoLast() {
    const s = stateRef.current;
    const map = leafRef.current;
    if (!s.zone || !s.allLayers[s.zone]?.length) {
      clearTemp();
      return;
    }
    const last = s.allLayers[s.zone].pop();
    if (last?.layer) map.removeLayer(last.layer);
    s.history.pop();
    showMsg("↩ בוטל");
  }

  function clearZone() {
    const s = stateRef.current;
    const map = leafRef.current;
    if (!s.zone) return;
    (s.allLayers[s.zone] || []).forEach(({ layer }) => map.removeLayer(layer));
    s.allLayers[s.zone] = [];
    clearTemp();
    showMsg("🗑 נוקה");
  }

  function selectZone(zoneId) {
    clearTemp();
    stateRef.current.zone = zoneId;
    setActiveZone(zoneId);
    const z = ZONES.find(z => z.id === zoneId);
    leafRef.current?.flyTo([z.lat, z.lng], 13, { duration: 0.7 });
  }

  function selectTool(toolId) {
    clearTemp();
    stateRef.current.tool = toolId;
    setActiveTool(toolId);
  }

  async function saveZone() {
    const s = stateRef.current;
    if (!s.zone) { showMsg("בחר אזור!", "error"); return; }
    const layers = s.allLayers[s.zone] || [];
    if (!layers.length) { showMsg("אין צורות לשמירה!", "error"); return; }

    setSaving(true);
    try {
      // collect all polygons as arrays of [lat,lng]
      const polygons = layers.map(({ type, points }) => {
        if (type === "polygon") return points;
        if (type === "circle") {
          // approximate circle as polygon
          const [center, radius] = points;
          const pts = [];
          const L = window.L;
          const map = leafRef.current;
          for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * 2 * Math.PI;
            const pt = L.latLng(center).toBounds
              ? null
              : [
                  center[0] + (radius / 111320) * Math.cos(angle),
                  center[1] + (radius / (111320 * Math.cos(center[0] * Math.PI / 180))) * Math.sin(angle),
                ];
            if (pt) pts.push(pt);
          }
          return pts.length ? pts : points;
        }
        return points;
      });

      const z = ZONES.find(z => z.id === s.zone);
      await supabase.from("delivery_zones").upsert({
        id: s.zone,
        name: z.name,
        center_lat: z.lat,
        center_lng: z.lng,
        polygon: polygons,
        is_active: true,
      });

      setSaved(prev => ({ ...prev, [s.zone]: true }));
      showMsg("✅ נשמר בהצלחה!");
    } catch(e) {
      showMsg("שגיאה בשמירה", "error");
    }
    setSaving(false);
  }

  const zoneColor = ZONES.find(z => z.id === activeZone)?.color || RED;

  return (
    <div style={{ position:"fixed", inset:0, fontFamily:"'Segoe UI',Arial,sans-serif", direction:"rtl", background:DARK }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        .leaflet-container{background:#1e293b!important}
        .zBtn{transition:all 0.2s;cursor:pointer;border:none;outline:none;}
        .zBtn:active{transform:scale(0.93);}
        .tBtn{transition:all 0.18s;cursor:pointer;border:none;outline:none;}
        .tBtn:hover{filter:brightness(1.15);}
        .tBtn:active{transform:scale(0.9);}
        input[type=range]{accent-color:${zoneColor};}
      `}</style>

      {/* ─── Top Bar ─── */}
      <div style={{
        position:"absolute",top:0,left:0,right:0,zIndex:1000,
        background:"rgba(15,23,42,0.97)",backdropFilter:"blur(12px)",
        borderBottom:"1px solid rgba(255,255,255,0.08)",
        padding:"10px 14px",display:"flex",alignItems:"center",gap:10,
      }}>
        <button className="zBtn" onClick={()=>navigate(-1)} style={{
          background:"rgba(255,255,255,0.07)",borderRadius:10,
          width:36,height:36,color:"white",fontSize:18,flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>‹</button>

        <div style={{flex:1}}>
          <div style={{color:"white",fontWeight:800,fontSize:15}}>🗺️ ניהול מפות אזורים</div>
          {activeZone && (
            <div style={{fontSize:11,color:zoneColor,fontWeight:700,animation:"pulse 2s infinite"}}>
              ● {ZONES.find(z=>z.id===activeZone)?.name}
            </div>
          )}
        </div>

        {/* Save */}
        <button className="zBtn" onClick={saveZone} disabled={saving} style={{
          background:saving?"#374151":`linear-gradient(135deg,${zoneColor},${zoneColor}cc)`,
          borderRadius:12,padding:"8px 16px",color:"white",
          fontSize:13,fontWeight:800,
          boxShadow:saving?"none":`0 3px 14px ${zoneColor}55`,
        }}>
          {saving ? "⏳" : "💾 שמור"}
        </button>
      </div>

      {/* ─── Zone Selector ─── */}
      <div style={{
        position:"absolute",top:57,left:0,right:0,zIndex:900,
        background:"rgba(15,23,42,0.92)",backdropFilter:"blur(8px)",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        padding:"8px 10px",display:"flex",gap:6,overflowX:"auto",
      }}>
        {ZONES.map(z => {
          const isActive = activeZone === z.id;
          return (
            <button key={z.id} className="zBtn" onClick={()=>selectZone(z.id)} style={{
              flexShrink:0,
              background:isActive?z.color:"rgba(255,255,255,0.06)",
              border:`1.5px solid ${isActive?z.color:"rgba(255,255,255,0.1)"}`,
              borderRadius:20,padding:"5px 12px",
              color:"white",fontSize:11,fontWeight:isActive?800:500,
              display:"flex",alignItems:"center",gap:5,
            }}>
              <span style={{fontSize:9,opacity:0.8}}>{saved[z.id]?"✓":"○"}</span>
              {z.name.split(" - ")[0]}
            </button>
          );
        })}
      </div>

      {/* ─── Map ─── */}
      <div ref={mapRef} style={{
        position:"absolute",top:108,left:0,right:0,bottom:180,
      }}/>

      {/* ─── Drawing Hint ─── */}
      {activeZone && (
        <div style={{
          position:"absolute",top:120,left:"50%",transform:"translateX(-50%)",
          zIndex:800,background:"rgba(15,23,42,0.85)",backdropFilter:"blur(8px)",
          border:`1px solid ${zoneColor}44`,borderRadius:20,
          padding:"5px 14px",color:"white",fontSize:11,fontWeight:700,
          pointerEvents:"none",whiteSpace:"nowrap",
        }}>
          {activeTool==="polygon" && pointCount===0 && "לחץ על המפה להוספת נקודות"}
          {activeTool==="polygon" && pointCount>0 && `${pointCount} נקודות • לחץ פעמיים לסיום`}
          {activeTool==="circle"  && "לחץ מרכז → לחץ קצה לרדיוס"}
          {activeTool==="rect"    && "לחץ פינה ראשונה → לחץ פינה שנייה"}
        </div>
      )}

      {/* ─── Zoom Buttons ─── */}
      <div style={{
        position:"absolute",left:12,top:"45%",transform:"translateY(-50%)",
        zIndex:800,display:"flex",flexDirection:"column",gap:5,
      }}>
        {[["+",1],["-",-1]].map(([l,d])=>(
          <button key={l} className="zBtn" onClick={()=>leafRef.current?.setZoom((leafRef.current.getZoom()||11)+d)}
            style={{background:"rgba(15,23,42,0.9)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,width:34,height:34,color:"white",fontSize:18,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {l}
          </button>
        ))}
      </div>

      {/* ─── Bottom Panel ─── */}
      <div style={{
        position:"absolute",bottom:0,left:0,right:0,zIndex:1000,
        background:"rgba(15,23,42,0.97)",backdropFilter:"blur(12px)",
        borderTop:"1px solid rgba(255,255,255,0.08)",
        padding:"12px 14px 16px",
      }}>

        {/* Tools */}
        <div style={{display:"flex",gap:6,marginBottom:12,justifyContent:"center"}}>
          {TOOLS.filter(t=>t.id!=="edit").map(t=>{
            const isActive = activeTool===t.id;
            return (
              <button key={t.id} className="tBtn" onClick={()=>selectTool(t.id)} style={{
                flex:1,background:isActive?`linear-gradient(135deg,${zoneColor},${zoneColor}bb)`:"rgba(255,255,255,0.06)",
                border:`1.5px solid ${isActive?zoneColor:"rgba(255,255,255,0.1)"}`,
                borderRadius:14,padding:"8px 4px",
                color:"white",
                display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                boxShadow:isActive?`0 3px 12px ${zoneColor}44`:"none",
              }}>
                <span style={{fontSize:18}}>{t.icon}</span>
                <span style={{fontSize:9,fontWeight:700,opacity:isActive?1:0.6}}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sliders */}
        <div style={{display:"flex",gap:14,marginBottom:10,alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:10,marginBottom:3}}>שקיפות מילוי</div>
            <input type="range" min="0" max="0.6" step="0.05" value={opacity}
              onChange={e=>setOpacity(+e.target.value)}
              style={{width:"100%",height:4}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:10,marginBottom:3}}>עובי קו</div>
            <input type="range" min="1" max="6" step="0.5" value={strokeW}
              onChange={e=>setStrokeW(+e.target.value)}
              style={{width:"100%",height:4}}/>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{display:"flex",gap:6}}>
          <button className="tBtn" onClick={undoLast} style={{
            flex:1,background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",
            borderRadius:12,padding:"9px",color:"#fbbf24",fontSize:12,fontWeight:700,
          }}>↩ ביטול</button>
          <button className="tBtn" onClick={clearZone} style={{
            flex:1,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",
            borderRadius:12,padding:"9px",color:"#f87171",fontSize:12,fontWeight:700,
          }}>🗑 נקה הכל</button>
          <button className="tBtn" onClick={finishPolygon} disabled={activeTool!=="polygon"} style={{
            flex:1,
            background:activeTool==="polygon"?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.04)",
            border:`1px solid ${activeTool==="polygon"?"rgba(34,197,94,0.4)":"rgba(255,255,255,0.08)"}`,
            borderRadius:12,padding:"9px",
            color:activeTool==="polygon"?"#4ade80":"rgba(255,255,255,0.2)",
            fontSize:12,fontWeight:700,
          }}>✓ סיים</button>
        </div>
      </div>

      {/* ─── Toast ─── */}
      {msg && (
        <div style={{
          position:"absolute",top:115,left:"50%",transform:"translateX(-50%)",
          zIndex:2000,background:msg.type==="error"?"#7f1d1d":"#14532d",
          border:`1px solid ${msg.type==="error"?"#dc2626":"#16a34a"}`,
          borderRadius:16,padding:"8px 18px",color:"white",
          fontSize:13,fontWeight:700,whiteSpace:"nowrap",
          animation:"fadeIn 0.25s ease",boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
        }}>{msg.text}</div>
      )}

      {/* Loading */}
      {!ready && (
        <div style={{position:"absolute",inset:0,zIndex:3000,background:DARK,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:40,height:40,borderRadius:"50%",border:"3px solid rgba(200,16,46,0.2)",borderTopColor:RED,animation:"spin 0.8s linear infinite"}}/>
        </div>
      )}
    </div>
  );
}

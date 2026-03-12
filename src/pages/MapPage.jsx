import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

// 4 مناطق — كل واحدة بقائمة قرى
const AREA_GROUPS = [
  {
    id:     "rame_group",
    name:   "ראמה - סגור - בית ג׳ן",
    emoji:  "🏡",
    color:  "#C8102E",
    // اسم كل قرية بالعربي لـ Overpass
    queries: ["ראמה", "סגור", "בית ג'ן"],
    fallbackPolygons: [
      // ראמה
      [[32.9550,35.3580],[32.9580,35.3780],[32.9520,35.3950],[32.9400,35.4000],[32.9280,35.3950],[32.9220,35.3800],[32.9240,35.3600],[32.9350,35.3500]],
      // סגור
      [[32.9280,35.3280],[32.9300,35.3420],[32.9220,35.3500],[32.9100,35.3460],[32.9060,35.3340],[32.9120,35.3240]],
      // בית ג'ן
      [[32.9780,35.3900],[32.9820,35.4180],[32.9680,35.4250],[32.9560,35.4160],[32.9540,35.3940],[32.9640,35.3820]],
    ],
    fallbackCenter: [32.942, 35.375],
  },
  {
    id:     "karmiel_group",
    name:   "כרמיאל - נחף - מג׳ד - שזור",
    emoji:  "🏙️",
    color:  "#C8102E",
    queries: ["כרמיאל", "נחף", "מגד אל-כרום", "שזור"],
    fallbackPolygons: [
      // כרמיאל
      [[32.9280,35.2720],[32.9300,35.3080],[32.9220,35.3220],[32.9080,35.3200],[32.9000,35.3050],[32.9020,35.2780],[32.9140,35.2680]],
      // נחף
      [[32.9680,35.3080],[32.9700,35.3350],[32.9600,35.3420],[32.9480,35.3360],[32.9440,35.3180],[32.9500,35.3050]],
      // מג'ד
      [[32.9120,35.3380],[32.9140,35.3600],[32.9020,35.3660],[32.8900,35.3600],[32.8880,35.3420],[32.8980,35.3340]],
      // שזור
      [[32.9450,35.2950],[32.9470,35.3150],[32.9360,35.3200],[32.9260,35.3120],[32.9260,35.2960],[32.9350,35.2880]],
    ],
    fallbackCenter: [32.932, 35.310],
  },
  {
    id:     "magar",
    name:   "מג׳אר",
    emoji:  "🌿",
    color:  "#C8102E",
    queries: ["מג'אר"],
    fallbackPolygons: [
      [[32.9120,35.3880],[32.9140,35.4080],[32.9080,35.4200],[32.8950,35.4240],[32.8820,35.4180],[32.8780,35.4050],[32.8820,35.3900],[32.8950,35.3820]],
    ],
    fallbackCenter: [32.898, 35.403],
  },
  {
    id:     "peki_group",
    name:   "פקיעין - כ׳ סמיע - כסרא",
    emoji:  "🌲",
    color:  "#C8102E",
    queries: ["פקיעין", "כפר סמיע", "כסרא-סמיע"],
    fallbackPolygons: [
      // פקיעין
      [[32.9920,35.3020],[32.9950,35.3200],[32.9920,35.3380],[32.9800,35.3450],[32.9660,35.3400],[32.9620,35.3240],[32.9680,35.3060],[32.9800,35.2960]],
      // כפר סמיע
      [[32.9550,35.2650],[32.9570,35.2850],[32.9460,35.2920],[32.9340,35.2860],[32.9320,35.2680],[32.9420,35.2600]],
      // כסרא
      [[32.9750,35.3350],[32.9770,35.3530],[32.9660,35.3600],[32.9540,35.3540],[32.9520,35.3370],[32.9620,35.3280]],
    ],
    fallbackCenter: [32.962, 35.312],
  },
];

// Fetch real boundary from Overpass
async function fetchVillageBoundary(nameHe) {
  const query = `
    [out:json][timeout:15];
    relation["name:he"="${nameHe}"]["boundary"="administrative"]["admin_level"~"^(8|9|10)$"];
    out geom;
  `;
  const r = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });
  const data = await r.json();
  const rel = data.elements?.[0];
  if (!rel?.members) return null;

  // Collect outer way coordinates
  const coords = [];
  for (const m of rel.members) {
    if (m.role === "outer" && m.geometry?.length > 0) {
      for (const pt of m.geometry) {
        coords.push([pt.lat, pt.lon]);
      }
    }
  }
  return coords.length > 3 ? coords : null;
}

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate    = useNavigate();
  const mapRef      = useRef(null);
  const leafRef     = useRef(null);
  const polyRef     = useRef({});
  const labelRef    = useRef(null);
  const [ready,     setReady]    = useState(false);
  const [selected,  setSelected] = useState(null);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [areas,     setAreas]    = useState(null); // null = loading

  // ── 1. Load Leaflet ───────────────────────────
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

  // ── 2. Fetch real boundaries ──────────────────
  useEffect(() => {
    async function load() {
      const result = [];
      for (const group of AREA_GROUPS) {
        const polygons = [];
        let anyReal = false;
        for (let i = 0; i < group.queries.length; i++) {
          try {
            const coords = await fetchVillageBoundary(group.queries[i]);
            if (coords && coords.length > 3) {
              polygons.push({ coords, real: true });
              anyReal = true;
            } else {
              polygons.push({ coords: group.fallbackPolygons[i] || [], real: false });
            }
          } catch {
            polygons.push({ coords: group.fallbackPolygons[i] || [], real: false });
          }
        }
        // Compute center from all coords
        const allCoords = polygons.flatMap(p => p.coords);
        const center = allCoords.length
          ? [
              allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length,
              allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length,
            ]
          : group.fallbackCenter;

        result.push({ ...group, polygons, center });
      }
      setAreas(result);
      setLoadingAreas(false);
    }
    load();
  }, []);

  // ── 3. Init map ───────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [32.935, 35.340],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
      minZoom: 8,
      maxZoom: 15,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    leafRef.current = map;

    map.on("click", () => {
      clearLabel();
      resetPolys();
      setSelected(null);
    });

    return () => {
      map.remove();
      leafRef.current  = null;
      polyRef.current  = {};
      labelRef.current = null;
    };
  }, [ready]);

  // ── 4. Draw polygons when areas loaded ────────
  useEffect(() => {
    if (!areas || !leafRef.current || !window.L) return;
    const L   = window.L;
    const map = leafRef.current;

    // Remove old layers
    Object.values(polyRef.current).forEach(layers =>
      layers.forEach(l => map.removeLayer(l))
    );
    polyRef.current = {};

    areas.forEach(group => {
      const layers = [];

      group.polygons.forEach(({ coords }) => {
        if (!coords?.length) return;
        const poly = L.polygon(coords, {
          color:       group.color,
          weight:      2,
          opacity:     0.85,
          fillColor:   group.color,
          fillOpacity: 0.14,
          smoothFactor: 1,
        }).addTo(map);

        poly.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          clearLabel();
          resetPolys();

          // Highlight all polygons of this group
          (polyRef.current[group.id] || []).forEach(l =>
            l.setStyle({ fillOpacity: 0.30, weight: 3, opacity: 1 })
          );

          // Label in center
          const lbl = L.marker(group.center, {
            icon: L.divIcon({
              html: `<div style="
                background:${group.color};
                color:white;
                padding:8px 16px;
                border-radius:22px;
                font-size:13px;
                font-weight:900;
                white-space:nowrap;
                box-shadow:0 4px 18px rgba(200,16,46,0.45);
                font-family:Arial,sans-serif;
                direction:rtl;
              ">${group.emoji} ${group.name}</div>`,
              className:  "",
              iconSize:   [0, 0],
              iconAnchor: [-4, 40],
            }),
            interactive:   false,
            zIndexOffset:  2000,
          }).addTo(map);

          labelRef.current = lbl;
          map.flyToBounds(
            L.polygon(group.polygons.flatMap(p => p.coords)).getBounds(),
            { padding: [40, 40], duration: 0.6, maxZoom: 13 }
          );
          setSelected(group);
        });

        layers.push(poly);
      });

      polyRef.current[group.id] = layers;
    });
  }, [areas]);

  function clearLabel() {
    if (labelRef.current && leafRef.current) {
      leafRef.current.removeLayer(labelRef.current);
      labelRef.current = null;
    }
  }

  function resetPolys() {
    Object.values(polyRef.current).forEach(layers =>
      layers.forEach(l =>
        l.setStyle({ fillOpacity: 0.14, weight: 2, opacity: 0.85 })
      )
    );
  }

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
        @keyframes slideUp { from { transform: translateY(110%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        .leaflet-container { background: #f0ece4 !important; }
        .mBtn:active { transform: scale(0.91); }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        position:"absolute",top:0,left:0,right:0,zIndex:1000,
        background:"white",boxShadow:"0 1px 0 rgba(0,0,0,0.07)",
        padding:"12px 16px",
        display:"flex",alignItems:"center",gap:12,
      }}>
        <button className="mBtn" onClick={() => navigate(-1)} style={{
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
          <div style={{fontSize:16,fontWeight:900,color:C.dark}}>
            בחר אזור משלוח
          </div>
          <div style={{fontSize:11,marginTop:1,
            fontWeight: selected ? 800 : 400,
            color: selected ? C.red : C.gray,
            transition:"color 0.25s",
          }}>
            {selected ? `✓ ${selected.name} נבחר` : "לחץ על האזור שלך במפה"}
          </div>
        </div>

        <div style={{width:38}}/>
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{
        position:"absolute",
        top:62,left:0,right:0,
        bottom: selected ? 162 : 80,
        transition:"bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)",
      }}/>

      {/* ── Loading overlay ── */}
      {(!ready || loadingAreas) && (
        <div style={{
          position:"absolute",inset:0,zIndex:600,
          background:"white",
          display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",gap:14,
        }}>
          <div style={{
            width:48,height:48,borderRadius:"50%",
            border:"3px solid rgba(200,16,46,0.15)",
            borderTopColor:C.red,
            animation:"spin 0.8s linear infinite",
          }}/>
          <div style={{color:C.gray,fontSize:13,fontWeight:700}}>
            {!ready ? "טוען מפה..." : "טוען גבולות אזורים..."}
          </div>
          <div style={{color:"#9CA3AF",fontSize:11}}>
            מביא נתונים עדכניים מ-OpenStreetMap
          </div>
        </div>
      )}

      {/* ── Zoom ── */}
      <div style={{
        position:"absolute",left:12,top:"50%",
        transform:"translateY(-50%)",zIndex:900,
        display:"flex",flexDirection:"column",gap:6,
      }}>
        {[["+",1],["-",-1]].map(([l,d])=>(
          <button key={l} className="mBtn"
            onClick={()=>leafRef.current?.setZoom(
              (leafRef.current.getZoom()||10)+d
            )}
            style={{
              background:"white",border:"1px solid #E5E7EB",
              borderRadius:10,width:36,height:36,
              color:C.dark,fontSize:18,fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
            }}>{l}
          </button>
        ))}
      </div>

      {/* ── Selected card ── */}
      {selected && (
        <div style={{
          position:"absolute",bottom:80,left:0,right:0,zIndex:1000,
          background:"white",borderRadius:"22px 22px 0 0",
          padding:"14px 20px 18px",
          boxShadow:"0 -6px 28px rgba(0,0,0,0.13)",
          animation:"slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1)",
        }}>
          <div style={{width:36,height:4,background:"#E5E7EB",borderRadius:2,margin:"0 auto 14px"}}/>

          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{
              width:48,height:48,borderRadius:14,
              background:"rgba(200,16,46,0.07)",
              border:"1.5px solid rgba(200,16,46,0.18)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22,flexShrink:0,
            }}>
              {selected.emoji}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:900,color:C.dark}}>
                {selected.name}
              </div>
              <div style={{fontSize:12,color:"#16a34a",fontWeight:700,marginTop:2}}>
                ✓ אזור פעיל • משלוח זמין
              </div>
            </div>
            <button className="mBtn" onClick={()=>{
              clearLabel();
              resetPolys();
              setSelected(null);
            }} style={{
              background:"#F3F4F6",border:"none",borderRadius:"50%",
              width:30,height:30,cursor:"pointer",flexShrink:0,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,color:C.gray,
            }}>✕</button>
          </div>

          <button className="mBtn" onClick={handleConfirm} style={{
            width:"100%",
            background:`linear-gradient(135deg,${C.red},#a00020)`,
            border:"none",borderRadius:16,padding:"15px",
            color:"white",fontSize:15,fontWeight:900,cursor:"pointer",
            boxShadow:"0 4px 18px rgba(200,16,46,0.35)",
          }}>
            בחר {selected.name} ←
          </button>
        </div>
      )}

      {/* ── BottomNav ── */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:999}}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}

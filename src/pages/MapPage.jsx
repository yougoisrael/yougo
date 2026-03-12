import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

const AREAS = [
  {
    id:      "rame",
    name:    "ראמה - סגור - בית ג׳ן",
    emoji:   "🏡",
    lat:     32.9386, lng: 35.3731,
    // Nominatim OSM IDs לכל כפר — relation IDs מ-OpenStreetMap
    osmIds:  ["R7677399", "R7677395", "R7677389"], // ראמה, סגור, בית ג'ן
  },
  {
    id:      "karmiel",
    name:    "כרמיאל - נחף - מג׳ד - שזור",
    emoji:   "🏙️",
    lat:     32.9200, lng: 35.3050,
    osmIds:  ["R1389220", "R7677393", "R7677391", "R7677397"], // כרמיאל, נחף, מג'ד, שזור
  },
  {
    id:      "magar",
    name:    "מג׳אר",
    emoji:   "🌿",
    lat:     32.8980, lng: 35.4028,
    osmIds:  ["R7677401"],
  },
  {
    id:      "peki",
    name:    "פקיעין - כ׳ סמיע - כסרא",
    emoji:   "🌲",
    lat:     32.9650, lng: 35.3150,
    osmIds:  ["R7677403", "R7677405", "R7677407"],
  },
];

// Fetch real polygon from Nominatim using OSM relation ID
async function fetchPolygon(osmId) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/lookup?osm_ids=${osmId}&format=json&polygon_geojson=1`,
      { headers: { "User-Agent": "YougoApp/1.0" } }
    );
    const data = await r.json();
    const geojson = data?.[0]?.geojson;
    if (!geojson) return null;

    // Extract coordinates from Polygon or MultiPolygon
    if (geojson.type === "Polygon") {
      return [geojson.coordinates[0].map(([lng, lat]) => [lat, lng])];
    } else if (geojson.type === "MultiPolygon") {
      return geojson.coordinates.map(p => p[0].map(([lng, lat]) => [lat, lng]));
    }
  } catch { return null; }
  return null;
}

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate    = useNavigate();
  const mapRef      = useRef(null);
  const leafRef     = useRef(null);
  const markersRef  = useRef({});
  const polysRef    = useRef([]);       // active drawn polygons
  const cacheRef    = useRef({});       // cache fetched polygons
  const [ready,     setReady]    = useState(false);
  const [selected,  setSelected] = useState(null);
  const [loadingPoly, setLoadingPoly] = useState(false);

  // ── Load Leaflet ──────────────────────────────
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

  // ── Init map + pins ───────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [32.935, 35.350],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      minZoom: 9, maxZoom: 15,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    leafRef.current = map;

    AREAS.forEach(area => {
      const marker = L.marker([area.lat, area.lng], {
        icon: L.divIcon({
          html: `
            <div class="yg-pin" id="pin-${area.id}">
              <div class="yg-pin-circle">
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="${C.red}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div class="yg-pin-tail"></div>
            </div>
          `,
          className:  "",
          iconSize:   [44, 56],
          iconAnchor: [22, 56],
        }),
      }).addTo(map);

      marker.on("click", e => {
        L.DomEvent.stopPropagation(e);
        handleTap(area, map, L);
      });

      markersRef.current[area.id] = marker;
    });

    map.on("click", () => deselect(map));

    return () => {
      map.remove();
      leafRef.current  = null;
      markersRef.current = {};
      polysRef.current   = [];
      cacheRef.current   = {};
    };
  }, [ready]);

  async function handleTap(area, map, L) {
    // Reset all pins
    AREAS.forEach(a => setPinStyle(a.id, false));
    // Activate tapped pin
    setPinStyle(area.id, true);
    // Clear old polygons
    clearPolys(map);
    setSelected(area);
    setLoadingPoly(true);

    // Check cache first
    let polygonData = cacheRef.current[area.id];

    if (!polygonData) {
      // Fetch all villages in parallel
      const results = await Promise.all(
        area.osmIds.map(id => fetchPolygon(id))
      );
      polygonData = results.filter(Boolean).flat();
      if (polygonData.length) cacheRef.current[area.id] = polygonData;
    }

    setLoadingPoly(false);

    if (!leafRef.current) return;
    const currentMap = leafRef.current;

    if (polygonData && polygonData.length) {
      // Draw real polygons
      const allBounds = [];
      polygonData.forEach(coords => {
        if (!coords?.length) return;
        const poly = L.polygon(coords, {
          color:       C.red,
          weight:      2.5,
          opacity:     0.9,
          fillColor:   C.red,
          fillOpacity: 0.18,
          smoothFactor: 1.5,
        }).addTo(currentMap);
        polysRef.current.push(poly);
        allBounds.push(...coords);
      });

      if (allBounds.length) {
        currentMap.flyToBounds(
          L.latLngBounds(allBounds),
          { padding: [50, 50], maxZoom: 13, duration: 0.7 }
        );
      }
    } else {
      // Fallback: fly to center only
      currentMap.flyTo([area.lat, area.lng], 13, { duration: 0.6 });
    }
  }

  function clearPolys(map) {
    const m = map || leafRef.current;
    polysRef.current.forEach(p => m?.removeLayer(p));
    polysRef.current = [];
  }

  function deselect(map) {
    clearPolys(map);
    AREAS.forEach(a => setPinStyle(a.id, false));
    setSelected(null);
    setLoadingPoly(false);
  }

  function setPinStyle(id, active) {
    const el     = document.getElementById(`pin-${id}`);
    if (!el) return;
    const circle = el.querySelector(".yg-pin-circle");
    const svg    = el.querySelector("path");
    if (circle) {
      circle.style.background  = active ? C.red : "white";
      circle.style.boxShadow   = active
        ? `0 4px 16px rgba(200,16,46,0.55)`
        : `0 3px 12px rgba(200,16,46,0.25)`;
      circle.style.transform   = active ? "scale(1.22)" : "scale(1)";
    }
    if (svg) svg.setAttribute("fill", active ? "white" : C.red);
  }

  return (
    <div style={{ position:"fixed", inset:0, fontFamily:"Arial,sans-serif", direction:"rtl" }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes slideUp { from { transform:translateY(110%);opacity:0; } to { transform:translateY(0);opacity:1; } }
        @keyframes pinPop  { 0%{transform:scale(0.4)opacity:0} 80%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        .leaflet-container { background:#f0ece4!important; }
        .mBtn:active { transform:scale(0.91); }
        .yg-pin { display:flex;flex-direction:column;align-items:center;animation:pinPop 0.3s ease; }
        .yg-pin-circle {
          width:44px;height:44px;border-radius:50%;
          background:white;border:2.5px solid ${C.red};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 12px rgba(200,16,46,0.25);
          transition:all 0.22s ease;cursor:pointer;
        }
        .yg-pin-tail {
          width:0;height:0;
          border-left:7px solid transparent;
          border-right:7px solid transparent;
          border-top:10px solid ${C.red};
          margin-top:-1px;
        }
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
          <div style={{fontSize:16,fontWeight:900,color:C.dark}}>בחר אזור משלוח</div>
          <div style={{fontSize:11,marginTop:1,transition:"color 0.25s",
            fontWeight:selected?800:400,
            color:selected?C.red:C.gray,
          }}>
            {selected
              ? loadingPoly ? "טוען גבולות..." : `✓ ${selected.name}`
              : "לחץ על סמן האזור שלך"}
          </div>
        </div>
        <div style={{width:38}}/>
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{
        position:"absolute",
        top:62,left:0,right:0,
        bottom:selected ? 162 : 80,
        transition:"bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)",
      }}/>

      {/* ── Leaflet loading ── */}
      {!ready && (
        <div style={{
          position:"absolute",inset:0,zIndex:600,background:"white",
          display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",gap:14,
        }}>
          <div style={{
            width:44,height:44,borderRadius:"50%",
            border:"3px solid rgba(200,16,46,0.15)",
            borderTopColor:C.red,
            animation:"spin 0.8s linear infinite",
          }}/>
          <div style={{color:C.gray,fontSize:13,fontWeight:700}}>טוען מפה...</div>
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
            onClick={()=>leafRef.current?.setZoom((leafRef.current.getZoom()||11)+d)}
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
            }}>{selected.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:900,color:C.dark}}>{selected.name}</div>
              <div style={{fontSize:12,marginTop:2,
                color:loadingPoly?"#f59e0b":"#16a34a",fontWeight:700,
              }}>
                {loadingPoly ? "⏳ טוען גבולות אזור..." : "✓ אזור פעיל • משלוח זמין"}
              </div>
            </div>
            <button className="mBtn" onClick={()=>deselect(leafRef.current)} style={{
              background:"#F3F4F6",border:"none",borderRadius:"50%",
              width:30,height:30,cursor:"pointer",flexShrink:0,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,color:C.gray,
            }}>✕</button>
          </div>

          <button className="mBtn"
            onClick={()=>{ onAreaSelect?.(selected); navigate("/"); }}
            style={{
              width:"100%",
              background:loadingPoly
                ? "#9CA3AF"
                : `linear-gradient(135deg,${C.red},#a00020)`,
              border:"none",borderRadius:16,padding:"15px",
              color:"white",fontSize:15,fontWeight:900,cursor:"pointer",
              boxShadow:loadingPoly?"none":"0 4px 18px rgba(200,16,46,0.35)",
              transition:"background 0.3s",
            }}>
            {loadingPoly ? "⏳ רגע..." : `בחר ${selected.name} ←`}
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

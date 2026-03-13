import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

// GitHub raw URLs للـ GeoJSON الحقيقي
const BASE = "https://raw.githubusercontent.com/idoivri/israel-municipalities-polygons/master";

// אסמאء المجلدات من قائمة GitHub الحقيقية
// النمط: اسم_المجلد/اسم_المجلد.geojson
const AREAS = [
  {
    id: "rame", name: "ראמה - סגור - בית ג׳ן", emoji: "🏡",
    lat: 32.946, lng: 35.378,
    // bet_jan شفناه بالقائمة، rameh و sajur نمط واضح
    files: [
      "rameh/rameh.geojson",
      "sajur/sajur.geojson",
      "bet_jan/bet_jan.geojson",
    ],
  },
  {
    id: "karmiel", name: "כרמיאל - נחף - מג׳ד - שזור", emoji: "🏙️",
    lat: 32.920, lng: 35.300,
    // karmiel شغال ✅، الباقي بنفس النمط
    files: [
      "karmiel/karmiel.geojson",
      "nahf/nahf.geojson",
      "majd_al_krum/majd_al_krum.geojson",
      "shezor/shezor.geojson",
    ],
  },
  {
    id: "magar", name: "מג׳אר", emoji: "🌿",
    lat: 32.899, lng: 35.403,
    // Maghar = مغار — اسم GitHub يتبع النمط الإنجليزي
    files: [
      "maghar/maghar.geojson",
    ],
  },
  {
    id: "peki", name: "פקיעין - כ׳ סמיע - כסרא", emoji: "🌲",
    lat: 32.966, lng: 35.322,
    // pekiin، kisra_sumei من Wikipedia "Kisra-Sumei" → underscore
    files: [
      "pekiin/pekiin.geojson",
      "kisra_sumei/kisra_sumei.geojson",
      "kafr_sami/kafr_sami.geojson",
    ],
  },
];

// חילוץ coordinates מ-GeoJSON — כל הסוגים
function extractCoords(geojson) {
  if (!geojson) return [];
  if (geojson.type === "FeatureCollection")
    return geojson.features.flatMap(f => extractCoords(f));
  if (geojson.type === "Feature")
    return extractCoords(geojson.geometry);
  const geo = geojson.geometry || geojson;
  if (!geo?.type) return [];
  if (geo.type === "Polygon")
    return [geo.coordinates[0].map(([lng, lat]) => [lat, lng])];
  if (geo.type === "MultiPolygon")
    return geo.coordinates.flatMap(p => [p[0].map(([lng, lat]) => [lat, lng])]);
  if (geo.type === "GeometryCollection")
    return (geo.geometries || []).flatMap(extractCoords);
  return [];
}

async function fetchAreaPolygons(area) {
  const results = await Promise.allSettled(
    area.files.map(f =>
      fetch(`${BASE}/${f}`)
        .then(r => {
          if (!r.ok) { console.warn(`❌ 404: ${f}`); return null; }
          console.log(`✅ OK: ${f}`);
          return r.json();
        })
        .catch(e => { console.warn(`❌ Error: ${f}`, e); return null; })
    )
  );
  return results
    .map(r => r.status === "fulfilled" ? r.value : null)
    .filter(Boolean)
    .flatMap(extractCoords)
    .filter(c => c.length > 3);
}

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate      = useNavigate();
  const mapRef        = useRef(null);
  const leafRef       = useRef(null);
  const markersRef    = useRef({});
  const polysRef      = useRef([]);
  const cacheRef      = useRef({});
  const [ready,       setReady]       = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(false);

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

  // ── Init map ──────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [32.935, 35.340],
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
        icon: makeIcon(area.id, false, L),
      }).addTo(map);

      marker.on("click", e => {
        L.DomEvent.stopPropagation(e);
        onTap(area, map, L);
      });

      markersRef.current[area.id] = marker;
    });

    map.on("click", () => deselect(map));

    return () => {
      map.remove();
      leafRef.current    = null;
      markersRef.current = {};
      polysRef.current   = [];
    };
  }, [ready]);

  function makeIcon(id, active, L) {
    return (L || window.L).divIcon({
      html: `
        <div class="yg-pin" id="pin-${id}">
          <div class="yg-pin-circle" style="background:${active ? C.red : "white"};">
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="${active ? "white" : C.red}"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13
                   c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5
                   s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div class="yg-pin-tail"></div>
        </div>`,
      className:  "",
      iconSize:   [44, 56],
      iconAnchor: [22, 56],
    });
  }

  function setPinActive(id, active) {
    const m = markersRef.current[id];
    if (m && window.L) m.setIcon(makeIcon(id, active, window.L));
  }

  function clearPolys(map) {
    polysRef.current.forEach(p => map?.removeLayer(p));
    polysRef.current = [];
  }

  function deselect(map) {
    clearPolys(map);
    AREAS.forEach(a => setPinActive(a.id, false));
    setSelected(null);
    setLoading(false);
  }

  async function onTap(area, map, L) {
    // Immediate UI
    AREAS.forEach(a => setPinActive(a.id, false));
    setPinActive(area.id, true);
    clearPolys(map);
    setSelected(area);
    setLoading(true);

    // Cache check
    let coords = cacheRef.current[area.id];
    if (!coords) {
      coords = await fetchAreaPolygons(area);
      if (coords.length) cacheRef.current[area.id] = coords;
    }

    setLoading(false);
    if (!leafRef.current) return;
    const m = leafRef.current;

    if (coords.length) {
      const allPts = [];
      coords.forEach(c => {
        const poly = L.polygon(c, {
          color:        C.red,
          weight:       2.5,
          opacity:      0.9,
          fillColor:    C.red,
          fillOpacity:  0.20,
          smoothFactor: 1,
        }).addTo(m);
        polysRef.current.push(poly);
        allPts.push(...c);
      });
      m.flyToBounds(L.latLngBounds(allPts), {
        padding: [60, 60], maxZoom: 14, duration: 0.7,
      });
    } else {
      // Fallback — center only
      m.flyTo([area.lat, area.lng], 13, { duration: 0.6 });
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, fontFamily:"Arial,sans-serif", direction:"rtl" }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes slideUp { from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1} }
        .leaflet-container { background:#f0ece4!important; }
        .mBtn:active { transform:scale(0.91); }
        .yg-pin { display:flex;flex-direction:column;align-items:center; }
        .yg-pin-circle {
          width:44px;height:44px;border-radius:50%;
          border:2.5px solid ${C.red};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 14px rgba(200,16,46,0.35);
          transition:all 0.2s ease;cursor:pointer;
        }
        .yg-pin-tail {
          width:0;height:0;
          border-left:7px solid transparent;
          border-right:7px solid transparent;
          border-top:10px solid ${C.red};
          margin-top:-1px;
        }
      `}</style>

      {/* Header */}
      <div style={{
        position:"absolute",top:0,left:0,right:0,zIndex:1000,
        background:"white",boxShadow:"0 1px 0 rgba(0,0,0,0.07)",
        padding:"12px 16px",display:"flex",alignItems:"center",gap:12,
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
          <div style={{fontSize:11,marginTop:1,
            color:loading?C.red:selected?C.red:C.gray,
            fontWeight:selected?800:400,transition:"color 0.25s",
          }}>
            {loading ? "⏳ טוען גבולות..." : selected ? `✓ ${selected.name}` : "לחץ על סמן האזור שלך"}
          </div>
        </div>
        <div style={{width:38}}/>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{
        position:"absolute",top:62,left:0,right:0,
        bottom:selected?162:80,
        transition:"bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)",
      }}/>

      {/* Leaflet loading */}
      {!ready && (
        <div style={{
          position:"absolute",inset:0,zIndex:600,background:"white",
          display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",gap:14,
        }}>
          <div style={{
            width:44,height:44,borderRadius:"50%",
            border:"3px solid rgba(200,16,46,0.15)",
            borderTopColor:C.red,animation:"spin 0.8s linear infinite",
          }}/>
          <div style={{color:C.gray,fontSize:13,fontWeight:700}}>טוען מפה...</div>
        </div>
      )}

      {/* Zoom */}
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

      {/* Selected card */}
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
              <div style={{fontSize:12,marginTop:2,fontWeight:700,
                color:loading?"#f59e0b":"#16a34a",
              }}>
                {loading ? "⏳ טוען גבולות אזור..." : "✓ אזור פעיל • משלוח זמין"}
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
            onClick={()=>{ if(!loading){ onAreaSelect?.(selected); navigate("/"); } }}
            style={{
              width:"100%",
              background:loading?"#D1D5DB":`linear-gradient(135deg,${C.red},#a00020)`,
              border:"none",borderRadius:16,padding:"15px",
              color:"white",fontSize:15,fontWeight:900,
              cursor:loading?"not-allowed":"pointer",
              boxShadow:loading?"none":"0 4px 18px rgba(200,16,46,0.35)",
              transition:"all 0.3s",
            }}>
            {loading ? "⏳ רגע..." : `בחר ${selected.name} ←`}
          </button>
        </div>
      )}

      {/* BottomNav */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:999}}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

const AREAS = [
  {
    id: "east",
    short: "ראמה - מגאר - עראבה",
    name: "ראמה, סאגור, שזור, עין אל-אסד, עראבה, סחנין, מגאר",
    lat: 32.9078,
    lng: 35.3524,
    radius: 6500,
  },
  {
    id: "center",
    short: "כרמיאל - נחף - בעינה",
    name: "כרמיאל, נחף, דיר אל-אסד, בעינה, מגד אל-כרום",
    lat: 32.9178,
    lng: 35.2999,
    radius: 5000,
  },
  {
    id: "north",
    short: "פקיעין - חורפיש - כסרה",
    name: "פקיעין, חורפיש, בית ג'ן, כסרה-סמיע",
    lat: 32.9873,
    lng: 35.3220,
    radius: 5500,
  },
];

const CARD_HEIGHT = 175; // ارتفاع الكارت بالبكسل

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate   = useNavigate();
  const mapRef     = useRef(null);
  const leafRef    = useRef(null);
  const circleRef  = useRef(null);
  const [ready,    setReady]    = useState(false);
  const [selected, setSelected] = useState(null);

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

  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [32.945, 35.325],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      minZoom: 10,
      maxZoom: 14,
      maxBounds: [[32.50, 34.80], [33.50, 35.90]],
      maxBoundsViscosity: 0.85,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      preferCanvas: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19, updateWhenIdle: false, updateWhenZooming: false, keepBuffer: 6, crossOrigin: true }
    ).addTo(map);

    leafRef.current = map;

    AREAS.forEach(area => {
      const icon = L.divIcon({
        html: `
          <div class="yg-pin" id="pin-${area.id}">
            <div class="yg-pin-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${C.red}">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div class="yg-pin-tail"></div>
            <div class="yg-pin-label">${area.short}</div>
          </div>
        `,
        className:  "",
        iconSize:   [38, 64],
        iconAnchor: [19, 46],
      });

      L.marker([area.lat, area.lng], { icon })
        .addTo(map)
        .on("click", e => {
          L.DomEvent.stopPropagation(e);
          selectArea(area, map, L);
        });
    });

    map.on("click", () => deselect(map));

    return () => {
      map.remove();
      leafRef.current  = null;
      circleRef.current = null;
    };
  }, [ready]);

  function selectArea(area, map, L) {
    // حذف الدائرة القديمة
    if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }

    // reset pins
    AREAS.forEach(a => setPinActive(a.id, false));
    setPinActive(area.id, true);

    // رسم الدائرة
    circleRef.current = L.circle([area.lat, area.lng], {
      radius:      area.radius,
      color:       C.red,
      weight:      2,
      opacity:     0.8,
      fillColor:   C.red,
      fillOpacity: 0.10,
      dashArray:   "6,4",
    }).addTo(map);

    // تحريك بسيط للأعلى عشان المنطقة تبين فوق الكارت
    // نحسب كم pixel الكارت يأخذ ونعوّض
    const mapHeight = map.getSize().y;
    const offsetPx  = CARD_HEIGHT / 2; // نرفع بنص ارتفاع الكارت
    const currentPt = map.latLngToContainerPoint([area.lat, area.lng]);
    const newPt     = L.point(currentPt.x, currentPt.y + offsetPx);
    const newCenter = map.containerPointToLatLng(newPt);

    map.panTo(newCenter, { animate: true, duration: 0.25, easeLinearity: 0.9 });

    setSelected(area);
  }

  function deselect(map) {
    if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
    AREAS.forEach(a => setPinActive(a.id, false));
    setSelected(null);
  }

  function setPinActive(id, active) {
    const el = document.getElementById(`pin-${id}`);
    if (!el) return;
    const circle = el.querySelector(".yg-pin-circle");
    const label  = el.querySelector(".yg-pin-label");
    if (circle) {
      circle.style.background = active ? C.red : "white";
      circle.style.transform  = active ? "scale(1.25)" : "scale(1)";
      circle.style.boxShadow  = active
        ? "0 4px 16px rgba(200,16,46,0.45)"
        : "0 2px 8px rgba(200,16,46,0.25)";
      circle.querySelector("svg path").setAttribute("fill", active ? "white" : C.red);
    }
    if (label) {
      label.style.background = active ? C.red   : "white";
      label.style.color      = active ? "white" : C.dark;
      label.style.fontWeight = active ? "900"   : "700";
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, fontFamily: "Arial,sans-serif", direction: "rtl" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(110%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pinPop    { 0%{transform:scale(0.4);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes circleIn  { 0%{stroke-dashoffset:2000;opacity:0} 100%{stroke-dashoffset:0;opacity:1} }
        .leaflet-interactive { transition: fill-opacity 0.3s ease, opacity 0.3s ease !important; }
        .mBtn:active { transform: scale(0.91); }
        .leaflet-container { background: #f0ece4 !important; }
        .yg-pin { display:flex; flex-direction:column; align-items:center; animation:pinPop 0.3s ease; cursor:pointer; }
        .yg-pin-circle {
          width:38px; height:38px; border-radius:50%;
          background:white; border:2.5px solid ${C.red};
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 8px rgba(200,16,46,0.25);
          transition:all 0.18s cubic-bezier(0.34,1.3,0.64,1);
        }
        .yg-pin-tail {
          width:0; height:0;
          border-left:5px solid transparent; border-right:5px solid transparent;
          border-top:8px solid ${C.red}; margin-top:-1px;
        }
        .yg-pin-label {
          margin-top:3px; background:white; color:${C.dark};
          font-size:9px; font-weight:700; padding:2px 7px; border-radius:7px;
          white-space:nowrap; border:1.5px solid ${C.red};
          box-shadow:0 1px 5px rgba(0,0,0,0.12); transition:all 0.2s ease;
          font-family:Arial,sans-serif;
        }
      `}</style>

      {/* Header */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:1000,
        background:"white", boxShadow:"0 1px 8px rgba(0,0,0,0.08)",
        padding:"12px 16px", display:"flex", alignItems:"center", gap:12,
      }}>
        <button className="mBtn" onClick={() => navigate(-1)} style={{
          background:"#F3F4F6", border:"none", borderRadius:12,
          width:38, height:38, cursor:"pointer", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:900, color:C.dark }}>בחר אזור משלוח</div>
          <div style={{ fontSize:11, marginTop:1, color:selected?C.red:C.gray, fontWeight:selected?800:400, transition:"color 0.25s" }}>
            {selected ? `✓ ${selected.short}` : "לחץ על סמן האזור שלך"}
          </div>
        </div>
        <div style={{ width:38 }}/>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{
        position:"absolute", top:62, left:0, right:0, bottom:80,
      }}/>

      {/* Loading */}
      {!ready && (
        <div style={{ position:"absolute", inset:0, zIndex:600, background:"white", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", border:"3px solid rgba(200,16,46,0.15)", borderTopColor:C.red, animation:"spin 0.8s linear infinite" }}/>
          <div style={{ color:C.gray, fontSize:13, fontWeight:700 }}>טוען מפה...</div>
        </div>
      )}

      {/* Zoom */}
      <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", zIndex:900, display:"flex", flexDirection:"column", gap:6 }}>
        {[["+",1],["-",-1]].map(([l,d]) => (
          <button key={l} className="mBtn"
            onClick={() => leafRef.current?.setZoom((leafRef.current.getZoom()||11)+d)}
            style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:10, width:36, height:36, color:C.dark, fontSize:18, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Selected card — فوق BottomNav مباشرة */}
      {selected && (
        <div style={{
          position:"absolute", bottom:80, left:0, right:0, zIndex:1000,
          background:"white", borderRadius:"22px 22px 0 0",
          padding:"14px 20px 18px", boxShadow:"0 -6px 28px rgba(0,0,0,0.13)",
          animation:"slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1)",
        }}>
          <div style={{ width:36, height:4, background:"#E5E7EB", borderRadius:2, margin:"0 auto 12px" }}/>
          <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14 }}>
            <div style={{ width:46, height:46, borderRadius:13, flexShrink:0, background:"rgba(200,16,46,0.07)", border:"1.5px solid rgba(200,16,46,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={C.red}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:900, color:C.dark, lineHeight:1.5 }}>{selected.name}</div>
              <div style={{ fontSize:11, color:"#16a34a", fontWeight:700, marginTop:3 }}>✓ אזור פעיל • משלוח זמין</div>
            </div>
            <button onClick={() => deselect(leafRef.current)} style={{ background:"#F3F4F6", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:C.gray, flexShrink:0 }}>✕</button>
          </div>
          <button className="mBtn"
            onClick={() => { onAreaSelect?.(selected); navigate(-1); }}
            style={{ width:"100%", background:`linear-gradient(135deg,${C.red},#a00020)`, border:"none", borderRadius:16, padding:"15px", color:"white", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 18px rgba(200,16,46,0.35)" }}>
            בחר {selected.short} ←
          </button>
        </div>
      )}

      <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:999 }}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}

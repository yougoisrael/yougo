import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827" };

export default function MapPage({ cartCount = 0 }) {
  const navigate   = useNavigate();
  const mapRef     = useRef(null);
  const leafRef    = useRef(null);
  const markersRef = useRef([]);
  const [ready,    setReady]    = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [stores,   setStores]   = useState([]);

  const DRIVERS = [
    { id:"d1", name:"Ahmad",    lat:32.942, lng:35.374, status:"delivering" },
    { id:"d2", name:"Yosef",    lat:32.931, lng:35.292, status:"available"  },
    { id:"d3", name:"Mohammed", lat:32.912, lng:35.312, status:"delivering" },
  ];

  // ── Load Leaflet ──────────────────────────────
  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const css = Object.assign(document.createElement("link"),{rel:"stylesheet",href:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"});
    document.head.appendChild(css);
    const js = Object.assign(document.createElement("script"),{src:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",onload:()=>setReady(true)});
    document.head.appendChild(js);
  }, []);

  // ── Fetch stores ──────────────────────────────
  useEffect(() => {
    supabase.from("stores").select("id,name,emoji,latitude,longitude,is_open,page_type").not("latitude","is",null)
      .then(({ data }) => {
        setStores(data?.length ? data : [
          { id:1, name:"פיצה ראמה",    emoji:"🍕", latitude:32.941, longitude:35.375, is_open:true,  page_type:"restaurant" },
          { id:2, name:"שווארמה גליל", emoji:"🥙", latitude:32.930, longitude:35.368, is_open:true,  page_type:"restaurant" },
          { id:3, name:"רמי לוי ראמה",emoji:"🛒", latitude:32.938, longitude:35.372, is_open:true,  page_type:"market"     },
          { id:4, name:"בורגר נהריה", emoji:"🍔", latitude:33.006, longitude:35.093, is_open:true,  page_type:"restaurant" },
          { id:5, name:"סושי עכו",    emoji:"🍱", latitude:32.925, longitude:35.078, is_open:false, page_type:"restaurant" },
        ]);
      });
  }, []);

  // ── Init map ──────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current,{center:[32.93,35.22],zoom:11,zoomControl:false,attributionControl:false});
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{maxZoom:19}).addTo(map);
    leafRef.current = map;
    return () => { map.remove(); leafRef.current = null; };
  }, [ready]);

  // ── Draw markers ─────────────────────────────
  const draw = useCallback(() => {
    if (!leafRef.current || !window.L) return;
    const L = window.L, map = leafRef.current;
    markersRef.current.forEach(m => m.remove?.());
    markersRef.current = [];

    const icon = (html, s=42) => L.divIcon({ html, className:"", iconSize:[s,s], iconAnchor:[s/2,s] });

    if (filter==="all"||filter==="restaurants") {
      stores.forEach(s => {
        if (!s.latitude) return;
        const color = s.is_open ? C.red : "#9ca3af";
        const m = L.marker([s.latitude,s.longitude],{ icon: icon(`
          <div style="position:relative;text-align:center">
            <div style="width:42px;height:42px;background:white;border:3px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 3px 10px rgba(0,0,0,0.2)">${s.emoji||"🍽️"}</div>
            <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${color};margin:0 auto"></div>
          </div>`,42)})
        .addTo(map).on("click",()=>setSelected(s));
        markersRef.current.push(m);
      });
    }

    if (filter==="all"||filter==="drivers") {
      DRIVERS.forEach(d => {
        const bg = d.status==="delivering" ? C.red : "#16a34a";
        const m = L.marker([d.lat,d.lng],{ icon: icon(`<div style="background:${bg};border:2.5px solid white;border-radius:10px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 3px 10px rgba(0,0,0,0.3)">🚗</div>`,38)})
        .addTo(map).on("click",()=>setSelected({type:"driver",...d}));
        markersRef.current.push(m);
      });
    }
  }, [ready, filter, stores]);

  useEffect(() => { if (leafRef.current) draw(); }, [draw]);

  const FILTERS = [
    {key:"all",label:"הכל",e:"🗺️"},
    {key:"restaurants",label:"חנויות",e:"🍽️"},
    {key:"drivers",label:"נהגים",e:"🚗"},
  ];

  return (
    <div style={{position:"fixed",inset:0,background:C.dark,fontFamily:"Arial,sans-serif",direction:"rtl"}}>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .leaflet-container{background:#e8e0d8!important}
        .mBtn:active{transform:scale(0.9)}
      `}</style>

      {/* ── Fixed Header (same as app) ── */}
      <div className="app-header" style={{direction:"rtl"}}>
        <div style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
          <button className="mBtn" onClick={()=>navigate(-1)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"#F7F7F8",borderRadius:24,padding:"7px 14px",cursor:"pointer"}}
            onClick={()=>navigate("/address")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#C8102E"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <div style={{flex:1,textAlign:"right"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#111827"}}>מפת Yougo</div>
              <div style={{fontSize:10,color:"#6B7280"}}>צפון ישראל • {stores.filter(s=>s.is_open).length} חנויות פתוחות</div>
            </div>
            <div style={{background:"rgba(22,163,74,0.1)",borderRadius:20,padding:"3px 8px",display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#16a34a"}}/>
              <span style={{color:"#16a34a",fontSize:10,fontWeight:800}}>Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Map fills screen ── */}
      <div ref={mapRef} style={{width:"100%",height:"100%"}} />

      {/* ── Loading ── */}
      {!ready && (
        <div style={{position:"absolute",inset:0,zIndex:500,background:C.dark,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:"50%",border:`3px solid rgba(200,16,46,0.2)`,borderTopColor:C.red,animation:"spin 0.8s linear infinite"}}/>
          <div style={{color:"white",fontSize:14,fontWeight:700}}>טוען מפה...</div>
        </div>
      )}

      {/* ── Zoom ── */}
      <div style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",zIndex:1000,display:"flex",flexDirection:"column",gap:6}}>
        {[["+",1],["-",-1]].map(([l,d])=>(
          <button key={l} className="mBtn"
            onClick={()=>leafRef.current?.setZoom((leafRef.current.getZoom()||11)+d)}
            style={{background:"rgba(17,24,39,0.9)",border:"1px solid rgba(200,16,46,0.25)",borderRadius:12,width:40,height:40,color:"white",fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {l}
          </button>
        ))}
        <button className="mBtn"
          onClick={()=>navigator.geolocation?.getCurrentPosition(p=>leafRef.current?.setView([p.coords.latitude,p.coords.longitude],15))}
          style={{background:C.red,border:"none",borderRadius:12,width:40,height:40,color:"white",fontSize:16,cursor:"pointer",marginTop:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
          📍
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{position:"absolute",bottom:selected?220:100,left:"50%",transform:"translateX(-50%)",zIndex:1000,display:"flex",gap:7,transition:"bottom 0.3s ease"}}>
        {FILTERS.map(f=>(
          <button key={f.key} className="mBtn" onClick={()=>setFilter(f.key)} style={{
            background:filter===f.key?C.red:"rgba(17,24,39,0.92)",
            border:`1px solid ${filter===f.key?C.red:"rgba(255,255,255,0.12)"}`,
            borderRadius:20,padding:"7px 13px",color:"white",fontSize:11,fontWeight:700,cursor:"pointer",
            display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",
            boxShadow:"0 4px 16px rgba(0,0,0,0.35)",transition:"all 0.2s ease",
          }}>
            {f.e} {f.label}
          </button>
        ))}
      </div>

      {/* ── Info card ── */}
      {selected && (
        <div style={{position:"absolute",bottom:80,left:0,right:0,zIndex:1000,background:"rgba(17,24,39,0.97)",borderRadius:"24px 24px 0 0",padding:"16px 20px 20px",border:"1px solid rgba(200,16,46,0.25)",boxShadow:"0 -8px 40px rgba(0,0,0,0.6)"}}>
          <div style={{width:36,height:4,background:"rgba(255,255,255,0.15)",borderRadius:2,margin:"0 auto 14px"}}/>
          <button onClick={()=>setSelected(null)} style={{position:"absolute",top:14,left:16,background:"rgba(255,255,255,0.08)",border:"none",borderRadius:"50%",width:32,height:32,color:"white",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:8}}>{selected.emoji||"🚗"}</div>
            <div style={{color:"white",fontSize:18,fontWeight:900}}>{selected.name}</div>
            {selected.type!=="driver" && (
              <>
                <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,background:selected.is_open?"rgba(22,163,74,0.15)":"rgba(100,100,100,0.15)",borderRadius:20,padding:"4px 14px",color:selected.is_open?"#4ade80":"#9ca3af",fontSize:12,fontWeight:700}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:"currentColor"}}/>
                  {selected.is_open?"פתוח עכשיו":"סגור"}
                </div>
                {selected.is_open && (
                  <button onClick={()=>navigate(selected.page_type==="market"?"/market":`/restaurant/${selected.id}`)}
                    style={{marginTop:14,width:"100%",background:`linear-gradient(135deg,${C.red},#a00020)`,border:"none",borderRadius:16,padding:"14px",color:"white",fontSize:15,fontWeight:900,cursor:"pointer"}}>
                    📦 הזמן עכשיו
                  </button>
                )}
              </>
            )}
            {selected.type==="driver" && (
              <div style={{color:selected.status==="delivering"?"#f87171":"#4ade80",fontSize:13,fontWeight:700,marginTop:8}}>
                {selected.status==="delivering"?"⚡ בדרך לאספקה":"✅ פנוי"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Nav (same as app) ── */}
      <BottomNav cartCount={cartCount} />
    </div>
  );
}

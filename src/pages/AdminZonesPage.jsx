import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280", green: "#16a34a" };

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminZonesPage() {
  const mapRef     = useRef(null);
  const leafRef    = useRef(null);
  const polyRef    = useRef(null);   // الـ polygon الحالي على الخريطة
  const pointsRef  = useRef([]);     // النقاط اللي رسمناها

  const [ready,    setReady]   = useState(false);
  const [zones,    setZones]   = useState([]);
  const [selected, setSelected]= useState(null); // المنطقة المختارة للتعديل
  const [drawing,  setDrawing] = useState(false);
  const [points,   setPoints]  = useState([]);
  const [saving,   setSaving]  = useState(false);
  const [msg,      setMsg]     = useState("");

  // جلب المناطق
  useEffect(() => {
    supabase.from("delivery_zones").select("*").eq("is_active", true)
      .then(({ data }) => data && setZones(data));
  }, []);

  // Load Leaflet
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

  // Init map
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [32.930, 35.345],
      zoom: 11,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    leafRef.current = map;

    // كل نقرة على الخريطة تضيف نقطة للـ polygon
    map.on("click", e => {
      if (!drawingRef.current) return;
      const pt = [e.latlng.lat, e.latlng.lng];
      pointsRef.current = [...pointsRef.current, pt];
      setPoints([...pointsRef.current]);
      redrawPolygon(map, L);
    });

    return () => { map.remove(); leafRef.current = null; };
  }, [ready]);

  // نحتاج ref للـ drawing state عشان يشتغل في الـ event listener
  const drawingRef = useRef(false);
  useEffect(() => { drawingRef.current = drawing; }, [drawing]);

  function redrawPolygon(map, L) {
    const m = map || leafRef.current;
    const l = L || window.L;
    if (!m || !l) return;

    // احذف القديم
    if (polyRef.current) m.removeLayer(polyRef.current);

    const pts = pointsRef.current;
    if (pts.length < 2) return;

    // ارسم الجديد
    polyRef.current = l.polygon(pts, {
      color: C.red, weight: 2.5, opacity: 0.9,
      fillColor: C.red, fillOpacity: 0.2,
      dashArray: "6,4",
    }).addTo(m);
  }

  function startDraw(zone) {
    setSelected(zone);
    setDrawing(true);
    pointsRef.current = [];
    setPoints([]);
    setMsg("🖊️ انقر على الخريطة لرسم حدود المنطقة. انقر نقرتين للإنهاء.");

    // عرض الـ polygon الحالي لو موجود
    const L = window.L;
    const map = leafRef.current;
    if (!map || !L) return;
    if (polyRef.current) map.removeLayer(polyRef.current);
    if (zone.polygon?.length > 2) {
      polyRef.current = L.polygon(zone.polygon, {
        color: C.gray, weight: 1.5, opacity: 0.5,
        fillColor: C.gray, fillOpacity: 0.1,
      }).addTo(map);
    }
    map.flyTo([zone.center_lat, zone.center_lng], 13, { duration: 0.7 });

    // نقرة مزدوجة تنهي الرسم
    map.once("dblclick", () => finishDraw());
  }

  function finishDraw() {
    setDrawing(false);
    setMsg(pointsRef.current.length > 2
      ? `✓ رسمت ${pointsRef.current.length} نقطة — اضغط "حفظ" لحفظ المنطقة`
      : "⚠️ ارسم أكثر من نقطتين");
  }

  function undoLast() {
    if (!pointsRef.current.length) return;
    pointsRef.current = pointsRef.current.slice(0, -1);
    setPoints([...pointsRef.current]);
    redrawPolygon();
  }

  function clearDraw() {
    pointsRef.current = [];
    setPoints([]);
    if (polyRef.current && leafRef.current) {
      leafRef.current.removeLayer(polyRef.current);
      polyRef.current = null;
    }
    setMsg("");
  }

  async function savePolygon() {
    if (!selected || pointsRef.current.length < 3) return;
    setSaving(true);

    const { error } = await supabase
      .from("delivery_zones")
      .update({ polygon: pointsRef.current })
      .eq("id", selected.id);

    setSaving(false);
    if (error) {
      setMsg("❌ خطأ في الحفظ: " + error.message);
    } else {
      setMsg(`✅ تم حفظ منطقة "${selected.name}" بنجاح!`);
      setDrawing(false);
      setZones(prev => prev.map(z =>
        z.id === selected.id ? { ...z, polygon: pointsRef.current } : z
      ));
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, fontFamily: "Arial,sans-serif", direction: "rtl", background: "#f5f5f5" }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .leaflet-container { background:#e8e0d8 !important; }
        .zone-btn { padding:10px 14px;border:1.5px solid #E5E7EB;border-radius:12px;
          background:white;cursor:pointer;font-size:13px;font-weight:700;text-align:right; }
        .zone-btn:hover { border-color:${C.red};color:${C.red}; }
        .zone-btn.active { background:${C.red};color:white;border-color:${C.red}; }
        .zone-btn.has-poly { border-color:#86efac; }
        .mBtn:active { transform:scale(0.92); }
      `}</style>

      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "white", boxShadow: "0 1px 0 rgba(0,0,0,0.08)",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ fontSize: 20 }}>🗺️</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.dark }}>ניהול אזורי משלוח</div>
          <div style={{ fontSize: 11, color: C.gray }}>בחר אזור ושרטט את הגבול על המפה</div>
        </div>
      </div>

      {/* Zone selector */}
      <div style={{
        position: "absolute", top: 58, left: 0, right: 0, zIndex: 900,
        background: "white", borderBottom: "1px solid #E5E7EB",
        padding: "8px 12px",
        display: "flex", gap: 8, overflowX: "auto",
      }}>
        {zones.map(z => (
          <button key={z.id}
            className={`zone-btn${selected?.id === z.id ? " active" : ""}${z.polygon?.length > 2 ? " has-poly" : ""}`}
            onClick={() => startDraw(z)}>
            {z.emoji} {z.name.split(" - ")[0]}
            {z.polygon?.length > 2 ? " ✓" : " ○"}
          </button>
        ))}
      </div>

      {/* Map */}
      <div ref={mapRef} style={{
        position: "absolute", top: 112, left: 0, right: 0, bottom: 0,
      }} />

      {/* Loading */}
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 600, background: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "3px solid rgba(200,16,46,0.15)",
            borderTopColor: C.red, animation: "spin 0.8s linear infinite",
          }} />
        </div>
      )}

      {/* Controls */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 24, left: 12, right: 12, zIndex: 1000,
          background: "white", borderRadius: 18,
          padding: "14px 16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        }}>
          {msg && (
            <div style={{
              fontSize: 12, marginBottom: 10, fontWeight: 700,
              color: msg.startsWith("✅") ? C.green : msg.startsWith("❌") ? C.red : C.dark,
            }}>{msg}</div>
          )}

          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10, color: C.dark }}>
            {selected.emoji} {selected.name}
            {points.length > 0 && <span style={{ color: C.gray, fontWeight: 400 }}> — {points.length} נקודות</span>}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="mBtn" onClick={undoLast} style={{
              flex: 1, padding: "10px", border: "1.5px solid #E5E7EB",
              borderRadius: 12, background: "white", cursor: "pointer",
              fontSize: 13, fontWeight: 700, color: C.dark,
            }}>↩ ביטול</button>

            <button className="mBtn" onClick={clearDraw} style={{
              flex: 1, padding: "10px", border: "1.5px solid #E5E7EB",
              borderRadius: 12, background: "white", cursor: "pointer",
              fontSize: 13, fontWeight: 700, color: C.red,
            }}>🗑 נקה</button>

            <button className="mBtn" onClick={savePolygon}
              disabled={saving || points.length < 3}
              style={{
                flex: 2, padding: "10px",
                background: points.length < 3 ? "#D1D5DB" : `linear-gradient(135deg,${C.red},#a00020)`,
                border: "none", borderRadius: 12, cursor: points.length < 3 ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 900, color: "white",
                boxShadow: points.length < 3 ? "none" : "0 4px 14px rgba(200,16,46,0.35)",
              }}>
              {saving ? "⏳ שומר..." : "💾 שמור אזור"}
            </button>
          </div>

          {drawing && (
            <div style={{
              marginTop: 10, padding: "8px 12px",
              background: "rgba(200,16,46,0.06)", borderRadius: 10,
              fontSize: 12, color: C.red, fontWeight: 700, textAlign: "center",
            }}>
              🖊️ לחץ על המפה להוספת נקודות • לחץ פעמיים לסיום
            </div>
          )}
        </div>
      )}

      {/* Instructions when no zone selected */}
      {!selected && ready && (
        <div style={{
          position: "absolute", bottom: 24, left: 12, right: 12, zIndex: 1000,
          background: "white", borderRadius: 18, padding: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>👆</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.dark, marginBottom: 4 }}>
            בחר אזור למעלה
          </div>
          <div style={{ fontSize: 12, color: C.gray }}>
            לחץ על כפתור האזור ואז שרטט את הגבול על המפה
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AdminReal.jsx — ✅ Fixed: uses shared supabase client
//  Protected by AdminAuthGuard — see src/lib/adminAuth.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";


/* ═══════════════════════════════════════════════════════════════════
   RICH MOCK DATA
═══════════════════════════════════════════════════════════════════ */
const now = Date.now();
const t = (m) => new Date(now - m * 60000).toISOString();


const ST = {
  "جديد":        { c:"#3B82F6", bg:"#EFF6FF", label:"جديد"        },
  "قيد التحضير": { c:"#F59E0B", bg:"#FFFBEB", label:"قيد التحضير" },
  "في الطريق":   { c:"#8B5CF6", bg:"#F5F3FF", label:"في الطريق"   },
  "مكتمل":       { c:"#10B981", bg:"#ECFDF5", label:"مكتمل"       },
  "ملغي":        { c:"#EF4444", bg:"#FEF2F2", label:"ملغي"        },
};

const PAY_COLORS = { "كاش":"#10B981","بطاقة":"#3B82F6","Apple Pay":"#1C1C1E" };

function ago(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `${Math.floor(s/60)} دقيقة`;
  if (s < 86400) return `${Math.floor(s/3600)} ساعة`;
  return new Date(iso).toLocaleDateString("ar");
}

/* ── Mini bar chart ─────────────────────────────────────────── */
function MiniBar({ data, color = "#2563EB", h = 48 }) {
  const max = Math.max(...data);
  const [hov, setHov] = useState(null);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:h }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:0, cursor:"default", position:"relative" }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
          {hov === i && (
            <div style={{ position:"absolute", bottom:"calc(100% + 4px)", background:"#1E293B", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:5, whiteSpace:"nowrap", zIndex:9 }}>{v}</div>
          )}
          <div style={{ width:"100%", borderRadius:"3px 3px 0 0", height:`${(v/max)*h*0.9}px`, minHeight:2, background: hov===i ? color : color+"99", transition:"all .15s" }} />
        </div>
      ))}
    </div>
  );
}

/* ── Smooth area sparkline ──────────────────────────────────── */
function AreaLine({ data, color, w=160, h=52 }) {
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const px = (v, i) => [(i / (data.length-1)) * w, h - 4 - ((v-min)/rng)*(h-8)];
  const points = data.map((v,i) => px(v,i));
  const line = points.map(([x,y]) => `${x},${y}`).join(" ");
  const id = "al" + color.replace("#","");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r="3.5" fill={color} stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Donut ─────────────────────────────────────────────────── */
function Donut({ segments, size=140 }) {
  const total = segments.reduce((s,x) => s+x.val, 0) || 1;
  const cx = size/2, cy = size/2, R = 52, ir = 36;
  let angle = -Math.PI / 2;
  const slices = segments.map(s => {
    const a = (s.val / total) * 2 * Math.PI;
    const x1 = cx + R*Math.cos(angle), y1 = cy + R*Math.sin(angle);
    angle += a;
    const x2 = cx + R*Math.cos(angle-0.001), y2 = cy + R*Math.sin(angle-0.001);
    return { d:`M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${a>Math.PI?1:0},1 ${x2},${y2}Z`, c:s.c, val:s.val };
  });
  return (
    <svg width={size} height={size}>
      {slices.map((s,i) => <path key={i} d={s.d} fill={s.c} opacity="0.92"/>)}
      <circle cx={cx} cy={cy} r={ir} fill="#F8FAFC"/>
      <text x={cx} y={cy-4} textAnchor="middle" fill="#0F172A" fontSize="18" fontWeight="900" fontFamily="system-ui">{total}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="system-ui">إجمالي</text>
    </svg>
  );
}

/* ── Toast ─────────────────────────────────────────────────── */
function Toast({ msg, type="success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  const colors = { success:"#10B981", error:"#EF4444", info:"#3B82F6" };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      position:"fixed", bottom:24, right:28, zIndex:9999,
      background:"#fff", borderRadius:12, padding:"14px 18px",
      display:"flex", alignItems:"center", gap:10,
      boxShadow:`0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06), 0 0 0 1px ${c}33`,
      animation:"toastSlide .3s cubic-bezier(.34,1.56,.64,1)",
      fontFamily:"system-ui, sans-serif", fontSize:13, fontWeight:600, color:"#0F172A", maxWidth:340,
    }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background:c, flexShrink:0 }}/>
      <span style={{ flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:18, lineHeight:1, padding:0 }}>×</button>
    </div>
  );
}

/* ── Status badge ───────────────────────────────────────────── */
function Badge({ status }) {
  const m = ST[status] || ST["جديد"];
  return (
    <span style={{ background:m.bg, color:m.c, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap", display:"inline-block" }}>
      {status}
    </span>
  );
}

/* ── Card ───────────────────────────────────────────────────── */
function Card({ children, style={} }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #E2E8F0", boxShadow:"0 1px 3px rgba(0,0,0,.05)", ...style }}>
      {children}
    </div>
  );
}

/* ── Section header ─────────────────────────────────────────── */
function SectionHead({ title, sub, action }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px", borderBottom:"1px solid #F1F5F9" }}>
      <div>
        <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:"#94A3B8", marginTop:1 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

/* ── Input ──────────────────────────────────────────────────── */
function Input({ value, onChange, placeholder, style={} }) {
  const [focused, setFocused] = useState(false);
  return (
    <input value={value} onChange={onChange} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        background:"#F8FAFC", border:`1.5px solid ${focused?"#2563EB":"#E2E8F0"}`,
        borderRadius:9, padding:"9px 12px", fontSize:13, color:"#0F172A",
        outline:"none", fontFamily:"system-ui,sans-serif", transition:"border .15s",
        ...style,
      }}/>
  );
}

/* ── Button ─────────────────────────────────────────────────── */
function Btn({ children, onClick, variant="primary", style={}, disabled=false }) {
  const base = { border:"none", borderRadius:9, padding:"9px 18px", fontSize:13, fontWeight:700, cursor:disabled?"not-allowed":"pointer", fontFamily:"system-ui,sans-serif", transition:"all .15s", display:"inline-flex", alignItems:"center", gap:6, opacity:disabled?0.6:1, ...style };
  const variants = {
    primary:  { background:"#2563EB", color:"#fff", boxShadow:"0 2px 8px rgba(37,99,235,.25)" },
    danger:   { background:"#FEF2F2", color:"#EF4444", boxShadow:"none" },
    ghost:    { background:"#F1F5F9", color:"#475569", boxShadow:"none" },
    success:  { background:"#ECFDF5", color:"#10B981", boxShadow:"none" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

/* ═══════════════════════════════════════════════════════════════════
   NAV CONFIG
═══════════════════════════════════════════════════════════════════ */
const PAGES = [
  { id:"overview",    label:"نظرة عامة",     icon:"M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { id:"orders",      label:"الطلبات",        icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { id:"restaurants", label:"المطاعم",        icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { id:"users",       label:"المستخدمون",     icon:"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { id:"analytics",   label:"الإحصائيات",    icon:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { id:"settings",    label:"الإعدادات",      icon:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

function NavIcon({ path, size=18, color="#64748B" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
      <path d={path} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function AdminReal({ onBack }) {
  const [page, setPage]         = useState("overview");
  const [orders, setOrders]     = useState([]);
  const [rests, setRests]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [toast, setToast]       = useState(null);
  const [loading, setLoading]   = useState(true);

  // Orders page
  const [oFilter, setOFilter]   = useState("الكل");
  const [oSearch, setOSearch]   = useState("");
  const [oDetail, setODetail]   = useState(null);

  // Restaurants page
  const [rSearch, setRSearch]   = useState("");
  const [showAddR, setShowAddR] = useState(false);
  const [editR, setEditR]       = useState(null);
  const [newR, setNewR]         = useState({ name:"", category:"", location:"", phone:"", hours:"" });
  const [savingR, setSavingR]   = useState(false);

  // Users page
  const [uSearch, setUSearch]   = useState("");

  // Settings
  const [cfg, setCfg]           = useState({ deliveryFee:"10", minOrder:"40", freeAt:"150", commission:"15", name:"Yougo", phone:"972-50-123-4567" });
  const [cfgSaved, setCfgSaved] = useState(false);


  /* ── Mobile detection ── */
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const notify = (msg, type="success") => setToast({ msg, type });

  /* Supabase + realtime */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [o, r, u] = await Promise.all([
          supabase.from("orders").select("*").order("created_at", { ascending:false }).limit(200),
          supabase.from("restaurants").select("*").order("name"),
          supabase.from("users").select("*").order("created_at", { ascending:false }),
        ]);
        setOrders(o.data || []);
        setRests(r.data || []);
        setUsers(u.data || []);
      } catch (_) {}
      setLoading(false);
    })();

    const ch = supabase.channel("yougo-admin-v3")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"orders" }, p => {
        setOrders(prev => [p.new, ...prev]);
        notify(`🔔 طلب جديد — ${p.new.customer_name}`, "info");
      })
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"orders" }, p => {
        setOrders(prev => prev.map(o => o.id === p.new.id ? p.new : o));
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  /* Computed */
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter(o => o.created_at.startsWith(today));
  const todayRev = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const completedOrders = orders.filter(o => o.status === "مكتمل");
  const totalRev = completedOrders.reduce((s, o) => s + (o.total || 0), 0);
  const newCount = orders.filter(o => o.status === "جديد").length;
  const pending  = orders.filter(o => ["جديد","قيد التحضير","في الطريق"].includes(o.status)).length;

  /* Actions */
  const setStatus = async (id, status) => {
    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
    if (oDetail?.id === id) setODetail(prev => ({ ...prev, status }));
    try { await supabase.from("orders").update({ status }).eq("id", id); } catch (_) {}
    notify("تم تحديث حالة الطلب");
  };

  const delOrder = async (id) => {
    setOrders(p => p.filter(o => o.id !== id));
    setODetail(null);
    try { await supabase.from("orders").delete().eq("id", id); } catch (_) {}
    notify("تم حذف الطلب");
  };

  const toggleRest = async (id, cur) => {
    setRests(p => p.map(r => r.id === id ? { ...r, active: !cur } : r));
    try { await supabase.from("restaurants").update({ active: !cur }).eq("id", id); } catch (_) {}
    notify(!cur ? "تم تفعيل المطعم ✓" : "تم إيقاف المطعم");
  };

  const saveRest = async () => {
    if (!editR?.name?.trim()) { notify("أدخل اسم المطعم", "error"); return; }
    setSavingR(true);
    setRests(p => p.map(r => r.id === editR.id ? { ...r, ...editR } : r));
    try { await supabase.from("restaurants").update(editR).eq("id", editR.id); } catch (_) {}
    setSavingR(false); setEditR(null); notify("تم حفظ التغييرات ✓");
  };

  const addRest = async () => {
    if (!newR.name.trim()) { notify("أدخل اسم المطعم", "error"); return; }
    setSavingR(true);
    const obj = { ...newR, id:"R0"+Date.now(), orders:0, revenue:0, rating:5.0, reviews:0, active:true, verified:false, img:"🍴" };
    setRests(p => [...p, obj]);
    try { await supabase.from("restaurants").insert([{ name:newR.name, category:newR.category, location:newR.location, phone:newR.phone, active:true }]); } catch (_) {}
    setSavingR(false); setShowAddR(false); setNewR({ name:"", category:"", location:"", phone:"", hours:"" });
    notify("تم إضافة المطعم ✓");
  };

  const toggleUser = async (id, cur) => {
    setUsers(p => p.map(u => u.id === id ? { ...u, active: !cur } : u));
    try { await supabase.from("users").update({ active: !cur }).eq("id", id); } catch (_) {}
    notify(!cur ? "تم تفعيل المستخدم ✓" : "تم حظر المستخدم");
  };

  const saveCfg = async () => {
    try {
      await supabase.from("settings").upsert([
        { key:"delivery_fee",   value:cfg.deliveryFee },
        { key:"min_order",      value:cfg.minOrder    },
        { key:"free_at",        value:cfg.freeAt      },
        { key:"commission",     value:cfg.commission  },
      ]);
    } catch (_) {}
    setCfgSaved(true); notify("تم حفظ الإعدادات ✓");
    setTimeout(() => setCfgSaved(false), 3000);
  };

  /* Filtered */
  const fOrders = orders
    .filter(o => oFilter === "الكل" || o.status === oFilter)
    .filter(o => !oSearch || (o.customer_name||"").includes(oSearch) || (o.restaurant_name||"").includes(oSearch));

  const fRests = rests.filter(r => !rSearch || r.name.includes(rSearch) || (r.category||"").includes(rSearch) || (r.location||"").includes(rSearch));
  const fUsers = users.filter(u => !uSearch || (u.name||"").includes(uSearch) || (u.phone||"").includes(uSearch));

  const donutSegs = Object.entries(ST).map(([l,m]) => ({ c:m.c, val:orders.filter(o=>o.status===l).length })).filter(s=>s.val>0);

  /* ── Styles (responsive) ── */
  const S = {
    page: { background:"#F8FAFC", minHeight:"100vh", fontFamily:"'Cairo', system-ui, -apple-system, sans-serif", direction:"rtl" },
    sidebar: isMobile
      ? { display:"none" }
      : { width:230, background:"#fff", borderLeft:"1px solid #E2E8F0", display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0, flexShrink:0, boxShadow:"2px 0 8px rgba(0,0,0,.04)" },
    main: { flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" },
    topbar: {
      background:"#fff", borderBottom:"1px solid #E2E8F0",
      padding: isMobile ? "0 14px" : "0 28px",
      height: isMobile ? 56 : 62,
      display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0
    },
    content: { flex:1, overflowY:"auto", padding: isMobile ? "14px 14px 80px" : "26px 28px 48px" },
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{ display:"flex", ...S.page }}>

        {/* ═══════ SIDEBAR ═══════════════════════════════════════════════ */}
        <aside style={S.sidebar}>
          {/* Brand */}
          <div style={{ padding:"22px 20px 16px", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:"linear-gradient(135deg,#2563EB,#1D4ED8)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(37,99,235,.3)", flexShrink:0 }}>
                <svg width="22" height="22" viewBox="0 0 60 60" fill="none">
                  <path d="M10 44V16l16 16V16" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M32 28h18M41 21l9 7-9 7" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:18, color:"#0F172A", letterSpacing:1 }}>YOUGO</div>
                <div style={{ fontSize:10, color:"#94A3B8", fontWeight:600, letterSpacing:1.5 }}>ADMIN PORTAL</div>
              </div>
            </div>
            {/* Live indicator */}
            <div style={{ display:"flex", alignItems:"center", gap:7, background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:"6px 10px" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#10B981", animation:"livePulse 2s infinite" }}/>
              <span style={{ fontSize:11, color:"#059669", fontWeight:600 }}>متصل — بيانات حية</span>
              {loading && <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid #BBF7D0", borderTopColor:"#10B981", animation:"spin .7s linear infinite", marginRight:"auto" }}/>}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:"10px 10px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
            {PAGES.map(p => {
              const active = page === p.id;
              const badge = p.id === "orders" ? newCount : 0;
              return (
                <button key={p.id} onClick={() => setPage(p.id)} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:9,
                  border:"none", cursor:"pointer", fontFamily:"'Cairo',system-ui,sans-serif",
                  background: active ? "#EFF6FF" : "transparent",
                  color: active ? "#2563EB" : "#64748B",
                  fontWeight: active ? 700 : 500, fontSize:13,
                  transition:"all .15s",
                  borderRight: active ? "3px solid #2563EB" : "3px solid transparent",
                  textAlign:"right",
                }}
                  onMouseEnter={e => { if(!active) { e.currentTarget.style.background="#F8FAFC"; e.currentTarget.style.color="#334155"; }}}
                  onMouseLeave={e => { if(!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748B"; }}}>
                  <NavIcon path={p.icon} size={17} color={active?"#2563EB":"#94A3B8"}/>
                  <span style={{ flex:1 }}>{p.label}</span>
                  {badge > 0 && (
                    <span style={{ background:"#EF4444", color:"#fff", fontSize:9, fontWeight:900, borderRadius:10, padding:"1px 6px", minWidth:18, textAlign:"center" }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User + back */}
          <div style={{ padding:"12px 10px", borderTop:"1px solid #F1F5F9", display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 12px", background:"#F8FAFC", borderRadius:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#2563EB,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>👑</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#0F172A" }}>مدير النظام</div>
                <div style={{ fontSize:10, color:"#94A3B8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>admin@yougo.app</div>
              </div>
            </div>
            <button onClick={onBack} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"9px 12px", borderRadius:9, border:"1.5px solid #E2E8F0", background:"transparent", color:"#64748B", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'Cairo',system-ui,sans-serif", transition:"all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background="#F1F5F9"; }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; }}>
              ← رجوع للتطبيق
            </button>
          </div>
        </aside>

        {/* ═══════ MAIN ══════════════════════════════════════════════════ */}
        <div style={S.main}>

          {/* Top bar */}
          <header style={S.topbar}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {isMobile && (
                <button onClick={() => setMobileMenuOpen(p => !p)} style={{ background:"#F1F5F9", border:"none", borderRadius:9, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="#334155" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              )}
              <div>
                <div style={{ fontSize: isMobile ? 15 : 17, fontWeight:800, color:"#0F172A" }}>{PAGES.find(p=>p.id===page)?.label}</div>
                {!isMobile && <div style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>
                  {new Date().toLocaleDateString("ar-IL", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
                </div>}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {/* Notification bell */}
              <div style={{ position:"relative", cursor:"pointer" }}>
                <div style={{ width:38, height:38, borderRadius:9, background:"#F8FAFC", border:"1.5px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="#64748B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {newCount > 0 && <div style={{ position:"absolute", top:-3, right:-3, background:"#EF4444", color:"white", fontSize:9, fontWeight:900, minWidth:16, height:16, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>{newCount}</div>}
              </div>
              {/* Date badge */}
              <div style={{ background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"7px 14px", fontSize:12, fontWeight:600, color:"#475569", display:"flex", alignItems:"center", gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#94A3B8" strokeWidth="1.7"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#94A3B8" strokeWidth="1.7" strokeLinecap="round"/></svg>
                10 مارس 2026
              </div>
            </div>
          </header>

          {/* Page content */}
          <div style={S.content}>

{/* ══════════════════════ OVERVIEW ══════════════════════════════ */}
{page === "overview" && (() => {
  const payStats = ["كاش","بطاقة","Apple Pay"].map(m => ({ m, n:orders.filter(o=>o.payment_method===m||o.payment_method===m).length }));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* KPI Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { label:"طلبات اليوم",      val:todayOrders.length, sub:`${pending} معلق`,  color:"#2563EB", spark:[], trend:"+12%" },
          { label:"إيرادات اليوم",    val:`₪${todayRev}`,    sub:"شيكل",            color:"#10B981", spark:[], trend:"+8%"  },
          { label:"طلبات مكتملة",     val:completedOrders.length, sub:`من ${orders.length}`,  color:"#8B5CF6", spark:[], trend:"+5%"  },
          { label:"إجمالي الإيرادات", val:`₪${totalRev.toLocaleString()}`, sub:"كل الوقت", color:"#F59E0B", spark:[], trend:"+18%" },
        ].map((c, i) => (
          <Card key={i} style={{ padding:"20px", position:"relative", overflow:"hidden", cursor:"default" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${c.color}88,${c.color})` }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{c.label}</div>
                <div style={{ fontSize:28, fontWeight:900, color:"#0F172A", letterSpacing:-1, lineHeight:1 }}>{c.val}</div>
              </div>
              <AreaLine data={c.spark} color={c.color} w={80} h={40}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ background:`${c.color}15`, color:c.color, fontSize:10, fontWeight:700, borderRadius:6, padding:"2px 8px" }}>{c.trend}</span>
              <span style={{ fontSize:11, color:"#94A3B8" }}>{c.sub}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 280px", gap:14 }}>
        {/* Weekly orders */}
        <Card>
          <SectionHead title="الطلبات الأسبوعية" sub="آخر 7 أيام"
            action={<span style={{ background:"#EFF6FF", color:"#2563EB", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>هذا الأسبوع</span>}/>
          <div style={{ padding:"16px 22px 20px" }}>
            <MiniBar data={[]} color="#2563EB" h={90}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
              {W_LABELS.map((l, i) => <span key={i} style={{ flex:1, textAlign:"center", fontSize:9, color:"#94A3B8", fontWeight:500 }}>{l}</span>)}
            </div>
            <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between" }}>
              <div><div style={{ fontSize:22, fontWeight:900, color:"#0F172A" }}>{0}</div><div style={{ fontSize:11, color:"#94A3B8" }}>إجمالي الأسبوع</div></div>
              <div style={{ textAlign:"left" }}><div style={{ fontSize:22, fontWeight:900, color:"#10B981" }}>+{0}%</div><div style={{ fontSize:11, color:"#94A3B8" }}>نمو</div></div>
            </div>
          </div>
        </Card>

        {/* Monthly revenue */}
        <Card>
          <SectionHead title="الإيرادات الشهرية" sub="2026"
            action={<span style={{ background:"#F0FDF4", color:"#10B981", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>₪</span>}/>
          <div style={{ padding:"16px 22px 20px" }}>
            <MiniBar data={[]} color="#10B981" h={90}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
              {M_LABELS.map((l, i) => <span key={i} style={{ flex:1, textAlign:"center", fontSize:8, color:"#94A3B8" }}>{l.slice(0,3)}</span>)}
            </div>
            <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between" }}>
              <div><div style={{ fontSize:22, fontWeight:900, color:"#0F172A" }}>₪{0}</div><div style={{ fontSize:11, color:"#94A3B8" }}>إجمالي 2026</div></div>
              <div style={{ textAlign:"left" }}><div style={{ fontSize:22, fontWeight:900, color:"#2563EB" }}>₪{0}</div><div style={{ fontSize:11, color:"#94A3B8" }}>معدل شهري</div></div>
            </div>
          </div>
        </Card>

        {/* Donut + legend */}
        <Card>
          <SectionHead title="توزيع الطلبات"/>
          <div style={{ padding:"14px 18px 18px" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
              <Donut segments={donutSegs.length ? donutSegs : [{c:"#E2E8F0",val:1}]} size={130}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {Object.entries(ST).map(([lbl, m]) => {
                const n = orders.filter(o => o.status === lbl).length;
                const pct = orders.length ? Math.round(n/orders.length*100) : 0;
                return (
                  <div key={lbl} style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:m.c, flexShrink:0 }}/>
                    <span style={{ fontSize:11, color:"#475569", flex:1 }}>{lbl}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:m.c }}>{n}</span>
                    <span style={{ fontSize:10, color:"#CBD5E1", minWidth:28, textAlign:"left" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom row: recent orders + top restaurants */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:14 }}>
        {/* Recent orders */}
        <Card>
          <SectionHead title="آخر الطلبات" sub={`${orders.length} طلب إجمالي`}
            action={<button onClick={()=>setPage("orders")} style={{ background:"#EFF6FF", color:"#2563EB", border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Cairo',system-ui,sans-serif" }}>عرض الكل</button>}/>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8FAFC" }}>
                {["رقم الطلب","العميل","المطعم","المبلغ","الحالة","الوقت"].map(h => (
                  <th key={h} style={{ padding:"9px 16px", textAlign:"right", fontSize:10, color:"#94A3B8", fontWeight:700, letterSpacing:0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0,7).map((o, i) => (
                <tr key={o.id} style={{ borderTop:"1px solid #F8FAFC", cursor:"pointer", transition:"background .12s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#F8FAFC"}
                  onMouseLeave={e => e.currentTarget.style.background=""}
                  onClick={() => { setODetail(o); setPage("orders"); }}>
                  <td style={{ padding:"11px 16px", fontSize:11, fontWeight:700, color:"#94A3B8", fontFamily:"monospace" }}>{o.id}</td>
                  <td style={{ padding:"11px 16px", fontSize:13, fontWeight:600, color:"#0F172A" }}>{o.customer_name}</td>
                  <td style={{ padding:"11px 16px", fontSize:12, color:"#64748B" }}>{o.restaurant_name}</td>
                  <td style={{ padding:"11px 16px", fontSize:13, fontWeight:800, color:"#10B981" }}>₪{o.total}</td>
                  <td style={{ padding:"11px 16px" }}><Badge status={o.status}/></td>
                  <td style={{ padding:"11px 16px", fontSize:11, color:"#94A3B8" }}>{ago(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Top restaurants */}
        <Card>
          <SectionHead title="أفضل المطاعم" sub="حسب المبيعات"/>
          <div style={{ padding:"12px 18px 18px", display:"flex", flexDirection:"column", gap:10 }}>
            {rests.sort((a,b)=>(b.revenue||0)-(a.revenue||0)).slice(0,5).map((r, i) => (
              <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:["#FEF3C7","#EFF6FF","#F0FDF4","#F5F3FF","#FEF2F2"][i]||"#F8FAFC", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>
                  {r.img || "🍴"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</div>
                  <div style={{ fontSize:10, color:"#94A3B8", marginTop:1 }}>{r.orders||0} طلب</div>
                </div>
                <div style={{ textAlign:"left", flexShrink:0 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"#0F172A" }}>₪{(r.revenue||0).toLocaleString()}</div>
                  <div style={{ fontSize:10, color:"#94A3B8", textAlign:"left" }}>⭐ {r.rating}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Payment breakdown */}
          <div style={{ margin:"0 18px 18px", background:"#F8FAFC", borderRadius:10, padding:"14px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#0F172A", marginBottom:10 }}>طرق الدفع</div>
            {payStats.map(p => {
              const pct = orders.length ? Math.round(p.n/orders.length*100) : 0;
              return (
                <div key={p.m} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:11, color:"#475569", fontWeight:500 }}>{p.m}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"#0F172A" }}>{p.n} ({pct}%)</span>
                  </div>
                  <div style={{ height:5, background:"#E2E8F0", borderRadius:3 }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:PAY_COLORS[p.m]||"#94A3B8", borderRadius:3, transition:"width 1s ease" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
})()}

{/* ══════════════════════ ORDERS ════════════════════════════════ */}
{page === "orders" && (
  <div style={{ display:"flex", gap:16, height:"calc(100vh - 110px)", overflow:"hidden" }}>

    {/* Orders list */}
    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12, minWidth:0, overflow:"hidden" }}>
      {/* Toolbar */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", flexShrink:0 }}>
        <div style={{ position:"relative", flex:"1 1 200px", maxWidth:280 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <Input value={oSearch} onChange={e=>setOSearch(e.target.value)} placeholder="بحث…" style={{ width:"100%", paddingRight:34, boxSizing:"border-box" }}/>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["الكل","جديد","قيد التحضير","في الطريق","مكتمل","ملغي"].map(f => {
            const active = oFilter === f;
            const m = f !== "الكل" ? ST[f] : null;
            const cnt = f === "الكل" ? orders.length : orders.filter(o=>o.status===f).length;
            return (
              <button key={f} onClick={()=>setOFilter(f)} style={{
                padding:"7px 13px", borderRadius:8, cursor:"pointer", fontFamily:"'Cairo',system-ui,sans-serif",
                border: active ? `1.5px solid ${m?.c||"#2563EB"}44` : "1.5px solid #E2E8F0",
                background: active ? (m ? m.bg : "#EFF6FF") : "#fff",
                color: active ? (m?.c||"#2563EB") : "#64748B",
                fontWeight: active ? 700 : 500, fontSize:12, transition:"all .15s",
              }}>
                {f}{cnt > 0 && f !== "الكل" && <span style={{ opacity:.6, marginRight:3 }}>({cnt})</span>}
              </button>
            );
          })}
        </div>
        <div style={{ marginRight:"auto", display:"flex", alignItems:"center", gap:6, background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:8, padding:"6px 12px" }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#0F172A" }}>{fOrders.length}</span>
          <span style={{ fontSize:11, color:"#94A3B8" }}>طلب</span>
        </div>
      </div>

      {/* Table */}
      <Card style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <div style={{ overflowY:"auto", flex:1 }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead style={{ position:"sticky", top:0, zIndex:5 }}>
              <tr style={{ background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
                {["الرقم","العميل","المطعم","المبلغ","الطريقة","الحالة","الوقت"].map(h => (
                  <th key={h} style={{ padding:"11px 16px", textAlign:"right", fontSize:10, color:"#94A3B8", fontWeight:700, letterSpacing:0.5, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:"center", padding:"60px 0", color:"#CBD5E1", fontSize:14 }}>لا توجد طلبات</td></tr>
              ) : fOrders.map((o, i) => {
                const selected = oDetail?.id === o.id;
                return (
                  <tr key={o.id}
                    onClick={() => setODetail(selected ? null : o)}
                    style={{ borderTop:"1px solid #F8FAFC", cursor:"pointer", transition:"background .1s", background: selected ? "#EFF6FF" : "" }}
                    onMouseEnter={e => { if(!selected) e.currentTarget.style.background="#F8FAFC"; }}
                    onMouseLeave={e => { if(!selected) e.currentTarget.style.background=""; }}>
                    <td style={{ padding:"12px 16px", fontSize:11, fontWeight:700, color:"#94A3B8", fontFamily:"monospace", whiteSpace:"nowrap" }}>{o.id}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>👤</div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:"#0F172A", whiteSpace:"nowrap" }}>{o.customer_name}</div>
                          <div style={{ fontSize:10, color:"#94A3B8" }}>{o.phone||""}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:"#475569", whiteSpace:"nowrap" }}>{o.restaurant_name}</td>
                    <td style={{ padding:"12px 16px", fontSize:14, fontWeight:800, color:"#10B981", whiteSpace:"nowrap" }}>₪{o.total}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontSize:11, fontWeight:600, color:(PAY_COLORS[o.payment_method]||"#64748B") }}>{o.payment_method||"—"}</span>
                    </td>
                    <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                      <Badge status={o.status||"جديد"}/>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>{ago(o.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>

    {/* Order detail panel */}
    {oDetail ? (
      <div style={{ width:320, flexShrink:0, display:"flex", flexDirection:"column", gap:0, overflowY:"auto" }}>
        <Card style={{ overflow:"hidden" }}>
          {/* Header */}
          <div style={{ background:"linear-gradient(135deg,#2563EB,#1D4ED8)", padding:"18px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ color:"rgba(255,255,255,.7)", fontSize:11, fontWeight:600 }}>تفاصيل الطلب</span>
              <button onClick={() => setODetail(null)} style={{ background:"rgba(255,255,255,.15)", border:"none", color:"#fff", borderRadius:6, width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16 }}>×</button>
            </div>
            <div style={{ color:"#fff", fontSize:17, fontWeight:900 }}>{oDetail.id}</div>
            <div style={{ color:"rgba(255,255,255,.7)", fontSize:12, marginTop:2 }}>{ago(oDetail.created_at)}</div>
          </div>

          {/* Customer */}
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:0.8 }}>بيانات العميل</div>
            <div style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:3 }}>{oDetail.customer_name}</div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:2 }}>{oDetail.customer_phone||"—"}</div>
            <div style={{ fontSize:12, color:"#64748B", display:"flex", alignItems:"center", gap:4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="#94A3B8" strokeWidth="1.8"/><circle cx="12" cy="11" r="3" stroke="#94A3B8" strokeWidth="1.8"/></svg>
              {oDetail.customer_address||"—"}
            </div>
          </div>

          {/* Items */}
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:0.8 }}>المطعم والعناصر</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#2563EB", marginBottom:8 }}>{oDetail.restaurant_name}</div>
            {(oDetail.items||[`${oDetail.items_count||1} عنصر`]).map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom: i < (oDetail.items||[]).length-1 ? "1px dashed #F1F5F9" : "none" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#CBD5E1", flexShrink:0 }}/>
                <span style={{ fontSize:12, color:"#475569" }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Financials */}
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748B", marginBottom:5 }}>
              <span>المجموع الفرعي</span><span>₪{(oDetail.total||0) - (oDetail.delivery_fee||10)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748B", marginBottom:8 }}>
              <span>رسوم التوصيل</span><span>₪{oDetail.delivery_fee||10}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:800, color:"#0F172A", paddingTop:8, borderTop:"1.5px solid #E2E8F0" }}>
              <span>الإجمالي</span><span style={{ color:"#10B981" }}>₪{oDetail.total}</span>
            </div>
            <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:11, color:"#64748B" }}>طريقة الدفع:</span>
              <span style={{ fontSize:11, fontWeight:700, color:PAY_COLORS[oDetail.payment_method]||"#64748B" }}>{oDetail.payment_method||"—"}</span>
            </div>
          </div>

          {/* Status change */}
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:0.8 }}>تغيير الحالة</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {Object.entries(ST).map(([s, m]) => (
                <button key={s} onClick={() => setStatus(oDetail.id, s)} style={{
                  padding:"5px 11px", borderRadius:20, border:`1.5px solid ${m.c}33`,
                  background: oDetail.status === s ? m.bg : "#fff",
                  color: oDetail.status === s ? m.c : "#64748B",
                  fontWeight: oDetail.status === s ? 700 : 500,
                  fontSize:11, cursor:"pointer", fontFamily:"'Cairo',system-ui,sans-serif",
                  boxShadow: oDetail.status === s ? `0 0 0 1.5px ${m.c}33` : "none",
                  transition:"all .15s",
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding:"14px 20px", display:"flex", gap:9 }}>
            <Btn variant="danger" onClick={() => delOrder(oDetail.id)} style={{ flex:1, justifyContent:"center" }}>حذف الطلب</Btn>
            <Btn variant="ghost" onClick={() => setODetail(null)} style={{ flex:1, justifyContent:"center" }}>إغلاق</Btn>
          </div>
        </Card>
      </div>
    ) : (
      <div style={{ width:280, flexShrink:0 }}>
        <Card style={{ padding:"32px 20px", textAlign:"center", background:"#F8FAFC", border:"2px dashed #E2E8F0" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
          <div style={{ fontSize:13, fontWeight:600, color:"#94A3B8" }}>اضغط على طلب لعرض تفاصيله</div>
        </Card>
      </div>
    )}
  </div>
)}

{/* ══════════════════════ RESTAURANTS ══════════════════════════ */}
{page === "restaurants" && (
  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

    {/* Summary cards */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
      {[
        { l:"إجمالي المطاعم",    v:rests.length,                                    c:"#2563EB" },
        { l:"مطاعم نشطة",        v:rests.filter(r=>r.active!==false).length,         c:"#10B981" },
        { l:"موثّقة",             v:rests.filter(r=>r.verified).length,              c:"#8B5CF6" },
        { l:"إجمالي الطلبات",    v:rests.reduce((s,r)=>s+(r.orders||0),0).toLocaleString(), c:"#F59E0B" },
      ].map((s,i) => (
        <Card key={i} style={{ padding:"16px 20px", borderTop:`3px solid ${s.c}` }}>
          <div style={{ fontSize:24, fontWeight:900, color:"#0F172A" }}>{s.v}</div>
          <div style={{ fontSize:11, color:"#94A3B8", marginTop:3 }}>{s.l}</div>
        </Card>
      ))}
    </div>

    {/* Toolbar */}
    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
      <div style={{ position:"relative", flex:"1 1 220px", maxWidth:300 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <Input value={rSearch} onChange={e=>setRSearch(e.target.value)} placeholder="بحث بالاسم أو المدينة…" style={{ width:"100%", paddingRight:34, boxSizing:"border-box" }}/>
      </div>
      <div style={{ marginRight:"auto" }}/>
      <Btn onClick={() => { setShowAddR(!showAddR); setEditR(null); }}>+ إضافة مطعم</Btn>
    </div>

    {/* Add form */}
    {showAddR && (
      <Card style={{ padding:"22px", border:"2px solid #DBEAFE", animation:"fadeUp .25s ease" }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:16 }}>➕ إضافة مطعم جديد</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:10, marginBottom:14 }}>
          {[["name","اسم المطعم *"],["cat","الفئة"],["city","المدينة"],["phone","الهاتف"],["hours","ساعات العمل"]].map(([k,l]) => (
            <div key={k}>
              <label style={{ fontSize:11, color:"#64748B", display:"block", marginBottom:4, fontWeight:600 }}>{l}</label>
              <Input value={newR[k]} onChange={e=>setNewR(p=>({...p,[k]:e.target.value}))} placeholder={l} style={{ width:"100%", boxSizing:"border-box" }}/>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={addRest} disabled={savingR}>{savingR ? "جاري الحفظ…" : "حفظ المطعم"}</Btn>
          <Btn variant="ghost" onClick={() => setShowAddR(false)}>إلغاء</Btn>
        </div>
      </Card>
    )}

    {/* Restaurants table */}
    <Card>
      <SectionHead title="قائمة المطاعم" sub={`${fRests.length} مطعم`}/>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
            {["المطعم","الفئة","المدينة","التقييم","الطلبات","الإيرادات","الحالة","إجراءات"].map(h => (
              <th key={h} style={{ padding:"11px 16px", textAlign:"right", fontSize:10, color:"#94A3B8", fontWeight:700, letterSpacing:0.5, whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fRests.map((r, i) => (
            <tr key={r.id} style={{ borderTop:"1px solid #F8FAFC", transition:"background .1s" }}
              onMouseEnter={e => e.currentTarget.style.background="#F8FAFC"}
              onMouseLeave={e => e.currentTarget.style.background=""}>
              {editR?.id === r.id ? (
                <td colSpan={8} style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", gap:9, alignItems:"center", flexWrap:"wrap" }}>
                    {[["name","الاسم"],["category","الفئة"],["location","المدينة"],["phone","الهاتف"],["hours","الساعات"]].map(([k,l]) => (
                      <Input key={k} value={editR[k]||""} onChange={e=>setEditR(p=>({...p,[k]:e.target.value}))} placeholder={l} style={{ flex:"1 1 120px", boxSizing:"border-box" }}/>
                    ))}
                    <Btn onClick={saveRest} disabled={savingR} variant="success">{savingR?"…":"حفظ"}</Btn>
                    <Btn variant="ghost" onClick={() => setEditR(null)}>إلغاء</Btn>
                  </div>
                </td>
              ) : (
                <>
                  <td style={{ padding:"13px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"#F8FAFC", border:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:19, flexShrink:0 }}>{r.img||"🍴"}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{r.name}</div>
                        <div style={{ fontSize:10, color:"#94A3B8", marginTop:1, display:"flex", gap:5, alignItems:"center" }}>
                          {r.verified && <span style={{ background:"#EFF6FF", color:"#2563EB", borderRadius:4, padding:"1px 5px", fontSize:9, fontWeight:700 }}>✓ موثّق</span>}
                          {r.hours && <span>{r.hours}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"13px 16px", fontSize:12, color:"#475569" }}>{r.category||"—"}</td>
                  <td style={{ padding:"13px 16px", fontSize:12, color:"#475569" }}>{r.location||"—"}</td>
                  <td style={{ padding:"13px 16px" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#F59E0B" }}>★ {r.rating||"—"}</span>
                    <span style={{ fontSize:10, color:"#94A3B8", marginRight:3 }}>({r.reviews||0})</span>
                  </td>
                  <td style={{ padding:"13px 16px", fontSize:13, fontWeight:700, color:"#0F172A" }}>{(r.orders||0).toLocaleString()}</td>
                  <td style={{ padding:"13px 16px", fontSize:13, fontWeight:700, color:"#10B981" }}>₪{(r.revenue||0).toLocaleString()}</td>
                  <td style={{ padding:"13px 16px" }}>
                    <span style={{ background: r.active!==false?"#ECFDF5":"#FEF2F2", color:r.active!==false?"#10B981":"#EF4444", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                      {r.active!==false?"نشط":"متوقف"}
                    </span>
                  </td>
                  <td style={{ padding:"13px 16px" }}>
                    <div style={{ display:"flex", gap:7 }}>
                      <Btn variant="ghost" onClick={() => { setEditR({...r}); setShowAddR(false); }} style={{ padding:"5px 11px", fontSize:11 }}>تعديل</Btn>
                      <Btn variant={r.active!==false?"danger":"success"} onClick={() => toggleRest(r.id, r.active!==false)} style={{ padding:"5px 11px", fontSize:11 }}>
                        {r.active!==false?"إيقاف":"تفعيل"}
                      </Btn>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
)}

{/* ══════════════════════ USERS ═════════════════════════════════ */}
{page === "users" && (
  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

    {/* Summary */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
      {[
        { l:"إجمالي المستخدمين", v:users.length,                                   c:"#2563EB" },
        { l:"مستخدمون نشطون",   v:users.filter(u=>u.active!==false).length,         c:"#10B981" },
        { l:"محظورون",          v:users.filter(u=>u.active===false).length,          c:"#EF4444" },
        { l:"إجمالي الطلبات",   v:users.reduce((s,u)=>s+(u.orders_count||0),0),           c:"#8B5CF6" },
      ].map((s,i) => (
        <Card key={i} style={{ padding:"16px 20px", borderTop:`3px solid ${s.c}` }}>
          <div style={{ fontSize:24, fontWeight:900, color:"#0F172A" }}>{s.v}</div>
          <div style={{ fontSize:11, color:"#94A3B8", marginTop:3 }}>{s.l}</div>
        </Card>
      ))}
    </div>

    {/* Toolbar */}
    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
      <div style={{ position:"relative", flex:"1 1 220px", maxWidth:300 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <Input value={uSearch} onChange={e=>setUSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف…" style={{ width:"100%", paddingRight:34, boxSizing:"border-box" }}/>
      </div>
      <div style={{ fontSize:12, color:"#94A3B8", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:8, padding:"7px 12px" }}>{fUsers.length} مستخدم</div>
    </div>

    {/* Table */}
    <Card>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
            {["المستخدم","الهاتف","المدينة","الطلبات","آخر طلب","انضم","الحالة","إجراء"].map(h => (
              <th key={h} style={{ padding:"11px 18px", textAlign:"right", fontSize:10, color:"#94A3B8", fontWeight:700, letterSpacing:0.5, whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fUsers.map((u, i) => (
            <tr key={u.id} style={{ borderTop:"1px solid #F8FAFC", transition:"background .1s" }}
              onMouseEnter={e => e.currentTarget.style.background="#F8FAFC"}
              onMouseLeave={e => e.currentTarget.style.background=""}>
              <td style={{ padding:"13px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:10, background: u.active!==false?"#EFF6FF":"#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>👤</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{u.name||u.full_name||"—"}</div>
                    <div style={{ fontSize:10, color:"#94A3B8" }}>{u.id}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding:"13px 18px", fontSize:12, color:"#475569", fontFamily:"monospace" }}>{u.phone||"—"}</td>
              <td style={{ padding:"13px 18px", fontSize:12, color:"#475569" }}>{u.city||"—"}</td>
              <td style={{ padding:"13px 18px" }}>
                <span style={{ fontSize:14, fontWeight:800, color: (u.orders_count||0)>15?"#10B981":(u.orders_count||0)>5?"#2563EB":"#64748B" }}>{u.orders_count||0}</span>
              </td>
              <td style={{ padding:"13px 18px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>{u.lastOrder ? ago(u.lastOrder) : "—"}</td>
              <td style={{ padding:"13px 18px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>{u.joined||"—"}</td>
              <td style={{ padding:"13px 18px" }}>
                <span style={{ background: u.active!==false?"#ECFDF5":"#FEF2F2", color:u.active!==false?"#10B981":"#EF4444", borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700 }}>
                  {u.active!==false?"نشط":"محظور"}
                </span>
              </td>
              <td style={{ padding:"13px 18px" }}>
                <Btn variant={u.active!==false?"danger":"success"} onClick={() => toggleUser(u.id, u.active!==false)} style={{ padding:"5px 12px", fontSize:11 }}>
                  {u.active!==false?"حظر":"تفعيل"}
                </Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
)}

{/* ══════════════════════ ANALYTICS ════════════════════════════ */}
{page === "analytics" && (
  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

    {/* Top KPI row */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
      {[
        { l:"إجمالي الطلبات",   v:orders.length,                              c:"#2563EB", icon:"📦" },
        { l:"مكتملة",           v:completedOrders.length,                      c:"#10B981", icon:"✅" },
        { l:"ملغاة",             v:orders.filter(o=>o.status==="ملغي").length, c:"#EF4444", icon:"❌" },
        { l:"إجمالي الإيرادات", v:`₪${totalRev.toLocaleString()}`,            c:"#F59E0B", icon:"💰" },
      ].map((s,i) => (
        <Card key={i} style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${s.c}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{s.icon}</div>
          </div>
          <div style={{ fontSize:26, fontWeight:900, color:"#0F172A", letterSpacing:-0.5 }}>{s.v}</div>
          <div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{s.l}</div>
          <div style={{ marginTop:10, height:3, background:"#F1F5F9", borderRadius:2 }}>
            <div style={{ height:"100%", width:`${Math.min(100, (typeof s.v==="number"?s.v/orders.length*100:80))}%`, background:s.c, borderRadius:2 }}/>
          </div>
        </Card>
      ))}
    </div>

    {/* Two charts */}
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Card>
        <SectionHead title="الطلبات الأسبوعية" sub="آخر 7 أيام"/>
        <div style={{ padding:"16px 22px 22px" }}>
          <MiniBar data={[]} color="#2563EB" h={120}/>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            {W_LABELS.map((l, i) => <span key={i} style={{ flex:1, textAlign:"center", fontSize:10, color:"#94A3B8" }}>{l}</span>)}
          </div>
        </div>
      </Card>
      <Card>
        <SectionHead title="الإيرادات الشهرية" sub="2026"/>
        <div style={{ padding:"16px 22px 22px" }}>
          <MiniBar data={[]} color="#10B981" h={120}/>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            {M_LABELS.map((l, i) => <span key={i} style={{ flex:1, textAlign:"center", fontSize:8, color:"#94A3B8" }}>{l.slice(0,3)}</span>)}
          </div>
        </div>
      </Card>
    </div>

    {/* Status breakdown + city stats */}
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Card>
        <SectionHead title="تفصيل حالات الطلبات"/>
        <div style={{ padding:"16px 22px 22px", display:"flex", flexDirection:"column", gap:14 }}>
          {Object.entries(ST).map(([lbl, m]) => {
            const n = orders.filter(o => o.status === lbl).length;
            const pct = orders.length ? Math.round(n/orders.length*100) : 0;
            return (
              <div key={lbl}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:m.c }}/>
                    <span style={{ fontSize:13, color:"#475569", fontWeight:500 }}>{lbl}</span>
                  </div>
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    <span style={{ fontSize:13, fontWeight:800, color:m.c }}>{n}</span>
                    <span style={{ fontSize:11, color:"#94A3B8", minWidth:32 }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height:7, background:"#F1F5F9", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${m.c}88,${m.c})`, borderRadius:4, transition:"width 1s cubic-bezier(.16,1,.3,1)" }}/>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionHead title="توزيع حسب المدينة"/>
        <div style={{ padding:"16px 22px 22px", display:"flex", flexDirection:"column", gap:12 }}>
          {["رامة","الناصرة","نحف","شفاعمرو"].map((city, i) => {
            const n = users.filter(u => u.city === city).length;
            const pct = users.length ? Math.round(n/users.length*100) : 0;
            const cols = ["#2563EB","#10B981","#8B5CF6","#F59E0B"];
            return (
              <div key={city}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, color:"#475569", fontWeight:500 }}>{city}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:cols[i] }}>{n} مستخدم ({pct}%)</span>
                </div>
                <div style={{ height:7, background:"#F1F5F9", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:cols[i], borderRadius:4, transition:"width 1s ease" }}/>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop:8, paddingTop:14, borderTop:"1px solid #F1F5F9" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#0F172A", marginBottom:10 }}>أفضل المستخدمين</div>
            {users.sort((a,b)=>(b.spent||0)-(a.spent||0)).slice(0,3).map((u,i) => (
              <div key={u.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 0", borderBottom: i<2?"1px solid #F8FAFC":"none" }}>
                <div style={{ width:26, height:26, borderRadius:8, background:["#FEF3C7","#EFF6FF","#F0FDF4"][i], display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>{["🥇","🥈","🥉"][i]}</div>
                <span style={{ flex:1, fontSize:12, fontWeight:600, color:"#0F172A" }}>{u.name}</span>
                <span style={{ fontSize:12, fontWeight:800, color:"#10B981" }}>₪{(u.total_spent||0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  </div>
)}

{/* ══════════════════════ SETTINGS ══════════════════════════════ */}
{page === "settings" && (
  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, maxWidth:920 }}>

    {/* App settings */}
    <Card>
      <SectionHead title="⚙️ إعدادات التطبيق" sub="الإعدادات الأساسية للمنصة"/>
      <div style={{ padding:"20px 22px" }}>
        {[
          { l:"اسم التطبيق",          k:"name",        ph:"Yougo" },
          { l:"رقم الدعم الفني",       k:"phone",       ph:"972-50-123-4567" },
          { l:"رسوم التوصيل الأساسية", k:"deliveryFee", ph:"10" },
          { l:"الحد الأدنى للطلب",     k:"minOrder",    ph:"40" },
          { l:"توصيل مجاني عند (₪)",   k:"freeAt",      ph:"150" },
          { l:"نسبة العمولة (%)",       k:"commission",  ph:"15" },
        ].map(f => (
          <div key={f.k} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:"#64748B", display:"block", marginBottom:5, fontWeight:700 }}>{f.l}</label>
            <Input value={cfg[f.k]||""} onChange={e => setCfg(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", boxSizing:"border-box", fontSize:14 }}/>
          </div>
        ))}
        <Btn onClick={saveCfg} style={{ width:"100%", justifyContent:"center", background: cfgSaved?"#10B981":"linear-gradient(135deg,#2563EB,#1D4ED8)", transition:"background .3s" }}>
          {cfgSaved ? "✓ تم الحفظ بنجاح" : "حفظ الإعدادات"}
        </Btn>
      </div>
    </Card>

    {/* System info */}
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <Card>
        <SectionHead title="🗄️ إحصائيات النظام"/>
        <div style={{ padding:"16px 22px 20px", display:"flex", flexDirection:"column", gap:9 }}>
          {[
            { l:"إجمالي الطلبات",         v:orders.length,                                  c:"#2563EB" },
            { l:"المطاعم المسجلة",        v:rests.length,                                   c:"#10B981" },
            { l:"المستخدمون النشطون",    v:users.filter(u=>u.active!==false).length,        c:"#8B5CF6" },
            { l:"الطلبات المعلقة الآن",  v:pending,                                         c:"#F59E0B" },
            { l:"إجمالي الإيرادات",       v:`₪${totalRev.toLocaleString()}`,                c:"#10B981" },
          ].map(it => (
            <div key={it.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:9, padding:"11px 14px" }}>
              <span style={{ fontSize:12, color:"#64748B" }}>{it.l}</span>
              <span style={{ fontSize:16, fontWeight:900, color:it.c }}>{it.v}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding:"18px 22px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#0F172A", marginBottom:12 }}>🔗 حالة الاتصال</div>
        <div style={{ display:"flex", alignItems:"center", gap:10, background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#10B981", animation:"livePulse 2s infinite", flexShrink:0 }}/>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#059669" }}>Supabase — متصل</div>
            <div style={{ fontSize:10, color:"#6EE7B7", marginTop:1 }}>eppsgrewrxdjdctlrebf.supabase.co</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"12px 14px" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#2563EB", flexShrink:0 }}/>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1D4ED8" }}>Realtime — مفعّل</div>
            <div style={{ fontSize:10, color:"#93C5FD", marginTop:1 }}>الطلبات تصل فورياً</div>
          </div>
        </div>
      </Card>
    </div>
  </div>
)}

          </div>{/* end content */}
        </div>{/* end main */}


        {/* ═══ MOBILE BOTTOM NAV ═══════════════════════════════════════════ */}
        {isMobile && (
          <>
            {/* Slide-over menu */}
            {mobileMenuOpen && (
              <div style={{ position:"fixed", inset:0, zIndex:200 }} onClick={() => setMobileMenuOpen(false)}>
                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.4)" }}/>
                <div style={{ position:"absolute", right:0, top:0, bottom:0, width:260, background:"#fff", display:"flex", flexDirection:"column", boxShadow:"-4px 0 20px rgba(0,0,0,.15)", animation:"slideIn .25s ease" }} onClick={e => e.stopPropagation()}>
                  <div style={{ padding:"50px 18px 16px", borderBottom:"1px solid #F1F5F9" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#2563EB,#1D4ED8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="20" height="20" viewBox="0 0 60 60" fill="none"><path d="M10 44V16l16 16V16" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M32 28h18M41 21l9 7-9 7" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div><div style={{ fontWeight:900, fontSize:16, color:"#0F172A" }}>YOUGO</div><div style={{ fontSize:9, color:"#94A3B8", fontWeight:600 }}>ADMIN PORTAL</div></div>
                    </div>
                  </div>
                  <nav style={{ flex:1, padding:"10px 10px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
                    {PAGES.map(p => {
                      const active = page === p.id;
                      const badge = p.id === "orders" ? newCount : 0;
                      return (
                        <button key={p.id} onClick={() => { setPage(p.id); setMobileMenuOpen(false); }} style={{
                          display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderRadius:9,
                          border:"none", cursor:"pointer", fontFamily:"'Cairo',system-ui,sans-serif",
                          background: active ? "#EFF6FF" : "transparent",
                          color: active ? "#2563EB" : "#64748B",
                          fontWeight: active ? 700 : 500, fontSize:14,
                          borderRight: active ? "3px solid #2563EB" : "3px solid transparent",
                          textAlign:"right", width:"100%",
                        }}>
                          <NavIcon path={p.icon} size={18} color={active?"#2563EB":"#94A3B8"}/>
                          <span style={{ flex:1 }}>{p.label}</span>
                          {badge > 0 && <span style={{ background:"#EF4444", color:"#fff", fontSize:9, fontWeight:900, borderRadius:10, padding:"1px 6px" }}>{badge}</span>}
                        </button>
                      );
                    })}
                  </nav>
                  <div style={{ padding:"14px", borderTop:"1px solid #F1F5F9" }}>
                    <button onClick={onBack} style={{ width:"100%", background:"#F1F5F9", border:"none", borderRadius:9, padding:"11px", color:"#475569", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'Cairo',system-ui,sans-serif" }}>
                      ← رجوع للتطبيق
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom nav */}
            <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"1px solid #E2E8F0", display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)", maxWidth:"100vw" }}>
              {PAGES.slice(0,5).map(p => {
                const active = page === p.id;
                const badge = p.id === "orders" ? newCount : 0;
                return (
                  <button key={p.id} onClick={() => setPage(p.id)} style={{
                    flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                    padding:"8px 4px 6px", border:"none", background:"none", cursor:"pointer", position:"relative",
                  }}>
                    {badge > 0 && <div style={{ position:"absolute", top:5, right:"50%", transform:"translateX(8px)", background:"#EF4444", color:"#fff", fontSize:8, fontWeight:900, minWidth:14, height:14, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 2px" }}>{badge}</div>}
                    <NavIcon path={p.icon} size={20} color={active?"#2563EB":"#9CA3AF"}/>
                    <span style={{ fontSize:9, fontWeight: active ? 700 : 400, color: active ? "#2563EB" : "#9CA3AF" }}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width:5px; height:5px; }
          ::-webkit-scrollbar-track { background:#F8FAFC; }
          ::-webkit-scrollbar-thumb { background:#E2E8F0; border-radius:3px; }
          ::-webkit-scrollbar-thumb:hover { background:#CBD5E1; }
          select option { background:#fff; color:#0F172A; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
          @keyframes toastSlide { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
      </div>
    </>
  );
}

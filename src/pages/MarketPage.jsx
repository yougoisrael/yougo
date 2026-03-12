import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  C, hexA,
  IcoSearch, IcoClose, IcoHome, IcoChevDown, IcoShield,
  IcoPin, IcoFork, IcoStore, IcoUser, IcoBack,
  IcoPackage, IcoCreditCard, IcoUsers, IcoHelp, IcoLock,
  IcoClock,
} from "../components/Icons";
import BottomNav from "../components/BottomNav";

function YougoLogo({ size = 36, white = false }) {
  const bg = white ? "white" : C.red, fg = white ? C.red : "white";
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="16" fill={bg}/>
      <path d="M12 42V20l16 16V20" stroke={fg} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M34 30h16M42 24l8 6-8 6" stroke={fg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ══════════════════════════════════════════════════
// MARKET BANNER SLIDES — same as HomePage
// ══════════════════════════════════════════════════
const MKT_BANNERS = [
  { id:1, title:"הבית תמיד מוכן",    sub:"כל מה שחסר בבית מגיע בחצי שעה", tag:"Yougo מרקט 🛒", bg:"linear-gradient(135deg,#C8102E 0%,#7B0D1E 100%)" },
  { id:2, title:"משלוח מהיר",         sub:"עד 30 דקות בלבד",                tag:"חדש ✨",         bg:"linear-gradient(135deg,#1D4ED8,#7C3AED)" },
  { id:3, title:"הזמן חברים",         sub:"וקבל הנחה!",                     tag:"מבצע 🎁",        bg:"linear-gradient(135deg,#059669,#0D9488)" },
];

// ══════════════════════════════════════════════════
// MARKET CATEGORY ICONS — same size & style as מסעדות
// ══════════════════════════════════════════════════

// הכל — exact same style as HomePage IcoCatAll (4 colored squares)
function IcoAll({ active }) {
  const c = active ? "white" : null;
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <rect x="4"  y="4"  width="14" height="14" rx="4" fill={c || "#F59E0B"}/>
      <rect x="22" y="4"  width="14" height="14" rx="4" fill={c || "#C8102E"}/>
      <rect x="4"  y="22" width="14" height="14" rx="4" fill={c || "#16A34A"}/>
      <rect x="22" y="22" width="14" height="14" rx="4" fill={c || "#3B82F6"}/>
    </svg>
  );
}

function IcoSupermarket({ active }) {
  const main  = active ? "white" : "#16A34A";
  const light = active ? "rgba(255,255,255,0.55)" : "#DCFCE7";
  const p1    = active ? "rgba(255,255,255,0.8)"  : "#FCD34D";
  const p2    = active ? "rgba(255,255,255,0.55)" : "#F97316";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <rect x="5" y="12" width="30" height="22" rx="2" fill={light}/>
      <rect x="5" y="18" width="30" height="2"  rx="1" fill={main}/>
      <rect x="5" y="26" width="30" height="2"  rx="1" fill={main}/>
      <rect x="8"  y="13" width="5" height="5" rx="1.5" fill={p1}/>
      <rect x="15" y="13" width="5" height="5" rx="1.5" fill={p2}/>
      <rect x="22" y="13" width="5" height="5" rx="1.5" fill={main}/>
      <rect x="8"  y="21" width="5" height="5" rx="1.5" fill={p2}/>
      <rect x="15" y="21" width="5" height="5" rx="1.5" fill={main}/>
      <rect x="22" y="21" width="5" height="5" rx="1.5" fill={p1}/>
      <rect x="5" y="7" width="30" height="6" rx="2" fill={main}/>
      <circle cx="20" cy="10" r="1.5" fill={active ? "rgba(0,0,0,0.2)" : "white"}/>
    </svg>
  );
}

function IcoPharmacy({ active }) {
  const main = active ? "white" : "#2563EB";
  const bg_  = active ? "rgba(255,255,255,0.15)" : "#DBEAFE";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <rect x="7" y="10" width="26" height="25" rx="3" fill={bg_}/>
      <rect x="17" y="15" width="6"  height="16" rx="2" fill={main}/>
      <rect x="12" y="20" width="16" height="6"  rx="2" fill={main}/>
      <rect x="7"  y="5"  width="26" height="6"  rx="2" fill={main}/>
    </svg>
  );
}

function IcoPet({ active }) {
  const main  = active ? "white" : "#7C3AED";
  const light = active ? "rgba(255,255,255,0.55)" : "#C4B5FD";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <ellipse cx="22" cy="26" rx="11" ry="8" fill={main}/>
      <circle  cx="33" cy="18" r="7"          fill={main}/>
      <ellipse cx="37" cy="13" rx="3" ry="5"  fill={light} transform="rotate(20 37 13)"/>
      <circle  cx="35" cy="17" r="1.5"        fill={active ? "rgba(0,0,0,0.25)" : "#1E1B4B"}/>
      <ellipse cx="38" cy="20" rx="2" ry="1.5" fill={active ? "rgba(0,0,0,0.2)" : "#4C1D95"}/>
      <path d="M11 22c-4-2-6-6-4-8s5 0 4 4" fill={light}/>
      <ellipse cx="16" cy="33" rx="3" ry="2" fill={light}/>
      <ellipse cx="26" cy="34" rx="3" ry="2" fill={light}/>
    </svg>
  );
}

function IcoFlowers({ active }) {
  const pink   = active ? "white" : "#DB2777";
  const yellow = active ? "rgba(255,255,255,0.8)" : "#FCD34D";
  const green  = active ? "rgba(255,255,255,0.45)" : "#16A34A";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <path d="M20 38V20" stroke={green} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 28c-4-1-6-4-4-6 2-1 5 1 4 6z" fill={green}/>
      <circle cx="20" cy="14" r="4"   fill={pink}/>
      <circle cx="26" cy="18" r="3.5" fill={pink}/>
      <circle cx="14" cy="18" r="3.5" fill={pink}/>
      <circle cx="25" cy="11" r="3.5" fill={pink}/>
      <circle cx="15" cy="11" r="3.5" fill={pink}/>
      <circle cx="20" cy="14" r="3"   fill={yellow}/>
    </svg>
  );
}

function IcoElectronics({ active }) {
  const dark = active ? "white" : "#0F172A";
  const blue = active ? "rgba(255,255,255,0.6)" : "#3B82F6";
  const scrn = active ? "rgba(255,255,255,0.35)" : "#1E293B";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <rect x="6"  y="9"  width="28" height="20" rx="3" fill={dark}/>
      <rect x="9"  y="12" width="22" height="14" rx="2" fill={blue}/>
      <rect x="3"  y="29" width="34" height="4"  rx="2" fill={dark}/>
      <path d="M16 22c2-2 6-2 8 0"    stroke={active?"rgba(0,0,0,0.3)":"white"} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M18 20c1-1 3-1 4 0"    stroke={active?"rgba(0,0,0,0.3)":"white"} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="20" cy="24" r="1.5" fill={active ? "rgba(0,0,0,0.3)" : "white"}/>
    </svg>
  );
}

function IcoFashion({ active }) {
  const main  = active ? "white" : "#9333EA";
  const light = active ? "rgba(255,255,255,0.45)" : "#E9D5FF";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <path d="M14 8l-8 8 5 2v16h18V18l5-2-8-8" fill={main}/>
      <path d="M14 8c0 4 12 4 12 0" fill={light}/>
      <line x1="20" y1="12" x2="20" y2="34" stroke={light} strokeWidth="1.2" strokeDasharray="2 2"/>
    </svg>
  );
}

function IcoBakery({ active }) {
  const main  = active ? "white" : "#B45309";
  const light = active ? "rgba(255,255,255,0.55)" : "#FCD34D";
  const steam = active ? "rgba(255,255,255,0.35)" : "#D1D5DB";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <path d="M14 8c0-2 2-2 2-4" stroke={steam} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M20 6c0-2 2-2 2-4" stroke={steam} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M26 8c0-2 2-2 2-4" stroke={steam} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M8 28c0-8 6-14 12-14s12 6 12 14H8z" fill={main}/>
      <rect x="8" y="28" width="24" height="7" rx="3" fill={main}/>
      <path d="M14 22c2-3 10-3 12 0" stroke={light} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function IcoBeauty({ active }) {
  const main  = active ? "white" : "#E11D48";
  const light = active ? "rgba(255,255,255,0.55)" : "#FECDD3";
  const gold  = active ? "rgba(255,255,255,0.75)" : "#F59E0B";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <rect x="16" y="20" width="8" height="16" rx="3"  fill={main}/>
      <path d="M16 20c0-5 8-5 8 0" fill={gold}/>
      <rect x="15" y="28" width="10" height="4" rx="1" fill={light}/>
      <circle cx="10" cy="12" r="2"   fill={main}/>
      <circle cx="30" cy="10" r="2.5" fill={gold}/>
      <circle cx="8"  cy="22" r="1.5" fill={light}/>
      <path d="M28 18l2-2M28 22l2 2" stroke={main} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ══════════════════════════════════════════════════
// CATEGORY CONFIG — exact same shape as מסעדות CATS
// ══════════════════════════════════════════════════
const MKTCATS = [
  { id:"all",         Cmp:IcoAll,         label:"הכל",          bg:"#F59E0B", match:null },
  { id:"supermarket", Cmp:IcoSupermarket, label:"סופרמרקטים",  bg:"#16A34A", match:/supermarket/i },
  { id:"pharmacy",    Cmp:IcoPharmacy,    label:"בתי מרקחת",   bg:"#2563EB", match:/pharmacy/i },
  { id:"pet",         Cmp:IcoPet,         label:"חנויות חיות", bg:"#7C3AED", match:/pet/i },
  { id:"flowers",     Cmp:IcoFlowers,     label:"פרחים",        bg:"#DB2777", match:/flowers/i },
  { id:"electronics", Cmp:IcoElectronics, label:"אלקטרוניקה",  bg:"#0F172A", match:/electronics/i },
  { id:"fashion",     Cmp:IcoFashion,     label:"אופנה",        bg:"#9333EA", match:/fashion/i },
  { id:"bakery",      Cmp:IcoBakery,      label:"מאפיות",       bg:"#B45309", match:/bakery/i },
  { id:"beauty",      Cmp:IcoBeauty,      label:"יופי",          bg:"#E11D48", match:/beauty/i },
];

// ══════════════════════════════════════════════════
// STORE CARD — identical to RestCardH
// ══════════════════════════════════════════════════
function StoreCard({ s, onClick, delay }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        flexShrink:0, width:200, background:"white", borderRadius:22,
        overflow:"hidden", cursor:"pointer",
        boxShadow: pressed ? "0 2px 8px rgba(0,0,0,0.1)" : "0 4px 16px rgba(0,0,0,0.08)",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition:"transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
        animation:`slideUp 0.4s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms both`,
      }}
    >
      <div style={{
        height:110,
        background:`linear-gradient(135deg,${hexA(s.cover_color||"#C8102E","33")},${hexA(s.cover_color||"#C8102E","55")})`,
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative", overflow:"hidden",
      }}>
        {s.image_url
          ? <img src={s.image_url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={s.name}/>
          : <span style={{ fontSize:52 }}>{s.logo_emoji || "🏪"}</span>
        }
        {s.active === false && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontSize:11, fontWeight:700, background:"rgba(0,0,0,0.5)", padding:"3px 12px", borderRadius:20 }}>סגור כעת</span>
          </div>
        )}
        {s.free_delivery && (
          <span style={{ position:"absolute", top:8, right:8, background:C.green, color:"white", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>🚀 חינם</span>
        )}
        <div style={{ position:"absolute", bottom:8, left:8, display:"flex", alignItems:"center", gap:3, background:"rgba(0,0,0,0.45)", borderRadius:20, padding:"3px 8px" }}>
          <span style={{ fontSize:10 }}>⭐</span>
          <span style={{ fontSize:11, fontWeight:800, color:"white" }}>{s.rating || "4.5"}</span>
        </div>
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontWeight:900, fontSize:14, color:C.dark, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
        <div style={{ fontSize:10, color:C.gray, marginBottom:8, display:"flex", alignItems:"center", gap:2 }}>
          <IcoPin s={9}/>{s.location || ""}
        </div>
        <div style={{ display:"flex", gap:5 }}>
          <span style={{ fontSize:9, fontWeight:600, color:C.gray, background:C.bg, borderRadius:10, padding:"2px 7px", display:"flex", alignItems:"center", gap:2 }}>
            <IcoClock s={9}/>{s.delivery_time || "25"} דק'
          </span>
          <span style={{ fontSize:9, fontWeight:600, color:s.delivery_fee===0?C.green:C.gray, background:C.bg, borderRadius:10, padding:"2px 7px" }}>
            {s.delivery_fee===0 ? "חינם" : "₪"+(s.delivery_fee||12)}
          </span>
        </div>
        <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:s.active!==false?C.green:"#EF4444", display:"inline-block" }}/>
          <span style={{ fontSize:10, color:s.active!==false?C.green:"#EF4444", fontWeight:700 }}>{s.active!==false?"פתוח":"סגור"}</span>
        </div>
      </div>
    </div>
  );
}

// ── Carousel Row — identical to HorizRow in HomePage ──
function HorizRow({ title, icon, items, onSeeAll, navigate }) {
  if (!items || !items.length) return null;
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 16px", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {icon}
          <span style={{ fontSize:16, fontWeight:900, color:C.dark }}>{title}</span>
        </div>
        {onSeeAll && <span onClick={onSeeAll} style={{ fontSize:12, color:C.red, fontWeight:700, cursor:"pointer" }}>הכל ←</span>}
      </div>
      <div style={{
        display:"flex", gap:12, overflowX:"auto", overflowY:"visible",
        paddingTop:4, paddingBottom:12,
        paddingInlineStart:16, paddingInlineEnd:16,
        scrollbarWidth:"none", WebkitOverflowScrolling:"touch",
      }}>
        {items.map((s,i) => (
          <StoreCard key={s.id} s={s} delay={i*50}
            onClick={() => navigate("/restaurant/"+s.id, { state:s })}/>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────
function Sidebar({ open, onClose, user, navigate }) {
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:600, opacity:open?1:0, pointerEvents:open?"all":"none", transition:"opacity 0.3s ease" }}/>
      <div style={{ position:"fixed", top:0, right:0, height:"100dvh", width:280, maxWidth:"80vw", background:"white", zIndex:601, display:"flex", flexDirection:"column", transform:open?"translateX(0)":"translateX(100%)", transition:"transform 0.35s cubic-bezier(0.34,1.1,0.64,1)", boxShadow:"-8px 0 40px rgba(0,0,0,0.15)", overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,#C8102E,#7B0D1E)", padding:"calc(env(safe-area-inset-top,0px) + 54px) 20px 24px", position:"relative", flexShrink:0 }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, left:14, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <IcoBack s={16} c="white"/>
          </button>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
            <IcoUser s={32} c="white"/>
          </div>
          <div style={{ color:"white", fontSize:18, fontWeight:900 }}>{user?.name||"אורח"}</div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginTop:2 }}>{user?.email||"התחבר לחשבון שלך"}</div>
        </div>
        <div style={{ flex:1, padding:"12px 0", overflowY:"auto" }}>
          {[
            { icon:<IcoUser s={20} c={C.red}/>,       label:"הפרופיל שלי",    path:"/profile" },
            { icon:<IcoPackage s={20} c={C.red}/>,    label:"ההזמנות שלי",    path:"/orders" },
            { icon:<IcoCreditCard s={20} c={C.red}/>, label:"אמצעי תשלום",    path:"/cards" },
            { icon:<IcoUsers s={20} c={C.red}/>,      label:"הזמן חברים",     path:"/invite" },
            { icon:<IcoFork s={20} c={C.red}/>,       label:"מסעדות",          path:"/" },
            { icon:<IcoHelp s={20} c="#6B7280"/>,     label:"תמיכה",           path:"/support" },
            { icon:<IcoLock s={20} c="#6B7280"/>,     label:"מדיניות פרטיות", path:"/privacy" },
          ].map((item,i) => (
            <button key={i} onClick={() => { navigate(item.path); onClose(); }}
              style={{ width:"100%", background:"none", border:"none", padding:"14px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", textAlign:"right", fontFamily:"Arial,sans-serif", borderBottom:"1px solid #F9FAFB" }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"rgba(200,16,46,0.07)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{item.icon}</div>
              <span style={{ flex:1, fontSize:14, fontWeight:700, color:"#111827" }}>{item.label}</span>
              <span style={{ color:"#D1D5DB", fontSize:16 }}>‹</span>
            </button>
          ))}
        </div>
        <div style={{ padding:"16px 20px", paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 20px)", borderTop:"1px solid #F3F4F6", flexShrink:0 }}>
          <button onClick={() => { navigate("/admin"); onClose(); }}
            style={{ width:"100%", background:"linear-gradient(135deg,#111827,#1F2937)", color:"white", border:"none", borderRadius:16, padding:"14px", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"Arial,sans-serif" }}>
            <IcoShield s={18} c="#F87171"/> ניהול המערכת
          </button>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════
export default function MarketPage({ cartCount, user }) {
  const navigate = useNavigate();
  const [stores, setStores]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [mktCat, setMktCat]             = useState("all");
  const [searchOpen, setSearchOpen]     = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [searchQ, setSearchQ]           = useState("");
  const [banner, setBanner]             = useState(0);
  const [headerH, setHeaderH]           = useState(106);
  const headerRef                       = useRef(null);

  useEffect(() => {
    if (!headerRef.current) return;
    const ro = new ResizeObserver(() => setHeaderH(headerRef.current?.offsetHeight||106));
    ro.observe(headerRef.current);
    setHeaderH(headerRef.current.offsetHeight||106);
    return () => ro.disconnect();
  }, []);

  // Auto-advance banner
  useEffect(() => {
    const t = setInterval(() => setBanner(p => (p+1) % MKT_BANNERS.length), 3800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase.from("restaurants").select("*").eq("active", true).eq("page_type","market")
      .then(({ data }) => { setStores(data||[]); setLoading(false); })
      .catch(() => {
        supabase.from("restaurants").select("*").eq("active",true)
          .then(({ data }) => { setStores(data||[]); setLoading(false); });
      });
  }, []);

  const filtered = stores.filter(s => {
    if (searchQ) return s.name?.includes(searchQ)||s.category?.includes(searchQ);
    if (mktCat==="all") return true;
    const cat = MKTCATS.find(c=>c.id===mktCat);
    return cat?.match ? cat.match.test(s.category||"") : true;
  });

  const catGroups = MKTCATS.filter(c=>c.id!=="all").map(c=>({
    ...c, items: stores.filter(s=>c.match?c.match.test(s.category||""):false),
  })).filter(g=>g.items.length>0);

  // IcoHamburger inline
  const IcoHamburger = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M3 12h18M3 18h18" stroke={C.dark} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="page-enter" style={{ fontFamily:"Arial,sans-serif", background:C.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", paddingBottom:90, paddingTop:headerH }}>

      <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} user={user} navigate={navigate}/>

      {/* ── FIXED HEADER ────────────────────────────── */}
      <div className="app-header" ref={headerRef}>
        {/* TopBar */}
        <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
          {searchOpen ? (
            <div style={{ flex:1, display:"flex", gap:8, alignItems:"center" }}>
              <input autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                placeholder="חיפוש חנות..."
                style={{ flex:1, border:"1.5px solid "+C.lightGray, borderRadius:24, padding:"8px 14px", fontSize:13, outline:"none", background:C.bg, direction:"rtl" }}/>
              <button onClick={()=>{setSearchOpen(false);setSearchQ("");}}
                style={{ background:C.bg, border:"none", borderRadius:"50%", width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IcoClose/>
              </button>
            </div>
          ) : (
            <>
              <button onClick={()=>setSearchOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
                <IcoSearch/>
              </button>
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:C.bg, borderRadius:24, padding:"7px 14px", cursor:"pointer" }}>
                <IcoHome s={18} c={C.red}/>
                <div style={{ flex:1, textAlign:"right" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.dark }}>בית</div>
                  <div style={{ fontSize:10, color:C.gray }}>ראמה, ישראל</div>
                </div>
                <IcoChevDown/>
              </div>
              <button onClick={()=>setSidebarOpen(true)}
                style={{ background:C.bg, border:"none", borderRadius:12, width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IcoHamburger/>
              </button>
            </>
          )}
        </div>
        {/* TABS */}
        <div style={{ display:"flex", borderBottom:"1px solid "+C.lightGray }}>
          {[{id:"restaurants",label:"מסעדות",I:IcoFork},{id:"market",label:"מרקט",I:IcoStore}].map(t=>{
            const active = t.id==="market";
            return (
              <button key={t.id} onClick={()=>t.id==="restaurants"&&navigate("/")}
                style={{ flex:1, background:"none", border:"none", padding:"11px 0 8px", fontSize:13, fontWeight:700, color:active?C.red:C.gray, borderBottom:active?"2.5px solid "+C.red:"2.5px solid transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <t.I s={18} c={active?C.red:C.gray}/>{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BANNER SLIDER — same as מסעדות ──────────── */}
      {!searchQ && (
        <div style={{ padding:"14px 16px 8px" }}>
          <div style={{ borderRadius:22, overflow:"hidden", position:"relative", height:165 }}>
            <div style={{ display:"flex", transition:"transform .55s cubic-bezier(0.4,0,0.2,1)", transform:`translateX(${banner*100}%)` }}>
              {MKT_BANNERS.map(b=>(
                <div key={b.id} style={{ minWidth:"100%", height:165, background:b.bg, display:"flex", flexDirection:"column", justifyContent:"center", padding:"22px 24px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", right:-30, top:-30, width:150, height:150, background:"rgba(255,255,255,0.05)", borderRadius:"50%" }}/>
                  <div style={{ position:"absolute", left:20, bottom:10, opacity:0.1 }}><YougoLogo size={80} white/></div>
                  <span style={{ color:"rgba(255,255,220,0.9)", fontSize:11, fontWeight:700, marginBottom:4, background:"rgba(255,255,255,0.1)", alignSelf:"flex-start", borderRadius:20, padding:"2px 10px" }}>{b.tag}</span>
                  <div style={{ color:"white", fontSize:24, fontWeight:900, lineHeight:1.15 }}>{b.title}</div>
                  <div style={{ color:"rgba(255,255,255,0.85)", fontSize:15, fontWeight:600, marginTop:3 }}>{b.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5 }}>
              {MKT_BANNERS.map((_,i)=>(
                <div key={i} onClick={()=>setBanner(i)} style={{ width:i===banner?22:7, height:7, borderRadius:3.5, background:i===banner?"white":"rgba(255,255,255,0.4)", transition:"all .3s", cursor:"pointer" }}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY ICONS — exact same style as מסעדות ─ */}
      {!searchQ && (
        <div style={{ padding:"4px 0 6px" }}>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingTop:4, paddingBottom:8, paddingInlineStart:16, paddingInlineEnd:16, scrollbarWidth:"none" }}>
            {MKTCATS.map(c=>{
              const active = mktCat===c.id;
              return (
                <button key={c.id} onClick={()=>setMktCat(c.id)} style={{
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5,
                  width:72, height:80, flexShrink:0,
                  background: active ? c.bg : "white",
                  border: active ? "none" : "1.5px solid #F3F4F6",
                  borderRadius:18, cursor:"pointer",
                  boxShadow: active ? `0 6px 18px ${c.bg}55` : "0 1px 6px rgba(0,0,0,0.05)",
                  transform: active ? "scale(1.07)" : "scale(1)",
                  transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                }}>
                  <c.Cmp active={active}/>
                  <span style={{ fontSize:10, fontWeight:700, color:active?"white":C.dark, whiteSpace:"nowrap" }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CONTENT ──────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign:"center", padding:50, color:C.gray }}>
          <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid "+C.lightGray, borderTopColor:C.red, animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
          טוען חנויות...
        </div>
      ) : searchQ ? (
        <HorizRow title={`תוצאות: "${searchQ}"`} items={filtered} navigate={navigate}/>
      ) : mktCat!=="all" ? (
        <HorizRow
          title={MKTCATS.find(c=>c.id===mktCat)?.label||""}
          icon={(() => { const Cat=MKTCATS.find(c=>c.id===mktCat)?.Cmp; return Cat?<Cat active={false}/>:null; })()}
          items={filtered}
          navigate={navigate}
        />
      ) : filtered.length===0 ? (
        <div style={{ textAlign:"center", padding:"50px 0", color:C.gray }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🏪</div>
          <div style={{ fontSize:15, fontWeight:600 }}>אין חנויות זמינות</div>
        </div>
      ) : (
        <>
          <HorizRow title="🔥 כל החנויות" items={stores} navigate={navigate}/>
          {catGroups.map(g=>(
            <HorizRow
              key={g.id}
              title={g.label}
              icon={<g.Cmp active={false}/>}
              items={g.items}
              onSeeAll={()=>setMktCat(g.id)}
              navigate={navigate}
            />
          ))}
        </>
      )}

      <BottomNav cartCount={cartCount}/>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
}

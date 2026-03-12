import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  C, hexA,
  IcoSearch, IcoClose, IcoHome, IcoChevDown, IcoShield,
  IcoStar, IcoPin, IcoFork, IcoStore, IcoUser, IcoBack,
  IcoPackage, IcoCreditCard, IcoUsers, IcoHelp, IcoLock,
  IcoClock, IcoTruck, IcoOrders,
} from "../components/Icons";
import BottomNav from "../components/BottomNav";

function YougoLogo({ size = 36, white = false }) {
  const bg = white ? "white" : C.red;
  const fg = white ? C.red : "white";
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="16" fill={bg} />
      <path d="M12 42V20l16 16V20" stroke={fg} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 30h16M42 24l8 6-8 6" stroke={fg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Store Card — same style as restaurant card in HomePage ──
function StoreCard({ s, onClick, delay }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={() => s.active !== false && onClick()}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: "white", borderRadius: 22, overflow: "hidden",
        cursor: s.active !== false ? "pointer" : "default",
        opacity: s.active !== false ? 1 : 0.6,
        boxShadow: pressed ? "0 2px 8px rgba(0,0,0,0.08)" : "0 4px 20px rgba(0,0,0,0.07)",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
        animation: `slideUp 0.4s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms both`,
      }}
    >
      {/* Cover image */}
      <div style={{
        height: 130,
        background: s.image_url ? "transparent"
          : `linear-gradient(135deg,${hexA(s.color || "#C8102E","22")},${hexA(s.color || "#C8102E","44")})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {s.image_url
          ? <img src={s.image_url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={s.name}/>
          : <span style={{ fontSize: 66 }}>{s.emoji || s.logo_emoji || "🏪"}</span>
        }
        {s.active === false && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontSize:12, fontWeight:700, background:"rgba(0,0,0,0.5)", padding:"4px 14px", borderRadius:20 }}>סגור כעת</span>
          </div>
        )}
        {s.free_delivery && (
          <span style={{ position:"absolute", top:10, right:10, background:"#10B981", color:"white", fontSize:9, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>🚀 משלוח חינם</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:15, color:C.dark }}>{s.name}</div>
            <div style={{ fontSize:11, color:C.gray, marginTop:2, display:"flex", alignItems:"center", gap:3 }}>
              <IcoPin s={10}/>{s.location || s.address || ""}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:3, background:"#FFF9EB", borderRadius:20, padding:"3px 9px", flexShrink:0 }}>
            <span style={{ fontSize:11 }}>⭐</span>
            <span style={{ fontSize:12, fontWeight:700, color:"#B45309" }}>{s.rating || "4.5"}</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
          {[
            { I:IcoClock, t:(s.delivery_time||"20-30")+" דק'" },
            { I:IcoTruck, t:s.delivery_fee===0?"משלוח חינם":"₪"+(s.delivery_fee||12)+" משלוח" },
            { I:IcoOrders, t:"מינ' ₪"+(s.min_order||40) },
          ].map((x,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4, background:C.bg, borderRadius:20, padding:"4px 10px" }}>
              <x.I s={11}/><span style={{ fontSize:11, fontWeight:600, color:C.dark }}>{x.t}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:s.active!==false?C.green:"#EF4444", display:"inline-block" }}/>
          <span style={{ fontSize:12, color:s.active!==false?C.green:"#EF4444", fontWeight:700 }}>{s.active!==false?"פתוח":"סגור"}</span>
        </div>
      </div>
    </div>
  );
}

// ── Category icons ──────────────────────────────────
function MktAll({ active }) { return (<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M6 8h4l5 14h6l5-14h4" stroke={active?"white":C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="26" r="2" fill={active?"white":C.red}/><circle cx="22" cy="26" r="2" fill={active?"white":C.red}/></svg>); }
function MktFruits({ active }) { return (<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M16 10c-5 0-8 4-8 9s3 9 8 9 8-4 8-9-3-9-8-9z" fill={active?"white":"#EF4444"} opacity={active?0.9:1}/><path d="M16 10c1-4 5-5 7-3" stroke={active?"white":"#16A34A"} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>); }
function MktMeat({ active }) { return (<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M8 22c0-6 4-12 12-12 4 0 7 2 7 5s-3 7-7 7H8z" fill={active?"white":"#EF4444"} opacity={active?0.9:1}/><rect x="10" y="19" width="14" height="6" rx="3" fill={active?"rgba(255,255,255,0.6)":"white"}/></svg>); }
function MktSnacks({ active }) { return (<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M10 14c-2-4 0-8 4-8s5 4 2 8M18 14c-2-4 0-8 4-8s5 4 2 8" fill={active?"white":"#FEF08A"}/><path d="M10 14c-4-2-6 2-6 6s4 8 12 8 12-4 12-8-2-8-6-6" fill={active?"rgba(255,255,255,0.8)":"#FBBF24"}/></svg>); }
function MktDairy({ active }) { return (<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M13 8h6v2c3 1 5 4 5 8v8H8v-8c0-4 2-7 5-8V8z" fill={active?"white":"#DBEAFE"}/><rect x="12" y="4" width="8" height="5" rx="2" fill={active?"rgba(255,255,255,0.6)":"#93C5FD"}/></svg>); }

const MKTCATS = [
  { id:"all",    Cmp:MktAll,    label:"מרקט" },
  { id:"fruits", Cmp:MktFruits, label:"פירות וירקות" },
  { id:"meat",   Cmp:MktMeat,   label:"דגים ובשרים" },
  { id:"snacks", Cmp:MktSnacks, label:"בתי קלי" },
  { id:"dairy",  Cmp:MktDairy,  label:"מוצרי חלב" },
];

export default function MarketPage({ cartCount, user }) {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mktCat, setMktCat] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    supabase.from("restaurants")
      .select("*")
      .eq("active", true)
      .then(({ data }) => { setStores(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = stores.filter(s => {
    if (searchQ) return s.name?.includes(searchQ) || s.category?.includes(searchQ);
    return true;
  });

  // ── Sidebar ──
  const Sidebar = () => (
    <>
      <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:200, opacity:sidebarOpen?1:0, pointerEvents:sidebarOpen?"all":"none", transition:"opacity 0.3s ease" }}/>
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:300, maxWidth:"80vw", background:"white", zIndex:201, display:"flex", flexDirection:"column", transform:sidebarOpen?"translateX(0)":"translateX(100%)", transition:"transform 0.35s cubic-bezier(0.34,1.1,0.64,1)", boxShadow:"-8px 0 40px rgba(0,0,0,0.15)" }}>
        <div style={{ background:"linear-gradient(135deg,#C8102E,#7B0D1E)", padding:"calc(env(safe-area-inset-top, 0px) + 54px) 20px 24px", position:"relative", flexShrink:0 }}>
          <button onClick={() => setSidebarOpen(false)} style={{ position:"absolute", top:14, left:14, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <IcoBack s={16} c="white"/>
          </button>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
            <IcoUser s={32} c="white"/>
          </div>
          <div style={{ color:"white", fontSize:18, fontWeight:900 }}>{user?.name || "אורח"}</div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginTop:2 }}>{user?.email || "התחבר לחשבון שלך"}</div>
        </div>
        <div style={{ flex:1, padding:"12px 0", overflowY:"auto" }}>
          {[
            { icon:<IcoUser s={20} c={C.red}/>, label:"הפרופיל שלי", path:"/profile" },
            { icon:<IcoPackage s={20} c={C.red}/>, label:"ההזמנות שלי", path:"/orders" },
            { icon:<IcoCreditCard s={20} c={C.red}/>, label:"אמצעי תשלום", path:"/cards" },
            { icon:<IcoUsers s={20} c={C.red}/>, label:"הזמן חברים", path:"/invite" },
            { icon:<IcoFork s={20} c={C.red}/>, label:"מסעדות", path:"/" },
            { icon:<IcoHelp s={20} c="#6B7280"/>, label:"תמיכה", path:"/support" },
            { icon:<IcoLock s={20} c="#6B7280"/>, label:"מדיניות פרטיות", path:"/privacy" },
          ].map((item, i) => (
            <button key={i} onClick={() => { navigate(item.path); setSidebarOpen(false); }} style={{ width:"100%", background:"none", border:"none", padding:"14px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", textAlign:"right", fontFamily:"Arial,sans-serif", borderBottom:"1px solid #F9FAFB" }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"rgba(200,16,46,0.07)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{item.icon}</div>
              <span style={{ flex:1, fontSize:14, fontWeight:700, color:"#111827" }}>{item.label}</span>
              <span style={{ color:"#D1D5DB", fontSize:16 }}>‹</span>
            </button>
          ))}
        </div>
        <div style={{ padding:"16px 20px", paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 20px)", borderTop:"1px solid #F3F4F6", flexShrink:0 }}>
          <button onClick={() => { navigate("/admin"); setSidebarOpen(false); }} style={{ width:"100%", background:"linear-gradient(135deg,#111827,#1F2937)", color:"white", border:"none", borderRadius:16, padding:"14px", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"Arial,sans-serif" }}>
            <IcoShield s={18} c="#F87171"/> ניהול המערכת
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="page-enter" style={{ fontFamily:"Arial,sans-serif", background:C.bg, minHeight:"100vh", direction:"rtl", paddingBottom:90, paddingTop:106 }}>
      <Sidebar/>

      {/* FIXED HEADER — TopBar + TABS */}
      <div className="fixed-header">
       <div className="page-wrap">
        {/* TOP BAR */}
        <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
          {searchOpen ? (
            <div style={{ flex:1, display:"flex", gap:8, alignItems:"center" }}>
              <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="חיפוש חנות..."
                style={{ flex:1, border:"1.5px solid "+C.lightGray, borderRadius:24, padding:"8px 14px", fontSize:13, outline:"none", background:C.bg, direction:"rtl" }}/>
              <button onClick={() => { setSearchOpen(false); setSearchQ(""); }}
                style={{ background:C.bg, border:"none", borderRadius:"50%", width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IcoClose/>
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setSearchOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
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
              <button onClick={() => setSidebarOpen(true)} style={{ background:C.bg, border:"none", borderRadius:12, width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="#111827" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </>
          )}
        </div>

        {/* TABS */}
        <div style={{ display:"flex", borderBottom:"1px solid "+C.lightGray }}>
          {[
            { id:"restaurants", label:"מסעדות", I:IcoFork },
            { id:"market",      label:"מרקט",   I:IcoStore },
          ].map(t => {
            const active = t.id === "market";
            return (
              <button key={t.id}
                onClick={() => t.id === "restaurants" && navigate("/")}
                style={{ flex:1, background:"none", border:"none", padding:"11px 0 8px", fontSize:13, fontWeight:700, color:active?C.red:C.gray, borderBottom:active?"2.5px solid "+C.red:"2.5px solid transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <t.I s={18} c={active?C.red:C.gray}/>{t.label}
              </button>
            );
          })}
        </div>
       </div>
      </div>

      {/* MARKET HERO */}
      <div style={{ margin:"14px 16px 0", background:"linear-gradient(135deg,#C8102E,#7B0D1E)", borderRadius:22, padding:"22px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", left:16, bottom:10, opacity:0.1 }}><YougoLogo size={70} white={true}/></div>
        <span style={{ color:"rgba(255,255,220,0.9)", fontSize:11, fontWeight:700, background:"rgba(255,255,255,0.12)", borderRadius:20, padding:"2px 10px", display:"inline-flex", alignItems:"center", gap:5 }}>
          <IcoStore s={12} c="white"/> Yougo מרקט
        </span>
        <div style={{ color:"white", fontSize:20, fontWeight:900, marginTop:8 }}>הבית תמיד מוכן</div>
        <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginTop:3 }}>כל מה שחסר בבית מגיע בחצי שעה</div>
      </div>

      {/* CATEGORY ICONS */}
      <div style={{ padding:"14px 0 4px" }}>
        <div style={{ display:"flex", gap:10, overflowX:"auto", padding:"4px 16px", scrollbarWidth:"none" }}>
          {MKTCATS.map(c => {
            const active = mktCat === c.id;
            return (
              <button key={c.id} onClick={() => setMktCat(c.id)}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, background:active?C.red:C.white, border:active?"none":"1.5px solid "+C.lightGray, borderRadius:18, padding:"10px 14px", cursor:"pointer", flexShrink:0, transition:"all .2s", minWidth:76, boxShadow:active?"0 4px 14px rgba(200,16,46,0.3)":"0 1px 4px rgba(0,0,0,0.05)" }}>
                <c.Cmp active={active}/>
                <span style={{ fontSize:10, fontWeight:700, color:active?"white":C.dark, whiteSpace:"nowrap" }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION HEADER */}
      <div style={{ padding:"8px 16px 6px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:15, fontWeight:900, color:C.dark, display:"flex", alignItems:"center", gap:6 }}>
          <IcoStore s={16} c={C.red}/> חנויות קרובות
        </span>
        <span style={{ fontSize:12, color:C.gray }}>{filtered.length} חנויות</span>
      </div>

      {/* STORE GRID — same 2-col as restaurants */}
      <div style={{ padding:"0 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:13 }}>
        {loading ? (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:C.gray }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid "+C.lightGray, borderTopColor:C.red, animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
            טוען חנויות...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"50px 0", color:C.gray }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🏪</div>
            <div style={{ fontSize:15, fontWeight:600 }}>אין חנויות זמינות</div>
          </div>
        ) : filtered.map((s, i) => (
          <StoreCard
            key={s.id}
            s={s}
            onClick={() => navigate("/restaurant/"+s.id, { state: s })}
            delay={i * 60}
          />
        ))}
      </div>

      <BottomNav cartCount={cartCount}/>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  C, hexA,
  IcoSearch, IcoClose, IcoHome, IcoChevDown, IcoShield,
  IcoStar, IcoClock, IcoTruck, IcoOrders, IcoPin,
  IcoFork, IcoStore, IcoFire, IcoGift,
} from "../components/Icons";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

function YougoLogo({ size = 36, white = false }) {
  var bg = white ? "white" : C.red, fg = white ? C.red : "white";
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="16" fill={bg} />
      <path d="M12 42V20l16 16V20" stroke={fg} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 30h16M42 24l8 6-8 6" stroke={fg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CatAll({ a }) { return (<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="10" cy="10" r="6" fill={a?"white":"#F59E0B"} /><circle cx="22" cy="10" r="6" fill={a?"white":"#C8102E"} /><circle cx="10" cy="22" r="6" fill={a?"white":"#16A34A"} /><circle cx="22" cy="22" r="6" fill={a?"white":"#3B82F6"} /></svg>); }
function CatChicken({ a }) { return (<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M8 26c0-6 2-10 8-12 6-2 10 2 10 6s-4 8-10 8-8-2-8-2z" fill={a?"white":"#F59E0B"} /><circle cx="18" cy="14" r="3" fill={a?"rgba(255,255,255,0.8)":"#EF4444"} /></svg>); }
function CatBurger({ a }) { return (<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M6 12c0-4 4-6 10-6s10 2 10 6" fill={a?"white":"#F59E0B"} /><rect x="4" y="12" width="24" height="4" rx="2" fill={a?"rgba(255,255,255,0.7)":"#EF4444"} /><rect x="4" y="20" width="24" height="5" rx="2.5" fill={a?"white":"#F59E0B"} /></svg>); }
function CatShawarma({ a }) { return (<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><rect x="14" y="4" width="4" height="24" rx="2" fill={a?"rgba(255,255,255,0.5)":"#92400E"} /><ellipse cx="16" cy="10" rx="7" ry="3" fill={a?"white":"#EF4444"} /><ellipse cx="16" cy="16" rx="8" ry="3" fill={a?"rgba(255,255,255,0.85)":"#F97316"} /><ellipse cx="16" cy="22" rx="6" ry="2.5" fill={a?"white":"#EF4444"} /></svg>); }
function CatPizza({ a }) { return (<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M16 4l12 22H4L16 4z" fill={a?"white":"#F59E0B"} /><circle cx="13" cy="17" r="2.5" fill={a?"rgba(255,255,255,0.6)":"#EF4444"} /><circle cx="19" cy="20" r="2" fill={a?"rgba(255,255,255,0.6)":"#EF4444"} /></svg>); }
function CatSushi({ a }) { return (<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="white" opacity={a?0.9:1} /><circle cx="16" cy="16" r="6" fill={a?"rgba(255,255,255,0.4)":"#1D3557"} /><circle cx="16" cy="16" r="3" fill={a?"white":"#F59E0B"} /></svg>); }
function CatDrinks({ a }) { return (<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M10 8l2 16h8l2-16H10z" fill={a?"white":"#BAE6FD"} /><path d="M8 8h16" stroke={a?"rgba(255,255,255,0.5)":"#0EA5E9"} strokeWidth="2" strokeLinecap="round" /></svg>); }
function CatSweets({ a }) { return (<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M6 22c0-8 4-12 10-12s10 4 10 12H6z" fill={a?"white":"#F59E0B"} /><rect x="14" y="8" width="4" height="14" rx="2" fill={a?"rgba(255,255,255,0.5)":"#92400E"} /></svg>); }

const CATS = [
  { id:"all",      Cmp:CatAll,      label:"הכל" },
  { id:"chicken",  Cmp:CatChicken,  label:"עוף" },
  { id:"burger",   Cmp:CatBurger,   label:"המבורגר" },
  { id:"shawarma", Cmp:CatShawarma, label:"שווארמה" },
  { id:"pizza",    Cmp:CatPizza,    label:"פיצה" },
  { id:"sushi",    Cmp:CatSushi,    label:"סושי" },
  { id:"drinks",   Cmp:CatDrinks,   label:"משקאות" },
  { id:"sweets",   Cmp:CatSweets,   label:"קינוחים" },
];

const BANNERS = [
  { id:1, title:"עם Yougo", sub:"הבית תמיד מוכן", tag:"רמדאן כרים 🌙", bg:"linear-gradient(135deg,#C8102E 0%,#7B0D1E 100%)" },
  { id:2, title:"משלוח מהיר", sub:"עד 30 דקות בלבד", tag:"חדש ✨", bg:"linear-gradient(135deg,#1D4ED8,#7C3AED)" },
  { id:3, title:"הזמן חברים", sub:"וקבל הנחה!", tag:"מבצע 🎁", bg:"linear-gradient(135deg,#059669,#0D9488)" },
];

function matchesCat(r, cat) {
  if (cat === "all") return true;
  const c = (r.category || "").toLowerCase();
  const map = { chicken:"עוף", burger:"המבורגר|burger|בורגר", shawarma:"שווארמה|שאוורמה", pizza:"פיצה|פיצרייה", sushi:"סושי", drinks:"שתייה|משקאות", sweets:"קינוחים|מתוקים" };
  return new RegExp(map[cat]||cat,"i").test(c);
}

// ── Horizontal scroll card row ──────────────────────
function HorizRow({ title, items, renderCard, seeAll }) {
  const rowRef = useRef(null);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 16px", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <IcoFire s={15} />
          <span style={{ fontSize:16, fontWeight:900, color:C.dark }}>{title}</span>
        </div>
        {seeAll && <span style={{ fontSize:12, color:C.red, fontWeight:700, cursor:"pointer" }}>הכל ←</span>}
      </div>
      <div ref={rowRef} style={{ display:"flex", gap:12, overflowX:"auto", padding:"4px 16px 8px", scrollbarWidth:"none", WebkitOverflowScrolling:"touch" }}>
        {items.map((item, i) => renderCard(item, i))}
      </div>
    </div>
  );
}

// ── Restaurant card — horizontal swipe style ────────
function RestCardH({ r, onClick, delay }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={() => r.active && onClick()}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        flexShrink:0, width:200, background:"white", borderRadius:22, overflow:"hidden",
        cursor: r.active ? "pointer" : "default", opacity: r.active ? 1 : 0.6,
        boxShadow: pressed ? "0 2px 8px rgba(0,0,0,0.1)" : "0 4px 16px rgba(0,0,0,0.08)",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
        animation: `slideUp 0.4s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms both`,
      }}
    >
      {/* Cover */}
      <div style={{ height:110, background:`linear-gradient(135deg,${hexA(r.cover_color||"#C8102E","33")},${hexA(r.cover_color||"#C8102E","55")})`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <span style={{ fontSize:52 }}>{r.logo_emoji || "🍽️"}</span>
        {!r.active && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontSize:11, fontWeight:700, background:"rgba(0,0,0,0.5)", padding:"3px 12px", borderRadius:20 }}>סגור כעת</span>
          </div>
        )}
        {r.badge && <span style={{ position:"absolute", top:8, right:8, background:C.green, color:"white", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>{r.badge}</span>}
        <div style={{ position:"absolute", bottom:8, left:8, display:"flex", alignItems:"center", gap:3, background:"rgba(0,0,0,0.45)", borderRadius:20, padding:"3px 8px" }}>
          <span style={{ fontSize:10 }}>⭐</span>
          <span style={{ fontSize:11, fontWeight:800, color:"white" }}>{r.rating||"4.5"}</span>
        </div>
      </div>
      {/* Info */}
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontWeight:900, fontSize:14, color:C.dark, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.name}</div>
        <div style={{ fontSize:10, color:C.gray, marginBottom:8, display:"flex", alignItems:"center", gap:2 }}>
          <IcoPin s={9} />{r.location||""}
        </div>
        <div style={{ display:"flex", gap:5 }}>
          <span style={{ fontSize:9, fontWeight:600, color:C.gray, background:C.bg, borderRadius:10, padding:"2px 7px", display:"flex", alignItems:"center", gap:2 }}>
            <IcoClock s={9} />{r.delivery_time||"25"} דק'
          </span>
          <span style={{ fontSize:9, fontWeight:600, color: r.delivery_fee===0?C.green:C.gray, background:C.bg, borderRadius:10, padding:"2px 7px" }}>
            {r.delivery_fee===0?"חינם":"₪"+(r.delivery_fee||12)}
          </span>
        </div>
        <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background: r.active?C.green:"#EF4444", display:"inline-block" }} />
          <span style={{ fontSize:10, color: r.active?C.green:"#EF4444", fontWeight:700 }}>{r.active?"פתוח":"סגור"}</span>
        </div>
      </div>
    </div>
  );
}

// ── Restaurant card — full width vertical ───────────
function RestCardV({ r, onClick, delay }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={() => r.active && onClick()}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background:"white", borderRadius:22, overflow:"hidden",
        cursor: r.active ? "pointer" : "default", opacity: r.active ? 1 : 0.6,
        boxShadow: pressed ? "0 2px 8px rgba(0,0,0,0.08)" : "0 4px 20px rgba(0,0,0,0.07)",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
        animation: `slideUp 0.4s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms both`,
      }}
    >
      <div style={{ height:130, background:`linear-gradient(135deg,${hexA(r.cover_color||"#C8102E","22")},${hexA(r.cover_color||"#C8102E","44")})`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <span style={{ fontSize:66 }}>{r.logo_emoji||"🍽️"}</span>
        {!r.active && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontSize:12, fontWeight:700, background:"rgba(0,0,0,0.5)", padding:"4px 14px", borderRadius:20 }}>סגור כעת</span>
          </div>
        )}
        {r.badge && <span style={{ position:"absolute", top:10, right:10, background:C.green, color:"white", fontSize:9, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>{r.badge}</span>}
      </div>
      <div style={{ padding:"12px 14px 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:15, color:C.dark }}>{r.name}</div>
            <div style={{ fontSize:11, color:C.gray, marginTop:2, display:"flex", alignItems:"center", gap:3 }}>
              <IcoPin s={10} />{r.location||r.address||""}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:3, background:"#FFF9EB", borderRadius:20, padding:"3px 9px", flexShrink:0 }}>
            <span style={{ fontSize:11 }}>⭐</span>
            <span style={{ fontSize:12, fontWeight:700, color:"#B45309" }}>{r.rating||"4.5"}</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
          {[
            { I:IcoClock, t:(r.delivery_time||"20-30")+" דק'" },
            { I:IcoTruck, t: r.delivery_fee===0?"משלוח חינם":"₪"+(r.delivery_fee||12)+" משלוח" },
            { I:IcoOrders, t:"מינ' ₪"+(r.min_order||40) },
          ].map((x,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4, background:C.bg, borderRadius:20, padding:"4px 10px" }}>
              <x.I s={11} /><span style={{ fontSize:11, fontWeight:600, color:C.dark }}>{x.t}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background: r.active?C.green:"#EF4444", display:"inline-block" }} />
          <span style={{ fontSize:12, color: r.active?C.green:"#EF4444", fontWeight:700 }}>{r.active?"פתוח":"סגור"}</span>
          {r.closing_time && <span style={{ fontSize:11, color:C.gray }}>עד {r.closing_time}</span>}
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ user, guest, onGuest, cartCount }) {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cat, setCat] = useState("all");
  const [banner, setBanner] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBanner(p => (p+1) % BANNERS.length), 3800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase.from("restaurants").select("*").eq("active", true)
      .then(({ data }) => { setRestaurants(data||[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter(r => {
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return r.name?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q);
    }
    return matchesCat(r, cat);
  });

  // Group by category for sections
  const catGroups = CATS.filter(c => c.id !== "all").map(c => ({
    ...c,
    items: restaurants.filter(r => matchesCat(r, c.id))
  })).filter(g => g.items.length > 0);

  return (
    <div className="page-enter" style={{ fontFamily:"Arial,sans-serif", background:C.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", overflowX:"hidden", paddingBottom:90 }}>

      {/* TOP BAR */}
      <div style={{ background:"white", padding:"10px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 8px rgba(0,0,0,0.06)" }}>
        {searchOpen ? (
          <div style={{ flex:1, display:"flex", gap:8, alignItems:"center" }}>
            <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="חיפוש מסעדה..."
              style={{ flex:1, border:"1.5px solid "+C.lightGray, borderRadius:24, padding:"8px 14px", fontSize:13, outline:"none", background:C.bg, direction:"rtl" }} />
            <button onClick={() => { setSearchOpen(false); setSearchQ(""); }}
              style={{ background:C.bg, border:"none", borderRadius:"50%", width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <IcoClose />
            </button>
          </div>
        ) : (
          <>
            <button onClick={() => setSearchOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
              <IcoSearch />
            </button>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:C.bg, borderRadius:24, padding:"7px 14px", cursor:"pointer" }}>
              <IcoHome s={18} c={C.red} />
              <div style={{ flex:1, textAlign:"right" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.dark }}>בית</div>
                <div style={{ fontSize:10, color:C.gray }}>ראמה, ישראל</div>
              </div>
              <IcoChevDown />
            </div>
            <button onClick={() => navigate("/admin")}
              style={{ background:C.red, color:"white", border:"none", borderRadius:20, padding:"6px 12px", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5, boxShadow:"0 2px 8px rgba(200,16,46,0.35)" }}>
              <IcoShield s={13} /> ניהול
            </button>
          </>
        )}
      </div>

      {/* TABS */}
      <div style={{ background:"white", display:"flex", borderBottom:"1px solid "+C.lightGray }}>
        {[{ id:"restaurants", label:"מסעדות", I:IcoFork }, { id:"market", label:"מרקט", I:IcoStore }].map(t => {
          const active = t.id === "restaurants";
          return (
            <button key={t.id} onClick={() => { if (t.id==="market") navigate("/market"); }}
              style={{ flex:1, background:"none", border:"none", padding:"11px 0 8px", fontSize:13, fontWeight:700, color:active?C.red:C.gray, borderBottom:active?"2.5px solid "+C.red:"2.5px solid transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <t.I s={18} c={active?C.red:C.gray} />{t.label}
            </button>
          );
        })}
      </div>

      {/* BANNER */}
      {!searchQ && (
        <div style={{ padding:"14px 16px 8px" }}>
          <div style={{ borderRadius:22, overflow:"hidden", position:"relative", height:165 }}>
            <div style={{ display:"flex", transition:"transform .55s cubic-bezier(0.4,0,0.2,1)", transform:`translateX(${banner*100}%)` }}>
              {BANNERS.map(b => (
                <div key={b.id} style={{ minWidth:"100%", height:165, background:b.bg, display:"flex", flexDirection:"column", justifyContent:"center", padding:"22px 24px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", right:-30, top:-30, width:150, height:150, background:"rgba(255,255,255,0.05)", borderRadius:"50%" }} />
                  <div style={{ position:"absolute", left:20, bottom:10, opacity:0.1 }}><YougoLogo size={80} white={true} /></div>
                  <span style={{ color:"rgba(255,255,220,0.9)", fontSize:11, fontWeight:700, marginBottom:4, background:"rgba(255,255,255,0.1)", alignSelf:"flex-start", borderRadius:20, padding:"2px 10px" }}>{b.tag}</span>
                  <div style={{ color:"white", fontSize:24, fontWeight:900, lineHeight:1.15 }}>{b.title}</div>
                  <div style={{ color:"rgba(255,255,255,0.85)", fontSize:15, fontWeight:600, marginTop:3 }}>{b.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5 }}>
              {BANNERS.map((_,i) => (
                <div key={i} onClick={() => setBanner(i)} style={{ width:i===banner?22:7, height:7, borderRadius:3.5, background:i===banner?"white":"rgba(255,255,255,0.4)", transition:"all .3s", cursor:"pointer" }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY ICONS */}
      {!searchQ && (
        <div style={{ padding:"4px 0 6px" }}>
          <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"4px 16px", scrollbarWidth:"none" }}>
            {CATS.map(c => {
              const active = cat === c.id;
              return (
                <button key={c.id} onClick={() => setCat(c.id)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, background:active?C.red:"white", border:active?"none":"1.5px solid "+C.lightGray, borderRadius:16, padding:"9px 14px", cursor:"pointer", flexShrink:0, transition:"all .2s cubic-bezier(0.34,1.56,0.64,1)", boxShadow:active?"0 4px 14px rgba(200,16,46,0.28)":"none", transform:active?"scale(1.06)":"scale(1)" }}>
                  <c.Cmp a={active} />
                  <span style={{ fontSize:10, fontWeight:700, color:active?"white":C.dark, whiteSpace:"nowrap" }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div style={{ textAlign:"center", padding:50, color:C.gray }}>
          <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid "+C.lightGray, borderTopColor:C.red, animation:"spin .7s linear infinite", margin:"0 auto 12px" }} />
          טוען מסעדות...
        </div>
      ) : searchQ ? (
        // Search results — vertical list
        <div style={{ padding:"8px 16px" }}>
          <div style={{ fontSize:13, color:C.gray, marginBottom:12 }}>תוצאות: {searchQ} ({filtered.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {filtered.length === 0
              ? <div style={{ textAlign:"center", padding:"50px 0", color:C.gray }}><div style={{ fontSize:40 }}>🔍</div><div style={{ fontSize:14, fontWeight:600, marginTop:10 }}>לא נמצאו תוצאות</div></div>
              : filtered.map((r,i) => <RestCardV key={r.id} r={r} onClick={() => navigate("/restaurant/"+r.id, { state:r })} delay={i*60} />)
            }
          </div>
        </div>
      ) : cat !== "all" ? (
        // Specific category — vertical list
        <div style={{ padding:"8px 16px" }}>
          <div style={{ fontSize:16, fontWeight:900, color:C.dark, marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
            <IcoFire s={15} />{CATS.find(c=>c.id===cat)?.label} ({filtered.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {filtered.length === 0
              ? <div style={{ textAlign:"center", padding:"50px 0", color:C.gray }}><div style={{ fontSize:40 }}>🍽️</div><div style={{ fontSize:14, fontWeight:600, marginTop:10 }}>אין מסעדות בקטגוריה זו</div></div>
              : filtered.map((r,i) => <RestCardV key={r.id} r={r} onClick={() => navigate("/restaurant/"+r.id, { state:r })} delay={i*60} />)
            }
          </div>
        </div>
      ) : (
        // ALL — sections with horizontal scroll
        <>
          {/* הכי פופולרי — horizontal */}
          {restaurants.length > 0 && (
            <HorizRow
              title="🔥 הכי פופולרי"
              items={restaurants.slice(0,8)}
              seeAll
              renderCard={(r,i) => (
                <RestCardH key={r.id} r={r} delay={i*50} onClick={() => navigate("/restaurant/"+r.id, { state:r })} />
              )}
            />
          )}

          {/* Category sections */}
          {catGroups.map(g => (
            <HorizRow
              key={g.id}
              title={g.label}
              items={g.items}
              seeAll={g.items.length > 3}
              renderCard={(r,i) => (
                <RestCardH key={r.id} r={r} delay={i*50} onClick={() => navigate("/restaurant/"+r.id, { state:r })} />
              )}
            />
          ))}

          {restaurants.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:C.gray }}>
              <div style={{ fontSize:50, marginBottom:12 }}>🍽️</div>
              <div style={{ fontSize:15, fontWeight:600, color:C.dark }}>אין מסעדות עדיין</div>
              <div style={{ fontSize:12, marginTop:6 }}>הוסף מסעדות דרך פורטל העסקים</div>
            </div>
          )}
        </>
      )}

      {/* GIFT BANNER */}
      {!searchQ && !loading && (
        <div onClick={() => navigate("/cards")} style={{ margin:"10px 16px 20px", background:"linear-gradient(135deg,#C8102E,#7B0D1E)", borderRadius:20, padding:"18px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
          <IcoGift s={36} />
          <div>
            <div style={{ color:"white", fontWeight:900, fontSize:15 }}>שלחו כרטיס מתנה!</div>
            <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, marginTop:2 }}>אפשרויות תשלום מרובות</div>
          </div>
        </div>
      )}

      <BottomNav cartCount={cartCount} />
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

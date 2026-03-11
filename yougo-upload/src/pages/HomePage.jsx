// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HomePage.jsx — OLD DESIGN RESTORED
//  Keeps: Supabase data, React Router navigate
//  Restores: white topbar, icon categories, full cards
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect } from "react";
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
  var bg = white ? "white" : C.red;
  var fg = white ? C.red : "white";
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="16" fill={bg} />
      <path d="M12 42V20l16 16V20" stroke={fg} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 30h16M42 24l8 6-8 6" stroke={fg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CatAll({ active }) { return (<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><circle cx="10" cy="10" r="6" fill={active ? "white" : "#F59E0B"} opacity={active ? 0.9 : 1} /><circle cx="22" cy="10" r="6" fill={active ? "white" : "#C8102E"} opacity={active ? 0.9 : 1} /><circle cx="10" cy="22" r="6" fill={active ? "white" : "#16A34A"} opacity={active ? 0.9 : 1} /><circle cx="22" cy="22" r="6" fill={active ? "white" : "#3B82F6"} opacity={active ? 0.9 : 1} /></svg>); }
function CatChicken({ active }) { return (<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M8 26c0-6 2-10 8-12 6-2 10 2 10 6s-4 8-10 8-8-2-8-2z" fill={active ? "white" : "#F59E0B"} /><circle cx="18" cy="14" r="3" fill={active ? "rgba(255,255,255,0.8)" : "#EF4444"} /><path d="M24 8c2 0 4 1 4 3s-2 4-4 4M24 8l-2 6" stroke={active ? "white" : "#C8102E"} strokeWidth="1.8" strokeLinecap="round" /></svg>); }
function CatBurger({ active }) { return (<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M6 12c0-4 4-6 10-6s10 2 10 6" fill={active ? "white" : "#F59E0B"} /><rect x="4" y="12" width="24" height="4" rx="2" fill={active ? "rgba(255,255,255,0.7)" : "#EF4444"} /><path d="M4 16c1 3 3 4 12 4s11-1 12-4" fill={active ? "rgba(255,255,255,0.6)" : "#22C55E"} /><rect x="4" y="20" width="24" height="5" rx="2.5" fill={active ? "white" : "#F59E0B"} /></svg>); }
function CatShawarma({ active }) { return (<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><rect x="14" y="4" width="4" height="24" rx="2" fill={active ? "rgba(255,255,255,0.5)" : "#92400E"} /><ellipse cx="16" cy="10" rx="7" ry="3" fill={active ? "white" : "#EF4444"} opacity="0.9" /><ellipse cx="16" cy="14" rx="8" ry="3" fill={active ? "rgba(255,255,255,0.9)" : "#F97316"} opacity="0.9" /><ellipse cx="16" cy="18" rx="7" ry="3" fill={active ? "white" : "#EF4444"} opacity="0.85" /><ellipse cx="16" cy="22" rx="6" ry="2.5" fill={active ? "rgba(255,255,255,0.9)" : "#F97316"} opacity="0.8" /></svg>); }
function CatPizza({ active }) { return (<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M16 4l12 22H4L16 4z" fill={active ? "white" : "#F59E0B"} /><circle cx="13" cy="17" r="2.5" fill={active ? "rgba(255,255,255,0.6)" : "#EF4444"} /><circle cx="19" cy="20" r="2" fill={active ? "rgba(255,255,255,0.6)" : "#EF4444"} /><circle cx="16" cy="13" r="1.5" fill={active ? "rgba(255,255,255,0.6)" : "#EF4444"} /></svg>); }
function CatSushi({ active }) { return (<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="white" opacity={active ? 0.9 : 1} /><circle cx="16" cy="16" r="7" fill={active ? "rgba(255,255,255,0.4)" : "#1D3557"} /><circle cx="16" cy="16" r="4" fill={active ? "white" : "#F59E0B"} /><circle cx="16" cy="16" r="2" fill={active ? "rgba(200,16,46,0.8)" : "#EF4444"} /></svg>); }
function CatDrinks({ active }) { return (<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M10 8l2 16h8l2-16H10z" fill={active ? "white" : "#BAE6FD"} /><path d="M8 8h16" stroke={active ? "rgba(255,255,255,0.5)" : "#0EA5E9"} strokeWidth="2" strokeLinecap="round" /><path d="M16 12l2-8" stroke={active ? "rgba(255,255,255,0.6)" : "#F59E0B"} strokeWidth="2" strokeLinecap="round" /></svg>); }
function CatSweets({ active }) { return (<svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M6 22c0-8 4-12 10-12s10 4 10 12H6z" fill={active ? "white" : "#F59E0B"} /><rect x="14" y="8" width="4" height="14" rx="2" fill={active ? "rgba(255,255,255,0.5)" : "#92400E"} /><path d="M6 22h20v3H6v-3z" fill={active ? "rgba(255,255,255,0.7)" : "#D97706"} /></svg>); }

var CATS = [
  { id: "all",      Cmp: CatAll,      label: "הכל" },
  { id: "chicken",  Cmp: CatChicken,  label: "עוף" },
  { id: "burger",   Cmp: CatBurger,   label: "המבורגר" },
  { id: "shawarma", Cmp: CatShawarma, label: "שווארמה" },
  { id: "pizza",    Cmp: CatPizza,    label: "פיצה" },
  { id: "sushi",    Cmp: CatSushi,    label: "סושי" },
  { id: "drinks",   Cmp: CatDrinks,   label: "משקאות" },
  { id: "sweets",   Cmp: CatSweets,   label: "קינוחים" },
];

var BANNERS = [
  { id: 1, title: "עם Yougo", sub: "הבית תמיד מוכן", tag: "רמדאן כריים", bg: "linear-gradient(135deg,#C8102E 0%,#7B0D1E 100%)" },
  { id: 2, title: "משלוח חינם", sub: "על ההזמנה הראשונה", tag: "מבצע מוגבל", bg: "linear-gradient(135deg,#F5A623 0%,#C27A0E 100%)" },
  { id: 3, title: "אוכל טרי", sub: "מהמסעדות הטובות", tag: "כל יום", bg: "linear-gradient(135deg,#1D3557 0%,#0A1A30 100%)" },
  { id: 4, title: "Yougo פרמיום", sub: "הצטרף וחסוך 20%", tag: "הצטרף עכשיו", bg: "linear-gradient(135deg,#7C3AED 0%,#4C1D95 100%)" },
];

// ✅ FIX: match Supabase category field (case-insensitive, multi-keyword)
var CAT_KEYWORDS = {
  chicken:  ["עוף", "chicken", "دجاج"],
  burger:   ["המבורגר", "burger", "برغر"],
  shawarma: ["שווארמה", "shawarma", "شاورما"],
  pizza:    ["פיצה", "pizza", "بيتزا"],
  sushi:    ["סושי", "sushi", "سوشي"],
  drinks:   ["משקאות", "מיצים", "drinks", "مشروبات"],
  sweets:   ["קינוחים", "קפה", "sweets", "حلويات"],
};

function matchesCat(restaurant, catId) {
  if (catId === "all") return true;
  const keywords = CAT_KEYWORDS[catId] || [];
  const haystack = [restaurant.category, restaurant.name, restaurant.cuisine_type]
    .filter(Boolean).join(" ").toLowerCase();
  return keywords.some(k => haystack.includes(k.toLowerCase()));
}

export default function HomePage({ cart, add, rem, cartCount }) {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cat, setCat] = useState("all");
  const [banner, setBanner] = useState(0);

  useEffect(function() {
    var t = setInterval(function() { setBanner(function(p) { return (p + 1) % BANNERS.length; }); }, 3800);
    return function() { clearInterval(t); };
  }, []);

  useEffect(function() {
    supabase.from("restaurants").select("*").eq("active", true)
      .then(function({ data }) { setRestaurants(data || []); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, []);

  var filtered = restaurants.filter(function(r) {
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return r.name?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q);
    }
    // ✅ FIX: use matchesCat for robust category matching
    return matchesCat(r, cat);
  });

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", overflowX: "hidden", paddingBottom: 90 }}>

      {/* TOP BAR */}
      <div style={{ background: C.white, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        {searchOpen ? (
          <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
            <input autoFocus value={searchQ} onChange={function(e) { setSearchQ(e.target.value); }}
              placeholder="חיפוש מסעדה..."
              style={{ flex: 1, border: "1.5px solid " + C.lightGray, borderRadius: 24, padding: "8px 14px", fontSize: 13, outline: "none", background: C.ultra, direction: "rtl" }} />
            <button onClick={function() { setSearchOpen(false); setSearchQ(""); }}
              style={{ background: C.ultra, border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcoClose />
            </button>
          </div>
        ) : (
          <>
            <button onClick={function() { setSearchOpen(true); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
              <IcoSearch />
            </button>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: C.ultra, borderRadius: 24, padding: "7px 14px", cursor: "pointer" }}>
              <IcoHome s={18} c={C.red} />
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>בית</div>
                <div style={{ fontSize: 10, color: C.gray }}>אלפורסאן 0, ראמה</div>
              </div>
              <IcoChevDown />
            </div>
            <button onClick={function() { navigate("/admin"); }}
              style={{ background: C.red, color: "white", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, boxShadow: "0 2px 8px rgba(200,16,46,0.35)" }}>
              <IcoShield s={13} /> ניהול
            </button>
          </>
        )}
      </div>

      {/* TABS */}
      <div style={{ background: C.white, display: "flex", borderBottom: "1px solid " + C.lightGray }}>
        {[
          { id: "restaurants", label: "מסעדות", I: IcoFork },
          { id: "market",      label: "מרקט",   I: IcoStore },
        ].map(function(t) {
          var active = t.id === "restaurants";
          return (
            <button key={t.id}
              onClick={function() { if (t.id === "market") navigate("/market"); }}
              style={{ flex: 1, background: "none", border: "none", padding: "11px 0 8px", fontSize: 13, fontWeight: 700, color: active ? C.red : C.gray, borderBottom: active ? "2.5px solid " + C.red : "2.5px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <t.I s={18} c={active ? C.red : C.gray} />{t.label}
            </button>
          );
        })}
      </div>

      {/* BANNER */}
      {!searchQ && (
        <div style={{ padding: "14px 16px 8px" }}>
          <div style={{ borderRadius: 22, overflow: "hidden", position: "relative", height: 165 }}>
            <div style={{ display: "flex", transition: "transform .55s ease", transform: "translateX(" + (banner * 100) + "%)" }}>
              {BANNERS.map(function(b) {
                return (
                  <div key={b.id} style={{ minWidth: "100%", height: 165, background: b.bg, display: "flex", flexDirection: "column", justifyContent: "center", padding: "22px 24px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", right: -30, top: -30, width: 150, height: 150, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", left: 20, bottom: 10, opacity: 0.1 }}><YougoLogo size={80} white={true} /></div>
                    <span style={{ color: "rgba(255,255,220,0.9)", fontSize: 11, fontWeight: 700, marginBottom: 4, background: "rgba(255,255,255,0.1)", alignSelf: "flex-start", borderRadius: 20, padding: "2px 10px" }}>{b.tag}</span>
                    <div style={{ color: "white", fontSize: 24, fontWeight: 900, lineHeight: 1.15 }}>{b.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: 600, marginTop: 3 }}>{b.sub}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
              {BANNERS.map(function(_, i) {
                return (<div key={i} onClick={function() { setBanner(i); }} style={{ width: i === banner ? 22 : 7, height: 7, borderRadius: 3.5, background: i === banner ? "white" : "rgba(255,255,255,0.4)", transition: "all .3s", cursor: "pointer" }} />);
              })}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY ICONS */}
      {!searchQ && (
        <div style={{ padding: "4px 0 6px" }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 16px", scrollbarWidth: "none" }}>
            {CATS.map(function(c) {
              var active = cat === c.id;
              return (
                <button key={c.id} onClick={function() { setCat(c.id); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: active ? C.red : C.white, border: active ? "none" : "1.5px solid " + C.lightGray, borderRadius: 16, padding: "9px 14px", cursor: "pointer", flexShrink: 0, transition: "all .2s", boxShadow: active ? "0 4px 14px rgba(200,16,46,0.28)" : "none" }}>
                  <c.Cmp active={active} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: active ? "white" : C.dark, whiteSpace: "nowrap" }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION HEADER */}
      <div style={{ padding: "8px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: C.dark, display: "flex", alignItems: "center", gap: 6 }}>
          {!searchQ && <IcoFire />}
          {searchQ ? "תוצאות: " + searchQ : cat === "all" ? "הכי פופולרי" : CATS.find(function(c) { return c.id === cat; })?.label}
        </span>
        <span style={{ fontSize: 12, color: C.gray }}>{loading ? "טוען..." : filtered.length + " מסעדות"}</span>
      </div>

      {/* RESTAURANT CARDS */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: C.gray }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid " + C.lightGray, borderTopColor: C.red, animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
            טוען מסעדות...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: C.gray }}>
            <IcoSearch s={48} c={C.lightGray} />
            <div style={{ fontSize: 14, marginTop: 10, fontWeight: 600 }}>לא נמצאו תוצאות</div>
          </div>
        ) : (
          filtered.map(function(r, i) {
            return <RestCard key={r.id} r={r} onClick={function() { if (r.active) navigate("/restaurant/" + r.id, { state: r }); }} delay={i * 60} />;
          })
        )}
      </div>

      {/* GIFT BANNER */}
      {!searchQ && !loading && (
        <div style={{ margin: "20px 16px 0", background: "linear-gradient(135deg,#C8102E,#7B0D1E)", borderRadius: 20, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <IcoGift s={36} />
          <div>
            <div style={{ color: "white", fontWeight: 900, fontSize: 15 }}>שלחו כרטיס מתנה!</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>אפשרויות תשלום מרובות</div>
          </div>
        </div>
      )}

      <BottomNav cartCount={cartCount} />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}*{box-sizing:border-box}::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

function RestCard({ r, onClick, delay }) {
  return (
    <div onClick={onClick}
      style={{ background: C.white, borderRadius: 22, overflow: "hidden", cursor: r.active ? "pointer" : "default", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", animation: "fadeIn .4s ease " + delay + "ms both", opacity: r.active ? 1 : 0.6 }}>
      {/* Logo area */}
      <div style={{ height: 115, background: "linear-gradient(135deg," + hexA(r.cover_color || "#C8102E", "22") + "," + hexA(r.cover_color || "#C8102E", "44") + ")", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", fontSize: 64 }}>
        {r.logo_emoji || "🍽️"}
        {!r.active && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.5)", padding: "4px 14px", borderRadius: 20 }}>סגור כעת</span>
          </div>
        )}
        {r.badge && (
          <span style={{ position: "absolute", top: 8, right: 8, background: C.green, color: "white", fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 20 }}>{r.badge}</span>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: C.dark }}>{r.name}</div>
            <div style={{ fontSize: 11, color: C.gray, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
              <IcoPin s={11} />{r.location || r.address || ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#FFF9EB", borderRadius: 20, padding: "3px 9px" }}>
            <IcoStar /><span style={{ fontSize: 12, fontWeight: 700, color: "#B45309" }}>{r.rating || "4.5"}</span>
            {r.reviews_count && <span style={{ fontSize: 10, color: C.gray }}>(+{r.reviews_count})</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { I: IcoClock, t: (r.delivery_time || "20-30") + " דק'" },
            { I: IcoTruck, t: r.delivery_fee === 0 ? "משלוח חינם" : "₪" + (r.delivery_fee || 12) + " משלוח" },
            { I: IcoOrders, t: "מינ' ₪" + (r.min_order || 40) },
          ].map(function(x, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: C.ultra, borderRadius: 20, padding: "4px 10px" }}>
                <x.I s={12} /><span style={{ fontSize: 11, fontWeight: 600, color: C.dark }}>{x.t}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.active ? C.green : "#EF4444", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: r.active ? C.green : "#EF4444", fontWeight: 700 }}>{r.active ? "פתוח" : "סגור"}</span>
          {r.closing_time && <span style={{ fontSize: 11, color: C.gray }}>עד {r.closing_time}</span>}
        </div>
      </div>
    </div>
  );
}

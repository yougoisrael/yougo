// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MarketPage.jsx — OLD DESIGN RESTORED
//  White topbar + tabs, icon categories, grid cards
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  C, hexA,
  IcoSearch, IcoClose, IcoHome, IcoChevDown, IcoShield,
  IcoStar, IcoPin, IcoFork, IcoStore,
} from "../components/Icons";
import BottomNav from "../components/BottomNav";

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

function MktAll({ active }) { return (<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M6 8h4l5 14h6l5-14h4" stroke={active ? "white" : C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="14" cy="26" r="2" fill={active ? "white" : C.red} /><circle cx="22" cy="26" r="2" fill={active ? "white" : C.red} /></svg>); }
function MktFruits({ active }) { return (<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M16 10c-5 0-8 4-8 9s3 9 8 9 8-4 8-9-3-9-8-9z" fill={active ? "white" : "#EF4444"} opacity={active ? 0.9 : 1} /><path d="M16 10c1-4 5-5 7-3" stroke={active ? "white" : "#16A34A"} strokeWidth="2" strokeLinecap="round" fill="none" /><path d="M21 6c0-2 4-3 5-1-1 0-2 2-3 3-1 0-2-1-2-2z" fill={active ? "rgba(255,255,255,0.7)" : "#16A34A"} /></svg>); }
function MktMeat({ active }) { return (<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M8 22c0-6 4-12 12-12 4 0 7 2 7 5s-3 7-7 7H8z" fill={active ? "white" : "#EF4444"} opacity={active ? 0.9 : 1} /><circle cx="10" cy="22" r="3" fill={active ? "rgba(255,255,255,0.6)" : "white"} /><rect x="10" y="19" width="14" height="6" rx="3" fill={active ? "rgba(255,255,255,0.6)" : "white"} /><circle cx="24" cy="22" r="3" fill={active ? "rgba(255,255,255,0.6)" : "white"} /></svg>); }
function MktSnacks({ active }) { return (<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M10 14c-2-4 0-8 4-8s5 4 2 8M18 14c-2-4 0-8 4-8s5 4 2 8M22 14c2-4 6-2 6 2s-4 6-8 6" fill={active ? "white" : "#FEF08A"} /><path d="M10 14c-4-2-6 2-6 6s4 8 12 8 12-4 12-8-2-8-6-6" fill={active ? "rgba(255,255,255,0.8)" : "#FBBF24"} /></svg>); }
function MktDairy({ active }) { return (<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M13 8h6v2c3 1 5 4 5 8v8H8v-8c0-4 2-7 5-8V8z" fill={active ? "white" : "#DBEAFE"} /><path d="M8 18c2-2 6-2 8 0s6 2 8 0" stroke={active ? "rgba(255,255,255,0.5)" : "#3B82F6"} strokeWidth="1.5" /><rect x="12" y="4" width="8" height="5" rx="2" fill={active ? "rgba(255,255,255,0.6)" : "#93C5FD"} /></svg>); }

var MKTCATS = [
  { id: "all",    Cmp: MktAll,    label: "מרקט" },
  { id: "fruits", Cmp: MktFruits, label: "פירות וירקות" },
  { id: "meat",   Cmp: MktMeat,   label: "דגים ובשרים" },
  { id: "snacks", Cmp: MktSnacks, label: "בתי קלי" },
  { id: "dairy",  Cmp: MktDairy,  label: "מוצרי חלב" },
];



export default function MarketPage({ cartCount }) {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(function() {
    supabase.from("stores").select("*").eq("active", true)
      .then(function({ data }) { setStores(data || []); setLoadingStores(false); })
      .catch(function() { setLoadingStores(false); });
  }, []);
  const [mktCat, setMktCat] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  var filtered = stores.filter(function(s) {
    if (searchQ) return s.name.includes(searchQ) || s.cat.includes(searchQ);
    return true;
  });

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", overflowX: "hidden", paddingBottom: 90 }}>

      {/* TOP BAR */}
      <div style={{ background: C.white, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        {searchOpen ? (
          <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
            <input autoFocus value={searchQ} onChange={function(e) { setSearchQ(e.target.value); }}
              placeholder="חיפוש חנות..."
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
          var active = t.id === "market";
          return (
            <button key={t.id}
              onClick={function() { if (t.id === "restaurants") navigate("/"); }}
              style={{ flex: 1, background: "none", border: "none", padding: "11px 0 8px", fontSize: 13, fontWeight: 700, color: active ? C.red : C.gray, borderBottom: active ? "2.5px solid " + C.red : "2.5px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <t.I s={18} c={active ? C.red : C.gray} />{t.label}
            </button>
          );
        })}
      </div>

      {/* MARKET HERO BANNER */}
      <div style={{ margin: "14px 16px 0", background: "linear-gradient(135deg,#C8102E,#7B0D1E)", borderRadius: 22, padding: "22px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 16, bottom: 10, opacity: 0.1 }}><YougoLogo size={70} white={true} /></div>
        <span style={{ color: "rgba(255,255,220,0.9)", fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "2px 10px", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <IcoStore s={12} c="white" /> Yougo מרקט
        </span>
        <div style={{ color: "white", fontSize: 20, fontWeight: 900, marginTop: 8 }}>הבית תמיד מוכן</div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 3 }}>כל מה שחסר בבית מגיע בחצי שעה</div>
      </div>

      {/* CATEGORY ICONS */}
      <div style={{ padding: "14px 0 4px" }}>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "4px 16px", scrollbarWidth: "none" }}>
          {MKTCATS.map(function(c) {
            var active = mktCat === c.id;
            return (
              <button key={c.id} onClick={function() { setMktCat(c.id); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: active ? C.red : C.white, border: active ? "none" : "1.5px solid " + C.lightGray, borderRadius: 18, padding: "10px 14px", cursor: "pointer", flexShrink: 0, transition: "all .2s", minWidth: 76, boxShadow: active ? "0 4px 14px rgba(200,16,46,0.3)" : "0 1px 4px rgba(0,0,0,0.05)" }}>
                <c.Cmp active={active} />
                <span style={{ fontSize: 10, fontWeight: 700, color: active ? "white" : C.dark, whiteSpace: "nowrap", textAlign: "center" }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION HEADER */}
      <div style={{ padding: "8px 16px 6px", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: C.dark, display: "flex", alignItems: "center", gap: 6 }}>
          <IcoStore s={16} c={C.red} /> חנויות קרובות
        </span>
        <span style={{ fontSize: 12, color: C.gray }}>{filtered.length} חנויות</span>
      </div>

      {/* STORE GRID */}
      <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
        {loadingStores ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: C.gray }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid " + C.lightGray, borderTopColor: C.red, animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
            טוען חנויות...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "50px 0", color: C.gray }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>אין חנויות זמינות</div>
          </div>
        ) : filtered.map(function(s, i) {
          return (
            <div key={s.id}
              style={{ background: C.white, borderRadius: 18, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", animation: "fadeIn .4s ease " + (i * 60) + "ms both" }}>
              {/* Logo area */}
              <div style={{ height: 84, background: "linear-gradient(135deg," + hexA(s.color, "22") + "," + hexA(s.color, "44") + ")", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", fontSize: 40 }}>
                {s.emoji}
                {s.self && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(20,20,20,0.75)", padding: "3px 8px", textAlign: "center" }}>
                    <span style={{ color: "white", fontSize: 9, fontWeight: 700 }}>איסוף עצמי בלבד</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: "10px 10px 12px" }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: C.dark }}>{s.name}</div>
                <div style={{ fontSize: 10, color: C.gray, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 2 }}>
                  <IcoPin s={9} />{s.location}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IcoStar s={10} /><span style={{ fontSize: 10, fontWeight: 700, color: "#B45309" }}>{s.rating}</span>
                    <span style={{ fontSize: 9, color: C.gray }}>(+{s.reviews})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.open ? C.green : "#EF4444", display: "inline-block" }} />
                    <span style={{ fontSize: 9, color: s.open ? C.green : "#EF4444", fontWeight: 700 }}>{s.open ? "פתוח עד " + s.close : "סגור"}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>      <BottomNav cartCount={cartCount} />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

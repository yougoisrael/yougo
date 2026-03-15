import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  C, hexA,
  IcoSearch, IcoClose, IcoHome, IcoChevDown, IcoShield,
  IcoStar, IcoClock, IcoTruck, IcoOrders, IcoPin,
  IcoFork, IcoStore, IcoFire, IcoGift, IcoUser, IcoBell,
  IcoHelp, IcoUsers, IcoCreditCard, IcoPackage, IcoLock, IcoBack, IcoFlash,
} from "../components/Icons";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import { cachedQuery, invalidateCache, TTL } from "../lib/cache";

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

// ── CATEGORY ICONS — Professional SVG ─────────────
function IcoCatAll({ active }) {
  const c = active ? "white" : null;
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <rect x="4" y="4" width="14" height="14" rx="4" fill={c || "#F59E0B"} />
      <rect x="22" y="4" width="14" height="14" rx="4" fill={c || "#C8102E"} />
      <rect x="4" y="22" width="14" height="14" rx="4" fill={c || "#16A34A"} />
      <rect x="22" y="22" width="14" height="14" rx="4" fill={c || "#3B82F6"} />
    </svg>
  );
}
function IcoCatChicken({ active }) {
  const c = active ? "white" : "#F97316";
  const c2 = active ? "rgba(255,255,255,0.6)" : "#C8102E";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      {/* Body */}
      <ellipse cx="20" cy="26" rx="11" ry="9" fill={c} />
      {/* Head */}
      <circle cx="28" cy="16" r="6" fill={c} />
      {/* Beak */}
      <path d="M33 15l4 2-4 2z" fill={active ? "rgba(255,255,255,0.8)" : "#F59E0B"} />
      {/* Comb */}
      <path d="M26 10c0-2 2-3 2-3s2 1 2 3" stroke={c2} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Wing */}
      <path d="M10 24c2-4 6-5 8-4" stroke={active ? "rgba(255,255,255,0.5)" : "#EA580C"} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Legs */}
      <path d="M16 34l-2 4M20 35v4M24 34l2 4" stroke={active ? "rgba(255,255,255,0.6)" : "#EA580C"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IcoCatBurger({ active }) {
  const bun = active ? "white" : "#F59E0B";
  const meat = active ? "rgba(255,255,255,0.7)" : "#92400E";
  const lettuce = active ? "rgba(255,255,255,0.5)" : "#16A34A";
  const cheese = active ? "rgba(255,255,255,0.8)" : "#F97316";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      {/* Top bun */}
      <path d="M8 18c0-7 4-11 12-11s12 4 12 11H8z" fill={bun} />
      {/* Sesame seeds */}
      <circle cx="16" cy="12" r="1.2" fill={active ? "rgba(255,255,255,0.4)" : "#D97706"} />
      <circle cx="21" cy="10" r="1.2" fill={active ? "rgba(255,255,255,0.4)" : "#D97706"} />
      <circle cx="25" cy="13" r="1.2" fill={active ? "rgba(255,255,255,0.4)" : "#D97706"} />
      {/* Cheese */}
      <rect x="7" y="18" width="26" height="4" rx="1" fill={cheese} />
      {/* Meat */}
      <rect x="8" y="22" width="24" height="5" rx="2" fill={meat} />
      {/* Lettuce */}
      <path d="M6 27c3-2 6 0 8-2s5 2 8 0 6-2 8 0v2H6v-2z" fill={lettuce} />
      {/* Bottom bun */}
      <rect x="7" y="29" width="26" height="6" rx="3" fill={bun} />
    </svg>
  );
}
function IcoCatShawarma({ active }) {
  const wrap = active ? "white" : "#FCD34D";
  const meat1 = active ? "rgba(255,255,255,0.8)" : "#C8102E";
  const meat2 = active ? "rgba(255,255,255,0.6)" : "#F97316";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      {/* Spit */}
      <rect x="18" y="3" width="4" height="34" rx="2" fill={active ? "rgba(255,255,255,0.3)" : "#92400E"} />
      {/* Meat layers - cone shape */}
      <ellipse cx="20" cy="10" rx="8" ry="3.5" fill={meat1} />
      <ellipse cx="20" cy="15" rx="10" ry="3.5" fill={meat2} />
      <ellipse cx="20" cy="20" rx="11" ry="3.5" fill={meat1} />
      <ellipse cx="20" cy="25" rx="10" ry="3.5" fill={meat2} />
      <ellipse cx="20" cy="30" rx="8" ry="3" fill={meat1} />
      {/* Wrap bottom */}
      <path d="M14 32c0 3 2 4 6 4s6-1 6-4H14z" fill={wrap} />
    </svg>
  );
}
function IcoCatPizza({ active }) {
  const dough = active ? "white" : "#FCD34D";
  const sauce = active ? "rgba(255,255,255,0.7)" : "#C8102E";
  const topping = active ? "rgba(255,255,255,0.5)" : "#EF4444";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      {/* Full circle base */}
      <circle cx="20" cy="20" r="16" fill={dough} />
      <circle cx="20" cy="20" r="13" fill={sauce} />
      {/* Cheese */}
      <circle cx="20" cy="20" r="11" fill={active ? "rgba(255,255,255,0.5)" : "#FCD34D"} />
      {/* Slice lines */}
      <line x1="20" y1="7" x2="20" y2="33" stroke={active ? "rgba(255,255,255,0.3)" : "rgba(200,16,46,0.25)"} strokeWidth="1" />
      <line x1="7" y1="20" x2="33" y2="20" stroke={active ? "rgba(255,255,255,0.3)" : "rgba(200,16,46,0.25)"} strokeWidth="1" />
      <line x1="10" y1="10" x2="30" y2="30" stroke={active ? "rgba(255,255,255,0.3)" : "rgba(200,16,46,0.25)"} strokeWidth="1" />
      <line x1="30" y1="10" x2="10" y2="30" stroke={active ? "rgba(255,255,255,0.3)" : "rgba(200,16,46,0.25)"} strokeWidth="1" />
      {/* Toppings */}
      <circle cx="20" cy="14" r="2" fill={topping} />
      <circle cx="14" cy="22" r="2" fill={topping} />
      <circle cx="26" cy="22" r="2" fill={topping} />
      <circle cx="20" cy="26" r="1.5" fill={topping} />
    </svg>
  );
}
function IcoCatSushi({ active }) {
  const rice = active ? "white" : "white";
  const nori = active ? "rgba(255,255,255,0.3)" : "#1D3557";
  const fish = active ? "rgba(255,255,255,0.7)" : "#F97316";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      {/* Plate */}
      <circle cx="20" cy="22" r="14" fill={active ? "rgba(255,255,255,0.15)" : "#F3F4F6"} />
      {/* Maki roll 1 */}
      <rect x="8" y="16" width="10" height="12" rx="5" fill={nori} />
      <circle cx="13" cy="22" r="4" fill={rice} />
      <circle cx="13" cy="22" r="2" fill={fish} />
      {/* Maki roll 2 */}
      <rect x="22" y="16" width="10" height="12" rx="5" fill={nori} />
      <circle cx="27" cy="22" r="4" fill={rice} />
      <circle cx="27" cy="22" r="2" fill={active ? "rgba(255,255,255,0.6)" : "#EF4444"} />
      {/* Chopsticks */}
      <line x1="14" y1="7" x2="18" y2="15" stroke={active ? "rgba(255,255,255,0.5)" : "#92400E"} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="7" x2="22" y2="15" stroke={active ? "rgba(255,255,255,0.5)" : "#92400E"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IcoCatDrinks({ active }) {
  const cup = active ? "white" : "#BAE6FD";
  const liquid = active ? "rgba(255,255,255,0.7)" : "#0284C7";
  const straw = active ? "rgba(255,255,255,0.6)" : "#F59E0B";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      {/* Cup body */}
      <path d="M10 10h20l-3 22H13L10 10z" fill={cup} />
      {/* Liquid fill */}
      <path d="M11 16h18l-2.5 16H13.5L11 16z" fill={liquid} />
      {/* Ice cubes */}
      <rect x="14" y="20" width="5" height="5" rx="1.5" fill={active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)"} />
      <rect x="21" y="22" width="4" height="4" rx="1.5" fill={active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)"} />
      {/* Lid */}
      <rect x="8" y="7" width="24" height="4" rx="2" fill={active ? "rgba(255,255,255,0.5)" : "#7DD3FC"} />
      {/* Straw */}
      <rect x="22" y="2" width="3" height="18" rx="1.5" fill={straw} />
    </svg>
  );
}
function IcoCatSweets({ active }) {
  const cone = active ? "white" : "#FCD34D";
  const scoop1 = active ? "rgba(255,255,255,0.9)" : "#F9A8D4";
  const scoop2 = active ? "rgba(255,255,255,0.7)" : "#C8102E";
  const sprinkle = active ? "rgba(255,255,255,0.5)" : "#A78BFA";
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      {/* Cone */}
      <path d="M14 22l6 14 6-14H14z" fill={cone} />
      {/* Cone lines */}
      <line x1="20" y1="22" x2="20" y2="36" stroke={active ? "rgba(255,255,255,0.3)" : "#D97706"} strokeWidth="1" />
      <line x1="14" y1="25" x2="26" y2="25" stroke={active ? "rgba(255,255,255,0.3)" : "#D97706"} strokeWidth="1" />
      {/* Bottom scoop */}
      <circle cx="20" cy="20" r="7" fill={scoop1} />
      {/* Top scoop */}
      <circle cx="20" cy="13" r="6" fill={scoop2} />
      {/* Sprinkles */}
      <rect x="16" y="11" width="3" height="1.5" rx="0.75" fill={sprinkle} transform="rotate(-30 16 11)" />
      <rect x="22" y="13" width="3" height="1.5" rx="0.75" fill={active ? "rgba(255,255,255,0.6)" : "#FCD34D"} transform="rotate(20 22 13)" />
      <rect x="18" y="15" width="2.5" height="1.5" rx="0.75" fill={active ? "rgba(255,255,255,0.6)" : "#34D399"} transform="rotate(10 18 15)" />
      {/* Cherry */}
      <circle cx="20" cy="7" r="2.5" fill={active ? "rgba(255,255,255,0.8)" : "#EF4444"} />
      <path d="M20 7c0-3 3-4 3-4" stroke={active ? "rgba(255,255,255,0.5)" : "#16A34A"} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const CATS = [
  { id:"all",      Cmp:IcoCatAll,      label:"הכל",      bg:"#F59E0B" },
  { id:"chicken",  Cmp:IcoCatChicken,  label:"עוף",       bg:"#F97316" },
  { id:"burger",   Cmp:IcoCatBurger,   label:"המבורגר",   bg:"#92400E" },
  { id:"shawarma", Cmp:IcoCatShawarma, label:"שווארמה",   bg:"#C8102E" },
  { id:"pizza",    Cmp:IcoCatPizza,    label:"פיצה",      bg:"#EF4444" },
  { id:"sushi",    Cmp:IcoCatSushi,    label:"סושי",      bg:"#1D3557" },
  { id:"drinks",   Cmp:IcoCatDrinks,   label:"משקאות",    bg:"#0284C7" },
  { id:"sweets",   Cmp:IcoCatSweets,   label:"קינוחים",   bg:"#EC4899" },
];

const DEFAULT_BANNERS = [
  { id:1, title:"עם Yougo", sub:"הבית תמיד מוכן", tag:"ברוכים", bg:"linear-gradient(135deg,#C8102E 0%,#7B0D1E 100%)" },
  { id:2, title:"משלוח מהיר", sub:"עד 30 דקות בלבד", tag:"מהיר", bg:"linear-gradient(135deg,#1D4ED8,#7C3AED)" },
];

function matchesCat(r, cat) {
  if (cat === "all") return true;
  const c = (r.category || "").toLowerCase();
  const map = { chicken:"עוף|chicken|دجاج", burger:"המבורגר|burger|بورغر", shawarma:"שווארמה|שאוורמה|شاورما", pizza:"פיצה|פיצרייה|بيتزا", sushi:"סושי|سوشي", drinks:"שתייה|משקאות|مشروبات", sweets:"קינוחים|מתוקים|حلويات" };
  return new RegExp(map[cat]||cat,"i").test(c);
}

// ── Hamburger menu icon ──────────────────────────
function IcoHamburger({ c = C.dark }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M3 12h18M3 18h18" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Sidebar Drawer ────────────────────────────────
function Sidebar({ open, onClose, user, navigate }) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:600,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition:"opacity 0.3s ease",
        }}
      />
      {/* Drawer */}
      <div style={{
        position:"fixed", top:0, right:0, height:"100dvh", width:300, maxWidth:"80vw",
        background:"white", zIndex:601, display:"flex", flexDirection:"column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition:"transform 0.35s cubic-bezier(0.34,1.1,0.64,1)",
        boxShadow:"-8px 0 40px rgba(0,0,0,0.15)", overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#C8102E,#7B0D1E)", padding:"calc(env(safe-area-inset-top,0px) + 54px) 20px 24px", position:"relative", flexShrink:0 }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, left:14, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <IcoBack s={16} c="white" />
          </button>
          {/* Avatar */}
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
            <IcoUser s={32} c="white" />
          </div>
          <div style={{ color:"white", fontSize:18, fontWeight:900 }}>{user?.name || user?.firstName || "אורח"}</div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginTop:2 }}>{user?.email || "התחבר לחשבון שלך"}</div>
        </div>

        {/* Menu items */}
        <div style={{ flex:1, padding:"12px 0", overflowY:"auto" }}>
          {[
            { icon:<IcoUser s={20} c={C.red}/>,      label:"הפרופיל שלי",    path:"/profile" },
            { icon:<IcoPackage s={20} c={C.red}/>,   label:"ההזמנות שלי",   path:"/orders" },
            { icon:<IcoCreditCard s={20} c={C.red}/>,label:"אמצעי תשלום",   path:"/cards" },
            { icon:<IcoUsers s={20} c={C.red}/>,     label:"הזמן חברים",    path:"/invite", badge:"חדש!" },
            { icon:<IcoStore s={20} c={C.red}/>,     label:"מרקט",          path:"/market" },
          ].map((item, i) => (
            <button key={i}
              onClick={() => { navigate(item.path); onClose(); }}
              style={{ width:"100%", background:"none", border:"none", padding:"14px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", textAlign:"right", fontFamily:"Arial,sans-serif", borderBottom:"1px solid #F9FAFB" }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"rgba(200,16,46,0.07)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {item.icon}
              </div>
              <span style={{ flex:1, fontSize:14, fontWeight:700, color:"#111827" }}>{item.label}</span>
              {item.badge && <span style={{ fontSize:10, background:C.red, color:"white", borderRadius:10, padding:"2px 8px", fontWeight:700 }}>{item.badge}</span>}
              <span style={{ color:"#D1D5DB", fontSize:16 }}>‹</span>
            </button>
          ))}

          {/* Divider */}
          <div style={{ height:8, background:"#F9FAFB", margin:"8px 0" }} />

          {[
            { icon:<IcoHelp s={20} c="#6B7280"/>,    label:"תמיכה",          path:"/support" },
            { icon:<IcoLock s={20} c="#6B7280"/>,    label:"מדיניות פרטיות", path:"/privacy" },
          ].map((item, i) => (
            <button key={i}
              onClick={() => { navigate(item.path); onClose(); }}
              style={{ width:"100%", background:"none", border:"none", padding:"14px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", textAlign:"right", fontFamily:"Arial,sans-serif", borderBottom:"1px solid #F9FAFB" }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"#F9FAFB", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {item.icon}
              </div>
              <span style={{ flex:1, fontSize:14, fontWeight:600, color:"#6B7280" }}>{item.label}</span>
              <span style={{ color:"#D1D5DB", fontSize:16 }}>‹</span>
            </button>
          ))}
        </div>

        {/* Admin button — bottom */}
        <div style={{ padding:"16px 20px", paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 20px)", borderTop:"1px solid #F3F4F6", flexShrink:0 }}>
          <button
            onClick={() => { navigate("/admin"); onClose(); }}
            style={{ width:"100%", background:"linear-gradient(135deg,#111827,#1F2937)", color:"white", border:"none", borderRadius:16, padding:"14px", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"Arial,sans-serif" }}>
            <IcoShield s={18} c="#F87171" /> ניהול המערכת
          </button>
          <div style={{ textAlign:"center", fontSize:10, color:"#9CA3AF", marginTop:10 }}>גרסה 1.0.0</div>
        </div>
      </div>
    </>
  );
}

// ── Horizontal row ────────────────────────────────
function HorizRow({ title, items, renderCard, onSeeAll, titleIcon }) {
  return (
    <div style={{ marginBottom:24 }}>
      {title && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 16px", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {titleIcon || <IcoFire s={15} />}
            <span style={{ fontSize:16, fontWeight:900, color:C.dark }}>{title}</span>
          </div>
          {onSeeAll && <span onClick={onSeeAll} style={{ fontSize:12, color:C.red, fontWeight:700, cursor:"pointer" }}>הכל ←</span>}
        </div>
      )}
      <div style={{
        display:"flex", gap:12,
        overflowX:"auto", overflowY:"visible",
        /* Fix: scrollable padding so first+last cards don't get clipped */
        paddingTop:4, paddingBottom:12,
        paddingInlineStart:16, paddingInlineEnd:16,
        scrollbarWidth:"none", WebkitOverflowScrolling:"touch",
      }}>
        {items.map((item, i) => renderCard(item, i))}
      </div>
    </div>
  );
}

// ── Restaurant card horizontal ────────────────────
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
        cursor: r.active?"pointer":"default", opacity: r.active?1:0.6,
        boxShadow: pressed?"0 2px 8px rgba(0,0,0,0.1)":"0 4px 16px rgba(0,0,0,0.08)",
        transform: pressed?"scale(0.96)":"scale(1)",
        transition:"transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
        animation:`fadeIn 0.4s ease ${delay}ms both`,
      }}
    >
      <div style={{ height:110, background:`linear-gradient(135deg,${hexA(r.cover_color||"#C8102E","33")},${hexA(r.cover_color||"#C8102E","55")})`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <span style={{ fontSize:52 }}><span style={{fontSize:20}}>🍽️</span></span>
        {!r.active && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontSize:11, fontWeight:700, background:"rgba(0,0,0,0.5)", padding:"3px 12px", borderRadius:20 }}>סגור כעת</span>
          </div>
        )}
        {r.badge && <span style={{ position:"absolute", top:8, right:8, background:C.green, color:"white", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>{r.badge}</span>}
        <div style={{ position:"absolute", bottom:8, left:8, display:"flex", alignItems:"center", gap:3, background:"rgba(0,0,0,0.45)", borderRadius:20, padding:"3px 8px" }}>
          <span style={{ fontSize:10 }}></span>
          <span style={{ fontSize:11, fontWeight:800, color:"white" }}>{r.rating||"4.5"}</span>
        </div>
      </div>
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

// ── Restaurant card vertical ──────────────────────
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
        cursor: r.active?"pointer":"default", opacity: r.active?1:0.6,
        boxShadow: pressed?"0 2px 8px rgba(0,0,0,0.08)":"0 4px 20px rgba(0,0,0,0.07)",
        transform: pressed?"scale(0.98)":"scale(1)",
        transition:"transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
        animation:`fadeIn 0.4s ease ${delay}ms both`,
      }}
    >
      <div style={{ height:130, background:`linear-gradient(135deg,${hexA(r.cover_color||"#C8102E","22")},${hexA(r.cover_color||"#C8102E","44")})`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <span style={{ fontSize:66 }}><span style={{fontSize:20}}>🍽️</span></span>
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
            <span style={{ fontSize:11 }}></span>
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

// ── MAIN ─────────────────────────────────────────
export default function HomePage({ user, guest, cartCount, selectedArea, onAreaSelect }) {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cat, setCat] = useState("all");
  const [banner, setBanner] = useState(0);
  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  useEffect(() => {
    cachedQuery("banners:all",
      () => supabase.from("banners").select("*").eq("active",true).order("sort_order"),
      TTL.banners
    ).then(({ data }) => { if (data?.length) setBanners(data); });
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ لو ما اختار منطقة — افتح صفحة الخريطة
  useEffect(() => {
    if (!selectedArea) {
      // نعطيه ثانية يشوف الصفحة قبل ما نبعتو للخريطة
      const t = setTimeout(() => navigate("/address"), 600);
      return () => clearTimeout(t);
    }
  }, [selectedArea]);

  useEffect(() => {
    const el = document.documentElement;
    if (sidebarOpen) {
      el.style.setProperty("overflow", "hidden");
    } else {
      el.style.removeProperty("overflow");
    }
    return () => el.style.removeProperty("overflow");
  }, [sidebarOpen]);


  useEffect(() => {
    const t = setInterval(() => setBanner(p => (p+1) % banners.length), 3800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    cachedQuery(
      "restaurants:" + (selectedArea?.id || "all"),
      () => supabase.from("restaurants").select("*").eq("active",true),
      TTL.restaurants
    ).then(({ data }) => { setRestaurants(data||[]); setLoading(false); });
  }, []);

  const filtered = restaurants.filter(r => {
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return r.name?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q);
    }
    return matchesCat(r, cat);
  });

  const catGroups = CATS.filter(c => c.id !== "all").map(c => ({
    ...c, items: restaurants.filter(r => matchesCat(r, c.id))
  })).filter(g => g.items.length > 0);

  return (
    <div style={{ fontFamily:"Arial,sans-serif", background:C.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", paddingBottom:"calc(80px + env(safe-area-inset-bottom, 0px))", paddingTop:160 }}>

      {/* SIDEBAR */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} navigate={navigate} />

      {/* FIXED HEADER: TopBar + Tabs */}
      <div className="app-header">

        {/* TOP BAR */}
        <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
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
              <div onClick={() => navigate("/address")} style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:C.bg, borderRadius:24, padding:"7px 14px", cursor:"pointer" }}>
                <IcoHome s={18} c={C.red} />
                <div style={{ flex:1, textAlign:"right" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.dark }}>{selectedArea ? selectedArea.short : "בחר אזור"}</div>
                  <div style={{ fontSize:10, color:selectedArea ? "#16a34a" : C.gray }}>{selectedArea ? "לחץ לשינוי" : "לחץ לבחור אזור משלוח"}</div>
                </div>
                <IcoChevDown />
              </div>
              <button onClick={() => setSidebarOpen(true)}
                style={{ background:C.bg, border:"none", borderRadius:12, width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IcoHamburger c={C.dark} />
              </button>
            </>
          )}
        </div>

        {/* TABS */}
        <div style={{ display:"flex", borderBottom:"1px solid "+C.lightGray }}>
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

      </div>

      {/* BANNER */}
      {!searchQ && (
        <div style={{ padding:"14px 16px 8px" }}>
          <div style={{ borderRadius:22, overflow:"hidden", position:"relative", height:165 }}>
            <div style={{ display:"flex", transition:"transform .55s cubic-bezier(0.4,0,0.2,1)", transform:`translateX(${banner*100}%)` }}>
              {banners.map(b => (
                <div key={b.id} style={{ minWidth:"100%", height:165, background:b.bg, display:"flex", flexDirection:"column", justifyContent:"center", padding:"22px 24px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", right:-30, top:-30, width:150, height:150, background:"rgba(255,255,255,0.05)", borderRadius:"50%" }} />
                  <div style={{ position:"absolute", left:20, bottom:10, opacity:0.1 }}><YougoLogo size={80} white /></div>
                  <span style={{ color:"rgba(255,255,220,0.9)", fontSize:11, fontWeight:700, marginBottom:4, background:"rgba(255,255,255,0.1)", alignSelf:"flex-start", borderRadius:20, padding:"2px 10px" }}>{b.tag}</span>
                  <div style={{ color:"white", fontSize:24, fontWeight:900, lineHeight:1.15 }}>{b.title}</div>
                  <div style={{ color:"rgba(255,255,255,0.85)", fontSize:15, fontWeight:600, marginTop:3 }}>{b.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5 }}>
              {banners.map((_,i) => (
                <div key={i} onClick={() => setBanner(i)} style={{ width:i===banner?22:7, height:7, borderRadius:3.5, background:i===banner?"white":"rgba(255,255,255,0.4)", transition:"all .3s", cursor:"pointer" }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY ICONS — equal size tiles */}
      {!searchQ && (
        <div style={{ padding:"4px 0 6px" }}>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingTop:4, paddingBottom:8, paddingInlineStart:16, paddingInlineEnd:16, scrollbarWidth:"none" }}>
            {CATS.map(c => {
              const active = cat === c.id;
              return (
                <button key={c.id} onClick={() => setCat(c.id)}
                  style={{
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5,
                    width:72, height:80, flexShrink:0,
                    background: active ? c.bg : "white",
                    border: active ? "none" : "1.5px solid #F3F4F6",
                    borderRadius:18, cursor:"pointer",
                    boxShadow: active ? `0 6px 18px ${c.bg}55` : "0 1px 6px rgba(0,0,0,0.05)",
                    transform: active ? "scale(1.07)" : "scale(1)",
                    transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                  }}>
                  <c.Cmp active={active} />
                  <span style={{ fontSize:10, fontWeight:700, color: active ? "white" : C.dark, whiteSpace:"nowrap" }}>{c.label}</span>
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
        <div style={{ padding:"8px 16px" }}>
          <div style={{ fontSize:13, color:C.gray, marginBottom:12 }}>תוצאות: {searchQ} ({filtered.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {filtered.length===0
              ? <div style={{ textAlign:"center", padding:"50px 0", color:C.gray }}><div style={{ fontSize:40 }}>🔍</div><div style={{ fontSize:14, fontWeight:600, marginTop:10 }}>לא נמצאו תוצאות</div></div>
              : filtered.map((r,i) => <RestCardV key={r.id} r={r} onClick={() => navigate("/restaurant/"+r.id, { state:r })} delay={i*60} />)
            }
          </div>
        </div>
      ) : cat !== "all" ? (
        <div style={{ padding:"8px 16px" }}>
          <div style={{ fontSize:16, fontWeight:900, color:C.dark, marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
            <IcoFire s={15} />{CATS.find(c=>c.id===cat)?.label} ({filtered.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {filtered.length===0
              ? <div style={{ textAlign:"center", padding:"50px 0", color:C.gray }}><div style={{ fontSize:40 }}>🍽️</div><div style={{ fontSize:14, fontWeight:600, marginTop:10 }}>אין מסעדות בקטגוריה זו</div></div>
              : filtered.map((r,i) => <RestCardV key={r.id} r={r} onClick={() => navigate("/restaurant/"+r.id, { state:r })} delay={i*60} />)
            }
          </div>
        </div>
      ) : (
        <>
          {restaurants.length>0 && (
            <HorizRow title="🔥 הכי פופולרי" items={restaurants.slice(0,8)} seeAll
              renderCard={(r,i) => <RestCardH key={r.id} r={r} delay={i*50} onClick={() => navigate("/restaurant/"+r.id, { state:r })} />}
            />
          )}
          {catGroups.map(g => (
            <HorizRow key={g.id} title={g.label} items={g.items} onSeeAll={() => setCat(g.id)}
              renderCard={(r,i) => <RestCardH key={r.id} r={r} delay={i*50} onClick={() => navigate("/restaurant/"+r.id, { state:r })} />}
            />
          ))}
          {restaurants.length===0 && (
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
    </div>
  );
}

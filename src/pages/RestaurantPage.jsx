// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RestaurantPage.jsx — Menu + Cart controls
//  ✅ Fixed: available (not is_available)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { C, IcoBack, IcoCart, IcoClock, IcoStar, IcoTruck, IcoPlus, IcoMinus, IcoFire } from "../components/Icons";
import { supabase } from "../lib/supabase";

export default function RestaurantPage({ cart, add, rem, cartCount, cartTotal }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state: rest } = useLocation();
  const [menu, setMenu] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("menu_items").select("*").eq("restaurant_id", id).eq("available", true) // ✅ was: is_available
      .order("sort_order")
      .then(({ data }) => { setMenu(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const sections = [...new Set(menu.map(m => m.category).filter(Boolean))];
  const cartItems = cart.filter(c => c.rid === id);
  const cartRestTotal = cartItems.reduce((s, c) => s + c.price * c.qty, 0);

  function getQty(itemId) {
    return cart.find(c => c.id === itemId && c.rid === id)?.qty || 0;
  }

  const r = rest || { name: "מסעדה", rating: 5.0, delivery_time: 25, delivery_fee: 10, min_order: 30, logo_emoji: "🍽️", category: "אוכל" };

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: cartItems.length > 0 ? 100 : 20 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "44px 20px 65px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <IcoBack s={18} c="white" />
          </button>
          <button onClick={() => navigate("/cart")} style={{ position: "relative", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <IcoCart s={18} c="white" />
            {cartCount > 0 && <span style={{ position: "absolute", top: -2, left: -2, background: C.gold, color: C.dark, fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
          </button>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: r.cover_color || "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            {r.logo_emoji || r.image || "🍽️"}
          </div>
          <div>
            <div style={{ color: "white", fontSize: 22, fontWeight: 900 }}>{r.name}</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 }}>{r.category}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                ⭐ {r.rating}
              </span>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                <IcoClock s={11} c="rgba(255,255,255,0.9)" /> {r.delivery_time} דק׳
              </span>
              <span style={{ color: r.delivery_fee === 0 ? "#86efac" : "rgba(255,255,255,0.9)", fontSize: 12 }}>
                {r.delivery_fee === 0 ? "🟢 משלוח חינם" : `₪${r.delivery_fee} משלוח`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      {sections.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 16px 8px", scrollbarWidth: "none" }}>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(activeSection === s ? null : s)}
              style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "none", background: activeSection === s ? C.red : "white", color: activeSection === s ? "white" : C.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", fontFamily: "Arial,sans-serif" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Menu */}
      <div style={{ padding: "0 16px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: C.gray }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid " + C.lightGray, borderTopColor: C.red, animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
            טוען תפריט...
          </div>
        ) : menu.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: C.gray }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.dark }}>אין פריטים בתפריט</div>
          </div>
        ) : (
          sections.filter(s => !activeSection || s === activeSection).map(section => (
            <div key={section}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginTop: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <IcoFire s={14} /> {section}
              </div>
              {menu.filter(m => m.category === section).map(item => {
                const qty = getQty(item.id);
                return (
                  <div key={item.id} style={{ background: "white", borderRadius: 16, padding: "14px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 58, height: 58, borderRadius: 12, background: C.ultra, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0 }}>
                      {item.is_hot ? "🌶️" : "🍽️"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{item.name}</div>
                      {item.description && <div style={{ fontSize: 12, color: C.gray, marginTop: 2, lineHeight: 1.4 }}>{item.description}</div>}
                      <div style={{ fontSize: 15, fontWeight: 900, color: C.red, marginTop: 6 }}>₪{item.price}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {qty > 0 ? (
                        <>
                          <button onClick={() => rem(item.id, id)}
                            style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid " + C.lightGray, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <IcoMinus s={13} c={C.dark} />
                          </button>
                          <span style={{ fontSize: 15, fontWeight: 900, color: C.dark, minWidth: 18, textAlign: "center" }}>{qty}</span>
                        </>
                      ) : null}
                      <button onClick={() => add(item, r)}
                        style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(200,16,46,0.35)" }}>
                        <IcoPlus s={16} c="white" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Cart bar */}
      {cartItems.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "12px 16px 20px", background: "white", boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" }}>
          <button onClick={() => navigate("/cart")}
            style={{ width: "100%", background: C.red, color: "white", border: "none", borderRadius: 16, padding: "15px 20px", fontSize: 15, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 16px rgba(200,16,46,0.35)" }}>
            <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 10px", fontSize: 13 }}>{cartItems.reduce((s, c) => s + c.qty, 0)}</span>
            <span>מעבר לעגלה</span>
            <span>₪{cartRestTotal}</span>
          </button>
        </div>
      )}

      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{display:none}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

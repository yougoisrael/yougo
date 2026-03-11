import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { C, IcoBack, IcoCart, IcoPlus, IcoMinus, IcoFire, IcoPin, IcoCheck } from "../components/Icons";
import { supabase } from "../lib/supabase";

// ── CSS ────────────────────────────────────────────
const CSS = `
  *{box-sizing:border-box}
  ::-webkit-scrollbar{display:none}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes sheetUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
`;

// ── Emoji placeholder per category ─────────────────
function categoryEmoji(cat, isHot) {
  if (isHot) return "🌶️";
  const map = {
    "בורגר": "🍔", "שווארמה": "🌯", "פיצה": "🍕", "סושי": "🍱",
    "עוף": "🍗", "מנות": "🍲", "סלטים": "🥗", "שתייה": "🥤",
    "קינוחים": "🍰", "תוספות": "🍟", "מרקים": "🍜", "מאקי": "🍣",
    "ניגירי": "🍣", "סנדוויצ׳ים": "🥪", "מנות עיקריות": "🍛",
  };
  return map[cat] || "🍽️";
}

// ── Item Popup ──────────────────────────────────────
function ItemPopup({ item, qty, onAdd, onRem, onClose, restaurantName }) {
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [step, setStep] = useState(1); // 1=details, 2=extras
  const extras = Array.isArray(item.extras) ? item.extras : [];
  const hasExtras = extras.length > 0;

  function toggleExtra(ex) {
    setSelectedExtras(prev =>
      prev.includes(ex) ? prev.filter(e => e !== ex) : [...prev, ex]
    );
  }

  function handleAdd() {
    onAdd(item, selectedExtras);
    onClose();
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        zIndex: 600, animation: "fadeIn 0.2s ease",
      }} />

      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: "white",
        borderRadius: "24px 24px 0 0", zIndex: 601,
        animation: "sheetUp 0.35s cubic-bezier(0.34,1.1,0.64,1)",
        maxHeight: "88vh", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E5E7EB" }} />
        </div>

        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 14, left: 14,
          background: "#F3F4F6", border: "none", borderRadius: "50%",
          width: 34, height: 34, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", zIndex: 2,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Image */}
          <div style={{
            height: 220, background: item.image_url
              ? "transparent"
              : `linear-gradient(135deg, ${C.bg} 0%, #E5E7EB 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
          }}>
            {item.image_url ? (
              <img src={item.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={item.name} />
            ) : (
              <span style={{ fontSize: 88 }}>{categoryEmoji(item.category, item.is_hot)}</span>
            )}
            {item.is_hot && (
              <div style={{
                position: "absolute", top: 14, right: 14,
                background: "#FEF2F2", color: "#EF4444",
                fontSize: 11, fontWeight: 800, padding: "4px 12px",
                borderRadius: 20, display: "flex", alignItems: "center", gap: 4,
              }}>🌶️ חריף</div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: "18px 20px 8px", direction: "rtl" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 6 }}>{item.name}</div>
            {item.description && (
              <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 10 }}>{item.description}</div>
            )}
            <div style={{ fontSize: 22, fontWeight: 900, color: C.red }}>₪{item.price}</div>
          </div>

          {/* Extras */}
          {hasExtras && (
            <div style={{ padding: "8px 20px 20px", direction: "rtl" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 12 }}>
                🍴 הוסף תוספות
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {extras.map((ex, i) => {
                  const selected = selectedExtras.includes(ex.name || ex);
                  const name = ex.name || ex;
                  const price = ex.price || 0;
                  return (
                    <button key={i} onClick={() => toggleExtra(name)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", borderRadius: 14,
                        border: `2px solid ${selected ? C.red : "#F3F4F6"}`,
                        background: selected ? "rgba(200,16,46,0.04)" : "white",
                        cursor: "pointer", transition: "all 0.15s", fontFamily: "Arial,sans-serif",
                      }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6,
                          border: `2px solid ${selected ? C.red : "#D1D5DB"}`,
                          background: selected ? C.red : "white",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s", flexShrink: 0,
                        }}>
                          {selected && <IcoCheck s={12} c="white" />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{name}</span>
                      </div>
                      {price > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>+₪{price}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ height: 16 }} />
        </div>

        {/* Add button */}
        <div style={{ padding: "12px 20px 32px", borderTop: "1px solid #F3F4F6", background: "white" }}>
          {qty > 0 ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={() => { onRem(); onClose(); }}
                style={{ width: 50, height: 50, borderRadius: 16, border: "2px solid #F3F4F6", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <IcoMinus s={18} c={C.dark} />
              </button>
              <button onClick={handleAdd}
                style={{ flex: 1, background: C.red, color: "white", border: "none", borderRadius: 16, padding: "14px", fontSize: 15, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 6px 20px rgba(200,16,46,0.35)", fontFamily: "Arial,sans-serif" }}>
                <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 10px", fontSize: 13 }}>{qty}</span>
                <span>הוסף לעגלה</span>
                <span>₪{item.price}</span>
              </button>
            </div>
          ) : (
            <button onClick={handleAdd}
              style={{ width: "100%", background: C.red, color: "white", border: "none", borderRadius: 16, padding: "15px", fontSize: 15, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 6px 20px rgba(200,16,46,0.35)", fontFamily: "Arial,sans-serif" }}>
              <IcoPlus s={18} c="white" />
              <span>הוסף לעגלה</span>
              <span>₪{item.price}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Menu Item Card ──────────────────────────────────
function MenuCard({ item, qty, onOpen, onAdd, onRem, delay }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onClick={onOpen}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: "white", borderRadius: 20, marginBottom: 12,
        boxShadow: pressed ? "0 1px 6px rgba(0,0,0,0.06)" : "0 3px 16px rgba(0,0,0,0.07)",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease",
        animation: `slideUp 0.35s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms both`,
        cursor: "pointer", overflow: "hidden",
        display: "flex", direction: "rtl",
      }}
    >
      {/* Info */}
      <div style={{ flex: 1, padding: "14px 14px 14px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>{item.name}</span>
            {item.is_hot && <span style={{ fontSize: 9, background: "#FEF2F2", color: "#EF4444", borderRadius: 8, padding: "1px 6px", fontWeight: 700, flexShrink: 0 }}>🌶️</span>}
          </div>
          {item.description && (
            <div style={{
              fontSize: 11, color: "#9CA3AF", lineHeight: 1.5, marginBottom: 8,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {item.description}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: C.red }}>₪{item.price}</span>

          {/* Add button */}
          <div onClick={e => { e.stopPropagation(); }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {qty > 0 && (
              <>
                <button onClick={e => { e.stopPropagation(); onRem(); }}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #F3F4F6", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <IcoMinus s={11} c={C.dark} />
                </button>
                <span style={{ fontSize: 14, fontWeight: 900, color: C.dark, minWidth: 16, textAlign: "center" }}>{qty}</span>
              </>
            )}
            <button onClick={e => { e.stopPropagation(); onAdd(); }}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 3px 10px rgba(200,16,46,0.3)" }}>
              <IcoPlus s={15} c="white" />
            </button>
          </div>
        </div>
      </div>

      {/* Image */}
      <div style={{
        width: 110, height: 110, flexShrink: 0,
        background: item.image_url ? "transparent" : `linear-gradient(135deg, ${C.bg}, #E5E7EB)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {item.image_url ? (
          <img src={item.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={item.name} />
        ) : (
          <span style={{ fontSize: 52 }}>{categoryEmoji(item.category, item.is_hot)}</span>
        )}
        {qty > 0 && (
          <div style={{
            position: "absolute", top: 6, right: 6,
            background: C.red, color: "white",
            width: 20, height: 20, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 900,
          }}>{qty}</div>
        )}
      </div>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────
export default function RestaurantPage({ cart, add, rem, cartCount, setCart }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state: rest } = useLocation();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const r = rest || { name: "מסעדה", rating: 5.0, delivery_time: 25, delivery_fee: 10, min_order: 30, logo_emoji: "🍽️", category: "אוכל" };

  useEffect(() => {
    supabase.from("menu_items").select("*")
      .eq("restaurant_id", id).eq("available", true)
      .order("sort_order")
      .then(({ data }) => { setMenu(data || []); setLoading(false); });
  }, [id]);

  const sections = [...new Set(menu.map(m => m.category).filter(Boolean))];
  const cartItems = cart.filter(c => c.rid === id);
  const cartTotal = cartItems.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount2 = cartItems.reduce((s, c) => s + c.qty, 0);

  function getQty(itemId) {
    return cart.find(c => c.id === itemId && c.rid === id)?.qty || 0;
  }

  const coverBg = r.cover_color
    ? `linear-gradient(160deg, ${r.cover_color}99, ${r.cover_color}ee)`
    : "linear-gradient(160deg,#C8102E,#7B0D1E)";

  const visibleSections = sections.filter(s => !activeSection || s === activeSection);

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: cartItems.length > 0 ? 110 : 30 }}>

      {/* ── HERO ── */}
      <div style={{ background: coverBg, minHeight: 230, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.05)", top: -80, right: -60 }} />

        {/* Topbar */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "48px 20px 0", position: "relative", zIndex: 2 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <IcoBack s={18} c="white" />
          </button>
          <button onClick={() => navigate("/cart")}
            style={{ position: "relative", background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <IcoCart s={18} c="white" />
            {cartCount > 0 && <span style={{ position: "absolute", top: -2, left: -2, background: "#F59E0B", color: "#111", fontSize: 9, fontWeight: 900, width: 17, height: 17, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
          </button>
        </div>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 48px", position: "relative", zIndex: 2 }}>
          <div style={{ width: 86, height: 86, borderRadius: 24, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, marginBottom: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            {r.logo_emoji || "🍽️"}
          </div>
          <div style={{ color: "white", fontSize: 24, fontWeight: 900 }}>{r.name}</div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <IcoPin s={10} c="rgba(255,255,255,0.7)" />{r.location || r.category || ""}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 40, background: C.bg, borderRadius: "50% 50% 0 0" }} />
      </div>

      {/* ── INFO ROW ── */}
      <div style={{ padding: "0 16px", marginTop: -10, marginBottom: 14, position: "relative", zIndex: 3 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "14px 10px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-around" }}>
          {[
            { icon: "⭐", top: r.rating || "4.5", bottom: "דירוג", color: "#B45309" },
            { icon: "🕐", top: (r.delivery_time || "25") + " דק'", bottom: "משלוח", color: C.dark },
            { icon: "🛵", top: r.delivery_fee === 0 ? "חינם" : "₪" + (r.delivery_fee || 12), bottom: "עלות", color: r.delivery_fee === 0 ? "#10B981" : C.dark },
            { icon: "🛒", top: "₪" + (r.min_order || 40), bottom: "מינימום", color: C.dark },
          ].map((x, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 18 }}>{x.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: x.color }}>{x.top}</span>
              <span style={{ fontSize: 9, color: "#9CA3AF" }}>{x.bottom}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      {sections.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 14px", scrollbarWidth: "none" }}>
          <button onClick={() => setActiveSection(null)}
            style={{ flexShrink: 0, padding: "8px 18px", borderRadius: 20, border: "none", background: !activeSection ? C.red : "white", color: !activeSection ? "white" : "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: !activeSection ? "0 3px 12px rgba(200,16,46,0.25)" : "0 1px 4px rgba(0,0,0,0.08)", fontFamily: "Arial,sans-serif" }}>
            הכל
          </button>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(activeSection === s ? null : s)}
              style={{ flexShrink: 0, padding: "8px 18px", borderRadius: 20, border: "none", background: activeSection === s ? C.red : "white", color: activeSection === s ? "white" : "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: activeSection === s ? "0 3px 12px rgba(200,16,46,0.25)" : "0 1px 4px rgba(0,0,0,0.08)", fontFamily: "Arial,sans-serif" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── MENU ── */}
      <div style={{ padding: "0 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 50, color: "#9CA3AF" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E5E7EB", borderTopColor: C.red, animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
            טוען תפריט...
          </div>
        ) : menu.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🍽️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>אין פריטים בתפריט</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>נוסיף בקרוב!</div>
          </div>
        ) : (
          visibleSections.map(section => (
            <div key={section}>
              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 10px" }}>
                <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "white", borderRadius: 20, padding: "5px 14px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                  <IcoFire s={12} />
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>{section}</span>
                </div>
                <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
              </div>

              {menu.filter(m => m.category === section).map((item, idx) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  qty={getQty(item.id)}
                  onOpen={() => setSelectedItem(item)}
                  onAdd={() => add(item, r)}
                  onRem={() => rem(item.id, id)}
                  delay={idx * 40}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* ── CART BAR ── */}
      {cartItems.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "12px 16px 28px", background: "white", boxShadow: "0 -4px 24px rgba(0,0,0,0.1)", zIndex: 100, animation: "slideUp 0.3s ease" }}>
          <button onClick={() => navigate("/cart")}
            style={{ width: "100%", background: C.red, color: "white", border: "none", borderRadius: 18, padding: "15px 20px", fontSize: 15, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 6px 20px rgba(200,16,46,0.35)", fontFamily: "Arial,sans-serif" }}>
            <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 10px", fontSize: 13 }}>{cartCount2}</span>
            <span>מעבר לעגלה</span>
            <span>₪{cartTotal}</span>
          </button>
        </div>
      )}

      {/* ── ITEM POPUP ── */}
      {selectedItem && (
        <ItemPopup
          item={selectedItem}
          qty={getQty(selectedItem.id)}
          onAdd={(item) => add(item, r)}
          onRem={() => rem(selectedItem.id, id)}
          onClose={() => setSelectedItem(null)}
          restaurantName={r.name}
        />
      )}

      <style>{CSS}</style>
    </div>
  );
}

import { useState, useEffect } from "react";
import BottomSheet from "../components/BottomSheet";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { C, IcoBack, IcoCart, IcoPlus, IcoMinus, IcoFire, IcoPin, IcoCheck, IcoBurger, IcoShawarma, IcoPizza, IcoSushi, IcoChicken, IcoSalad, IcoDrink, IcoDessert, IcoFries, IcoNoodles, IcoSandwich, IcoPlate, IcoHot } from "../components/Icons";
import { supabase } from "../lib/supabase";

const CSS = `
  *{box-sizing:border-box}
  ::-webkit-scrollbar{display:none}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
`;

function hexA(hex, alpha) {
  try {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${parseInt(alpha,16)/255})`;
  } catch { return hex; }
}

function CategoryIcon({ cat, isHot, s=26, c="#111827" }) {
  if (isHot) return <IcoHot s={s} c="#EF4444"/>;
  const map = {
    "בורגר":<IcoBurger s={s} c={c}/>, "שווארמה":<IcoShawarma s={s} c={c}/>,
    "פיצה":<IcoPizza s={s} c={c}/>, "סושי":<IcoSushi s={s} c={c}/>,
    "עוף":<IcoChicken s={s} c={c}/>, "מנות":<IcoPlate s={s} c={c}/>,
    "סלטים":<IcoSalad s={s} c={c}/>, "שתייה":<IcoDrink s={s} c={c}/>,
    "קינוחים":<IcoDessert s={s} c={c}/>, "תוספות":<IcoFries s={s} c={c}/>,
    "מרקים":<IcoNoodles s={s} c={c}/>, "מאקי":<IcoSushi s={s} c={c}/>,
    "ניגירי":<IcoSushi s={s} c={c}/>, "סנדוויצ׳ים":<IcoSandwich s={s} c={c}/>,
    "מנות עיקריות":<IcoPlate s={s} c={c}/>,
  };
  return map[cat] || <IcoPlate s={s} c={c}/>;
}
function categoryEmoji(cat, isHot) { return cat; } // legacy compat

// ── Item Popup (Bottom Sheet) ───────────────────────
function ItemPopup({ item, qty, onAdd, onRem, onClose }) {
  const [selectedExtras, setSelectedExtras] = useState([]);
  const extras = Array.isArray(item.extras) ? item.extras : [];

  function toggleExtra(name) {
    setSelectedExtras(p => p.includes(name) ? p.filter(e => e !== name) : [...p, name]);
  }

  function handleAdd() { onAdd(); onClose(); }

  const coverColor = item.cover_color || "#C8102E";

  return (
    <BottomSheet open={true} onClose={onClose} maxHeight="85vh" zIndex={600}>
      <div style={{ position:"relative" }}>
        <button onClick={onClose} style={{
          position:"absolute", top:2, left:14,
          background:"rgba(0,0,0,0.06)", border:"none", borderRadius:"50%",
          width:32, height:32, display:"flex", alignItems:"center",
          justifyContent:"center", cursor:"pointer", zIndex:2,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>

          {/* Image / Emoji */}
          <div style={{
            height:200, flexShrink:0,
            background: item.image_url ? "transparent"
              : `linear-gradient(135deg,${hexA(coverColor,"22")},${hexA(coverColor,"44")})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            position:"relative", overflow:"hidden",
          }}>
            {item.image_url
              ? <img src={item.image_url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={item.name}/>
              : <CategoryIcon cat={item.category} isHot={item.is_hot} s={90} c={coverColor}/>
            }
            {item.is_hot && (
              <div style={{ position:"absolute", top:12, right:12, background:"#FEF2F2", color:"#EF4444", fontSize:11, fontWeight:800, padding:"4px 12px", borderRadius:20, display:"flex", alignItems:"center", gap:4 }}>
                <IcoHot s={12} c="#EF4444"/> חריף
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding:"16px 20px 8px", direction:"rtl" }}>
            <div style={{ fontSize:20, fontWeight:900, color:"#111827", marginBottom:5 }}>{item.name}</div>
            {item.description && (
              <div style={{ fontSize:13, color:"#6B7280", lineHeight:1.6, marginBottom:10 }}>{item.description}</div>
            )}
            <div style={{ fontSize:22, fontWeight:900, color:C.red }}>₪{item.price}</div>
          </div>

          {/* Extras */}
          {extras.length > 0 && (
            <div style={{ padding:"4px 20px 16px", direction:"rtl" }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#111827", marginBottom:10 }}>🍴 תוספות</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {extras.map((ex, i) => {
                  const name = ex.name || ex;
                  const price = ex.price || 0;
                  const sel = selectedExtras.includes(name);
                  return (
                    <button key={i} onClick={() => toggleExtra(name)} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"11px 14px", borderRadius:14,
                      border:`2px solid ${sel ? C.red : "#F3F4F6"}`,
                      background: sel ? "rgba(200,16,46,0.04)" : "white",
                      cursor:"pointer", fontFamily:"Arial,sans-serif",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{
                          width:20, height:20, borderRadius:6,
                          border:`2px solid ${sel ? C.red : "#D1D5DB"}`,
                          background: sel ? C.red : "white",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          flexShrink:0,
                        }}>
                          {sel && <IcoCheck s={11} c="white"/>}
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{name}</span>
                      </div>
                      {price > 0 && <span style={{ fontSize:12, fontWeight:700, color:C.red }}>+₪{price}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ height:12 }}/>
        </div>

        {/* Add Button */}
        <div style={{ padding:"12px 20px 32px", borderTop:"1px solid #F9FAFB", background:"white", flexShrink:0 }}>
          {qty > 0 ? (
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button onClick={() => { onRem(); onClose(); }} style={{
                width:50, height:50, borderRadius:16, border:"2px solid #F3F4F6",
                background:"white", display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer", flexShrink:0,
              }}>
                <IcoMinus s={18} c={C.dark}/>
              </button>
              <button onClick={handleAdd} style={{
                flex:1, background:C.red, color:"white", border:"none", borderRadius:16,
                padding:"14px", fontSize:15, fontWeight:900, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                boxShadow:"0 6px 20px rgba(200,16,46,0.3)", fontFamily:"Arial,sans-serif",
              }}>
                <span style={{ background:"rgba(255,255,255,0.2)", borderRadius:10, padding:"2px 10px", fontSize:13 }}>{qty}</span>
                <span>הוסף לעגלה</span>
                <span>₪{item.price}</span>
              </button>
            </div>
          ) : (
            <button onClick={handleAdd} style={{
              width:"100%", background:C.red, color:"white", border:"none", borderRadius:16,
              padding:"15px 20px", fontSize:15, fontWeight:900, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              boxShadow:"0 6px 20px rgba(200,16,46,0.3)", fontFamily:"Arial,sans-serif",
            }}>
              <IcoPlus s={18} c="white"/>
              <span>הוסף לעגלה</span>
              <span>₪{item.price}</span>
            </button>
          )}
        </div>
    </BottomSheet>
  );
}

// ── Menu Item Card (2-column grid, same style as restaurant card) ──
function MenuCard({ item, qty, onOpen, onQuickAdd, onRem, delay, coverColor }) {
  const [pressed, setPressed] = useState(false);
  
  const bg = item.cover_color || coverColor || "#C8102E";

  return (
    <div
      onClick={onOpen}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background:"white", borderRadius:20, overflow:"hidden",
        cursor:"pointer", width:"100%",
        boxShadow: pressed ? "0 2px 8px rgba(0,0,0,0.07)" : "0 4px 18px rgba(0,0,0,0.07)",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:"transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease",
        animation:`slideUp 0.35s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms both`,
      }}
    >
      {/* Image / emoji area */}
      <div style={{
        height:110,
        background: item.image_url ? "transparent"
          : `linear-gradient(135deg,${hexA(bg,"22")},${hexA(bg,"44")})`,
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative", overflow:"hidden",
      }}>
        {item.image_url
          ? <img src={item.image_url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={item.name}/>
          : <CategoryIcon cat={item.category} isHot={item.is_hot} s={52} c={bg}/>
        }
        {item.is_hot && (
          <div style={{ position:"absolute", top:7, right:7, background:"#FEF2F2", color:"#EF4444", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20, display:"flex", alignItems:"center", gap:2 }}><IcoHot s={10} c="#EF4444"/></div>
        )}
        {qty > 0 && (
          <div style={{ position:"absolute", top:7, left:7, background:C.red, color:"white", width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900 }}>{qty}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"10px 12px 12px", direction:"rtl" }}>
        <div style={{ fontWeight:900, fontSize:13, color:"#111827", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</div>
        {item.description && (
          <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:6, lineHeight:1.4,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {item.description}
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:4 }}>
          <span style={{ fontSize:15, fontWeight:900, color:C.red }}>₪{item.price}</span>
          {/* Quick add button */}
          <div onClick={e => { e.stopPropagation(); }} style={{ display:"flex", alignItems:"center", gap:5 }}>
            {qty > 0 && (
              <>
                <button onClick={e => { e.stopPropagation(); onRem(); }} style={{
                  width:26, height:26, borderRadius:"50%", border:"2px solid #F3F4F6",
                  background:"white", display:"flex", alignItems:"center",
                  justifyContent:"center", cursor:"pointer",
                }}>
                  <IcoMinus s={10} c={C.dark}/>
                </button>
                <span style={{ fontSize:13, fontWeight:900, color:C.dark, minWidth:14, textAlign:"center" }}>{qty}</span>
              </>
            )}
            <button onClick={e => { e.stopPropagation(); onQuickAdd(); }} style={{
              width:32, height:32, borderRadius:"50%", border:"none",
              background:C.red, display:"flex", alignItems:"center",
              justifyContent:"center", cursor:"pointer",
              boxShadow:"0 3px 10px rgba(200,16,46,0.3)",
            }}>
              <IcoPlus s={14} c="white"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────
export default function RestaurantPage({ cart, add, rem, cartCount }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state: rest } = useLocation();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const r = rest || { name:"מסעדה", rating:5.0, delivery_time:25, delivery_fee:10, min_order:30, logo_emoji:"🍽️", category:"אוכל", cover_color:"#C8102E" };

  useEffect(() => {
    supabase.from("menu_items").select("*")
      .eq("restaurant_id", id).eq("available", true)
      .order("sort_order")
      .then(({ data }) => { setMenu(data || []); setLoading(false); });
  }, [id]);

  const sections = [...new Set(menu.map(m => m.category).filter(Boolean))];
  const cartItems = cart.filter(c => c.rid === id);
  const cartTotal = cartItems.reduce((s, c) => s + c.price * c.qty, 0);
  const cartQty   = cartItems.reduce((s, c) => s + c.qty, 0);

  function getQty(itemId) {
    return cart.find(c => c.id === itemId && c.rid === id)?.qty || 0;
  }

  const coverBg = r.cover_color
    ? `linear-gradient(160deg,${r.cover_color}99,${r.cover_color}ee)`
    : "linear-gradient(160deg,#C8102E,#7B0D1E)";

  return (
    <div style={{ fontFamily:"Arial,sans-serif", background:C.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", paddingBottom: cartItems.length > 0 ? 110 : 30 }}>

      {/* ── HERO ── */}
      <div style={{ background:coverBg, minHeight:220, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:260, height:260, borderRadius:"50%", background:"rgba(255,255,255,0.05)", top:-80, right:-60 }}/>

        <div style={{ display:"flex", justifyContent:"space-between", padding:"48px 20px 0", position:"relative", zIndex:2 }}>
          <button onClick={() => navigate(-1)} style={{ background:"rgba(0,0,0,0.25)", backdropFilter:"blur(8px)", border:"none", borderRadius:"50%", width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <IcoBack s={18} c="white"/>
          </button>
          <button onClick={() => navigate("/cart")} style={{ position:"relative", background:"rgba(0,0,0,0.25)", backdropFilter:"blur(8px)", border:"none", borderRadius:"50%", width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <IcoCart s={18} c="white"/>
            {cartCount > 0 && <span style={{ position:"absolute", top:-2, left:-2, background:"#F59E0B", color:"#111", fontSize:9, fontWeight:900, width:17, height:17, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>{cartCount}</span>}
          </button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"14px 0 44px", position:"relative", zIndex:2 }}>
          <div style={{ width:84, height:84, borderRadius:24, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", border:"2px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:48, marginBottom:10, boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
            <IcoPlate s={28} c={r.cover_color||C.red}/>
          </div>
          <div style={{ color:"white", fontSize:24, fontWeight:900 }}>{r.name}</div>
          <div style={{ color:"rgba(255,255,255,0.75)", fontSize:12, marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
            <IcoPin s={10} c="rgba(255,255,255,0.7)"/>{r.location||r.category||""}
          </div>
        </div>
        <div style={{ position:"absolute", bottom:-1, left:0, right:0, height:40, background:C.bg, borderRadius:"50% 50% 0 0" }}/>
      </div>

      {/* ── INFO ROW ── */}
      <div style={{ padding:"0 16px", marginTop:-10, marginBottom:14, position:"relative", zIndex:3 }}>
        <div style={{ background:"white", borderRadius:20, padding:"14px 10px", boxShadow:"0 4px 20px rgba(0,0,0,0.08)", display:"flex", justifyContent:"space-around" }}>
          {[
            { icon:"⭐", top:r.rating||"4.5", bottom:"דירוג", color:"#B45309" },
            { icon:"🕐", top:(r.delivery_time||"25")+" דק'", bottom:"משלוח", color:C.dark },
            { icon:"🛵", top:r.delivery_fee===0?"חינם":"₪"+(r.delivery_fee||12), bottom:"עלות", color:r.delivery_fee===0?"#10B981":C.dark },
            { icon:"🛒", top:"₪"+(r.min_order||40), bottom:"מינימום", color:C.dark },
          ].map((x,i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <span style={{ fontSize:18 }}>{x.icon}</span>
              <span style={{ fontSize:13, fontWeight:900, color:x.color }}>{x.top}</span>
              <span style={{ fontSize:9, color:"#9CA3AF" }}>{x.bottom}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      {sections.length > 1 && (
        <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 16px 14px", scrollbarWidth:"none" }}>
          <button onClick={() => setActiveSection(null)} style={{ flexShrink:0, padding:"8px 18px", borderRadius:20, border:"none", background:!activeSection?C.red:"white", color:!activeSection?"white":"#6B7280", fontSize:12, fontWeight:700, cursor:"pointer", boxShadow:!activeSection?"0 3px 12px rgba(200,16,46,0.25)":"0 1px 4px rgba(0,0,0,0.08)", fontFamily:"Arial,sans-serif" }}>
            הכל
          </button>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(activeSection===s?null:s)} style={{ flexShrink:0, padding:"8px 18px", borderRadius:20, border:"none", background:activeSection===s?C.red:"white", color:activeSection===s?"white":"#6B7280", fontSize:12, fontWeight:700, cursor:"pointer", boxShadow:activeSection===s?"0 3px 12px rgba(200,16,46,0.25)":"0 1px 4px rgba(0,0,0,0.08)", fontFamily:"Arial,sans-serif" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── MENU CAROUSELS — horizontal per section, no clipping ── */}
      <div style={{ paddingBottom:8 }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:50, color:"#9CA3AF" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E5E7EB", borderTopColor:C.red, animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
            טוען תפריט...
          </div>
        ) : menu.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#9CA3AF" }}>
            <div style={{ fontSize:56, marginBottom:12 }}>🍽️</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#111827" }}>אין פריטים בתפריט</div>
          </div>
        ) : (
          sections.filter(s => !activeSection || s === activeSection).map(section => {
            const items = menu.filter(m => m.category === section);
            return (
              <div key={section} style={{ marginBottom:28 }}>
                {/* Section header */}
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"16px 16px 12px" }}>
                  <div style={{ width:4, height:22, borderRadius:2, background:C.red }}/>
                  <span style={{ fontSize:16, fontWeight:900, color:"#111827" }}>
                    {categoryEmoji(section, false)} {section}
                  </span>
                  <span style={{ fontSize:12, color:"#9CA3AF", marginRight:"auto" }}>
                    {items.length} פריטים
                  </span>
                </div>
                {/* Horizontal carousel — paddingInline fixes clipping */}
                <div style={{
                  display:"flex", gap:12,
                  overflowX:"auto", overflowY:"visible",
                  paddingTop:4, paddingBottom:12,
                  paddingInlineStart:16, paddingInlineEnd:16,
                  scrollbarWidth:"none", WebkitOverflowScrolling:"touch",
                }}>
                  {items.map((item, idx) => (
                    <div key={item.id} style={{ flexShrink:0, width:160 }}>
                      <MenuCard
                        item={item}
                        qty={getQty(item.id)}
                        onOpen={() => setSelectedItem(item)}
                        onQuickAdd={() => add(item, r)}
                        onRem={() => rem(item.id, id)}
                        delay={idx * 40}
                        coverColor={r.cover_color}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── CART BAR ── */}
      {cartItems.length > 0 && (
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, padding:"12px 16px 28px", background:"white", boxShadow:"0 -4px 24px rgba(0,0,0,0.1)", zIndex:100 }}>
          <button onClick={() => navigate("/cart")} style={{ width:"100%", background:C.red, color:"white", border:"none", borderRadius:18, padding:"15px 20px", fontSize:15, fontWeight:900, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 6px 20px rgba(200,16,46,0.35)", fontFamily:"Arial,sans-serif" }}>
            <span style={{ background:"rgba(255,255,255,0.2)", borderRadius:10, padding:"2px 10px", fontSize:13 }}>{cartQty}</span>
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
          onAdd={() => add(selectedItem, r)}
          onRem={() => rem(selectedItem.id, id)}
          onClose={() => setSelectedItem(null)}
        />
      )}

      <style>{CSS}</style>
    </div>
  );
}

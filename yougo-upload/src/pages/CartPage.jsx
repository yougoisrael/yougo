// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CartPage.jsx — ✅ guest login wall on checkout
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect } from "react";
import GuestBanner from "../components/GuestBanner";
import { useNavigate } from "react-router-dom";
import { C, IcoBack, IcoPlus, IcoMinus, IcoClose, IcoCheck, IcoShield, IcoPin } from "../components/Icons";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

const FREE_DELIVERY_MIN = 150;
const PROMO_CODES = { "NAAT10": 0.10 };
const PAYMENT_MAP = { cash: "كاش", card: "بطاقة", bit: "Apple Pay" };

// Tracking steps
const STEPS = [
  { status: "جديد",        label: "ההזמנה התקבלה",  icon: "✅", delay: 0    },
  { status: "قيد التحضير", label: "בהכנה",            icon: "👨‍🍳", delay: 4000 },
  { status: "في الطريق",   label: "בדרך אליך",        icon: "🛵", delay: 12000 },
  { status: "مكتمل",       label: "הגיע!",             icon: "🎉", delay: 25000 },
];

function LoadSpinner({ size = 18, color = "white" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}

// ── Tracking Screen ────────────────────────────────
function TrackingScreen({ orderId, total, navigate }) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timers = STEPS.slice(1).map((s, i) =>
      setTimeout(() => setStepIdx(i + 1), s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const current = STEPS[stepIdx];

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: "linear-gradient(160deg,#C8102E,#7B0D1E)", minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, paddingBottom: 40 }}>

      {/* Big animated icon */}
      <div key={stepIdx} style={{ width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, marginBottom: 20, animation: "popIn .5s cubic-bezier(.34,1.56,.64,1)" }}>
        {current.icon}
      </div>

      <div style={{ color: "white", fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{current.label}</div>
      {orderId && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 32 }}>הזמנה #{String(orderId).slice(-6).toUpperCase()}</div>}

      {/* Progress steps */}
      <div style={{ display: "flex", gap: 0, alignItems: "center", marginBottom: 36, width: "80%" }}>
        {STEPS.map((s, i) => {
          const done = i <= stepIdx;
          const active = i === stepIdx;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: active ? 42 : 32, height: active ? 42 : 32,
                  borderRadius: "50%",
                  background: done ? "white" : "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: active ? 20 : 14,
                  transition: "all 0.4s",
                  boxShadow: active ? "0 0 0 6px rgba(255,255,255,0.2)" : "none",
                }}>
                  {done ? <span>{s.icon}</span> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />}
                </div>
                <div style={{ color: done ? "white" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: active ? 800 : 500, textAlign: "center", width: 60 }}>{s.label}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < stepIdx ? "white" : "rgba(255,255,255,0.2)", transition: "background 0.6s", margin: "0 4px", marginBottom: 20 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ETA */}
      {stepIdx < 3 && (
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: "14px 28px", marginBottom: 32, textAlign: "center" }}>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>זמן משלוח משוער</div>
          <div style={{ color: "white", fontSize: 22, fontWeight: 900, marginTop: 4 }}>~30 דקות</div>
        </div>
      )}

      {/* Total */}
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 28 }}>
        סה״כ שולם: <span style={{ color: "white", fontWeight: 900 }}>₪{total}</span>
      </div>

      {/* Buttons */}
      <button onClick={() => navigate("/orders")}
        style={{ background: "white", color: C.red, border: "none", borderRadius: 16, padding: "14px 40px", fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 12 }}>
        מעקב הזמנות
      </button>
      <button onClick={() => navigate("/")}
        style={{ background: "transparent", color: "rgba(255,255,255,0.7)", border: "none", fontSize: 14, cursor: "pointer" }}>
        חזור לדף הבית
      </button>

      <style>{`@keyframes popIn{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}*{box-sizing:border-box}`}</style>
    </div>
  );
}

// ── Main CartPage ──────────────────────────────────
export default function CartPage({ cart, add, rem, setCart, cartCount, user, guest, onLogin }) {
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo]           = useState(null);
  const [promoError, setPromoError] = useState("");
  const [address, setAddress]       = useState("");
  const [payment, setPayment]       = useState("cash");
  const [loading, setLoading]       = useState(false);
  const [ordered, setOrdered]       = useState(false);
  const [orderId, setOrderId]       = useState(null);
  const [showLoginBanner, setShowLoginBanner] = useState(false);

  const subtotal    = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_MIN ? 0 : 12;
  const discount    = promo ? Math.floor(subtotal * PROMO_CODES[promo]) : 0;
  const total       = subtotal + deliveryFee - discount;

  // Get restaurant name from cart items
  const restaurantName = cart[0]?.rname || null;

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) { setPromo(code); setPromoError(""); }
    else { setPromoError("קוד שגוי או לא תקף"); setPromo(null); }
  }

  async function placeOrder() {
    if (guest && !user?.id) { setShowLoginBanner(true); return; }
    if (!address.trim()) { alert("יש להזין כתובת למשלוח"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from("orders").insert({
        // ✅ FIX: user_id so each user sees only their orders
        user_id: user?.id || null,
        // ✅ FIX: restaurant_name for display in OrdersPage
        restaurant_name: restaurantName,
        items: cart,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        address,
        payment_method: PAYMENT_MAP[payment],
        status: "جديد",
        notes: promo ? `קוד פרומו: ${promo}` : null,
      }).select().single();

      if (!error && data) setOrderId(data.id);
      else setOrderId("DEMO-" + Math.floor(Math.random() * 9000 + 1000));
    } catch (e) {
      setOrderId("DEMO-" + Math.floor(Math.random() * 9000 + 1000));
    }
    setLoading(false);
    setCart([]);
    setOrdered(true);
  }

  // ✅ FIX: Show tracking screen instead of simple success
  if (ordered) return <TrackingScreen orderId={orderId} total={total} navigate={navigate} />;

  // Empty cart
  if (cart.length === 0) return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 80 }}>
      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "44px 20px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <IcoBack s={18} c="white" />
        </button>
        <div style={{ color: "white", fontSize: 24, fontWeight: 900, marginTop: 12 }}>העגלה שלי</div>
      </div>
      <div style={{ textAlign: "center", padding: "60px 24px", color: C.gray }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🛒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 8 }}>העגלה ריקה</div>
        <div style={{ fontSize: 14, marginBottom: 28 }}>הוסף פריטים מהתפריט</div>
        <button onClick={() => navigate("/")}
          style={{ background: C.red, color: "white", border: "none", borderRadius: 16, padding: "14px 32px", fontSize: 15, fontWeight: 900, cursor: "pointer" }}>
          גלה מסעדות
        </button>
      </div>
      <BottomNav cartCount={cartCount} />
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 80 }}>

      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "44px 20px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        {/* ✅ FIX: navigate(-1) instead of navigate("/") */}
        <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <IcoBack s={18} c="white" />
        </button>
        <div style={{ color: "white", fontSize: 24, fontWeight: 900, marginTop: 12 }}>העגלה שלי</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>{cart.length} פריטים</div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Cart items */}
        <div style={{ marginBottom: 16 }}>
          {cart.map(item => (
            <div key={`${item.id}-${item.rid}`} style={{ background: "white", borderRadius: 16, padding: "14px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{item.name}</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{item.rname}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.red, marginTop: 4 }}>₪{item.price}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => rem(item.id, item.rid)} style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid " + C.lightGray, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <IcoMinus s={12} c={C.dark} />
                </button>
                <span style={{ fontSize: 15, fontWeight: 900, color: C.dark, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                <button onClick={() => add(item, { id: item.rid, name: item.rname })} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <IcoPlus s={14} c="white" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery address */}
        <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <IcoPin s={14} c={C.red} /> כתובת למשלוח
          </div>
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="רחוב, מספר בית, עיר..."
            style={{ width: "100%", border: "1.5px solid " + C.lightGray, borderRadius: 12, padding: "11px 13px", fontSize: 14, outline: "none", direction: "rtl", fontFamily: "Arial,sans-serif", color: C.dark, background: C.ultra }} />
        </div>

        {/* Promo code */}
        <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8 }}>🎟️ קוד פרומו</div>
          {promo ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.08)", borderRadius: 12, padding: "10px 14px" }}>
              <IcoCheck s={16} c={C.green} />
              <span style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>{promo} — {PROMO_CODES[promo] * 100}% הנחה</span>
              <button onClick={() => { setPromo(null); setPromoInput(""); }} style={{ marginRight: "auto", background: "none", border: "none", cursor: "pointer" }}>
                <IcoClose s={13} c={C.gray} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={promoInput} onChange={e => { setPromoInput(e.target.value); setPromoError(""); }}
                onKeyDown={e => { if (e.key === "Enter") applyPromo(); }}
                placeholder="הזן קוד (כגון: NAAT10)"
                style={{ flex: 1, border: "1.5px solid " + (promoError ? C.red : C.lightGray), borderRadius: 12, padding: "10px 12px", fontSize: 13, outline: "none", direction: "rtl", fontFamily: "Arial,sans-serif" }} />
              <button onClick={applyPromo}
                style={{ background: C.dark, color: "white", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>אשר</button>
            </div>
          )}
          {promoError && <div style={{ color: C.red, fontSize: 11, marginTop: 5 }}>{promoError}</div>}
        </div>

        {/* Payment method */}
        <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>💳 אמצעי תשלום</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ v: "cash", l: "מזומן", e: "💵" }, { v: "card", l: "כרטיס", e: "💳" }, { v: "bit", l: "ביט", e: "📱" }].map(p => (
              <button key={p.v} onClick={() => setPayment(p.v)}
                style={{ flex: 1, padding: "10px 6px", borderRadius: 12, border: "2px solid " + (payment === p.v ? C.red : C.lightGray), background: payment === p.v ? "rgba(200,16,46,0.06)" : "white", cursor: "pointer", fontSize: 12, fontWeight: payment === p.v ? 700 : 500, color: payment === p.v ? C.red : C.gray, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: "Arial,sans-serif" }}>
                <span style={{ fontSize: 20 }}>{p.e}</span>{p.l}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>סיכום הזמנה</div>
          {[
            { l: "סכום ביניים",   v: `₪${subtotal}` },
            { l: "משלוח",         v: deliveryFee === 0 ? "חינם 🎉" : `₪${deliveryFee}` },
            ...(promo ? [{ l: `הנחה (${promo})`, v: `-₪${discount}`, c: C.green }] : []),
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 13, color: C.gray }}>{row.l}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: row.c || C.dark }}>{row.v}</span>
            </div>
          ))}
          <div style={{ borderTop: "1.5px solid " + C.lightGray, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>סה״כ</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: C.red }}>₪{total}</span>
          </div>
          {subtotal < FREE_DELIVERY_MIN && (
            <div style={{ marginTop: 8, background: "rgba(245,166,35,0.1)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: C.gold, fontWeight: 600, textAlign: "center" }}>
              הוסף עוד ₪{FREE_DELIVERY_MIN - subtotal} לקבלת משלוח חינם!
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 10 }}>
          <IcoShield s={13} c={C.gray} />
          <span style={{ fontSize: 11, color: C.gray }}>תשלום מאובטח ומוצפן</span>
        </div>
        <button onClick={placeOrder} disabled={loading}
          style={{ width: "100%", background: loading ? "rgba(200,16,46,0.5)" : C.red, color: "white", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 6px 20px rgba(200,16,46,0.35)", marginBottom: 6 }}>
          {loading ? <><LoadSpinner />מעבד הזמנה...</> : <>הזמן עכשיו — ₪{total}</>}
        </button>
      </div>

      {/* ✅ Login wall for guests trying to checkout */}
      {showLoginBanner && (
        <GuestBanner
          onLogin={() => { setShowLoginBanner(false); onLogin && onLogin(); }}
          message="כדי לסיים את ההזמנה, יש להתחבר"
        />
      )}
      <BottomNav cartCount={cartCount} />
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}

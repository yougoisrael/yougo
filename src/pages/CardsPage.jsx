import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GuestBanner from "../components/GuestBanner";
import { C, IcoBack, IcoClose, IcoCheck, IcoShield, IcoPlus } from "../components/Icons";

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#C8102E,#7B0D1E)",
  "linear-gradient(135deg,#111827,#374151)",
  "linear-gradient(135deg,#1D4ED8,#7C3AED)",
  "linear-gradient(135deg,#059669,#0D9488)",
];

function CardFront({ card, idx }) {
  return (
    <div style={{ background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length], borderRadius: 20, padding: "20px 22px", minHeight: 150, position: "relative", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
      <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)", top: -30, right: -30 }} />
      <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)", bottom: -10, left: 20 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 700 }}>{card.bank}</div>
        <div style={{ color: "white", fontSize: 22, fontWeight: 900 }}>{card.brand === "visa" ? "VISA" : card.brand === "master" ? "MC" : "💳"}</div>
      </div>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>•••• •••• •••• {card.last4}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, marginBottom: 2 }}>CARD HOLDER</div>
          <div style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{card.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, marginBottom: 2 }}>EXPIRES</div>
          <div style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{card.expiry}</div>
        </div>
      </div>
    </div>
  );
}

// ✅ طرق الدفع الجديدة - بدون Bit/PayBox
const WALLETS = [
  { id: "paypal",     label: "PayPal",      icon: "🅿️", color: "#003087", available: true  },
  { id: "googlepay",  label: "Google Pay",  icon: "G",  color: "#4285F4", available: true  },
  { id: "applepay",   label: "Apple Pay",   icon: "🍎", color: "#111",    available: false },
];

export default function CardsPage({ guest, onLogin, user }) {
  const navigate = useNavigate();
  if (guest) return <GuestBanner onLogin={onLogin} message="כדי לנהל אמצעי תשלום, יש להתחבר" />;

  // ✅ ما في بطاقات وهمية — تبدأ فاضية
  const [cards, setCards] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function setDefault(id) {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
  }

  function removeCard(id) {
    setCards(prev => prev.filter(c => c.id !== id));
  }

  function validate() {
    const e = {};
    if (newCard.number.replace(/\s/g,"").length < 16) e.number = "מספר כרטיס לא תקין";
    if (!newCard.name.trim()) e.name = "שדה חובה";
    if (!newCard.expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = "פורמט: MM/YY";
    if (newCard.cvv.length < 3) e.cvv = "CVV לא תקין";
    return e;
  }

  function saveCard() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setTimeout(() => {
      const last4 = newCard.number.replace(/\s/g,"").slice(-4);
      const num = newCard.number.replace(/\s/g,"");
      const brand = num[0] === "4" ? "visa" : "master";
      setCards(prev => [...prev, {
        id: Date.now(), brand, bank: "כרטיס אשראי", last4,
        name: newCard.name.toUpperCase(), expiry: newCard.expiry,
        isDefault: prev.length === 0
      }]);
      setShowAdd(false);
      setNewCard({ number: "", name: "", expiry: "", cvv: "" });
      setSaving(false);
    }, 900);
  }

  function formatCardNum(val) {
    return val.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  }

  function formatExpiry(val) {
    const d = val.replace(/\D/g,"").slice(0,4);
    return d.length >= 2 ? d.slice(0,2) + "/" + d.slice(2) : d;
  }

  const inp = (placeholder, value, onChange, err, opts={}) => (
    <div style={{ marginBottom: 14 }}>
      <input placeholder={placeholder} value={value} onChange={onChange} {...opts}
        style={{ width: "100%", border: "1.5px solid " + (err ? C.red : "#E5E7EB"), borderRadius: 13, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "Arial,sans-serif", background: "white" }} />
      {err && <div style={{ color: C.red, fontSize: 11, marginTop: 3 }}>{err}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 30 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "44px 20px 70px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 14 }}>
          <IcoBack s={18} c="white" />
        </button>
        <div style={{ color: "white", fontSize: 24, fontWeight: 900 }}>אמצעי תשלום</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>{cards.length} כרטיסים שמורים</div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* כרטיסים */}
        {cards.length === 0 && !showAdd && (
          <div style={{ textAlign: "center", padding: "30px 0 20px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>💳</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>אין כרטיסים שמורים</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>הוסף כרטיס אשראי לתשלום מהיר</div>
          </div>
        )}

        {cards.map((card, idx) => (
          <div key={card.id} style={{ marginBottom: 14 }}>
            <CardFront card={card} idx={idx} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px" }}>
              <button onClick={() => removeCard(card.id)}
                style={{ background: "none", border: "none", color: "#EF4444", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <IcoClose s={13} c="#EF4444" /> הסר
              </button>
              <button onClick={() => setDefault(card.id)}
                style={{ background: "none", border: "none", color: card.isDefault ? C.green : "#9CA3AF", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <IcoCheck s={13} c={card.isDefault ? C.green : "#9CA3AF"} />
                {card.isDefault ? "ברירת מחדל" : "הגדר כברירת מחדל"}
              </button>
            </div>
          </div>
        ))}

        {/* הוסף כרטיס */}
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)}
            style={{ width: "100%", background: "#111827", color: "white", border: "none", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
            <IcoPlus s={18} c="white" /> הוסף כרטיס חדש
          </button>
        ) : (
          <div style={{ background: "white", borderRadius: 18, padding: "20px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 16 }}>כרטיס חדש</div>
            {inp("מספר כרטיס", newCard.number,
              e => setNewCard(p => ({...p, number: formatCardNum(e.target.value)})),
              errors.number, { inputMode: "numeric", style: { letterSpacing: 2, direction: "ltr" } })}
            {inp("שם בעל הכרטיס", newCard.name,
              e => setNewCard(p => ({...p, name: e.target.value.toUpperCase()})),
              errors.name, { style: { textTransform: "uppercase" } })}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                {inp("MM/YY", newCard.expiry,
                  e => setNewCard(p => ({...p, expiry: formatExpiry(e.target.value)})),
                  errors.expiry, { inputMode: "numeric", maxLength: 5 })}
              </div>
              <div style={{ flex: 1 }}>
                {inp("CVV", newCard.cvv,
                  e => setNewCard(p => ({...p, cvv: e.target.value.replace(/\D/g,"").slice(0,4)})),
                  errors.cvv, { inputMode: "numeric", maxLength: 4, type: "password" })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowAdd(false); setErrors({}); }}
                style={{ flex: 1, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 13, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ביטול
              </button>
              <button onClick={saveCard} disabled={saving}
                style={{ flex: 2, background: saving ? "rgba(200,16,46,0.5)" : C.red, color: "white", border: "none", borderRadius: 13, padding: "12px", fontSize: 13, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "שומר..." : "שמור כרטיס"}
              </button>
            </div>
          </div>
        )}

        {/* ✅ ארנקים דיגיטליים - PayPal / Google Pay / Apple Pay */}
        <div style={{ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 12, marginTop: 4 }}>ארנקים דיגיטליים</div>
        {WALLETS.map(w => (
          <div key={w.id} style={{ background: "white", borderRadius: 16, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: w.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: w.id === "googlepay" ? 16 : 20, fontWeight: 900, color: w.color }}>
                {w.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{w.label}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: w.available ? C.green : "#9CA3AF" }}>
              {w.available ? "✓ זמין" : "בקרוב"}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, justifyContent: "center" }}>
          <IcoShield s={14} c={C.green} />
          <span style={{ fontSize: 11, color: C.green }}>מאובטח עם הצפנת 256-bit SSL</span>
        </div>
      </div>
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}

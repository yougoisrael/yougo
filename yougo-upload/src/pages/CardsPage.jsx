// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CardsPage.jsx — Payment cards
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GuestBanner from "../components/GuestBanner";
import { C, IcoBack, IcoClose, IcoCheck, IcoShield } from "../components/Icons";

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

export default function CardsPage({ guest, onLogin }) {
  const navigate = useNavigate();
  if (guest) return <GuestBanner onLogin={onLogin} message="כדי לנהל אמצעי תשלום, יש להתחבר" />;
  const [cards, setCards] = useState([
    { id: 1, brand: "visa", bank: "Bank Leumi", last4: "4521", name: "AHMAD NASSER", expiry: "09/27", isDefault: true },
    { id: 2, brand: "master", bank: "Mizrahi Tefahot", last4: "8834", name: "AHMAD NASSER", expiry: "03/26", isDefault: false },
  ]);
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
      setCards(prev => [...prev, { id: Date.now(), brand: "visa", bank: "כרטיס חדש", last4, name: newCard.name.toUpperCase(), expiry: newCard.expiry, isDefault: false }]);
      setShowAdd(false);
      setNewCard({ number: "", name: "", expiry: "", cvv: "" });
      setSaving(false);
    }, 1000);
  }

  function formatCardNumber(v) {
    return v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  }

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 30 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "44px 20px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        <button onClick={() => navigate("/profile")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 14 }}>
          <IcoBack s={18} c="white" />
        </button>
        <div style={{ color: "white", fontSize: 24, fontWeight: 900 }}>אמצעי תשלום</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>{cards.length} כרטיסים שמורים</div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Cards list */}
        {cards.map((card, idx) => (
          <div key={card.id} style={{ marginBottom: 16 }}>
            <CardFront card={card} idx={idx} />
            <div style={{ background: "white", borderRadius: "0 0 18px 18px", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginTop: -4 }}>
              <button onClick={() => setDefault(card.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: card.isDefault ? C.green : C.gray, fontSize: 12, fontWeight: card.isDefault ? 700 : 500 }}>
                <IcoCheck s={14} c={card.isDefault ? C.green : C.lightGray} />
                {card.isDefault ? "ברירת מחדל" : "הגדר כברירת מחדל"}
              </button>
              {!card.isDefault && (
                <button onClick={() => removeCard(card.id)}
                  style={{ marginRight: "auto", background: "#FEF2F2", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: "#EF4444", fontSize: 12, fontWeight: 700 }}>
                  <IcoClose s={11} c="#EF4444" /> הסר
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Digital wallets */}
        <div style={{ fontWeight: 800, fontSize: 15, color: C.dark, marginBottom: 10, marginTop: 4 }}>ארנקים דיגיטליים</div>
        {[{ e: "📱", l: "ביט", s: "מחובר" }, { e: "💚", l: "PayBox", s: "לא מחובר" }, { e: "🍎", l: "Apple Pay", s: "לא זמין" }].map((w, i) => (
          <div key={i} style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <span style={{ fontSize: 24 }}>{w.e}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.dark }}>{w.l}</span>
            <span style={{ fontSize: 12, color: w.s === "מחובר" ? C.green : C.gray, fontWeight: 600 }}>{w.s}</span>
          </div>
        ))}

        {/* Add card */}
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)}
            style={{ width: "100%", background: C.dark, color: "white", border: "none", borderRadius: 16, padding: "15px", fontSize: 15, fontWeight: 900, cursor: "pointer", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            ➕ הוסף כרטיס חדש
          </button>
        ) : (
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginTop: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>כרטיס חדש</div>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><IcoClose s={14} c={C.gray} /></button>
            </div>
            {[
              { k: "number", l: "מספר כרטיס", ph: "0000 0000 0000 0000", fn: v => formatCardNumber(v) },
              { k: "name", l: "שם בעל הכרטיס", ph: "FIRST LAST", fn: v => v.toUpperCase() },
              { k: "expiry", l: "תוקף", ph: "MM/YY", fn: v => v },
              { k: "cvv", l: "CVV", ph: "•••", fn: v => v.slice(0,4) },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, marginBottom: 5 }}>{f.l}</div>
                <input value={newCard[f.k]}
                  onChange={e => { setNewCard(p => ({ ...p, [f.k]: f.fn(e.target.value) })); setErrors(p => ({ ...p, [f.k]: "" })); }}
                  placeholder={f.ph}
                  style={{ width: "100%", border: "1.5px solid " + (errors[f.k] ? C.red : C.lightGray), borderRadius: 12, padding: "11px 13px", fontSize: 14, outline: "none", direction: "ltr", textAlign: "left", fontFamily: "Arial,sans-serif" }} />
                {errors[f.k] && <div style={{ color: C.red, fontSize: 11, marginTop: 3 }}>{errors[f.k]}</div>}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <IcoShield s={13} c={C.green} />
              <span style={{ fontSize: 11, color: C.green }}>מאובטח עם הצפנת 256-bit SSL</span>
            </div>
            <button onClick={saveCard} disabled={saving}
              style={{ width: "100%", background: saving ? "rgba(200,16,46,0.5)" : C.red, color: "white", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 900, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "שומר..." : "שמור כרטיס"}
            </button>
          </div>
        )}
      </div>

      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}

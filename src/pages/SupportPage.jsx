// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SupportPage.jsx — FAQ + Contact
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, IcoBack, IcoChevDown, IcoCheck } from "../components/Icons";

const FAQS = [
  { q: "מתי ההזמנה שלי תגיע?", a: "זמן המשלוח הממוצע הוא 25-40 דקות. ניתן לעקוב אחר ההזמנה בזמן אמת דרך עמוד ׳ההזמנות שלי׳." },
  { q: "איך מבטלים הזמנה?", a: "ניתן לבטל הזמנה עד 2 דקות לאחר ביצועה. לאחר מכן, אנא פנה לתמיכה ישירות." },
  { q: "האם אפשר לשנות כתובת משלוח?", a: "ניתן לשנות כתובת לפני שהמשלוח יצא. פנה לתמיכה בהקדם האפשרי." },
  { q: "מה קורה אם אני לא מרוצה?", a: "אנחנו כאן לעזור! פנה אלינו ונטפל בכל תלונה תוך 24 שעות." },
  { q: "האם ניתן לשלם במזומן?", a: "כן! ניתן לשלם במזומן, כרטיס אשראי, ביט ו-PayBox." },
  { q: "מה המינימום להזמנה?", a: "המינימום משתנה לפי מסעדה ומופיע בדף המסעדה. לרוב בין ₪40-80." },
];

export default function SupportPage({ user }) {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function sendMessage() {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1200);
  }

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 30 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "44px 20px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        <button onClick={() => navigate("/profile")}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 14 }}>
          <IcoBack s={18} c="white" />
        </button>
        <div style={{ color: "white", fontSize: 24, fontWeight: 900 }}>תמיכה ועזרה</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>אנחנו כאן בשבילך 24/7</div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Quick contact */}
        <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, marginBottom: 10 }}>צור קשר מהיר</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { e: "📞", l: "שיחה", sub: "זמינים 08:00-22:00", action: () => window.open("tel:+972-800-YOUGO") },
            { e: "💬", l: "WhatsApp", sub: "מענה תוך דקות", action: () => window.open("https://wa.me/97200000000") },
            { e: "✉️", l: "אימייל", sub: "מענה תוך 24ש׳", action: () => {} },
          ].map((c, i) => (
            <button key={i} onClick={c.action}
              style={{ flex: 1, background: "white", border: "none", borderRadius: 16, padding: "14px 8px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "Arial,sans-serif" }}>
              <span style={{ fontSize: 26 }}>{c.e}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{c.l}</span>
              <span style={{ fontSize: 10, color: C.gray }}>{c.sub}</span>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, marginBottom: 10 }}>❓ שאלות נפוצות</div>
        <div style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", marginBottom: 20 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid " + C.ultra : "none" }}>
              <div onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ padding: "15px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.dark, flex: 1, paddingLeft: 10 }}>{faq.q}</span>
                <div style={{ transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                  <IcoChevDown s={16} c={C.gray} />
                </div>
              </div>
              {openFaq === i && (
                <div style={{ padding: "0 16px 14px", fontSize: 13, color: C.gray, lineHeight: 1.6, background: C.ultra }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div style={{ background: "white", borderRadius: 18, padding: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 12 }}>📝 פנייה כתובה</div>
          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <IcoCheck s={28} c={C.green} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>הפנייה נשלחה!</div>
              <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>נחזור אליך תוך 24 שעות</div>
              <button onClick={() => { setSent(false); setSubject(""); setMessage(""); }}
                style={{ marginTop: 14, background: C.ultra, border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.dark }}>
                שלח פנייה נוספת
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, marginBottom: 5 }}>נושא</div>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid " + C.lightGray, borderRadius: 12, padding: "11px 13px", fontSize: 14, outline: "none", direction: "rtl", fontFamily: "Arial,sans-serif", color: subject ? C.dark : C.gray, background: "white" }}>
                  <option value="">בחר נושא...</option>
                  <option value="order">בעיה עם הזמנה</option>
                  <option value="payment">בעיה בתשלום</option>
                  <option value="delivery">בעיה במשלוח</option>
                  <option value="other">אחר</option>
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, marginBottom: 5 }}>הודעה</div>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="תאר את הבעיה בפירוט..."
                  rows={4}
                  style={{ width: "100%", border: "1.5px solid " + C.lightGray, borderRadius: 12, padding: "11px 13px", fontSize: 14, outline: "none", direction: "rtl", fontFamily: "Arial,sans-serif", resize: "none", color: C.dark }} />
              </div>
              <button onClick={sendMessage} disabled={sending || !subject || !message}
                style={{ width: "100%", background: !subject || !message ? C.lightGray : C.red, color: "white", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: !subject || !message ? "not-allowed" : "pointer" }}>
                {sending ? "שולח..." : "שלח פנייה"}
              </button>
            </>
          )}
        </div>

      </div>

      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}
